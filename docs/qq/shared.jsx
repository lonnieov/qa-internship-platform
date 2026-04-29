// Shared icons + chrome for Coin assessment screens.
// All icons inline SVG, 1.5 stroke, currentColor.

const Icon = ({ name, size = 18, color }) => {
  const s = size, c = color || 'currentColor';
  const props = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return <svg {...props}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case 'users': return <svg {...props}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17" cy="9" r="2.5"/><path d="M22 19c0-2.5-2-4.5-4.5-4.5"/></svg>;
    case 'list': return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case 'gear': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'chart': return <svg {...props}><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>;
    case 'plus': return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'eye': return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off': return <svg {...props}><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 7 10 7a18 18 0 0 1-3.4 4.3"/><path d="M6.6 6.6A18 18 0 0 0 2 13s3.5 7 10 7c1.6 0 3-.3 4.3-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>;
    case 'arrow-left': return <svg {...props}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;
    case 'arrow-right': return <svg {...props}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case 'check': return <svg {...props}><path d="M5 12l5 5 9-11"/></svg>;
    case 'check-circle': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>;
    case 'x': return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'clock': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'mouse': return <svg {...props}><rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/></svg>;
    case 'edit': return <svg {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case 'trash': return <svg {...props}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>;
    case 'copy': return <svg {...props}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>;
    case 'logout': return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>;
    case 'shield': return <svg {...props}><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/></svg>;
    case 'user': return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>;
    case 'flag': return <svg {...props}><path d="M4 21V4M4 4h13l-2 4 2 4H4"/></svg>;
    case 'play': return <svg {...props}><path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/></svg>;
    case 'filter': return <svg {...props}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case 'dot-menu': return <svg {...props}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>;
    case 'mail': return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>;
    case 'lock': return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'refresh': return <svg {...props}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>;
    default: return null;
  }
};

const Logo = ({ size = 'md' }) => {
  const px = size === 'lg' ? 40 : size === 'sm' ? 28 : 32;
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
      <div style={{
        width: px, height: px, borderRadius: 10, background: 'var(--c-blue)',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        color:'#fff', fontWeight:700, fontSize: px*0.5, letterSpacing:'-0.04em'
      }}>C</div>
      <div style={{ display:'flex', flexDirection:'column', lineHeight: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 16, letterSpacing:'-0.02em' }}>Coin</div>
        <div style={{ fontSize: 11, color:'var(--c-g48)', marginTop: 2 }}>Assessment</div>
      </div>
    </div>
  );
};

const Avatar = ({ name, color }) => {
  const palette = ['#0077FF','#AA43C4','#E0A500','#00CC52','#FF8800','#FF4400'];
  const initials = name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  const hash = name.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const bg = color || palette[hash % palette.length];
  return <div className="avatar" style={{ background: bg }}>{initials}</div>;
};

// Sidebar for Admin
const AdminSidebar = ({ active }) => {
  const items = [
    { id:'dashboard', label:'Стажёры', icon:'users' },
    { id:'questions', label:'Вопросы', icon:'list' },
    { id:'settings', label:'Настройки теста', icon:'gear' },
    { id:'results',  label:'Результаты', icon:'chart' },
  ];
  return (
    <aside className="sidebar">
      <div style={{ padding:'4px 8px 24px' }}><Logo /></div>
      <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
        {items.map(it => (
          <div key={it.id} className={`nav-item ${active===it.id?'active':''}`}>
            <Icon name={it.icon} size={18} />
            <span>{it.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop:'auto', borderTop:'1px solid var(--bg-divider)', paddingTop: 12 }}>
        <div className="nav-item" style={{ alignItems:'center' }}>
          <Avatar name="Анна Морозова" />
          <div style={{ display:'flex', flexDirection:'column', flex:1, minWidth:0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color:'var(--c-black)' }}>Анна Морозова</div>
            <div style={{ fontSize: 11, color:'var(--c-g48)' }}>Администратор</div>
          </div>
          <Icon name="logout" size={16} color="var(--c-g48)"/>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ title, subtitle, right }) => (
  <div className="topbar">
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing:'-0.015em' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color:'var(--c-g48)', marginTop: 2 }}>{subtitle}</div>}
    </div>
    <div style={{ display:'flex', alignItems:'center', gap: 12 }}>{right}</div>
  </div>
);

window.Icon = Icon;
window.Logo = Logo;
window.Avatar = Avatar;
window.AdminSidebar = AdminSidebar;
window.Topbar = Topbar;
