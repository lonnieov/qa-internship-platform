import { redirect } from "next/navigation";
import { getAdminSessionProfile } from "@/lib/admin-auth";
import { getInternSessionProfile } from "@/lib/intern-token-auth";
import { getRequestLocale, localizedPath } from "@/lib/locale";
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

export async function requireAdmin(options?: { locale?: string }) {
  const profile = await getCurrentProfile();
  const locale = await getRequestLocale(options?.locale);

  if (!profile) {
    redirect(localizedPath("/sign-in/admin", locale));
  }

  if (profile.role !== "ADMIN") {
    redirect(localizedPath("/intern", locale));
  }

  return profile;
}

export async function requireAdminAccess(options?: { locale?: string }) {
  const profile = await getCurrentProfile();
  const locale = await getRequestLocale(options?.locale);

  if (!profile) {
    redirect(localizedPath("/sign-in/admin", locale));
  }

  if (profile.role !== "ADMIN" && profile.role !== "TRACK_MASTER") {
    redirect(localizedPath("/intern", locale));
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

export async function requireIntern(options?: { locale?: string }) {
  const profile = await getCurrentProfile();
  const locale = await getRequestLocale(options?.locale);

  if (!profile) {
    redirect(localizedPath("/sign-in/intern", locale));
  }

  if (profile.role !== "INTERN" || !profile.internProfile) {
    redirect(localizedPath("/admin", locale));
  }

  return profile as typeof profile & {
    internProfile: NonNullable<typeof profile.internProfile>;
  };
}

export async function getSignedInEmail() {
  const profile = await getCurrentProfile();
  return profile?.email?.toLowerCase() ?? null;
}
