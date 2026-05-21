"use client"

import Link from "next/link"
import { 
  TrendingUp, 
  Calculator, 
  ChevronRight, 
  Scale, 
  Database,
  Coins
} from "lucide-react"

export default function ToolsPage() {
  const tools = [
    { 
      label: "Gold-to-Silver Ratio", 
      desc: "Live arbitrage calculator & historical trends", 
      href: "/tools/ratio",
      icon: TrendingUp,
      badge: "LIVE DATA"
    },
    { 
      label: "Multi-Item Scrap Estimator", 
      desc: "Compile custom metal lots & dealer margin payouts", 
      href: "/tools/scrap",
      icon: Calculator,
      badge: "PRO CALCULATOR"
    },
    { 
      label: "Karat Converter", 
      desc: "Convert gold purity parts-per-thousand (mks)", 
      icon: Scale,
      disabled: true
    },
    { 
      label: "Coin Mintage Database", 
      desc: "Historical coin weights & metal fineness ledger", 
      icon: Database,
      disabled: true
    },
    { 
      label: "Bullion Spread Calculator", 
      desc: "Instantly check buy/sell margins on sovereign coins", 
      icon: Coins,
      disabled: true
    }
  ]

  return (
    <div className="flex flex-col px-4 pb-24 max-w-lg mx-auto">
      <header className="pt-4 pb-3 border-b border-border/20 mb-4">
        <h1 className="text-lg font-bold tracking-tight">Interactive Stack Tools</h1>
        <p className="text-[10px] text-muted-foreground">Premium calculators & market arbitrage ratios</p>
      </header>

      <div className="space-y-3">
        {tools.map((tool) => {
          const Icon = tool.icon
          const content = (
            <div className="flex items-center gap-3.5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                tool.disabled 
                  ? "border-border/30 bg-muted/20 text-muted-foreground" 
                  : "border-primary/20 bg-primary/10 text-primary"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-bold leading-none ${tool.disabled ? "text-muted-foreground" : "text-foreground"}`}>
                    {tool.label}
                  </p>
                  {tool.badge && (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[8px] font-black uppercase text-primary tracking-wide">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{tool.desc}</p>
              </div>
              {!tool.disabled && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          )

          if (tool.disabled) {
            return (
              <div 
                key={tool.label}
                className="rounded-xl border border-border/20 bg-card/30 p-3.5 opacity-55 cursor-not-allowed select-none"
              >
                {content}
              </div>
            )
          }

          return (
            <Link
              key={tool.label}
              href={tool.href || ""}
              className="block rounded-xl border border-border/40 bg-card p-3.5 shadow-sm transition-all duration-200 hover:border-primary/45 hover:bg-card/75 active:scale-[0.98]"
            >
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
