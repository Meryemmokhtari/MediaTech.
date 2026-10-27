import type { ReactNode } from 'react'
import './Layout.css'

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="mediatech-layout">
      <main className="layout-main">
        {children}
      </main>
    </div>
  )
}
