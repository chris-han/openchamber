import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Layers,
  GitBranch,
  Box,
  CircleDot,
  Workflow,
  Plus,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'ontology' | 'dimension' | 'rule'
  children?: TreeNode[]
  prefix?: string
  version?: string
}

const ontologyData: TreeNode[] = [
  {
    id: 'core',
    name: 'Core Business',
    type: 'folder',
    children: [
      { id: 'invoice',   name: 'Invoice',   type: 'ontology', prefix: 'core:', version: 'v2.1' },
      { id: 'contract',  name: 'Contract',  type: 'ontology', prefix: 'core:', version: 'v1.5' },
      { id: 'milestone', name: 'Milestone', type: 'ontology', prefix: 'core:', version: 'v1.0' },
      { id: 'payment',   name: 'Payment',   type: 'ontology', prefix: 'core:', version: 'v2.0' },
    ],
  },
  {
    id: 'finance',
    name: 'Financial Domain',
    type: 'folder',
    children: [
      { id: 'revenue', name: 'RevenueRecognition', type: 'ontology', prefix: 'fin:', version: 'v1.2' },
      { id: 'ledger',  name: 'GeneralLedger',      type: 'ontology', prefix: 'fin:', version: 'v3.0' },
      { id: 'journal', name: 'JournalEntry',        type: 'ontology', prefix: 'fin:', version: 'v2.1' },
    ],
  },
  {
    id: 'tax',
    name: 'Tax Domain',
    type: 'folder',
    children: [
      { id: 'deduction',   name: 'DeductionRule',  type: 'ontology', prefix: 'tax:', version: 'v2.0' },
      { id: 'obligation',  name: 'TaxObligation',  type: 'ontology', prefix: 'tax:', version: 'v1.8' },
    ],
  },
]

const dimensionData: TreeNode[] = [
  {
    id: 'standard',
    name: 'Standard Dimensions',
    type: 'folder',
    children: [
      { id: 'actor',      name: 'Actor',      type: 'dimension', prefix: 'core:' },
      { id: 'project',    name: 'Project',    type: 'dimension', prefix: 'mgt:'  },
      { id: 'costcenter', name: 'CostCenter', type: 'dimension', prefix: 'mgt:'  },
      { id: 'timeperiod', name: 'TimePeriod', type: 'dimension', prefix: 'core:' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Dimensions',
    type: 'folder',
    children: [
      { id: 'region',  name: 'Region',      type: 'dimension', prefix: 'ext:' },
      { id: 'product', name: 'ProductLine', type: 'dimension', prefix: 'ext:' },
    ],
  },
]

const reasonData: TreeNode[] = [
  {
    id: 'reconciliation',
    name: 'Reconciliation Rules',
    type: 'folder',
    children: [
      { id: 'rule1', name: 'ContractToRevenue', type: 'rule' },
      { id: 'rule2', name: 'InvoiceToLedger',   type: 'rule' },
      { id: 'rule3', name: 'PaymentToTax',       type: 'rule' },
    ],
  },
  {
    id: 'automation',
    name: 'Automation Rules',
    type: 'folder',
    children: [
      { id: 'rule4', name: 'AutoJournalEntry', type: 'rule' },
      { id: 'rule5', name: 'TaxTrigger',       type: 'rule' },
    ],
  },
]

interface TreeItemProps {
  node: TreeNode
  level: number
  selectedId: string | null
  onSelect: (id: string, node: TreeNode) => void
}

function TreeItem({ node, level, selectedId, onSelect }: TreeItemProps) {
  const [expanded, setExpanded] = useState(level === 0)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedId === node.id

  const getIcon = () => {
    switch (node.type) {
      case 'ontology':  return <Box      className="h-4 w-4 text-primary" />
      case 'dimension': return <CircleDot className="h-4 w-4 text-info"   />
      case 'rule':      return <Workflow  className="h-4 w-4 text-warning" />
      default:          return null
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-2 cursor-pointer rounded-sm text-sm',
          'hover:bg-secondary/50 transition-colors',
          isSelected && 'bg-secondary text-foreground',
          !hasChildren && 'cursor-grab active:cursor-grabbing',
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        draggable={!hasChildren}
        onDragStart={(e) => {
          if (hasChildren) { e.preventDefault(); return }
          e.dataTransfer.setData('application/openchamber-resource', JSON.stringify(node))
          e.dataTransfer.effectAllowed = 'copy'
        }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          onSelect(node.id, node)
        }}
      >
        {hasChildren ? (
          expanded
            ? <ChevronDown  className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-3.5" />
        )}
        {getIcon()}
        <span className={cn('truncate', hasChildren ? 'font-medium text-muted-foreground' : 'text-foreground')}>
          {node.name}
        </span>
        {node.version && (
          <span className="ml-auto text-xs text-muted-foreground font-mono">{node.version}</span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeItem key={child.id} node={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ResourceExplorerProps {
  onSelectItem: (id: string, node: TreeNode) => void
  selectedId: string | null
}

export function ResourceExplorer({ onSelectItem, selectedId }: ResourceExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">资源浏览器</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索资源..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm bg-sidebar-accent border-sidebar-border"
          />
        </div>
      </div>

      <Tabs defaultValue="ontology" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-sidebar-border bg-transparent p-0 h-auto">
          <TabsTrigger
            value="ontology"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
          >
            <FileCode className="h-3.5 w-3.5 mr-1.5" />
            本体
          </TabsTrigger>
          <TabsTrigger
            value="dimensions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
          >
            <GitBranch className="h-3.5 w-3.5 mr-1.5" />
            维度
          </TabsTrigger>
          <TabsTrigger
            value="reasons"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
          >
            <Workflow className="h-3.5 w-3.5 mr-1.5" />
            规则
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ontology" className="flex-1 overflow-auto m-0 p-2">
          {ontologyData.map((node) => (
            <TreeItem key={node.id} node={node} level={0} selectedId={selectedId} onSelect={onSelectItem} />
          ))}
        </TabsContent>

        <TabsContent value="dimensions" className="flex-1 overflow-auto m-0 p-2">
          {dimensionData.map((node) => (
            <TreeItem key={node.id} node={node} level={0} selectedId={selectedId} onSelect={onSelectItem} />
          ))}
        </TabsContent>

        <TabsContent value="reasons" className="flex-1 overflow-auto m-0 p-2">
          {reasonData.map((node) => (
            <TreeItem key={node.id} node={node} level={0} selectedId={selectedId} onSelect={onSelectItem} />
          ))}
        </TabsContent>
      </Tabs>

      <div className="p-2 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          新建资源
        </Button>
      </div>
    </div>
  )
}

export type { TreeNode }
