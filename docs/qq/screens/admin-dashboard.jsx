// Screen 2: Admin dashboard — список стажёров

const interns = [
  { name:'Иван Петров', login:'ivan.petrov', track:'Backend · API', status:'completed', score: 100, time:'18:42', date:'24 апр' },
  { name:'Мария Соколова', login:'maria.sokolova', track:'Mobile', status:'in-progress', score: null, time:'12:08', date:'27 апр' },
  { name:'Алексей Кузнецов', login:'alexey.kuznetsov', track:'Backend · gRPC', status:'completed', score: 92, time:'24:11', date:'23 апр' },
  { name:'Дарья Иванова', login:'darya.ivanova', track:'Web · Frontend', status:'completed', score: 100, time:'19:55', date:'22 апр' },
  { name:'Никита Орлов', login:'nikita.orlov', track:'Backend · API', status:'pending', score: null, time:null, date:'не начат' },
  { name:'Елена Васильева', login:'elena.vasilieva', track:'Mobile', status:'completed', score: 75, time:'29:34', date:'21 апр' },
  { name:'Артём Лебедев', login:'artem.lebedev', track:'Web · Frontend', status:'pending', score: null, time:null, date:'не начат' },
  { name:'Полина Новикова', login:'polina.novikova', track:'Backend · gRPC', status:'completed', score: 100, time:'21:04', date:'20 апр' },
];

const StatusChip = ({ status, score }) => {
  if (status === 'completed') {
    if (score === 100) return <span className="chip chip-green"><Icon name="check" size={12}/>Принят</span>;
    return <span className="chip chip-red"><Icon name="x" size={12}/>Не прошёл</span>;
  }
  if (status === 'in-progress') return <span className="chip chip-blue"><Icon name="clock" size={12}/>Проходит</span>;
  return <span className="chip chip-grey">Ожидает</span>;
};

const StatCard = ({ label, value, accent, sub }) => (
  <div className="card" style={{ padding: 20 }}>
    <div className="t-body2 muted" style={{ marginBottom: 12 }}>{label}</div>
    <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing:'-0.02em', color: accent || 'var(--c-black)' }}>{value}</div>
      {sub && <div className="t-body2 muted">{sub}</div>}
    </div>
  </div>
);

const AdminDashboard = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex' }}>
    <AdminSidebar active="dashboard"/>
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Topbar title="Стажёры" subtitle="Управление кандидатами и их результатами"
        right={<>
          <button className="btn btn-secondary"><Icon name="search" size={16}/>Поиск</button>
          <button className="btn btn-primary"><Icon name="plus" size={16}/>Создать стажёра</button>
        </>}/>

      <div style={{ flex:1, padding: 32, overflow:'auto', background:'var(--bg-app)' }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Всего кандидатов" value="42" sub="за апрель"/>
          <StatCard label="Прошли успешно" value="18" accent="var(--c-green)" sub="100%"/>
          <StatCard label="В процессе" value="3" accent="var(--c-blue)"/>
          <StatCard label="Не прошли" value="9" accent="var(--c-red)"/>
        </div>

        {/* Filters row */}
        <div style={{ display:'flex', gap: 12, marginBottom: 16, alignItems:'center' }}>
          <div style={{ position:'relative', flex: 1, maxWidth: 360 }}>
            <div style={{ position:'absolute', left: 14, top: '50%', transform:'translateY(-50%)', color:'var(--c-g48)' }}>
              <Icon name="search" size={16}/>
            </div>
            <input className="input" placeholder="Поиск по имени или логину" style={{ paddingLeft: 40, height: 40 }}/>
          </div>
          <button className="btn btn-secondary"><Icon name="filter" size={16}/>Все треки</button>
          <button className="btn btn-secondary"><Icon name="filter" size={16}/>Все статусы</button>
          <div style={{ flex: 1 }}/>
          <span className="t-body2 muted">{interns.length} из 42</span>
        </div>

        {/* Table */}
        <div className="card-flat" style={{ overflow:'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Кандидат</th>
                <th>Трек</th>
                <th>Статус</th>
                <th style={{ textAlign:'right' }}>Балл</th>
                <th>Время</th>
                <th>Дата</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {interns.map((i,idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
                      <Avatar name={i.name}/>
                      <div>
                        <div style={{ fontWeight: 500 }}>{i.name}</div>
                        <div className="t-body2 muted">@{i.login}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted">{i.track}</td>
                  <td><StatusChip status={i.status} score={i.score}/></td>
                  <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight: 500,
                    color: i.score==null ? 'var(--c-g80)' : i.score===100 ? 'var(--c-green)' : i.score>=85 ? 'var(--c-orange)' : 'var(--c-red)' }}>
                    {i.score==null ? '—' : `${i.score}%`}
                  </td>
                  <td className="muted" style={{ fontVariantNumeric:'tabular-nums' }}>{i.time || '—'}</td>
                  <td className="muted">{i.date}</td>
                  <td>
                    <button className="btn btn-icon" style={{ width: 28, height: 28 }}><Icon name="dot-menu" size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

window.AdminDashboard = AdminDashboard;
