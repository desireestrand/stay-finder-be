import { Hono } from "hono";
import { authValidator } from "../validators/authValidator.js";
import { requireAuth } from "../middleware/auth.js";
import * as dbAuth from "../database/auth.js";
import { AppError } from "../utils/error.js";

const auth = new Hono({ strict: false });

auth.post("/register", authValidator, async (c) => {
  try {
    const { email, password } = c.req.valid("json");
    const supabase = c.get("supabase");

    const data = await dbAuth.signUpUser(supabase, email, password);

    return c.json({ user: data.user }, 201);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`[AppError] ${error.statusCode} - ${error.message}`);
      return c.json({ error: error.message }, error.statusCode as any);
    }

    console.error("Unexpected error in POST /auth/register:", error);
    
    const message =
      error instanceof Error ? error.message : "Failed to register user";
    return c.json({ error: message }, 400);
  }
});

auth.post("/login", authValidator, async (c) => {
  try {
    const { email, password } = c.req.valid("json");
    const supabase = c.get("supabase");

    const data = await dbAuth.signInUser(supabase, email, password);

    return c.json({ user: data.user }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`[AppError] ${error.statusCode} - ${error.message}`);
      return c.json({ error: error.message }, error.statusCode as any);
    }

    console.error("Unexpected error in POST /auth/login:", error);
    
    const message =
      error instanceof Error ? error.message : "Failed to log in user";
    return c.json({ error: message }, 401);
  }
});

auth.get("/me", requireAuth, async (c) => {
  try {
    const user = c.get("user");

    return c.json({ user });
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`[AppError] ${error.statusCode} - ${error.message}`);
      return c.json({ error: error.message }, error.statusCode as any);
    }
    
    console.error("Unexpected error in GET /auth/me:", error);
    
    const message =
      error instanceof Error ? error.message : "Failed to fetch user";
    return c.json({ error: message }, 500);
  }
});

auth.post("/logout", requireAuth, async (c) => {
  try {
    const supabase = c.get("supabase");

    await dbAuth.signOutUser(supabase);

    c.set("user", null);

    return c.json({ message: "Logged out" });
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`[AppError] ${error.statusCode} - ${error.message}`);
      return c.json({ error: error.message }, error.statusCode as any);
    }
    
    console.error("Unexpected error in POST /auth/logout:", error);
    
    const message =
      error instanceof Error ? error.message : "Failed to log out user";
    return c.json({ error: message }, 400);
  }
});

export default auth;
