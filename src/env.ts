import dotenv from "dotenv";

dotenv.config();

function getEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

function assertNotPrivilegedKey(key: string): void {
  if (key.startsWith("sb_secret_")) {
    throw new Error(
      "SUPABASE_PUBLISHABLE_KEY is a secret key. Use the publishable/anon key instead.",
    );
  }

  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString("utf8"),
      );

      if (payload.role === "service_role") {
        throw new Error(
          "SUPABASE_PUBLISHABLE_KEY is a service_role key. Use the anon key instead.",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("service_role")) {
        throw error;
      }
    }
  }
}

const supabasePublishableKey = getEnv("SUPABASE_PUBLISHABLE_KEY");
assertNotPrivilegedKey(supabasePublishableKey);

export const env = {
  supabaseUrl: getEnv("SUPABASE_URL"),
  supabasePublishableKey,
  honoPort: Number(process.env.HONO_PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3001",
  nodeEnv: process.env.NODE_ENV || "development",
};
