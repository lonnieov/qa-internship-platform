"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Paperclip, Pencil, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type AiQuestionSuggestion = {
  type?: "closed" | "open";
  text: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
};

/** A suggestion plus the reviewer's decision about it, before anything is saved. */
type DraftSuggestion = AiQuestionSuggestion & { selected: boolean };

export function AiQuestionGenerator({
  onAddAll,
}: {
  onAddAll?: (
    suggestions: AiQuestionSuggestion[],
  ) => Promise<{ ok: boolean; message: string }>;
}) {
  const t = useTranslations("AdminQuestions");
  const [topic, setTopic] = useState(t("ai.defaultTopic"));
  const [vacancy, setVacancy] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<DraftSuggestion[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [addAllLoading, setAddAllLoading] = useState(false);

  const selectedItems = items.filter((item) => item.selected);

  function clearCvFile() {
    setCvFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateItem(index: number, patch: Partial<DraftSuggestion>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function updateOption(index: number, optionIndex: number, value: string) {
    setItems((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              options: (item.options ?? []).map((option, oi) =>
                oi === optionIndex ? value : option,
              ),
            }
          : item,
      ),
    );
  }

  function toggleAll(selected: boolean) {
    setItems((current) => current.map((item) => ({ ...item, selected })));
  }

  async function addSelected() {
    if (!onAddAll || selectedItems.length === 0) return;
    setAddAllLoading(true);
    setMessage("");

    const result = await onAddAll(
      selectedItems.map(({ selected: _selected, ...suggestion }) => suggestion),
    );
    setAddAllLoading(false);
    setMessage(result.message);

    if (result.ok) {
      // Keep whatever the reviewer chose not to add, so a partial pick can be
      // refined and submitted again instead of being regenerated from scratch.
      setItems((current) => current.filter((item) => !item.selected));
      setEditingIndex(null);
    }
  }

  async function generate() {
    setLoading(true);
    setMessage("");

    const requestBody = new FormData();
    requestBody.set("topic", topic);
    if (vacancy.trim()) requestBody.set("vacancy", vacancy.trim());
    if (cvFile) requestBody.set("cv", cvFile);

    const response = await fetch("/api/ai/questions", {
      method: "POST",
      body: requestBody,
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? t("ai.error"));
      return;
    }

    // Everything starts selected: the common case is keeping the batch, and
    // unticking the odd miss is less work than ticking everything else.
    setItems(
      (data.questions ?? []).map((question: AiQuestionSuggestion) => ({
        ...question,
        selected: true,
      })),
    );
    setEditingIndex(null);
  }

  // No card frame or title of its own: the dialog that hosts this already
  // provides both.
  return (
    <div className="stack">
        <div className="form-grid">
          <Label htmlFor="topic">{t("ai.topic")}</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
        </div>
        <div className="form-grid">
          <Label htmlFor="vacancy">{t("ai.vacancy")}</Label>
          <Textarea
            id="vacancy"
            value={vacancy}
            onChange={(event) => setVacancy(event.target.value)}
            placeholder={t("ai.vacancyPlaceholder")}
          />
        </div>
        {/* Attaching the CV belongs before generating, not after it. */}
        <div className="form-grid">
          <input
            ref={fileInputRef}
            id="cv"
            className="sr-only"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
          />
          <div className="nav-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={18} />
              {cvFile ? cvFile.name : t("ai.cvButton")}
            </Button>
            {cvFile ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearCvFile}>
                <X size={16} />
              </Button>
            ) : null}
          </div>
          <p className="body-2 muted m-0">{t("ai.cvHint")}</p>
        </div>
        <div className="nav-row">
          <Button type="button" onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="ai-thinking-icon" />
            ) : (
              <Sparkles size={18} />
            )}
            {items.length > 0 ? t("ai.regenerate") : t("ai.generate")}
          </Button>
        </div>
        {loading ? (
          <p className="ai-thinking body-2 muted m-0">{t("ai.generating")}</p>
        ) : null}
        {message ? <p className="body-2 muted m-0">{message}</p> : null}

        {items.length > 0 ? (
          <div className="stack ai-review">
            <div className="ai-review-summary">
              <span className="body-2 muted">
                {t("ai.reviewSummary", {
                  total: items.length,
                  selected: selectedItems.length,
                })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleAll(selectedItems.length !== items.length)}
              >
                {selectedItems.length === items.length
                  ? t("ai.clearAll")
                  : t("ai.selectAll")}
              </Button>
            </div>

            {items.map((item, index) => {
              const isOpen = item.type === "open" || !item.options?.length;
              const isEditing = editingIndex === index;

              return (
                <div
                  className={`ai-review-item soft-panel ${item.selected ? "selected" : ""}`}
                  key={index}
                >
                  <input
                    aria-label={t("ai.selectQuestion", { index: index + 1 })}
                    checked={item.selected}
                    className="ai-review-check"
                    onChange={(event) =>
                      updateItem(index, { selected: event.target.checked })
                    }
                    type="checkbox"
                  />

                  <div className="ai-review-body stack">
                    {isEditing ? (
                      <Textarea
                        aria-label={t("ai.questionText")}
                        onChange={(event) =>
                          updateItem(index, { text: event.target.value })
                        }
                        rows={2}
                        value={item.text}
                      />
                    ) : (
                      <strong>{item.text}</strong>
                    )}

                    {isOpen ? (
                      isEditing ? (
                        <Textarea
                          aria-label={t("ai.openAnswerLabel")}
                          onChange={(event) =>
                            updateItem(index, { answer: event.target.value })
                          }
                          placeholder={t("ai.openAnswerLabel")}
                          rows={2}
                          value={item.answer ?? ""}
                        />
                      ) : item.answer ? (
                        <p className="body-2 muted m-0">
                          {t("ai.openAnswerLabel")}: {item.answer}
                        </p>
                      ) : null
                    ) : isEditing ? (
                      <div className="stack" style={{ gap: 6 }}>
                        {item.options!.map((option, optionIndex) => (
                          <label className="ai-review-option" key={optionIndex}>
                            <input
                              aria-label={t("ai.correctSuffix")}
                              checked={optionIndex === item.correctIndex}
                              name={`ai-correct-${index}`}
                              onChange={() =>
                                updateItem(index, { correctIndex: optionIndex })
                              }
                              type="radio"
                            />
                            <Input
                              onChange={(event) =>
                                updateOption(index, optionIndex, event.target.value)
                              }
                              value={option}
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <ol className="m-0 pl-5 body-2">
                        {item.options!.map((option, optionIndex) => (
                          <li key={optionIndex}>
                            {option}
                            {optionIndex === item.correctIndex
                              ? ` ${t("ai.correctSuffix")}`
                              : ""}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  <Button
                    aria-label={isEditing ? t("ai.editDone") : t("ai.edit")}
                    onClick={() => setEditingIndex(isEditing ? null : index)}
                    size="icon"
                    title={isEditing ? t("ai.editDone") : t("ai.edit")}
                    type="button"
                    variant="ghost"
                  >
                    {isEditing ? <Check size={16} /> : <Pencil size={16} />}
                  </Button>
                </div>
              );
            })}

            {onAddAll ? (
              <div className="nav-row" style={{ justifyContent: "flex-end" }}>
                <Button
                  disabled={
                    addAllLoading || loading || selectedItems.length === 0
                  }
                  onClick={addSelected}
                  type="button"
                >
                  {addAllLoading ? (
                    <Loader2 size={18} className="ai-thinking-icon" />
                  ) : null}
                  {t("ai.addSelected", { count: selectedItems.length })}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
    </div>
  );
}
