import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

// Use a global variable to store the connection in development to prevent 
// creating a new connection on every hot-reload.
const globalForPostgres = global as unknown as {
  client: postgres.Sql<{}> | undefined;
};

// Disable prefetch as it is not supported for "Transaction" mode in Supabase/PgBouncer
const client = globalForPostgres.client ?? postgres(connectionString, { 
  prepare: false, 
  ssl: 'require',
  max: 1 // Keep connections low for this dev environment
});

if (process.env.NODE_ENV !== 'production') globalForPostgres.client = client;

export const db = drizzle(client, { schema });
