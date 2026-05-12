import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function InternOnboardingPage() {
  const profile = await getCurrentProfile();

  if (profile?.role === "ADMIN") {
    redirect("/admin");
  }

  if (profile?.role === "INTERN") {
    redirect("/intern");
  }

  redirect("/sign-in/intern");
}
