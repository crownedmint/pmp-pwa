import {
  Settings,
  Bell,
  Shield,
  HelpCircle,
  Share2,
  Info,
} from "lucide-react"

export default function MenuPage() {
  return (
    <div className="flex flex-col px-4">
      <header className="flex items-center justify-between pt-2 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">More</h1>
          <p className="text-xs text-muted-foreground">Settings & info</p>
        </div>
      </header>

      <div className="mt-2 space-y-2">
        {[
          { label: "Settings", desc: "App preferences", icon: Settings },
          { label: "Notifications", desc: "Alert preferences", icon: Bell },
          { label: "Privacy & Security", desc: "Data & permissions", icon: Shield },
          { label: "Share App", desc: "Send to a friend", icon: Share2 },
          { label: "Help & Support", desc: "FAQ & contact us", icon: HelpCircle },
          { label: "About", desc: "Version & credits", icon: Info },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-card px-4 py-3 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <span className="text-muted-foreground">›</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
