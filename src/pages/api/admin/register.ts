import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { admins } from "@/db/schema/admins";

type RequestData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

type ResponseData = {
  message: string;
  adminId?: string;
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

    if (!body.email || !body.firstName || !body.lastName || !body.phone) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Missing required fields",
      });
    }

    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.email, body.email));

    if (existingAdmin.length > 0) {
      return res.status(409).json({
        message: "Registration failed",
        error: "Email already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    const [newAdmin] = await db
      .insert(admins)
      .values({
        id: body.id,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        password: hashedPassword,
      })
      .returning({ id: admins.id });

    return res.status(201).json({
      message: "Admin registered successfully",
      adminId: newAdmin.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Registration failed",
      error: error,
    });
  }
}
