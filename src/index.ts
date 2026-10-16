import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { env } from "./env.js";
import { optionalAuth } from "./middleware/auth.js";
import auth from "./routes/auth.js";
import properties from "./routes/properties.js";
import bookings from "./routes/bookings.js";
import { prettyJSON } from "hono/pretty-json";

const app = new Hono({ strict: false });

app.use(prettyJSON());

app.use(
  "*",
  cors({
    origin: env.frontendUrl,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.use("*", optionalAuth);

app.get("/", (c) => {
  return c.json({
    name: "StayFinder API",
  });
});

app.route("/auth", auth);
app.route("/properties", properties);
app.route("/bookings", bookings);

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json(
      {
        error: error.message,
      },
      error.status,
    );
  }

  return c.json(
    {
      error: "Internal server error",
    },
    500,
  );
});

serve(
  {
    fetch: app.fetch,
    port: env.honoPort,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
