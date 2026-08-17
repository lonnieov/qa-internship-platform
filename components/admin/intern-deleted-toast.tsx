"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * Rendered only when the ?deleted flag is present. It hands the message to the
 * toaster and then strips the flag, so a reload or a back-navigation does not
 * announce the same deletion again.
 */
export function InternDeletedToast() {
  const t = useTranslations("AdminInterns");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFired = useRef(false);

  useEffect(() => {
    // Removing the flag re-renders this component; the guard keeps that from
    // queueing a second toast.
    if (hasFired.current) return;
    hasFired.current = true;

    toast.success(t("toast.title"), { description: t("toast.description") });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("deleted");
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : pathname,
      { scroll: false },
    );
  }, [pathname, router, searchParams, t]);

  return null;
}
