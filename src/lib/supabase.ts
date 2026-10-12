import { createClient } from "@supabase/supabase-js";
import { env } from "../env.js";
import type { Database } from "../types/database.types.js";

export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseKey
);

export const supabaseUrl = env.supabaseUrl;
export const supabaseKey = env.supabaseKey;