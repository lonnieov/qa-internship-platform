import { KeyRound, Shield, TriangleAlert } from "lucide-react";
import { CoinLogo, CoinRoleTabs } from "@/components/layout/coin-shell";
import { TokenLoginForm } from "@/components/intern/token-login-form";

export default function InternSignInPage() {
  return (
    <main className="coin-auth">
      <section className="coin-auth__brand-panel">
        <div className="coin-auth__shape coin-auth__shape--lg" />
        <div className="coin-auth__shape coin-auth__shape--md" />
        <div className="coin-auth__shape coin-auth__shape--gold" />
        <div className="coin-auth__shape coin-auth__shape--purple" />

        <div className="coin-auth__brand-header">
          <CoinLogo />
        </div>

        <div className="coin-auth__brand-copy">
          <h1 className="coin-auth__brand-title">Платформа отбора стажёров</h1>
          <p className="coin-auth__brand-description">
            Технические ассессменты по API, gRPC, Mobile и Web для будущих инженеров
            команды Coin.
          </p>

          <div className="coin-auth__brand-stats">
            <div className="coin-auth__brand-stat">
              <strong>100%</strong>
              <span>проходной балл</span>
            </div>
            <div className="coin-auth__brand-stat">
              <strong>4</strong>
              <span>технических трека</span>
            </div>
            <div className="coin-auth__brand-stat">
              <strong>30 мин</strong>
              <span>на ассессмент</span>
            </div>
          </div>
        </div>

        <div className="coin-auth__brand-footer">© 2026 Coin · Внутренняя HR-платформа</div>
      </section>

      <section className="coin-auth__form-panel">
        <div className="coin-auth__form-card">
          <div className="coin-auth__form-title">Вход в систему</div>
          <div className="coin-auth__form-subtitle">
            Для стажёров в текущем продукте используется доступ по выданному токену.
          </div>

          <CoinRoleTabs
            active="intern"
            internHref="/sign-in/intern"
            adminHref="/sign-in/admin"
          />

          <div className="coin-auth__notice coin-auth__notice--warning">
            <TriangleAlert size={16} />
            <span>Login/password экран из макета ещё не поддержан текущим backend flow.</span>
          </div>

          <div className="coin-auth__notice">
            <KeyRound size={16} />
            <span>Ниже используется рабочий token-only вход для просмотра intern flow.</span>
          </div>

          <div className="coin-form stack">
            <TokenLoginForm />
          </div>

          <div className="coin-auth__security-note">
            <div className="coin-auth__security-icon">
              <Shield size={18} />
            </div>
            <div>Токен выдаётся администратором и аннулируется после завершения попытки.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
