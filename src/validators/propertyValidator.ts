import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  price_per_night: z.number().int().positive("Price must be greater than 0"),
  max_guests: z.number().int().positive("Max guests must be greater than 0")
});

const propertyValidator = zValidator("json", propertySchema, (result, c) => {
  if (!result.success) {
    return c.json({ errors: result.error.issues }, 400);
  }
});

export default propertyValidator;