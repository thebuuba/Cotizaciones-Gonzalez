import { supabase } from '../../lib/supabase'
import type { ExportProgress, ExportStage } from './exportService'

type ExportKind = 'image' | 'pdf'

function errorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 1000)
  return String(error).slice(0, 1000)
}

async function insert(kind: ExportKind, quotationId: string, stage: ExportStage | 'start' | 'success' | 'error', success: boolean, details: Record<string, unknown> = {}, error?: unknown) {
  if (!supabase) return
  try {
    await supabase.from('export_diagnostics').insert({
      quotation_id: quotationId,
      export_kind: kind,
      stage,
      success,
      error_message: error ? errorMessage(error) : null,
      user_agent: navigator.userAgent,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      page_count: typeof details.pageCount === 'number' ? details.pageCount : null,
      details,
    })
  } catch (diagnosticError) {
    console.warn('No se pudo registrar diagnóstico de exportación.', diagnosticError)
  }
}

export function createExportDiagnostics(kind: ExportKind, quotationId: string, pageCount: number) {
  const progress: ExportProgress = (stage, details = {}) => insert(kind, quotationId, stage, false, { pageCount, ...details })
  return {
    start: () => insert(kind, quotationId, 'start', false, { pageCount }),
    progress,
    success: (details: Record<string, unknown> = {}) => insert(kind, quotationId, 'success', true, { pageCount, ...details }),
    error: (error: unknown) => insert(kind, quotationId, 'error', false, { pageCount }, error),
  }
}
