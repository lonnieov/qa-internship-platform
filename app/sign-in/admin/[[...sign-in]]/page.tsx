import { Lock, Shield, User } from "lucide-react";
import { DemoAdminLoginForm } from "@/components/admin/demo-admin-login-form";
import { CoinLogo, CoinRoleTabs } from "@/components/layout/coin-shell";

export default function AdminSignInPage() {
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
            Используйте логин и пароль, выданный администратором.
          </div>

          <CoinRoleTabs
            active="admin"
            internHref="/sign-in/intern"
            adminHref="/sign-in/admin"
          />

          <div className="coin-form stack">
            <DemoAdminLoginForm />
          </div>

          <div className="coin-auth__security-note">
            <div className="coin-auth__security-icon">
              <Shield size={18} />
            </div>
            <div>
              Все пароли хранятся в зашифрованном виде. Сессии истекают через 8 часов.
            </div>
          </div>

          <div className="coin-auth__demo-note">
            <div className="coin-auth__demo-item">
              <User size={16} />
              <span>Логин: admin</span>
            </div>
            <div className="coin-auth__demo-item">
              <Lock size={16} />
              <span>Пароль: admin</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
