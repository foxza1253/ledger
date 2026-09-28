import { AlertTriangle, RotateCw } from 'lucide-react'
import { errorMessage } from '@/lib/api-client'

export default function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 border-danger/20 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle size={22} />
      </span>
      <p className="font-semibold text-text">โหลดข้อมูลไม่สำเร็จ</p>
      <p className="text-sm text-muted">{errorMessage(error)}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary">
          <RotateCw size={14} /> ลองใหม่
        </button>
      )}
    </div>
  )
}
