// Scenario 3: Documentation Review — Intern + Admin

const docText = [
  { t:'1. Регистрация пользователя', s:'h' },
  { t:'Пользователь регистрируется через email и пароль. После заполнения формы система отправляет письмо с подтверждением на указанный адрес.' },
  { t:'Пароль должен содержать не менее 8 символов. Допустимы латинские буквы и цифры.', hi: 1 },
  { t:'Если email уже зарегистрирован — отображается ошибка «Email занят». Пользователь может войти или восстановить пароль.' },
  { t:'2. Восстановление пароля', s:'h' },
  { t:'Пользователь нажимает «Забыли пароль?» и вводит email. Система отправляет ссылку для сброса. Срок жизни ссылки — 24 часа.' },
  { t:'После перехода по ссылке пользователь задаёт новый пароль и автоматически авторизуется в системе.', hi: 2 },
  { t:'3. Двухфакторная авторизация', s:'h' },
  { t:'Пользователь может включить 2FA через приложение Authenticator. Код состоит из 6 цифр и обновляется каждые 30 секунд.' },
  { t:'Если пользователь ввёл неверный код — отображается сообщение об ошибке. Количество попыток не ограничено.', hi: 3 },
  { t:'4. Профиль пользователя', s:'h' },
  { t:'В профиле пользователь может изменить имя, аватар и контактные данные. Все изменения сохраняются автоматически.' },
];

const issues = [
  { id: 1, anchor: 1, title:'Отсутствие требования к спец-символам', text:'Спецификация говорит про латиницу и цифры, но не упоминает спец-символы. Нужна явная запись: разрешены / запрещены / обязательны?' },
  { id: 2, anchor: 2, title:'Не описана обработка истёкшей ссылки', text:'Что произойдёт, если пользователь перейдёт по ссылке после 24 часов? Поведение не задано.' },
  { id: 3, anchor: 3, title:'Уязвимость: неограниченные попытки 2FA', text:'Отсутствие лимита на попытки ввода 6-значного кода открывает возможность брутфорса (всего 10⁶ комбинаций).' },
];

