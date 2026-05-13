import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function test() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ No DATABASE_URL found');
    return;
  }

  console.log('🔗 Attempting to connect to:', url.replace(/:([^@]+)@/, ':****@'));

  const sql = postgres(url, { ssl: 'require', connect_timeout: 10 });

  try {
    const result = await sql`SELECT 1 as connected`;
    console.log('✅ Success!', result);
  } catch (err: any) {
    console.error('❌ Connection Failed!');
    console.error('Error Code:', err.code);
    console.error('Message:', err.message);
  } finally {
    await sql.end();
  }
}

test();
