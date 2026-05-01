"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  HelpCircle,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
export { clickSuperAppInstallmentWidgetPresetConfig } from "@/lib/manual-qa-sandbox";

type PaymentScreen = "amount" | "confirm" | "success";

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.max(0, value));
}

function parseAmount(value: string) {
  const normalized = value.replace(/[^\d]/g, "");
  return Number(normalized || 0);
}

export function ClickSuperAppInstallmentWidgetPreset() {
  const [screen, setScreen] = useState<PaymentScreen>("amount");
  const [amountText, setAmountText] = useState("");
  const [isInstallmentActive, setIsInstallmentActive] = useState(false);
  const [wasInstallmentActivated, setWasInstallmentActivated] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const amount = parseAmount(amountText);

  const canContinue = amount > 0;
  const widgetVisible = amount >= 1000 && amount < 200000;
  const paymentButtonLabel =
    isInstallmentActive || (!widgetVisible && wasInstallmentActivated)
      ? "Deferred payment"
      : "Payment";
  const cardLabel =
    isInstallmentActive || wasInstallmentActivated
      ? "Automatically debiting card:"
      : "Debit card:";

  const dueDate = useMemo(() => {
    const date = new Date(2026, 4, 11);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  }, []);

  function goBack() {
    if (screen === "confirm") {
      setScreen("amount");
      return;
    }

    if (screen === "success") {
      setScreen("confirm");
    }
  }

  function toggleInstallment(value: boolean) {
    setIsInstallmentActive(value);
    if (value) {
      setWasInstallmentActivated(true);
    }
  }

  return (
    <div
      className="manual-qa-phone installment-phone"
      data-preset="click-super-app-installment-widget-v1"
    >
      <div className="installment-statusbar">
        <span>1:56</span>
        <strong>click</strong>
        <span>25%</span>
      </div>

      <div className="installment-appbar">
        {screen !== "amount" ? (
          <button
            aria-label="Назад"
            className="installment-back"
            onClick={goBack}
            type="button"
          >
            <ChevronLeft size={26} />
          </button>
        ) : (
          <button aria-label="Назад" className="installment-back" type="button">
            <ArrowLeft size={24} />
          </button>
        )}
        <strong>Shishka</strong>
      </div>

      {screen === "amount" ? (
        <div className="installment-screen installment-amount-screen">
          <section className="installment-merchant">
            <div className="installment-merchant-logo">ШИШКА</div>
            <div>
              <strong>ул. Кичик Халка йули,35</strong>
              <span>Cashback 0%-2%</span>
            </div>
          </section>

          <label className="installment-field">
            <span>Payment amount</span>
            <input
              autoComplete="off"
              inputMode="numeric"
              onChange={(event) => setAmountText(event.target.value)}
              placeholder="0 UZS"
              value={amountText}
            />
          </label>

          <Button
            className="installment-primary"
            disabled={!canContinue}
            onClick={() => setScreen("confirm")}
            type="button"
          >
            Continue
          </Button>
        </div>
      ) : null}

      {screen === "confirm" ? (
        <div className="installment-screen installment-confirm-screen">
          <section className="installment-details">
            <strong>Details:</strong>
            <dl>
              <div>
                <dt>Payment amount:</dt>
                <dd>{formatMoney(amount)} UZS</dd>
              </div>
              <div>
                <dt>Service ID:</dt>
                <dd>52528</dd>
              </div>
              <div>
                <dt>Cashback:</dt>
                <dd>0%</dd>
              </div>
            </dl>
          </section>

          <section className="installment-premium-banner">
            <span>♛</span>
            <div>
              <strong>Free transfers</strong>
              <small>Activate Click Premium subscription</small>
            </div>
            <button aria-label="Закрыть баннер" type="button">
              <X size={18} />
            </button>
          </section>

          <div className="installment-spacer" />

          {widgetVisible ? (
            <section className="installment-widget">
              <div className="installment-widget-header">
                <span className="installment-brand-mark" />
                <div>
                  <strong>Deferred payment</strong>
                  <small>for 10 days</small>
                </div>
                <button
                  aria-label="Информация о рассрочке"
                  className="installment-help"
                  onClick={() => setIsInfoOpen(true)}
                  type="button"
                >
                  <HelpCircle size={20} />
                </button>
                <label className="installment-switch">
                  <input
                    checked={isInstallmentActive}
                    onChange={(event) =>
                      toggleInstallment(event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span />
                </label>
              </div>

              <p className="installment-blue-note">
                We&apos;ll pay for you today, and you must return{" "}
                {formatMoney(amount)} UZS via MiniApp by {dueDate}
              </p>

              <div className="installment-timeline">
                <div>
                  <span>today</span>
                  <strong>0 UZS</strong>
                </div>
                <div>
                  <span>{dueDate}</span>
                  <strong>{formatMoney(amount)} UZS</strong>
                </div>
              </div>
              <div className="installment-range">
                <span />
                <span />
              </div>
            </section>
          ) : null}

          <section className="installment-card-block">
            <h3>{cardLabel}</h3>
            <div className="installment-card-row">
              <div className="installment-card">
                <CreditCard size={28} />
                <div>
                  <strong>2 850 UZS</strong>
                  <small>Новое название</small>
                  <small>U * 1876</small>
                </div>
              </div>
              <button type="button">Choose another card</button>
            </div>
          </section>

          <Button
            className="installment-primary"
            onClick={() => setScreen("success")}
            type="button"
          >
            {paymentButtonLabel}
          </Button>

          {isInstallmentActive ? (
            <p className="installment-agreement">
              By clicking the &quot;Postpone payment&quot; button, you agree to
              the terms of the <span>agreement</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {screen === "success" ? (
        <div className="installment-success">
          <CheckCircle2 size={48} />
          <strong>Payment accepted</strong>
          <span>{formatMoney(amount)} UZS</span>
          <Button onClick={() => setScreen("amount")} type="button">
            New payment
          </Button>
        </div>
      ) : null}

      {isInfoOpen ? (
        <div
          aria-label="Закрыть информацию о рассрочке"
          className="installment-bottom-sheet"
          onClick={() => setIsInfoOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter") {
              setIsInfoOpen(false);
            }
          }}
        >
          <div
            className="installment-bottom-sheet-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="installment-sheet-handle" />
            <span className="installment-sheet-logo" />
            <h2>Deferred payment</h2>
            <p>
              We&apos;ll pay for you today and automatically deduct the money at
              the end of the 30 day postponed payment period.
            </p>
            <div className="installment-info-card">
              <Info size={18} />
              May include a service fee, which is included in the total
              deduction amount
            </div>
            <div className="installment-info-grid">
              <div>Buy now and pay later</div>
              <div>You can repay early in the Postponed Payment MiniApp</div>
              <div>
                We&apos;ll remind you about the payment so you don&apos;t forget
              </div>
            </div>
            <Button
              className="installment-primary"
              onClick={() => setIsInfoOpen(true)}
              type="button"
            >
              Got it
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
