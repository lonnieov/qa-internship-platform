"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  CreditCard,
  Droplets,
  FileText,
  Flame,
  Heart,
  Home,
  LayoutGrid,
  Plus,
  Settings,
  Trash2,
  Tv,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export { clickSuperAppMyHomePresetConfig } from "@/lib/manual-qa-sandbox";

type MyHomeScreen = "dashboard" | "amount" | "confirm" | "success";
type MyHomeAccountId = "electricity" | "gas" | "water" | "waste" | "istv";

type MyHomeAccount = {
  id: MyHomeAccountId;
  title: string;
  shortTitle: string;
  accountNumber: string;
  balance: number;
  icon: LucideIcon;
  tone: string;
};

const homeAccounts: MyHomeAccount[] = [
  {
    id: "electricity",
    title: "Электроэнергия",
    shortTitle: "Электроэнерг...",
    accountNumber: "0459203",
    balance: 55912.37,
    icon: Zap,
    tone: "electric",
  },
  {
    id: "gas",
    title: "Газ (Физ лица)",
    shortTitle: "Газ (Физ лица)",
    accountNumber: "1004054721",
    balance: 82090,
    icon: Flame,
    tone: "gas",
  },
  {
    id: "water",
    title: "Холодная вода",
    shortTitle: "Холодная вода",
    accountNumber: "2629071607",
    balance: 71323,
    icon: Droplets,
    tone: "water",
  },
  {
    id: "waste",
    title: "Вывоз мусора",
    shortTitle: "Вывоз мусора",
    accountNumber: "201090700164",
    balance: 58600,
    icon: Trash2,
    tone: "waste",
  },
  {
    id: "istv",
    title: "ISTV",
    shortTitle: "ISTV",
    accountNumber: "7140626",
    balance: 2000,
    icon: Tv,
    tone: "tv",
  },
];

function formatMoney(value: number, forceDecimals = false) {
  const hasFraction = !Number.isInteger(value);

  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: forceDecimals || hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(Math.max(0, value));
}

function parseAmount(value: string) {
  return Number(value.replace(/[^\d]/g, "") || 0);
}

function getReceiptNumber(account: MyHomeAccount, amount: number) {
  const accountSuffix = account.accountNumber.slice(-4).padStart(4, "0");
  const amountSuffix = String(amount || 0).padStart(4, "0").slice(-4);

  return `3253${accountSuffix}${amountSuffix}`;
}

