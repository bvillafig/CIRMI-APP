import { useState, useEffect } from "react";

// ─── SUPABASE ────────────────────────────────────────────────────
const SUPABASE_URL = "https://itcarcntzopvchxoeyzv.supabase.co";
const SUPABASE_KEY = "sb_publishable_sp21Q5eB6VqFrSgGjz28jQ_LMVoSmCk";
const API = (t) => `${SUPABASE_URL}/rest/v1/${t}`;
const H = {
  "Content-Type":"application/json",
  "apikey":SUPABASE_KEY,
  "Authorization":`Bearer ${SUPABASE_KEY}`,
  "Prefer":"return=representation",
};
const dbGet    = async (t,q="")  => { const r=await fetch(`${API(t)}?${q}`,{headers:H}); if(!r.ok)throw new Error(await r.text()); return r.json(); };
const dbInsert = async (t,d)     => { const r=await fetch(API(t),{method:"POST",headers:H,body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); return r.json(); };
const dbUpdate = async (t,id,d)  => { const r=await fetch(`${API(t)}?id=eq.${id}`,{method:"PATCH",headers:H,body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); return r.json(); };
const dbDelete = async (t,id)    => { const r=await fetch(`${API(t)}?id=eq.${id}`,{method:"DELETE",headers:H}); if(!r.ok)throw new Error(await r.text()); };

// ─── BRAND ───────────────────────────────────────────────────────
const B = {
  slate:"#4A6079", slateDark:"#2E3F52", slateLight:"#6B8299",
  gold:"#F5C842", goldLight:"#FDF3C0", goldDark:"#D4A820",
  bg:"#F2F5F8", white:"#FFFFFF", text:"#1C2B3A",
  muted:"#7A90A4", border:"#DDE4EB",
};
const ACCENT_COLORS = [B.slate, B.slateDark, B.slateLight, "#3D6B8C", "#6B4F9A", "#2E7D52"];
const ROLES = ["Cirujano Principal","Cirujano Residente","Enf. Instrumentista","Anestesista","Otro"];
const COLORES = ["#4A6079","#2E3F52","#6B8299","#D4A820","#8B6914","#3D6B8C","#6B4F9A","#2E7D52","#B91C1C","#1D6FA4"];
const ESTADOS_CIRUGIA = ["Confirmada","Pendiente","Realizada","Cancelada"];
const ESTADOS_FACTURA = ["Pendiente","Facturada","En revisión","Cobrada"];
const DIAS_HEADER = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const today = new Date();
const fmtDate = (d) => { const x=new Date(d); x.setHours(12); return x.toISOString().split("T")[0]; };
const todayStr = fmtDate(today);
const newId = () => `CIR-${Date.now().toString().slice(-6)}`;

const colorEstado = (e) => ({"Confirmada":"#2E7D52","Pendiente":"#9A6B00","Realizada":B.slate,"Cancelada":"#B91C1C"}[e]||B.muted);
const bgEstado   = (e) => ({"Confirmada":"#E6F4EC","Pendiente":B.goldLight,"Realizada":"#E8EDF2","Cancelada":"#FEE2E2"}[e]||"#F1F5F9");
const colorFact  = (e) => ({"Pendiente":"#9A6B00","Facturada":B.slate,"En revisión":"#B91C1C","Cobrada":"#2E7D52"}[e]||B.muted);
const bgFact     = (e) => ({"Pendiente":B.goldLight,"Facturada":"#E8EDF2","En revisión":"#FEE2E2","Cobrada":"#E6F4EC"}[e]||"#F1F5F9");

// ─── MINI COMPONENTS ─────────────────────────────────────────────
const Badge = ({label,bg,color}) => (
  <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,background:bg,color,whiteSpace:"nowrap"}}>{label}</span>
);
const ColH = ({children}) => <div style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.5}}>{children}</div>;
const FG = ({label,children,style={}}) => (
  <div style={style}>
    <label style={{display:"block",fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:6}}>{label}</label>
    {children}
  </div>
);
const Spin = () => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"80px 0",gap:16}}>
    <div style={{width:36,height:36,border:`3px solid ${B.border}`,borderTopColor:B.slate,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <div style={{color:B.muted,fontSize:14}}>Cargando CIRMI...</div>
  </div>
);

// ─── CALENDARIO MENSUAL (compartido para Agenda y Guardias) ──────
function CalendarioMensual({ year, month, renderDay, onPrevMonth, onNextMonth, onToday }) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month+1, 0);
  // día de la semana del primer día (lunes=0)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells = [];
  for (let i=0; i<startDow; i++) cells.push(null);
  for (let d=1; d<=lastDay.getDate(); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="card" style={{marginBottom:24,overflow:"hidden"}}>
      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${B.border}`}}>
        <div style={{fontWeight:700,fontSize:16,color:B.slateDark}}>{MESES_ES[month]} {year}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onPrevMonth} className="btn-sec" style={{padding:"6px 12px",fontSize:13}}>← Anterior</button>
          <button onClick={onToday}     className="btn-sec" style={{padding:"6px 12px",fontSize:13}}>Hoy</button>
          <button onClick={onNextMonth} className="btn-sec" style={{padding:"6px 12px",fontSize:13}}>Siguiente →</button>
        </div>
      </div>
      {/* Headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:B.bg,borderBottom:`1px solid ${B.border}`}}>
        {DIAS_HEADER.map(d=>(
          <div key={d} style={{textAlign:"center",padding:"8px 0",fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.5}}>{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
        {cells.map((day,i)=>{
          if (!day) return <div key={`empty-${i}`} style={{minHeight:90,background:"#FAFBFC",borderRight:i%7<6?`1px solid ${B.border}`:"none",borderBottom:`1px solid ${B.border}`}}/>;
          const dateStr = fmtDate(new Date(year,month,day));
          const isToday = dateStr === todayStr;
          const isWeekend = (i%7)>=5;
          return renderDay({day, dateStr, isToday, isWeekend, col:i%7});
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab]             = useState("agenda");
  const [cirugias, setCirugias]   = useState([]);
  const [personal, setPersonal]   = useState([]);
  const [hospitales, setHospitales] = useState([]);
  const [guardias, setGuardias]   = useState([]);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({});
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calYear, setCalYear]     = useState(today.getFullYear());
  const [calMonth, setCalMonth]   = useState(today.getMonth());
  const [guardYear, setGuardYear] = useState(today.getFullYear());
  const [guardMonth, setGuardMonth] = useState(today.getMonth());
  const [filtroFactura, setFiltroFactura] = useState("Todos");
  const [filtroCirujano, setFiltroCirujano] = useState("Todos");
  const [filtroClinica, setFiltroClinica] = useState("Todos");
  const [configTab, setConfigTab] = useState("personal");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [guardHosp, setGuardHosp] = useState(null); // hospital seleccionado en guardias

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c,p,h,g] = await Promise.all([
        dbGet("cirugias","order=fecha.asc,inicio.asc"),
        dbGet("personal","order=nombre.asc&activo=eq.true"),
        dbGet("hospitales","order=nombre.asc&activo=eq.true"),
        dbGet("guardias","order=fecha.asc"),
      ]);
      setCirugias(c); setPersonal(p); setHospitales(h); setGuardias(g);
      if (h.length>0 && !guardHosp) setGuardHosp(h[0].nombre);
    } catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };
  useEffect(()=>{ loadAll(); },[]);

  const hospNames = hospitales.map(h=>h.nombre);

  // ── Nav meses ──
  const prevMonth = (y,m,setY,setM) => { if(m===0){setY(y-1);setM(11);}else setM(m-1); };
  const nextMonth = (y,m,setY,setM) => { if(m===11){setY(y+1);setM(0);}else setM(m+1); };

  // ── Cirugías CRUD ──
  const openNewCirugia = (fecha=selectedDate) => {
    setForm({id:newId(),fecha,hospital:hospNames[0]||"",quirofano:"Q-1",tipo:"",cirujano:personal[0]?.nombre||"",ayudante:"",enfermera:"",inicio:"08:00",fin:"10:00",estado:"Confirmada",factura:"Pendiente",paciente:"",obs:""});
    setModal("cx_nueva");
  };
  const saveCirugia = async () => {
    setSaving(true);
    try{
      if(modal==="cx_nueva") await dbInsert("cirugias",form);
      else{ const{id,...d}=form; await dbUpdate("cirugias",id,d); }
      await loadAll(); setModal(null);
    }catch(e){ alert("Error al guardar."); }
    finally{ setSaving(false); }
  };
  const deleteCirugia = async (id) => {
    if(!window.confirm("¿Eliminar esta intervención?")) return;
    setSaving(true);
    try{ await dbDelete("cirugias",id); await loadAll(); setModal(null); }
    catch(e){ alert("Error al eliminar."); }
    finally{ setSaving(false); }
  };
  const updateFactura = async (id,value) => {
    try{ await dbUpdate("cirugias",id,{factura:value}); setCirugias(p=>p.map(c=>c.id===id?{...c,factura:value}:c)); }
    catch(e){ alert("Error."); }
  };

  // ── Guardias CRUD ──
  const openGuardia = (fecha, hospital) => {
    const exist = guardias.find(g=>g.fecha===fecha&&g.hospital===hospital);
    if(exist) setForm({...exist});
    else setForm({fecha, hospital, cirujano_principal:"", cirujano_ayudante:"", notas:""});
    setModal("guardia_edit");
  };
  const saveGuardia = async () => {
    setSaving(true);
    try{
      if(form.id){ const{id,...d}=form; await dbUpdate("guardias",id,d); }
      else await dbInsert("guardias",form);
      await loadAll(); setModal(null);
    }catch(e){ alert("Error al guardar guardia."); }
    finally{ setSaving(false); }
  };
  const deleteGuardia = async (id) => {
    if(!window.confirm("¿Eliminar esta guardia?")) return;
    try{ await dbDelete("guardias",id); await loadAll(); setModal(null); }
    catch(e){ alert("Error al eliminar."); }
  };

  // ── Personal CRUD ──
  const openNewPersonal = () => { setForm({nombre:"",rol:"Cirujano Residente",hospitales:[],tel:"",color:COLORES[0],activo:true}); setModal("p_nuevo"); };
  const savePersonal = async () => {
    if(!form.nombre?.trim()){ alert("El nombre es obligatorio."); return; }
    setSaving(true);
    try{
      if(modal==="p_nuevo") await dbInsert("personal",form);
      else{ const{id,...d}=form; await dbUpdate("personal",id,d); }
      await loadAll(); setModal(null);
    }catch(e){ alert("Error al guardar personal."); }
    finally{ setSaving(false); }
  };
  const deletePersonal = async (id) => {
    if(!window.confirm("¿Eliminar?")) return;
    try{ await dbUpdate("personal",id,{activo:false}); await loadAll(); setModal(null); }
    catch(e){ alert("Error."); }
  };
  const toggleHosp = (h) => {
    const arr=form.hospitales||[];
    setForm({...form,hospitales:arr.includes(h)?arr.filter(x=>x!==h):[...arr,h]});
  };

  // ── Hospitales CRUD ──
  const openNewHosp = () => { setForm({nombre:"",direccion:"",activo:true}); setModal("h_nuevo"); };
  const saveHosp = async () => {
    if(!form.nombre?.trim()){ alert("El nombre es obligatorio."); return; }
    setSaving(true);
    try{
      if(modal==="h_nuevo") await dbInsert("hospitales",form);
      else{ const{id,...d}=form; await dbUpdate("hospitales",id,d); }
      await loadAll(); setModal(null);
    }catch(e){ alert("Error."); }
    finally{ setSaving(false); }
  };
  const deleteHosp = async (id) => {
    if(!window.confirm("¿Eliminar?")) return;
    try{ await dbUpdate("hospitales",id,{activo:false}); await loadAll(); setModal(null); }
    catch(e){ alert("Error."); }
  };

  // ── Stats ──
  const pendFactura = cirugias.filter(c=>c.factura==="Pendiente").length;
  const hoyCount = cirugias.filter(c=>c.fecha===todayStr).length;
  const mesCount = cirugias.filter(c=>{ const d=new Date(c.fecha); return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear(); }).length;

  // ── Cirugías del día seleccionado ──
  const cirugiasDia = cirugias.filter(c=>c.fecha===selectedDate);

  // ── Programación filtrada ──
  const cirugiasProg = cirugias.filter(c=>
    (filtroCirujano==="Todos"||c.cirujano===filtroCirujano||c.ayudante===filtroCirujano) &&
    (filtroClinica==="Todos"||c.hospital===filtroClinica)
  ).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.inicio.localeCompare(b.inicio));

  // ── CSS ──
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    button{cursor:pointer;font-family:inherit}
    input,select,textarea{font-family:inherit}
    .card{background:white;border-radius:14px;box-shadow:0 1px 4px rgba(46,63,82,.08),0 4px 16px rgba(46,63,82,.04)}
    .btn-gold{background:${B.gold};color:${B.slateDark};border:none;padding:10px 20px;border-radius:9px;font-size:14px;font-weight:700;transition:all .15s}
    .btn-gold:hover{background:${B.goldDark};transform:translateY(-1px);box-shadow:0 4px 12px rgba(245,200,66,.4)}
    .btn-gold:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .btn-sec{background:white;color:${B.slate};border:1.5px solid ${B.border};padding:9px 18px;border-radius:9px;font-size:14px;font-weight:500;transition:all .15s;cursor:pointer}
    .btn-sec:hover{border-color:${B.slateLight};background:#F8FAFB}
    .btn-danger{background:#FEF2F2;color:#DC2626;border:1.5px solid #FECACA;padding:9px 18px;border-radius:9px;font-size:14px;font-weight:500;cursor:pointer}
    .btn-danger:hover{background:#FEE2E2}
    .tab-btn{padding:9px 16px;border:none;background:none;font-size:13px;font-weight:500;color:rgba(255,255,255,.6);border-radius:8px;transition:all .15s;cursor:pointer}
    .tab-btn.active{background:${B.gold};color:${B.slateDark};font-weight:700}
    .tab-btn:hover:not(.active){background:rgba(255,255,255,.1);color:white}
    .inp{width:100%;padding:9px 12px;border:1.5px solid ${B.border};border-radius:8px;font-size:14px;outline:none;transition:border .15s;color:${B.text};background:white}
    .inp:focus{border-color:${B.slate}}
    .row-card{background:white;border:1.5px solid ${B.border};border-radius:11px;padding:13px 16px;margin-bottom:8px;cursor:pointer;transition:all .15s}
    .row-card:hover{border-color:${B.slateLight};box-shadow:0 3px 12px rgba(46,63,82,.1);transform:translateY(-1px)}
    .overlay{position:fixed;inset:0;background:rgba(30,43,58,.5);backdrop-filter:blur(6px);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
    .modal{background:white;border-radius:18px;padding:32px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 30px 80px rgba(30,43,58,.25)}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .stat-card{background:white;border-radius:14px;padding:20px 22px;box-shadow:0 1px 3px rgba(46,63,82,.06)}
    .config-item{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:white;border:1.5px solid ${B.border};border-radius:11px;margin-bottom:8px;transition:all .15s}
    .config-item:hover{border-color:${B.slateLight}}
    .subtab{padding:8px 16px;border:none;background:none;font-size:13px;font-weight:500;color:${B.muted};cursor:pointer;transition:all .15s;border-bottom:2px solid transparent}
    .subtab.active{color:${B.slate};font-weight:700;border-bottom-color:${B.slate}}
    .avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;flex-shrink:0}
    .cal-day{min-height:90px;border-right:1px solid ${B.border};border-bottom:1px solid ${B.border};padding:8px;cursor:pointer;transition:background .1s;position:relative;}
    .cal-day:hover{background:#F0F4F8}
    .cal-day.selected{background:${B.slateDark}}
    .cal-day.weekend{background:#FAFBFC}
    .cal-day.weekend:hover{background:#EEF1F5}
    .guard-day{min-height:80px;border-right:1px solid ${B.border};border-bottom:1px solid ${B.border};padding:6px;cursor:pointer;transition:background .1s;}
    .guard-day:hover{background:#F5F8FC}
    .guard-day.today-cell{background:${B.goldLight}}
    @keyframes spin{to{transform:rotate(360deg)}}
  `;

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:B.bg,minHeight:"100vh",color:B.text}}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={{background:B.slateDark,padding:"0 24px",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 16px rgba(20,30,42,.35)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <svg width="90" height="26" viewBox="0 0 90 26">
              <text x="0" y="21" fontFamily="Georgia,serif" fontSize="24" fontWeight="700" fill={B.white} letterSpacing="1">CIRMI</text>
              <line x1="5" y1="2" x2="15" y2="24" stroke={B.gold} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{width:1,height:18,background:"rgba(255,255,255,.15)"}}/>
            <span style={{color:"rgba(255,255,255,.4)",fontSize:11}}>Gestión Quirúrgica</span>
          </div>
          <div style={{display:"flex",gap:2}}>
            {[["agenda","📅 Agenda"],["programacion","👨‍⚕️ Programación"],["guardias","🛡️ Guardias"],["hospitales","🏨 Hospitales"],["personal","👥 Personal"],["facturacion","💰 Facturación"],["config","⚙️ Config"]].map(([id,label])=>(
              <button key={id} className={`tab-btn ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {pendFactura>0&&(
              <div onClick={()=>{setTab("facturacion");setFiltroFactura("Pendiente");}}
                style={{background:B.goldLight,color:B.goldDark,borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",border:`1px solid ${B.gold}`}}>
                ⚠ {pendFactura} fact.
              </div>
            )}
            <button className="btn-gold" onClick={()=>openNewCirugia()} style={{padding:"7px 14px",fontSize:13}}>+ Nueva cirugía</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px"}}>

        {/* STATS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {[
            {label:"Cirugías hoy",value:hoyCount,icon:"🔪",accent:B.slate},
            {label:"Este mes",value:mesCount,icon:"📅",accent:B.slateLight},
            {label:"Fact. pendiente",value:pendFactura,icon:"📋",accent:B.goldDark},
            {label:"Total registradas",value:cirugias.length,icon:"📊",accent:B.slateDark},
          ].map(s=>(
            <div key={s.label} className="stat-card" style={{borderLeft:`4px solid ${s.accent}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:28,fontWeight:700,color:s.accent,lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:12,color:B.muted,fontWeight:500,marginTop:4}}>{s.label}</div>
                </div>
                <span style={{fontSize:20}}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {loading ? <Spin/> : (<>

          {/* ══════════ AGENDA ══════════ */}
          {tab==="agenda"&&(
            <div>
              {/* Calendario mensual */}
              <CalendarioMensual
                year={calYear} month={calMonth}
                onPrevMonth={()=>prevMonth(calYear,calMonth,setCalYear,setCalMonth)}
                onNextMonth={()=>nextMonth(calYear,calMonth,setCalYear,setCalMonth)}
                onToday={()=>{setCalYear(today.getFullYear());setCalMonth(today.getMonth());setSelectedDate(todayStr);}}
                renderDay={({day,dateStr,isToday,isWeekend,col})=>{
                  const dayCxs = cirugias.filter(c=>c.fecha===dateStr);
                  const isSelected = dateStr===selectedDate;
                  return (
                    <div key={dateStr}
                      className={`cal-day${isSelected?" selected":""}${!isSelected&&isWeekend?" weekend":""}`}
                      style={{borderRight:col<6?`1px solid ${B.border}`:"none"}}
                      onClick={()=>setSelectedDate(dateStr)}>
                      {/* Número del día */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{
                          width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                          background:isToday&&!isSelected?B.gold:"transparent",
                          color:isSelected?"white":isToday?B.slateDark:isWeekend?B.muted:B.text,
                          fontWeight:isToday||isSelected?700:400,fontSize:13,
                        }}>{day}</div>
                        {dayCxs.length>0&&(
                          <span style={{fontSize:9,fontWeight:700,background:isSelected?"rgba(255,255,255,.2)":B.slateLight,color:isSelected?"white":"white",borderRadius:10,padding:"1px 5px"}}>{dayCxs.length}</span>
                        )}
                      </div>
                      {/* Cirugías */}
                      <div style={{display:"flex",flexDirection:"column",gap:2}}>
                        {dayCxs.slice(0,3).map(c=>(
                          <div key={c.id} style={{
                            background:isSelected?"rgba(255,255,255,.15)":bgEstado(c.estado),
                            color:isSelected?"white":colorEstado(c.estado),
                            borderRadius:4,padding:"2px 5px",fontSize:9,fontWeight:600,
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                          }}>{c.inicio} {c.tipo}</div>
                        ))}
                        {dayCxs.length>3&&<div style={{fontSize:9,color:isSelected?"rgba(255,255,255,.6)":B.muted,paddingLeft:3}}>+{dayCxs.length-3} más</div>}
                      </div>
                      {isSelected&&(
                        <button onClick={e=>{e.stopPropagation();openNewCirugia(dateStr);}}
                          style={{position:"absolute",bottom:4,right:4,background:B.gold,border:"none",borderRadius:5,width:18,height:18,fontSize:12,fontWeight:700,color:B.slateDark,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      )}
                    </div>
                  );
                }}
              />

              {/* Lista del día */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>
                  {selectedDate===todayStr?"Hoy — ":""}{selectedDate}
                  <span style={{fontSize:13,fontWeight:400,color:B.muted,marginLeft:8}}>{cirugiasDia.length} cirugía{cirugiasDia.length!==1?"s":""}</span>
                </h3>
                <button className="btn-gold" onClick={()=>openNewCirugia(selectedDate)} style={{padding:"8px 14px",fontSize:13}}>+ Añadir</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"75px 1fr 1fr 1fr 95px 95px 24px",gap:10,padding:"5px 16px",marginBottom:5}}>
                {["Hora","Intervención","Equipo","Centro","Estado","Factura",""].map(h=><ColH key={h}>{h}</ColH>)}
              </div>
              {cirugiasDia.length===0?(
                <div className="card" style={{padding:40,textAlign:"center",color:B.muted}}>
                  <div style={{fontSize:32,marginBottom:8}}>📋</div>
                  <div style={{fontWeight:600}}>Sin cirugías este día</div>
                  <button className="btn-gold" onClick={()=>openNewCirugia(selectedDate)} style={{marginTop:14}}>+ Añadir cirugía</button>
                </div>
              ):cirugiasDia.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                <div key={c.id} className="row-card"
                  style={{display:"grid",gridTemplateColumns:"75px 1fr 1fr 1fr 95px 95px 24px",gap:10,alignItems:"center"}}
                  onClick={()=>{setForm({...c});setModal("cx_edit");}}>
                  <div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,color:B.slateDark}}>{c.inicio}</div>
                    <div style={{fontSize:10,color:B.muted}}>→ {c.fin}</div>
                  </div>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{c.tipo}</div>
                    <div style={{fontSize:10,color:B.muted,fontFamily:"'DM Mono',monospace"}}>{c.id}</div>
                    {c.obs&&<div style={{fontSize:10,color:B.goldDark}}>⚠ {c.obs}</div>}
                  </div>
                  <div style={{fontSize:12,lineHeight:1.8}}>
                    <div style={{fontWeight:600}}>🔪 {c.cirujano}</div>
                    {c.ayudante&&<div style={{color:B.muted}}>🤝 {c.ayudante}</div>}
                    {c.enfermera&&<div style={{color:B.muted}}>💉 {c.enfermera}</div>}
                  </div>
                  <div style={{fontSize:12}}>
                    <div style={{fontWeight:600}}>{c.hospital}</div>
                    <div style={{color:B.muted}}>{c.quirofano}</div>
                  </div>
                  <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                  <Badge label={c.factura} bg={bgFact(c.factura)} color={colorFact(c.factura)}/>
                  <span style={{color:B.border,fontSize:18}}>›</span>
                </div>
              ))}
            </div>
          )}

          {/* ══════════ PROGRAMACIÓN ══════════ */}
          {tab==="programacion"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
                <div>
                  <h2 style={{fontSize:22,fontWeight:700,color:B.slateDark}}>👨‍⚕️ Programación</h2>
                  <p style={{color:B.muted,fontSize:13,marginTop:3}}>Cirugías por cirujano y clínica</p>
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <select className="inp" style={{width:180}} value={filtroCirujano} onChange={e=>setFiltroCirujano(e.target.value)}>
                    <option value="Todos">Todos los cirujanos</option>
                    {personal.map(p=><option key={p.id}>{p.nombre}</option>)}
                  </select>
                  <select className="inp" style={{width:160}} value={filtroClinica} onChange={e=>setFiltroClinica(e.target.value)}>
                    <option value="Todos">Todas las clínicas</option>
                    {hospNames.map(h=><option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {/* Agrupado por cirujano */}
              {filtroCirujano==="Todos" ? (
                personal.map(p=>{
                  const cxs = cirugiasProg.filter(c=>c.cirujano===p.nombre||c.ayudante===p.nombre);
                  if(cxs.length===0) return null;
                  const proximas = cxs.filter(c=>c.fecha>=todayStr);
                  const pasadas  = cxs.filter(c=>c.fecha<todayStr);
                  return (
                    <div key={p.id} className="card" style={{marginBottom:16,overflow:"hidden"}}>
                      <div style={{background:p.color||B.slate,padding:"14px 20px",display:"flex",alignItems:"center",gap:14}}>
                        <div className="avatar" style={{background:"rgba(255,255,255,.2)",width:40,height:40,fontSize:15}}>
                          {(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{color:"white",fontWeight:700,fontSize:16}}>{p.nombre}</div>
                          <div style={{color:"rgba(255,255,255,.7)",fontSize:13}}>{p.rol}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{color:"white",fontWeight:700,fontSize:22}}>{proximas.length}</div>
                          <div style={{color:"rgba(255,255,255,.7)",fontSize:11}}>próximas</div>
                        </div>
                      </div>
                      <div style={{padding:"0 4px 4px"}}>
                        {proximas.length===0?(
                          <div style={{padding:"20px",textAlign:"center",color:B.muted,fontSize:13}}>Sin cirugías próximas programadas</div>
                        ):proximas.map(c=>(
                          <div key={c.id} onClick={()=>{setForm({...c});setModal("cx_edit");}}
                            style={{display:"grid",gridTemplateColumns:"100px 1fr 130px 90px 90px",gap:12,padding:"12px 16px",borderBottom:`1px solid ${B.border}`,cursor:"pointer",transition:"background .1s",alignItems:"center"}}
                            onMouseEnter={e=>e.currentTarget.style.background=B.bg}
                            onMouseLeave={e=>e.currentTarget.style.background="white"}>
                            <div>
                              <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:B.slate}}>{c.fecha}</div>
                              <div style={{fontSize:11,color:B.muted}}>{c.inicio} – {c.fin}</div>
                            </div>
                            <div>
                              <div style={{fontWeight:600,fontSize:13}}>{c.tipo}</div>
                              {c.ayudante&&c.cirujano===p.nombre&&<div style={{fontSize:11,color:B.muted}}>🤝 {c.ayudante}</div>}
                              {c.cirujano!==p.nombre&&<div style={{fontSize:11,color:B.goldDark}}>Como ayudante de {c.cirujano}</div>}
                            </div>
                            <div style={{fontSize:12}}>
                              <div style={{fontWeight:600}}>{c.hospital}</div>
                              <div style={{color:B.muted}}>{c.quirofano}</div>
                            </div>
                            <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                            <Badge label={c.factura} bg={bgFact(c.factura)} color={colorFact(c.factura)}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ):(
                // Vista filtrada por cirujano específico
                <div className="card" style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 20px",background:B.bg,borderBottom:`1px solid ${B.border}`,display:"grid",gridTemplateColumns:"100px 1fr 130px 90px 90px",gap:12}}>
                    {["Fecha","Intervención","Clínica","Estado","Factura"].map(h=><ColH key={h}>{h}</ColH>)}
                  </div>
                  {cirugiasProg.length===0?(
                    <div style={{padding:40,textAlign:"center",color:B.muted}}>Sin resultados para los filtros seleccionados</div>
                  ):cirugiasProg.map((c,i)=>(
                    <div key={c.id}
                      style={{display:"grid",gridTemplateColumns:"100px 1fr 130px 90px 90px",gap:12,padding:"12px 20px",borderBottom:`1px solid ${B.border}`,cursor:"pointer",alignItems:"center",background:i%2===0?"white":"#FAFBFC",transition:"background .1s"}}
                      onClick={()=>{setForm({...c});setModal("cx_edit");}}
                      onMouseEnter={e=>e.currentTarget.style.background=B.bg}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"white":"#FAFBFC"}>
                      <div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600}}>{c.fecha}</div>
                        <div style={{fontSize:11,color:B.muted}}>{c.inicio}–{c.fin}</div>
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>{c.tipo}</div>
                        <div style={{fontSize:11,color:B.muted}}>🔪 {c.cirujano}{c.ayudante&&` · 🤝 ${c.ayudante}`}</div>
                      </div>
                      <div style={{fontSize:12}}>
                        <div style={{fontWeight:600}}>{c.hospital}</div>
                        <div style={{color:B.muted}}>{c.quirofano}</div>
                      </div>
                      <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                      <Badge label={c.factura} bg={bgFact(c.factura)} color={colorFact(c.factura)}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ GUARDIAS ══════════ */}
          {tab==="guardias"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
                <div>
                  <h2 style={{fontSize:22,fontWeight:700,color:B.slateDark}}>🛡️ Guardias</h2>
                  <p style={{color:B.muted,fontSize:13,marginTop:3}}>Asignación mensual de guardias por clínica</p>
                </div>
                {/* Selector de clínica */}
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {hospNames.map((h,i)=>(
                    <button key={h} onClick={()=>setGuardHosp(h)}
                      style={{padding:"8px 16px",borderRadius:9,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s",
                        background:guardHosp===h?ACCENT_COLORS[i%ACCENT_COLORS.length]:"white",
                        color:guardHosp===h?"white":B.slate,
                        borderColor:guardHosp===h?ACCENT_COLORS[i%ACCENT_COLORS.length]:B.border}}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leyenda */}
              <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:B.muted}}>
                  <div style={{width:12,height:12,borderRadius:3,background:B.goldLight,border:`1px solid ${B.gold}`}}/> Hoy
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:B.muted}}>
                  <div style={{width:12,height:12,borderRadius:3,background:"#E6F4EC",border:"1px solid #2E7D52"}}/> Guardia asignada
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:B.muted}}>
                  <div style={{width:12,height:12,borderRadius:3,background:B.bg,border:`1px solid ${B.border}`}}/> Sin asignar (clic para añadir)
                </div>
              </div>

              <CalendarioMensual
                year={guardYear} month={guardMonth}
                onPrevMonth={()=>prevMonth(guardYear,guardMonth,setGuardYear,setGuardMonth)}
                onNextMonth={()=>nextMonth(guardYear,guardMonth,setGuardYear,setGuardMonth)}
                onToday={()=>{setGuardYear(today.getFullYear());setGuardMonth(today.getMonth());}}
                renderDay={({day,dateStr,isToday,isWeekend,col})=>{
                  const guardia = guardias.find(g=>g.fecha===dateStr&&g.hospital===guardHosp);
                  const hasGuardia = !!guardia;
                  return (
                    <div key={dateStr}
                      className={`guard-day${isToday?" today-cell":""}`}
                      style={{
                        borderRight:col<6?`1px solid ${B.border}`:"none",
                        background:isToday?B.goldLight:hasGuardia?"#E6F4EC":isWeekend?"#FAFBFC":"white",
                      }}
                      onClick={()=>openGuardia(dateStr, guardHosp||hospNames[0])}>
                      {/* Número */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                        <div style={{
                          width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                          background:isToday?B.gold:"transparent",
                          color:isToday?B.slateDark:isWeekend?B.muted:B.text,
                          fontWeight:isToday?700:400,fontSize:12,
                        }}>{day}</div>
                        {hasGuardia&&<div style={{width:8,height:8,borderRadius:"50%",background:"#2E7D52",marginTop:4}}/>}
                      </div>
                      {/* Guardia info */}
                      {hasGuardia?(
                        <div style={{fontSize:9,lineHeight:1.5}}>
                          {guardia.cirujano_principal&&(
                            <div style={{fontWeight:700,color:"#2E7D52",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              🔪 {guardia.cirujano_principal.split(" ").slice(-1)[0]}
                            </div>
                          )}
                          {guardia.cirujano_ayudante&&(
                            <div style={{color:B.slate,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              🤝 {guardia.cirujano_ayudante.split(" ").slice(-1)[0]}
                            </div>
                          )}
                          {guardia.notas&&(
                            <div style={{color:B.muted,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {guardia.notas}
                            </div>
                          )}
                        </div>
                      ):(
                        <div style={{fontSize:9,color:B.border,textAlign:"center",paddingTop:4}}>+ asignar</div>
                      )}
                    </div>
                  );
                }}
              />
            </div>
          )}

          {/* ══════════ HOSPITALES ══════════ */}
          {tab==="hospitales"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div>
                  <h2 style={{fontSize:22,fontWeight:700,color:B.slateDark}}>Vista por Hospital</h2>
                  <p style={{color:B.muted,fontSize:13,marginTop:3}}>Selecciona un día en la agenda para ver la situación</p>
                </div>
                <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="inp" style={{width:165}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(hospitales.length,3)},1fr)`,gap:16}}>
                {hospitales.map((h,idx)=>{
                  const cxs=cirugias.filter(c=>c.hospital===h.nombre&&c.fecha===selectedDate);
                  const accent=ACCENT_COLORS[idx%ACCENT_COLORS.length];
                  return(
                    <div key={h.id} style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(46,63,82,.07)"}}>
                      <div style={{background:accent,padding:"18px 20px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{color:"white",fontWeight:700,fontSize:16}}>{h.nombre}</div>
                            {h.direccion&&<div style={{color:"rgba(255,255,255,.6)",fontSize:12,marginTop:1}}>{h.direccion}</div>}
                            <div style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:2}}>{cxs.length} cirugía{cxs.length!==1?"s":""}</div>
                          </div>
                          <div style={{background:B.gold,borderRadius:10,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:B.slateDark}}>{cxs.length}</div>
                        </div>
                      </div>
                      <div style={{padding:"14px 16px"}}>
                        {cxs.length===0?(
                          <div style={{color:B.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Sin intervenciones este día</div>
                        ):cxs.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                          <div key={c.id} onClick={()=>{setForm({...c});setModal("cx_edit");}}
                            style={{padding:"10px 12px",borderRadius:9,border:`1.5px solid ${B.border}`,marginBottom:7,cursor:"pointer",transition:"all .15s"}}
                            onMouseEnter={e=>e.currentTarget.style.borderColor=accent}
                            onMouseLeave={e=>e.currentTarget.style.borderColor=B.border}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:accent}}>{c.inicio}–{c.fin}</span>
                              <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                            </div>
                            <div style={{fontWeight:600,fontSize:13}}>{c.tipo}</div>
                            <div style={{fontSize:11,color:B.muted,marginTop:2}}>{c.quirofano} · {c.cirujano}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{padding:"0 16px 16px",borderTop:`1px solid ${B.border}`,paddingTop:12}}>
                        <ColH>Personal asignado</ColH>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
                          {personal.filter(p=>(p.hospitales||[]).includes(h.nombre)).map(p=>(
                            <div key={p.id} style={{display:"flex",alignItems:"center",gap:5,background:B.bg,borderRadius:20,padding:"3px 8px 3px 4px",border:`1px solid ${B.border}`}}>
                              <div className="avatar" style={{background:p.color||B.slate,width:20,height:20,fontSize:8}}>{(p.nombre||"?")[0]}</div>
                              <span style={{fontSize:11,fontWeight:500}}>{p.nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════ PERSONAL ══════════ */}
          {tab==="personal"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <h2 style={{fontSize:22,fontWeight:700,color:B.slateDark}}>Gestión de Personal</h2>
                  <p style={{color:B.muted,fontSize:13,marginTop:3}}>Carga de trabajo del equipo</p>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
                {personal.map(p=>{
                  const cxs=cirugias.filter(c=>[c.cirujano,c.ayudante,c.enfermera].includes(p.nombre));
                  const proximas=cxs.filter(c=>c.fecha>=todayStr).sort((a,b)=>a.fecha.localeCompare(b.fecha));
                  return(
                    <div key={p.id} className="card" style={{padding:20,borderLeft:`4px solid ${p.color||B.slate}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                        <div className="avatar" style={{background:p.color||B.slate,width:46,height:46,fontSize:16}}>
                          {(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:15}}>{p.nombre}</div>
                          <div style={{fontSize:12,color:B.muted}}>{p.rol}</div>
                          {p.tel&&<div style={{fontSize:11,color:B.muted,marginTop:1}}>📞 {p.tel}</div>}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                          <div style={{fontSize:24,fontWeight:700,color:p.color||B.slate}}>{cxs.length}</div>
                          <button className="btn-sec" style={{padding:"4px 10px",fontSize:11}} onClick={()=>{setForm({...p});setModal("p_edit");}}>✏️ Editar</button>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                        {(p.hospitales||[]).map(h=>(
                          <span key={h} style={{background:B.bg,color:B.slate,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,border:`1px solid ${B.border}`}}>{h}</span>
                        ))}
                      </div>
                      {proximas.length>0?(
                        <div>
                          <ColH>Próximas intervenciones</ColH>
                          <div style={{marginTop:7}}>
                            {proximas.slice(0,3).map(c=>(
                              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${B.border}`}}>
                                <div>
                                  <div style={{fontSize:12,fontWeight:600}}>{c.tipo}</div>
                                  <div style={{fontSize:11,color:B.muted}}>{c.fecha} · {c.hospital}</div>
                                </div>
                                <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                              </div>
                            ))}
                          </div>
                        </div>
                      ):(
                        <div style={{color:B.muted,fontSize:12,fontStyle:"italic"}}>Sin intervenciones próximas</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════ FACTURACIÓN ══════════ */}
          {tab==="facturacion"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
                <div>
                  <h2 style={{fontSize:22,fontWeight:700,color:B.slateDark}}>Facturación</h2>
                  <p style={{color:B.muted,fontSize:13,marginTop:3}}>Seguimiento de cobros</p>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["Todos","Pendiente","Facturada","En revisión","Cobrada"].map(f=>(
                    <button key={f} onClick={()=>setFiltroFactura(f)}
                      style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid",fontSize:12,fontWeight:500,cursor:"pointer",transition:"all .15s",
                        background:filtroFactura===f?B.slateDark:"white",
                        color:filtroFactura===f?"white":B.slate,
                        borderColor:filtroFactura===f?B.slateDark:B.border}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
                {["Pendiente","Facturada","En revisión","Cobrada"].map(estado=>{
                  const n=cirugias.filter(c=>c.factura===estado).length;
                  return(
                    <div key={estado} className="stat-card" style={{borderTop:`3px solid ${colorFact(estado)}`,cursor:"pointer"}} onClick={()=>setFiltroFactura(estado)}>
                      <div style={{fontSize:24,fontWeight:700,color:colorFact(estado)}}>{n}</div>
                      <div style={{fontSize:12,color:B.muted,marginTop:3}}>{estado}</div>
                    </div>
                  );
                })}
              </div>
              <div className="card" style={{overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"85px 95px 1fr 130px 100px 125px 35px",gap:10,padding:"11px 18px",background:B.bg,borderBottom:`1px solid ${B.border}`}}>
                  {["ID","Fecha","Intervención","Hospital","Estado","Factura",""].map(h=><ColH key={h}>{h}</ColH>)}
                </div>
                {cirugias.filter(c=>filtroFactura==="Todos"||c.factura===filtroFactura)
                  .sort((a,b)=>new Date(b.fecha)-new Date(a.fecha))
                  .map((c,i)=>(
                  <div key={c.id}
                    style={{display:"grid",gridTemplateColumns:"85px 95px 1fr 130px 100px 125px 35px",gap:10,padding:"12px 18px",borderBottom:`1px solid ${B.border}`,alignItems:"center",background:i%2===0?"white":"#FAFBFC",cursor:"pointer",transition:"background .1s"}}
                    onClick={()=>{setForm({...c});setModal("cx_edit");}}
                    onMouseEnter={e=>e.currentTarget.style.background=B.bg}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"white":"#FAFBFC"}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,color:B.slate}}>{c.id}</div>
                    <div style={{fontSize:12,color:B.muted}}>{c.fecha}</div>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{c.tipo}</div>
                      <div style={{fontSize:11,color:B.muted}}>{c.cirujano}</div>
                    </div>
                    <div style={{fontSize:12}}>{c.hospital}<br/><span style={{color:B.muted,fontSize:11}}>{c.quirofano}</span></div>
                    <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                    <div onClick={e=>e.stopPropagation()}>
                      <select className="inp" style={{padding:"4px 7px",fontSize:11}} value={c.factura}
                        onChange={e=>updateFactura(c.id,e.target.value)}>
                        {ESTADOS_FACTURA.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <span style={{color:B.border,fontSize:18,textAlign:"center"}}>›</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ CONFIGURACIÓN ══════════ */}
          {tab==="config"&&(
            <div>
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:22,fontWeight:700,color:B.slateDark}}>⚙️ Configuración</h2>
                <p style={{color:B.muted,fontSize:13,marginTop:3}}>Gestiona el personal y los hospitales de CIRMI</p>
              </div>
              <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:`2px solid ${B.border}`}}>
                {[["personal","👥 Personal"],["hospitales","🏨 Hospitales"]].map(([id,label])=>(
                  <button key={id} className={`subtab ${configTab===id?"active":""}`} onClick={()=>setConfigTab(id)}>{label}</button>
                ))}
              </div>
              {configTab==="personal"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontSize:14,fontWeight:600,color:B.slateDark}}>{personal.length} profesionales activos</div>
                    <button className="btn-gold" onClick={openNewPersonal}>+ Añadir profesional</button>
                  </div>
                  {personal.map(p=>(
                    <div key={p.id} className="config-item">
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div className="avatar" style={{background:p.color||B.slate,width:42,height:42,fontSize:15}}>
                          {(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}
                        </div>
                        <div>
                          <div style={{fontWeight:700,fontSize:14}}>{p.nombre}</div>
                          <div style={{fontSize:12,color:B.muted}}>{p.rol}</div>
                          <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                            {(p.hospitales||[]).map(h=>(
                              <span key={h} style={{background:B.bg,color:B.slate,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600,border:`1px solid ${B.border}`}}>{h}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {p.tel&&<span style={{fontSize:12,color:B.muted}}>📞 {p.tel}</span>}
                        <button className="btn-sec" style={{padding:"5px 10px",fontSize:12}} onClick={()=>{setForm({...p});setModal("p_edit");}}>✏️ Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {configTab==="hospitales"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontSize:14,fontWeight:600,color:B.slateDark}}>{hospitales.length} hospitales activos</div>
                    <button className="btn-gold" onClick={openNewHosp}>+ Añadir hospital</button>
                  </div>
                  {hospitales.map((h,idx)=>(
                    <div key={h.id} className="config-item">
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:42,height:42,borderRadius:9,background:ACCENT_COLORS[idx%ACCENT_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏥</div>
                        <div>
                          <div style={{fontWeight:700,fontSize:14}}>{h.nombre}</div>
                          {h.direccion&&<div style={{fontSize:12,color:B.muted}}>{h.direccion}</div>}
                          <div style={{fontSize:11,color:B.muted,marginTop:2}}>
                            {personal.filter(p=>(p.hospitales||[]).includes(h.nombre)).length} profesionales asignados
                          </div>
                        </div>
                      </div>
                      <button className="btn-sec" style={{padding:"5px 10px",fontSize:12}} onClick={()=>{setForm({...h});setModal("h_edit");}}>✏️ Editar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>)}
      </div>

      {/* ══════════ MODALES ══════════ */}
      {modal&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal">

            {/* Cirugía */}
            {(modal==="cx_nueva"||modal==="cx_edit")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <div>
                  <h3 style={{fontSize:19,fontWeight:700,color:B.slateDark}}>{modal==="cx_nueva"?"Nueva intervención":"Editar intervención"}</h3>
                  {form.id&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:B.muted,marginTop:1}}>{form.id}</div>}
                </div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:8,width:30,height:30,fontSize:17,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div className="form-grid">
                {[
                  ["Fecha",<input type="date" className="inp" value={form.fecha||""} onChange={e=>setForm({...form,fecha:e.target.value})}/>],
                  ["Hospital",<select className="inp" value={form.hospital||""} onChange={e=>setForm({...form,hospital:e.target.value})}>{hospNames.map(h=><option key={h}>{h}</option>)}</select>],
                  ["Quirófano",<select className="inp" value={form.quirofano||""} onChange={e=>setForm({...form,quirofano:e.target.value})}>{"Q-1,Q-2,Q-3,Q-4".split(",").map(q=><option key={q}>{q}</option>)}</select>],
                  ["Tipo de cirugía",<input className="inp" value={form.tipo||""} onChange={e=>setForm({...form,tipo:e.target.value})} placeholder="Ej: Laparoscopia"/>],
                  ["Hora inicio",<input type="time" className="inp" value={form.inicio||""} onChange={e=>setForm({...form,inicio:e.target.value})}/>],
                  ["Hora fin",<input type="time" className="inp" value={form.fin||""} onChange={e=>setForm({...form,fin:e.target.value})}/>],
                  ["Cirujano principal",<select className="inp" value={form.cirujano||""} onChange={e=>setForm({...form,cirujano:e.target.value})}>{personal.map(p=><option key={p.id}>{p.nombre}</option>)}</select>],
                  ["Ayudante",<select className="inp" value={form.ayudante||""} onChange={e=>setForm({...form,ayudante:e.target.value})}><option value="">— Sin ayudante —</option>{personal.map(p=><option key={p.id}>{p.nombre}</option>)}</select>],
                  ["Enf. instrumentista",<select className="inp" value={form.enfermera||""} onChange={e=>setForm({...form,enfermera:e.target.value})}><option value="">— Sin asignar —</option>{personal.filter(p=>p.rol&&p.rol.includes("Enf")).map(p=><option key={p.id}>{p.nombre}</option>)}</select>],
                  ["Código paciente",<input className="inp" value={form.paciente||""} onChange={e=>setForm({...form,paciente:e.target.value})} placeholder="PAC-2025-XXX"/>],
                  ["Estado",<select className="inp" value={form.estado||""} onChange={e=>setForm({...form,estado:e.target.value})}>{ESTADOS_CIRUGIA.map(s=><option key={s}>{s}</option>)}</select>],
                  ["Factura",<select className="inp" value={form.factura||""} onChange={e=>setForm({...form,factura:e.target.value})}>{ESTADOS_FACTURA.map(s=><option key={s}>{s}</option>)}</select>],
                ].map(([label,field])=><FG key={label} label={label}>{field}</FG>)}
              </div>
              <FG label="Observaciones" style={{marginTop:14}}>
                <textarea className="inp" rows={2} value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} placeholder="Notas, avisos..." style={{resize:"vertical"}}/>
              </FG>
              <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"space-between"}}>
                <div>{modal==="cx_edit"&&<button className="btn-danger" onClick={()=>deleteCirugia(form.id)} disabled={saving}>🗑 Eliminar</button>}</div>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                  <button className="btn-gold" onClick={saveCirugia} disabled={saving}>{saving?"Guardando...":modal==="cx_nueva"?"Crear":"Guardar"}</button>
                </div>
              </div>
            </>)}

            {/* Guardia */}
            {modal==="guardia_edit"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <div>
                  <h3 style={{fontSize:19,fontWeight:700,color:B.slateDark}}>🛡️ Guardia</h3>
                  <div style={{fontSize:13,color:B.muted,marginTop:2}}>{form.fecha} · {form.hospital}</div>
                </div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:8,width:30,height:30,fontSize:17,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <FG label="Cirujano principal">
                  <select className="inp" value={form.cirujano_principal||""} onChange={e=>setForm({...form,cirujano_principal:e.target.value})}>
                    <option value="">— Sin asignar —</option>
                    {personal.map(p=><option key={p.id}>{p.nombre}</option>)}
                  </select>
                </FG>
                <FG label="Cirujano ayudante">
                  <select className="inp" value={form.cirujano_ayudante||""} onChange={e=>setForm({...form,cirujano_ayudante:e.target.value})}>
                    <option value="">— Sin asignar —</option>
                    {personal.map(p=><option key={p.id}>{p.nombre}</option>)}
                  </select>
                </FG>
                <FG label="Notas">
                  <input className="inp" value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Observaciones de la guardia"/>
                </FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"space-between"}}>
                <div>{form.id&&<button className="btn-danger" onClick={()=>deleteGuardia(form.id)}>🗑 Eliminar</button>}</div>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                  <button className="btn-gold" onClick={saveGuardia} disabled={saving}>{saving?"Guardando...":"Guardar guardia"}</button>
                </div>
              </div>
            </>)}

            {/* Personal */}
            {(modal==="p_nuevo"||modal==="p_edit")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <h3 style={{fontSize:19,fontWeight:700,color:B.slateDark}}>{modal==="p_nuevo"?"Nuevo profesional":"Editar profesional"}</h3>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:8,width:30,height:30,fontSize:17,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div className="form-grid">
                <FG label="Nombre completo">
                  <input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Dr. García"/>
                </FG>
                <FG label="Rol">
                  <select className="inp" value={form.rol||""} onChange={e=>setForm({...form,rol:e.target.value})}>
                    {ROLES.map(r=><option key={r}>{r}</option>)}
                  </select>
                </FG>
                <FG label="Teléfono">
                  <input className="inp" value={form.tel||""} onChange={e=>setForm({...form,tel:e.target.value})} placeholder="655 000 000"/>
                </FG>
                <FG label="Color identificador">
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:4}}>
                    {COLORES.map(c=>(
                      <div key={c} onClick={()=>setForm({...form,color:c})}
                        style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?`3px solid ${B.slateDark}`:"3px solid transparent",transition:"all .15s"}}/>
                    ))}
                  </div>
                </FG>
              </div>
              <FG label="Hospitales donde trabaja" style={{marginTop:14}}>
                <div style={{display:"flex",gap:7,marginTop:7,flexWrap:"wrap"}}>
                  {hospitales.map(h=>(
                    <div key={h.id} onClick={()=>toggleHosp(h.nombre)}
                      style={{padding:"7px 14px",borderRadius:8,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s",
                        background:(form.hospitales||[]).includes(h.nombre)?B.slate:"white",
                        color:(form.hospitales||[]).includes(h.nombre)?"white":B.slate,
                        borderColor:(form.hospitales||[]).includes(h.nombre)?B.slate:B.border}}>
                      {h.nombre}
                    </div>
                  ))}
                </div>
              </FG>
              <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"space-between"}}>
                <div>{modal==="p_edit"&&<button className="btn-danger" onClick={()=>deletePersonal(form.id)}>🗑 Eliminar</button>}</div>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                  <button className="btn-gold" onClick={savePersonal} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
                </div>
              </div>
            </>)}

            {/* Hospital */}
            {(modal==="h_nuevo"||modal==="h_edit")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <h3 style={{fontSize:19,fontWeight:700,color:B.slateDark}}>{modal==="h_nuevo"?"Nuevo hospital":"Editar hospital"}</h3>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:8,width:30,height:30,fontSize:17,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <FG label="Nombre del hospital">
                  <input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Hospital Vall d'Hebron"/>
                </FG>
                <FG label="Dirección (opcional)">
                  <input className="inp" value={form.direccion||""} onChange={e=>setForm({...form,direccion:e.target.value})} placeholder="Ej: Pg. de la Vall d'Hebron, 119"/>
                </FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"space-between"}}>
                <div>{modal==="h_edit"&&<button className="btn-danger" onClick={()=>deleteHosp(form.id)}>🗑 Eliminar</button>}</div>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                  <button className="btn-gold" onClick={saveHosp} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
                </div>
              </div>
            </>)}

          </div>
        </div>
      )}
    </div>
  );
}
