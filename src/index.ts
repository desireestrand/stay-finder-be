import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./env.js";
import { prettyJSON } from "hono/pretty-json";

import propertyApp from "./routes/properties.js";
import bookingApp from "./routes/bookings.js";

const app = new Hono({ strict: false });

app.use(prettyJSON());

app.get("/", (c) => {
  return c.json({
    name: "StayFinder API",
  });
});

app.route("/properties", propertyApp);
app.route("/bookings", bookingApp);

serve(
  {
    fetch: app.fetch,
    port: env.honoPort,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
