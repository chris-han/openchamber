import { create } from 'zustand'

export interface GhostTextDecoration {
  /** Line number (1-based) where ghost text should appear */
  line: number
  /** Column (1-based) where ghost text should be inserted */
  column: number
  /** The suggested SDSL text */
  text: string
}

export interface SdslDiagnostic {
  file?: string
  line: number
  column?: number
  severity: 'error' | 'warning' | 'info'
  message: string
  /** rule_id or predicate that this diagnostic relates to */
  sourceId?: string
}

interface SdslState {
  /** Live SDSL buffer content */
  buffer: string
  setBuffer: (buffer: string) => void

  /** Ghost text suggestion pending acceptance */
  ghostText: GhostTextDecoration | null
  setGhostText: (ghost: GhostTextDecoration | null) => void

  /** Inline diagnostics from validator */
  diagnostics: SdslDiagnostic[]
  setDiagnostics: (diagnostics: SdslDiagnostic[]) => void

  /** Accept or reject the current ghost text suggestion */
  acceptGhostText: () => void
  rejectGhostText: () => void
}

export const useSdslStore = create<SdslState>((set, get) => ({
  buffer: `// SDSL — Semantier Domain Specific Language
// Start with a DIMENSION declaration

DIMENSION core:Contract {
  contractId: string @primary,
  amount:     decimal(18,2),
  status:     enum(draft, active, completed, cancelled),
  signDate:   date?
}

// MAP a business event to accounting semantics
MAP fin:RevenueRecognition FROM core:Contract {
  BIND amount    = Contract.amount
  BIND eventDate = Contract.signDate ?? NOW()
  ASSERT amount > 0
}
`,

  setBuffer: (buffer) => set({ buffer }),

  ghostText: null,
  setGhostText: (ghostText) => set({ ghostText }),

  diagnostics: [],
  setDiagnostics: (diagnostics) => set({ diagnostics }),

  acceptGhostText: () => {
    const { ghostText, buffer } = get()
    if (!ghostText) return
    const lines = buffer.split('\n')
    const targetLine = Math.min(ghostText.line - 1, lines.length - 1)
    const col = ghostText.column - 1
    const line = lines[targetLine] ?? ''
    lines[targetLine] = line.slice(0, col) + ghostText.text + line.slice(col)
    set({ buffer: lines.join('\n'), ghostText: null })
  },

  rejectGhostText: () => set({ ghostText: null }),
}))
