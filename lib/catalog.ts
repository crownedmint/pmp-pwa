export type MetalType = "gold" | "silver" | "platinum" | "palladium"
export type ItemCategory = "coin" | "bar" | "round" | "jewelry" | "scrap" | "collectible"
export type ItemStatus = "available" | "reserved"

export interface DropItem {
  id: string
  name: string
  description: string
  metal: MetalType
  category: ItemCategory
  weightOz: number
  karat: string
  spotPrice: number
  premiumPct: number
  finalPrice: number
  status: ItemStatus
}

export const METAL_CONFIG: Record<MetalType, { label: string; color: string; emoji: string; apiSymbol: string }> = {
  gold: { label: "Gold", color: "#D4AF37", emoji: "🥇", apiSymbol: "XAU" },
  silver: { label: "Silver", color: "#C0C0C0", emoji: "🥈", apiSymbol: "XAG" },
  platinum: { label: "Platinum", color: "#E5E4E2", emoji: "⚪", apiSymbol: "XPT" },
  palladium: { label: "Palladium", color: "#B8B8B8", emoji: "🔘", apiSymbol: "XPD" },
}

export const CATEGORIES: { key: ItemCategory; label: string }[] = [
  { key: "coin", label: "Coins" },
  { key: "bar", label: "Bars" },
  { key: "round", label: "Rounds" },
  { key: "jewelry", label: "Jewelry" },
  { key: "scrap", label: "Scrap" },
  { key: "collectible", label: "Collectibles" },
]

