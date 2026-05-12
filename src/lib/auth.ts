import { redirect } from "next/navigation";
import { getAdminSessionProfile } from "@/lib/admin-auth";
import { getInternSessionProfile } from "@/lib/intern-token-auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentProfile() {
  const adminProfile = await getAdminSessionProfile();
  if (adminProfile) {
    return adminProfile;
  }

  const internProfile = await getInternSessionProfile();
  if (internProfile) {
    return internProfile;
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

export async function requireAdminAccess() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/sign-in/admin");
  }

  if (profile.role !== "ADMIN" && profile.role !== "TRACK_MASTER") {
    redirect("/intern");
  }

  return profile;
}

export async function getManageableTrackIds(profile: { id: string; role: string }) {
  if (profile.role === "ADMIN") return null;
  if (profile.role !== "TRACK_MASTER") return [];

  const memberships = await prisma.trackMember.findMany({
    where: { profileId: profile.id, role: "TRACK_MASTER" },
    select: { trackId: true },
  });

  return memberships.map((membership) => membership.trackId);
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
  const profile = await getCurrentProfile();
  return profile?.email?.toLowerCase() ?? null;
}
