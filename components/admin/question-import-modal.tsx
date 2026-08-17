"use client";

import { useActionState, useState } from "react";
import { Upload, X } from "lucide-react";
import {
  importQuestionsAction,
  type ImportQuestionsState,
} from "@/actions/admin";
import { CopyImportPromptButton } from "@/components/admin/copy-import-prompt-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QUESTION_IMPORT_PROMPT_TEMPLATE } from "@/lib/question-import-prompt";

const initialState: ImportQuestionsState = {
  ok: false,
  message: "",
};

export function QuestionImportModal({
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
  const [isOpen, setIsOpen] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [state, action, isPending] = useActionState(
    importQuestionsAction,
    initialState,
  );
  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary">
          <Upload size={14} />
          Импорт
        </Button>
      </DialogTrigger>

      <DialogContent variant="bare">
        <div className="wave-modal question-import-modal surface">
          <div className="wave-modal-header">
            <div>
              <DialogTitle className="head-3 m-0">
                Импорт вопросов из JSON
              </DialogTitle>
              <DialogDescription className="body-2 muted m-0">
                Вопросы добавятся в конец: <strong>{gradeName}</strong> ·{" "}
                <strong>{versionName}</strong>
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Закрыть"
              >
                <X size={16} />
              </Button>
            </DialogClose>
          </div>

          <div className="wave-modal-body">
            <div className="import-step">
              <span aria-hidden="true" className="import-step-number">
                1
              </span>
              <div className="import-step-body">
                <strong className="body-1">
                  Скопируйте промпт и отдайте его LLM
                </strong>
                <p className="body-2 muted m-0">
                  Промпт приводит любой список вопросов к формату платформы.
                </p>
                <div className="nav-row">
                  <CopyImportPromptButton />
                  <button
                    className="import-step-link"
                    onClick={() => setShowSpec((value) => !value)}
                    type="button"
                  >
                    {showSpec ? "Скрыть текст промпта" : "Показать текст промпта"}
                  </button>
                </div>
                {showSpec ? (
                  <pre className="question-import-spec body-2 m-0 whitespace-pre-wrap">
                    {QUESTION_IMPORT_PROMPT_TEMPLATE}
                  </pre>
                ) : null}
              </div>
            </div>

            <div className="import-step">
              <span aria-hidden="true" className="import-step-number">
                2
              </span>
              <div className="import-step-body">
                <strong className="body-1">Загрузите полученный JSON</strong>
                <p className="body-2 muted m-0">
                  Если хотя бы один вопрос не пройдёт проверку, не сохранится
                  ни один — файл можно поправить и загрузить снова.
                </p>
                <form action={action} className="stack" style={{ gap: 14 }}>
                  <input type="hidden" name="trackId" value={trackId} />
                  <input type="hidden" name="gradeId" value={gradeId} />
                  <input type="hidden" name="versionId" value={versionId} />
                  <input
                    accept=".json,application/json"
                    className="input"
                    name="file"
                    required
                    type="file"
                  />
                  <Button disabled={isPending} type="submit">
                    {isPending ? "Импортирую…" : "Загрузить"}
                  </Button>
                </form>
              </div>
            </div>

            {state.message ? (
              <div
                className="soft-panel stack"
                style={{
                  borderColor: state.ok
                    ? "var(--accent)"
                    : "var(--destructive)",
                }}
              >
                <p
                  className="body-2 m-0"
                  style={{
                    color: state.ok ? "var(--accent)" : "var(--destructive)",
                    fontWeight: 600,
                  }}
                >
                  {state.message}
                </p>
                {state.errors?.length ? (
                  <ul
                    className="body-2 m-0 pl-5"
                    style={{ color: "var(--destructive)" }}
                  >
                    {state.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
