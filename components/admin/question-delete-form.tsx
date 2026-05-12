"use client";

import { useTranslations } from "next-intl";
import { deleteQuestionAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

type QuestionDeleteFormProps = {
  questionId: string;
};

export function QuestionDeleteForm({ questionId }: QuestionDeleteFormProps) {
  const t = useTranslations("AdminQuestions");

  return (
    <form
      action={deleteQuestionAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(t("deleteConfirm"));

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="questionId" value={questionId} />
      <Button type="submit" variant="destructive" size="sm">
        {t("delete")}
      </Button>
    </form>
  );
}
