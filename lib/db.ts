import { Pool } from "pg"

const globalForPg = globalThis as unknown as { 
  pgPool: Pool | undefined;
  pgPricingPool: Pool | undefined;
}

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_CONNECTION_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

export const pricingPool =
  globalForPg.pgPricingPool ??
  new Pool({
    connectionString: process.env.PRICING_DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool
  globalForPg.pgPricingPool = pricingPool
}