const InternDocReview = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex', flexDirection:'column' }}>
    <div style={{ height: 64, padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderBottom:'1px solid var(--bg-divider)' }}>
      <Logo size="sm"/>
      <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
        <div className="t-body2 muted">Задание <b style={{ color:'var(--c-black)' }}>4</b> / 4</div>
        <div style={{ width: 200, height: 6, background:'var(--c-g96)', borderRadius: 999 }}>
          <div style={{ width:'82%', height:'100%', background:'var(--c-blue)', borderRadius: 999 }}/>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 16px', background:'rgba(0,119,255,0.08)', borderRadius: 999 }}>
        <Icon name="clock" size={18} color="var(--c-blue)"/>
        <span style={{ fontSize: 18, fontWeight: 600, color:'var(--c-blue)', fontVariantNumeric:'tabular-nums' }}>04:42</span>
      </div>
    </div>

    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* Document */}
      <div style={{ flex:1, padding: 32, overflow:'auto', background:'var(--bg-app)' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 12 }}>
          <span className="chip chip-blue">Documentation Review</span>
          <span className="t-body2 muted">Найдите неточности, противоречия и неполные требования</span>
        </div>
        <div className="card" style={{ maxWidth: 760, padding: 40 }}>
          <div style={{ borderBottom:'1px solid var(--bg-divider)', paddingBottom: 16, marginBottom: 24 }}>
            <div className="t-h1">Спецификация: Авторизация v2.3</div>
            <div className="t-body2 muted" style={{ marginTop: 4 }}>Документ подготовил: Product team · обновлён 18 апр 2026</div>
          </div>

          {docText.map((p, i) => {
            if (p.s === 'h') return <div key={i} className="t-h2" style={{ margin:'20px 0 8px' }}>{p.t}</div>;
            const has = p.hi;
            return (
              <p key={i} style={{
                margin:'0 0 12px', fontSize: 14, lineHeight: 1.65,
                background: has ? 'rgba(255,136,0,0.16)' : 'transparent',
                padding: has ? '4px 8px' : 0,
                borderRadius: has ? 4 : 0, position:'relative', cursor: has ? 'pointer' : 'default'
              }}>
                {p.t}
                {has && <span style={{
                  position:'absolute', right:-12, top:-8, width: 22, height: 22, borderRadius:'50%',
                  background:'var(--c-orange)', color:'#fff', fontSize: 11, fontWeight: 700,
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>{has}</span>}
              </p>
            );
          })}
        </div>
      </div>

      {/* Notes panel */}
      <div style={{ width: 380, borderLeft:'1px solid var(--bg-divider)', background:'#fff', display:'flex', flexDirection:'column' }}>
        <div style={{ padding: 20, borderBottom:'1px solid var(--bg-divider)' }}>
          <div className="t-h2">Ваши замечания</div>
          <div className="t-body2 muted" style={{ marginTop: 4 }}>{issues.length} записи · выделите текст в документе, чтобы добавить</div>
        </div>

        <div style={{ flex:1, overflow:'auto', padding: 16 }}>
          {issues.map(it => (
            <div key={it.id} style={{
              padding: 14, borderRadius: 12, marginBottom: 8,
              background: it.id===3 ? 'rgba(255,136,0,0.06)' : '#FAFBFD',
              border: `1px solid ${it.id===3 ? 'rgba(255,136,0,0.32)' : 'var(--bg-divider)'}`
            }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius:'50%', background:'var(--c-orange)',
                  color:'#fff', fontSize: 11, fontWeight: 700, display:'flex', alignItems:'center', justifyContent:'center'
                }}>{it.anchor}</div>
                <span className="t-body1-m" style={{ flex:1 }}>{it.title}</span>
                <Icon name="trash" size={14} color="var(--c-g48)"/>
              </div>
              <div className="t-body2 muted" style={{ lineHeight: 1.5 }}>{it.text}</div>
            </div>
          ))}

          <button className="btn btn-secondary" style={{ width:'100%', marginTop: 8 }}>
            <Icon name="plus" size={16}/>Добавить замечание
          </button>
        </div>

        <div style={{ padding: 16, borderTop:'1px solid var(--bg-divider)' }}>
          <label className="input-label">Общий вывод (свободная форма)</label>
          <textarea defaultValue="Спецификация описывает основные сценарии, но имеет пробелы в edge-кейсах: нет лимита попыток для 2FA, не определено поведение по истечению ссылки восстановления, требования к паролю сформулированы неполно." style={{
            width:'100%', minHeight: 90, border:'1.5px solid var(--c-g96)', borderRadius: 8, padding: 10,
            fontFamily:'var(--font)', fontSize: 13, lineHeight: 1.5, outline:'none', resize:'none'
          }}/>
          <button className="btn btn-primary" style={{ width:'100%', marginTop: 12 }}>
            Завершить ассессмент<Icon name="check" size={16}/>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const AdminDocReview = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex' }}>
    <AdminSidebar active="dashboard"/>
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Topbar
        title={<span style={{ display:'flex', alignItems:'center', gap: 12 }}><Icon name="arrow-left" size={18}/>Никита Орлов · Documentation Review</span>}
        subtitle="Авторизация v2.3 · отправлено 12 минут назад"
        right={<><button className="btn btn-secondary">Эталонный ответ</button><button className="btn btn-primary"><Icon name="check" size={16}/>Сохранить оценку</button></>}/>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Document with annotations */}
        <div style={{ flex:1, padding: 32, overflow:'auto', background:'var(--bg-app)' }}>
          <div className="card" style={{ maxWidth: 760, padding: 40 }}>
            <div style={{ borderBottom:'1px solid var(--bg-divider)', paddingBottom: 16, marginBottom: 24 }}>
              <div className="t-h1">Спецификация: Авторизация v2.3</div>
              <div className="t-body2 muted" style={{ marginTop: 4 }}>Замечаний от стажёра: 3 · эталон: 5</div>
            </div>
            {docText.map((p, i) => {
              if (p.s === 'h') return <div key={i} className="t-h2" style={{ margin:'20px 0 8px' }}>{p.t}</div>;
              const has = p.hi;
              return (
                <p key={i} style={{
                  margin:'0 0 12px', fontSize: 14, lineHeight: 1.65,
                  background: has ? 'rgba(255,136,0,0.14)' : 'transparent',
                  padding: has ? '4px 8px' : 0, borderRadius: has ? 4 : 0
                }}>
                  {p.t}
                </p>
              );
            })}
          </div>
        </div>

        {/* Grading panel */}
        <div style={{ width: 400, borderLeft:'1px solid var(--bg-divider)', background:'#fff', display:'flex', flexDirection:'column' }}>
          <div style={{ padding: 20, borderBottom:'1px solid var(--bg-divider)' }}>
            <div className="t-h2">Оценка анализа</div>
            <div style={{ marginTop: 12, padding:'10px 14px', background:'rgba(255,136,0,0.08)', borderRadius: 10, display:'flex', justifyContent:'space-between' }}>
              <span className="t-body2-m" style={{ color:'var(--c-orange)' }}>Текущий балл</span>
              <span className="t-h2" style={{ color:'var(--c-orange)' }}>60%</span>
            </div>
          </div>

          <div style={{ flex:1, overflow:'auto', padding: 16 }}>
            <div className="t-menu muted" style={{ marginBottom: 8 }}>Замечания стажёра</div>
            {issues.map(it => (
              <div key={it.id} style={{ padding: 12, borderRadius: 10, background:'#FAFBFD', border:'1px solid var(--bg-divider)', marginBottom: 8 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
                  <span className="t-body1-m" style={{ flex:1, fontSize: 13 }}>{it.title}</span>
                  <div style={{ display:'flex', gap: 4 }}>
                    <button className="btn btn-icon" style={{ width: 26, height: 26, background: it.id<=2 ? 'rgba(0,204,82,0.12)' : '#fff', color: it.id<=2 ? 'var(--c-green)' : 'var(--c-g48)' }}><Icon name="check" size={14}/></button>
                    <button className="btn btn-icon" style={{ width: 26, height: 26, background:'#fff', color:'var(--c-g48)' }}><Icon name="x" size={14}/></button>
                  </div>
                </div>
                <div className="t-body2 muted" style={{ lineHeight: 1.5, fontSize: 12 }}>{it.text}</div>
              </div>
            ))}

            <div className="t-menu muted" style={{ margin:'20px 0 8px' }}>Пропущено (эталон)</div>
            {[
              'Нет валидации на повторный пароль при сбросе',
              'Не описано поведение при отсутствии email сервиса',
            ].map((m, i) => (
              <div key={i} style={{ padding: 10, borderRadius: 10, background:'rgba(255,68,0,0.05)', border:'1px solid rgba(255,68,0,0.2)', marginBottom: 6, fontSize: 12, color:'var(--c-red)' }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <Icon name="x" size={14}/>
                  <span>{m}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: 16, borderTop:'1px solid var(--bg-divider)' }}>
            <label className="input-label">Итоговая оценка (0-100)</label>
            <input className="input" defaultValue="60" type="number" style={{ fontWeight: 600 }}/>
          </div>
        </div>
      </div>
    </div>
  </div>
);

window.InternDocReview = InternDocReview;
window.AdminDocReview = AdminDocReview;
