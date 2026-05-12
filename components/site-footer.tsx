import Link from "next/link";
import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ServiceLogo } from "@/components/service-logo";
import { SiteFooterContactModal } from "@/components/site-footer-contact-modal";

const contactEmail = "hello@lap.inc";
const contactLinks = [
  { label: "@lonnieov", href: "https://t.me/lonnieov" },
  { label: "@livievi_i", href: "https://t.me/livievi_i" },
  { label: "@faxa0_0", href: "https://t.me/faxa0_0" },
];

type SiteFooterProps = {
  locale: string;
};

export async function SiteFooter({ locale }: SiteFooterProps) {
  const t = await getTranslations("SiteFooter");
  const year = new Date().getFullYear();
  const companyHref = `/${locale}/company`;

  return (
    <footer className="site-footer" id="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <div className="site-footer-logo">
              <ServiceLogo />
              <Link className="site-footer-brand-link" href={companyHref}>
                {t("brand")}
              </Link>
            </div>
            <p>{t("description")}</p>
            <div className="site-footer-contact-list" aria-label={t("contactsLabel")}>
              <a href={`mailto:${contactEmail}`}>
                <Mail size={16} aria-hidden="true" />
                {contactEmail}
              </a>
            </div>
          </div>

          <div className="site-footer-owner">
            <h2>{t("ownerTitle")}</h2>
            <div className="site-footer-owner-copy">
              <Link className="site-footer-owner-link" href={companyHref}>
                {t("ownerName")}
              </Link>
              <span>{t("terms")}</span>
            </div>
            <SiteFooterContactModal
              buttonLabel={t("contactButton")}
              title={t("contactDialogTitle")}
              description={t("contactDialogDescription")}
              closeLabel={t("closeContactDialog")}
              contacts={contactLinks}
            />
          </div>
        </div>

        <p className="site-footer-bottom">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
