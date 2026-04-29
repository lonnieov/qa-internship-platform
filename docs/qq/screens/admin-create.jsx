// Screen 3: Admin — создание стажёра (модал) поверх дашборда

const AdminCreateIntern = () => (
  <div className="coin" style={{ width: 1440, height: 900, position:'relative', display:'flex' }}>
    <AdminSidebar active="dashboard"/>
    <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
      <Topbar title="Стажёры" subtitle="Управление кандидатами и их результатами"
        right={<button className="btn btn-primary"><Icon name="plus" size={16}/>Создать стажёра</button>}/>
      {/* Backdrop content (blurred) */}
      <div style={{ flex:1, padding: 32, background:'var(--bg-app)', filter:'blur(4px)', opacity: 0.5 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="card" style={{ height: 96 }}/>)}
        </div>
        <div className="card-flat" style={{ height: 480 }}/>
      </div>
    </div>

    {/* Backdrop dim */}
    <div style={{ position:'absolute', inset: 0, background:'rgba(20,20,20,0.32)' }}/>

    {/* Modal */}
    <div style={{
      position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
      width: 540, background:'#fff', borderRadius: 16, boxShadow:'0 24px 80px rgba(20,20,20,0.18)',
      overflow:'hidden'
    }}>
      <div style={{ padding:'24px 28px', borderBottom:'1px solid var(--bg-divider)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div className="t-h1">Новый стажёр</div>
          <div className="t-body2 muted" style={{ marginTop: 4 }}>Креденшелы будут сгенерированы автоматически</div>
        </div>
        <button className="btn btn-icon"><Icon name="x" size={18}/></button>
      </div>

      <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap: 16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
          <div>
            <label className="input-label">Имя</label>
            <input className="input" defaultValue="Сергей"/>
          </div>
          <div>
            <label className="input-label">Фамилия</label>
            <input className="input" defaultValue="Михайлов"/>
          </div>
        </div>

        <div>
          <label className="input-label">Email</label>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left: 14, top:'50%', transform:'translateY(-50%)', color:'var(--c-g48)' }}>
              <Icon name="mail" size={16}/>
            </div>
            <input className="input" defaultValue="sergey.mikhailov@coin.team" style={{ paddingLeft: 40 }}/>
          </div>
        </div>

        <div>
          <label className="input-label">Технический трек</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap: 8 }}>
            {[
              { id:'api', label:'Backend · API', sel: true },
              { id:'grpc', label:'Backend · gRPC' },
              { id:'mobile', label:'Mobile' },
              { id:'web', label:'Web · Frontend' },
            ].map(t => (
              <div key={t.id} style={{
                padding:'12px 14px', borderRadius: 8, border: `1.5px solid ${t.sel ? 'var(--c-blue)' : 'var(--c-g96)'}`,
                background: t.sel ? 'var(--c-blue-08)' : '#fff', display:'flex', alignItems:'center', justifyContent:'space-between',
                cursor:'pointer'
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: t.sel ? 'var(--c-blue)' : 'var(--c-black)' }}>{t.label}</span>
                {t.sel && <Icon name="check" size={16} color="var(--c-blue)"/>}
              </div>
            ))}
          </div>
        </div>

        {/* Generated credentials */}
        <div style={{ background:'var(--c-g96)', borderRadius: 12, padding: 16 }}>
          <div className="t-body2-m" style={{ marginBottom: 12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>Сгенерированные креденшелы</span>
            <button className="btn btn-ghost" style={{ height: 28, padding:'0 8px', fontSize: 12 }}>
              <Icon name="refresh" size={14}/>Перегенерировать
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'90px 1fr 32px', rowGap: 8, columnGap: 12, alignItems:'center' }}>
            <div className="t-body2 muted">Логин</div>
            <div style={{ fontFamily:'ui-monospace, SF Mono, Menlo, monospace', fontSize: 13, background:'#fff', padding:'8px 10px', borderRadius: 6 }}>sergey.mikhailov</div>
            <button className="btn btn-icon" style={{ width: 32, height: 32, background:'#fff' }}><Icon name="copy" size={14}/></button>
            <div className="t-body2 muted">Пароль</div>
            <div style={{ fontFamily:'ui-monospace, SF Mono, Menlo, monospace', fontSize: 13, background:'#fff', padding:'8px 10px', borderRadius: 6 }}>K9x#mP2vL7nQ</div>
            <button className="btn btn-icon" style={{ width: 32, height: 32, background:'#fff' }}><Icon name="copy" size={14}/></button>
          </div>
          <div className="help-text" style={{ marginTop: 12, display:'flex', gap: 8, alignItems:'flex-start' }}>
            <Icon name="shield" size={14} color="var(--c-blue)"/>
            <span>Пароль будет захэширован bcrypt перед сохранением. Скопируйте его сейчас — увидеть его снова будет нельзя.</span>
          </div>
        </div>
      </div>

      <div style={{ padding:'16px 28px', borderTop:'1px solid var(--bg-divider)', display:'flex', justifyContent:'flex-end', gap: 8 }}>
        <button className="btn btn-ghost">Отмена</button>
        <button className="btn btn-primary">Создать и отправить</button>
      </div>
    </div>
  </div>
);

window.AdminCreateIntern = AdminCreateIntern;
