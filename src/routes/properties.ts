import { Hono } from "hono";
import * as db from "../database/properties.js";
import {
  propertyValidator,
  propertyOptionalValidator,
} from "../validators/propertyValidator.js";
import {
  propertyKindParamValidator,
  propertyParamValidator,
} from "../validators/propertyParamValidator.js";
import { propertyQueryValidator } from "../validators/propertyQueryValidator.js";
import { requireAuth, getAuthUser } from "../middleware/auth.js";
import type { NewProperty, PropertyBody } from "../types/property.js";
import { AppError } from "../utils/error.js";

const properties = new Hono({ strict: false });

properties.get("/me", requireAuth, async (c) => {
  try {
    const supabase = c.get("supabase");
    const user = getAuthUser(c);

    const myProperties = await db.getPropertiesByUserId(supabase, user.id);

    return c.json(myProperties, 200);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`[AppError] ${error.statusCode} - ${error.message}`);
      return c.json({ error: error.message }, error.statusCode as any);
    }

    console.error("Unexpected error in GET /properties/me:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch your properties";
    return c.json({ error: message }, 500);
  }
});

properties.get("/", propertyQueryValidator, async (c) => {
  const filters = c.req.valid("query");

  try {
    const supabase = c.get("supabase");

    const fetchedProperties = await db.getProperties(supabase, filters);

    return c.json(fetchedProperties);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`[AppError] ${error.statusCode} - ${error.message}`);
      return c.json({ error: error.message }, error.statusCode as any);
    }

    console.error("Unexpected error in GET /properties:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch properties";
    return c.json(
      {
        data: [],
        count: 0,
        offset: filters.offset,
        limit: filters.limit,
        error: message,
      },
      500,
    );
  }
});

properties.get(
  "/kind/:kind",
  propertyKindParamValidator,
  propertyQueryValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");
      const { kind } = c.req.valid("param");
      const filters = c.req.valid("query");

      const fetchedProperties = await db.getPropertiesByKind(
        supabase,
        kind,
        filters,
      );

      return c.json(fetchedProperties);
    } catch (error) {
      if (error instanceof AppError) {
        console.error(`[AppError] ${error.statusCode} - ${error.message}`);
        return c.json({ error: error.message }, error.statusCode as any);
      }

      console.error("Unexpected error in GET /properties/kind/:kind:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch properties by kind";
      return c.json({ error: message }, 500);
    }
  },
);

properties.get("/:propertyId", propertyParamValidator, async (c) => {
  try {
    const supabase = c.get("supabase");
    const { propertyId } = c.req.valid("param");

    const property = await db.getPropertyById(supabase, propertyId);

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    return c.json(property);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`[AppError] ${error.statusCode} - ${error.message}`);
      return c.json({ error: error.message }, error.statusCode as any);
    }

    console.error("Unexpected error in GET /properties/:propertyId:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch property";
    return c.json({ error: message }, 500);
  }
});

properties.post("/", requireAuth, propertyValidator, async (c) => {
  try {
    const supabase = c.get("supabase");
    const body: PropertyBody = c.req.valid("json");
    const user = getAuthUser(c);

    const property = await db.createProperty(supabase, {
      ...body,
      user_id: user.id,
    });

    return c.json(property, 201);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`[AppError] ${error.statusCode} - ${error.message}`);
      return c.json({ error: error.message }, error.statusCode as any);
    }

    console.error("Unexpected error in POST /properties:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create property";
    return c.json({ error: message }, 400);
  }
});

properties.patch(
  "/:propertyId",
  requireAuth,
  propertyParamValidator,
  propertyOptionalValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");
      const { propertyId } = c.req.valid("param");
      const updates: Partial<PropertyBody> = c.req.valid("json");

      const updatedProperty = await db.patchPropertyById(
        supabase,
        propertyId,
        updates,
      );

      if (!updatedProperty) {
        return c.json({ error: "Property not found" }, 404);
      }

      return c.json(updatedProperty);
    } catch (error) {
      if (error instanceof AppError) {
        console.error(`[AppError] ${error.statusCode} - ${error.message}`);
        return c.json({ error: error.message }, error.statusCode as any);
      }

      console.error(
        "Unexpected error in PATCH /properties/:propertyId:",
        error,
      );

      const message =
        error instanceof Error ? error.message : "Failed to update property";
      return c.json({ error: message }, 400);
    }
  },
);

properties.put(
  "/:propertyId",
  requireAuth,
  propertyParamValidator,
  propertyValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");
      const { propertyId } = c.req.valid("param");
      const body: PropertyBody = c.req.valid("json");
      const user = getAuthUser(c);

      const updatedProperty = await db.updatePropertyById(
        supabase,
        propertyId,
        {
          ...body,
          user_id: user.id,
        },
      );

      if (!updatedProperty) {
        return c.json({ error: "Property not found" }, 404);
      }

      return c.json(updatedProperty);
    } catch (error) {
      if (error instanceof AppError) {
        console.error(`[AppError] ${error.statusCode} - ${error.message}`);
        return c.json({ error: error.message }, error.statusCode as any);
      }

      console.error("Unexpected error in PUT /properties/:propertyId:", error);

      const message =
        error instanceof Error ? error.message : "Failed to update property";
      return c.json({ error: message }, 400);
    }
  },
);

properties.delete(
  "/:propertyId",
  requireAuth,
  propertyParamValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");
      const { propertyId } = c.req.valid("param");

      const deletedProperty = await db.deletePropertyById(supabase, propertyId);

      if (!deletedProperty) {
        return c.json({ error: "Property not found" }, 404);
      }

      return c.json(
        { message: "Property deleted", property: deletedProperty },
        200,
      );
    } catch (error) {
      if (error instanceof AppError) {
        console.error(`[AppError] ${error.statusCode} - ${error.message}`);
        return c.json({ error: error.message }, error.statusCode as any);
      }

      console.error(
        "Unexpected error in DELETE /properties/:propertyId:",
        error,
      );

      const message =
        error instanceof Error ? error.message : "Failed to delete property";
      return c.json({ error: message }, 500);
    }
  },
);

export default properties;
