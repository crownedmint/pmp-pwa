"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  TrendingUp,
  Vault,
  Calculator,
  BookOpen,
  Tag,
} from "lucide-react"

const navItems = [
  { label: "Market", href: "/", icon: TrendingUp },
  { label: "Vault", href: "/vault", icon: Vault },
  { label: "Calc", href: "/calc", icon: Calculator },
  { label: "Hub", href: "/hub", icon: BookOpen },
  { label: "Drop", href: "/drop", icon: Tag },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="pwa-nav fixed left-0 right-0 bottom-0 z-50 border-t border-border/40 bg-background">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
