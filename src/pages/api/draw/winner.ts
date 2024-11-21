import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { draws } from "@/db/schema/draws";
import { eq } from "drizzle-orm";

type ResponseData = {
  message: string;
  data?: {
    winner: {
      supporterId: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { drawId } = req.body;

  if (!drawId || typeof drawId !== "number") {
    return res.status(400).json({
      message: "Invalid request",
      error: "Draw ID is required and must be a number",
    });
  }

  try {
    // First verify the draw exists and is ready for winner selection
    const [draw] = await db
      .select()
      .from(draws)
      .where(eq(draws.id, drawId));

    if (!draw) {
      return res.status(404).json({
        message: "Draw not found",
        error: "The specified draw does not exist",
      });
    }

    // Call the stored procedure
    const [result] = await db.execute<{
      p_selected_supporter_id: number;
      p_first_name: string;
      p_last_name: string;
      p_email: string;
    }>(sql`
      CALL pick_draw_winner(
        ${drawId},
        NULL,
        NULL,
        NULL,
        NULL
      );
    `);

    // Verify we got a result
    if (!result.p_selected_supporter_id) {
      throw new Error("Failed to select winner");
    }

    return res.status(200).json({
      message: "Winner selected successfully",
      data: {
        winner: {
          supporterId: result.p_selected_supporter_id,
          firstName: result.p_first_name,
          lastName: result.p_last_name,
          email: result.p_email,
        },
      },
    });
  } catch (error) {
    console.error("Pick winner error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";

    // Handle specific error cases
    if (message.includes("Draw date is in the future")) {
      return res.status(400).json({
        message: "Invalid draw date",
        error: "Draw cannot be processed before its scheduled date",
      });
    }
    if (message.includes("Winner already selected")) {
      return res.status(400).json({
        message: "Winner already selected",
        error: "A winner has already been selected for this draw",
      });
    }
    if (message.includes("No tickets sold")) {
      return res.status(400).json({
        message: "No tickets available",
        error: "No tickets have been sold for this fundraiser",
      });
    }

    return res.status(500).json({
      message: "Failed to pick winner",
      error: message,
    });
  }
}