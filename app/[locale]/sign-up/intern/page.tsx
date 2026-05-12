import { redirect } from "next/navigation";
import { isLocale } from "@/i18n/routing";

export default async function InternSignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${isLocale(locale) ? locale : "ru"}/sign-in/intern`);
}
