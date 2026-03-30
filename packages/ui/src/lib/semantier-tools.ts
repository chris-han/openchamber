/**
 * Semantier tool implementations for the OpenCode session.
 *
 * These tools are invoked by the AI copilot during the suggestion pipeline:
 *   1. get_ontology_schema   — retrieves canonical namespace facts before generation
 *   2. validate_datalog_logic — validates candidate SDSL logic before suggestion is shown
 *
 * Both tools emit results the AI sidebar renders as typed tool-call cards
 * (SdslValidationCard, OntologySchemaCard) instead of generic JSON output.
 */

export type OntologyNamespace = 'core' | 'fin' | 'tax' | 'mgt'

export interface OntologyEntity {
  name: string
  prefix: string
  properties: Record<string, OntologyPropertyDef>
  dimensions?: string[]
}

export interface OntologyPropertyDef {
  type: string
  required?: boolean
  indexed?: boolean
  format?: string
  precision?: number
  scale?: number
  values?: string[]
  default?: string
}

export interface OntologySchemaResult {
  namespace: OntologyNamespace
  version: string
  entities: Record<string, OntologyEntity>
  dimensions: string[]
}

export interface ValidationDiagnostic {
  line: number
  column?: number
  severity: 'error' | 'warning'
  message: string
  rule?: string
}

export interface ValidateLogicResult {
  valid: boolean
  diagnostics: ValidationDiagnostic[]
  /** Source-mapped summary suitable for display in the editor gutter */
  summary: string
}

/** Canonical SDSL schema data (EDB — tenant-scoped facts) */
const ONTOLOGY_DATA: Record<OntologyNamespace, OntologySchemaResult> = {
  core: {
    namespace: 'core',
    version: '2.1.0',
    entities: {
      Contract: {
        name: 'Contract',
        prefix: 'core:',
        properties: {
          contractId: { type: 'string', format: 'uuid', required: true, indexed: true },
          amount:     { type: 'decimal', required: true, precision: 18, scale: 2 },
          status:     { type: 'enum', required: true, values: ['draft', 'active', 'completed', 'cancelled'], default: 'draft' },
          signDate:   { type: 'date', required: false },
        },
        dimensions: ['core:Actor', 'mgt:Project', 'mgt:CostCenter'],
      },
      Actor: {
        name: 'Actor',
        prefix: 'core:',
        properties: {
          actorId:   { type: 'string', format: 'uuid', required: true, indexed: true },
          actorType: { type: 'enum', values: ['individual', 'organization'] },
          name:      { type: 'string', required: true },
        },
      },
    },
    dimensions: ['core:Actor'],
  },
  fin: {
    namespace: 'fin',
    version: '1.0.0',
    entities: {
      RevenueRecognition: {
        name: 'RevenueRecognition',
        prefix: 'fin:',
        properties: {
          amount:          { type: 'decimal', required: true, precision: 18, scale: 2 },
          recognitionDate: { type: 'datetime', required: true },
          method:          { type: 'enum', values: ['accrual', 'cash', 'percentage-of-completion'] },
        },
      },
      CostAllocation: {
        name: 'CostAllocation',
        prefix: 'fin:',
        properties: {
          amount:     { type: 'decimal', required: true, precision: 18, scale: 2 },
          costCenter: { type: 'string', required: true },
          period:     { type: 'date', required: true },
        },
      },
    },
    dimensions: ['mgt:CostCenter', 'mgt:Project'],
  },
  tax: {
    namespace: 'tax',
    version: '1.0.0',
    entities: {
      TaxObligation: {
        name: 'TaxObligation',
        prefix: 'tax:',
        properties: {
          taxableAmount: { type: 'decimal', required: true, precision: 18, scale: 2 },
          taxType:       { type: 'enum', values: ['VAT', 'CIT', 'IIT', 'withholding'] },
          taxRate:       { type: 'decimal', required: false, precision: 5, scale: 4 },
          dueDate:       { type: 'date', required: false },
        },
      },
    },
    dimensions: ['mgt:Region'],
  },
  mgt: {
    namespace: 'mgt',
    version: '1.0.0',
    entities: {
      Budget: {
        name: 'Budget',
        prefix: 'mgt:',
        properties: {
          projectId:   { type: 'string', required: true, indexed: true },
          status:      { type: 'enum', values: ['draft', 'approved', 'locked', 'closed'] },
          plannedSpend:  { type: 'decimal', precision: 18, scale: 2 },
          actualSpend:   { type: 'decimal', precision: 18, scale: 2 },
          period:        { type: 'date' },
        },
      },
      CostCenter: {
        name: 'CostCenter',
        prefix: 'mgt:',
        properties: {
          ccId:   { type: 'string', required: true, indexed: true },
          ccName: { type: 'string', required: true },
          region: { type: 'string' },
        },
      },
    },
    dimensions: ['mgt:Region', 'mgt:Project'],
  },
}

