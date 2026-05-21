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

const pool = new pg.Pool({
  connectionString,
});

async function main() {
  try {
    console.log('🔄 Executing Migrations V2 (Vault Goals & Custom Alerts)...');
    const migrationsSqlPath = path.join(__dirname, 'migrations-v2.sql');
    const sql = fs.readFileSync(migrationsSqlPath, 'utf-8');
    
    await pool.query(sql);
    console.log('✅ Migrations V2 applied successfully.');

    await pool.end();
  } catch (error) {
    console.error('❌ Error executing migrations v2:', error);
    process.exit(1);
  }
}

main();
