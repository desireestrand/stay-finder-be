import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { BasicSupabaseClient } from "../types/supabase.js";

export async function signUpUser(
  supabase: BasicSupabaseClient,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signInUser(
  supabase: BasicSupabaseClient,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error("Invalid credentials");
  }

  return data;
}

export async function signOutUser(supabase: BasicSupabaseClient) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}