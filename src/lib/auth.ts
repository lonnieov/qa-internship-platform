import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ensureDemoAdminProfile,
  hasValidDemoAdminSession,
} from "@/lib/demo-admin-auth";
import { getInternSessionProfile } from "@/lib/intern-token-auth";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getCurrentProfile() {
  if (await hasValidDemoAdminSession()) {
    return ensureDemoAdminProfile();
  }

  const internProfile = await getInternSessionProfile();
  if (internProfile) {
    return internProfile;
  }

  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return null;
  }

  const existing = await prisma.profile.findUnique({
    where: { clerkUserId: userId },
    include: { internProfile: true },
  });

  if (existing) {
    return existing;
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  if (!email) {
    return null;
  }

  if (adminEmails().includes(email)) {
    return prisma.profile.create({
      data: {
        clerkUserId: userId,
        email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        role: "ADMIN",
      },
      include: { internProfile: true },
    });
  }

  return null;
}

export async function requireAdmin() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/sign-in/admin");
  }

  if (profile.role !== "ADMIN") {
    redirect("/intern");
  }

  return profile;
}

export async function requireIntern() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/sign-in/intern");
  }

  if (profile.role !== "INTERN" || !profile.internProfile) {
    redirect("/admin");
  }

  return profile as typeof profile & {
    internProfile: NonNullable<typeof profile.internProfile>;
  };
}

export async function getSignedInEmail() {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return null;

  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
}
