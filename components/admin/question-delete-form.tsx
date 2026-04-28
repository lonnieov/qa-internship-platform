"use client";

import { deleteQuestionAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

type QuestionDeleteFormProps = {
  questionId: string;
};

export function QuestionDeleteForm({ questionId }: QuestionDeleteFormProps) {
  return (
    <form
      action={deleteQuestionAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Удалить вопрос без возможности восстановления?",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="questionId" value={questionId} />
      <Button type="submit" variant="destructive" size="sm">
        Удалить
      </Button>
    </form>
  );
}
