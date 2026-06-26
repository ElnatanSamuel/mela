const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function check() {
  try {
    const res = await sql`SELECT count(*) FROM audit_logs`;
    console.log('Audit Log Count:', res[0].count);
    
    const logs = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5`;
    console.log('Latest Logs:', JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await sql.end();
  }
}

check();
