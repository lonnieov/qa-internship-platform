"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, X } from "lucide-react";
import { createAiQuestionsAction } from "@/actions/admin";
import {
  AiQuestionGenerator,
  type AiQuestionSuggestion,
} from "@/components/admin/ai-question-generator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Standalone entry point for AI generation. It used to be a collapsible panel
 * inside the "new question" dialog, which mixed two different jobs: writing one
 * question by hand and producing a batch. Here the batch is the whole dialog,
 * and the target grade/version is stated up front the way the import flow does.
 */
export function QuestionGenerateModal({
  trackId,
  gradeId,
  gradeName,
  versionId,
  versionName,
}: {
  trackId: string;
  gradeId: string;
  gradeName: string;
  versionId: string;
  versionName: string;
}) {
  const t = useTranslations("AdminQuestions");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  async function handleAddAll(suggestions: AiQuestionSuggestion[]) {
    const result = await createAiQuestionsAction(suggestions, {
      trackId,
      gradeId,
      versionId,
    });

    if (result.ok) {
      // Hand the reviewer back to the list they just filled, with a toast
      // saying how many landed, instead of leaving the dialog open on top.
      setIsOpen(false);
      const params = new URLSearchParams(searchParams.toString());
      params.set("added", String(suggestions.length));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      router.refresh();
    }

    return result;
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary">
          <Sparkles size={14} />
          {t("ai.generateAction")}
        </Button>
      </DialogTrigger>

      <DialogContent variant="bare">
        <div className="wave-modal question-generate-modal surface">
          <div className="wave-modal-header">
            <div>
              <DialogTitle className="head-3 m-0">{t("ai.title")}</DialogTitle>
              <DialogDescription className="body-2 muted m-0">
                {t("ai.target")}: <strong>{gradeName}</strong> ·{" "}
                <strong>{versionName}</strong>
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                aria-label={t("closeModal")}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X size={16} />
              </Button>
            </DialogClose>
          </div>

          <div className="wave-modal-body">
            <AiQuestionGenerator onAddAll={handleAddAll} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