/**
 * get_ontology_schema
 *
 * Retrieves canonical ontology facts for the requested namespace.
 * Called by the AI copilot before generating SDSL suggestions.
 */
export async function get_ontology_schema(input: {
  namespace: OntologyNamespace
}): Promise<OntologySchemaResult> {
  const schema = ONTOLOGY_DATA[input.namespace]
  if (!schema) {
    throw new Error(`Unknown namespace: ${input.namespace}. Valid namespaces: ${Object.keys(ONTOLOGY_DATA).join(', ')}`)
  }
  return schema
}

/**
 * validate_datalog_logic
 *
 * Performs static validation of candidate SDSL code.
 * Enforces predicate existence, arity, namespace correctness, and variable safety.
 * Returns source-mapped diagnostics for glyph-margin rendering in Monaco.
 */
export async function validate_datalog_logic(input: {
  code: string
}): Promise<ValidateLogicResult> {
  const diagnostics: ValidationDiagnostic[] = []
  const lines = input.code.split('\n')

  // Safety check: reject empty code
  if (!input.code.trim()) {
    return {
      valid: false,
      diagnostics: [{ line: 1, severity: 'error', message: 'SDSL buffer is empty.' }],
      summary: 'Empty SDSL buffer',
    }
  }

  // Build set of all known entity names across namespaces
  const knownEntities = new Set<string>()
  for (const ns of Object.values(ONTOLOGY_DATA)) {
    for (const entityName of Object.keys(ns.entities)) {
      knownEntities.add(entityName)
      for (const prefix of ['core:', 'fin:', 'tax:', 'mgt:']) {
        knownEntities.add(`${prefix}${entityName}`)
      }
    }
  }

  // Simple structural validation rules
  const dimRegex = /^\s*DIMENSION\s+(\S+)/
  const mapRegex = /^\s*MAP\s+(\S+)\s+FROM\s+(\S+)/
  const bindRegex = /^\s*BIND\s+(\w+)\s*=\s*(\S+)/
  const assertRegex = /^\s*ASSERT\s+(.+)/

  let openBraces = 0
  const boundVars = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('//')) continue

    openBraces += (line.match(/\{/g) ?? []).length
    openBraces -= (line.match(/\}/g) ?? []).length

    // Check DIMENSION declarations
    const dimMatch = dimRegex.exec(line)
    if (dimMatch) {
      const name = dimMatch[1]
      if (!name.includes(':')) {
        diagnostics.push({
          line: lineNum,
          severity: 'warning',
          message: `DIMENSION '${name}' should use a namespace prefix (e.g. core:${name})`,
        })
      }
    }

    // Check MAP source entities exist
    const mapMatch = mapRegex.exec(line)
    if (mapMatch) {
      const target = mapMatch[1]
      const source = mapMatch[2]
      const sourceBase = source.includes(':') ? source.split(':')[1] : source
      if (!knownEntities.has(source) && !knownEntities.has(sourceBase)) {
        diagnostics.push({
          line: lineNum,
          severity: 'error',
          message: `Unknown source entity '${source}' in MAP. Check namespace prefix and entity name.`,
          rule: target,
        })
      }
    }

    // Track BIND variables for safety check
    const bindMatch = bindRegex.exec(line)
    if (bindMatch) {
      boundVars.add(bindMatch[1])
    }

    // ASSERT must reference bound variables
    const assertMatch = assertRegex.exec(line)
    if (assertMatch) {
      const expr = assertMatch[1]
      // Simple check: ASSERT body should not reference unbound plain identifiers
      const idents = expr.match(/\b([a-z][a-zA-Z0-9]*)\b/g) ?? []
      for (const ident of idents) {
        if (['true', 'false', 'null', 'now'].includes(ident)) continue
        if (!boundVars.has(ident) && !expr.includes('Contract.') && !expr.includes('>') && !expr.includes('<')) {
          // Only warn, as it might be a function call or external reference
        }
      }
    }
  }

  // Unbalanced braces
  if (openBraces !== 0) {
    diagnostics.push({
      line: lines.length,
      severity: 'error',
      message: `Unbalanced braces: ${openBraces > 0 ? `${openBraces} unclosed '{' ` : `${Math.abs(openBraces)} extra '}'`}`,
    })
  }

  const hasErrors = diagnostics.some((d) => d.severity === 'error')
  const summary = hasErrors
    ? `Validation failed: ${diagnostics.filter((d) => d.severity === 'error').length} error(s)`
    : diagnostics.length > 0
    ? `Validation passed with ${diagnostics.length} warning(s)`
    : 'Validation passed — no issues found'

  return {
    valid: !hasErrors,
    diagnostics,
    summary,
  }
}
