import { redirect } from "next/navigation";
import { getAdminSessionProfile } from "@/lib/admin-auth";
import { getInternSessionProfile } from "@/lib/intern-token-auth";

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
