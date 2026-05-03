"use client";

import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AiAnswerReview } from "@/lib/ai-answer-review";
import { Badge } from "@/components/ui/badge";

function reviewVariant(verdict: AiAnswerReview["verdict"]) {
  if (verdict === "pass") return "success";
  if (verdict === "fail") return "danger";
  return "warning";
}

export function AnswerAiReviewCard({
  review,
}: {
  review: AiAnswerReview | null;
}) {
  const t = useTranslations("AdminAttemptReport.aiReview");

  if (!review) {
    return (
      <div className="answer-ai-review-card pending">
        <div className="nav-row">
          <Bot size={16} />
          <strong>{t("title")}</strong>
          <Badge variant="warning">{t("pending")}</Badge>
        </div>
      </div>
    );
  }

  return (
    <details className="answer-ai-review-card">
      <summary className="answer-ai-review-summary">
        <span className="nav-row">
          <Bot size={16} />
          <strong>{t("title")}</strong>
        </span>
        <span className="nav-row">
          <Badge variant={reviewVariant(review.verdict)}>
            {t(`verdict.${review.verdict}`)}
          </Badge>
          <Badge variant="muted">{t("score", { score: review.score })}</Badge>
        </span>
      </summary>

      <div className="answer-ai-review-body">
        <p className="body-2 m-0">{review.summary}</p>

        {review.strengths.length > 0 ? (
          <div className="answer-ai-review-list">
            <strong>{t("strengths")}</strong>
            <ul>
              {review.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {review.issues.length > 0 ? (
          <div className="answer-ai-review-list">
            <strong>{t("issues")}</strong>
            <ul>
              {review.issues.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {review.recommendation ? (
          <p className="body-2 muted m-0">
            <strong>{t("recommendation")}:</strong> {review.recommendation}
          </p>
        ) : null}

        <span className="body-2 muted">
          {t("provider", { model: review.model })}
        </span>
      </div>
    </details>
  );
}
