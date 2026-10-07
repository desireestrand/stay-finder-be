import { Hono } from "hono";
import * as db from "../database/property.js";
import {
  propertyValidator,
  propertyOptionalValidator,
} from "../validators/propertyValidator.js";
import { propertyKindParamValidator, propertyParamValidator } from "../validators/propertyParamValidator.js";
import { propertyQueryValidator } from "../validators/propertyQueryValidator.js";
import { requireAuth } from "../middleware/auth.js";

const properties = new Hono({ strict: false });

properties.get("/", propertyQueryValidator, async (c) => {
  const query = c.req.valid("query");

  try {
    const supabase = c.get("supabase");

    const properties = await db.getProperties(supabase, query);

    return c.json(properties);
  } catch (error) {
    return c.json(
      {
        data: [],
        count: 0,
        offset: query.offset,
        limit: query.limit,
        error: "Failed to fetch properties",
      },
      500,
    );
  }
});

properties.get("/kind/:kind", propertyKindParamValidator, propertyQueryValidator, async (c) => {
  try {
    const supabase = c.get("supabase");

    const { kind } = c.req.valid("param");

    const query = c.req.valid("query");

    const properties = await db.getPropertiesByKind(supabase, kind, query);

    return c.json(properties);
  } catch (error) {
    return c.json({ error: "Failed to fetch properties by kind" }, 500);
  }
});

properties.get("/:id", propertyParamValidator, async (c) => {
  try {
    const supabase = c.get("supabase");

    const { id } = c.req.valid("param");

    const property = await db.getPropertyById(supabase, id);

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    return c.json(property);
  } catch (error) {
    return c.json({ error: "Failed to fetch property" }, 500);
  }
});

properties.post("/", requireAuth, propertyValidator, async (c) => {
  try {
    const supabase = c.get("supabase");

    const body: NewProperty = c.req.valid("json");

    const property = await db.createProperty(supabase, body);

    return c.json(property, 201);
  } catch (error) {
    return c.json({ error: "Failed to create property" }, 400);
  }
});

properties.patch(
  "/:id",
  requireAuth,
  propertyParamValidator,
  propertyOptionalValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");

      const { id } = c.req.valid("param");

      const updates = c.req.valid("json");

      const updatedProperty = await db.patchProperty(supabase, id, updates);

      if (!updatedProperty) {
        return c.json({ error: "Property not found" }, 404);
      }

      return c.json(updatedProperty);
    } catch (error) {
      return c.json({ error: "Failed to update property" }, 400);
    }
  },
);

properties.put(
  "/:id",
  requireAuth,
  propertyParamValidator,
  propertyValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");

      const { id } = c.req.valid("param");

      const body: NewProperty = c.req.valid("json");

      const updatedProperty = await db.updateProperty(supabase, id, body);

      if (!updatedProperty) {
        return c.json({ error: "Property not found" }, 404);
      }

      return c.json(updatedProperty);
    } catch (error) {
      return c.json({ error: "Failed to update property" }, 400);
    }
  },
);

properties.delete("/:id", requireAuth, propertyParamValidator, async (c) => {
  try {
    const supabase = c.get("supabase");

    const { id } = c.req.valid("param");

    const deletedProperty = await db.deleteProperty(supabase, id);

    if (!deletedProperty) {
      return c.json({ error: "Property not found" }, 404);
    }

    return c.json(
      { message: "Property deleted", property: deletedProperty },
      200,
    );
  } catch (error) {
    return c.json({ error: "Failed to delete property" }, 500);
  }
});

export default properties;