"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * Rendered only when the ?created / ?added flag is present. `count` switches the
 * copy to the bulk wording used after AI generation. The flag is stripped once
 * the toast is queued so a reload does not announce the same batch again.
 */
export function QuestionCreatedToast({ count }: { count?: number } = {}) {
  const t = useTranslations("AdminQuestions");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFired = useRef(false);

  useEffect(() => {
    // Removing the flags re-renders this component; the guard keeps that from
    // queueing a second toast.
    if (hasFired.current) return;
    hasFired.current = true;

    toast.success(count ? t("toast.addedTitle", { count }) : t("toast.title"), {
      description: count
        ? t("toast.addedDescription")
        : t("toast.description"),
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("created");
    params.delete("added");
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : pathname,
      { scroll: false },
    );
  }, [count, pathname, router, searchParams, t]);

  return null;
}
