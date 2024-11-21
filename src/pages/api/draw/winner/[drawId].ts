import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";

import { eq } from "drizzle-orm";
import { draws } from "@/db/schema/draws";
import { supporters } from "@/db/schema/supporters";

type ResponseData = {
  message?: string;
  error?: string;
  data?: {
    winner?: {
      supporterId: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const drawId = parseInt(req.query.drawId as string);

  if (isNaN(drawId)) {
    return res.status(400).json({
      message: "Invalid request",
      error: "Draw ID must be a valid number",
    });
  }

  try {
    const [draw] = await db.select().from(draws).where(eq(draws.id, drawId));

    if (!draw) {
      return res.status(404).json({
        message: "Draw not found",
        error: "The specified draw does not exist",
      });
    }

    if (!draw.supporterId) {
      return res.status(404).json({
        message: "Winner not found",
        error: "No winner has been selected for this draw yet",
      });
    }

    const [winner] = await db
      .select({
        supporterId: supporters.id,
        firstName: supporters.firstName,
        lastName: supporters.lastName,
        email: supporters.email,
      })
      .from(supporters)
      .where(eq(supporters.id, draw.supporterId));

    if (!winner) {
      return res.status(404).json({
        message: "Winner details not found",
        error: "Winner information could not be retrieved",
      });
    }

    return res.status(200).json({
      message: "Winner details retrieved successfully",
      data: {
        winner: {
          supporterId: winner.supporterId,
          firstName: winner.firstName,
          lastName: winner.lastName,
          email: winner.email,
        },
      },
    });
  } catch (error) {
    console.error("Get winner error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return res.status(500).json({
      message: "Failed to fetch winner details",
      error: message,
    });
  }
}
