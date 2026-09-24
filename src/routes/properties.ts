import { Hono } from "hono";
import fs from "fs/promises";
import propertyValidator from "../validators/propertyValidator.js";
import propertyParamValidator from "../validators/propertyParamValidator.js";

const propertyApp = new Hono({ strict: false });

propertyApp.get("/", async (c) => {
  try {
    const data = await fs.readFile("src/data/properties.json", "utf8");
    const properties: Property[] = JSON.parse(data);

    return c.json(properties);
  } catch (error) {
    return c.json([]);
  }
});

propertyApp.get("/:id", propertyParamValidator, async (c) => {
  // const propertyId = c.req.param("id");
  const { id } = c.req.valid("param");

  try {
    const data = await fs.readFile("src/data/properties.json", "utf8");
    const properties: Property[] = JSON.parse(data);

    const property = properties.find((p) => p.property_id === id /* eller propertyId */ );

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    return c.json(property);
  } catch (error) {
    return c.json({ error: "Failed to read properties" }, 400);
  }
});

propertyApp.post("/", propertyValidator, async (c) => {
  try {
    const property: NewProperty = c.req.valid("json");

    const data = await fs
      .readFile("src/data/properties.json", "utf8")
      .catch(() => "[]");
    const properties: NewProperty[] = JSON.parse(data);

    const newProperty: Property = {
      property_id: `property_${Math.floor(1000 + Math.random() * 9000)}`,
      ...property,
    };

    properties.push(newProperty);

    await fs.writeFile(
      "src/data/properties.json",
      JSON.stringify(properties, null, 2),
    );

    return c.json(newProperty, 201);
  } catch (error) {
    return c.json({ error: "Failed to create property" }, 400);
  }
});

propertyApp.put(
  "/:id",
  propertyParamValidator,
  propertyValidator,
  async (c) => {
    const { id } = c.req.valid("param");

    try {
      const data = await fs
        .readFile("src/data/properties.json", "utf8")
        .catch(() => "[]");
      let properties: Property[] = JSON.parse(data);

      const index = properties.findIndex((p) => p.property_id === id);

      if (index === -1) {
        return c.json({ error: "Property not found" }, 404);
      }

      const body = c.req.valid("json") as NewProperty;

      const updatedProperty: Property = {
        property_id: id,
        ...body,
      };

      properties[index] = updatedProperty;
      await fs.writeFile(
        "src/data/properties.json",
        JSON.stringify(properties, null, 2),
      );

      return c.json(updatedProperty);
    } catch (error) {
      return c.json({ error: "Failed to update property" }, 400);
    }
  },
);

propertyApp.delete("/:id", propertyParamValidator, async (c) => {
  const { id } = c.req.valid("param");

  try {
    const data = await fs
      .readFile("src/data/properties.json", "utf8")
      .catch(() => "[]");
    let properties: Property[] = JSON.parse(data);

    const index = properties.findIndex((p) => p.property_id === id);

    if (index === -1) {
      return c.json({ error: "Property not found" }, 404);
    }

    properties.splice(index, 1);

    await fs.writeFile(
      "src/data/properties.json",
      JSON.stringify(properties, null, 2),
    );

    return c.json({ message: "Property deleted" });
  } catch (error) {
    return c.json({ error: "Failed to delete property" }, 400);
  }
});

export default propertyApp;
