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
import type { PropertyBody } from "../types/property.js";
import { handleRouteError } from "../utils/handleRouteError.js";

const properties = new Hono({ strict: false });

properties.get("/me", requireAuth, async (c) => {
  try {
    const supabase = c.get("supabase");
    const user = getAuthUser(c);

    const myProperties = await db.getPropertiesByUserId(supabase, user.id);

    return c.json(myProperties, 200);
  } catch (error) {
    return handleRouteError(c, error, "Failed to fetch your properties");
  }
});

properties.get("/", propertyQueryValidator, async (c) => {
  const filters = c.req.valid("query");

  try {
    const supabase = c.get("supabase");

    const fetchedProperties = await db.getProperties(supabase, filters);

    return c.json(fetchedProperties);
  } catch (error) {
    return handleRouteError(c, error, "Failed to fetch properties");
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
      return handleRouteError(c, error, "Failed to fetch properties by kind");
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
    return handleRouteError(c, error, "Failed to fetch property");
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
    return handleRouteError(c, error, "Failed to create property");
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
      return handleRouteError(c, error, "Failed to update property");
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
      return handleRouteError(c, error, "Failed to update property");
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
      return handleRouteError(c, error, "Failed to delete property");
    }
  },
);

export default properties;
