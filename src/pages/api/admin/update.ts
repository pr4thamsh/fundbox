import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { type Admin, admins } from "@/db/schema/admins";

type UpdateAdminBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  organizationId?: number;
};

type ResponseData = {
  message: string;
  data?: Admin;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  return updateAdmin(req, res);
}

async function updateAdmin(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid admin ID",
        error: "ID must be a single value",
      });
    }

    const updateData = req.body as UpdateAdminBody;

    const [existingAdmin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, id));

    if (!existingAdmin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    if (updateData.email && updateData.email !== existingAdmin.email) {
      const [existingEmail] = await db
        .select()
        .from(admins)
        .where(eq(admins.email, updateData.email));

      if (existingEmail) {
        return res.status(400).json({
          message: "Validation failed",
          error: "Email already exists",
        });
      }
    }

    const updateValues: UpdateAdminBody = {};

    if (updateData.firstName) updateValues.firstName = updateData.firstName;
    if (updateData.lastName) updateValues.lastName = updateData.lastName;
    if (updateData.email) updateValues.email = updateData.email;
    if (updateData.phone) updateValues.phone = updateData.phone;
    if (updateData.organizationId !== undefined)
      updateValues.organizationId = updateData.organizationId;

    const [updatedAdmin] = await db
      .update(admins)
      .set({
        ...updateValues,
      })
      .where(eq(admins.id, id))
      .returning();

    return res.status(200).json({
      message: "Admin updated successfully",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Update admin error:", error);
    return res.status(500).json({
      message: "Failed to update admin",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
