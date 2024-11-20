// pages/api/draw/winner.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { sql } from "drizzle-orm";

type ResponseData = {
  message: string;
  data?: {
    winner: {
      supporterId: number;
      firstName: string;
      lastName: string;
      email: string;
    }
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

  try {
    const { drawId } = req.body;

    if (!drawId) {
      return res.status(400).json({
        message: "Draw ID is required"
      });
    }

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

    return res.status(200).json({
      message: "Winner selected successfully",
      data: {
        winner: {
          supporterId: result.p_selected_supporter_id,
          firstName: result.p_first_name,
          lastName: result.p_last_name,
          email: result.p_email
        }
      }
    });

  } catch (error) {
    console.error("Pick winner error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    
    if (message.includes("No tickets found")) {
      return res.status(400).json({
        message: "No tickets available",
        error: "No tickets found for this fundraiser"
      });
    }
    if (message.includes("Winner already selected")) {
      return res.status(400).json({
        message: "Winner already selected",
        error: "A winner has already been selected for this draw"
      });
    }
    if (message.includes("Draw can only be processed")) {
      return res.status(400).json({
        message: "Invalid draw date",
        error: "Draw can only be processed on its scheduled date"
      });
    }

    return res.status(500).json({
      message: "Failed to pick winner",
      error: message
    });
  }
}