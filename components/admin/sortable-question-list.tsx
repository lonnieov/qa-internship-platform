"use client";

import {
  Children,
  type DragEvent,
  type ReactNode,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { reorderQuestionsAction } from "@/actions/admin";

type SortableQuestionListProps = {
  questionIds: string[];
  children: ReactNode;
};

function moveId(items: string[], draggedId: string, overId: string) {
  const from = items.indexOf(draggedId);
  const to = items.indexOf(overId);

  if (from === -1 || to === -1 || from === to) return items;

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function sameOrder(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

export function SortableQuestionList({
  questionIds,
  children,
}: SortableQuestionListProps) {
  const router = useRouter();
  const [orderedIds, setOrderedIds] = useState(questionIds);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const childList = useMemo(() => Children.toArray(children), [children]);
  const childById = useMemo(() => {
    return new Map(questionIds.map((id, index) => [id, childList[index]]));
  }, [childList, questionIds]);

  function handleDragStart(event: DragEvent<HTMLButtonElement>, id: string) {
    setDraggedId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, id: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOverId(id);
    setOrderedIds((current) =>
      draggedId ? moveId(current, draggedId, id) : current,
    );
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const nextOrder = orderedIds;
    setDraggedId(null);
    setOverId(null);

    if (sameOrder(nextOrder, questionIds)) return;

    startTransition(async () => {
      await reorderQuestionsAction(nextOrder);
      router.refresh();
    });
  }

  function handleDragEnd() {
    setDraggedId(null);
    setOverId(null);
  }

  return (
    <div className={`question-dnd-list ${isPending ? "is-saving" : ""}`}>
      {orderedIds.map((id) => (
        <div
          className={`question-dnd-item ${draggedId === id ? "is-dragging" : ""} ${
            overId === id ? "is-over" : ""
          }`}
          key={id}
          onDragOver={(event) => handleDragOver(event, id)}
          onDrop={handleDrop}
        >
          <button
            aria-label="Перетащить вопрос"
            className="question-dnd-handle"
            draggable
            onDragEnd={handleDragEnd}
            onDragStart={(event) => handleDragStart(event, id)}
            type="button"
          >
            <GripVertical size={18} />
          </button>
          {childById.get(id)}
        </div>
      ))}
    </div>
  );
}
