import { CheckCircle2, AlertCircle, AlertTriangle, Database } from 'lucide-react'
import type { OntologySchemaResult } from '@/lib/semantier-tools'

interface Props {
  result: OntologySchemaResult
}

export function OntologySchemaCard({ result }: Props) {
  const entityCount = Object.keys(result.entities).length

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border">
        <Database className="h-3.5 w-3.5 text-blue-400 shrink-0" />
        <span className="font-medium text-foreground">Ontology Schema</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{result.namespace}</span>
        <span className="text-xs text-muted-foreground">v{result.version}</span>
      </div>

      {/* Entity list */}
      <div className="divide-y divide-border/50">
        {Object.entries(result.entities).map(([name, entity]) => (
          <div key={name} className="px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-muted-foreground text-xs">{entity.prefix}</span>
              <span className="font-medium text-foreground">{name}</span>
              {entity.dimensions && entity.dimensions.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {entity.dimensions.length} dim
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(entity.properties).map(([propName, prop]) => (
                <span
                  key={propName}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 text-xs font-mono"
                >
                  <span className="text-foreground">{propName}</span>
                  <span className="text-muted-foreground">{prop.type}</span>
                  {prop.required && <span className="text-orange-400">*</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-muted/20 border-t border-border text-xs text-muted-foreground">
        {entityCount} {entityCount === 1 ? 'entity' : 'entities'} · {result.dimensions.length} registered dimensions
      </div>
    </div>
  )
}
