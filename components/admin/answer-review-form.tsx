"use client";

import { useTransition, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { reviewAnswerAction } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AdminReview = {
  passed: boolean;
  note: string;
  at: string;
};

export function AnswerReviewForm({
  answerId,
  existingReview,
}: {
  answerId: string;
  existingReview: AdminReview | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState(existingReview?.note ?? "");
  const [submitted, setSubmitted] = useState<boolean | null>(
    existingReview?.passed ?? null,
  );

  function submit(passed: boolean) {
    startTransition(async () => {
      const result = await reviewAnswerAction({ answerId, passed, note });
      if (result?.ok) setSubmitted(passed);
    });
  }

  return (
    <div className="answer-review-form stack">
      <div className="nav-row" style={{ justifyContent: "space-between" }}>
        <strong className="body-2">Ручная проверка</strong>
        {submitted !== null ? (
          <Badge variant={submitted ? "success" : "danger"}>
            {submitted ? "Принято" : "Не принято"}
          </Badge>
        ) : (
          <Badge variant="warning">Ожидает проверки</Badge>
        )}
      </div>

      <Textarea
        className="answer-review-note"
        disabled={isPending}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Комментарий проверяющего (необязательно)"
        value={note}
      />

      <div className="nav-row">
        <Button
          className={`answer-review-action answer-review-accept${submitted === true ? " is-selected" : ""}`}
          disabled={isPending}
          onClick={() => submit(true)}
          type="button"
          variant="secondary"
        >
          <CheckCircle2 size={16} />
          Принять
        </Button>
        <Button
          className={`answer-review-action answer-review-reject${submitted === false ? " is-selected" : ""}`}
          disabled={isPending}
          onClick={() => submit(false)}
          type="button"
          variant="secondary"
        >
          <XCircle size={16} />
          Отклонить
        </Button>
        {existingReview?.at ? (
          <span className="body-2 muted">
            {new Date(existingReview.at).toLocaleString("ru")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
