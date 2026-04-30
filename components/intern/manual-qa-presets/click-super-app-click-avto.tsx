"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Fuel,
  ParkingCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export { clickSuperAppClickAvtoPresetConfig } from "@/lib/manual-qa-sandbox";

type AvtoScreen = "home" | "service" | "confirm" | "payment" | "success";
type AvtoService = "parking" | "fuel" | "insurance";

const services: Array<{
  id: AvtoService;
  title: string;
  subtitle: string;
  amount: number;
  icon: typeof ParkingCircle;
}> = [
  {
    id: "parking",
    title: "Parking",
    subtitle: "Оплата городской парковки",
    amount: 12000,
    icon: ParkingCircle,
  },
  {
    id: "fuel",
    title: "Fuel",
    subtitle: "Предоплата топлива",
    amount: 85000,
    icon: Fuel,
  },
  {
    id: "insurance",
    title: "Insurance",
    subtitle: "Мини-полис для поездки",
    amount: 46000,
    icon: ShieldCheck,
  },
];

const savedCars = [
  {
    id: "primary",
    name: "Chevrolet Tracker Premier Redline 2026",
    plate: "01 A 777 AA",
  },
  {
    id: "secondary",
    name: "BYD Song Plus",
    plate: "10 X 404 XA",
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.max(0, value));
}

export function ClickSuperAppClickAvtoPreset() {
  const [screen, setScreen] = useState<AvtoScreen>("home");
  const [selectedCarId, setSelectedCarId] = useState(savedCars[0]?.id ?? "");
  const [plate, setPlate] = useState(savedCars[0]?.plate ?? "");
  const [selectedService, setSelectedService] =
    useState<AvtoService>("parking");
  const [protectTrip, setProtectTrip] = useState(false);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");

  const service = services.find((item) => item.id === selectedService);
  const selectedCar = savedCars.find((car) => car.id === selectedCarId);

  const baseTotal = service?.amount ?? 0;
  const displayedTotal = useMemo(() => {
    return Math.max(0, baseTotal - discount);
  }, [baseTotal, discount]);

  function chooseCar(carId: string) {
    const car = savedCars.find((item) => item.id === carId);
    setSelectedCarId(carId);
    setPlate(car?.plate ?? "");
  }

  function goBack() {
    if (screen === "success") {
      setScreen("home");
      return;
    }
    if (screen === "payment") {
      setSelectedCarId("");
      setPlate("");
      setScreen("confirm");
      return;
    }
    if (screen === "confirm") {
      setScreen("service");
      return;
    }
    if (screen === "service") {
      setScreen("home");
    }
  }

  function applyPromo() {
    if (promo.trim().toUpperCase() === "AVTO15") {
      setDiscount((current) => current + 15000);
    }
  }

  return (
    <div className="manual-qa-phone" data-preset="click-super-app-click-avto-v1">
      <div className="manual-qa-statusbar">
        <span>9:41</span>
        <span>ClickSuperApp</span>
      </div>

      <div className="manual-qa-appbar">
        {screen !== "home" ? (
          <button
            aria-label="Назад"
            className="manual-qa-icon-button"
            onClick={goBack}
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <span className="manual-qa-logo-mark">C</span>
        )}
        <div>
          <strong>ClickAvto</strong>
          <span>miniapp</span>
        </div>
      </div>

      {screen === "home" ? (
        <div className="manual-qa-screen">
          <section className="manual-qa-hero">
            <span>SuperApp</span>
            <strong>Авто-сервисы в одном месте</strong>
          </section>

          <section className="manual-qa-section">
            <div className="manual-qa-section-title">Мои авто</div>
            <div className="manual-qa-car-list">
              {savedCars.map((car) => (
                <button
                  className={`manual-qa-car-card ${
                    selectedCarId === car.id ? "active" : ""
                  }`}
                  key={car.id}
                  onClick={() => chooseCar(car.id)}
                  type="button"
                >
                  <Car size={18} />
                  <span>
                    <strong>{car.name}</strong>
                    <small>{car.plate}</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </section>

          <Button onClick={() => setScreen("service")} type="button">
            Открыть ClickAvto
          </Button>
        </div>
      ) : null}

      {screen === "service" ? (
        <div className="manual-qa-screen">
          <section className="manual-qa-section">
            <div className="manual-qa-section-title">Автомобиль</div>
            <Input
              aria-label="Госномер автомобиля"
              onChange={(event) => setPlate(event.target.value)}
              placeholder="01 A 777 AA"
              value={plate}
            />
          </section>

          <section className="manual-qa-section">
            <div className="manual-qa-section-title">Услуга</div>
            <div className="manual-qa-service-list">
              {services.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className={`manual-qa-service-card ${
                      selectedService === item.id ? "active" : ""
                    }`}
                    key={item.id}
                    onClick={() => setSelectedService(item.id)}
                    type="button"
                  >
                    <Icon size={18} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    <b>{formatMoney(item.amount)}</b>
                  </button>
                );
              })}
            </div>
          </section>

          <Button onClick={() => setScreen("confirm")} type="button">
            Продолжить
          </Button>
        </div>
      ) : null}

      {screen === "confirm" ? (
        <div className="manual-qa-screen">
          <section className="manual-qa-summary">
            <div>
              <span>Авто</span>
              <strong>{selectedCar?.name || "Не выбрано"}</strong>
              <small>{plate || "Номер не указан"}</small>
            </div>
            <div>
              <span>Услуга</span>
              <strong>{service?.title}</strong>
              <small>{service?.subtitle}</small>
            </div>
          </section>

          <label className="manual-qa-toggle-row">
            <span>
              <strong>Защита поездки</strong>
              <small>+ 18 000 UZS</small>
            </span>
            <input
              checked={protectTrip}
              onChange={(event) => setProtectTrip(event.target.checked)}
              type="checkbox"
            />
          </label>

          <section className="manual-qa-promo-row">
            <Input
              aria-label="Промокод"
              onChange={(event) => setPromo(event.target.value)}
              placeholder="Промокод"
              value={promo}
            />
            <Button onClick={applyPromo} type="button" variant="secondary">
              OK
            </Button>
          </section>

          <section className="manual-qa-total-panel">
            <span>Итого</span>
            <strong>{formatMoney(displayedTotal)} UZS</strong>
            {protectTrip ? <small>Защита поездки включена</small> : null}
          </section>

          <Button onClick={() => setScreen("payment")} type="button">
            Перейти к оплате
          </Button>
        </div>
      ) : null}

      {screen === "payment" ? (
        <div className="manual-qa-screen">
          <section className="manual-qa-section">
            <div className="manual-qa-section-title">Способ оплаты</div>
            <button
              className={`manual-qa-payment-card ${
                paymentMethod === "card" ? "active" : ""
              }`}
              onClick={() => setPaymentMethod("card")}
              type="button"
            >
              <CreditCard size={18} />
              <span>
                <strong>Humo •• 1842</strong>
                <small>Основная карта</small>
              </span>
            </button>
          </section>

          <section className="manual-qa-total-panel">
            <span>К оплате</span>
            <strong>{formatMoney(displayedTotal)} UZS</strong>
          </section>

          <Button onClick={() => setScreen("success")} type="button">
            Оплатить
          </Button>
        </div>
      ) : null}

      {screen === "success" ? (
        <div className="manual-qa-success-screen">
          <CheckCircle2 size={48} />
          <strong>Оплата успешна</strong>
          <span>{formatMoney(displayedTotal)} UZS</span>
          <Button onClick={() => setScreen("home")} type="button">
            На главную
          </Button>
        </div>
      ) : null}
    </div>
  );
}
