import { Bot, Cpu, Rocket, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

const creatorIds = ["igor", "fahriyor", "nikita"] as const;
const serviceIds = ["aiProducts", "automation", "delivery"] as const;

export default async function CompanyPage() {
  const t = await getTranslations("CompanyPage");

  return (
    <main className="company-page">
      <section className="company-hero">
        <div className="company-hero-inner">
          <span className="company-eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            {t("eyebrow")}
          </span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
          <div className="company-hero-actions">
            <a className="company-primary-link" href="#team">
              {t("teamCta")}
            </a>
            <a className="company-secondary-link" href="mailto:hello@lap.inc">
              {t("contactCta")}
            </a>
          </div>
        </div>
      </section>

      <section className="company-section company-studio-section">
        <div>
          <span className="company-section-kicker">{t("studioKicker")}</span>
          <h2>{t("studioTitle")}</h2>
          <p>{t("studioDescription")}</p>
        </div>
        <div className="company-service-grid" aria-label={t("servicesLabel")}>
          {serviceIds.map((id, index) => {
            const Icon = index === 0 ? Bot : index === 1 ? Cpu : Rocket;

            return (
              <article className="company-service-item" key={id}>
                <Icon size={22} aria-hidden="true" />
                <strong>{t(`services.${id}.title`)}</strong>
                <span>{t(`services.${id}.description`)}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="company-section company-team-section" id="team">
        <div className="company-section-heading">
          <span className="company-section-kicker">{t("teamKicker")}</span>
          <h2>{t("teamTitle")}</h2>
          <p>{t("teamDescription")}</p>
        </div>
        <div className="company-team-grid">
          {creatorIds.map((id) => (
            <article className="company-founder" key={id}>
              <div className="company-founder-photo" aria-hidden="true">
                <span>{t("photoPlaceholder")}</span>
              </div>
              <div className="company-founder-copy">
                <h3>{t(`creators.${id}.name`)}</h3>
                <strong>{t(`creators.${id}.role`)}</strong>
                <p>{t(`creators.${id}.description`)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
