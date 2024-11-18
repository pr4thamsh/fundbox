import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { type Admin, admins } from "@/db/schema/admins";

type RequestData = {
  email: string;
};

type ResponseData = {
  message: string;
  admin?: Omit<Admin, "password">;
  error?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = req.body as RequestData;

    if (!body.email) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Missing email",
      });
    }

    const [existingAdmin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, body.email));

    if (!existingAdmin) {
      return res.status(404).json({
        message: "Login failed",
        error: "Admin not found",
      });
    }

    return res.status(200).json({
      message: "Admin found successfully",
      admin: existingAdmin,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Login failed",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
