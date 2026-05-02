"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

export function CopyableToken({ token }: { token: string }) {
  const t = useTranslations("AdminInterns");
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
      title={t("copy")}
      type="button"
    >
      <strong>{token}</strong>
      {copied ? <Check size={18} /> : <Copy size={18} />}
      <span className="copy-token-status">
        {copied ? t("copied") : t("copyHint")}
      </span>
    </button>
  );
}
