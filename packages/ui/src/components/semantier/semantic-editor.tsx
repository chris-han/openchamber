import { cn } from '@/lib/utils'
import { Lock, Unlock } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { TreeNode } from './resource-explorer'
import { OntologyGraph } from './ontology-graph'

/* ── Logic Weave source (display-only) ── */
const logicWeaveCode = `// 合同完成事件处理逻辑
WHEN Contract.status CHANGES TO "completed":

  // 财务域 - 触发收入确认
  TRIGGER fin:RevenueRecognition {
    amount: Contract.amount,
    recognitionDate: NOW(),
    method: DERIVE_FROM(Contract.type)
  }

  // 税务域 - 检查纳税义务
  EVALUATE tax:TaxObligation {
    taxableAmount: Contract.amount,
    taxType: DERIVE_FROM(Contract.region),
    CHECK: ComplianceRules.validate()
  }

  // 管理域 - 锁定预算
  UPDATE mgt:Budget {
    projectId: Contract.projectId,
    status: "locked",
    actualSpend: Contract.amount
  }

  // 勾稽检查
  RECONCILE {
    fin:RevenueRecognition.amount
      == mgt:Budget.actualSpend
      == tax:TaxObligation.taxableAmount
  }`

/* ── JSON-Schema / Datalog source (display-only) ── */
const jsonSchemaCode = `{
  "$schema": "https://semantier.io/ontology/v2",
  "namespace": "core",
  "version": "2.1.0",
  "entities": {
    "Contract": {
      "type": "entity",
      "prefix": "core:",
      "properties": {
        "contractId": { "type": "string", "format": "uuid", "required": true, "indexed": true },
        "amount":     { "type": "decimal", "precision": 18, "scale": 2, "required": true },
        "status":     { "type": "enum", "values": ["draft","active","completed","cancelled"], "required": true, "default": "draft" },
        "signDate":   { "type": "date", "required": false }
      },
      "dimensions": ["core:Actor", "mgt:Project", "mgt:CostCenter"],
      "events": {
        "onComplete": {
          "triggers": ["fin:RevenueRecognition", "tax:TaxObligation"]
        }
      }
    }
  }
}`

interface SemanticEditorProps {
  selectedItem: TreeNode | null
  onGraphSelectItem?: (type: 'node' | 'edge', data: any) => void
}

export function SemanticEditor({ selectedItem, onGraphSelectItem }: SemanticEditorProps) {
  return (
    <div className="h-full flex flex-col bg-editor-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedItem ? (
              <>
                <span className="text-muted-foreground">{selectedItem.prefix ?? ''}</span>
                {selectedItem.name}
              </>
            ) : (
              '本体图形编辑器'
            )}
          </span>
          {selectedItem?.version && (
            <Badge variant="secondary" className="text-xs">{selectedItem.version}</Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schema" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-card px-4 h-auto py-0 shrink-0">
          <TabsTrigger
            value="schema"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
          >
            图形建模
          </TabsTrigger>
          <TabsTrigger
            value="logic"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
          >
            逻辑织入
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
          >
            代码视图
          </TabsTrigger>
        </TabsList>

        {/* ── 图形建模 — ReactFlow ontology graph ── */}
        <TabsContent value="schema" className="flex-1 m-0 overflow-hidden relative">
          <OntologyGraph onSelectItem={onGraphSelectItem} />
        </TabsContent>

        {/* ── 逻辑织入 ── */}
        <TabsContent value="logic" className="flex-1 m-0 p-4 overflow-auto">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Logic Weaving — 定义跨域事件触发规则</span>
            </div>
            <pre className="bg-card rounded-lg p-4 text-sm font-mono overflow-x-auto border border-border">
              <code className="text-foreground">
                {logicWeaveCode.split('\n').map((line, i) => (
                  <div key={i} className="flex">
                    <span className="w-8 text-muted-foreground select-none text-right pr-4">{i + 1}</span>
                    <span className={cn(
                      ['WHEN', 'TRIGGER', 'EVALUATE', 'UPDATE', 'RECONCILE'].some((k) => line.includes(k))
                        ? 'text-primary'
                        : line.includes('//')
                        ? 'text-muted-foreground'
                        : 'text-foreground',
                    )}>
                      {line}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </TabsContent>

        {/* ── 代码视图 ── */}
        <TabsContent value="code" className="flex-1 m-0 p-4 overflow-auto">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <Unlock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">JSON-Schema / Datalog — 底层本体定义</span>
            </div>
            <pre className="bg-card rounded-lg p-4 text-sm font-mono overflow-x-auto border border-border">
              <code className="text-foreground">
                {jsonSchemaCode.split('\n').map((line, i) => (
                  <div key={i} className="flex">
                    <span className="w-8 text-muted-foreground select-none text-right pr-4">{i + 1}</span>
                    <span className={cn(
                      line.includes('"$schema"') || line.includes('"namespace"') || line.includes('"version"')
                        ? 'text-primary'
                        : line.includes(':') && line.includes('"')
                        ? 'text-info'
                        : 'text-foreground',
                    )}>
                      {line}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
