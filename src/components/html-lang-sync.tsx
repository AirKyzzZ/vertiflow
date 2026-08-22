'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { localeFromPathname } from '@/lib/i18n'

export function HtmlLangSync() {
  const pathname = usePathname()

  useEffect(() => {
    document.documentElement.lang = localeFromPathname(pathname)
  }, [pathname])

  return null
}
