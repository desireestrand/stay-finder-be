import { Hono } from "hono";
import * as db from "../database/properties.js";
import { propertyValidator, propertyOptionalValidator } from "../validators/propertyValidator.js";
import propertyParamValidator from "../validators/propertyParamValidator.js";

const propertyApp = new Hono({ strict: false });

propertyApp.get("/", async (c) => {
  try {
    const properties = await db.getProperties();

    return c.json(properties);
  } catch (error) {
    return c.json({ error: "Failed to fetch properties" }, 500);
  }
});

propertyApp.get("/:id", propertyParamValidator, async (c) => {
  try {
    const { id } = c.req.valid("param");

    const property = await db.getPropertyById(id);

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    return c.json(property);
  } catch (error) {
    return c.json({ error: "Failed to fetch property" }, 500);
  }
});

propertyApp.post("/", propertyValidator, async (c) => {
  try {
    const newProperty: NewProperty = c.req.valid("json");

    const property = await db.createProperty(newProperty);

    return c.json(property, 201);
  } catch (error) {
    return c.json({ error: "Failed to create property" }, 400);
  }
});

propertyApp.put("/:id", propertyParamValidator, propertyValidator, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const body: NewProperty = c.req.valid("json");
    
    const updatedProperty = await db.updateProperty(id, body);

    if (!updatedProperty) {
      return c.json({ error: "Property not found" }, 404);
    }

    return c.json(updatedProperty);
  } catch (error) {
    return c.json({ error: "Failed to update property" }, 400);
  }
});

propertyApp.delete("/:id", propertyParamValidator, async (c) => {
  try {
    const { id } = c.req.valid("param");

    const deletedProperty = await db.deleteProperty(id);

    if (!deletedProperty) {
      return c.json({ error: "Property not found" }, 404);
    }

    return c.json({ message: "Property deleted", property: deletedProperty }, 200);
  } catch (error) {
    return c.json({ error: "Failed to delete property" }, 500);
  }
});

export default propertyApp;
