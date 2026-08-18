"use client";

import { useRef } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { deleteQuestionAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { UndoToast } from "@/components/admin/undo-toast";

const UNDO_SECONDS = 5;

type QuestionDeleteFormProps = {
  questionId: string;
  questionText: string;
};

export function QuestionDeleteForm({
  questionId,
  questionText,
}: QuestionDeleteFormProps) {
  const t = useTranslations("AdminQuestions");
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleDelete() {
    // Hide the row immediately so it reads as deleted, but defer the real
    // delete for UNDO_SECONDS so it can be taken back.
    const row = buttonRef.current?.closest(
      ".question-bank-card",
    ) as HTMLElement | null;
    if (row) row.style.display = "none";

    let cancelled = false;
    let toastId: string | number = "";
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      // Dismiss exactly when the timer ends so the toast doesn't linger past
      // the countdown; then commit the real delete.
      toast.dismiss(toastId);
      const formData = new FormData();
      formData.set("questionId", questionId);
      deleteQuestionAction(formData).catch(() => {
        if (row) row.style.display = "";
        toast.error(t("toastError"));
      });
    }, UNDO_SECONDS * 1000);

    toastId = toast.custom(
      (id) => (
        <UndoToast
          danger
          icon={<Trash2 size={16} />}
          title={t("toastDeleted")}
          subtitle={questionText}
          undoLabel={t("undo")}
          seconds={UNDO_SECONDS}
          onUndo={() => {
            cancelled = true;
            window.clearTimeout(timer);
            if (row) row.style.display = "";
            toast.dismiss(id);
          }}
        />
      ),
      // We drive dismissal ourselves (on undo or when the timer fires).
      { duration: Infinity },
    );
  }

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="ghost"
      size="icon"
      style={{ color: "var(--destructive)" }}
      aria-label={t("delete")}
      title={t("delete")}
      onClick={handleDelete}
    >
      <Trash2 size={16} />
    </Button>
  );
}
