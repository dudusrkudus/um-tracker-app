import { AlertOctagon, AlertTriangle, CheckCircle2, CircleDot, Eye, Info, Loader, XCircle } from 'lucide-react'
import { humanize } from '@/lib/format'

// Colour is never the only signal: every badge carries an icon and a text label.

const SEVERITY_STYLES: Record<string, { cls: string; Icon: typeof Info }> = {
  low: { cls: 'bg-slate-100 text-slate-700 border-slate-200', Icon: Info },
  medium: { cls: 'bg-amber-50 text-amber-800 border-amber-200', Icon: AlertTriangle },
  high: { cls: 'bg-orange-100 text-orange-800 border-orange-300', Icon: AlertTriangle },
  emergency: { cls: 'bg-red-600 text-white border-red-700', Icon: AlertOctagon },
}

const STATUS_STYLES: Record<string, { cls: string; Icon: typeof Info }> = {
  open: { cls: 'bg-red-50 text-red-700 border-red-200', Icon: CircleDot },
  acknowledged: { cls: 'bg-sky-50 text-sky-700 border-sky-200', Icon: Eye },
  in_progress: { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', Icon: Loader },
  resolved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  cancelled: { cls: 'bg-gray-100 text-gray-600 border-gray-200', Icon: XCircle },
}

function Pill({ cls, Icon, label }: { cls: string; Icon: typeof Info; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${cls}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low
  return <Pill {...s} label={humanize(severity)} />
}

export function IncidentStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.open
  return <Pill {...s} label={humanize(status)} />
}
