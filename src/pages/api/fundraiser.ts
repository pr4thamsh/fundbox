import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { fundraisers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Define types based on schema
type Fundraiser = InferSelectModel<typeof fundraisers>;
type NewFundraiser = InferInsertModel<typeof fundraisers>;

type CreateFundraiserBody = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  organizationId: number;
  adminId: string;
};

type UpdateFundraiserBody = Partial<Omit<CreateFundraiserBody, 'adminId'>>;

type ResponseData = {
  message: string;
  data?: Fundraiser | Fundraiser[];
  error?: string;
};

// Helper function to format date to ISO string
const formatDate = (date: Date): string => {
  return date.toISOString();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  switch (req.method) {
    case "GET":
      if (req.query.id) {
        return getFundraiser(req, res);
      }
      return getFundraisers(req, res);
    case "POST":
      return createFundraiser(req, res);
    case "PUT":
      return updateFundraiser(req, res);
    case "DELETE":
      return deleteFundraiser(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

async function getFundraisers(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { organizationId } = req.query;
    
    let result: Fundraiser[];

    if (organizationId) {
      result = await db
        .select()
        .from(fundraisers)
        .where(eq(fundraisers.organizationId, Number(organizationId)));
    } else {
      result = await db
        .select()
        .from(fundraisers);
    }

    return res.status(200).json({
      message: "Fundraisers retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get fundraisers error:", error);
    return res.status(500).json({
      message: "Failed to retrieve fundraisers",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

async function getFundraiser(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { id } = req.query;
    
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid fundraiser ID",
        error: "ID must be a single value"
      });
    }

    const [fundraiser] = await db
      .select()
      .from(fundraisers)
      .where(eq(fundraisers.id, Number(id)));

    if (!fundraiser) {
      return res.status(404).json({
        message: "Fundraiser not found",
      });
    }

    return res.status(200).json({
      message: "Fundraiser retrieved successfully",
      data: fundraiser,
    });
  } catch (error) {
    console.error("Get fundraiser error:", error);
    return res.status(500).json({
      message: "Failed to retrieve fundraiser",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

async function createFundraiser(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const body = req.body as CreateFundraiserBody;
    
    // Validate required fields
    if (!body.title || !body.description || !body.startDate || !body.endDate || !body.organizationId || !body.adminId) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Missing required fields",
      });
    }

    // Validate dates
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Start date must be in the future",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        message: "Validation failed",
        error: "End date must be after start date",
      });
    }

    const newFundraiserData: NewFundraiser = {
      title: body.title,
      description: body.description,
      startDate: formatDate(start),
      endDate: formatDate(end),
      organizationId: body.organizationId,
      adminId: body.adminId,
    };

    const [newFundraiser] = await db
      .insert(fundraisers)
      .values(newFundraiserData)
      .returning();

    return res.status(201).json({
      message: "Fundraiser created successfully",
      data: newFundraiser,
    });
  } catch (error) {
    console.error("Create fundraiser error:", error);
    return res.status(500).json({
      message: "Failed to create fundraiser",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

async function updateFundraiser(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { id } = req.query;
    
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid fundraiser ID",
        error: "ID must be a single value"
      });
    }

    const updateData = req.body as UpdateFundraiserBody;

    // Check if fundraiser exists
    const [existingFundraiser] = await db
      .select()
      .from(fundraisers)
      .where(eq(fundraisers.id, Number(id)));

    if (!existingFundraiser) {
      return res.status(404).json({
        message: "Fundraiser not found",
      });
    }

    // Prepare update data with date conversions
    const updateValues: Partial<NewFundraiser> = {};
    
    if (updateData.title) updateValues.title = updateData.title;
    if (updateData.description) updateValues.description = updateData.description;
    if (updateData.startDate) {
      const startDate = new Date(updateData.startDate);
      updateValues.startDate = formatDate(startDate);
    }
    if (updateData.endDate) {
      const endDate = new Date(updateData.endDate);
      updateValues.endDate = formatDate(endDate);
    }
    if (updateData.organizationId) updateValues.organizationId = updateData.organizationId;

    const [updatedFundraiser] = await db
      .update(fundraisers)
      .set(updateValues)
      .where(eq(fundraisers.id, Number(id)))
      .returning();

    return res.status(200).json({
      message: "Fundraiser updated successfully",
      data: updatedFundraiser,
    });
  } catch (error) {
    console.error("Update fundraiser error:", error);
    return res.status(500).json({
      message: "Failed to update fundraiser",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

async function deleteFundraiser(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { id } = req.query;
    
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid fundraiser ID",
        error: "ID must be a single value"
      });
    }

    // Check if fundraiser exists
    const [existingFundraiser] = await db
      .select()
      .from(fundraisers)
      .where(eq(fundraisers.id, Number(id)));

    if (!existingFundraiser) {
      return res.status(404).json({
        message: "Fundraiser not found",
      });
    }

    await db
      .delete(fundraisers)
      .where(eq(fundraisers.id, Number(id)));

    return res.status(200).json({
      message: "Fundraiser deleted successfully",
    });
  } catch (error) {
    console.error("Delete fundraiser error:", error);
    return res.status(500).json({
      message: "Failed to delete fundraiser",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}