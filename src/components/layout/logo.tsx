import Link from 'next/link'
import { WalletCards } from 'lucide-react'

export default function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="Ledger หน้าแรก">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-primary-strong shadow-(--shadow-pop)">
        <WalletCards size={18} className="text-white" strokeWidth={2.25} />
      </span>
      <span className="text-lg font-bold tracking-tight text-text">
        Ledger<span className="text-primary">.</span>
      </span>
    </Link>
  )
}
