import { serve } from "@hono/node-server";
import { Hono } from "hono";
import dotenv from "dotenv";
import { prettyJSON } from "hono/pretty-json";
import propertyApp from "./routes/properties.js";
import bookingApp from "./routes/bookings.js";

dotenv.config();

const app = new Hono({ strict: false });

app.use(prettyJSON());

app.get("/", (c) => {
  return c.json({
    name: "StayFinder API"
  });
});

app.route("/properties", propertyApp);
app.route("/bookings", bookingApp);

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.HONO_PORT) || 3000  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);