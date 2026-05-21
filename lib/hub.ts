export type PostType = "article" | "image" | "podcast" | "video" | "ebook"
export type Category = "market-analysis" | "investing" | "numismatics" | "refining" | "history" | "strategy" | "news" | "beginner"

export interface HubPost {
  id: string
  type: PostType
  title: string
  excerpt: string
  body: string
  category: Category
  tags: string[]
  author: string
  date: string
  readTime?: string
  duration?: string
  imageUrl?: string
  featured?: boolean
  mediaUrl?: string // Embed URLs
}

export const POST_TYPES: { key: PostType; label: string; icon: string; color: string }[] = [
  { key: "article", label: "Articles", icon: "FileText", color: "#3b82f6" },
  { key: "video", label: "Videos", icon: "Play", color: "#ef4444" },
  { key: "podcast", label: "Podcasts", icon: "Headphones", color: "#f59e0b" },
  { key: "ebook", label: "eBooks", icon: "Book", color: "#10b981" },
  { key: "image", label: "Images", icon: "ImageIcon", color: "#8b5cf6" },
]

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "market-analysis", label: "Market Analysis" },
  { key: "investing", label: "Investing" },
  { key: "numismatics", label: "Numismatics" },
  { key: "refining", label: "Refining" },
  { key: "history", label: "History" },
  { key: "strategy", label: "Strategy" },
  { key: "news", label: "News" },
  { key: "beginner", label: "Beginner" },
]

export const MOCK_POSTS: HubPost[] = [
  {
    id: "h1",
    type: "video",
    title: "Precious Metals Technical Analysis: Q3 Bullion Breakout",
    excerpt: "Watch the latest technical charting breakdown for Gold, Silver, and Platinum spot pricing trends as we enter the third quarter.",
    body: "In this comprehensive technical breakdown, our chief market analyst reviews the weekly and daily chart profiles of XAU/USD and XAG/USD. We analyze key support/resistance blocks, moving average convergences, and relative strength indices to map out potential breakout channels for the upcoming quarter.",
    category: "market-analysis",
    tags: ["spotprice", "charts", "technical-analysis"],
    author: "James Vance",
    date: "2026-05-20T10:00:00.000Z",
    duration: "14 min",
    featured: true,
    mediaUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Simulated placeholder
  },
  {
    id: "h2",
    type: "article",
    title: "Physical Gold Stacking: A Beginner's Asset Allocation Guide",
    excerpt: "Learn how to structure your physical gold holding portfolio. Compare fractional coins, standard bars, and junk coins.",
    body: "Stacking physical gold is one of the oldest forms of wealth preservation. However, for a beginner, the choices can be overwhelming. Should you purchase fractional coins (like 1/10oz eagles), standard 1oz bars, or historic sovereign coins (like British Sovereigns or Swiss Vrenelis)? This guide breaks down the premium structures, liquidity considerations, and storage requirements for each type of holding to help you design an optimal bullion collection plan.",
    category: "beginner",
    tags: ["gold", "investing", "stacking"],
    author: "Sarah Jenkins",
    date: "2026-05-18T14:30:00.000Z",
    readTime: "8 min",
    featured: true,
  },
  {
    id: "h3",
    type: "podcast",
    title: "PMP Podcast Ep 42: Macro Economics and the Future of Bullion",
    excerpt: "Listen to our discussion on treasury yield fluctuations, global central bank purchases, and retail gold demand.",
    body: "On this episode of the Precious Metals Pro Podcast, we invite macroeconomic researcher Dr. Elena Rostova to discuss the massive wave of central bank purchases recorded over the past 12 months. We analyze how rising global debt, bond yield curves, and inflation target adjustments are pushing sovereign institutions to accumulate record ounces of physical gold, and what this implies for long-term private stackers.",
    category: "investing",
    tags: ["centralbanks", "macroeconomics", "bullion"],
    author: "Robert Cole & Dr. Elena Rostova",
    date: "2026-05-15T09:00:00.000Z",
    duration: "45 min",
    mediaUrl: "https://open.spotify.com/embed/show/582L3eS13Lq4aD8bF85K54", // Simulated placeholder
  },
  {
    id: "h4",
    type: "article",
    title: "XRF Purity Testing vs. Acid Testing: Refining Jewelry Lots",
    excerpt: "A deep dive comparison into non-destructive testing (NDT) technologies for precious metals pawn shops and refineries.",
    body: "For dealers and scrap buyers, verifying the purity of incoming lots is critical. Acid scratch tests are cheap and fast, but they only verify the surface and can damage delicate items. X-Ray Fluorescence (XRF) analyzers offer precise, non-destructive elemental compositions down to two decimal places, but come with significant capital costs. We review when it is best to rely on chemical testing vs. invest in benchtop spectrometers.",
    category: "refining",
    tags: ["refining", "scrap", "testing"],
    author: "Marcus Aurelius",
    date: "2026-05-12T11:15:00.000Z",
    readTime: "12 min",
  },
  {
    id: "h5",
    type: "ebook",
    title: "The Numismatic Grading Handbook: Collector Edition",
    excerpt: "Free PMP Handbook explaining Sheldon scale grading from Poor (P-1) to Mint State (MS-70). Included with Pro subscription.",
    body: "Numismatic value goes far beyond melt price. A single coin can be worth double or triple its weight value based entirely on grade and rarity. This comprehensive ebook details the Sheldon grading system, teaches you how to identify coin wear patterns under a 10x loop, and highlights the exact factors grading services like PCGS and NGC look for when certifying rare strikes.",
    category: "numismatics",
    tags: ["numismatics", "coins", "grading"],
    author: "C.H. Biddulph",
    date: "2026-05-10T16:00:00.000Z",
    readTime: "42 pages",
  },
  {
    id: "h6",
    type: "image",
    title: "Stunning Historical Coin Database Gallery",
    excerpt: "Visual catalog of 19th Century sovereign coinage including French Roosters, Swiss Helvetias, and Liberty Double Eagles.",
    body: "Browse through our high-resolution visual catalog of iconic 19th and early 20th century gold coinage. This gallery features macro photographs highlighting the design profiles, denticles, and mint marks of Swiss 20 Francs, French 20 Franc Roosters, and Saint-Gaudens Double Eagles. Each image is paired with historic weight specifications and design narratives.",
    category: "history",
    tags: ["history", "coins", "vintage"],
    author: "Numis Photo Desk",
    date: "2026-05-08T08:00:00.000Z",
  }
]
