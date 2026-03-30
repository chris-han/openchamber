import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronRight,
  Settings,
  History,
  Sparkles,
  RefreshCw,
  Link2,
  Zap,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TreeNode } from './resource-explorer'

interface ReconciliationAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  domain: string
  message: string
  delta?: string
}

const mockAlerts: ReconciliationAlert[] = [
  {
    id: '1',
    type: 'warning',
    domain: '管理会计',
    message: '此修改将导致管理会计分摊额与财务总账数额产生不勾稽',
    delta: '¥12,000',
  },
  {
    id: '2',
    type: 'info',
    domain: '税务',
    message: '税务义务已根据新规则 tax:DeductionRule_v2 自动更新',
  },
  {
    id: '3',
    type: 'error',
    domain: '财务',
    message: '收入确认时间点违反 ASC 606 准则要求',
  },
]

interface VersionHistory {
  version: string
  date: string
  author: string
  changes: string
}

const versionHistory: VersionHistory[] = [
  { version: 'v2.1.0', date: '2024-03-15', author: '系统', changes: '添加 signDate 可选属性' },
  { version: 'v2.0.0', date: '2024-02-01', author: '张明', changes: '重构 amount 字段精度' },
  { version: 'v1.5.0', date: '2024-01-10', author: '李华', changes: '新增 status 枚举值' },
  { version: 'v1.0.0', date: '2023-12-01', author: '系统', changes: '初始版本' },
]

interface PropertyFieldProps {
  label: string
  value: string
  type: string
  required: boolean
}

