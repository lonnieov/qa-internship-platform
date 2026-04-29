"use client";

import { useRef, useState, type ReactNode, type UIEvent } from "react";

type JsonEditorProps = {
  id: string;
  name: string;
  defaultValue: string;
  required?: boolean;
};

const tokenPattern =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g;

function renderJsonTokens(value: string) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(value.slice(lastIndex, index));
    }

    if (match[1]) {
      nodes.push(
        <span
          className={match[2] ? "json-token-key" : "json-token-string"}
          key={`${index}-string`}
        >
          {match[1]}
        </span>,
      );
      if (match[2]) {
        nodes.push(
          <span className="json-token-punctuation" key={`${index}-colon`}>
            {match[2]}
          </span>,
        );
      }
    } else if (match[3]) {
      nodes.push(
        <span className="json-token-literal" key={`${index}-literal`}>
          {token}
        </span>,
      );
    } else if (/^-?\d/.test(token)) {
      nodes.push(
        <span className="json-token-number" key={`${index}-number`}>
          {token}
        </span>,
      );
    } else {
      nodes.push(
        <span className="json-token-punctuation" key={`${index}-punctuation`}>
          {token}
        </span>,
      );
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : "\n";
}

export function JsonEditor({
  id,
  name,
  defaultValue,
  required,
}: JsonEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const highlightRef = useRef<HTMLPreElement>(null);

  function syncScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = event.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
  }

  return (
    <div className="json-editor">
      <pre
        aria-hidden="true"
        className="json-editor-highlight"
        ref={highlightRef}
      >
        <code>{renderJsonTokens(value)}</code>
      </pre>
      <textarea
        aria-label={name}
        className="json-editor-input"
        id={id}
        name={name}
        onChange={(event) => setValue(event.target.value)}
        onScroll={syncScroll}
        required={required}
        spellCheck={false}
        value={value}
      />
    </div>
  );
}
