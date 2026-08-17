"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

/** `count` switches the copy to the bulk wording used after AI generation. */
export function QuestionCreatedToast({ count }: { count?: number } = {}) {
  const t = useTranslations("AdminQuestions");
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("created");
      params.delete("added");
      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname,
        { scroll: false },
      );
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParams]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <strong className="block">
        {count ? t("toast.addedTitle", { count }) : t("toast.title")}
      </strong>
      <span className="body-2 muted">
        {count ? t("toast.addedDescription") : t("toast.description")}
      </span>
    </div>
  );
}
