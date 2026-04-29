// Screen 6: Admin — результаты стажёра + heatmap

const AdminResults = () => {
  // synthetic heatmap blobs — Gaussian-ish radial
  const blobs = [
    { x: 165, y: 240, r: 120, a: 0.55 },
    { x: 220, y: 380, r: 90,  a: 0.45 },
    { x: 410, y: 350, r: 110, a: 0.65 }, // option B (correct)
    { x: 580, y: 350, r: 70,  a: 0.30 },
    { x: 410, y: 470, r: 80,  a: 0.35 },
    { x: 700, y: 540, r: 100, a: 0.50 }, // submit
    { x: 130, y: 80,  r: 60,  a: 0.25 },
  ];

  const answers = [
    { n:1, t:'API', correct: true, time: '0:42' },
    { n:2, t:'API', correct: true, time: '1:08' },
    { n:3, t:'gRPC', correct: false, time: '2:14' },
    { n:4, t:'gRPC', correct: true, time: '1:33' },
    { n:5, t:'Mobile', correct: true, time: '0:55' },
    { n:6, t:'Mobile', correct: true, time: '1:12' },
    { n:7, t:'Web', correct: false, time: '0:48' },
    { n:8, t:'Web', correct: true, time: '1:25' },
  ];

  return (
    <div className="coin" style={{ width: 1440, height: 900, display:'flex' }}>
      <AdminSidebar active="dashboard"/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Topbar
          title={<span style={{ display:'flex', alignItems:'center', gap: 12 }}><Icon name="arrow-left" size={18}/>Алексей Кузнецов</span>}
          subtitle="@alexey.kuznetsov · Backend · gRPC · 23 апреля 2026"
          right={<><button className="btn btn-secondary"><Icon name="copy" size={16}/>Экспорт</button><button className="btn btn-secondary">Сбросить попытку</button></>}
        />

        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          {/* Left: summary */}
          <div style={{ width: 320, borderRight:'1px solid var(--bg-divider)', background:'#fff', padding: 24, overflow:'auto' }}>
            {/* score ring */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom: 20 }}>
              <div style={{ position:'relative', width: 160, height: 160 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="68" fill="none" stroke="var(--c-g96)" strokeWidth="14"/>
                  <circle cx="80" cy="80" r="68" fill="none" stroke="var(--c-orange)" strokeWidth="14"
                    strokeDasharray={`${2*Math.PI*68*0.92} ${2*Math.PI*68}`}
                    strokeLinecap="round" transform="rotate(-90 80 80)"/>
                </svg>
                <div style={{ position:'absolute', inset: 0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 600, letterSpacing:'-0.02em' }}>92%</div>
                  <div className="t-body2 muted">7 из 8 верно</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign:'center', marginBottom: 24 }}>
              <span className="chip chip-red"><Icon name="x" size={12}/>Не прошёл — нужен 100%</span>
            </div>

            {[
              { l:'Общее время', v:'24:11', i:'clock' },
              { l:'Среднее на вопрос', v:'1:21', i:'clock' },
              { l:'Кликов мышью', v:'42', i:'mouse' },
              { l:'Возвратов к вопросам', v:'3', i:'refresh' },
              { l:'Дольше всего на вопросе', v:'#3 — 2:14', i:'flag' },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--bg-divider)' }}>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <Icon name={s.i} size={16} color="var(--c-g48)"/>
                  <span className="t-body2 muted">{s.l}</span>
                </div>
                <span className="t-body1-m" style={{ fontVariantNumeric:'tabular-nums' }}>{s.v}</span>
              </div>
            ))}

            <div className="t-menu muted" style={{ margin:'24px 0 12px' }}>Ответы по вопросам</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
              {answers.map(a => (
                <div key={a.n} style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: a.correct ? 'rgba(0,204,82,0.12)' : 'rgba(255,68,0,0.12)',
                  color: a.correct ? 'var(--c-green)' : 'var(--c-red)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: 13, fontWeight: 600, cursor:'pointer',
                  border: a.n===3 ? '2px solid var(--c-red)' : 'none'
                }}>{a.n}</div>
              ))}
            </div>
          </div>

          {/* Right: heatmap viewer */}
          <div style={{ flex: 1, padding: 24, background:'var(--bg-app)', overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
              <div>
                <div className="t-h2">Вопрос #3 · gRPC</div>
                <div className="t-body2 muted">Heatmap движений курсора · 2:14 на странице · ответ неверный</div>
              </div>
              <div style={{ display:'flex', gap: 8 }}>
                <button className="btn btn-secondary"><Icon name="arrow-left" size={16}/></button>
                <button className="btn btn-secondary">Вопрос 3 / 8 <Icon name="arrow-right" size={16}/></button>
              </div>
            </div>

            {/* Mock screenshot of question with heatmap overlay */}
            <div style={{ position:'relative', background:'#fff', border:'1px solid var(--bg-divider)', borderRadius: 16, overflow:'hidden', height: 620 }}>
              {/* fake question screenshot content */}
              <div style={{ padding: 40 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 16 }}>
                  <span className="chip" style={{ background:'rgba(170,67,196,0.12)', color:'#AA43C4' }}>gRPC</span>
                  <span className="t-body2 muted">Вопрос 3 из 8</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.35, marginBottom: 28, maxWidth: 720 }}>
                  Какой формат сериализации использует gRPC по умолчанию для передачи сообщений между сервисами?
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap: 12, maxWidth: 720 }}>
                  {['JSON','XML','Protocol Buffers','MessagePack'].map((opt, oi) => (
                    <div key={oi} style={{
                      padding:'18px 20px', borderRadius: 12, border:'1.5px solid var(--c-g96)',
                      background:'#fff', display:'flex', alignItems:'center', gap: 12,
                      ...(oi===0 ? { borderColor:'var(--c-red)', background:'rgba(255,68,0,0.04)' } : {})
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius:'50%',
                        border: `2px solid ${oi===0?'var(--c-red)':'var(--c-g80)'}`,
                        background: oi===0?'var(--c-red)':'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center'
                      }}>
                        {oi===0 && <div style={{ width: 8, height: 8, borderRadius:'50%', background:'#fff' }}/>}
                      </div>
                      <span style={{ fontSize: 15 }}>{opt}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 32, display:'flex', justifyContent:'space-between', maxWidth: 720 }}>
                  <button className="btn btn-secondary" style={{ pointerEvents:'none' }}><Icon name="arrow-left" size={16}/>Назад</button>
                  <button className="btn btn-primary" style={{ pointerEvents:'none' }}>Дальше<Icon name="arrow-right" size={16}/></button>
                </div>
              </div>

              {/* heatmap overlay */}
              <svg viewBox="0 0 900 620" preserveAspectRatio="none" style={{ position:'absolute', inset: 0, width:'100%', height:'100%', pointerEvents:'none', mixBlendMode:'multiply' }}>
                <defs>
                  <radialGradient id="hot" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FF4400" stopOpacity="0.7"/>
                    <stop offset="40%" stopColor="#FF8800" stopOpacity="0.4"/>
                    <stop offset="80%" stopColor="#E0A500" stopOpacity="0.15"/>
                    <stop offset="100%" stopColor="#0077FF" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                {blobs.map((b,i) => (
                  <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="url(#hot)" opacity={b.a}/>
                ))}
                {/* mouse path */}
                <path d="M120 80 C 200 200, 180 320, 220 380 S 350 360, 410 350 S 580 380, 580 350 S 450 480, 410 470 S 700 540, 700 540"
                  fill="none" stroke="#0077FF" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="3 3"/>
                {/* click dots */}
                {[[410,350],[580,350],[700,540],[410,470]].map(([cx,cy], i) => (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="6" fill="#0077FF" fillOpacity="0.9"/>
                    <circle cx={cx} cy={cy} r="12" fill="none" stroke="#0077FF" strokeOpacity="0.4"/>
                  </g>
                ))}
              </svg>

              {/* Legend */}
              <div style={{ position:'absolute', bottom: 16, left: 16, background:'#fff', borderRadius: 10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(20,20,20,0.08)', display:'flex', alignItems:'center', gap: 14, fontSize: 12 }}>
                <span style={{ display:'flex', alignItems:'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius:'50%', background:'#0077FF' }}/>Клик
                </span>
                <span style={{ display:'flex', alignItems:'center', gap: 6 }}>
                  <span style={{ width: 24, height: 6, borderRadius: 3, background:'linear-gradient(90deg,#0077FF22,#FF8800,#FF4400)' }}/>Активность
                </span>
                <span className="muted">42 клика · 318 движений</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.AdminResults = AdminResults;
