import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export const DATABASE_URL = "postgresql://postgres.vytalqidugybpybcnzbk:NswtD6HN9Ysl9Ny8@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
