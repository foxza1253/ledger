import type { Metadata, Viewport } from 'next'
import { Anuphan } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

// Anuphan covers Thai + Latin (Geist has no Thai glyphs, so Thai fell back to system fonts).
const anuphan = Anuphan({ subsets: ['thai', 'latin'], variable: '--font-anuphan', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Ledger', template: '%s · Ledger' },
  description: 'ระบบบันทึกรายรับ-รายจ่ายส่วนตัว',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#db2777',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={anuphan.variable}>
      <body className="min-h-screen text-[15px]">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{ style: { fontFamily: 'var(--font-anuphan)', fontSize: '14px' } }}
          richColors
          closeButton
        />
      </body>
    </html>
  )
}
