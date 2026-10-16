import dotenv from "dotenv";

dotenv.config();

function getEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const env = {
  supabaseUrl: getEnv("SUPABASE_URL"),
  supabaseKey: getEnv("SUPABASE_KEY"),
  honoPort: Number(process.env.HONO_PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3001",
  nodeEnv: process.env.NODE_ENV || "development",
};