function PropertyField({ label, value, type, required }: PropertyFieldProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown  className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{label}</span>
        {required && <span className="text-destructive text-xs">*</span>}
        <Badge variant="outline" className="ml-auto text-xs font-mono">{type}</Badge>
      </button>
      {expanded && (
        <div className="p-3 space-y-3 bg-card/50">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">当前值</Label>
            <Input value={value} className="h-8 text-sm bg-input" readOnly />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">必填字段</Label>
            <Switch checked={required} disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">数据类型</Label>
            <Select defaultValue={type}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">string</SelectItem>
                <SelectItem value="decimal">decimal</SelectItem>
                <SelectItem value="date">date</SelectItem>
                <SelectItem value="enum">enum</SelectItem>
                <SelectItem value="boolean">boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}

interface PropertiesPanelProps {
  selectedItem: TreeNode | null
  selectedGraphItem?: { type: 'node' | 'edge'; data: any } | null
}

export function PropertiesPanel({ selectedItem, selectedGraphItem }: PropertiesPanelProps) {
  const [aiLoading, setAiLoading] = useState(false)

  const edgeId = selectedGraphItem?.type === 'edge' ? selectedGraphItem?.data?.id : null
  const edgeAnimDefault = selectedGraphItem?.type === 'edge' ? !!(selectedGraphItem?.data?.animated) : false
  const [animEnabled, setAnimEnabled] = useState(edgeAnimDefault)
  useEffect(() => { setAnimEnabled(edgeAnimDefault) }, [edgeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAiAlign = () => {
    setAiLoading(true)
    setTimeout(() => setAiLoading(false), 2000)
  }

  const isGraphNode = selectedGraphItem?.type === 'node' && selectedGraphItem?.data
  const isGraphEdge = selectedGraphItem?.type === 'edge' && selectedGraphItem?.data
  const graphData = selectedGraphItem?.data?.data || selectedGraphItem?.data

  const edgeRelName  = graphData?.relType || selectedGraphItem?.data?.label || '—'
  const edgeCategory = graphData?.category as 'structural' | 'interoperation' | undefined
  const edgeIsStruct = edgeCategory === 'structural'
  const edgeSrc = selectedGraphItem?.data?.source || ''
  const edgeTgt = selectedGraphItem?.data?.target || ''

  return (
    <div className="h-full flex flex-col bg-sidebar border-l border-sidebar-border">
      <Tabs defaultValue="properties" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-sidebar-border bg-transparent p-0 h-auto">
          <TabsTrigger
            value="properties"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            属性
          </TabsTrigger>
          <TabsTrigger
            value="reconciliation"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs flex items-center gap-1"
          >
            <Link2 className="h-3.5 w-3.5 mr-1" />
            勾稽
            <Badge variant="destructive" className="h-4 px-1 text-[10px]">3</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="versions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
          >
            <History className="h-3.5 w-3.5 mr-1.5" />
            版本
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="flex-1 overflow-auto m-0 p-3">
          {isGraphNode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">节点名称</Label>
                <Input value={graphData.label || ''} className="h-8 text-sm bg-input" readOnly />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">节点类型</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{graphData.type}</Badge>
                </div>
              </div>
              {graphData.description && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">描述</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/30 p-2 rounded">
                    {graphData.description}
                  </p>
                </div>
              )}
              {graphData.properties && graphData.properties.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">字段属性</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">编辑全部</Button>
                  </div>
                  <div className="space-y-2">
                    {graphData.properties.map((p: any) => (
                      <PropertyField
                        key={p.name}
                        label={p.name}
                        value={p.type === 'string' ? 'text' : p.type === 'enum' ? 'option' : p.type === 'decimal' ? '0.00' : ''}
                        type={p.type}
                        required={p.required}
                      />
                    ))}
                  </div>
                </div>
              )}
              {graphData.actions && graphData.actions.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">可用动作</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {graphData.actions.map((a: string) => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isGraphEdge ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className={cn('p-1.5 rounded', edgeIsStruct ? 'bg-teal-500/15' : 'bg-red-500/15')}>
                  {edgeIsStruct
                    ? <Minus className="h-4 w-4 text-teal-400" />
                    : <Zap   className="h-4 w-4 text-red-400"  />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground font-mono">{edgeRelName}</p>
                  <p className="text-[10px] text-muted-foreground">关系</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">关系类型</Label>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    edgeIsStruct
                      ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                      : 'bg-red-500/15  text-red-400  border-red-500/30',
                  )}
                >
                  {edgeIsStruct ? '静态结构' : '动态交互'}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">源节点</Label>
                <Input value={edgeSrc} className="h-8 text-sm bg-input font-mono" readOnly />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">目标节点</Label>
                <Input value={edgeTgt} className="h-8 text-sm bg-input font-mono" readOnly />
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">动画效果</p>
                    <p className="text-xs text-muted-foreground">
                      {animEnabled ? '流动动画已启用' : '动画已停用'}
                    </p>
                  </div>
                  <Switch checked={animEnabled} onCheckedChange={setAnimEnabled} />
                </div>
                {!edgeIsStruct && animEnabled && (
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    动态交互关系默认启用流动动画，直观展示跨域事件传播
                  </p>
                )}
                {edgeIsStruct && !animEnabled && (
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    静态结构关系默认不启用动画，表示稳定的本体依赖
                  </p>
                )}
              </div>
            </div>
          ) : selectedItem ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">资源名称</Label>
                <Input value={selectedItem.name} className="h-8 text-sm bg-input" readOnly />
              </div>
              {selectedItem.prefix && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">命名空间</Label>
                  <Input value={selectedItem.prefix} className="h-8 text-sm bg-input font-mono" readOnly />
                </div>
              )}
              {selectedItem.version && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">当前版本</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedItem.version}</Badge>
                    <span className="text-xs text-muted-foreground">最新</span>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">字段属性</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">编辑全部</Button>
                </div>
                <div className="space-y-2">
                  <PropertyField label="contractId" value="uuid"   type="string"  required={true}  />
                  <PropertyField label="amount"     value="0.00"   type="decimal" required={true}  />
                  <PropertyField label="status"     value="draft"  type="enum"    required={true}  />
                  <PropertyField label="signDate"   value=""       type="date"    required={false} />
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">关联维度</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">core:Actor</Badge>
                  <Badge variant="outline" className="text-xs">mgt:Project</Badge>
                  <Badge variant="outline" className="text-xs">mgt:CostCenter</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Settings className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">选择一个资源查看属性</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reconciliation" className="flex-1 overflow-auto m-0">
          <div className="p-3 border-b border-border bg-card/50">
            <h3 className="text-sm font-medium mb-1">实时勾稽检查</h3>
            <p className="text-xs text-muted-foreground">监测跨域数据一致性，确保业财税三位一体</p>
          </div>
          <div className="p-3 space-y-3">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'rounded-lg border p-3',
                  alert.type === 'warning' && 'border-warning/50 bg-warning/5',
                  alert.type === 'error'   && 'border-destructive/50 bg-destructive/5',
                  alert.type === 'info'    && 'border-info/50 bg-info/5',
                )}
              >
                <div className="flex items-start gap-2">
                  {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning     shrink-0 mt-0.5" />}
                  {alert.type === 'error'   && <AlertTriangle className="h-4 w-4 text-destructive  shrink-0 mt-0.5" />}
                  {alert.type === 'info'    && <Info           className="h-4 w-4 text-info         shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5',
                          alert.type === 'warning' && 'border-warning     text-warning',
                          alert.type === 'error'   && 'border-destructive text-destructive',
                          alert.type === 'info'    && 'border-info        text-info',
                        )}
                      >
                        {alert.domain}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
                    {alert.delta && (
                      <p className="text-sm font-semibold text-warning mt-2">差额: {alert.delta}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              重新检查全部
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="flex-1 overflow-auto m-0 p-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">版本历史</span>
              <Badge variant="secondary" className="text-xs">语义版本控制</Badge>
            </div>
            <div className="space-y-2">
              {versionHistory.map((v, idx) => (
                <div
                  key={v.version}
                  className={cn(
                    'rounded-lg border p-3',
                    idx === 0 ? 'border-primary/50 bg-primary/5' : 'border-border',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={idx === 0 ? 'default' : 'outline'} className="text-xs">
                      {v.version}
                    </Badge>
                    {idx === 0 && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                    <span className="text-xs text-muted-foreground ml-auto">{v.date}</span>
                  </div>
                  <p className="text-xs text-foreground">{v.changes}</p>
                  <p className="text-xs text-muted-foreground mt-1">by {v.author}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-xs"
          onClick={handleAiAlign}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              AI 对齐中...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI 自动对齐
            </>
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          导入非标准数据，AI 自动对齐到 Semantier 维度
        </p>
      </div>
    </div>
  )
}
