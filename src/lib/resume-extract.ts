import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_RESUME_TEXT_LENGTH = 12000;

export class UnsupportedResumeFileError extends Error {}
export class ResumeFileTooLargeError extends Error {}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isDocx(file: File) {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

// Runs server-side only (Node runtime) — extracts plain text from an admin-
// uploaded CV so it can be folded into the AI question-generation prompt.
// Nothing here is persisted; the file and its text live only for this request.
export async function extractResumeText(file: File): Promise<string> {
  if (file.size > MAX_RESUME_FILE_BYTES) {
    throw new ResumeFileTooLargeError();
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (isPdf(file)) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText({ pageJoiner: "" });
      return result.text.slice(0, MAX_RESUME_TEXT_LENGTH);
    } finally {
      await parser.destroy();
    }
  }

  if (isDocx(file)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.slice(0, MAX_RESUME_TEXT_LENGTH);
  }

  throw new UnsupportedResumeFileError();
}