export const SEED_CATALOG: DropItem[] = [
  { id: "d1", name: "1oz American Gold Eagle (2024)", description: "Brilliant uncirculated condition. Classic Lady Liberty obverse with family of eagles reverse. Minted at West Point.", metal: "gold", category: "coin", weightOz: 1.0, karat: "22K (917)", spotPrice: 2420, premiumPct: 4.5, finalPrice: 2528.90, status: "available" },
  { id: "d2", name: "1/2oz Canadian Gold Maple Leaf", description: "Pure .9999 fine gold with micro-engraved maple leaf security feature. BU condition in mint capsule.", metal: "gold", category: "coin", weightOz: 0.5, karat: "24K (999)", spotPrice: 1210, premiumPct: 3.8, finalPrice: 1255.98, status: "available" },
  { id: "d3", name: "10oz Gold Bar — PAMP Suisse", description: "PAMP Suisse Lady Fortuna design. Sealed in assay card with serial number. Investment-grade bar.", metal: "gold", category: "bar", weightOz: 10, karat: "24K (999)", spotPrice: 24200, premiumPct: 2.5, finalPrice: 24805.00, status: "available" },
  { id: "d4", name: "14K Gold Cuban Link Chain — 24\"", description: "Solid 14K yellow gold Cuban link chain. 24 inches, 45 grams. Italian craftsmanship with box clasp.", metal: "gold", category: "jewelry", weightOz: 1.45, karat: "14K (583)", spotPrice: 2040, premiumPct: 5.0, finalPrice: 2142.00, status: "available" },
  { id: "d5", name: "1oz Gold Buffalo (2025)", description: "Pure 24K American Gold Buffalo. First .9999 fine gold coin struck by the US Mint. Proof-like surfaces.", metal: "gold", category: "coin", weightOz: 1.0, karat: "24K (999)", spotPrice: 2420, premiumPct: 4.0, finalPrice: 2516.80, status: "available" },
  { id: "d6", name: "Vintage 18K Gold Pocket Watch", description: "Circa 1920 Swiss-made pocket watch in 18K gold case. Working condition. Hunt-case with engraved cover.", metal: "gold", category: "collectible", weightOz: 2.1, karat: "18K (750)", spotPrice: 3810, premiumPct: 5.0, finalPrice: 4000.50, status: "reserved" },
  { id: "d7", name: "5oz Gold Bar — Valcambi", description: "Valcambi suisse 5oz cast gold bar. Assay certified. Excellent pour lines and finish.", metal: "gold", category: "bar", weightOz: 5.0, karat: "24K (999)", spotPrice: 12100, premiumPct: 2.0, finalPrice: 12342.00, status: "available" },
  { id: "d8", name: "1/4oz Gold Krugerrand (1980)", description: "Classic South African Krugerrand. Light toning from age. Iconic Paul Kruger portrait.", metal: "gold", category: "coin", weightOz: 0.25, karat: "22K (917)", spotPrice: 605.00, premiumPct: 3.5, finalPrice: 626.18, status: "available" },
  { id: "d9", name: "Scrap 10K Gold Lot — 32g", description: "Mixed lot of 10K gold scrap jewelry. Chains, rings, and clasps. Verified by XRF. Sold by weight.", metal: "gold", category: "scrap", weightOz: 1.03, karat: "10K (417)", spotPrice: 1040, premiumPct: 1.5, finalPrice: 1055.60, status: "available" },
  { id: "d10", name: "1oz Gold Philharmonic (2026)", description: "Austrian Mint gold Philharmonic. Iconic musical instruments design. Sealed in original mint packaging.", metal: "gold", category: "coin", weightOz: 1.0, karat: "24K (999)", spotPrice: 2420, premiumPct: 3.0, finalPrice: 2492.60, status: "available" },
  { id: "d11", name: "100oz Silver Bar — RCM", description: "Royal Canadian Mint 100oz silver bar. Stamped with weight, purity, and serial number. Investment staple.", metal: "silver", category: "bar", weightOz: 100, karat: ".999 Fine", spotPrice: 2850, premiumPct: 2.0, finalPrice: 2907.00, status: "available" },
  { id: "d12", name: "1oz American Silver Eagle (2025)", description: "Type 2 design with enhanced eagle reverse. Perfect BU condition from US Mint tube.", metal: "silver", category: "coin", weightOz: 1.0, karat: ".999 Fine", spotPrice: 28.50, premiumPct: 4.5, finalPrice: 29.78, status: "available" },
  { id: "d13", name: "10oz Silver Pour Bar — Hand Poured", description: "Artisan hand-poured silver bar. Unique texture and pour lines. Stamped weight and purity.", metal: "silver", category: "bar", weightOz: 10, karat: ".999 Fine", spotPrice: 285, premiumPct: 3.0, finalPrice: 293.55, status: "available" },
  { id: "d14", name: "5oz Silver Round — Aztec Calendar", description: "Detailed Aztec calendar design in proof-like finish. Beautiful collectible silver round.", metal: "silver", category: "round", weightOz: 5.0, karat: ".999 Fine", spotPrice: 142.50, premiumPct: 4.0, finalPrice: 148.20, status: "reserved" },
  { id: "d15", name: "Sterling Silver Tea Set — 4pc", description: "Antique sterling silver tea service. Teapot, creamer, sugar, and tray. Hallmarked Birmingham 1897.", metal: "silver", category: "collectible", weightOz: 42.5, karat: ".925 Sterling", spotPrice: 1130, premiumPct: 5.0, finalPrice: 1186.50, status: "available" },
  { id: "d16", name: "20oz Silver Kilo-Cut Bar", description: "Cut from a 1 kilo bar. Clean edges, stamped purity. Great for stacking at lower premiums.", metal: "silver", category: "bar", weightOz: 20, karat: ".999 Fine", spotPrice: 570, premiumPct: 1.5, finalPrice: 578.55, status: "available" },
  { id: "d17", name: "1oz Silver Maple Leaf (2026)", description: "Royal Canadian Mint silver Maple Leaf. DNA anti-counterfeit technology. Radial lines finish.", metal: "silver", category: "coin", weightOz: 1.0, karat: ".9999 Fine", spotPrice: 28.50, premiumPct: 3.5, finalPrice: 29.50, status: "available" },
  { id: "d18", name: "Scrap Sterling Silver Flatware Lot", description: "48 pieces of mixed sterling flatware. Various patterns. Total weight 1,890g. Sold as-is for melt.", metal: "silver", category: "scrap", weightOz: 60.8, karat: ".925 Sterling", spotPrice: 1600, premiumPct: 1.0, finalPrice: 1616.00, status: "available" },
  { id: "d19", name: "1oz Platinum Eagle (2025)", description: "US Mint American Platinum Eagle. Proof of concept design. Brilliant uncirculated condition.", metal: "platinum", category: "coin", weightOz: 1.0, karat: ".9995 Fine", spotPrice: 960, premiumPct: 4.0, finalPrice: 998.40, status: "available" },
  { id: "d20", name: "5oz Platinum Bar — APMEX", description: "APMEX-branded 5oz platinum bar. Sealed in protective packaging with assay certificate.", metal: "platinum", category: "bar", weightOz: 5.0, karat: ".9995 Fine", spotPrice: 4800, premiumPct: 2.5, finalPrice: 4920.00, status: "available" },
  { id: "d21", name: "Platinum & Diamond Ring — Size 7", description: "Platinum engagement ring with 0.5ct center diamond. Tiffany-style setting.", metal: "platinum", category: "jewelry", weightOz: 0.21, karat: "950 Platinum", spotPrice: 200, premiumPct: 5.0, finalPrice: 210.00, status: "reserved" },
  { id: "d22", name: "1oz Platinum Maple Leaf (2024)", description: "Royal Canadian Mint platinum coin. Only 6,000 mintage. Hard to source in this condition.", metal: "platinum", category: "coin", weightOz: 1.0, karat: ".9995 Fine", spotPrice: 960, premiumPct: 4.5, finalPrice: 1003.20, status: "available" },
  { id: "d23", name: "1oz Palladium Eagle (2024)", description: "US Mint American Palladium Eagle. High-relief design. One of the lowest mintage US coins.", metal: "palladium", category: "coin", weightOz: 1.0, karat: ".9995 Fine", spotPrice: 980, premiumPct: 5.0, finalPrice: 1029.00, status: "available" },
  { id: "d24", name: "10oz Palladium Bar — Baird", description: "Baird & Co. palladium bar. London hallmarked. Investment-grade purity with serial number.", metal: "palladium", category: "bar", weightOz: 10, karat: ".9995 Fine", spotPrice: 9800, premiumPct: 2.0, finalPrice: 9996.00, status: "available" },
  { id: "d25", name: "1oz Palladium Maple Leaf (2023)", description: "Royal Canadian Mint palladium coin. Extremely limited mintage.", metal: "palladium", category: "coin", weightOz: 1.0, karat: ".9995 Fine", spotPrice: 980, premiumPct: 3.5, finalPrice: 1014.30, status: "available" },
]

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val)
