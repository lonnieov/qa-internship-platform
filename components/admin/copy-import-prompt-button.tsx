"use client";

import { useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUESTION_IMPORT_PROMPT_TEMPLATE } from "@/lib/question-import-prompt";

export function CopyImportPromptButton() {
  const [label, setLabel] = useState("Скопировать промпт для LLM");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(QUESTION_IMPORT_PROMPT_TEMPLATE);
      setLabel("Скопировано!");
      setTimeout(() => setLabel("Скопировать промпт для LLM"), 2000);
    } catch {
      setLabel("Не удалось скопировать");
      setTimeout(() => setLabel("Скопировать промпт для LLM"), 2000);
    }
  };

  return (
    <Button type="button" size="sm" variant="secondary" onClick={copy}>
      <ClipboardCopy size={14} />
      {label}
    </Button>
  );
}
