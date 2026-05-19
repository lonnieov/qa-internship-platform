"use client";

import { useLocale, useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportDownloadButton({ attemptId }: { attemptId: string }) {
  const t = useTranslations("AdminAttemptReport");
  const locale = useLocale();

  return (
    <Button className="print-hidden" asChild>
      <a href={`/${locale}/admin/attempts/${attemptId}/md`} download>
        <Download size={18} />
        {t("download")}
      </a>
    </Button>
  );
}
