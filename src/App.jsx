import { useState, useEffect } from "react";

// ─── SUPABASE ────────────────────────────────────────────────────
const SUPABASE_URL = "https://itcarcntzopvchxoeyzv.supabase.co";
const SUPABASE_KEY = "sb_publishable_sp21Q5eB6VqFrSgGjz28jQ_LMVoSmCk";
const API = (table) => `${SUPABASE_URL}/rest/v1/${table}`;
const H = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=representation",
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

const ROLES = ["Cirujano Principal","Cirujano Residente","Enf. Instrumentista","Anestesista","Otro"];
const COLORES = ["#4A6079","#2E3F52","#6B8299","#D4A820","#8B6914","#3D6B8C","#6B4F9A","#2E7D52","#B91C1C","#1D6FA4"];
const ESTADOS_CIRUGIA = ["Confirmada","Pendiente","Realizada","Cancelada"];
const ESTADOS_FACTURA = ["Pendiente","Facturada","En revisión","Cobrada"];
const DIAS_CORTO = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

const today = new Date();
const fmt = (d) => { const dd=new Date(d); dd.setHours(12); return dd.toISOString().split("T")[0]; };
const fmtToday = () => fmt(today);
const newId = () => `CIR-${Date.now().toString().slice(-6)}`;

const colorEstado = (e) => ({"Confirmada":"#2E7D52","Pendiente":"#9A6B00","Realizada":B.slate,"Cancelada":"#B91C1C"}[e]||B.muted);
const bgEstado   = (e) => ({"Confirmada":"#E6F4EC","Pendiente":B.goldLight,"Realizada":"#E8EDF2","Cancelada":"#FEE2E2"}[e]||"#F1F5F9");
const colorFact  = (e) => ({"Pendiente":"#9A6B00","Facturada":B.slate,"En revisión":"#B91C1C","Cobrada":"#2E7D52"}[e]||B.muted);
const bgFact     = (e) => ({"Pendiente":B.goldLight,"Facturada":"#E8EDF2","En revisión":"#FEE2E2","Cobrada":"#E6F4EC"}[e]||"#F1F5F9");

