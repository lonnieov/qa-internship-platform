"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportDownloadButton({ attemptId }: { attemptId: string }) {
  return (
    <Button className="print-hidden" asChild>
      <a href={`/admin/attempts/${attemptId}/md`} download>
        <Download size={18} />
        Скачать MD
      </a>
    </Button>
  );
}
