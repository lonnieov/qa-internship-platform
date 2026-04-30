"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportPrintButton({ attemptId }: { attemptId: string }) {
  return (
    <Button className="print-hidden" asChild>
      <a href={`/admin/attempts/${attemptId}/pdf`} download>
        <Download size={18} />
        Скачать PDF
      </a>
    </Button>
  );
}
