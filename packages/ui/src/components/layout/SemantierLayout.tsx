import { useState, useCallback } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { Header } from '@/components/semantier/header'
import { ResourceExplorer, type TreeNode } from '@/components/semantier/resource-explorer'
import { SemanticEditor } from '@/components/semantier/semantic-editor'
import { PropertiesPanel } from '@/components/semantier/properties-panel'

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
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      <Header />

      <div className="flex-1 min-h-0 overflow-hidden">
        <Group orientation="horizontal" className="h-full w-full">
          {/* ── Left: resource/namespace explorer ── */}
          <Panel defaultSize={16} minSize={8} collapsible collapsedSize={0}>
            <div className="h-full overflow-hidden">
              <ResourceExplorer
                selectedId={selectedId}
                onSelectItem={handleSelectNode}
              />
            </div>
          </Panel>

          <Separator className="relative flex w-1.5 items-center justify-center bg-border/40 hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize shrink-0 after:absolute after:inset-y-0 after:w-4 after:content-['']" />

          {/* ── Center: semantic editor / graph ── */}
          <Panel defaultSize={54} minSize={20}>
            <div className="h-full overflow-hidden">
              <SemanticEditor
                selectedItem={selectedItem}
                onGraphSelectItem={handleSelectGraphItem}
              />
            </div>
          </Panel>

          <Separator className="relative flex w-1.5 items-center justify-center bg-border/40 hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize shrink-0 after:absolute after:inset-y-0 after:w-4 after:content-['']" />

          {/* ── Right: property inspector ── */}
          <Panel defaultSize={30} minSize={8} collapsible collapsedSize={0}>
            <div className="h-full overflow-hidden">
              <PropertiesPanel
                selectedItem={selectedItem}
                selectedGraphItem={selectedGraphItem}
              />
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  )
}
