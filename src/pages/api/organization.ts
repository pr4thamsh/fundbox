import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
  NewOrganization,
  Organization,
  organizations,
} from "@/db/schema/organization";
type CreateOrganizationBody = {
  name: string;
  street: string;
  postalCode: string;
};

type UpdateOrganizationBody = Partial<CreateOrganizationBody>;

type ResponseData = {
  message: string;
  data?: Organization | Organization[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  switch (req.method) {
    case "GET":
      if (req.query.id) {
        return getOrganization(req, res);
      }
      return getOrganizations(req, res);
    case "POST":
      return createOrganization(req, res);
    case "PUT":
      return updateOrganization(req, res);
    case "DELETE":
      return deleteOrganization(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

async function getOrganizations(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const result = await db.select().from(organizations);

    return res.status(200).json({
      message: "Organizations retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get organizations error:", error);
    return res.status(500).json({
      message: "Failed to retrieve organizations",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

async function getOrganization(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid organization ID",
        error: "ID must be a single value",
      });
    }

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, Number(id)));

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      message: "Organization retrieved successfully",
      data: organization,
    });
  } catch (error) {
    console.error("Get organization error:", error);
    return res.status(500).json({
      message: "Failed to retrieve organization",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

async function createOrganization(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const body = req.body as CreateOrganizationBody;

    // Validate required fields
    if (!body.name || !body.street || !body.postalCode) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Missing required fields",
      });
    }

    const newOrganizationData: NewOrganization = {
      name: body.name,
      street: body.street,
      postalCode: body.postalCode,
    };

    const [newOrganization] = await db
      .insert(organizations)
      .values(newOrganizationData)
      .returning();

    return res.status(201).json({
      message: "Organization created successfully",
      data: newOrganization,
    });
  } catch (error) {
    console.error("Create organization error:", error);
    return res.status(500).json({
      message: "Failed to create organization",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

async function updateOrganization(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const { id } = req.query;

    // Enhanced ID validation
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid organization ID",
        error: "ID must be a single value",
      });
    }

    const organizationId = parseInt(id);

    // Check if ID is a valid number
    if (isNaN(organizationId)) {
      return res.status(400).json({
        message: "Invalid organization ID",
        error: "ID must be a valid number",
      });
    }

    const updateData = req.body as UpdateOrganizationBody;

    // Check if organization exists
    const [existingOrganization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));

    if (!existingOrganization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    // Prepare update data
    const updateValues: Partial<NewOrganization> = {
      ...updateData,
    };

    const [updatedOrganization] = await db
      .update(organizations)
      .set({ ...updateValues, updated_at: new Date() })
      .where(eq(organizations.id, organizationId))
      .returning();

    return res.status(200).json({
      message: "Organization updated successfully",
      data: updatedOrganization,
    });
  } catch (error) {
    console.error("Update organization error:", error);
    return res.status(500).json({
      message: "Failed to update organization",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

async function deleteOrganization(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid organization ID",
        error: "ID must be a single value",
      });
    }

    // Check if organization exists
    const [existingOrganization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, Number(id)));

    if (!existingOrganization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    await db.delete(organizations).where(eq(organizations.id, Number(id)));

    return res.status(200).json({
      message: "Organization deleted successfully",
    });
  } catch (error) {
    console.error("Delete organization error:", error);
    return res.status(500).json({
      message: "Failed to delete organization",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
