import { useState, useCallback } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { GripVerticalIcon } from 'lucide-react'
import { Header } from '@/components/semantier/header'
import { ResourceExplorer, type TreeNode } from '@/components/semantier/resource-explorer'
import { SemanticEditor } from '@/components/semantier/semantic-editor'
import { PropertiesPanel } from '@/components/semantier/properties-panel'

/** Resize handle that matches the v0 ResizableHandle withHandle style */
function ResizeHandle() {
  return (
    <Separator className="bg-border relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-ring focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden cursor-col-resize shrink-0">
      <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
        <GripVerticalIcon className="size-2.5" />
      </div>
    </Separator>
  )
}

export function SemantierLayout() {
  const [selectedId, setSelectedId] = useState<string | null>('contract')
  const [selectedItem, setSelectedItem] = useState<TreeNode | null>(null)
  const [selectedGraphItem, setSelectedGraphItem] = useState<{
    type: 'node' | 'edge'
    data: any
  } | null>(null)

  const handleSelectNode = useCallback((_id: string, node: TreeNode) => {
    setSelectedItem(node)
    setSelectedId(node.id)
  }, [])

  const handleSelectGraphItem = useCallback((type: 'node' | 'edge', data: any) => {
    setSelectedGraphItem(data ? { type, data } : null)
    if (type === 'node' && data?.id) setSelectedId(data.id)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Header />

      <div className="flex-1 min-h-0 overflow-hidden">
        <Group orientation="horizontal" className="h-full w-full">
          {/* ── Left: resource/namespace explorer ── */}
          <Panel defaultSize={300} minSize={200} maxSize={400}>
            <div className="h-full overflow-hidden">
              <ResourceExplorer
                selectedId={selectedId}
                onSelectItem={handleSelectNode}
              />
            </div>
          </Panel>

          <ResizeHandle />

          {/* ── Center: semantic editor / graph ── */}
          <Panel defaultSize={400} minSize={100}>
            <div className="h-full overflow-hidden">
              <SemanticEditor
                selectedItem={selectedItem}
                onGraphSelectItem={handleSelectGraphItem}
              />
            </div>
          </Panel>

          <ResizeHandle />

          {/* ── Right: property inspector ── */}
          <Panel defaultSize={300} minSize={250} maxSize={400}>
            <div className="h-full overflow-hidden">
              <PropertiesPanel
                selectedItem={selectedItem}
                selectedGraphItem={selectedGraphItem}
              />
            </div>
          </Panel>
        </Group>
      </div>

      {/* Status bar — matches v0 footer */}
      <footer className="h-6 flex items-center justify-between px-3 bg-card border-t border-border text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span>工作空间: default</span>
          <span>本体库: 12 个对象</span>
          <span>维度: 6 个定义</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>已同步</span>
          <span>v1.0.0</span>
        </div>
      </footer>
    </div>
  )
}
