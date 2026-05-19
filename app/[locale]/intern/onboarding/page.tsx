import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function InternOnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getCurrentProfile();

  if (profile?.role === "ADMIN") {
    redirect(`/${locale}/admin`);
  }

  if (profile?.role === "INTERN") {
    redirect(`/${locale}/intern`);
  }

  redirect(`/${locale}/sign-in/intern`);
}
