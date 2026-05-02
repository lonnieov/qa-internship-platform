"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportDownloadButton({ attemptId }: { attemptId: string }) {
  const t = useTranslations("AdminAttemptReport");

  return (
    <Button className="print-hidden" asChild>
      <a href={`/admin/attempts/${attemptId}/md`} download>
        <Download size={18} />
        {t("download")}
      </a>
    </Button>
  );
}
