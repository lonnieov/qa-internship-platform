"use client";

import { useActionState, useId, useState } from "react";
import { FileJson, Upload, X } from "lucide-react";
import {
  importQuestionsAction,
  type ImportQuestionsState,
} from "@/actions/admin";
import { CopyImportPromptButton } from "@/components/admin/copy-import-prompt-button";
import { Button } from "@/components/ui/button";
import { NativeDialog } from "@/components/ui/native-dialog";
import { QUESTION_IMPORT_PROMPT_TEMPLATE } from "@/lib/question-import-prompt";

const initialState: ImportQuestionsState = {
  ok: false,
  message: "",
};

export function QuestionImportModal({
  trackId,
  gradeId,
  versionId,
}: {
  trackId: string;
  gradeId: string;
  versionId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [state, action, isPending] = useActionState(
    importQuestionsAction,
    initialState,
  );
  const titleId = useId();

  const close = () => setIsOpen(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setIsOpen(true)}
      >
        <Upload size={14} />
        Импорт
      </Button>

      <NativeDialog labelledBy={titleId} onOpenChange={setIsOpen} open={isOpen}>
        <div className="wave-modal question-import-modal surface">
          <div className="wave-modal-header">
            <div>
              <h2 className="head-3 m-0" id={titleId}>
                Импорт вопросов из JSON
              </h2>
              <p className="body-2 muted m-0">
                Вопросы добавятся в конец текущей версии.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Закрыть"
              onClick={close}
            >
              <X size={16} />
            </Button>
          </div>

          <div className="wave-modal-body">
            <button
              type="button"
              onClick={() => setShowSpec((value) => !value)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                color: "var(--primary)",
                cursor: "pointer",
                padding: 0,
                fontSize: 13,
                justifySelf: "start",
              }}
            >
              <FileJson size={14} />
              {showSpec
                ? "Скрыть формат и промпт для LLM"
                : "Показать формат и промпт для LLM"}
            </button>

            {showSpec ? (
              <div className="soft-panel stack">
                <pre className="question-import-spec body-2 m-0 whitespace-pre-wrap">
                  {QUESTION_IMPORT_PROMPT_TEMPLATE}
                </pre>
                <CopyImportPromptButton />
              </div>
            ) : null}

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
      </NativeDialog>
    </>
  );
}
