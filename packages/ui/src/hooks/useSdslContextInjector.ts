import { useEffect, useRef } from 'react'
import { opencodeClient } from '@/lib/opencode/client'
import { useSessionStore } from '@/stores/useSessionStore'
import { useConfigStore } from '@/stores/useConfigStore'
import { useSdslStore } from '@/stores/useSdslStore'

const DEBOUNCE_MS = 800

/**
 * Phase 2 — SDSL context injection.
 *
 * Watches the SDSL buffer for meaningful changes and injects the current
 * buffer as a `noReply: true` synthetic prompt into the active OpenCode session.
 * This keeps the agent context window current without triggering a model response.
 *
 * As specified in PRD §12.4:
 * "Context must be injected into the active session using `session.prompt`
 *  with `noReply: true` on each meaningful editor or ontology state change."
 */
export function useSdslContextInjector() {
  const buffer = useSdslStore((s) => s.buffer)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastInjectedRef = useRef<string>('')

  useEffect(() => {
    if (!currentSessionId) return

    // Skip if buffer hasn't changed meaningfully
    if (buffer.trim() === lastInjectedRef.current.trim()) return

    // Debounce
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      const sessionId = useSessionStore.getState().currentSessionId
      if (!sessionId) return

      // Require at least a meaningful SDSL snippet (more than blank/comment lines)
      const meaningful = buffer.split('\n').filter((l) => {
        const t = l.trim()
        return t.length > 0 && !t.startsWith('//')
      })
      if (meaningful.length < 2) return

      const contextPayload = [
        '[SDSL_CONTEXT_SNAPSHOT]',
        `// Active SDSL buffer — ${new Date().toISOString()}`,
        buffer.trim(),
        '[/SDSL_CONTEXT_SNAPSHOT]',
      ].join('\n')

      try {
        const { currentProviderId: providerID, currentModelId: modelID } =
          useConfigStore.getState()

        if (!providerID || !modelID) return

        // Flat call matches SDK v2 shape: noReply is a top-level body field
        await (opencodeClient.getApiClient().session.prompt as Function)({
          sessionID: sessionId,
          model: { providerID, modelID },
          noReply: true,
          parts: [
            {
              type: 'text',
              text: contextPayload,
              synthetic: true,
            },
          ],
        })

        lastInjectedRef.current = buffer
      } catch {
        // Context injection is best-effort — do not surface errors to the user
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [buffer, currentSessionId])
}
