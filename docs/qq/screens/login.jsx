// Screen 1: Login (общий вход)

const LoginScreen = () => {
  return (
    <div className="coin" style={{ width: 1440, height: 900, display:'flex' }}>
      {/* Left brand panel */}
      <div style={{
        width: 560, background:'linear-gradient(160deg, #0077FF 0%, #0055CC 100%)',
        padding: 48, display:'flex', flexDirection:'column', justifyContent:'space-between',
        color:'#fff', position:'relative', overflow:'hidden'
      }}>
        {/* decorative shapes */}
        <div style={{ position:'absolute', top:-120, right:-120, width: 380, height: 380, borderRadius: '50%', background:'rgba(255,255,255,0.06)' }}/>
        <div style={{ position:'absolute', bottom:-80, left:-80, width: 240, height: 240, borderRadius: '50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'absolute', top: 160, right: 60, width: 88, height: 88, borderRadius: 24, background:'rgba(224,165,0,0.9)', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', transform:'rotate(-12deg)' }}/>
        <div style={{ position:'absolute', top: 280, right: 180, width: 56, height: 56, borderRadius: 16, background:'rgba(170,67,196,0.9)', transform:'rotate(18deg)' }}/>

        <div style={{ display:'flex', alignItems:'center', gap: 12, position:'relative' }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background:'#fff', color:'var(--c-blue)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize: 18 }}>C</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>Coin</div>
        </div>

        <div style={{ position:'relative', maxWidth: 420 }}>
          <div style={{ fontSize: 36, lineHeight: 1.15, fontWeight: 600, letterSpacing:'-0.02em' }}>Платформа отбора стажёров</div>
          <div style={{ marginTop: 16, fontSize: 15, lineHeight: 1.5, opacity: 0.8 }}>
            Технические ассессменты по API, gRPC, Mobile и Web для будущих инженеров команды Coin.
          </div>

          <div style={{ marginTop: 40, display:'flex', flexDirection:'column', gap: 14 }}>
            {[
              ['100%', 'проходной балл'],
              ['4', 'технических трека'],
              ['30 мин', 'на ассессмент'],
            ].map(([k,v],i) => (
              <div key={i} style={{ display:'flex', alignItems:'baseline', gap: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 600, minWidth: 80 }}>{k}</div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position:'relative', fontSize: 11, opacity: 0.6 }}>© 2026 Coin · Внутренняя HR-платформа</div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, padding: 48, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', background:'#fff' }}>
        <div style={{ width: 400 }}>
          <div className="t-h1" style={{ marginBottom: 8 }}>Вход в систему</div>
          <div className="t-body1 muted" style={{ marginBottom: 32 }}>
            Используйте логин и пароль, выданный администратором.
          </div>

          {/* Role tabs */}
          <div style={{ display:'flex', background:'var(--c-g96)', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            <div style={{ flex:1, textAlign:'center', padding:'10px 12px', borderRadius: 8, background:'#fff', boxShadow:'0 1px 3px rgba(20,20,20,0.06)', fontSize: 13, fontWeight: 500, display:'flex', alignItems:'center', justifyContent:'center', gap: 8 }}>
              <Icon name="user" size={16} color="var(--c-blue)"/>
              Стажёр
            </div>
            <div style={{ flex:1, textAlign:'center', padding:'10px 12px', fontSize: 13, fontWeight: 500, color:'var(--c-g48)', display:'flex', alignItems:'center', justifyContent:'center', gap: 8 }}>
              <Icon name="shield" size={16}/>
              Администратор
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Логин</label>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left: 14, top: '50%', transform:'translateY(-50%)', color:'var(--c-g48)' }}>
                <Icon name="user" size={18}/>
              </div>
              <input className="input" defaultValue="ivan.petrov" style={{ paddingLeft: 42 }}/>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label className="input-label">Пароль</label>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left: 14, top: '50%', transform:'translateY(-50%)', color:'var(--c-g48)' }}>
                <Icon name="lock" size={18}/>
              </div>
              <input className="input" type="password" defaultValue="••••••••••••" style={{ paddingLeft: 42, paddingRight: 42 }}/>
              <div style={{ position:'absolute', right: 14, top: '50%', transform:'translateY(-50%)', color:'var(--c-g48)', cursor:'pointer' }}>
                <Icon name="eye-off" size={18}/>
              </div>
            </div>
            <div className="help-text">Креденшелы выдаёт администратор</div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width:'100%', marginTop: 24 }}>
            Войти
            <Icon name="arrow-right" size={18}/>
          </button>

          <div style={{ marginTop: 20, padding: 14, background:'rgba(0,119,255,0.06)', borderRadius: 12, display:'flex', gap: 12 }}>
            <div style={{ color:'var(--c-blue)', flexShrink: 0, marginTop: 2 }}>
              <Icon name="shield" size={18}/>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color:'var(--c-g48)' }}>
              Все пароли хранятся в зашифрованном виде (bcrypt). Сессии истекают через 8 часов.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.LoginScreen = LoginScreen;
