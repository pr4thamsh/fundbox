import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { sql, eq } from "drizzle-orm";
import { draws } from "@/db/schema/draws";

type ResponseData = {
  message: string;
  data?: {
    winner: {
      supporterId: number;
      firstName: string;
      lastName: string;
      email: string;
      ticketNumber: number;
    };
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
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
    const [draw] = await db.select().from(draws).where(eq(draws.id, drawId));

    if (!draw) {
      return res.status(404).json({
        message: "Draw not found",
        error: "The specified draw does not exist",
      });
    }

    const [result] = await db.execute<{
      supporter_id: number;
      first_name: string;
      last_name: string;
      email: string;
      winning_ticket_number: number;
    }>(sql`
      SELECT * FROM pick_draw_winner(${drawId});
    `);

    if (!result || !result.supporter_id) {
      throw new Error("Failed to select winner");
    }

    return res.status(200).json({
      message: "Winner selected successfully",
      data: {
        winner: {
          supporterId: result.supporter_id,
          firstName: result.first_name,
          lastName: result.last_name,
          email: result.email,
          ticketNumber: result.winning_ticket_number,
        },
      },
    });
  } catch (error) {
    console.error("Pick winner error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

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
