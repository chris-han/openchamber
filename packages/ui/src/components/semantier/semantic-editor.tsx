import { useEffect, useRef, useCallback, useState } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import type * as MonacoNS from 'monaco-editor'
import { Lock, Sparkles, Loader2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TreeNode } from './resource-explorer'
import { OntologyGraph } from './ontology-graph'
import { useSdslStore } from '@/stores/useSdslStore'
import {
  SDSL_LANGUAGE_ID,
  monarchTokensProvider,
  languageConfiguration,
  semantierDarkTheme,
} from '@/lib/sdsl-language'
import { useToolEventGlyphs } from '@/hooks/useToolEventGlyphs'
import { opencodeClient } from '@/lib/opencode/client'
import { useSessionStore } from '@/stores/useSessionStore'
import { useConfigStore } from '@/stores/useConfigStore'

/* ── Static logic weave sample shown on the "逻辑织入" tab ── */
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

interface SemanticEditorProps {
  selectedItem: TreeNode | null
  onGraphSelectItem?: (type: 'node' | 'edge', data: any) => void
}

export function SemanticEditor({ selectedItem, onGraphSelectItem }: SemanticEditorProps) {
  const monaco = useMonaco()
  const editorRef = useRef<MonacoNS.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof MonacoNS | null>(null)
  const buffer = useSdslStore((s) => s.buffer)
  const setBuffer = useSdslStore((s) => s.setBuffer)
  const ghostText = useSdslStore((s) => s.ghostText)
  const setGhostText = useSdslStore((s) => s.setGhostText)
  const acceptGhostText = useSdslStore((s) => s.acceptGhostText)
  const rejectGhostText = useSdslStore((s) => s.rejectGhostText)
  const decorationsRef = useRef<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)

  // Keep monacoRef in sync with monaco from hook (needed by useToolEventGlyphs)
  useEffect(() => {
    monacoRef.current = monaco as any
  }, [monaco])

  // Phase 2 — wire tool events to Monaco glyph margin
  useToolEventGlyphs(editorRef, monacoRef)

  /* Register SDSL language and theme when Monaco loads */
  useEffect(() => {
    if (!monaco) return

    // Only register once
    const existing = monaco.languages.getLanguages().find((l) => l.id === SDSL_LANGUAGE_ID)
    if (!existing) {
      monaco.languages.register({ id: SDSL_LANGUAGE_ID, extensions: ['.sdsl'] })
      monaco.languages.setMonarchTokensProvider(SDSL_LANGUAGE_ID, monarchTokensProvider as any)
      monaco.languages.setLanguageConfiguration(SDSL_LANGUAGE_ID, languageConfiguration as any)
    }

    const existingTheme = (monaco.editor as any)._themeService?.getColorTheme?.()?.themeName
    if (existingTheme !== 'semantier-dark') {
      monaco.editor.defineTheme('semantier-dark', semantierDarkTheme)
    }
    monaco.editor.setTheme('semantier-dark')
  }, [monaco])

  /* Render ghost-text as an inline decoration */
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !monaco) return

    // Clear previous ghost text decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])

    if (!ghostText) return

    const text = ghostText.text
    const line = ghostText.line
    const col = ghostText.column

    decorationsRef.current = editor.deltaDecorations([], [
      {
        range: new monaco.Range(line, col, line, col),
        options: {
          after: {
            content: text,
            inlineClassName: 'sdsl-ghost-text',
          },
        },
      },
    ])
  }, [ghostText, monaco])

  /* Accept ghost text on Tab, reject on Escape */
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !ghostText) return

    const disposable = editor.onKeyDown((e: MonacoNS.IKeyboardEvent) => {
      if (e.keyCode === (monaco?.KeyCode.Tab ?? 2)) {
        e.preventDefault()
        e.stopPropagation()
        acceptGhostText()
      } else if (e.keyCode === (monaco?.KeyCode.Escape ?? 9)) {
        rejectGhostText()
      }
    })

    return () => disposable.dispose()
  }, [ghostText, monaco, acceptGhostText, rejectGhostText])

  const handleEditorMount = useCallback(
    (editor: MonacoNS.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor
    },
    [],
  )

  /**
   * Phase 2 — structured SDSL suggestion via session.prompt with JSON schema.
   * Calls the active AI session and asks for a ghost-text SDSL completion.
   */
  const requestSdslSuggestion = useCallback(async () => {
    const sessionId = useSessionStore.getState().currentSessionId
    if (!sessionId) return
    const { currentProviderId: providerID, currentModelId: modelID } =
      useConfigStore.getState()
    if (!providerID || !modelID) return

    setIsSuggesting(true)
    try {
      const prompt = [
        '根据以下 SDSL 缓冲区内容，在最合适的位置提供一个新的 SDSL 代码补全建议。',
        '只补全缺失的内容，不要重复已有代码。',
        '',
        '```sdsl',
        buffer.trim(),
        '```',
      ].join('\n')

      const schema = {
        type: 'object',
        properties: {
          line: {
            type: 'integer',
            description: '建议插入的 1-based 行号（通常是最后一行的下一行）',
          },
          column: {
            type: 'integer',
            description: '建议插入的 1-based 列号（通常为 1）',
          },
          text: {
            type: 'string',
            description: '建议补全的 SDSL 代码片段',
          },
        },
        required: ['line', 'column', 'text'],
        additionalProperties: false,
      }

      const response = await (
        opencodeClient.getApiClient().session.prompt as Function
      )({
        sessionID: sessionId,
        model: { providerID, modelID },
        format: { type: 'json_schema', schema, retryCount: 2 },
        parts: [{ type: 'text', text: prompt, synthetic: false }],
      })

      const info = (response?.data?.info ?? {}) as Record<string, unknown>
      const structured =
        (info.structured_output ?? info.structured) as {
          line?: number
          column?: number
          text?: string
        } | undefined

      if (structured?.text && structured.line) {
        setGhostText({
          line: structured.line,
          column: structured.column ?? 1,
          text: structured.text,
        })
      }
    } catch {
      // Suggestion is best-effort
    } finally {
      setIsSuggesting(false)
    }
  }, [buffer, setGhostText])

  return (
    <div className="h-full flex flex-col bg-[var(--editor-bg,#1a1b26)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedItem ? (
              <>
                <span className="text-muted-foreground">{selectedItem.prefix ?? ''}</span>
                {selectedItem.name}
              </>
            ) : (
              'SDSL 编辑器'
            )}
          </span>
          {selectedItem?.version && (
            <Badge variant="secondary" className="text-xs">{selectedItem.version}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {ghostText && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>AI 建议</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Tab</kbd>
              <span>接受</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>
              <span>拒绝</span>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
            disabled={isSuggesting}
            onClick={requestSdslSuggestion}
            title="AI SDSL 建议"
          >
            {isSuggesting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            建议
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schema" className="flex-1 flex flex-col overflow-hidden min-h-0">
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
            SDSL 编辑器
          </TabsTrigger>
        </TabsList>

        {/* ── 图形建模 — ReactFlow ontology graph ── */}
        <TabsContent value="schema" className="flex-1 m-0 overflow-hidden relative">
          <OntologyGraph onSelectItem={onGraphSelectItem} />
        </TabsContent>

        {/* ── 逻辑织入 — read-only display of cross-domain logic ── */}
        <TabsContent value="logic" className="flex-1 m-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50 shrink-0">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Logic Weaving — 定义跨域事件触发规则</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={SDSL_LANGUAGE_ID}
                value={logicWeaveCode}
                theme="semantier-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'off',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: 'none',
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── SDSL 编辑器 — Monaco with SDSL language and ghost text ── */}
        <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
          <Editor
            height="100%"
            language={SDSL_LANGUAGE_ID}
            value={buffer}
            theme="semantier-dark"
            onMount={handleEditorMount}
            onChange={(value) => {
              if (value !== undefined) setBuffer(value)
            }}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'off',
              fontSize: 13,
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'line',
              suggestOnTriggerCharacters: true,
              glyphMargin: true,
              folding: true,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
