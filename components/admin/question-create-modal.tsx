"use client";

import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { QuestionForm } from "@/components/admin/question-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus size={16} />
          {t("add")}
        </Button>
      </DialogTrigger>

      <DialogContent variant="bare">
          <div className="question-modal surface">
            <div className="modal-header">
              <div>
                <DialogTitle className="head-3 m-0">
                  {t("newQuestion")}
                </DialogTitle>
                <DialogDescription className="body-2 muted m-0">
                  {typeLabel(t, initialType)}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button
                  aria-label={t("closeModal")}
                  type="button"
                  variant="ghost"
                >
                  <X size={18} />
                </Button>
              </DialogClose>
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
      </DialogContent>
    </Dialog>
  );
}
