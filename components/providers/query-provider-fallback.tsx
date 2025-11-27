'use client'

import { type ReactNode } from 'react'

// Fallback provider that can be used until TanStack Query is properly installed
export default function QueryProviderFallback({ children }: { children: ReactNode }) {
  return <>{children}</>
}