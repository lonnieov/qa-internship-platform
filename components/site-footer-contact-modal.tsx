"use client";

import { useId, useState } from "react";
import { ExternalLink, MessageCircle, X } from "lucide-react";
import { NativeDialog } from "@/components/ui/native-dialog";

type ContactLink = {
  href: string;
  label: string;
};

type SiteFooterContactModalProps = {
  buttonLabel: string;
  title: string;
  description: string;
  closeLabel: string;
  contacts: ContactLink[];
};

export function SiteFooterContactModal({
  buttonLabel,
  title,
  description,
  closeLabel,
  contacts,
}: SiteFooterContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        className="site-footer-button"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <MessageCircle size={16} aria-hidden="true" />
        {buttonLabel}
      </button>

      <NativeDialog
        labelledBy={titleId}
        onOpenChange={setIsOpen}
        open={isOpen}
      >
          <div className="site-footer-modal">
            <div className="site-footer-modal-header">
              <div>
                <h2 id={titleId}>{title}</h2>
                <p>{description}</p>
              </div>
              <button
                aria-label={closeLabel}
                className="site-footer-modal-close"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="site-footer-modal-links">
              {contacts.map((contact) => (
                <a
                  href={contact.href}
                  key={contact.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{contact.label}</span>
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
      </NativeDialog>
    </>
  );
}
