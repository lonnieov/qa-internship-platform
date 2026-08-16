"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { QuestionForm } from "@/components/admin/question-form";
import { Button } from "@/components/ui/button";
import { NativeDialog } from "@/components/ui/native-dialog";
import { type TrackSummary } from "@/lib/question-classification";

type QuestionType =
  | "QUIZ"
  | "API_SANDBOX"
  | "SQL_SANDBOX"
  | "DEVTOOLS_SANDBOX"
  | "MANUAL_QA_SANDBOX"
  | "AUTOTEST_SANDBOX";

function typeLabel(
  t: ReturnType<typeof useTranslations>,
  type: QuestionType,
) {
  if (type === "API_SANDBOX") return t("typeLabels.api");
  if (type === "SQL_SANDBOX") return t("typeLabels.sql");
  if (type === "DEVTOOLS_SANDBOX") return t("typeLabels.devtools");
  if (type === "MANUAL_QA_SANDBOX") return t("typeLabels.manualQa");
  if (type === "AUTOTEST_SANDBOX") return t("typeLabels.autotest");
  return t("typeLabels.quiz");
}

export function QuestionCreateModal({
  initialType,
  initialTrackId,
  initialGradeId,
  initialVersionId,
  tracks,
}: {
  initialType: QuestionType;
  initialTrackId?: string;
  initialGradeId?: string;
  initialVersionId?: string;
  tracks: TrackSummary[];
}) {
  const t = useTranslations("AdminQuestions");
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <Button type="button" size="sm" onClick={() => setIsOpen(true)}>
        <Plus size={16} />
        {t("add")}
      </Button>

      <NativeDialog
        labelledBy={titleId}
        onOpenChange={setIsOpen}
        open={isOpen}
      >
          <div className="question-modal surface">
            <div className="modal-header">
              <div>
                <h2 className="head-3 m-0" id={titleId}>
                  {t("newQuestion")}
                </h2>
                <p className="body-2 muted m-0">{typeLabel(t, initialType)}</p>
              </div>
              <Button
                aria-label={t("closeModal")}
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>

            <QuestionForm
              embedded
              initialType={initialType}
              initialTrackId={initialTrackId}
              initialGradeId={initialGradeId}
              initialVersionId={initialVersionId}
              lockType
              showTitle={false}
              tracks={tracks}
            />
          </div>
      </NativeDialog>
    </>
  );
}
