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

function handleDates(dateStr: string | null) {
  const today = new Date().toISOString().split("T")[0];
  return {
    forValidation: new Date((dateStr || today) + "T00:00:00.000Z"),
    forStorage: dateStr || today,
  };
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

    if (
      !body.title ||
      !body.description ||
      !body.startDate ||
      !body.endDate ||
      !body.organizationId ||
      !body.adminId
    ) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Missing required fields",
      });
    }

    const start = handleDates(body.startDate);
    const end = handleDates(body.endDate);
    const today = handleDates(new Date().toISOString().split("T")[0]);

    if (start.forValidation < today.forValidation) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Start date can't be in the past",
      });
    }

    if (end.forValidation <= start.forValidation) {
      return res.status(400).json({
        message: "Validation failed",
        error: "End date must be after start date",
      });
    }

    const newFundraiserData: NewFundraiser = {
      title: body.title,
      description: body.description,
      startDate: start.forStorage,
      endDate: end.forStorage,
      organizationId: body.organizationId,
      adminId: body.adminId,
    };

    const [newFundraiser] = await db
      .insert(fundraisers)
      .values(newFundraiserData)
      .returning();

    // Format dates in the response
    const formattedFundraiser = {
      ...newFundraiser,
      startDate: newFundraiser.startDate,
      endDate: newFundraiser.endDate,
      isActive:
        start.forValidation <= today.forValidation &&
        end.forValidation >= today.forValidation,
    };

    return res.status(201).json({
      message: "Fundraiser created successfully",
      data: formattedFundraiser,
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
    const [existingFundraiser] = await db
      .select()
      .from(fundraisers)
      .where(eq(fundraisers.id, Number(id)));

    if (!existingFundraiser) {
      return res.status(404).json({
        message: "Fundraiser not found",
      });
    }

    const updateValues: Partial<NewFundraiser> = {};
    const now = new Date();

    if (updateData.title) updateValues.title = updateData.title;
    if (updateData.description)
      updateValues.description = updateData.description;
    if (updateData.organizationId)
      updateValues.organizationId = updateData.organizationId;

    if (updateData.startDate) {
      const newStart = new Date(updateData.startDate);
      if (newStart < now) {
        return res.status(400).json({
          message: "Validation failed",
          error: "Start date can't be in the past",
        });
      }
      updateValues.startDate = updateData.startDate;
    }

    if (updateData.endDate) {
      const newEnd = new Date(updateData.endDate);
      const startToCheck = updateData.startDate
        ? new Date(updateData.startDate)
        : new Date(existingFundraiser.startDate!);

      if (newEnd <= startToCheck) {
        return res.status(400).json({
          message: "Validation failed",
          error: "End date must be after start date",
        });
      }
      updateValues.endDate = updateData.endDate;
    }

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