import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows: tables } = await client.query(`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  ORDER BY tablename`);

// Rows are kept as JSON *text* so decimals, dates and bigints are not altered by JS.
const out = {};
for (const { tablename } of tables) {
    const { rows } = await client.query(`SELECT row_to_json(t)::text AS r FROM "${tablename}" t`);
    out[tablename] = rows.map((x) => x.r);
    console.log(tablename.padEnd(35), rows.length);
}

fs.mkdirSync('backups', { recursive: true });
const file = `backups/backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(file, JSON.stringify(out));
console.log('\nSaved', file);
await client.end();
