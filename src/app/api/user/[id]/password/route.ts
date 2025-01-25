import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HttpResponse } from "@/lib/exceptions/http-response";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { passwordStrength } from "check-password-strength";
import { HttpStatus } from "@/lib/exceptions/http-status";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session
    const session: Session | null = await getServerSession(authOptions);
    // Get request data
    const { id } = await params;
    const { current_password, new_password, new_password_confirmation } =
      await request.json();
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!id) {
      return HttpResponse.badRequest("User ID is required");
    } else if (!user) {
      // Check if user exists
      return HttpResponse.notFound("User not found");
    } else if (!session?.user) {
      // Check if user is logged in
      return HttpResponse.unauthorized();
    } else if (session.user.id !== id) {
      // Check if user is updating their own password
      return HttpResponse.forbidden("You can only update your own password");
    } else if (
      !current_password ||
      !new_password ||
      !new_password_confirmation
    ) {
      // Check if all fields are filled
      return HttpResponse.badRequest("All password fields are required");
    } else if (!(await bcrypt.compare(current_password, user.password))) {
      // Verify current password
      return HttpResponse.unprocessableEntity("Invalid current password");
    } else if (new_password !== new_password_confirmation) {
      return HttpResponse.unprocessableEntity("New passwords do not match");
    } else if ((await passwordStrength(new_password).id) < 2) {
      return HttpResponse.unprocessableEntity("New password is too weak");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12);
    // Update password
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    });

    return HttpResponse.ok(null, "Password updated successfully");
  } catch (error) {
    return HttpResponse.internalServerError(
      "There was an error updating the password"
    );
  }
}
