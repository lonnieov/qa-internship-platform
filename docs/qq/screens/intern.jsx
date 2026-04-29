// Screen 7 + 8 + 9: Intern flow — Start, Test, Result

const InternStart = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex', flexDirection:'column' }}>
    {/* Top */}
    <div style={{ height: 64, padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderBottom:'1px solid var(--bg-divider)' }}>
      <Logo/>
      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        <Avatar name="Иван Петров"/>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Иван Петров</div>
          <div className="t-body2 muted">Backend · API</div>
        </div>
        <Icon name="logout" size={18} color="var(--c-g48)"/>
      </div>
    </div>

    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-app)' }}>
      <div className="card" style={{ width: 720, padding: 48, textAlign:'left' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background:'var(--c-blue-12)', color:'var(--c-blue)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="play" size={32}/>
          </div>
        </div>

        <div style={{ textAlign:'center', marginBottom: 32 }}>
          <div className="t-balance" style={{ marginBottom: 8 }}>Готовы начать ассессмент?</div>
          <div className="t-body1 muted">Привет, Иван! Пройдите технический отбор по треку <b style={{color:'var(--c-blue)'}}>Backend · API</b></div>
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { l:'Вопросов', v:'16', i:'list' },
            { l:'Времени', v:'30 мин', i:'clock' },
            { l:'Проходной балл', v:'100%', i:'check-circle' },
          ].map((s, i) => (
            <div key={i} style={{ background:'var(--c-g96)', borderRadius: 12, padding: 16, textAlign:'center' }}>
              <div style={{ color:'var(--c-blue)', display:'flex', justifyContent:'center', marginBottom: 6 }}>
                <Icon name={s.i} size={18}/>
              </div>
              <div className="t-h2">{s.v}</div>
              <div className="t-body2 muted" style={{ marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Rules */}
        <div style={{ background:'#fff', border:'1px solid var(--bg-divider)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div className="t-body1-m" style={{ marginBottom: 12 }}>Перед началом обратите внимание</div>
          {[
            'Каждый вопрос имеет 4 варианта ответа, верный — только один.',
            'Вы можете возвращаться к пропущенным вопросам в пределах общего времени.',
            'Когда время закончится, тест завершится автоматически. Незаполненные ответы получат 0 баллов.',
            'С момента нажатия «Старт» система записывает движения курсора и время на каждом вопросе.',
          ].map((r, i) => (
            <div key={i} style={{ display:'flex', gap: 10, padding:'8px 0', alignItems:'flex-start' }}>
              <div style={{ color:'var(--c-blue)', flexShrink: 0, marginTop: 2 }}><Icon name="check-circle" size={16}/></div>
              <div className="t-body1">{r}</div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-lg" style={{ width:'100%' }}>
          <Icon name="play" size={18}/>Старт ассессмента
        </button>
        <div className="t-body2 muted" style={{ textAlign:'center', marginTop: 12 }}>
          Нажимая «Старт», вы соглашаетесь с записью телеметрии (курсор, клики, время)
        </div>
      </div>
    </div>
  </div>
);

const InternTest = () => {
  const grid = [
    { n:1, st:'answered' }, { n:2, st:'answered' }, { n:3, st:'current' },
    { n:4, st:'flagged' },  { n:5, st:'unseen' },   { n:6, st:'answered' },
    { n:7, st:'unseen' },   { n:8, st:'unseen' },   { n:9, st:'unseen' },
    { n:10, st:'unseen' },  { n:11, st:'unseen' },  { n:12, st:'unseen' },
    { n:13, st:'unseen' },  { n:14, st:'unseen' },  { n:15, st:'unseen' }, { n:16, st:'unseen' },
  ];
  const dotColor = (st) => st==='answered' ? { bg:'var(--c-blue)', fg:'#fff' }
    : st==='current' ? { bg:'#fff', fg:'var(--c-blue)', border:'2px solid var(--c-blue)' }
    : st==='flagged' ? { bg:'rgba(224,165,0,0.16)', fg:'var(--c-gold)' }
    : { bg:'#fff', fg:'var(--c-g48)', border:'1.5px solid var(--c-g96)' };

  return (
    <div className="coin" style={{ width: 1440, height: 900, display:'flex', flexDirection:'column' }}>
      {/* Top with timer + progress */}
      <div style={{ height: 64, padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderBottom:'1px solid var(--bg-divider)' }}>
        <Logo size="sm"/>
        <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
          <div className="t-body2 muted">Вопрос <b style={{ color:'var(--c-black)' }}>3</b> / 16</div>
          <div style={{ width: 200, height: 6, background:'var(--c-g96)', borderRadius: 999 }}>
            <div style={{ width:'18%', height:'100%', background:'var(--c-blue)', borderRadius: 999 }}/>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 16px', background:'rgba(0,119,255,0.08)', borderRadius: 999 }}>
          <Icon name="clock" size={18} color="var(--c-blue)"/>
          <span style={{ fontSize: 18, fontWeight: 600, color:'var(--c-blue)', fontVariantNumeric:'tabular-nums' }}>24:38</span>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Left: question */}
        <div style={{ flex:1, padding: 48, overflow:'auto', display:'flex', justifyContent:'center', background:'var(--bg-app)' }}>
          <div style={{ width:'100%', maxWidth: 760 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 16 }}>
              <span className="chip" style={{ background:'rgba(170,67,196,0.12)', color:'#AA43C4' }}>gRPC</span>
              <span className="chip chip-grey">Кейс 2 из 4</span>
              <div style={{ flex:1 }}/>
              <button className="btn btn-ghost" style={{ padding:'6px 10px' }}>
                <Icon name="flag" size={16} color="var(--c-gold)"/>
                <span style={{ color:'var(--c-gold)', fontSize: 13, fontWeight: 500 }}>Отметить</span>
              </button>
            </div>

            <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.3, letterSpacing:'-0.015em', marginBottom: 12 }}>
              Сервис принимает поток событий от мобильных клиентов и в ответ должен присылать пуши обратно при появлении новых данных. Какой тип gRPC RPC лучше всего подходит для этой задачи?
            </div>
            <div className="t-body1 muted" style={{ marginBottom: 32 }}>
              Выберите один правильный вариант ответа.
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
              {[
                { l:'Unary RPC', d:'Один запрос — один ответ', sel: false },
                { l:'Server streaming', d:'Один запрос — поток ответов', sel: false },
                { l:'Client streaming', d:'Поток запросов — один ответ', sel: false },
                { l:'Bidirectional streaming', d:'Поток запросов и поток ответов', sel: true },
              ].map((opt, i) => (
                <div key={i} style={{
                  padding:'18px 20px', borderRadius: 12,
                  border: `1.5px solid ${opt.sel ? 'var(--c-blue)' : 'var(--c-g96)'}`,
                  background: opt.sel ? 'rgba(0,119,255,0.04)' : '#fff',
                  display:'flex', alignItems:'center', gap: 14, cursor:'pointer'
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius:'50%',
                    border: `2px solid ${opt.sel ? 'var(--c-blue)' : 'var(--c-g80)'}`,
                    background: opt.sel ? 'var(--c-blue)' : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0
                  }}>
                    {opt.sel && <div style={{ width: 8, height: 8, borderRadius:'50%', background:'#fff' }}/>}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{opt.l}</div>
                    <div className="t-body2 muted" style={{ marginTop: 2 }}>{opt.d}</div>
                  </div>
                  <div style={{ marginLeft:'auto', fontSize: 11, color: opt.sel ? 'var(--c-blue)' : 'var(--c-g80)', fontWeight: 600, letterSpacing:'0.04em' }}>
                    {String.fromCharCode(65+i)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 40 }}>
              <button className="btn btn-secondary"><Icon name="arrow-left" size={16}/>Назад</button>
              <div style={{ display:'flex', gap: 8 }}>
                <button className="btn btn-ghost">Пропустить</button>
                <button className="btn btn-primary">Дальше<Icon name="arrow-right" size={16}/></button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: navigator */}
        <div style={{ width: 280, borderLeft:'1px solid var(--bg-divider)', background:'#fff', padding: 24, overflow:'auto' }}>
          <div className="t-menu muted" style={{ marginBottom: 12 }}>Навигация</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 8, marginBottom: 24 }}>
            {grid.map(g => {
              const c = dotColor(g.st);
              return (
                <div key={g.n} style={{
                  height: 40, borderRadius: 8, background: c.bg, color: c.fg, border: c.border || 'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: 13, fontWeight: 600, cursor:'pointer'
                }}>{g.n}</div>
              );
            })}
          </div>

          <div className="divider" style={{ margin:'4px 0 16px' }}/>

          <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            {[
              { c:'var(--c-blue)', l:'Отвечено · 3' },
              { c:'rgba(224,165,0,0.4)', l:'Отмечено · 1' },
              { c:'var(--c-g96)', l:'Не открыто · 11' },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: s.c }}/>
                <span className="t-body2">{s.l}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 14, background:'rgba(255,68,0,0.06)', borderRadius: 10 }}>
            <div className="t-body2-m" style={{ color:'var(--c-red)', marginBottom: 4 }}>Завершить досрочно</div>
            <div className="t-body2 muted">После завершения вернуться к ассессменту нельзя.</div>
            <button className="btn btn-secondary" style={{ width:'100%', marginTop: 10, color:'var(--c-red)' }}>Завершить</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InternResult = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex', flexDirection:'column' }}>
    <div style={{ height: 64, padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderBottom:'1px solid var(--bg-divider)' }}>
      <Logo size="sm"/>
      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        <Avatar name="Иван Петров"/>
        <div style={{ fontSize: 13, fontWeight: 500 }}>Иван Петров</div>
      </div>
    </div>

    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-app)' }}>
      <div className="card" style={{ width: 720, padding: 48 }}>
        {/* Big score ring */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom: 24 }}>
          <div style={{ position:'relative', width: 200, height: 200 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="86" fill="none" stroke="var(--c-g96)" strokeWidth="16"/>
              <circle cx="100" cy="100" r="86" fill="none" stroke="var(--c-green)" strokeWidth="16"
                strokeDasharray={`${2*Math.PI*86} ${2*Math.PI*86}`}
                strokeLinecap="round" transform="rotate(-90 100 100)"/>
            </svg>
            <div style={{ position:'absolute', inset: 0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize: 48, fontWeight: 600, letterSpacing:'-0.02em', color:'var(--c-green)' }}>100%</div>
              <div className="t-body2 muted">16 из 16</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign:'center', marginBottom: 32 }}>
          <div className="t-h1" style={{ marginBottom: 8 }}>Поздравляем, вы прошли!</div>
          <div className="t-body1 muted" style={{ maxWidth: 480, margin:'0 auto' }}>
            Вы ответили правильно на все вопросы ассессмента. HR-команда свяжется с вами в течение 2-3 рабочих дней.
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 8, marginBottom: 32 }}>
          {[
            { l:'API', v:'5/5', c:'#0077FF' },
            { l:'gRPC', v:'3/3', c:'#AA43C4' },
            { l:'Mobile', v:'4/4', c:'#00CC52' },
            { l:'Web', v:'4/4', c:'#E0A500' },
          ].map((s, i) => (
            <div key={i} style={{ background:'var(--c-g96)', borderRadius: 12, padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: s.c, marginBottom: 4, letterSpacing:'0.02em' }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric:'tabular-nums' }}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 18px', background:'var(--c-g96)', borderRadius: 12, marginBottom: 24 }}>
          <div>
            <div className="t-body2 muted">Затрачено времени</div>
            <div className="t-h2" style={{ marginTop: 4, fontVariantNumeric:'tabular-nums' }}>18:42 <span className="t-body1 muted">из 30:00</span></div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="t-body2 muted">Среднее на вопрос</div>
            <div className="t-h2" style={{ marginTop: 4, fontVariantNumeric:'tabular-nums' }}>1:10</div>
          </div>
        </div>

        <button className="btn btn-secondary btn-lg" style={{ width:'100%' }}>
          <Icon name="logout" size={18}/>Выйти из системы
        </button>
      </div>
    </div>
  </div>
);

window.InternStart = InternStart;
window.InternTest = InternTest;
window.InternResult = InternResult;
