"use client"

import { useState } from "react"
import { User } from "lucide-react"
import ProfileMenu from "./profile-menu"

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="flex items-center justify-between pt-4 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-primary transition-all hover:bg-accent hover:text-primary active:scale-90"
          aria-label="Open Profile Menu"
        >
          <User className="h-4 w-4" />
        </button>
      </header>

      {/* Profile drawer */}
      <ProfileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
