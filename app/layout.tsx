import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { BottomNav } from "@/components/bottom-nav"
import { InstallPrompt } from "@/components/install-prompt"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Precious Metals Pro",
  description:
    "Track precious metals prices, manage your vault, and calculate melt values — all in one app.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Precious Metal Pro",
  },
  applicationName: "Precious Metals Pro",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a1a1a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="pwa-top-pad min-h-screen overscroll-none">
        <ThemeProvider defaultTheme="dark">
          <main className="pb-24">{children}</main>
          <BottomNav />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  )
}
