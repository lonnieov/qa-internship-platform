"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportPrintButton() {
  return (
    <Button
      className="print-hidden"
      onClick={() => window.print()}
      type="button"
    >
      <Download size={18} />
      Скачать PDF
    </Button>
  );
}
