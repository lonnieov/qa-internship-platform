// Scenario 1: UI Bug Detection — Intern + Admin

const bugMarkers = [
  { x: 18, y: 14, n: 1, label:'Logo обрезан' },
  { x: 78, y: 14, n: 2, label:'Иконка корзины не выровнена' },
  { x: 36, y: 56, n: 3, label:'Цена и старая цена слиплись' },
  { x: 70, y: 78, n: 4, label:'Кнопка слишком близко к краю' },
];

// Mock e-commerce screen with intentional "bugs"
const BuggyMockup = ({ markers, activeId }) => (
  <div style={{ position:'relative', width:'100%', height:'100%', background:'#fff', overflow:'hidden', userSelect:'none' }}>
    {/* header */}
    <div style={{ height: 60, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #EBF0F5' }}>
      {/* logo intentionally clipped */}
      <div style={{ overflow:'hidden', height: 22, width: 92 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color:'#0077FF', transform:'translateY(-3px)' }}>SHOPLY</div>
      </div>
      <div style={{ display:'flex', gap: 24, fontSize: 13, color:'#76787A' }}>
        <span>Каталог</span><span>Скидки</span><span>О нас</span>
      </div>
      {/* misaligned cart icon */}
      <div style={{ display:'flex', gap: 12, transform:'translateY(6px)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background:'#EBF0F5' }}/>
        <div style={{ width: 28, height: 28, borderRadius: 8, background:'#EBF0F5' }}/>
      </div>
    </div>
    {/* hero */}
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Беспроводные наушники Pulse X3</div>
      <div style={{ fontSize: 13, color:'#76787A', marginBottom: 14 }}>Тихие, лёгкие, до 32 часов работы</div>
      <div style={{ display:'flex', gap: 16 }}>
        <div style={{ width: 240, height: 180, background:'linear-gradient(135deg, #EBF0F5, #C5D2E0)', borderRadius: 12 }}/>
        <div style={{ flex:1 }}>
          {/* squashed pricing */}
          <div style={{ display:'flex', alignItems:'baseline' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color:'#141414' }}>12 990₽</div>
            <div style={{ fontSize: 18, color:'#B0B4B8', textDecoration:'line-through', marginLeft: 2 }}>15990₽</div>
          </div>
          <div style={{ fontSize: 12, color:'#FF4400', marginTop: 4 }}>−19%</div>
          <div style={{ marginTop: 16, fontSize: 13, color:'#76787A', lineHeight: 1.5 }}>
            Активное шумоподавление, поддержка кодеков LDAC/AAC, USB-C зарядка, кейс с беспроводной зарядкой.
          </div>
        </div>
      </div>
      <div style={{ marginTop: 20, display:'flex', justifyContent:'flex-end' }}>
        {/* button too close to edge */}
        <button style={{ padding:'12px 24px', borderRadius: 8, background:'#0077FF', color:'#fff', border:'none', fontSize: 14, fontWeight: 500, marginRight: -16 }}>В корзину</button>
      </div>
    </div>
    {/* markers overlay */}
    {markers.map(m => (
      <div key={m.n} style={{
        position:'absolute', left:`${m.x}%`, top:`${m.y}%`, transform:'translate(-50%,-50%)',
        width: 28, height: 28, borderRadius:'50%',
        background: activeId===m.n ? '#FF4400' : 'rgba(255,68,0,0.92)',
        border:'2px solid #fff', boxShadow:'0 4px 12px rgba(255,68,0,0.4)',
        color:'#fff', fontSize: 13, fontWeight: 700,
        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
      }}>{m.n}</div>
    ))}
  </div>
);

const InternBugDetection = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex', flexDirection:'column' }}>
    <div style={{ height: 64, padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderBottom:'1px solid var(--bg-divider)' }}>
      <Logo size="sm"/>
      <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
        <div className="t-body2 muted">Задание <b style={{ color:'var(--c-black)' }}>2</b> / 4</div>
        <div style={{ width: 200, height: 6, background:'var(--c-g96)', borderRadius: 999 }}>
          <div style={{ width:'40%', height:'100%', background:'var(--c-blue)', borderRadius: 999 }}/>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 16px', background:'rgba(0,119,255,0.08)', borderRadius: 999 }}>
        <Icon name="clock" size={18} color="var(--c-blue)"/>
        <span style={{ fontSize: 18, fontWeight: 600, color:'var(--c-blue)', fontVariantNumeric:'tabular-nums' }}>22:14</span>
      </div>
    </div>

    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* Canvas */}
      <div style={{ flex:1, padding: 24, overflow:'auto', background:'var(--bg-app)' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 12 }}>
          <span className="chip chip-blue">UI Bug Detection</span>
          <span className="t-body2 muted">Кликните на проблемные места и опишите дефект</span>
        </div>
        <div style={{ background:'#fff', borderRadius: 16, border:'1px solid var(--bg-divider)', overflow:'hidden', height: 720, position:'relative' }}>
          {/* Browser chrome */}
          <div style={{ height: 32, background:'var(--c-g96)', display:'flex', alignItems:'center', padding:'0 12px', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius:'50%', background:'#FF4400' }}/>
            <span style={{ width: 10, height: 10, borderRadius:'50%', background:'#E0A500' }}/>
            <span style={{ width: 10, height: 10, borderRadius:'50%', background:'#00CC52' }}/>
            <div style={{ flex:1, marginLeft: 16, height: 18, background:'#fff', borderRadius: 4, fontSize: 11, padding:'2px 8px', color:'var(--c-g48)', display:'flex', alignItems:'center' }}>shoply.test/product/pulse-x3</div>
          </div>
          <div style={{ height: 'calc(100% - 32px)' }}>
            <BuggyMockup markers={bugMarkers} activeId={3}/>
          </div>
        </div>
      </div>

      {/* Right: bug list */}
      <div style={{ width: 360, borderLeft:'1px solid var(--bg-divider)', background:'#fff', display:'flex', flexDirection:'column' }}>
        <div style={{ padding: 20, borderBottom:'1px solid var(--bg-divider)' }}>
          <div className="t-h2">Найденные баги</div>
          <div className="t-body2 muted" style={{ marginTop: 4 }}>{bugMarkers.length} обнаружено · кликайте на экране, чтобы добавить</div>
        </div>

        <div style={{ flex:1, overflow:'auto', padding: 16 }}>
          {bugMarkers.map((m, i) => (
            <div key={m.n} style={{
              padding: 14, borderRadius: 12,
              background: m.n===3 ? 'rgba(255,68,0,0.06)' : '#FAFBFD',
              border: `1px solid ${m.n===3 ? 'rgba(255,68,0,0.32)' : 'var(--bg-divider)'}`,
              marginBottom: 8
            }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius:'50%', background:'#FF4400', color:'#fff', fontSize: 11, fontWeight: 700, display:'flex', alignItems:'center', justifyContent:'center' }}>{m.n}</div>
                <span className="t-body1-m">{m.label}</span>
                <Icon name="trash" size={14} color="var(--c-g48)"/>
              </div>
              {m.n===3 ? (
                <textarea defaultValue="Старая зачёркнутая цена прижата вплотную к актуальной — не читается. Должен быть отступ ~12px." style={{
                  width:'100%', minHeight: 70, border:'1.5px solid var(--c-blue)', borderRadius: 8, padding: 10,
                  fontFamily:'var(--font)', fontSize: 13, lineHeight: 1.5, color:'var(--c-black)', outline:'none', resize:'vertical'
                }}/>
              ) : (
                <div className="t-body2 muted">Описание добавлено · {[24, 18, 31][i] || 22} символов</div>
              )}
            </div>
          ))}

          {/* Empty add prompt */}
          <div style={{ padding: 14, borderRadius: 12, border:'1.5px dashed var(--c-g80)', background:'#fff', display:'flex', alignItems:'center', gap: 10, color:'var(--c-g48)', fontSize: 13 }}>
            <Icon name="plus" size={16}/>Кликните на экране, чтобы добавить баг
          </div>
        </div>

        <div style={{ padding: 16, borderTop:'1px solid var(--bg-divider)', display:'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex:1 }}>Сохранить черновик</button>
          <button className="btn btn-primary" style={{ flex:1 }}>Отправить<Icon name="arrow-right" size={16}/></button>
        </div>
      </div>
    </div>
  </div>
);

const AdminBugReview = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex' }}>
    <AdminSidebar active="dashboard"/>
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Topbar
        title={<span style={{ display:'flex', alignItems:'center', gap: 12 }}><Icon name="arrow-left" size={18}/>Мария Соколова · UI Bug Detection</span>}
        subtitle="Задание 2 из 4 · отправлено 3 минуты назад"
        right={<><button className="btn btn-secondary">Следующий стажёр</button><button className="btn btn-primary"><Icon name="check" size={16}/>Сохранить оценку</button></>}
      />

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:1, padding: 24, background:'var(--bg-app)' }}>
          <div style={{ background:'#fff', borderRadius: 16, border:'1px solid var(--bg-divider)', overflow:'hidden', height: 720 }}>
            <div style={{ height: 32, background:'var(--c-g96)', display:'flex', alignItems:'center', padding:'0 12px', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius:'50%', background:'#FF4400' }}/>
              <span style={{ width: 10, height: 10, borderRadius:'50%', background:'#E0A500' }}/>
              <span style={{ width: 10, height: 10, borderRadius:'50%', background:'#00CC52' }}/>
            </div>
            <div style={{ height: 'calc(100% - 32px)' }}><BuggyMockup markers={bugMarkers} activeId={3}/></div>
          </div>
        </div>

        <div style={{ width: 380, borderLeft:'1px solid var(--bg-divider)', background:'#fff', display:'flex', flexDirection:'column' }}>
          <div style={{ padding: 20, borderBottom:'1px solid var(--bg-divider)' }}>
            <div className="t-h2">Оценка ответов</div>
            <div className="t-body2 muted" style={{ marginTop: 4 }}>Эталон: 5 багов · стажёр нашёл 4 · пропущено 1</div>
            <div style={{ marginTop: 12, padding:'10px 14px', background:'rgba(0,204,82,0.08)', borderRadius: 10, display:'flex', justifyContent:'space-between' }}>
              <span className="t-body2-m" style={{ color:'var(--c-green)' }}>Текущий балл</span>
              <span className="t-h2" style={{ color:'var(--c-green)' }}>80%</span>
            </div>
          </div>

          <div style={{ flex:1, overflow:'auto', padding: 16 }}>
            {[
              { n:1, label:'Logo обрезан', state:'correct' },
              { n:2, label:'Иконка корзины не выровнена', state:'correct' },
              { n:3, label:'Цена и старая цена слиплись', state:'pending', cmt:'Старая зачёркнутая цена прижата вплотную к актуальной...' },
              { n:4, label:'Кнопка слишком близко к краю', state:'incorrect' },
              { n:'—', label:'Пропущенный баг: контраст ссылок в шапке', state:'missed' },
            ].map((b, i) => (
              <div key={i} style={{
                padding: 12, borderRadius: 10, marginBottom: 8,
                background: b.state==='missed' ? 'rgba(255,136,0,0.06)' : '#FAFBFD',
                border: `1px solid ${b.state==='missed' ? 'rgba(255,136,0,0.3)' : 'var(--bg-divider)'}`
              }}>
                <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: b.cmt ? 8 : 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius:'50%', flexShrink: 0,
                    background: b.state==='missed' ? 'var(--c-orange)' : '#FF4400',
                    color:'#fff', fontSize: 11, fontWeight: 700, display:'flex', alignItems:'center', justifyContent:'center'
                  }}>{b.n}</div>
                  <span className="t-body1-m" style={{ flex:1 }}>{b.label}</span>
                  {b.state==='correct' && <span className="chip chip-green">+1</span>}
                  {b.state==='incorrect' && <span className="chip chip-red">0</span>}
                  {b.state==='pending' && (
                    <div style={{ display:'flex', gap: 4 }}>
                      <button className="btn btn-icon" style={{ width: 26, height: 26, background:'rgba(0,204,82,0.12)', color:'var(--c-green)' }}><Icon name="check" size={14}/></button>
                      <button className="btn btn-icon" style={{ width: 26, height: 26, background:'rgba(255,68,0,0.12)', color:'var(--c-red)' }}><Icon name="x" size={14}/></button>
                    </div>
                  )}
                  {b.state==='missed' && <span className="chip chip-orange">пропущен</span>}
                </div>
                {b.cmt && <div className="t-body2 muted" style={{ paddingLeft: 32 }}>«{b.cmt}»</div>}
              </div>
            ))}
          </div>

          <div style={{ padding: 16, borderTop:'1px solid var(--bg-divider)' }}>
            <label className="input-label">Комментарий ментора</label>
            <textarea defaultValue="Хорошо отметил очевидные проблемы выравнивания. Стоит обращать внимание на контраст." style={{
              width:'100%', minHeight: 64, border:'1.5px solid var(--c-g96)', borderRadius: 8, padding: 10,
              fontFamily:'var(--font)', fontSize: 13, lineHeight: 1.5, outline:'none', resize:'none'
            }}/>
          </div>
        </div>
      </div>
    </div>
  </div>
);

window.InternBugDetection = InternBugDetection;
window.AdminBugReview = AdminBugReview;