// ─── MINI COMPONENTS ─────────────────────────────────────────────
const Badge = ({label,bg,color}) => (
  <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:bg,color,whiteSpace:"nowrap"}}>{label}</span>
);
const ColHeader = ({children}) => (
  <div style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.5}}>{children}</div>
);
const FormGroup = ({label,children,style={}}) => (
  <div style={style}>
    <label style={{display:"block",fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:6}}>{label}</label>
    {children}
  </div>
);
const Spinner = () => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"80px 0",gap:16}}>
    <div style={{width:36,height:36,border:`3px solid ${B.border}`,borderTopColor:B.slate,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <div style={{color:B.muted,fontSize:14}}>Cargando CIRMI...</div>
  </div>
);

// ─── CALENDARIO SEMANAL ──────────────────────────────────────────
function CalendarioSemanal({ cirugias, selectedDate, onSelectDate, onNewCirugia }) {
  const [weekOffset, setWeekOffset] = useState(0);

  // Calcular los 7 días de la semana actual
  const getWeekDays = () => {
    const days = [];
    const base = new Date(today);
    base.setDate(base.getDate() + weekOffset * 7);
    // Lunes de la semana
    const monday = new Date(base);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const weekLabel = () => {
    const first = weekDays[0];
    const last = weekDays[6];
    if (first.getMonth() === last.getMonth())
      return `${first.getDate()} – ${last.getDate()} de ${MESES[first.getMonth()]} ${first.getFullYear()}`;
    return `${first.getDate()} ${MESES[first.getMonth()]} – ${last.getDate()} ${MESES[last.getMonth()]} ${last.getFullYear()}`;
  };

  return (
    <div className="card" style={{marginBottom:24,overflow:"hidden"}}>
      {/* Header del calendario */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${B.border}`}}>
        <div style={{fontWeight:700,fontSize:15,color:B.slateDark}}>📅 {weekLabel()}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setWeekOffset(w=>w-1)} className="btn-sec" style={{padding:"6px 12px",fontSize:13}}>← Anterior</button>
          <button onClick={()=>{setWeekOffset(0);onSelectDate(fmtToday());}} className="btn-sec" style={{padding:"6px 12px",fontSize:13,fontWeight:weekOffset===0?700:400,borderColor:weekOffset===0?B.slate:B.border}}>Hoy</button>
          <button onClick={()=>setWeekOffset(w=>w+1)} className="btn-sec" style={{padding:"6px 12px",fontSize:13}}>Siguiente →</button>
        </div>
      </div>

      {/* Grid de días */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:0}}>
        {weekDays.map((d,i) => {
          const dateStr = fmt(d);
          const isToday = dateStr === fmtToday();
          const isSelected = dateStr === selectedDate;
          const dayCxs = cirugias.filter(c => c.fecha === dateStr);
          const isWeekend = i >= 5;

          return (
            <div key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              style={{
                borderRight: i < 6 ? `1px solid ${B.border}` : "none",
                background: isSelected ? B.slateDark : isWeekend ? "#F8FAFB" : "white",
                cursor:"pointer",
                transition:"all .15s",
                minHeight:110,
                padding:"10px 10px 8px",
                position:"relative",
              }}
              onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background=isWeekend?"#F0F4F7":"#F7F9FB";}}
              onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background=isWeekend?"#F8FAFB":"white";}}>

              {/* Cabecera del día */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:600,color:isSelected?"rgba(255,255,255,.7)":isWeekend?B.muted:B.muted,textTransform:"uppercase",letterSpacing:.5}}>
                  {DIAS_CORTO[d.getDay()]}
                </div>
                <div style={{
                  width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  marginTop:2,
                  background: isToday ? B.gold : "transparent",
                  color: isSelected ? "white" : isToday ? B.slateDark : B.text,
                  fontWeight: isToday||isSelected ? 700 : 500,
                  fontSize:15,
                }}>
                  {d.getDate()}
                </div>
              </div>

              {/* Cirugías del día */}
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {dayCxs.slice(0,3).map(c=>(
                  <div key={c.id} style={{
                    background: isSelected ? "rgba(255,255,255,0.15)" : bgEstado(c.estado),
                    borderRadius:5,
                    padding:"3px 6px",
                    fontSize:10,
                    fontWeight:600,
                    color: isSelected ? "white" : colorEstado(c.estado),
                    overflow:"hidden",
                    textOverflow:"ellipsis",
                    whiteSpace:"nowrap",
                  }}>
                    {c.inicio} {c.tipo}
                  </div>
                ))}
                {dayCxs.length > 3 && (
                  <div style={{fontSize:10,color:isSelected?"rgba(255,255,255,.6)":B.muted,fontWeight:600,paddingLeft:4}}>
                    +{dayCxs.length-3} más
                  </div>
                )}
                {dayCxs.length === 0 && (
                  <div style={{fontSize:10,color:isSelected?"rgba(255,255,255,.3)":B.border,textAlign:"center",marginTop:4}}>—</div>
                )}
              </div>

              {/* Botón añadir al hover */}
              {isSelected && (
                <button onClick={e=>{e.stopPropagation();onNewCirugia();}}
                  style={{position:"absolute",bottom:6,right:6,background:B.gold,border:"none",borderRadius:6,width:22,height:22,fontSize:14,fontWeight:700,color:B.slateDark,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab]           = useState("agenda");
  const [cirugias, setCirugias] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [hospitales, setHospitales] = useState([]);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [selectedDate, setSelectedDate] = useState(fmtToday());
  const [selectedHosp, setSelectedHosp] = useState("Todos");
  const [filtroFactura, setFiltroFactura] = useState("Todos");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [configTab, setConfigTab] = useState("personal");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c,p,h] = await Promise.all([
        dbGet("cirugias","order=fecha.asc,inicio.asc"),
        dbGet("personal","order=nombre.asc&activo=eq.true"),
        dbGet("hospitales","order=nombre.asc&activo=eq.true"),
      ]);
      setCirugias(c); setPersonal(p); setHospitales(h);
    } catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };
  useEffect(()=>{ loadAll(); },[]);

  const hospNames = hospitales.map(h=>h.nombre);

  // ── Cirugías ──
  const openNewCirugia = () => {
    setForm({id:newId(),fecha:selectedDate,hospital:hospNames[0]||"",quirofano:"Q-1",tipo:"",cirujano:personal[0]?.nombre||"",ayudante:"",enfermera:"",inicio:"08:00",fin:"10:00",estado:"Confirmada",factura:"Pendiente",paciente:"",obs:""});
    setModal("cirugia_nueva");
  };
  const saveCirugia = async () => {
    setSaving(true);
    try{
      if(modal==="cirugia_nueva") await dbInsert("cirugias",form);
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
    catch(e){ alert("Error al actualizar."); }
  };

  // ── Personal ──
  const openNewPersonal = () => {
    setForm({nombre:"",rol:"Cirujano Residente",hospitales:[],tel:"",color:COLORES[0],activo:true});
    setModal("personal_nuevo");
  };
  const savePersonal = async () => {
    if(!form.nombre?.trim()){ alert("El nombre es obligatorio."); return; }
    setSaving(true);
    try{
      if(modal==="personal_nuevo") await dbInsert("personal",form);
      else{ const{id,...d}=form; await dbUpdate("personal",id,d); }
      await loadAll(); setModal(null);
    }catch(e){ alert("Error al guardar personal."); }
    finally{ setSaving(false); }
  };
  const deletePersonal = async (id) => {
    if(!window.confirm("¿Eliminar este profesional?")) return;
    try{ await dbUpdate("personal",id,{activo:false}); await loadAll(); setModal(null); }
    catch(e){ alert("Error al eliminar."); }
  };
  const toggleHospPersonal = (h) => {
    const arr=form.hospitales||[];
    setForm({...form,hospitales:arr.includes(h)?arr.filter(x=>x!==h):[...arr,h]});
  };

  // ── Hospitales ──
  const openNewHospital = () => {
    setForm({nombre:"",direccion:"",activo:true});
    setModal("hospital_nuevo");
  };
  const saveHospital = async () => {
    if(!form.nombre?.trim()){ alert("El nombre es obligatorio."); return; }
    setSaving(true);
    try{
      if(modal==="hospital_nuevo") await dbInsert("hospitales",form);
      else{ const{id,...d}=form; await dbUpdate("hospitales",id,d); }
      await loadAll(); setModal(null);
    }catch(e){ alert("Error al guardar hospital."); }
    finally{ setSaving(false); }
  };
  const deleteHospital = async (id) => {
    if(!window.confirm("¿Eliminar este hospital?")) return;
    try{ await dbUpdate("hospitales",id,{activo:false}); await loadAll(); setModal(null); }
    catch(e){ alert("Error al eliminar."); }
  };

  const cirugiasDia = cirugias.filter(c=>(selectedHosp==="Todos"||c.hospital===selectedHosp)&&c.fecha===selectedDate);
  const pendFactura = cirugias.filter(c=>c.factura==="Pendiente").length;
  const hoyCount = cirugias.filter(c=>c.fecha===fmtToday()).length;
  const semanaCount = cirugias.filter(c=>{const d=new Date(c.fecha);return d>=today&&d<=new Date(today.getTime()+7*86400000);}).length;

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:B.bg,minHeight:"100vh",color:B.text}}>
      <style>{`
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
        .tab-btn{padding:9px 18px;border:none;background:none;font-size:14px;font-weight:500;color:rgba(255,255,255,.6);border-radius:8px;transition:all .15s;cursor:pointer}
        .tab-btn.active{background:${B.gold};color:${B.slateDark};font-weight:700}
        .tab-btn:hover:not(.active){background:rgba(255,255,255,.1);color:white}
        .inp{width:100%;padding:9px 12px;border:1.5px solid ${B.border};border-radius:8px;font-size:14px;outline:none;transition:border .15s;color:${B.text};background:white}
        .inp:focus{border-color:${B.slate}}
        .row-card{background:white;border:1.5px solid ${B.border};border-radius:11px;padding:14px 18px;margin-bottom:8px;cursor:pointer;transition:all .15s}
        .row-card:hover{border-color:${B.slateLight};box-shadow:0 3px 12px rgba(46,63,82,.1);transform:translateY(-1px)}
        .overlay{position:fixed;inset:0;background:rgba(30,43,58,.5);backdrop-filter:blur(6px);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:white;border-radius:18px;padding:32px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 30px 80px rgba(30,43,58,.25)}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .stat-card{background:white;border-radius:14px;padding:20px 22px;box-shadow:0 1px 3px rgba(46,63,82,.06)}
        .config-item{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:white;border:1.5px solid ${B.border};border-radius:11px;margin-bottom:8px;transition:all .15s}
        .config-item:hover{border-color:${B.slateLight};box-shadow:0 2px 8px rgba(46,63,82,.08)}
        .subtab{padding:8px 16px;border:none;background:none;font-size:13px;font-weight:500;color:${B.muted};border-radius:8px 8px 0 0;cursor:pointer;transition:all .15s;border-bottom:2px solid transparent}
        .subtab.active{color:${B.slate};font-weight:700;border-bottom-color:${B.slate}}
        .avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* HEADER */}
      <div style={{background:B.slateDark,padding:"0 28px",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 16px rgba(20,30,42,.35)"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <svg width="96" height="28" viewBox="0 0 96 28">
              <text x="0" y="22" fontFamily="Georgia,serif" fontSize="26" fontWeight="700" fill={B.white} letterSpacing="1">CIRMI</text>
              <line x1="5" y1="2" x2="16" y2="26" stroke={B.gold} strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            <div style={{width:1,height:20,background:"rgba(255,255,255,.15)"}}/>
            <span style={{color:"rgba(255,255,255,.45)",fontSize:12}}>Gestión Quirúrgica</span>
          </div>
          <div style={{display:"flex",gap:2}}>
            {[["agenda","📅 Agenda"],["hospitales","🏨 Hospitales"],["personal","👥 Personal"],["facturacion","💰 Facturación"],["config","⚙️ Config"]].map(([id,label])=>(
              <button key={id} className={`tab-btn ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {pendFactura>0&&(
              <div onClick={()=>{setTab("facturacion");setFiltroFactura("Pendiente");}}
                style={{background:B.goldLight,color:B.goldDark,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",border:`1px solid ${B.gold}`}}>
                ⚠ {pendFactura} pendiente{pendFactura>1?"s":""}
              </div>
            )}
            <button className="btn-gold" onClick={openNewCirugia} style={{padding:"8px 16px",fontSize:13}}>+ Nueva cirugía</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"28px"}}>

        {/* STATS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}}>
          {[
            {label:"Cirugías hoy",value:hoyCount,icon:"🔪",accent:B.slate},
            {label:"Esta semana",value:semanaCount,icon:"📅",accent:B.slateLight},
            {label:"Fact. pendiente",value:pendFactura,icon:"📋",accent:B.goldDark},
            {label:"Total registradas",value:cirugias.length,icon:"📊",accent:B.slateDark},
          ].map(s=>(
            <div key={s.label} className="stat-card" style={{borderLeft:`4px solid ${s.accent}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:30,fontWeight:700,color:s.accent,lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:12,color:B.muted,fontWeight:500,marginTop:5}}>{s.label}</div>
                </div>
                <span style={{fontSize:22}}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {loading ? <Spinner/> : (<>

          {/* ══ AGENDA ══ */}
          {tab==="agenda"&&(
            <div>
              {/* Calendario semanal */}
              <CalendarioSemanal
                cirugias={cirugias}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onNewCirugia={openNewCirugia}
              />

              {/* Lista del día seleccionado */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
                <div>
                  <h3 style={{fontSize:18,fontWeight:700,color:B.slateDark}}>
                    {selectedDate===fmtToday()?"Hoy":"Intervenciones del"} {selectedDate===fmtToday()?"":selectedDate}
                    <span style={{fontSize:13,fontWeight:500,color:B.muted,marginLeft:10}}>{cirugiasDia.length} cirugía{cirugiasDia.length!==1?"s":""}</span>
                  </h3>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <select className="inp" style={{width:148}} value={selectedHosp} onChange={e=>setSelectedHosp(e.target.value)}>
                    <option>Todos</option>
                    {hospNames.map(h=><option key={h}>{h}</option>)}
                  </select>
                  <button className="btn-gold" onClick={openNewCirugia} style={{padding:"9px 16px",fontSize:13}}>+ Añadir</button>
                </div>
              </div>

              {/* Columnas */}
              <div style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 1fr 100px 100px 28px",gap:12,padding:"6px 18px",marginBottom:6}}>
                {["Horario","Intervención","Equipo","Centro / Q","Estado","Factura",""].map(h=><ColHeader key={h}>{h}</ColHeader>)}
              </div>

              {cirugiasDia.length===0?(
                <div className="card" style={{padding:40,textAlign:"center",color:B.muted}}>
                  <div style={{fontSize:36,marginBottom:10}}>📋</div>
                  <div style={{fontWeight:600,fontSize:15}}>Sin cirugías para este día</div>
                  <div style={{fontSize:13,marginTop:4}}>Selecciona otro día en el calendario o añade una nueva</div>
                  <button className="btn-gold" onClick={openNewCirugia} style={{marginTop:16}}>+ Añadir cirugía</button>
                </div>
              ):cirugiasDia.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                <div key={c.id} className="row-card"
                  style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 1fr 100px 100px 28px",gap:12,alignItems:"center"}}
                  onClick={()=>{setForm({...c});setModal("cirugia_edit");}}>
                  <div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:600,color:B.slateDark}}>{c.inicio}</div>
                    <div style={{fontSize:11,color:B.muted,marginTop:2}}>→ {c.fin}</div>
                  </div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{c.tipo}</div>
                    <div style={{fontSize:11,color:B.muted,fontFamily:"'DM Mono',monospace"}}>{c.id}</div>
                    {c.obs&&<div style={{fontSize:11,color:B.goldDark,marginTop:2}}>⚠ {c.obs}</div>}
                  </div>
                  <div style={{fontSize:13,lineHeight:1.8}}>
                    <div style={{fontWeight:600}}>🔪 {c.cirujano}</div>
                    {c.ayudante&&<div style={{color:B.muted}}>🤝 {c.ayudante}</div>}
                    {c.enfermera&&<div style={{color:B.muted}}>💉 {c.enfermera}</div>}
                  </div>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{c.hospital}</div>
                    <div style={{fontSize:12,color:B.muted}}>{c.quirofano}</div>
                  </div>
                  <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                  <Badge label={c.factura} bg={bgFact(c.factura)} color={colorFact(c.factura)}/>
                  <span style={{color:B.border,fontSize:20}}>›</span>
                </div>
              ))}
            </div>
          )}

          {/* ══ HOSPITALES ══ */}
          {tab==="hospitales"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div>
                  <h2 style={{fontSize:22,fontWeight:700,color:B.slateDark}}>Vista por Hospital</h2>
                  <p style={{color:B.muted,fontSize:13,marginTop:3}}>Situación en cada centro</p>
                </div>
                <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="inp" style={{width:165}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(hospitales.length,3)},1fr)`,gap:18}}>
                {hospitales.map((h,idx)=>{
                  const cxs=cirugias.filter(c=>c.hospital===h.nombre&&c.fecha===selectedDate);
                  const accents=[B.slate,B.slateDark,B.slateLight,"#3D6B8C","#6B4F9A"];
                  const accent=accents[idx%accents.length];
                  return(
                    <div key={h.id} style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(46,63,82,.07)"}}>
                      <div style={{background:accent,padding:"20px 22px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{color:"white",fontWeight:700,fontSize:17}}>{h.nombre}</div>
                            {h.direccion&&<div style={{color:"rgba(255,255,255,.6)",fontSize:12,marginTop:2}}>{h.direccion}</div>}
                            <div style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:2}}>{cxs.length} cirugía{cxs.length!==1?"s":""}</div>
                          </div>
                          <div style={{background:B.gold,borderRadius:10,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:B.slateDark}}>{cxs.length}</div>
                        </div>
                      </div>
                      <div style={{padding:"16px 18px"}}>
                        {cxs.length===0?(
                          <div style={{color:B.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>Sin intervenciones este día</div>
                        ):cxs.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                          <div key={c.id} onClick={()=>{setForm({...c});setModal("cirugia_edit");}}
                            style={{padding:"12px 14px",borderRadius:10,border:`1.5px solid ${B.border}`,marginBottom:8,cursor:"pointer",transition:"all .15s"}}
                            onMouseEnter={e=>e.currentTarget.style.borderColor=accent}
                            onMouseLeave={e=>e.currentTarget.style.borderColor=B.border}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:accent}}>{c.inicio}–{c.fin}</span>
                              <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                            </div>
                            <div style={{fontWeight:600,fontSize:14}}>{c.tipo}</div>
                            <div style={{fontSize:12,color:B.muted,marginTop:3}}>{c.quirofano} · {c.cirujano}</div>
                            {c.obs&&<div style={{fontSize:11,color:B.goldDark,marginTop:4}}>⚠ {c.obs}</div>}
                          </div>
                        ))}
                      </div>
                      <div style={{padding:"0 18px 18px",borderTop:`1px solid ${B.border}`,paddingTop:14}}>
                        <ColHeader>Personal asignado</ColHeader>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
                          {personal.filter(p=>(p.hospitales||[]).includes(h.nombre)).map(p=>(
                            <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,background:B.bg,borderRadius:20,padding:"4px 10px 4px 5px",border:`1px solid ${B.border}`}}>
                              <div className="avatar" style={{background:p.color||B.slate,width:22,height:22,fontSize:9}}>{(p.nombre||"?")[0]}</div>
                              <span style={{fontSize:12,fontWeight:500}}>{p.nombre}</span>
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

          {/* ══ PERSONAL ══ */}
          {tab==="personal"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <h2 style={{fontSize:22,fontWeight:700,color:B.slateDark}}>Gestión de Personal</h2>
                  <p style={{color:B.muted,fontSize:13,marginTop:3}}>Carga de trabajo y próximas intervenciones</p>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
                {personal.map(p=>{
                  const cxs=cirugias.filter(c=>[c.cirujano,c.ayudante,c.enfermera].includes(p.nombre));
                  const proximas=cxs.filter(c=>new Date(c.fecha)>=today).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
                  return(
                    <div key={p.id} className="card" style={{padding:22,borderLeft:`4px solid ${p.color||B.slate}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                        <div className="avatar" style={{background:p.color||B.slate,width:50,height:50,fontSize:18}}>
                          {(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:16}}>{p.nombre}</div>
                          <div style={{fontSize:13,color:B.muted}}>{p.rol}</div>
                          {p.tel&&<div style={{fontSize:12,color:B.muted,marginTop:2}}>📞 {p.tel}</div>}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                          <div style={{fontSize:26,fontWeight:700,color:p.color||B.slate}}>{cxs.length}</div>
                          <button className="btn-sec" style={{padding:"4px 10px",fontSize:12}} onClick={()=>{setForm({...p});setModal("personal_edit");}}>✏️ Editar</button>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                        {(p.hospitales||[]).map(h=>(
                          <span key={h} style={{background:B.bg,color:B.slate,borderRadius:6,padding:"3px 9px",fontSize:12,fontWeight:600,border:`1px solid ${B.border}`}}>{h}</span>
                        ))}
                      </div>
                      {proximas.length>0?(
                        <div>
                          <ColHeader>Próximas intervenciones</ColHeader>
                          <div style={{marginTop:8}}>
                            {proximas.slice(0,3).map(c=>(
                              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${B.border}`}}>
                                <div>
                                  <div style={{fontSize:13,fontWeight:600}}>{c.tipo}</div>
                                  <div style={{fontSize:12,color:B.muted}}>{c.fecha} · {c.hospital}</div>
                                </div>
                                <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                              </div>
                            ))}
                          </div>
                        </div>
                      ):(
                        <div style={{color:B.muted,fontSize:13,fontStyle:"italic"}}>Sin intervenciones próximas</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ FACTURACIÓN ══ */}
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
                      style={{padding:"7px 14px",borderRadius:8,border:"1.5px solid",fontSize:13,fontWeight:500,cursor:"pointer",transition:"all .15s",
                        background:filtroFactura===f?B.slateDark:"white",
                        color:filtroFactura===f?"white":B.slate,
                        borderColor:filtroFactura===f?B.slateDark:B.border}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:22}}>
                {["Pendiente","Facturada","En revisión","Cobrada"].map(estado=>{
                  const n=cirugias.filter(c=>c.factura===estado).length;
                  return(
                    <div key={estado} className="stat-card" style={{borderTop:`3px solid ${colorFact(estado)}`,cursor:"pointer"}} onClick={()=>setFiltroFactura(estado)}>
                      <div style={{fontSize:26,fontWeight:700,color:colorFact(estado)}}>{n}</div>
                      <div style={{fontSize:13,color:B.muted,marginTop:3}}>{estado}</div>
                    </div>
                  );
                })}
              </div>
              <div className="card" style={{overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"90px 100px 1fr 140px 110px 130px 40px",gap:12,padding:"12px 20px",background:B.bg,borderBottom:`1px solid ${B.border}`}}>
                  {["ID","Fecha","Intervención","Hospital","Estado","Factura",""].map(h=><ColHeader key={h}>{h}</ColHeader>)}
                </div>
                {cirugias.filter(c=>filtroFactura==="Todos"||c.factura===filtroFactura)
                  .sort((a,b)=>new Date(b.fecha)-new Date(a.fecha))
                  .map((c,i)=>(
                  <div key={c.id}
                    style={{display:"grid",gridTemplateColumns:"90px 100px 1fr 140px 110px 130px 40px",gap:12,padding:"13px 20px",borderBottom:`1px solid ${B.border}`,alignItems:"center",background:i%2===0?"white":"#FAFBFC",cursor:"pointer",transition:"background .1s"}}
                    onClick={()=>{setForm({...c});setModal("cirugia_edit");}}
                    onMouseEnter={e=>e.currentTarget.style.background="#F0F4F8"}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"white":"#FAFBFC"}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:B.slate}}>{c.id}</div>
                    <div style={{fontSize:13,color:B.muted}}>{c.fecha}</div>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{c.tipo}</div>
                      <div style={{fontSize:12,color:B.muted}}>{c.cirujano}</div>
                    </div>
                    <div style={{fontSize:13}}>{c.hospital}<br/><span style={{color:B.muted,fontSize:12}}>{c.quirofano}</span></div>
                    <Badge label={c.estado} bg={bgEstado(c.estado)} color={colorEstado(c.estado)}/>
                    <div onClick={e=>e.stopPropagation()}>
                      <select className="inp" style={{padding:"5px 8px",fontSize:12}} value={c.factura}
                        onChange={e=>updateFactura(c.id,e.target.value)}>
                        {ESTADOS_FACTURA.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <span style={{color:B.border,fontSize:20,textAlign:"center"}}>›</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CONFIGURACIÓN ══ */}
          {tab==="config"&&(
            <div>
              <div style={{marginBottom:24}}>
                <h2 style={{fontSize:22,fontWeight:700,color:B.slateDark}}>⚙️ Configuración</h2>
                <p style={{color:B.muted,fontSize:13,marginTop:3}}>Gestiona el personal y los hospitales de CIRMI</p>
              </div>
              <div style={{display:"flex",gap:4,marginBottom:24,borderBottom:`2px solid ${B.border}`}}>
                {[["personal","👥 Personal"],["hospitales","🏨 Hospitales"]].map(([id,label])=>(
                  <button key={id} className={`subtab ${configTab===id?"active":""}`} onClick={()=>setConfigTab(id)}>{label}</button>
                ))}
              </div>

              {configTab==="personal"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div style={{fontSize:15,fontWeight:600,color:B.slateDark}}>{personal.length} profesionales activos</div>
                    <button className="btn-gold" onClick={openNewPersonal}>+ Añadir profesional</button>
                  </div>
                  {personal.map(p=>(
                    <div key={p.id} className="config-item">
                      <div style={{display:"flex",alignItems:"center",gap:14}}>
                        <div className="avatar" style={{background:p.color||B.slate,width:44,height:44,fontSize:16}}>
                          {(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}
                        </div>
                        <div>
                          <div style={{fontWeight:700,fontSize:15}}>{p.nombre}</div>
                          <div style={{fontSize:13,color:B.muted}}>{p.rol}</div>
                          <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                            {(p.hospitales||[]).map(h=>(
                              <span key={h} style={{background:B.bg,color:B.slate,borderRadius:4,padding:"2px 7px",fontSize:11,fontWeight:600,border:`1px solid ${B.border}`}}>{h}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        {p.tel&&<span style={{fontSize:13,color:B.muted}}>📞 {p.tel}</span>}
                        <button className="btn-sec" style={{padding:"6px 12px",fontSize:13}} onClick={()=>{setForm({...p});setModal("personal_edit");}}>✏️ Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {configTab==="hospitales"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div style={{fontSize:15,fontWeight:600,color:B.slateDark}}>{hospitales.length} hospitales activos</div>
                    <button className="btn-gold" onClick={openNewHospital}>+ Añadir hospital</button>
                  </div>
                  {hospitales.map((h,idx)=>{
                    const accents=[B.slate,B.slateDark,B.slateLight,"#3D6B8C","#6B4F9A"];
                    return(
                      <div key={h.id} className="config-item">
                        <div style={{display:"flex",alignItems:"center",gap:14}}>
                          <div style={{width:44,height:44,borderRadius:10,background:accents[idx%accents.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏥</div>
                          <div>
                            <div style={{fontWeight:700,fontSize:15}}>{h.nombre}</div>
                            {h.direccion&&<div style={{fontSize:13,color:B.muted}}>{h.direccion}</div>}
                            <div style={{fontSize:12,color:B.muted,marginTop:2}}>
                              {personal.filter(p=>(p.hospitales||[]).includes(h.nombre)).length} profesionales asignados
                            </div>
                          </div>
                        </div>
                        <button className="btn-sec" style={{padding:"6px 12px",fontSize:13}} onClick={()=>{setForm({...h});setModal("hospital_edit");}}>✏️ Editar</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>)}
      </div>

      {/* ══ MODALES ══ */}
      {modal&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal">

            {/* Cirugía */}
            {(modal==="cirugia_nueva"||modal==="cirugia_edit")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                <div>
                  <h3 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>{modal==="cirugia_nueva"?"Nueva intervención":"Editar intervención"}</h3>
                  {form.id&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:B.muted,marginTop:2}}>{form.id}</div>}
                </div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:8,width:32,height:32,fontSize:18,color:B.muted,cursor:"pointer"}}>×</button>
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
                ].map(([label,field])=>(
                  <FormGroup key={label} label={label}>{field}</FormGroup>
                ))}
              </div>
              <FormGroup label="Observaciones" style={{marginTop:14}}>
                <textarea className="inp" rows={3} value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} placeholder="Notas, avisos..." style={{resize:"vertical"}}/>
              </FormGroup>
              <div style={{display:"flex",gap:10,marginTop:26,justifyContent:"space-between"}}>
                <div>{modal==="cirugia_edit"&&<button className="btn-danger" onClick={()=>deleteCirugia(form.id)} disabled={saving}>🗑 Eliminar</button>}</div>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                  <button className="btn-gold" onClick={saveCirugia} disabled={saving}>{saving?"Guardando...":modal==="cirugia_nueva"?"Crear":"Guardar"}</button>
                </div>
              </div>
            </>)}

            {/* Personal */}
            {(modal==="personal_nuevo"||modal==="personal_edit")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                <h3 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>{modal==="personal_nuevo"?"Nuevo profesional":"Editar profesional"}</h3>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:8,width:32,height:32,fontSize:18,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div className="form-grid">
                <FormGroup label="Nombre completo">
                  <input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Dr. García"/>
                </FormGroup>
                <FormGroup label="Rol">
                  <select className="inp" value={form.rol||""} onChange={e=>setForm({...form,rol:e.target.value})}>
                    {ROLES.map(r=><option key={r}>{r}</option>)}
                  </select>
                </FormGroup>
                <FormGroup label="Teléfono">
                  <input className="inp" value={form.tel||""} onChange={e=>setForm({...form,tel:e.target.value})} placeholder="655 000 000"/>
                </FormGroup>
                <FormGroup label="Color identificador">
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                    {COLORES.map(c=>(
                      <div key={c} onClick={()=>setForm({...form,color:c})}
                        style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?`3px solid ${B.slateDark}`:"3px solid transparent",transition:"all .15s"}}/>
                    ))}
                  </div>
                </FormGroup>
              </div>
              <FormGroup label="Hospitales donde trabaja" style={{marginTop:14}}>
                <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                  {hospitales.map(h=>(
                    <div key={h.id} onClick={()=>toggleHospPersonal(h.nombre)}
                      style={{padding:"8px 16px",borderRadius:8,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s",
                        background:(form.hospitales||[]).includes(h.nombre)?B.slate:"white",
                        color:(form.hospitales||[]).includes(h.nombre)?"white":B.slate,
                        borderColor:(form.hospitales||[]).includes(h.nombre)?B.slate:B.border}}>
                      {h.nombre}
                    </div>
                  ))}
                </div>
              </FormGroup>
              <div style={{display:"flex",gap:10,marginTop:26,justifyContent:"space-between"}}>
                <div>{modal==="personal_edit"&&<button className="btn-danger" onClick={()=>deletePersonal(form.id)}>🗑 Eliminar</button>}</div>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                  <button className="btn-gold" onClick={savePersonal} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
                </div>
              </div>
            </>)}

            {/* Hospital */}
            {(modal==="hospital_nuevo"||modal==="hospital_edit")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                <h3 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>{modal==="hospital_nuevo"?"Nuevo hospital":"Editar hospital"}</h3>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:8,width:32,height:32,fontSize:18,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <FormGroup label="Nombre del hospital">
                  <input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Hospital Vall d'Hebron"/>
                </FormGroup>
                <FormGroup label="Dirección (opcional)">
                  <input className="inp" value={form.direccion||""} onChange={e=>setForm({...form,direccion:e.target.value})} placeholder="Ej: Pg. de la Vall d'Hebron, 119"/>
                </FormGroup>
              </div>
              <div style={{display:"flex",gap:10,marginTop:26,justifyContent:"space-between"}}>
                <div>{modal==="hospital_edit"&&<button className="btn-danger" onClick={()=>deleteHospital(form.id)}>🗑 Eliminar</button>}</div>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                  <button className="btn-gold" onClick={saveHospital} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
                </div>
              </div>
            </>)}

          </div>
        </div>
      )}
    </div>
  );
}

