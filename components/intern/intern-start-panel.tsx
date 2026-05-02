"use client";

import { useState } from "react";
import { ArrowRight, Check, Clock3, HelpCircle, Info, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { startAttemptAction } from "@/actions/intern";
import { Button } from "@/components/ui/button";

export function InternStartPanel({
  hasActiveQuestions,
  hasActiveAttempt,
}: {
  hasActiveQuestions: boolean;
  hasActiveAttempt: boolean;
}) {
  const t = useTranslations("InternHome");
  const readinessChecks = [
    t("checkQuiet"),
    t("checkTime"),
    t("checkConnection"),
    t("checkRules"),
  ];
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    readinessChecks.map(() => false),
  );
  const checkedCount = checkedItems.filter(Boolean).length;
  const progress = Math.round((checkedCount / readinessChecks.length) * 100);
  const canStart =
    hasActiveAttempt ||
    (hasActiveQuestions && checkedCount === readinessChecks.length);

  function toggleCheck(index: number) {
    setCheckedItems((current) =>
      current.map((checked, itemIndex) =>
        itemIndex === index ? !checked : checked,
      ),
    );
  }

  return (
    <>
      <section className="intern-assessment-grid">
        <div className="intern-assessment-card">
          <div className="intern-assessment-card-header">
            <h2>{t("topicsTitle")}</h2>
            <p>{t("topicsDescription")}</p>
          </div>
          <div className="intern-topic-list">
            {[
              ["01", t("topicTesting"), t("topicTestingDescription")],
              [
                "02",
                t("topicDesign"),
                t("topicDesignDescription"),
              ],
              ["03", t("topicBugs"), t("topicBugsDescription")],
              ["04", t("topicApi"), t("topicApiDescription")],
            ].map(([number, title, description]) => (
              <div className="intern-topic-row" key={number}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="intern-assessment-card">
          <div className="intern-assessment-card-header">
            <h2>{t("readinessTitle")}</h2>
            <p>{t("readinessDescription")}</p>
          </div>
          <div className="intern-checklist">
            {readinessChecks.map((label, index) => (
              <label className="intern-check-row" key={label}>
                <input
                  checked={checkedItems[index]}
                  type="checkbox"
                  onChange={() => toggleCheck(index)}
                />
                <span className="intern-check-box">
                  <Check size={11} />
                </span>
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="intern-section-row">
        <h2>{t("rulesTitle")}</h2>
        <span>{t("rulesMeta")}</span>
      </section>
      <section className="intern-rule-grid">
        <div className="intern-rule-card">
          <Clock3 size={17} />
          <div>
            <strong>{t("timerRuleTitle")}</strong>
            <p>{t("timerRuleDescription")}</p>
          </div>
        </div>
        <div className="intern-rule-card">
          <HelpCircle size={17} />
          <div>
            <strong>{t("returnRuleTitle")}</strong>
            <p>{t("returnRuleDescription")}</p>
          </div>
        </div>
        <div className="intern-rule-card">
          <ShieldCheck size={17} />
          <div>
            <strong>{t("autosaveRuleTitle")}</strong>
            <p>{t("autosaveRuleDescription")}</p>
          </div>
        </div>
      </section>

      <section className="intern-section-row">
        <h2>{t("launchTitle")}</h2>
        <span>
          {hasActiveAttempt
            ? t("activeAttempt")
            : t("readyCount", {
                checked: checkedCount,
                total: readinessChecks.length,
              })}
        </span>
      </section>

      <section className="intern-cta-card">
        <div className="intern-cta-copy">
          <h3>{hasActiveAttempt ? t("continueTitle") : t("readyTitle")}</h3>
          <p>
            {hasActiveAttempt
              ? t("continueDescription")
            : hasActiveQuestions
              ? t("startDescription")
              : t("noQuestions")}
          </p>
          <div className="intern-cta-progress" aria-label={t("readinessProgress")}>
            <div>
              <span style={{ width: `${hasActiveAttempt ? 100 : progress}%` }} />
            </div>
            <strong>{hasActiveAttempt ? "100%" : `${progress}%`}</strong>
          </div>
          <p className="intern-footnote">
            <Info size={12} />
            {t("footnote")}
          </p>
        </div>
        <form action={startAttemptAction}>
          <Button className="intern-start-button" disabled={!canStart} type="submit">
            {hasActiveAttempt ? t("continueButton") : t("startButton")}
            <ArrowRight size={15} />
          </Button>
        </form>
      </section>
    </>
  );
}
