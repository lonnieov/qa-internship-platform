// Scenario 2: API Testing — Intern + Admin

const InternApiTesting = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex', flexDirection:'column' }}>
    <div style={{ height: 64, padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderBottom:'1px solid var(--bg-divider)' }}>
      <Logo size="sm"/>
      <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
        <div className="t-body2 muted">Задание <b style={{ color:'var(--c-black)' }}>3</b> / 4</div>
        <div style={{ width: 200, height: 6, background:'var(--c-g96)', borderRadius: 999 }}>
          <div style={{ width:'62%', height:'100%', background:'var(--c-blue)', borderRadius: 999 }}/>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 16px', background:'rgba(0,119,255,0.08)', borderRadius: 999 }}>
        <Icon name="clock" size={18} color="var(--c-blue)"/>
        <span style={{ fontSize: 18, fontWeight: 600, color:'var(--c-blue)', fontVariantNumeric:'tabular-nums' }}>16:08</span>
      </div>
    </div>

    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* Left: task brief */}
      <div style={{ width: 320, borderRight:'1px solid var(--bg-divider)', background:'#fff', padding: 24, overflow:'auto' }}>
        <span className="chip chip-blue" style={{ marginBottom: 12 }}>API Testing</span>
        <div className="t-h2" style={{ margin:'12px 0 8px' }}>Создать заказ</div>
        <div className="t-body1 muted" style={{ marginBottom: 20, lineHeight: 1.5 }}>
          API сервис принимает заказы пользователей. Ваша задача — отправить корректный запрос на создание заказа и убедиться, что ответ соответствует ожидаемому.
        </div>

        <div className="t-menu muted" style={{ marginBottom: 8 }}>Условия задачи</div>
        {[
          'Создайте заказ для пользователя ID 1042',
          'Содержимое: 2× SKU "P-883", 1× SKU "P-127"',
          'Способ доставки: courier',
          'Ожидаемый код ответа: 201 Created',
        ].map((c, i) => (
          <div key={i} style={{ display:'flex', gap: 8, padding:'6px 0' }}>
            <Icon name="check" size={14} color="var(--c-blue)"/>
            <div className="t-body2">{c}</div>
          </div>
        ))}

        <div className="t-menu muted" style={{ margin:'24px 0 8px' }}>Авторизация</div>
        <div style={{ background:'var(--c-g96)', padding: 10, borderRadius: 8, fontFamily:'ui-monospace, monospace', fontSize: 12, wordBreak:'break-all' }}>
          Bearer eyJhbGc...kT7y
        </div>

        <div style={{ marginTop: 24, padding: 12, background:'rgba(224,165,0,0.08)', borderRadius: 10, fontSize: 12, lineHeight: 1.5 }}>
          <b style={{ color:'var(--c-gold)' }}>Подсказка.</b> Используйте идемпотентный, но не безопасный HTTP-метод для создания нового ресурса.
        </div>
      </div>

      {/* Center: request/response builder */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* URL bar */}
        <div style={{ padding: 20, borderBottom:'1px solid var(--bg-divider)', background:'#fff', display:'flex', gap: 8, alignItems:'stretch' }}>
          <select style={{
            padding:'10px 12px', borderRadius: 8, border:'1.5px solid var(--c-g96)',
            background:'#fff', fontFamily:'var(--font)', fontSize: 13, fontWeight: 600,
            color:'var(--c-green)', minWidth: 100
          }} defaultValue="POST">
            <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
          </select>
          <input className="input" defaultValue="https://api.coin.test/v1/orders" style={{ flex:1, fontFamily:'ui-monospace, monospace', fontSize: 13 }}/>
          <button className="btn btn-primary btn-lg" style={{ minWidth: 120 }}>
            <Icon name="play" size={16}/>Send
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', padding:'0 20px', borderBottom:'1px solid var(--bg-divider)', background:'#fff' }}>
          {['Headers (3)', 'Body', 'Params', 'Auth'].map((t, i) => (
            <div key={i} style={{
              padding:'12px 16px', fontSize: 13, fontWeight: 500,
              color: i===1 ? 'var(--c-blue)' : 'var(--c-g48)',
              borderBottom: i===1 ? '2px solid var(--c-blue)' : '2px solid transparent',
              cursor:'pointer'
            }}>{t}</div>
          ))}
        </div>

        {/* Body editor */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'12px 20px', display:'flex', gap: 8, borderBottom:'1px solid var(--bg-divider)', background:'#FAFBFD' }}>
            {['raw', 'form-data', 'x-www-form-urlencoded', 'binary'].map((m, i) => (
              <span key={i} className={`chip ${i===0?'chip-blue':'chip-grey'}`}>{m}</span>
            ))}
            <div style={{ flex:1 }}/>
            <span className="chip chip-grey">JSON</span>
          </div>

          <pre style={{
            flex:1, margin: 0, padding: 20, background:'#FAFBFD', overflow:'auto',
            fontFamily:'ui-monospace, SF Mono, Menlo, monospace', fontSize: 13, lineHeight: 1.6,
            color:'var(--c-black)', whiteSpace:'pre'
          }}>
{`{
  `}<span style={{ color:'#AA43C4' }}>"user_id"</span>{`: `}<span style={{ color:'#0077FF' }}>1042</span>{`,
  `}<span style={{ color:'#AA43C4' }}>"items"</span>{`: [
    { `}<span style={{ color:'#AA43C4' }}>"sku"</span>{`: `}<span style={{ color:'#00CC52' }}>"P-883"</span>{`, `}<span style={{ color:'#AA43C4' }}>"qty"</span>{`: `}<span style={{ color:'#0077FF' }}>2</span>{` },
    { `}<span style={{ color:'#AA43C4' }}>"sku"</span>{`: `}<span style={{ color:'#00CC52' }}>"P-127"</span>{`, `}<span style={{ color:'#AA43C4' }}>"qty"</span>{`: `}<span style={{ color:'#0077FF' }}>1</span>{` }
  ],
  `}<span style={{ color:'#AA43C4' }}>"shipping"</span>{`: `}<span style={{ color:'#00CC52' }}>"courier"</span>{`
}`}
          </pre>

          {/* Response */}
          <div style={{ borderTop:'1px solid var(--bg-divider)', background:'#fff' }}>
            <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap: 16, borderBottom:'1px solid var(--bg-divider)' }}>
              <div className="t-body1-m">Response</div>
              <span className="chip chip-green"><Icon name="check" size={12}/>201 Created</span>
              <span className="t-body2 muted">132 ms</span>
              <span className="t-body2 muted">487 B</span>
              <div style={{ flex:1 }}/>
              <span className="chip chip-green"><Icon name="check-circle" size={12}/>Совпадает с ожидаемым</span>
            </div>
            <pre style={{
              margin: 0, padding:'16px 20px', background:'#FAFBFD',
              fontFamily:'ui-monospace, monospace', fontSize: 12, lineHeight: 1.6,
              color:'var(--c-black)', maxHeight: 180, overflow:'auto'
            }}>
{`{
  `}<span style={{ color:'#AA43C4' }}>"id"</span>{`: `}<span style={{ color:'#00CC52' }}>"ord_8a2f1c"</span>{`,
  `}<span style={{ color:'#AA43C4' }}>"status"</span>{`: `}<span style={{ color:'#00CC52' }}>"pending"</span>{`,
  `}<span style={{ color:'#AA43C4' }}>"total"</span>{`: `}<span style={{ color:'#0077FF' }}>14860</span>{`,
  `}<span style={{ color:'#AA43C4' }}>"created_at"</span>{`: `}<span style={{ color:'#00CC52' }}>"2026-04-27T10:14:22Z"</span>{`
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AdminApiTask = () => (
  <div className="coin" style={{ width: 1440, height: 900, display:'flex' }}>
    <AdminSidebar active="questions"/>
    <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
      <Topbar title="API задание · «Создать заказ»" subtitle="Сценарий API Testing · 3 из 8 заданий"
        right={<><button className="btn btn-ghost">Удалить</button><button className="btn btn-primary"><Icon name="check" size={16}/>Сохранить</button></>}/>

      <div style={{ flex:1, padding: 32, overflow:'auto', background:'var(--bg-app)' }}>
        <div style={{ maxWidth: 980, display:'grid', gridTemplateColumns:'1.2fr 1fr', gap: 16 }}>
          {/* Brief */}
          <div className="card" style={{ gridColumn:'1 / -1' }}>
            <div className="t-h2" style={{ marginBottom: 16 }}>Описание задачи для стажёра</div>
            <label className="input-label">Заголовок</label>
            <input className="input" defaultValue="Создать заказ" style={{ marginBottom: 12 }}/>
            <label className="input-label">Текст условия</label>
            <textarea defaultValue="API сервис принимает заказы пользователей. Ваша задача — отправить корректный запрос на создание заказа и убедиться, что ответ соответствует ожидаемому." style={{
              width:'100%', minHeight: 80, border:'1.5px solid var(--c-g96)', borderRadius: 8, padding: 12,
              fontFamily:'var(--font)', fontSize: 14, lineHeight: 1.5, outline:'none', resize:'vertical'
            }}/>
          </div>

          {/* Expected request */}
          <div className="card">
            <div className="t-h2" style={{ marginBottom: 12 }}>Ожидаемый запрос</div>
            <div style={{ display:'flex', gap: 8, marginBottom: 12 }}>
              <select defaultValue="POST" style={{ padding:'8px 12px', border:'1.5px solid var(--c-g96)', borderRadius: 8, fontFamily:'var(--font)', fontWeight: 600, color:'var(--c-green)' }}>
                <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
              </select>
              <input className="input" defaultValue="/v1/orders" style={{ flex:1, fontFamily:'monospace' }}/>
            </div>
            <label className="input-label">Body (JSON-схема)</label>
            <pre style={{ margin: 0, padding: 12, background:'#FAFBFD', borderRadius: 8, fontFamily:'monospace', fontSize: 12, lineHeight: 1.5, border:'1px solid var(--bg-divider)' }}>
{`{
  "user_id": <number>,
  "items": [{ "sku": <string>, "qty": <number> }],
  "shipping": "courier" | "pickup"
}`}
            </pre>
          </div>

          {/* Expected response */}
          <div className="card">
            <div className="t-h2" style={{ marginBottom: 12 }}>Ожидаемый ответ</div>
            <div style={{ display:'flex', gap: 8, marginBottom: 12 }}>
              <input className="input" defaultValue="201" style={{ width: 80, textAlign:'center', fontWeight: 600, color:'var(--c-green)' }}/>
              <input className="input" defaultValue="Created" style={{ flex:1 }}/>
            </div>
            <label className="input-label">Обязательные поля в ответе</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
              {['id', 'status', 'total', 'created_at'].map(f => (
                <span key={f} className="chip chip-blue">{f}<Icon name="x" size={10}/></span>
              ))}
              <span className="chip chip-grey"><Icon name="plus" size={10}/>добавить</span>
            </div>

            <div className="divider" style={{ margin:'20px 0' }}/>
            <div className="t-h2" style={{ marginBottom: 12 }}>Оценка</div>
            <div style={{ display:'flex', gap: 8 }}>
              <div style={{ flex:1, padding:'10px 12px', borderRadius: 8, background:'var(--c-blue-08)', border:'1.5px solid var(--c-blue)', textAlign:'center', fontSize: 13, fontWeight: 500, color:'var(--c-blue)' }}>Авто</div>
              <div style={{ flex:1, padding:'10px 12px', borderRadius: 8, background:'#fff', border:'1.5px solid var(--c-g96)', textAlign:'center', fontSize: 13, fontWeight: 500, color:'var(--c-g48)' }}>Ручная</div>
            </div>
          </div>

          {/* Mock response */}
          <div className="card" style={{ gridColumn:'1 / -1' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
              <div className="t-h2">Mock-ответ сервера</div>
              <span className="chip chip-grey">отдаётся в ответ на верный запрос</span>
            </div>
            <pre style={{ margin: 0, padding: 14, background:'#FAFBFD', borderRadius: 8, fontFamily:'monospace', fontSize: 12, lineHeight: 1.6, border:'1px solid var(--bg-divider)' }}>
{`{
  "id": "ord_8a2f1c",
  "status": "pending",
  "total": 14860,
  "created_at": "2026-04-27T10:14:22Z"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  </div>
);

window.InternApiTesting = InternApiTesting;
window.AdminApiTask = AdminApiTask;
