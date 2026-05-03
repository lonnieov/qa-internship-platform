"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function AttemptAiReviewsLoader({
  attemptId,
  missingCount,
}: {
  attemptId: string;
  missingCount: number;
}) {
  const router = useRouter();
  const t = useTranslations("AdminAttemptReport.aiReview");
  const [error, setError] = useState("");

  useEffect(() => {
    if (missingCount <= 0) return;

    let cancelled = false;

    void fetch(`/api/admin/attempts/${attemptId}/ai-answer-reviews`, {
      method: "POST",
    })
      .then(async (response) => {
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error || t("error"));
        if (!cancelled) router.refresh();
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error ? requestError.message : t("error"),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attemptId, missingCount, router, t]);

  if (missingCount <= 0) return null;

  return (
    <div className="ai-review-loader">
      {error ? (
        <>
          <Bot size={18} />
          <span>{error}</span>
        </>
      ) : (
        <>
          <Loader2 className="spin" size={18} />
          <span>{t("generating", { count: missingCount })}</span>
        </>
      )}
    </div>
  );
}
