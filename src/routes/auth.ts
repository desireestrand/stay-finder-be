import { Hono } from "hono";
import { authValidator } from "../validators/authValidator.js";
import { requireAuth } from "../middleware/auth.js";
import * as dbAuth from "../database/auth.js";
import { handleRouteError } from "../utils/handleRouteError.js";

const auth = new Hono({ strict: false });

auth.post("/register", authValidator, async (c) => {
  try {
    const { email, password } = c.req.valid("json");
    const supabase = c.get("supabase");

    const data = await dbAuth.signUpUser(supabase, email, password);

    return c.json({ user: data.user }, 201);
  } catch (error) {
    return handleRouteError(c, error, "Failed to register user");
  }
});

auth.post("/login", authValidator, async (c) => {
  try {
    const { email, password } = c.req.valid("json");
    const supabase = c.get("supabase");

    const data = await dbAuth.signInUser(supabase, email, password);

    return c.json({ user: data.user }, 200);
  } catch (error) {
    return handleRouteError(c, error, "Failed to log in user");
  }
});

auth.get("/me", requireAuth, async (c) => {
  try {
    const user = c.get("user");

    return c.json({ user });
  } catch (error) {
    return handleRouteError(c, error, "Failed to fetch user");
  }
});

auth.post("/logout", requireAuth, async (c) => {
  try {
    const supabase = c.get("supabase");

    await dbAuth.signOutUser(supabase);

    c.set("user", null);

    return c.json({ message: "Logged out" });
  } catch (error) {
    return handleRouteError(c, error, "Failed to log out user");
  }
});

export default auth;
