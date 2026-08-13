"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Paperclip, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function AiQuestionGenerator({
  onPick,
  onAddAll,
}: {
  onPick?: (suggestion: AiQuestionSuggestion) => void;
  onAddAll?: (
    suggestions: AiQuestionSuggestion[],
  ) => Promise<{ ok: boolean; message: string }>;
}) {
  const t = useTranslations("AdminQuestions");
  const [topic, setTopic] = useState(t("ai.defaultTopic"));
  const [vacancy, setVacancy] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<AiQuestionSuggestion[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [addAllLoading, setAddAllLoading] = useState(false);

  function clearCvFile() {
    setCvFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function addAll() {
    if (!onAddAll || items.length === 0) return;
    setAddAllLoading(true);
    setMessage("");

    const result = await onAddAll(items);
    setAddAllLoading(false);
    setMessage(result.message);
    if (result.ok) setItems([]);
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

    setItems(data.questions ?? []);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("ai.title")}</CardTitle>
      </CardHeader>
      <CardContent className="stack">
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
        <div className="nav-row">
          <Button type="button" variant="secondary" onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="ai-thinking-icon" />
            ) : (
              <Sparkles size={18} />
            )}
            {t("ai.generate")}
          </Button>
          {onAddAll && items.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={addAll}
              disabled={addAllLoading || loading}
            >
              {addAllLoading ? (
                <Loader2 size={18} className="ai-thinking-icon" />
              ) : null}
              {t("ai.addAll")}
            </Button>
          ) : null}
        </div>
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
        {loading ? (
          <div className="ai-thinking body-2">
            <Loader2 size={16} className="ai-thinking-icon" />
            <span>{t("ai.generating")}</span>
            <span className="ai-thinking-dots">
              <span className="ai-thinking-dot" />
              <span className="ai-thinking-dot" />
              <span className="ai-thinking-dot" />
            </span>
          </div>
        ) : null}
        {message ? <p className="body-2 muted m-0">{message}</p> : null}
        <div className="stack">
          {items.map((item, index) => {
            const isOpen = item.type === "open" || !item.options?.length;

            return (
              <div className="soft-panel stack" key={`${item.text}-${index}`}>
                <strong>{item.text}</strong>
                {isOpen ? (
                  item.answer ? (
                    <p className="body-2 muted m-0">
                      {t("ai.openAnswerLabel")}: {item.answer}
                    </p>
                  ) : null
                ) : (
                  <ol className="m-0 pl-5 body-2">
                    {item.options!.map((option, optionIndex) => (
                      <li key={option}>
                        {option}
                        {optionIndex === item.correctIndex
                          ? ` ${t("ai.correctSuffix")}`
                          : ""}
                      </li>
                    ))}
                  </ol>
                )}
                {onPick ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onPick(item)}
                  >
                    {t("ai.useSuggestion")}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
