import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { LedgerProvider } from '@/common/contexts/LedgerContext'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Ledger',
  description: 'ระบบบันทึกรายรับ-รายจ่ายส่วนตัว',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={geist.variable}>
      <body className="font-(family-name:--font-geist)">
        <LedgerProvider>
          <Sidebar />
          <div className="ml-55 flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 p-6 max-w-4xl">{children}</main>
          </div>
        </LedgerProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { fontFamily: 'var(--font-geist)', fontSize: '14px' },
          }}
          richColors
        />
      </body>
    </html>
  )
}
