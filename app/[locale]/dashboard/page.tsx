import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function DashboardRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/${locale}/intern/onboarding`);
  }

  redirect(
    profile.role === "ADMIN" || profile.role === "TRACK_MASTER"
      ? `/${locale}/admin`
      : `/${locale}/intern`,
  );
}
