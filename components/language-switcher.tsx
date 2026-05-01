"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

function switchLocaleInPath(pathname: string, locale: Locale) {
  const [, currentLocale, ...rest] = pathname.split("/");

  if (routing.locales.some((item) => item === currentLocale)) {
    return `/${[locale, ...rest].join("/")}`;
  }

  return `/${locale}${pathname}`;
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("LanguageSwitcher");

  return (
    <div className="language-switcher" aria-label={t("label")}>
      {routing.locales.map((item) => (
        <button
          aria-pressed={item === locale}
          className={item === locale ? "active" : ""}
          key={item}
          type="button"
          onClick={() => {
            const query = searchParams.toString();
            const nextPath = switchLocaleInPath(pathname, item);
            router.replace(query ? `${nextPath}?${query}` : nextPath);
          }}
        >
          {t(item)}
        </button>
      ))}
    </div>
  );
}
