"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyableToken({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(token);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="copy-token"
      onClick={copyToken}
      title="Скопировать токен"
      type="button"
    >
      <strong>{token}</strong>
      {copied ? <Check size={18} /> : <Copy size={18} />}
      <span className="copy-token-status">
        {copied ? "Скопировано" : "Нажмите, чтобы скопировать"}
      </span>
    </button>
  );
}
