"use client";

import { useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, X } from "lucide-react";
import { createAiQuestionsAction } from "@/actions/admin";
import {
  AiQuestionGenerator,
  type AiQuestionSuggestion,
} from "@/components/admin/ai-question-generator";
import { Button } from "@/components/ui/button";
import { NativeDialog } from "@/components/ui/native-dialog";

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
  const titleId = useId();

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
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles size={14} />
        {t("ai.generateAction")}
      </Button>

      <NativeDialog labelledBy={titleId} onOpenChange={setIsOpen} open={isOpen}>
        <div className="wave-modal question-generate-modal surface">
          <div className="wave-modal-header">
            <div>
              <h2 className="head-3 m-0" id={titleId}>
                {t("ai.title")}
              </h2>
              <p className="body-2 muted m-0">
                {t("ai.target")}: <strong>{gradeName}</strong> ·{" "}
                <strong>{versionName}</strong>
              </p>
            </div>
            <Button
              aria-label={t("closeModal")}
              onClick={() => setIsOpen(false)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="wave-modal-body">
            <AiQuestionGenerator onAddAll={handleAddAll} />
          </div>
        </div>
      </NativeDialog>
    </>
  );
}
