import { LedgerProvider } from '@/common/contexts/LedgerContext'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import MobileNav from '@/components/layout/mobile-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LedgerProvider>
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <MobileNav />
    </LedgerProvider>
  )
}
