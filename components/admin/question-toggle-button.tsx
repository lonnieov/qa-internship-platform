"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { toggleQuestionAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { UndoToast } from "@/components/admin/undo-toast";

const UNDO_SECONDS = 5;

type QuestionToggleButtonProps = {
  questionId: string;
  questionText: string;
  isActive: boolean;
};

export function QuestionToggleButton({
  questionId,
  questionText,
  isActive,
}: QuestionToggleButtonProps) {
  const t = useTranslations("AdminQuestions");
  const actionLabel = isActive ? t("hide") : t("activate");

  function handleToggle() {
    // Defer the toggle so it can be undone; commit once the countdown ends.
    let cancelled = false;
    let toastId: string | number = "";
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      toast.dismiss(toastId);
      const formData = new FormData();
      formData.set("questionId", questionId);
      formData.set("isActive", String(isActive));
      toggleQuestionAction(formData).catch(() => toast.error(t("toastError")));
    }, UNDO_SECONDS * 1000);

    toastId = toast.custom(
      (id) => (
        <UndoToast
          icon={isActive ? <EyeOff size={16} /> : <Eye size={16} />}
          title={isActive ? t("toastHidden") : t("toastActivated")}
          subtitle={questionText}
          undoLabel={t("undo")}
          seconds={UNDO_SECONDS}
          onUndo={() => {
            cancelled = true;
            window.clearTimeout(timer);
            toast.dismiss(id);
          }}
        />
      ),
      { duration: Infinity },
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={actionLabel}
      title={actionLabel}
      onClick={handleToggle}
    >
      {isActive ? <EyeOff size={16} /> : <Eye size={16} />}
    </Button>
  );
}
