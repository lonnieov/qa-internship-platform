"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const debounceMs = 350;

export function InternSearchForm({ initialQuery }: { initialQuery: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AdminInterns");
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedQuery = query.trim();
      const params = new URLSearchParams();

      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      }

      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, query, router]);

  return (
    <div className="intern-search-form" role="search">
      <div className="intern-search-field">
        <Search aria-hidden="true" size={16} />
        <Input
          aria-label={t("searchLabel")}
          name="q"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          type="search"
          value={query}
        />
      </div>
      {query.trim() ? (
        <Button variant="outline" type="button" asChild>
          <Link href={`/${locale}/admin/interns`}>{t("reset")}</Link>
        </Button>
      ) : null}
    </div>
  );
}
