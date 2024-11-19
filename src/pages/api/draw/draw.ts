import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { type Draw, type NewDraw, draws } from "@/db/schema/draws";

type CreateDrawBody = {
  drawDate: string;
  prize: string;
  fundraiserId: number;
  supporterId?: number;
};

type UpdateDrawBody = Partial<CreateDrawBody>;

type ResponseData = {
  message: string;
  data?: Draw | Draw[];
  error?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  switch (req.method) {
    case "GET":
      if (req.query.id) {
        return getDraw(req, res);
      }
      return getDraws(req, res);
    case "POST":
      return createDraw(req, res);
    case "PUT":
      return updateDraw(req, res);
    case "DELETE":
      return deleteDraw(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

function handleDrawDate(dateStr: string | null) {
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

async function getDraws(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { fundraiserId } = req.query;

    let drawsData: Draw[];

    if (fundraiserId) {
      drawsData = await db
        .select()
        .from(draws)
        .where(eq(draws.fundraiserId, Number(fundraiserId)));
    } else {
      drawsData = await db.select().from(draws);
    }

    return res.status(200).json({
      message: "Draws retrieved successfully",
      data: drawsData,
    });
  } catch (error) {
    console.error("Get draws error:", error);
    return res.status(500).json({
      message: "Failed to retrieve draws",
      error,
    });
  }
}

async function getDraw(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid draw ID",
        error: "ID must be a single value",
      });
    }

    const [draw] = await db
      .select()
      .from(draws)
      .where(eq(draws.id, Number(id)));

    if (!draw) {
      return res.status(404).json({
        message: "Draw not found",
      });
    }

    return res.status(200).json({
      message: "Draw retrieved successfully",
      data: draw,
    });
  } catch (error) {
    console.error("Get draw error:", error);
    return res.status(500).json({
      message: "Failed to retrieve draw",
      error,
    });
  }
}

async function createDraw(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const body = req.body as CreateDrawBody;

    if (!body.drawDate || !body.prize || !body.fundraiserId) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Missing required fields",
      });
    }

    const today = handleDrawDate(null);
    const drawDate = handleDrawDate(body.drawDate);

    if (drawDate.forValidation.getTime() < today.forValidation.getTime()) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Draw date must be today or in the future",
      });
    }

    const newDrawData: NewDraw = {
      drawDate: body.drawDate,
      prize: body.prize,
      fundraiserId: body.fundraiserId,
      supporterId: body.supporterId ?? null,
    };

    const [newDraw] = await db
      .insert(draws)
      .values(newDrawData)
      .returning();

    return res.status(201).json({
      message: "Draw created successfully",
      data: newDraw,
    });
  } catch (error) {
    console.error("Create draw error:", error);
    return res.status(500).json({
      message: "Failed to create draw",
      error,
    });
  }
}

async function updateDraw(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid draw ID",
        error: "ID must be a single value",
      });
    }

    const updateData = req.body as UpdateDrawBody;
    const [existingDraw] = await db
      .select()
      .from(draws)
      .where(eq(draws.id, Number(id)));

    if (!existingDraw) {
      return res.status(404).json({
        message: "Draw not found",
      });
    }

    const updateValues: Partial<NewDraw> = {};

    if (updateData.prize) updateValues.prize = updateData.prize;
    if (updateData.supporterId !== undefined) {
      updateValues.supporterId = updateData.supporterId;
    }

    if (updateData.drawDate) {
      const today = handleDrawDate(null);
      const newDrawDate = handleDrawDate(updateData.drawDate);

      if (newDrawDate.forValidation.getTime() < today.forValidation.getTime()) {
        return res.status(400).json({
          message: "Validation failed",
          error: "Draw date must be today or in the future",
        });
      }
      updateValues.drawDate = updateData.drawDate;
    }

    const [updatedDraw] = await db
      .update(draws)
      .set(updateValues)
      .where(eq(draws.id, Number(id)))
      .returning();

    return res.status(200).json({
      message: "Draw updated successfully",
      data: updatedDraw,
    });
  } catch (error) {
    console.error("Update draw error:", error);
    return res.status(500).json({
      message: "Failed to update draw",
      error,
    });
  }
}

async function deleteDraw(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid draw ID",
        error: "ID must be a single value",
      });
    }

    const [existingDraw] = await db
      .select()
      .from(draws)
      .where(eq(draws.id, Number(id)));

    if (!existingDraw) {
      return res.status(404).json({
        message: "Draw not found",
      });
    }

    await db.delete(draws).where(eq(draws.id, Number(id)));

    return res.status(200).json({
      message: "Draw deleted successfully",
    });
  } catch (error) {
    console.error("Delete draw error:", error);
    return res.status(500).json({
      message: "Failed to delete draw",
      error,
    });
  }
}