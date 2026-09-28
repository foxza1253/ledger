'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

/** Floating "add" button — mobile only (desktop has the sidebar button). */
export default function Fab() {
  return (
    <motion.div
      className="fixed right-5 bottom-24 z-30 lg:hidden"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.15 }}
      whileTap={{ scale: 0.92 }}
    >
      <Link
        href="/transactions/new"
        aria-label="บันทึกรายการใหม่"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-(--shadow-pop) transition-colors hover:bg-primary-strong"
      >
        <Plus size={24} strokeWidth={2.5} />
      </Link>
    </motion.div>
  )
}
