import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Directly use the provided Supabase connection string for reliability
const DATABASE_URL = "postgresql://postgres.vytalqidugybpybcnzbk:NswtD6HN9Ysl9Ny8@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows ? res.rows[0].now : 'unknown time');
  }
});

export const db = drizzle(pool, { schema });
