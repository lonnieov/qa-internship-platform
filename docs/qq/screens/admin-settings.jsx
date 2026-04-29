// Screen 5: Admin — настройки теста

const AdminSettings = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex' }}>
    <AdminSidebar active="settings"/>
    <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
      <Topbar title="Настройки теста" subtitle="Параметры применяются ко всем новым ассессментам"
        right={<><button className="btn btn-ghost">Отменить</button><button className="btn btn-primary"><Icon name="check" size={16}/>Сохранить</button></>}/>

      <div style={{ flex:1, padding: 32, overflow:'auto', background:'var(--bg-app)' }}>
        <div style={{ maxWidth: 880, display:'flex', flexDirection:'column', gap: 16 }}>

          {/* Time */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'flex-start', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background:'var(--c-blue-12)', color:'var(--c-blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
                <Icon name="clock" size={22}/>
              </div>
              <div style={{ flex: 1 }}>
                <div className="t-h2">Общее время на ассессмент</div>
                <div className="t-body2 muted" style={{ marginTop: 4 }}>После окончания теста все непосещённые вопросы автоматически получают 0 баллов.</div>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1, padding:'14px 18px', background:'var(--c-g96)', borderRadius: 12, display:'flex', alignItems:'baseline', gap: 8 }}>
                <input type="text" defaultValue="30" style={{
                  flex: 1, border:'none', outline:'none', background:'transparent',
                  fontFamily:'var(--font)', fontSize: 32, fontWeight: 600, letterSpacing:'-0.02em',
                  fontVariantNumeric:'tabular-nums'
                }}/>
                <span className="t-body1 muted">минут</span>
              </div>
              <div style={{ display:'flex', gap: 8 }}>
                {[15, 30, 45, 60].map(v => (
                  <button key={v} className="btn btn-secondary" style={{ minWidth: 56, background: v===30 ? 'var(--c-blue-08)' : undefined, color: v===30 ? 'var(--c-blue)' : undefined }}>{v} мин</button>
                ))}
              </div>
            </div>

            {/* Slider mock */}
            <div>
              <div style={{ position:'relative', height: 6, background:'var(--c-g96)', borderRadius: 999 }}>
                <div style={{ position:'absolute', left: 0, top: 0, height: '100%', width:'40%', background:'var(--c-blue)', borderRadius: 999 }}/>
                <div style={{ position:'absolute', left: 'calc(40% - 10px)', top:-7, width: 20, height: 20, borderRadius: '50%', background:'#fff', border:'2px solid var(--c-blue)', boxShadow:'0 2px 8px rgba(0,119,255,0.25)' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop: 8 }}>
                <span className="t-body2 muted">5 мин</span>
                <span className="t-body2 muted">90 мин</span>
              </div>
            </div>
          </div>

          {/* Pool composition */}
          <div className="card">
            <div className="t-h2" style={{ marginBottom: 4 }}>Состав ассессмента</div>
            <div className="t-body2 muted" style={{ marginBottom: 20 }}>Количество вопросов, выбираемых случайно из банка для каждого трека.</div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 12 }}>
              {[
                { t:'API', count: 5, pool: 10, color:'#0077FF' },
                { t:'gRPC', count: 3, pool: 6, color:'#AA43C4' },
                { t:'Mobile', count: 4, pool: 8, color:'#00CC52' },
                { t:'Web', count: 4, pool: 8, color:'#E0A500' },
              ].map(x => (
                <div key={x.t} style={{ padding: 16, border:'1.5px solid var(--bg-divider)', borderRadius: 12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius:'50%', background: x.color }}/>
                    <span className="t-body1-m">{x.t}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'baseline', gap: 6 }}>
                    <input type="text" defaultValue={x.count} style={{
                      width: 56, border:'1.5px solid var(--c-g96)', borderRadius: 8, padding:'8px 10px',
                      fontFamily:'var(--font)', fontSize: 20, fontWeight: 600, textAlign:'center',
                      fontVariantNumeric:'tabular-nums', outline:'none'
                    }}/>
                    <span className="t-body2 muted">из {x.pool}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, padding:'12px 16px', background:'var(--c-blue-08)', borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span className="t-body1" style={{ color:'var(--c-blue)' }}>Итого</span>
              <span className="t-h2" style={{ color:'var(--c-blue)' }}>16 вопросов · ~1.9 мин на вопрос</span>
            </div>
          </div>

          {/* Behavior */}
          <div className="card">
            <div className="t-h2" style={{ marginBottom: 16 }}>Поведение и трекинг</div>
            {[
              { name:'Трекинг курсора и кликов', desc:'Записываются координаты движений и клики. Отображаются heatmap-ом для администратора.', on: true },
              { name:'Время на каждом вопросе', desc:'Сколько секунд стажёр провёл на каждом вопросе.', on: true },
              { name:'Проходной балл — 100%', desc:'Стажёр должен ответить правильно на все вопросы.', on: true },
              { name:'Возможность вернуться к пропущенным', desc:'В пределах общего времени стажёр может перепрыгивать между вопросами.', on: true },
              { name:'Защита от копирования контента', desc:'Запрет на копирование текста вопросов и Ctrl+C.', on: false },
            ].map((s, i, arr) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom: i<arr.length-1 ? '1px solid var(--bg-divider)' : 'none' }}>
                <div style={{ flex: 1, paddingRight: 24 }}>
                  <div className="t-body1-m">{s.name}</div>
                  <div className="t-body2 muted" style={{ marginTop: 2 }}>{s.desc}</div>
                </div>
                <div style={{
                  width: 44, height: 24, borderRadius: 999, background: s.on ? 'var(--c-blue)' : 'var(--c-g80)',
                  position:'relative', flexShrink: 0, transition:'background .2s'
                }}>
                  <div style={{ position:'absolute', top: 2, left: s.on ? 22 : 2, width: 20, height: 20, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.16)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

window.AdminSettings = AdminSettings;
