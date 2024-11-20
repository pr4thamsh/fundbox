import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
  type Fundraiser,
  type NewFundraiser,
  activeFundraisersView,
  fundraisers,
} from "@/db/schema/fundraisers";
import { organizations } from "@/db/schema/organization";
import { type Organization } from "@/db/schema/organization";

type CreateFundraiserBody = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  organizationId: number;
  adminId: string;
  pricePerTicket: number;
};

type FundraiserWithOrg = {
  id: number;
  title: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  ticketsSold: number | null;
  fundRaised: number | null;
  organizationId: number | null;
  adminId: string | null;
  pricePerTicket: number | null;
  organization: Organization;
};

type UpdateFundraiserBody = Partial<Omit<CreateFundraiserBody, "adminId">>;

type ResponseData = {
  message: string;
  data?: Fundraiser | Fundraiser[] | FundraiserWithOrg;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
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
  if (!dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      forValidation: today,
      forStorage: today.toISOString().split("T")[0],
    };
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  return {
    forValidation: date,
    forStorage: dateStr,
  };
}

async function getFundraisers(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const { organizationId, active } = req.query;

    let result: Fundraiser[];

    if (active === "true") {
      result = await db.select().from(activeFundraisersView);
    } else {
      if (organizationId) {
        result = await db
          .select()
          .from(fundraisers)
          .where(eq(fundraisers.organizationId, Number(organizationId)));
      } else {
        result = await db.select().from(fundraisers);
      }
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
  res: NextApiResponse<ResponseData>,
) {
  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid fundraiser ID",
        error: "ID must be a single value",
      });
    }

    const [result] = await db
      .select({
        id: fundraisers.id,
        title: fundraisers.title,
        description: fundraisers.description,
        startDate: fundraisers.startDate,
        endDate: fundraisers.endDate,
        ticketsSold: fundraisers.ticketsSold,
        fundRaised: fundraisers.fundRaised,
        organizationId: fundraisers.organizationId,
        adminId: fundraisers.adminId,
        pricePerTicket: fundraisers.pricePerTicket,
        organization: organizations,
      })
      .from(fundraisers)
      .innerJoin(
        organizations,
        eq(fundraisers.organizationId, organizations.id),
      )
      .where(eq(fundraisers.id, Number(id)));

    if (!result) {
      return res.status(404).json({
        message: "Fundraiser not found",
      });
    }

    return res.status(200).json({
      message: "Fundraiser retrieved successfully",
      data: result,
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
  res: NextApiResponse<ResponseData>,
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

    const today = handleDates(null);
    const start = handleDates(body.startDate);
    const end = handleDates(body.endDate);

    // Compare dates using the time-stripped values
    if (start.forValidation.getTime() < today.forValidation.getTime()) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Start date must be today or in the future",
      });
    }

    if (end.forValidation.getTime() <= start.forValidation.getTime()) {
      return res.status(400).json({
        message: "Validation failed",
        error: "End date must be after start date",
      });
    }

    const newFundraiserData: NewFundraiser = {
      title: body.title,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      organizationId: body.organizationId,
      adminId: body.adminId,
      pricePerTicket: body.pricePerTicket,
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
  res: NextApiResponse<ResponseData>,
) {
  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid fundraiser ID",
        error: "ID must be a single value",
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

    if (updateData.title) updateValues.title = updateData.title;
    if (updateData.description)
      updateValues.description = updateData.description;
    if (updateData.organizationId)
      updateValues.organizationId = updateData.organizationId;

    if (updateData.startDate) {
      const today = handleDates(null);
      const newStart = handleDates(updateData.startDate);

      if (newStart.forValidation.getTime() < today.forValidation.getTime()) {
        return res.status(400).json({
          message: "Validation failed",
          error: "Start date must be today or in the future",
        });
      }
      updateValues.startDate = updateData.startDate;
    }

    if (updateData.endDate) {
      const startToCheck = updateData.startDate
        ? handleDates(updateData.startDate)
        : handleDates(existingFundraiser.startDate!);
      const newEnd = handleDates(updateData.endDate);

      if (
        newEnd.forValidation.getTime() <= startToCheck.forValidation.getTime()
      ) {
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
  res: NextApiResponse<ResponseData>,
) {
  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid fundraiser ID",
        error: "ID must be a single value",
      });
    }

    const [existingFundraiser] = await db
      .select()
      .from(fundraisers)
      .where(eq(fundraisers.id, Number(id)));

    if (!existingFundraiser) {
      return res.status(404).json({
        message: "Fundraiser not found",
      });
    }

    await db.delete(fundraisers).where(eq(fundraisers.id, Number(id)));

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
