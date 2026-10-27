import type { BasicSupabaseClient } from "../types/supabase.js";
import { badRequest, AppError } from "../utils/error.js";

export async function signUpUser(
  supabase: BasicSupabaseClient,
  email: string,
  password: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw badRequest(error.message, "SIGNUP_FAILED");
  }

  return data;
}

export async function signInUser(
  supabase: BasicSupabaseClient,
  email: string,
  password: string,
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
  }

  return data;
}

export async function signOutUser(supabase: BasicSupabaseClient) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw badRequest(error.message, "SIGNOUT_FAILED");
  }
}
