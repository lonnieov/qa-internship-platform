"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { QuestionForm } from "@/components/admin/question-form";
import { Button } from "@/components/ui/button";
import type { QuestionTrack } from "@/lib/question-classification";

type QuestionType = "QUIZ" | "API_SANDBOX" | "DEVTOOLS_SANDBOX";

function typeLabel(type: QuestionType) {
  if (type === "API_SANDBOX") return "API Sandbox";
  if (type === "DEVTOOLS_SANDBOX") return "DevTools Sandbox";
  return "Quiz";
}

export function QuestionCreateModal({
  initialType,
  initialTrack,
}: {
  initialType: QuestionType;
  initialTrack: QuestionTrack;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        <Plus size={18} />
        Добавить
      </Button>

      {isOpen ? (
        <div
          aria-labelledby="create-question-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="question-modal surface"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="head-3 m-0" id="create-question-title">
                  Новый вопрос
                </h2>
                <p className="body-2 muted m-0">{typeLabel(initialType)}</p>
              </div>
              <Button
                aria-label="Закрыть модальное окно"
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
              initialTrack={initialTrack}
              lockType
              showTitle={false}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
