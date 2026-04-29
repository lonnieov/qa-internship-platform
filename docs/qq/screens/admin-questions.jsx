// Screen 4: Admin — управление вопросами (CRUD)

const trackPalette = {
  'API':    { bg:'rgba(0,119,255,0.12)',  fg:'#0077FF' },
  'gRPC':   { bg:'rgba(170,67,196,0.12)', fg:'#AA43C4' },
  'Mobile': { bg:'rgba(0,204,82,0.12)',   fg:'#00CC52' },
  'Web':    { bg:'rgba(224,165,0,0.14)',  fg:'#E0A500' },
};
const TrackBadge = ({ t }) => {
  const p = trackPalette[t] || trackPalette['API'];
  return <span className="chip" style={{ background: p.bg, color: p.fg }}>{t}</span>;
};

const questions = [
  { track:'API', text:'Какой HTTP-метод идемпотентен и должен возвращать тот же результат при повторном вызове?', options:['POST','PUT','PATCH','CONNECT'], correct: 1, used: 28 },
  { track:'API', text:'Что вернёт сервер при попытке обратиться к ресурсу без авторизационного токена?', options:['200 OK','301 Moved','401 Unauthorized','503 Unavailable'], correct: 2, used: 28 },
  { track:'gRPC', text:'Какой формат сериализации использует gRPC по умолчанию?', options:['JSON','XML','Protocol Buffers','MessagePack'], correct: 2, used: 14 },
  { track:'gRPC', text:'Какой тип RPC поддерживает двунаправленный поток сообщений?', options:['Unary','Server streaming','Client streaming','Bidirectional streaming'], correct: 3, used: 14 },
  { track:'Mobile', text:'Чем отличается Stateful от Stateless виджета во Flutter?', options:['Размером','Возможностью изменять состояние','Цветом по умолчанию','Поддержкой анимаций'], correct: 1, used: 22 },
  { track:'Web', text:'Какой селектор имеет наивысшую специфичность в CSS?', options:['.class','#id','tag','*'], correct: 1, used: 31 },
  { track:'Web', text:'Какое значение свойства display создаёт flex-контейнер?', options:['block','inline','flex','grid-flex'], correct: 2, used: 31 },
  { track:'API', text:'Какой код состояния означает успешное создание ресурса?', options:['200','201','202','204'], correct: 1, used: 28 },
];

const AdminQuestions = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex' }}>
    <AdminSidebar active="questions"/>
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Topbar title="Вопросы" subtitle="Банк вопросов · 8 трек-кейсов · 32 вопроса всего"
        right={<>
          <button className="btn btn-secondary"><Icon name="copy" size={16}/>Импорт</button>
          <button className="btn btn-primary"><Icon name="plus" size={16}/>Новый вопрос</button>
        </>}/>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Track filter rail */}
        <div style={{ width: 240, borderRight:'1px solid var(--bg-divider)', background:'#fff', padding: 20 }}>
          <div className="t-menu muted" style={{ marginBottom: 12 }}>Треки</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
            {[
              { name:'Все треки', count: 32, sel: true, color:null },
              { name:'API', count: 10, color: trackPalette['API'].fg },
              { name:'gRPC', count: 6, color: trackPalette['gRPC'].fg },
              { name:'Mobile', count: 8, color: trackPalette['Mobile'].fg },
              { name:'Web', count: 8, color: trackPalette['Web'].fg },
            ].map(t => (
              <div key={t.name} className={`nav-item ${t.sel?'active':''}`} style={{ justifyContent:'space-between' }}>
                <span style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  {t.color && <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }}/>}
                  {!t.color && <Icon name="list" size={16}/>}
                  {t.name}
                </span>
                <span style={{ fontSize: 12, color:'var(--c-g48)' }}>{t.count}</span>
              </div>
            ))}
          </div>
          <div className="divider" style={{ margin:'20px 0' }}/>
          <div className="t-menu muted" style={{ marginBottom: 12 }}>Действия</div>
          <div className="nav-item"><Icon name="filter" size={16}/>Фильтры</div>
          <div className="nav-item"><Icon name="copy" size={16}/>Экспорт CSV</div>
        </div>

        {/* List */}
        <div style={{ flex: 1, padding: 24, overflow:'auto', background:'var(--bg-app)' }}>
          <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
            {questions.map((q, i) => (
              <div key={i} className="card-flat" style={{ padding: 20, display:'flex', gap: 20 }}>
                <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background:'var(--c-g96)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 600, fontSize: 13, color:'var(--c-g48)', fontVariantNumeric:'tabular-nums' }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8 }}>
                    <TrackBadge t={q.track}/>
                    <span className="t-body2 muted">используется в {q.used} ассессментах</span>
                  </div>
                  <div className="t-h2" style={{ marginBottom: 10 }}>{q.text}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap: 8 }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{
                        padding:'10px 14px', borderRadius: 8,
                        background: oi===q.correct ? 'rgba(0,204,82,0.08)' : '#FAFBFD',
                        border: `1px solid ${oi===q.correct ? 'rgba(0,204,82,0.32)' : 'var(--bg-divider)'}`,
                        display:'flex', alignItems:'center', gap: 10, fontSize: 13
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `1.5px solid ${oi===q.correct ? 'var(--c-green)' : 'var(--c-g80)'}`,
                          background: oi===q.correct ? 'var(--c-green)' : 'transparent',
                          display:'flex', alignItems:'center', justifyContent:'center'
                        }}>
                          {oi===q.correct && <Icon name="check" size={12} color="#fff"/>}
                        </div>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                  <button className="btn btn-icon"><Icon name="edit" size={16}/></button>
                  <button className="btn btn-icon"><Icon name="copy" size={16}/></button>
                  <button className="btn btn-icon" style={{ color:'var(--c-red)' }}><Icon name="trash" size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

window.AdminQuestions = AdminQuestions;
