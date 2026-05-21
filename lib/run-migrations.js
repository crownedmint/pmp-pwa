import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

let connectionString = '';
for (const line of lines) {
  if (line.trim().startsWith('DATABASE_CONNECTION_URL=')) {
    connectionString = line.split('DATABASE_CONNECTION_URL=')[1].trim();
    break;
  }
}

if (!connectionString) {
  console.error('❌ DATABASE_CONNECTION_URL is not defined in .env');
  process.exit(1);
}

connectionString = connectionString.replace(/^["']|["']$/g, '');

const SEED_CATALOG = [
  { id: "d1", name: "1oz American Gold Eagle (2024)", description: "Brilliant uncirculated condition. Classic Lady Liberty obverse with family of eagles reverse. Minted at West Point.", metal: "gold", category: "coin", weight: 1.0, purity: "22K (917)", price: 2420, premium: 4.5, is_reserved: false },
  { id: "d2", name: "1/2oz Canadian Gold Maple Leaf", description: "Pure .9999 fine gold with micro-engraved maple leaf security feature. BU condition in mint capsule.", metal: "gold", category: "coin", weight: 0.5, purity: "24K (999)", price: 1210, premium: 3.8, is_reserved: false },
  { id: "d3", name: "10oz Gold Bar — PAMP Suisse", description: "PAMP Suisse Lady Fortuna design. Sealed in assay card with serial number. Investment-grade bar.", metal: "gold", category: "bar", weight: 10, purity: "24K (999)", price: 24200, premium: 2.5, is_reserved: false },
  { id: "d4", name: "14K Gold Cuban Link Chain — 24\"", description: "Solid 14K yellow gold Cuban link chain. 24 inches, 45 grams. Italian craftsmanship with box clasp.", metal: "gold", category: "jewelry", weight: 1.45, purity: "14K (583)", price: 2040, premium: 5.0, is_reserved: false },
  { id: "d5", name: "1oz Gold Buffalo (2025)", description: "Pure 24K American Gold Buffalo. First .9999 fine gold coin struck by the US Mint. Proof-like surfaces.", metal: "gold", category: "coin", weight: 1.0, purity: "24K (999)", price: 2420, premium: 4.0, is_reserved: false },
  { id: "d6", name: "Vintage 18K Gold Pocket Watch", description: "Circa 1920 Swiss-made pocket watch in 18K gold case. Working condition. Hunt-case with engraved cover.", metal: "gold", category: "collectible", weight: 2.1, purity: "18K (750)", price: 3810, premium: 5.0, is_reserved: true },
  { id: "d7", name: "5oz Gold Bar — Valcambi", description: "Valcambi suisse 5oz cast gold bar. Assay certified. Excellent pour lines and finish.", metal: "gold", category: "bar", weight: 5.0, purity: "24K (999)", price: 12100, premium: 2.0, is_reserved: false },
  { id: "d8", name: "1/4oz Gold Krugerrand (1980)", description: "Classic South African Krugerrand. Light toning from age. Iconic Paul Kruger portrait.", metal: "gold", category: "coin", weight: 0.25, purity: "22K (917)", price: 605.00, premium: 3.5, is_reserved: false },
  { id: "d9", name: "Scrap 10K Gold Lot — 32g", description: "Mixed lot of 10K gold scrap jewelry. Chains, rings, and clasps. Verified by XRF. Sold by weight.", metal: "gold", category: "scrap", weight: 1.03, purity: "10K (417)", price: 1040, premium: 1.5, is_reserved: false },
  { id: "d10", name: "1oz Gold Philharmonic (2026)", description: "Austrian Mint gold Philharmonic. Iconic musical instruments design. Sealed in original mint packaging.", metal: "gold", category: "coin", weight: 1.0, purity: "24K (999)", price: 2420, premium: 3.0, is_reserved: false },
  { id: "d11", name: "100oz Silver Bar — RCM", description: "Royal Canadian Mint 100oz silver bar. Stamped with weight, purity, and serial number. Investment staple.", metal: "silver", category: "bar", weight: 100, purity: ".999 Fine", price: 2850, premium: 2.0, is_reserved: false },
  { id: "d12", name: "1oz American Silver Eagle (2025)", description: "Type 2 design with enhanced eagle reverse. Perfect BU condition from US Mint tube.", metal: "silver", category: "coin", weight: 1.0, purity: ".999 Fine", price: 28.50, premium: 4.5, is_reserved: false },
  { id: "d13", name: "10oz Silver Pour Bar — Hand Poured", description: "Artisan hand-poured silver bar. Unique texture and pour lines. Stamped weight and purity.", metal: "silver", category: "bar", weight: 10, purity: ".999 Fine", price: 285, premium: 3.0, is_reserved: false },
  { id: "d14", name: "5oz Silver Round — Aztec Calendar", description: "Detailed Aztec calendar design in proof-like finish. Beautiful collectible silver round.", metal: "silver", category: "round", weight: 5.0, purity: ".999 Fine", price: 142.50, premium: 4.0, is_reserved: true },
  { id: "d15", name: "Sterling Silver Tea Set — 4pc", description: "Antique sterling silver tea service. Teapot, creamer, sugar, and tray. Hallmarked Birmingham 1897.", metal: "silver", category: "collectible", weight: 42.5, purity: ".925 Sterling", price: 1130, premium: 5.0, is_reserved: false },
  { id: "d16", name: "20oz Silver Kilo-Cut Bar", description: "Cut from a 1 kilo bar. Clean edges, stamped purity. Great for stacking at lower premiums.", metal: "silver", category: "bar", weight: 20, purity: ".999 Fine", price: 570, premium: 1.5, is_reserved: false },
  { id: "d17", name: "1oz Silver Maple Leaf (2026)", description: "Royal Canadian Mint silver Maple Leaf. DNA anti-counterfeit technology. Radial lines finish.", metal: "silver", category: "coin", weight: 1.0, purity: ".9999 Fine", price: 28.50, premium: 3.5, is_reserved: false },
  { id: "d18", name: "Scrap Sterling Silver Flatware Lot", description: "48 pieces of mixed sterling flatware. Various patterns. Total weight 1,890g. Sold as-is for melt.", metal: "silver", category: "scrap", weight: 60.8, purity: ".925 Sterling", price: 1600, premium: 1.0, is_reserved: false },
  { id: "d19", name: "1oz Platinum Eagle (2025)", description: "US Mint American Platinum Eagle. Proof of concept design. Brilliant uncirculated condition.", metal: "platinum", category: "coin", weight: 1.0, purity: ".9995 Fine", price: 960, premium: 4.0, is_reserved: false },
  { id: "d20", name: "5oz Platinum Bar — APMEX", description: "APMEX-branded 5oz platinum bar. Sealed in protective packaging with assay certificate.", metal: "platinum", category: "bar", weight: 5.0, purity: ".9995 Fine", price: 4800, premium: 2.5, is_reserved: false },
  { id: "d21", name: "Platinum & Diamond Ring — Size 7", description: "Platinum engagement ring with 0.5ct center diamond. Tiffany-style setting.", metal: "platinum", category: "jewelry", weight: 0.21, purity: "950 Platinum", price: 200, premium: 5.0, is_reserved: true },
  { id: "d22", name: "1oz Platinum Maple Leaf (2024)", description: "Royal Canadian Mint platinum coin. Only 6,000 mintage. Hard to source in this condition.", metal: "platinum", category: "coin", weight: 1.0, purity: ".9995 Fine", price: 960, premium: 4.5, is_reserved: false },
  { id: "d23", name: "1oz Palladium Eagle (2024)", description: "US Mint American Palladium Eagle. High-relief design. One of the lowest mintage US coins.", metal: "palladium", category: "coin", weight: 1.0, purity: ".9995 Fine", price: 980, premium: 5.0, is_reserved: false },
  { id: "d24", name: "10oz Palladium Bar — Baird", description: "Baird & Co. palladium bar. London hallmarked. Investment-grade purity with serial number.", metal: "palladium", category: "bar", weight: 10, purity: ".9995 Fine", price: 9800, premium: 2.0, is_reserved: false },
  { id: "d25", name: "1oz Palladium Maple Leaf (2023)", description: "Royal Canadian Mint palladium coin. Extremely limited mintage.", metal: "palladium", category: "coin", weight: 1.0, purity: ".9995 Fine", price: 980, premium: 3.5, is_reserved: false },
];

const pool = new pg.Pool({
  connectionString,
});

async function main() {
  try {
    console.log('🔄 Executing migrations...');
    const migrationsSqlPath = path.join(__dirname, 'migrations.sql');
    const sql = fs.readFileSync(migrationsSqlPath, 'utf-8');
    
    await pool.query(sql);
    console.log('✅ Migrations applied successfully.');

    console.log('🌱 Checking catalog seeding...');
    const checkCatalog = await pool.query('SELECT COUNT(*) FROM public.catalog_items');
    const count = parseInt(checkCatalog.rows[0].count, 10);
    
    if (count === 0) {
      console.log('Seeding 25 catalog items...');
      for (const item of SEED_CATALOG) {
        await pool.query(
          `INSERT INTO public.catalog_items 
           (id, name, description, weight, purity, metal, category, price, premium, is_reserved)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [item.id, item.name, item.description, item.weight, item.purity, item.metal, item.category, item.price, item.premium, item.is_reserved]
        );
      }
      console.log('✅ Seeding completed.');
    } else {
      console.log(`ℹ️ Catalog already has ${count} items. Skipping seed.`);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error executing migrations/seed:', error);
    process.exit(1);
  }
}

main();
