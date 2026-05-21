import { Wrench } from "lucide-react"

export default function ToolsPage() {
  return (
    <div className="flex flex-col px-4">
      <header className="flex items-center justify-between pt-2 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tools</h1>
          <p className="text-xs text-muted-foreground">Utilities & references</p>
        </div>
      </header>

      <div className="mt-2 space-y-2">
        {[
          { label: "Karat Calculator", desc: "Convert between gold purities" },
          { label: "Weight Converter", desc: "Troy oz, grams, dwt, grains" },
          { label: "Spread Calculator", desc: "Buy/sell spread analysis" },
          { label: "Coin Database", desc: "Weights & fineness reference" },
          { label: "Scrap Estimator", desc: "Estimate scrap metal value" },
        ].map((tool) => (
          <div
            key={tool.label}
            className="flex items-center justify-between rounded-xl border border-border/40 bg-card px-4 py-3 transition-all duration-200 active:scale-[0.98]"
          >
            <div>
              <p className="text-sm font-medium">{tool.label}</p>
              <p className="text-xs text-muted-foreground">{tool.desc}</p>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        ))}
      </div>
    </div>
  )
}
