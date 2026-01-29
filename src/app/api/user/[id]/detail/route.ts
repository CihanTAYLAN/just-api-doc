import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/lib/classes/http-response";
import { Session } from "next-auth";

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session
    const session: Session | null = await getServerSession(authOptions);
    // Get request data
    const { id } = await params;
    const { name, email } = await request.json();

    // Validate user and permissions
    if (!id) {
      return HttpResponse.badRequest("User ID is required");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    // Validate input data
    if (!user) {
      return HttpResponse.notFound("User not found");
    } else if (!session?.user?.email) {
      return HttpResponse.unauthorized(
        "Authentication required. Please log in to update your profile"
      );
    } else if (!name?.trim()) {
      return HttpResponse.unprocessableEntity("Name is required");
    } else if (!email?.trim()) {
      return HttpResponse.unprocessableEntity("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return HttpResponse.unprocessableEntity("Invalid email format");
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim(),
      },
    });

    return HttpResponse.ok(
      {
        name: updatedUser.name,
        email: updatedUser.email,
      },
      "User updated successfully"
    );
  } catch (error) {
    console.error("Error updating user:", error);

    return HttpResponse.internalServerError(
      "An error occurred while updating the user"
    );
  }
}
