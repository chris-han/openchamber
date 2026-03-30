import { CheckCircle2, AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidateLogicResult } from '@/lib/semantier-tools'

interface Props {
  result: ValidateLogicResult
}

export function SdslValidationCard({ result }: Props) {
  const errors   = result.diagnostics.filter((d) => d.severity === 'error')
  const warnings = result.diagnostics.filter((d) => d.severity === 'warning')

  return (
    <div className="rounded-lg border overflow-hidden text-sm"
      style={{
        borderColor: result.valid
          ? 'color-mix(in oklch, var(--sem-success) 40%, transparent)'
          : 'color-mix(in oklch, var(--destructive) 40%, transparent)',
      }}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 border-b border-inherit',
        result.valid ? 'bg-green-950/30' : 'bg-red-950/30',
      )}>
        {result.valid ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
        )}
        <span className="font-medium text-foreground">SDSL Validation</span>
        <span className={cn('ml-auto text-xs font-medium', result.valid ? 'text-green-400' : 'text-red-400')}>
          {result.valid ? '通过' : '失败'}
        </span>
      </div>

      {/* Summary */}
      <div className="px-3 py-2 text-xs text-muted-foreground bg-card">
        {result.summary}
      </div>

      {/* Diagnostics */}
      {result.diagnostics.length > 0 && (
        <div className="divide-y divide-border/50">
          {result.diagnostics.map((diag, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2">
              {diag.severity === 'error' ? (
                <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <span className={cn(
                  'font-medium mr-1.5',
                  diag.severity === 'error' ? 'text-red-400' : 'text-yellow-400',
                )}>
                  Line {diag.line}
                  {diag.column !== undefined ? `:${diag.column}` : ''}
                </span>
                <span className="text-muted-foreground">{diag.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary when clean */}
      {result.valid && result.diagnostics.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-muted-foreground">No issues found — safe to accept</span>
        </div>
      )}

      {/* Counts */}
      {result.diagnostics.length > 0 && (
        <div className="px-3 py-1.5 bg-muted/20 border-t border-inherit text-xs text-muted-foreground flex gap-3">
          {errors.length > 0 && (
            <span className="text-red-400">{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
          )}
          {warnings.length > 0 && (
            <span className="text-yellow-400">{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}
    </div>
  )
}
