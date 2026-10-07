import { createClient } from "@supabase/supabase-js";
import { env } from "../env.js";

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseKey
);

export const supabaseUrl = env.supabaseUrl;
export const supabaseKey = env.supabaseKey;