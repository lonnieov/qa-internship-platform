"use client";

import { useActionState } from "react";
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

type ReviewFormState = {
  ok: boolean;
  passed: boolean | null;
  message: string;
  at: string | null;
};

export function AnswerReviewForm({
  answerId,
  existingReview,
}: {
  answerId: string;
  existingReview: AdminReview | null;
}) {
  const [state, formAction, isPending] = useActionState(
    async (
      previous: ReviewFormState,
      formData: FormData,
    ): Promise<ReviewFormState> => {
      const passedValue = String(formData.get("passed") ?? "");
      const passed =
        passedValue === "true" ? true : passedValue === "false" ? false : null;
      const note = String(formData.get("note") ?? "");

      if (passed === null) {
        return {
          ...previous,
          ok: false,
          message: "Выберите результат проверки.",
        };
      }

      try {
        const result = await reviewAnswerAction({ answerId, passed, note });
        if (!result?.ok) {
          return {
            ...previous,
            ok: false,
            message: "Не удалось сохранить проверку. Обновите страницу и попробуйте ещё раз.",
          };
        }

        return {
          ok: true,
          passed,
          message: "Проверка сохранена.",
          at: result.at ?? new Date().toISOString(),
        };
      } catch {
        return {
          ...previous,
          ok: false,
          message: "Проверка не сохранилась. Попробуйте ещё раз без перезагрузки страницы.",
        };
      }
    },
    {
      ok: true,
      passed: existingReview?.passed ?? null,
      message: "",
      at: existingReview?.at ?? null,
    },
  );
  const submitted = state.passed;

  return (
    <form action={formAction} className="answer-review-form stack">
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
        defaultValue={existingReview?.note ?? ""}
        disabled={isPending}
        name="note"
        placeholder="Комментарий проверяющего (необязательно)"
      />

      <div className="nav-row">
        <Button
          className={`answer-review-action answer-review-accept${submitted === true ? " is-selected" : ""}`}
          disabled={isPending}
          name="passed"
          type="submit"
          value="true"
          variant="secondary"
        >
          <CheckCircle2 size={16} />
          Принять
        </Button>
        <Button
          className={`answer-review-action answer-review-reject${submitted === false ? " is-selected" : ""}`}
          disabled={isPending}
          name="passed"
          type="submit"
          value="false"
          variant="secondary"
        >
          <XCircle size={16} />
          Отклонить
        </Button>
        {state.at ? (
          <span className="body-2 muted">
            {new Date(state.at).toLocaleString("ru")}
          </span>
        ) : null}
      </div>
      {state.message ? (
        <p
          aria-live="polite"
          className={`body-2 m-0 ${state.ok ? "success-text" : "danger-text"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
