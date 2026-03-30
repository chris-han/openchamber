import { useEffect, useRef } from 'react'
import type * as MonacoNS from 'monaco-editor'
import { opencodeClient } from '@/lib/opencode/client'
import { useSessionStore } from '@/stores/useSessionStore'
import { useSdslStore } from '@/stores/useSdslStore'

/**
 * Phase 2 — Tool-event → Monaco glyph margin bridge.
 *
 * Listens to the OpenCode global SSE feed. When the active AI session calls
 * `validate_datalog_logic`, the resulting diagnostics are mapped to Monaco
 * model markers (errors/warnings in the glyph margin and ruler).
 *
 * Also updates `useSdslStore.diagnostics` so other UI surfaces can react.
 */
export function useToolEventGlyphs(
  editorRef: React.RefObject<MonacoNS.editor.IStandaloneCodeEditor | null>,
  monacoRef: React.RefObject<typeof MonacoNS | null>,
) {
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const setDiagnostics = useSdslStore((s) => s.setDiagnostics)
  // Track transient "loading" decorations while tool is executing
  const loadingDecsRef = useRef<string[]>([])

  useEffect(() => {
    if (!currentSessionId) return

    const unsubscribe = opencodeClient.subscribeToGlobalEvents(
      (routedEvent) => {
        const payload = routedEvent.payload as unknown as Record<string, unknown>
        const type = typeof payload.type === 'string' ? payload.type : ''

        // Only care about message.part.updated events that carry tool parts
        if (type !== 'message.part.updated') return

        const part = payload.part as Record<string, unknown> | undefined
        if (!part || part.type !== 'tool') return

        const toolName = typeof part.tool === 'string' ? part.tool : ''
        if (
          toolName !== 'validate_datalog_logic' &&
          toolName !== 'get_ontology_schema'
        )
          return

        const editor = editorRef.current
        const monaco = monacoRef.current
        if (!editor || !monaco) return

        const model = editor.getModel()
        if (!model) return

        const state = typeof part.state === 'string' ? part.state : ''

        if (state === 'running') {
          // Show a spinner-style glyph at line 1 while tool is working
          loadingDecsRef.current = editor.deltaDecorations(
            loadingDecsRef.current,
            [
              {
                range: new monaco.Range(1, 1, 1, 1),
                options: {
                  glyphMarginClassName: 'sdsl-glyph-loading',
                  glyphMarginHoverMessage: {
                    value: toolName === 'validate_datalog_logic'
                      ? '⟳ 正在验证 SDSL 逻辑…'
                      : '⟳ 正在读取本体模式…',
                  },
                },
              },
            ],
          )
          return
        }

        // Clear loading glyph
        loadingDecsRef.current = editor.deltaDecorations(loadingDecsRef.current, [])

        if (state !== 'completed') return

        // Parse tool output
        const output = part.output as string | undefined
        if (!output) return

        let parsed: unknown
        try {
          parsed = JSON.parse(output)
        } catch {
          return
        }

        if (toolName === 'validate_datalog_logic') {
          const result = parsed as {
            valid?: boolean
            diagnostics?: Array<{
              line?: number
              message?: string
              severity?: 'error' | 'warning'
            }>
          }

          const diags = Array.isArray(result?.diagnostics) ? result.diagnostics : []

          // Update Zustand store
          setDiagnostics(
            diags.map((d) => ({
              line: d.line ?? 1,
              message: d.message ?? 'Unknown error',
              severity: d.severity ?? 'error',
            })),
          )

          // Set Monaco model markers
          const markers: MonacoNS.editor.IMarkerData[] = diags.map((d) => ({
            startLineNumber: d.line ?? 1,
            startColumn: 1,
            endLineNumber: d.line ?? 1,
            endColumn: model.getLineMaxColumn(d.line ?? 1),
            message: d.message ?? '',
            severity:
              d.severity === 'warning'
                ? monaco.MarkerSeverity.Warning
                : monaco.MarkerSeverity.Error,
          }))
          monaco.editor.setModelMarkers(model, 'sdsl-validator', markers)
        }
      },
    )

    return unsubscribe
  }, [currentSessionId, editorRef, monacoRef, setDiagnostics])
}
