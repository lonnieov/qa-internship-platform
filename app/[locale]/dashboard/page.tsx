import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function DashboardRedirectPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/intern/onboarding");
  }

  redirect(
    profile.role === "ADMIN" || profile.role === "TRACK_MASTER"
      ? "/admin"
      : "/intern",
  );
}