export function ClickSuperAppMyHomePreset() {
  const [screen, setScreen] = useState<MyHomeScreen>("dashboard");
  const [selectedAccountId, setSelectedAccountId] =
    useState<MyHomeAccountId>("waste");
  const [amountText, setAmountText] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("32533594798");

  const selectedAccount =
    homeAccounts.find((account) => account.id === selectedAccountId) ??
    homeAccounts[0];
  const paymentAmount = parseAmount(amountText);
  const canContinue = paymentAmount > 0;

  const SelectedAccountIcon = selectedAccount.icon;
  const maskedSubscriberName = useMemo(() => {
    return selectedAccount.id === "waste"
      ? "R************* A****"
      : "A************* S****";
  }, [selectedAccount.id]);

  function openPayment(accountId: MyHomeAccountId) {
    setSelectedAccountId(accountId);
    setAmountText("");
    setScreen("amount");
  }

  function goBack() {
    if (screen === "confirm") {
      setScreen("amount");
      return;
    }

    if (screen === "amount" || screen === "success") {
      setScreen("dashboard");
    }
  }

  function goToConfirm() {
    if (!canContinue) return;
    setScreen("confirm");
  }

  function completePayment() {
    setReceiptNumber(getReceiptNumber(selectedAccount, paymentAmount));
    setScreen("success");
  }

  return (
    <div
      className="manual-qa-phone my-home-phone"
      data-preset="click-super-app-my-home-v1"
    >
      <div className="my-home-statusbar">
        <span>2:24</span>
        <strong>click</strong>
        <span>17%</span>
      </div>

      {screen === "dashboard" ? (
        <>
          <div className="my-home-dashboard-appbar">
            <button
              aria-label="Назад"
              className="my-home-toolbar-button"
              type="button"
            >
              <ArrowLeft size={22} />
            </button>
            <strong>qwerty</strong>
            <button
              aria-label="Настройки"
              className="my-home-toolbar-button"
              type="button"
            >
              <Settings size={22} />
            </button>
          </div>

          <div className="my-home-screen">
            <section className="my-home-shortcuts">
              {[
                { label: "Расходы", icon: BarChart3 },
                { label: "Документы", icon: FileText },
                { label: "Управление", icon: Users },
                { label: "Помощь", icon: Heart },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    className="my-home-shortcut"
                    key={item.label}
                    type="button"
                  >
                    <span>
                      <Icon size={28} />
                    </span>
                    <b>{item.label}</b>
                  </button>
                );
              })}
            </section>

            <section className="my-home-balance-panel">
              <div className="my-home-panel-header">
                <h2>Баланс счетов</h2>
                <button type="button">
                  <Plus size={16} />
                  Добавить
                </button>
              </div>

              <div className="my-home-segments">
                <button type="button">К оплате</button>
                <button className="active" type="button">
                  Все • {homeAccounts.length}
                </button>
              </div>

              <div className="my-home-account-list">
                {homeAccounts.map((account) => {
                  const Icon = account.icon;

                  return (
                    <button
                      className="my-home-account-row"
                      key={account.id}
                      onClick={() => openPayment(account.id)}
                      type="button"
                    >
                      <span className={`my-home-account-icon ${account.tone}`}>
                        <Icon size={26} />
                      </span>
                      <span className="my-home-account-meta">
                        <strong>{account.shortTitle}</strong>
                        <small>{account.accountNumber}</small>
                      </span>
                      <span className="my-home-balance">
                        {formatMoney(account.balance)} сум
                      </span>
                    </button>
                  );
                })}
              </div>

              <Button
                className="my-home-primary"
                onClick={() => openPayment("waste")}
                type="button"
              >
                Оплатить несколько
              </Button>
            </section>
          </div>

          <nav className="my-home-tabbar" aria-label="Click Дом навигация">
            <button className="active" type="button">
              <Home size={28} />
              <span>Click Дом</span>
            </button>
            <button type="button">
              <LayoutGrid size={28} />
              <span>Сервисы</span>
            </button>
          </nav>
        </>
      ) : null}

      {screen === "amount" ? (
        <>
          <div className="my-home-flow-appbar">
            <button
              aria-label="Назад"
              className="my-home-toolbar-button"
              onClick={goBack}
              type="button"
            >
              <ArrowLeft size={22} />
            </button>
            <strong>Click Дом</strong>
            <span />
          </div>

          <div className="my-home-screen my-home-payment-screen">
            <section className="my-home-payment-card">
              <span className={`my-home-account-icon ${selectedAccount.tone}`}>
                <SelectedAccountIcon size={34} />
              </span>
              <div className="my-home-payment-card-title">
                <strong>{selectedAccount.title}</strong>
              </div>
              <dl>
                <div>
                  <dt>Лицевой счёт</dt>
                  <dd>
                    {selectedAccount.accountNumber}
                    <button aria-label="Скопировать лицевой счет" type="button">
                      <Copy size={18} />
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Баланс</dt>
                  <dd className="positive">
                    {formatMoney(selectedAccount.balance)} сум
                  </dd>
                </div>
              </dl>
            </section>

            <Input
              aria-label="Сумма оплаты"
              className="my-home-amount-input"
              inputMode="numeric"
              onChange={(event) => setAmountText(event.target.value)}
              placeholder="0"
              value={amountText}
            />

            <section className="my-home-payment-options">
              {[
                { label: "Детали платежа", icon: ClipboardList },
                { label: "Уведомление отключено", icon: Bell },
                { label: "Автоплатёж", icon: CalendarDays },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <button key={item.label} type="button">
                    <Icon size={22} />
                    <span>{item.label}</span>
                    <ChevronRight size={18} />
                  </button>
                );
              })}
            </section>

            <Button
              className="my-home-primary my-home-sticky-button"
              disabled={!canContinue}
              onClick={goToConfirm}
              type="button"
            >
              К оплате
            </Button>
          </div>
        </>
      ) : null}

      {screen === "confirm" ? (
        <>
          <div className="my-home-flow-appbar">
            <button
              aria-label="Назад"
              className="my-home-toolbar-button"
              onClick={goBack}
              type="button"
            >
              <ArrowLeft size={22} />
            </button>
            <strong>{selectedAccount.title}</strong>
            <span />
          </div>

          <div className="my-home-screen my-home-confirm-screen">
            <section className="my-home-details">
              <strong>Детали:</strong>
              <dl>
                <div>
                  <dt>Сумма оплаты:</dt>
                  <dd>{formatMoney(paymentAmount)} сум</dd>
                </div>
                <div>
                  <dt>ФИО Абонента:</dt>
                  <dd>{maskedSubscriberName}</dd>
                </div>
                <div>
                  <dt>Кешбэк:</dt>
                  <dd>0%</dd>
                </div>
                <div>
                  <dt>Конечное сальдо:</dt>
                  <dd>
                    Предоплата: {formatMoney(selectedAccount.balance, true)}
                  </dd>
                </div>
                <div>
                  <dt>Номер чека:</dt>
                  <dd>{receiptNumber}</dd>
                </div>
                <div>
                  <dt>ID компании:</dt>
                  <dd>699</dd>
                </div>
              </dl>
            </section>

            <section className="my-home-wallet-banner">
              <span>Click</span>
              <div>
                <strong>Бесплатно откройте Click-кошелёк</strong>
                <small>Получайте кешбэк за оплаты и переводы</small>
              </div>
              <button aria-label="Закрыть баннер" type="button">
                ×
              </button>
            </section>

            <div className="my-home-confirm-spacer" />

            <section className="my-home-card-section">
              <h3>Карта списания:</h3>
              <div className="my-home-card-row">
                <div className="my-home-bank-card">
                  <CreditCard size={26} />
                  <span>
                    <strong>2 000 сум</strong>
                    <small>Новое название</small>
                    <small>U * 1876</small>
                  </span>
                </div>
                <button type="button">Выбрать другую карту</button>
              </div>
            </section>

            <Button
              className="my-home-primary"
              onClick={completePayment}
              type="button"
            >
              Оплатить
            </Button>

            <button className="my-home-ask-friend" type="button">
              <Users size={24} />
              Попросить друга
            </button>
          </div>
        </>
      ) : null}

      {screen === "success" ? (
        <>
          <div className="my-home-flow-appbar">
            <button
              aria-label="Назад"
              className="my-home-toolbar-button"
              onClick={goBack}
              type="button"
            >
              <ArrowLeft size={22} />
            </button>
            <strong>Оплата</strong>
            <span />
          </div>

          <div className="my-home-success-screen">
            <CheckCircle2 size={54} />
            <strong>Оплата успешна</strong>
            <span>{formatMoney(paymentAmount)} сум</span>
            <small>Чек № {receiptNumber}</small>
            <Button
              className="my-home-primary"
              onClick={() => setScreen("dashboard")}
              type="button"
            >
              Вернуться в Click Дом
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
