import { redirect } from "next/navigation";
import { isLocale } from "@/i18n/routing";

export default async function AdminSignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${isLocale(locale) ? locale : "ru"}/sign-in/admin`);
}
