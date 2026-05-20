import { useState, useEffect, useRef } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────
const SB_URL = "https://itcarcntzopvchxoeyzv.supabase.co";
const SB_KEY = "sb_publishable_sp21Q5eB6VqFrSgGjz28jQ_LMVoSmCk";
const API     = (t) => `${SB_URL}/rest/v1/${t}`;
const STORAGE = `${SB_URL}/storage/v1`;
const AUTH_EP = (p) => `${SB_URL}/auth/v1/${p}`;

const H = (tok) => ({ "Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${tok||SB_KEY}`,"Prefer":"return=representation" });

const dbGet    = async (t,q="",tok)  => { const r=await fetch(`${API(t)}?${q}`,{headers:H(tok)}); if(!r.ok)throw new Error(await r.text()); return r.json(); };
const dbInsert = async (t,d,tok)     => { const r=await fetch(API(t),{method:"POST",headers:H(tok),body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); return r.json(); };
const dbUpdate = async (t,id,d,tok)  => { const r=await fetch(`${API(t)}?id=eq.${id}`,{method:"PATCH",headers:H(tok),body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); return r.json(); };
const dbDelete = async (t,id,tok)    => { const r=await fetch(`${API(t)}?id=eq.${id}`,{method:"DELETE",headers:H(tok)}); if(!r.ok)throw new Error(await r.text()); };

// Auth
const authSignUp = async (email,pwd,nombre) => { const r=await fetch(AUTH_EP("signup"),{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email,password:pwd,data:{nombre}})}); return r.json(); };
const authSignIn = async (email,pwd) => { const r=await fetch(`${AUTH_EP("token")}?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email,password:pwd})}); return r.json(); };
const authSignOut = async (tok) => { await fetch(AUTH_EP("logout"),{method:"POST",headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`}}); };

// Storage
const uploadDoc = async (path,file,tok) => {
  const r=await fetch(`${STORAGE}/object/documentos/${path}`,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`,"Content-Type":file.type,"x-upsert":"true"},body:file});
  return r.json();
};
const getSignedUrl = async (path,tok) => {
  const r=await fetch(`${STORAGE}/object/sign/documentos/${path}`,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`,"Content-Type":"application/json"},body:JSON.stringify({expiresIn:3600})});
  const d=await r.json();
  return `${SB_URL}${d.signedURL}`;
};
const deleteStorageFile = async (path,tok) => {
  await fetch(`${STORAGE}/object/documentos`,{method:"DELETE",headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`,"Content-Type":"application/json"},body:JSON.stringify({prefixes:[path]})});
};

// ─── BRAND ────────────────────────────────────────────────────
const B={slate:"#4A6079",slateDark:"#2E3F52",slateLight:"#6B8299",gold:"#F5C842",goldLight:"#FDF3C0",goldDark:"#D4A820",bg:"#F2F5F8",white:"#FFFFFF",text:"#1C2B3A",muted:"#7A90A4",border:"#DDE4EB"};
const ACCENTS=[B.slate,B.slateDark,B.slateLight,"#3D6B8C","#6B4F9A","#2E7D52"];
const ROL_ADMIN="admin";
const ROL_CIR_PRINCIPAL="cirujano_principal";
const ROL_CIRUJANO="cirujano";
const ROL_ENFERMERO="enfermero";
const ROLES_P=["Cirujano Principal","Cirujano","Enf. Instrumentista"];
const QUIROFANOS=["Q-1","Q-2","Q-3","Q-4"];
const SALAS_CONSULTA=["C-1","C-2"];
const COLORES=["#4A6079","#2E3F52","#6B8299","#D4A820","#8B6914","#3D6B8C","#6B4F9A","#2E7D52","#B91C1C","#1D6FA4"];
const ESTADOS_CX=["Confirmada","Pendiente","Realizada","Cancelada"];
const ESTADOS_FA=["Pendiente","Facturada","En revisión","Cobrada"];
const DIAS_H=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CAT_DOCS=["Consentimientos","Hojas de información","Protocolos","Formularios","Otros"];

const today=new Date();
const fmt=(d)=>{const x=new Date(d);x.setHours(12);return x.toISOString().split("T")[0];};
const todayStr=fmt(today);
const newId=()=>`CIR-${Date.now().toString().slice(-6)}`;
const fmtSize=(b)=>b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(1)}KB`:`${(b/1048576).toFixed(1)}MB`;

// ─── EMAILJS — notificación al admin ─────────────────────────
// 1. Crear cuenta gratis en https://www.emailjs.com
// 2. Añadir un servicio Gmail en Email Services
// 3. Crear una plantilla con variables: {{nombre}}, {{email}}, {{url}}
//    Asunto: "CIRMI – Nueva solicitud de acceso"
//    Cuerpo: "{{nombre}} ({{email}}) ha solicitado acceso. Enlace: {{url}}"
// 4. Rellenar las 3 constantes siguientes:
const EMAILJS_SERVICE_ID  = "";   // ← PENDIENTE: ver instrucciones abajo
const EMAILJS_TEMPLATE_ID = "template_uonacsq";
const EMAILJS_PUBLIC_KEY  = "_pafTs5pnWavoJ2W1";
const ADMIN_EMAIL         = "b.villafig@gmail.com";

const notifyAdminNewRequest=async(nombre,email)=>{
  if(!EMAILJS_SERVICE_ID||!EMAILJS_TEMPLATE_ID||!EMAILJS_PUBLIC_KEY)return;
  try{
    await fetch("https://api.emailjs.com/api/v1.0/email/send",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        service_id:EMAILJS_SERVICE_ID,
        template_id:EMAILJS_TEMPLATE_ID,
        user_id:EMAILJS_PUBLIC_KEY,
        template_params:{to_email:ADMIN_EMAIL,nombre:nombre||"Sin nombre",email,url:"https://cirmi-app.vercel.app"}
      })
    });
  }catch{}
};

// ─── FESTIVOS CATALUÑA ────────────────────────────────────────
const festivosCat=(year)=>{
  // Algoritmo Meeus/Jones/Butcher para Semana Santa
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,
        f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
        ii=Math.floor(c/4),k=c%4,l=(32+2*e+2*ii-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const emEaster=Math.floor((h+l-7*m+114)/31)-1,edEaster=((h+l-7*m+114)%31)+1;
  const easter=new Date(year,emEaster,edEaster);
  const off=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return fmt(x);};
  const fijo=(m,d)=>`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return new Set([
    fijo(1,1),          // Cap d'Any
    fijo(1,6),          // Reis Mags
    off(easter,-2),     // Divendres Sant
    off(easter,1),      // Dilluns de Pasqua
    fijo(5,1),          // Dia del Treball
    fijo(6,24),         // Sant Joan
    fijo(8,15),         // Assumpció
    fijo(9,11),         // Diada Nacional de Catalunya
    fijo(9,24),         // La Mercè
    fijo(10,12),        // Festa Nacional d'Espanya
    fijo(11,1),         // Tots Sants
    fijo(12,6),         // Dia de la Constitució
    fijo(12,8),         // Immaculada Concepció
    fijo(12,25),        // Nadal
    fijo(12,26),        // Sant Esteve
  ]);
};
const ceColor=(e)=>({"Confirmada":"#2E7D52","Pendiente":"#9A6B00","Realizada":B.slate,"Cancelada":"#B91C1C"}[e]||B.muted);
const bEst=(e)=>({"Confirmada":"#E6F4EC","Pendiente":B.goldLight,"Realizada":"#E8EDF2","Cancelada":"#FEE2E2"}[e]||"#F1F5F9");
const cFact=(e)=>({"Pendiente":"#9A6B00","Facturada":B.slate,"En revisión":"#B91C1C","Cobrada":"#2E7D52"}[e]||B.muted);
const bFact=(e)=>({"Pendiente":B.goldLight,"Facturada":"#E8EDF2","En revisión":"#FEE2E2","Cobrada":"#E6F4EC"}[e]||"#F1F5F9");

// ─── HOOKS ────────────────────────────────────────────────────
const useWindowWidth=()=>{const[w,setW]=useState(window.innerWidth);useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w;};

// ─── MINI COMPONENTS ──────────────────────────────────────────
const Bdg=({label,bg,color,style={}})=><span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,background:bg,color,whiteSpace:"nowrap",...style}}>{label}</span>;
const FG=({label,children,style={}})=>(<div style={style}><label style={{display:"block",fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:6}}>{label}</label>{children}</div>);
const ColH=({children})=><div style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.5}}>{children}</div>;
const Spin=({text="Cargando..."})=>(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 0",gap:14}}><div style={{width:32,height:32,border:`3px solid ${B.border}`,borderTopColor:B.slate,borderRadius:"50%",animation:"spin 1s linear infinite"}}/><div style={{color:B.muted,fontSize:13}}>{text}</div></div>);

// ─── CALENDARIO MENSUAL ────────────────────────────────────────
function CalMes({year,month,renderDay,onPrev,onNext,onToday,holidays}){
  const first=new Date(year,month,1),last=new Date(year,month+1,0);
  let sd=first.getDay()-1; if(sd<0)sd=6;
  const cells=[];
  for(let i=0;i<sd;i++)cells.push(null);
  for(let d=1;d<=last.getDate();d++)cells.push(d);
  while(cells.length%7!==0)cells.push(null);
  return(
    <div style={{background:"white",borderRadius:14,boxShadow:"0 1px 4px rgba(46,63,82,.08)",marginBottom:20,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${B.border}`}}>
        <div style={{fontWeight:700,fontSize:15,color:B.slateDark}}>{MESES[month]} {year}</div>
        <div style={{display:"flex",gap:6}}><button onClick={onPrev} className="btn-sec" style={{padding:"5px 10px",fontSize:12}}>←</button><button onClick={onToday} className="btn-sec" style={{padding:"5px 10px",fontSize:12}}>Hoy</button><button onClick={onNext} className="btn-sec" style={{padding:"5px 10px",fontSize:12}}>→</button></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:B.bg,borderBottom:`1px solid ${B.border}`}}>
        {DIAS_H.map(d=><div key={d} style={{textAlign:"center",padding:"6px 0",fontSize:10,fontWeight:700,color:B.muted,textTransform:"uppercase"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
        {cells.map((day,i)=>{
          if(!day)return<div key={`e${i}`} style={{minHeight:72,background:"#EAECEF",borderRight:i%7<6?`1px solid ${B.border}`:"none",borderBottom:`1px solid ${B.border}`}}/>;
          const ds=fmt(new Date(year,month,day));
          const isWE=(i%7)>=5;
          return renderDay({day,dateStr:ds,isToday:ds===todayStr,isWeekend:isWE,isHoliday:!!(holidays?.has(ds)),col:i%7});
        })}
      </div>
    </div>
  );
}

// ─── AUTH SCREENS ─────────────────────────────────────────────
function AuthScreen({onAuth}){
  const[mode,setMode]=useState("login");
  const[form,setForm]=useState({email:"",password:"",nombre:"",confirm:""});
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[success,setSuccess]=useState("");
  const handle=async()=>{
    setError("");
    if(mode==="login"){
      if(!form.email||!form.password){setError("Completa todos los campos.");return;}
      setLoading(true);
      try{const d=await authSignIn(form.email,form.password);if(d.error||!d.access_token){setError(d.error_description||"Credenciales incorrectas.");return;}localStorage.setItem("cirmi_token",d.access_token);onAuth(d.access_token,d.user);}catch{setError("Error de conexión.");}finally{setLoading(false);}
    }else{
      if(!form.email||!form.password||!form.nombre){setError("Completa todos los campos.");return;}
      if(form.password!==form.confirm){setError("Las contraseñas no coinciden.");return;}
      if(form.password.length<6){setError("Mínimo 6 caracteres.");return;}
      setLoading(true);
      try{const d=await authSignUp(form.email,form.password,form.nombre);if(d.error){setError(d.msg||"Error al registrarse.");return;}notifyAdminNewRequest(form.nombre,form.email);setSuccess("¡Registro completado! El administrador revisará tu solicitud.");setMode("login");}catch{setError("Error de conexión.");}finally{setLoading(false);}
    }
  };
  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${B.slateDark} 0%,${B.slate} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"white",borderRadius:20,padding:"36px 32px",width:"100%",maxWidth:400,boxShadow:"0 30px 80px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <svg width="110" height="32" viewBox="0 0 110 32" style={{display:"block",margin:"0 auto 10px"}}><text x="0" y="26" fontFamily="Georgia,serif" fontSize="30" fontWeight="700" fill={B.slateDark} letterSpacing="2">CIRMI</text><line x1="6" y1="3" x2="19" y2="29" stroke={B.gold} strokeWidth="2.5" strokeLinecap="round"/></svg>
          <div style={{fontSize:12,color:B.muted}}>Gestión Quirúrgica</div>
        </div>
        <div style={{display:"flex",borderRadius:10,background:B.bg,padding:3,marginBottom:22}}>
          {[["login","Iniciar sesión"],["register","Solicitar acceso"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,padding:"9px 0",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",background:mode===m?"white":B.bg,color:mode===m?B.slateDark:B.muted,boxShadow:mode===m?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{l}</button>
          ))}
        </div>
        {success&&<div style={{background:"#E6F4EC",border:"1px solid #2E7D52",borderRadius:10,padding:"11px 14px",marginBottom:16,fontSize:13,color:"#2E7D52"}}>✅ {success}</div>}
        {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"11px 14px",marginBottom:16,fontSize:13,color:"#DC2626"}}>⚠ {error}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          {mode==="register"&&<div><label style={{display:"block",fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:6}}>Nombre completo</label><input className="inp" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Dr. García"/></div>}
          <div><label style={{display:"block",fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:6}}>Email</label><input className="inp" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="tu@email.com"/></div>
          <div><label style={{display:"block",fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:6}}>Contraseña</label><input className="inp" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Mínimo 6 caracteres"/></div>
          {mode==="register"&&<div><label style={{display:"block",fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:6}}>Confirmar contraseña</label><input className="inp" type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} placeholder="Repite la contraseña"/></div>}
          <button className="btn-gold" onClick={handle} disabled={loading} style={{marginTop:4,width:"100%",padding:"12px",fontSize:15}}>{loading?"...":(mode==="login"?"Entrar":"Solicitar acceso")}</button>
        </div>
        {mode==="register"&&<div style={{marginTop:14,padding:"10px 12px",background:B.bg,borderRadius:10,fontSize:12,color:B.muted,lineHeight:1.6}}>ℹ️ Tu solicitud será revisada por el administrador antes de darte acceso.</div>}
      </div>
    </div>
  );
}

function PendingScreen({perfil,onLogout}){return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${B.slateDark},${B.slate})`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"white",borderRadius:20,padding:40,textAlign:"center",maxWidth:400,boxShadow:"0 30px 80px rgba(0,0,0,.3)"}}><div style={{fontSize:48,marginBottom:14}}>⏳</div><h2 style={{fontSize:20,fontWeight:700,color:B.slateDark,marginBottom:8}}>Solicitud pendiente</h2><p style={{fontSize:13,color:B.muted,lineHeight:1.6,marginBottom:20}}>Hola <strong>{perfil?.nombre||perfil?.email}</strong>, el administrador revisará tu solicitud en breve.</p><button onClick={onLogout} className="btn-sec" style={{fontSize:13}}>Cerrar sesión</button></div></div>);}
function BlockedScreen({onLogout}){return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${B.slateDark},${B.slate})`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"white",borderRadius:20,padding:40,textAlign:"center",maxWidth:400,boxShadow:"0 30px 80px rgba(0,0,0,.3)"}}><div style={{fontSize:48,marginBottom:14}}>🚫</div><h2 style={{fontSize:20,fontWeight:700,color:"#B91C1C",marginBottom:8}}>Acceso bloqueado</h2><p style={{fontSize:13,color:B.muted,marginBottom:20}}>Tu cuenta ha sido desactivada. Contacta con el administrador.</p><button onClick={onLogout} className="btn-sec" style={{fontSize:13}}>Cerrar sesión</button></div></div>);}

// ═══════════════════════════════════════════════════════════════
export default function App(){
  const w=useWindowWidth();
  const mob=w<768;
  const[session,setSession]=useState(null);
  const[authUser,setAuthUser]=useState(null);
  const[perfil,setPerfil]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[tab,setTab]=useState("agenda");
  const[showNav,setShowNav]=useState(false);
  const[cirugias,setCirugias]=useState([]);
  const[personal,setPersonal]=useState([]);
  const[hospitales,setHospitales]=useState([]);
  const[guardias,setGuardias]=useState([]);
  const[sugerencias,setSugerencias]=useState([]);
  const[documentos,setDocumentos]=useState([]);
  const[perfiles,setPerfiles]=useState([]);
  const[notifs,setNotifs]=useState([]);
  const[showNotifs,setShowNotifs]=useState(false);
  const[modal,setModal]=useState(null);
  const[form,setForm]=useState({});
  const[selDate,setSelDate]=useState(todayStr);
  const[calY,setCalY]=useState(today.getFullYear());
  const[calM,setCalM]=useState(today.getMonth());
  const[gY,setGY]=useState(today.getFullYear());
  const[gM,setGM]=useState(today.getMonth());
  const[hospY,setHospY]=useState(today.getFullYear());
  const[hospM,setHospM]=useState(today.getMonth());
  const[quirY,setQuirY]=useState(today.getFullYear());
  const[quirM,setQuirM]=useState(today.getMonth());
  const[quirHosp,setQuirHosp]=useState(null);
  const[quirDate,setQuirDate]=useState(todayStr);
  const[quirEstados,setQuirEstados]=useState([]);
  const[consY,setConsY]=useState(today.getFullYear());
  const[consM,setConsM]=useState(today.getMonth());
  const[consHosp,setConsHosp]=useState(null);
  const[consDate,setConsDate]=useState(todayStr);
  const[consEstados,setConsEstados]=useState([]);
  const[filtFact,setFiltFact]=useState("Todos");
  const[filtCir,setFiltCir]=useState("Todos");
  const[filtCli,setFiltCli]=useState("Todos");
  const[filtCat,setFiltCat]=useState("Todos");
  const[configTab,setConfigTab]=useState("personal");
  const[guardHosp,setGuardHosp]=useState(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[showBusqueda,setShowBusqueda]=useState(false);
  const[queryBusq,setQueryBusq]=useState("");
  const[agendaVista,setAgendaVista]=useState("mes");
  const[agFiltHosp,setAgFiltHosp]=useState("Todos");
  const[agFiltEst,setAgFiltEst]=useState("Todos");
  const[auditoria,setAuditoria]=useState([]);
  const[ausencias,setAusencias]=useState([]);
  const[ausForm,setAusForm]=useState({fecha_inicio:todayStr,fecha_fin:todayStr,motivo:""});
  const[showAusForm,setShowAusForm]=useState(false);
  const[consEditSlot,setConsEditSlot]=useState(null);
  const[quirEditSlot,setQuirEditSlot]=useState(null);
  const[showMiAusForm,setShowMiAusForm]=useState(false);
  const[miAusForm,setMiAusForm]=useState({fecha_inicio:todayStr,fecha_fin:todayStr,motivo:""});
  const[notifProactivas,setNotifProactivas]=useState(()=>localStorage.getItem("cirmi_notif_proact")!=="false");
  const[audFiltTabla,setAudFiltTabla]=useState("todas");
  const[audFiltAccion,setAudFiltAccion]=useState("todas");
  const[uploading,setUploading]=useState(false);
  const fileRef=useRef();

  const isAdmin=perfil?.rol===ROL_ADMIN||perfil?.rol_app===ROL_ADMIN;
  const isCirPrincipal=perfil?.rol_app===ROL_CIR_PRINCIPAL;
  const isCirujano=perfil?.rol_app===ROL_CIRUJANO;
  const isEnfermero=perfil?.rol_app===ROL_ENFERMERO;
  const canCreate=isAdmin||isCirPrincipal;
  const canSugerirGuardia=isCirPrincipal||isCirujano;
  const unread=notifs.filter(n=>!n.leida).length;

  // ── Auth ──
  useEffect(()=>{const tok=localStorage.getItem("cirmi_token");if(tok)loadPerfil(tok);else setAuthLoading(false);},[]);
  const loadPerfil=async(tok)=>{
    try{
      const r=await fetch(`${SB_URL}/auth/v1/user`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`}});
      if(!r.ok){handleLogout();return;}
      const u=await r.json();setSession(tok);setAuthUser(u);
      const pf=await dbGet("perfiles",`id=eq.${u.id}`,tok);
      if(pf&&pf.length>0)setPerfil(pf[0]);
    }catch{handleLogout();}finally{setAuthLoading(false);}
  };
  const handleAuth=async(tok,u)=>{setSession(tok);setAuthUser(u);setAuthLoading(true);try{const pf=await dbGet("perfiles",`id=eq.${u.id}`,tok);if(pf&&pf.length>0)setPerfil(pf[0]);}catch{}finally{setAuthLoading(false);};};
  const handleLogout=async()=>{if(session)await authSignOut(session).catch(()=>{});localStorage.removeItem("cirmi_token");setSession(null);setAuthUser(null);setPerfil(null);};

  useEffect(()=>{if(session&&perfil?.estado==="aprobado")loadAll();},[session,perfil?.estado]);
  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[tab]);

  const loadAll=async()=>{
    setLoading(true);
    try{
      const results=await Promise.allSettled([
        dbGet("cirugias","order=fecha.asc,inicio.asc"),
        dbGet("personal","order=nombre.asc&activo=eq.true"),
        dbGet("hospitales","order=nombre.asc&activo=eq.true"),
        dbGet("guardias","order=fecha.asc"),
        dbGet("sugerencias_guardia","order=created_at.desc"),
        dbGet("documentos","order=created_at.desc"),
        dbGet("notificaciones",`usuario_id=eq.${authUser?.id}&order=created_at.desc&limit=20`,session),
        dbGet("quirofanos_estado","order=fecha.asc"),
        dbGet("consultas_estado","order=fecha.asc"),
        dbGet("auditoria","order=created_at.desc&limit=300",session),
        dbGet("ausencias","order=fecha_inicio.asc"),
      ]);
      const ok=(r,fb=[])=>r.status==="fulfilled"?r.value:fb;
      const[rC,rP,rH,rG,rS,rD,rN,rQe,rCe,rAu,rAus]=results;
      const c=ok(rC),p=ok(rP),h=ok(rH),g=ok(rG),s=ok(rS),d=ok(rD),n=ok(rN),qe=ok(rQe),ce=ok(rCe),au=ok(rAu),aus=ok(rAus);
      setCirugias(c);setPersonal(p);setHospitales(h);setGuardias(g);setSugerencias(s);setDocumentos(d);setNotifs(n);setQuirEstados(qe);setConsEstados(ce);setAuditoria(au);setAusencias(aus);
      if(h.length>0&&!guardHosp)setGuardHosp(h[0].nombre);
      if(h.length>0&&!quirHosp)setQuirHosp(h[0].nombre);
      if(h.length>0&&!consHosp)setConsHosp(h[0].nombre);
      if(isAdmin){const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}
    }catch(e){console.error(e);}finally{setLoading(false);}
  };

  const hospNames=hospitales.map(h=>h.nombre);
  const prevM=(y,m,sY,sM)=>{if(m===0){sY(y-1);sM(11);}else sM(m-1);};
  const nextM=(y,m,sY,sM)=>{if(m===11){sY(y+1);sM(0);}else sM(m+1);};

  // ── Notificaciones ──
  const markRead=async(id)=>{try{await dbUpdate("notificaciones",id,{leida:true},session);setNotifs(n=>n.map(x=>x.id===id?{...x,leida:true}:x));}catch{}};
  const markAllRead=async()=>{try{await Promise.all(notifs.filter(n=>!n.leida).map(n=>dbUpdate("notificaciones",n.id,{leida:true},session)));setNotifs(n=>n.map(x=>({...x,leida:true})));}catch{}};
  const createNotif=async(uid,msg)=>{try{await dbInsert("notificaciones",{usuario_id:uid,mensaje:msg},session);}catch{}};
  const logAudit=async(tabla,registro_id,accion,cambios)=>{try{await dbInsert("auditoria",{tabla,registro_id,accion,cambios,usuario_nombre:perfil?.nombre||perfil?.email||"",usuario_id:authUser?.id},session);}catch{}};
  const estaAusente=(nombre,fecha)=>ausencias.some(a=>a.personal_nombre===nombre&&fecha>=a.fecha_inicio&&fecha<=a.fecha_fin);
  const conflictoHorario=(nombre,fecha,inicio,fin,excludeId)=>{
    if(!nombre||!fecha||!inicio||!fin)return null;
    const t2m=(t)=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
    const s=t2m(inicio),e=t2m(fin);
    return cirugias.find(c=>c.id!==excludeId&&c.fecha===fecha&&c.estado!=="Cancelada"&&[c.cirujano,c.ayudante,c.enfermera].includes(nombre)&&c.inicio&&c.fin&&t2m(c.inicio)<e&&t2m(c.fin)>s)||null;
  };
  const addAusencia=async()=>{if(!ausForm.fecha_inicio||!ausForm.fecha_fin||ausForm.fecha_fin<ausForm.fecha_inicio){alert("Fechas inválidas.");return;}setSaving(true);try{await dbInsert("ausencias",{personal_id:form.id,personal_nombre:form.nombre,fecha_inicio:ausForm.fecha_inicio,fecha_fin:ausForm.fecha_fin,motivo:ausForm.motivo||""},session);const au2=await dbGet("ausencias","order=fecha_inicio.asc");setAusencias(au2);setShowAusForm(false);setAusForm({fecha_inicio:todayStr,fecha_fin:todayStr,motivo:""});}catch{alert("Error.");}finally{setSaving(false);}};
  const delAusencia=async(id)=>{if(!confirm("¿Eliminar ausencia?"))return;try{await dbDelete("ausencias",id,session);const au2=await dbGet("ausencias","order=fecha_inicio.asc");setAusencias(au2);}catch{alert("Error.");}};
  const addMiAusencia=async()=>{
    if(!miAusForm.fecha_inicio||!miAusForm.fecha_fin||miAusForm.fecha_fin<miAusForm.fecha_inicio){alert("Fechas inválidas.");return;}
    const miP=personal.find(p=>p.nombre===perfil?.nombre);
    setSaving(true);
    try{
      await dbInsert("ausencias",{personal_id:miP?.id||null,personal_nombre:perfil?.nombre||"",fecha_inicio:miAusForm.fecha_inicio,fecha_fin:miAusForm.fecha_fin,motivo:miAusForm.motivo||""},session);
      const au2=await dbGet("ausencias","order=fecha_inicio.asc");setAusencias(au2);
      setShowMiAusForm(false);setMiAusForm({fecha_inicio:todayStr,fecha_fin:todayStr,motivo:""});
    }catch{alert("Error al guardar.");}finally{setSaving(false);}
  };
  // Opciones de personal para selects — ausentes deshabilitadas según fecha
  const pOpts=(fecha,inclVacio=false,emptyLabel="— Sin asignar —",filtroRol=null)=>{
    const lista=filtroRol?personal.filter(p=>p.rol?.includes(filtroRol)):personal;
    return(<>{inclVacio&&<option value="">{emptyLabel}</option>}{lista.map(p=>{const aus=fecha&&estaAusente(p.nombre,fecha);return<option key={p.id} value={p.nombre} disabled={aus}>{p.nombre}{aus?" (no disponible)":""}</option>;})}</>);
  };
  const toggleNotifProactivas=()=>{const v=!notifProactivas;setNotifProactivas(v);localStorage.setItem("cirmi_notif_proact",String(v));};

  // ── Exportar .ics ──
  const icsDate=(dateStr,timeStr)=>{const d=dateStr.replace(/-/g,"");if(!timeStr)return d;const t=timeStr.replace(":","")+"00";return`${d}T${t}`;};
  const nextDay=(dateStr)=>{const d=new Date(dateStr+"T12:00:00");d.setDate(d.getDate()+1);return fmt(d).replace(/-/g,"");};
  const icsEscape=(s)=>String(s||"").replace(/[\\;,]/g,"\\$&").replace(/\n/g,"\\n");
  const makeICS=(events,calName)=>{
    const rows=["BEGIN:VCALENDAR","VERSION:2.0",`PRODID:-//CIRMI//Gestión Quirúrgica//ES`,`X-WR-CALNAME:CIRMI – ${calName}`,"CALSCALE:GREGORIAN","METHOD:PUBLISH"];
    events.forEach(e=>{
      rows.push("BEGIN:VEVENT");
      rows.push(`UID:${e.uid}`);
      if(e.allDay){rows.push(`DTSTART;VALUE=DATE:${e.start}`);rows.push(`DTEND;VALUE=DATE:${e.end}`);}
      else{rows.push(`DTSTART:${e.start}`);rows.push(`DTEND:${e.end}`);}
      rows.push(`SUMMARY:${icsEscape(e.summary)}`);
      if(e.desc)rows.push(`DESCRIPTION:${icsEscape(e.desc)}`);
      if(e.loc)rows.push(`LOCATION:${icsEscape(e.loc)}`);
      rows.push("END:VEVENT");
    });
    rows.push("END:VCALENDAR");
    return rows.join("\r\n");
  };
  const downloadICS=(content,filename)=>{const blob=new Blob([content],{type:"text/calendar;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);};

  const exportICSAgenda=()=>{
    const evs=cirugias.filter(c=>c.fecha>=todayStr&&c.estado!=="Cancelada"&&(agFiltHosp==="Todos"||c.hospital===agFiltHosp)).map(c=>({
      uid:`cirmi-cx-${c.id}@cirmi`,start:icsDate(c.fecha,c.inicio||"08:00"),end:icsDate(c.fecha,c.fin||"10:00"),allDay:false,
      summary:`🔪 ${c.tipo||"Cirugía"}${c.paciente?" — "+c.paciente:""}`,
      desc:`Cirujano: ${c.cirujano||"—"}\nAyudante: ${c.ayudante||"—"}\nEnfermera: ${c.enfermera||"—"}\nQ: ${c.quirofano||"—"}\nEstado: ${c.estado||"—"}${c.material?"\nMaterial: "+c.material:""}`,
      loc:c.hospital||"",
    }));
    if(!evs.length){alert("No hay cirugías futuras para exportar.");return;}
    downloadICS(makeICS(evs,"Agenda"),`CIRMI-Agenda.ics`);
  };
  const exportICSGuardias=()=>{
    const hosp=guardHosp||hospNames[0];
    const evs=guardias.filter(g=>g.fecha>=todayStr&&(!hosp||g.hospital===hosp)).map(g=>({
      uid:`cirmi-g-${g.id}@cirmi`,start:icsDate(g.fecha,null).replace(/-/g,""),end:nextDay(g.fecha),allDay:true,
      summary:`🛡️ Guardia — ${g.hospital}`,
      desc:`Principal: ${g.cirujano_principal||"—"}\nAyudante: ${g.cirujano_ayudante||"—"}${g.notas?"\nNotas: "+g.notas:""}`,
      loc:g.hospital||"",
    }));
    if(!evs.length){alert("No hay guardias futuras para exportar.");return;}
    downloadICS(makeICS(evs,"Guardias"),`CIRMI-Guardias-${hosp||"todas"}.ics`);
  };
  const exportICSConsultas=()=>{
    const hosp=consHosp||hospNames[0];
    const evs=consEstados.filter(e=>e.fecha>=todayStr&&!e.cerrado&&e.hospital===hosp).map(e=>({
      uid:`cirmi-cons-${e.id}@cirmi`,
      start:icsDate(e.fecha,e.turno==="mañana"?"09:00":"15:00"),end:icsDate(e.fecha,e.turno==="mañana"?"14:00":"20:00"),allDay:false,
      summary:`🩺 Consulta ${e.sala} ${e.turno}${e.cirujano?" — "+e.cirujano:""}`,
      desc:`Hospital: ${e.hospital}\nSala: ${e.sala}\nTurno: ${e.turno}${e.cirujano?"\nCirujano: "+e.cirujano:""}`,
      loc:e.hospital||"",
    }));
    if(!evs.length){alert("No hay consultas abiertas futuras para exportar.");return;}
    downloadICS(makeICS(evs,"Consultas"),`CIRMI-Consultas-${hosp||"todas"}.ics`);
  };
  const exportICSQuirofanos=()=>{
    const hosp=quirHosp||hospNames[0];
    const evs=quirEstados.filter(e=>e.fecha>=todayStr&&!e.cerrado&&e.hospital===hosp).map(e=>({
      uid:`cirmi-quir-${e.id}@cirmi`,
      start:icsDate(e.fecha,e.turno==="mañana"?"08:00":"15:00"),end:icsDate(e.fecha,e.turno==="mañana"?"15:00":"21:00"),allDay:false,
      summary:`🏥 ${e.quirofano} abierto — ${e.turno}`,
      desc:`Hospital: ${e.hospital}\nQuirófano: ${e.quirofano}\nTurno: ${e.turno}`,
      loc:e.hospital||"",
    }));
    if(!evs.length){alert("No hay quirófanos abiertos futuros para exportar.");return;}
    downloadICS(makeICS(evs,"Quirófanos"),`CIRMI-Quirofanos-${hosp||"todos"}.ics`);
  };
  const exportarDia=()=>{const cxs=cxDiaFilt.slice().sort((a,b)=>a.inicio.localeCompare(b.inicio));const rows=cxs.map(c=>`<tr><td>${c.inicio||""}–${c.fin||""}</td><td>${c.tipo||""}</td><td>${c.paciente||""}</td><td>${c.cirujano||""}</td><td>${c.ayudante||""}</td><td>${c.enfermera||""}</td><td>${c.quirofano||""}</td><td>${c.hospital||""}</td><td>${(c.material||"").replace(/</g,"&lt;")}</td><td>${(c.obs||"").replace(/</g,"&lt;")}</td></tr>`).join("");const html=`<!DOCTYPE html><html><head><title>CIRMI – Parte ${selDate}</title><style>body{font-family:Arial,sans-serif;font-size:12px;color:#1C2B3A;margin:20px}h1{font-size:16px;color:#2E3F52;margin-bottom:4px}h2{font-size:12px;font-weight:normal;color:#7A90A4;margin-bottom:18px}table{width:100%;border-collapse:collapse}th{background:#4A6079;color:white;padding:7px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px}td{padding:6px 8px;border-bottom:1px solid #DDE4EB;font-size:11px;vertical-align:top}tr:nth-child(even)td{background:#F2F5F8}footer{margin-top:20px;font-size:10px;color:#7A90A4}@media print{body{margin:0}}</style></head><body><h1>CIRMI — Parte diario</h1><h2>${selDate} · ${cxs.length} intervención${cxs.length!==1?"es":""}${agFiltHosp!=="Todos"?" · "+agFiltHosp:""}</h2>${rows?`<table><thead><tr><th>Hora</th><th>Tipo</th><th>Paciente</th><th>Cirujano</th><th>Ayudante</th><th>Enfermera</th><th>Quirófano</th><th>Hospital</th><th>Material</th><th>Notas</th></tr></thead><tbody>${rows}</tbody></table>`:"<p style='color:#7A90A4;text-align:center;padding:30px'>Sin cirugías este día</p>"}<footer>Generado ${new Date().toLocaleString("es-ES")} · CIRMI Gestión Quirúrgica</footer><script>window.onload=function(){window.print()}<\/script></body></html>`;const w=window.open("","_blank","width=1100,height=720");if(w){w.document.write(html);w.document.close();}};
  const exportarCSVMes=()=>{const hoy=new Date();const cxs=cirugias.filter(c=>{const d=new Date(c.fecha+'T12:00:00');return d.getMonth()===hoy.getMonth()&&d.getFullYear()===hoy.getFullYear()&&(filtFact==="Todos"||c.factura===filtFact);}).sort((a,b)=>a.fecha.localeCompare(b.fecha));const hdr=["ID","Fecha","Tipo","Paciente","Cirujano","Ayudante","Enfermera","Hospital","Quirófano","Estado","Factura","Material","Observaciones"];const rows=cxs.map(c=>[c.id,c.fecha,c.tipo||"",c.paciente||"",c.cirujano||"",c.ayudante||"",c.enfermera||"",c.hospital||"",c.quirofano||"",c.estado||"",c.factura||"",c.material||"",(c.obs||"").replace(/,/g,";")]);const csv=[hdr,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");const blob=new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`CIRMI-${MESES[hoy.getMonth()]}-${hoy.getFullYear()}.csv`;a.click();URL.revokeObjectURL(url);};

  // ── Cirugías ──
  const openNewCx=(fecha,opts={})=>{
    const f=fecha||(tab==="quirofanos"?quirDate:tab==="consultas"?consDate:selDate);
    const hosp=opts.hospital||(tab==="quirofanos"?quirHosp:tab==="consultas"?consHosp:tab==="guardias"?guardHosp:null)||hospNames[0]||"";
    const quir=opts.quirofano||"Q-1";
    setForm({id:newId(),fecha:f,hospital:hosp,quirofano:quir,tipo:"",cirujano:personal[0]?.nombre||"",ayudante:"",enfermera:"",inicio:"08:00",fin:"10:00",estado:"Confirmada",factura:"Pendiente",paciente:"",obs:""});
    setModal("cx_n");
  };
  const saveCx=async()=>{
    const turno=turnoFromHora(form.inicio);
    if(form.fecha&&form.quirofano&&form.inicio&&form.hospital&&esCerradoQuir(form.hospital,form.quirofano,form.fecha,turno)){
      alert(`⛔ ${form.quirofano} está cerrado para el turno ${turno} del ${form.fecha}.\nAbrí el quirófano antes de agendar.`);
      return;
    }
    const ausentes=[form.cirujano,form.ayudante,form.enfermera].filter(Boolean).filter(n=>estaAusente(n,form.fecha));
    if(ausentes.length>0){alert(`⛔ ${ausentes.join(", ")} no está${ausentes.length>1?"n":""} disponible${ausentes.length>1?"s":""} el ${form.fecha}.`);return;}
    setSaving(true);try{if(modal==="cx_n"){await dbInsert("cirugias",form);await logAudit("cirugias",form.id,"insert",{tipo:form.tipo,fecha:form.fecha,hospital:form.hospital});}else{const prev=cirugias.find(c=>c.id===form.id);const{id,...d}=form;await dbUpdate("cirugias",id,d);if(prev){const ch={};["tipo","fecha","inicio","fin","hospital","cirujano","ayudante","enfermera","paciente","estado","factura","obs","quirofano"].forEach(k=>{if(String(prev[k]||"")!==String(form[k]||""))ch[k]={de:prev[k]||"",a:form[k]||""};});if(Object.keys(ch).length>0)await logAudit("cirugias",id,"update",ch);}}await loadAll();setModal(null);}catch{alert("Error al guardar.");}finally{setSaving(false);};
  };;
  const delCx=async(id)=>{if(!confirm("¿Eliminar?"))return;try{await logAudit("cirugias",id,"delete",{});await dbDelete("cirugias",id);await loadAll();setModal(null);}catch{alert("Error.");}};
  const duplicarCx=()=>{setForm({...form,id:newId(),fecha:selDate,estado:"Confirmada",factura:"Pendiente"});setModal("cx_n");};
  const updFact=async(id,v)=>{try{await dbUpdate("cirugias",id,{factura:v});setCirugias(p=>p.map(c=>c.id===id?{...c,factura:v}:c));}catch{alert("Error.");}};

  // ── Guardias ──
  const openGuardia=(fecha,hospital)=>{const e=guardias.find(g=>g.fecha===fecha&&g.hospital===hospital);setForm(e?{...e}:{fecha,hospital,cirujano_principal:"",cirujano_ayudante:"",notas:""});setModal("g_edit");};
  const saveGuardia=async()=>{
    const ausentes=[form.cirujano_principal,form.cirujano_ayudante].filter(Boolean).filter(n=>estaAusente(n,form.fecha));
    if(ausentes.length>0){alert(`⛔ ${ausentes.join(", ")} no está${ausentes.length>1?"n":""} disponible${ausentes.length>1?"s":""} el ${form.fecha}.`);return;}
    setSaving(true);try{if(form.id){const{id,...d}=form;await dbUpdate("guardias",id,d);}else await dbInsert("guardias",form);await loadAll();setModal(null);}catch{alert("Error.");}finally{setSaving(false);};
  };;
  const delGuardia=async(id)=>{if(!confirm("¿Eliminar?"))return;try{await dbDelete("guardias",id);await loadAll();setModal(null);}catch{alert("Error.");}};

  // ── Sugerencias de guardia ──
  const openSugerencia=()=>{setForm({fecha:todayStr,hospital:hospNames[0]||"",nota:""});setModal("sug_n");};
  const saveSugerencia=async()=>{
    if(!form.fecha||!form.hospital){alert("Selecciona fecha y hospital.");return;}
    setSaving(true);
    try{
      await dbInsert("sugerencias_guardia",{...form,usuario_id:authUser?.id,usuario_nombre:perfil?.nombre||perfil?.email,estado:"pendiente"});
      await loadAll();setModal(null);
    }catch{alert("Error.");}finally{setSaving(false);};
  };
  const aprobarSug=async(sug)=>{
    try{
      // Crear guardia real
      const existe=guardias.find(g=>g.fecha===sug.fecha&&g.hospital===sug.hospital);
      if(!existe)await dbInsert("guardias",{fecha:sug.fecha,hospital:sug.hospital,cirujano_principal:sug.usuario_nombre,notas:sug.nota||""});
      await dbUpdate("sugerencias_guardia",sug.id,{estado:"aprobada"});
      await createNotif(sug.usuario_id,`✅ Tu sugerencia de guardia para el ${sug.fecha} en ${sug.hospital} ha sido APROBADA.`);
      await loadAll();
    }catch{alert("Error.");}
  };
  const rechazarSug=async(sug)=>{
    try{
      await dbUpdate("sugerencias_guardia",sug.id,{estado:"rechazada"});
      await createNotif(sug.usuario_id,`❌ Tu sugerencia de guardia para el ${sug.fecha} en ${sug.hospital} ha sido RECHAZADA.`);
      await loadAll();
    }catch{alert("Error.");}
  };

  // ── Documentos ──
  const openSubirDoc=()=>{setForm({nombre:"",descripcion:"",categoria:"Consentimientos",_file:null});setModal("doc_n");};
  const subirDocumento=async()=>{
    if(!form._file||!form.nombre.trim()){alert("Selecciona un archivo y ponle nombre.");return;}
    setUploading(true);
    try{
      const path=`${Date.now()}-${form._file.name.replace(/\s/g,"_")}`;
      await uploadDoc(path,form._file,session);
      await dbInsert("documentos",{nombre:form.nombre,descripcion:form.descripcion||"",categoria:form.categoria,url:path,tamanyo:fmtSize(form._file.size),subido_por:perfil?.nombre||perfil?.email});
      await loadAll();setModal(null);
    }catch{alert("Error al subir archivo.");}finally{setUploading(false);}
  };
  const descargarDoc=async(doc)=>{
    try{const url=await getSignedUrl(doc.url,session);window.open(url,"_blank");}catch{alert("Error al generar enlace.");}
  };
  const eliminarDoc=async(doc)=>{
    if(!confirm("¿Eliminar este documento?"))return;
    try{await deleteStorageFile(doc.url,session);await dbDelete("documentos",doc.id);await loadAll();}catch{alert("Error.");}
  };

  // ── Quirófanos / Consultas ──
  const turnoFromHora=(inicio)=>inicio&&inicio<"15:00"?"mañana":"tarde";
  // Cerrado por defecto: sin registro = cerrado; registro con cerrado=false = abierto
  const esCerradoQuir=(hosp,q,fecha,turno)=>{const r=quirEstados.find(e=>e.hospital===hosp&&e.quirofano===q&&e.fecha===fecha&&e.turno===turno);return r?.cerrado===true;};
  const esCerradoCons=(hosp,s,fecha,turno)=>{const r=consEstados.find(e=>e.hospital===hosp&&e.sala===s&&e.fecha===fecha&&e.turno===turno);return!r||r.cerrado;};
  const saveQuirofanoEstado=async(hospital,quirofano,fecha,turno,estadoNuevo,cirujano="")=>{
    const ex=quirEstados.find(e=>e.hospital===hospital&&e.quirofano===quirofano&&e.fecha===fecha&&e.turno===turno);
    setSaving(true);
    try{
      if(estadoNuevo==="blank"){
        if(ex)await dbDelete("quirofanos_estado",ex.id,session);
      }else if(estadoNuevo==="cerrado"){
        // Cerrado = completo/máximo pacientes. NO se borra el cirujano asignado.
        if(ex)await dbUpdate("quirofanos_estado",ex.id,{cerrado:true},session);
        else await dbInsert("quirofanos_estado",{hospital,quirofano,fecha,turno,cerrado:true,cirujano:""},session);
      }else{
        if(ex)await dbUpdate("quirofanos_estado",ex.id,{cerrado:false,cirujano:cirujano||""},session);
        else await dbInsert("quirofanos_estado",{hospital,quirofano,fecha,turno,cerrado:false,cirujano:cirujano||""},session);
      }
      const qe=await dbGet("quirofanos_estado","order=fecha.asc");setQuirEstados(qe);
      if(estadoNuevo!=="abierto"&&estadoNuevo!=="asignado")setQuirEditSlot(null);
    }catch{alert("Error.");}finally{setSaving(false);}
  };
  const saveConsultaEstado=async(hospital,sala,fecha,turno,estadoNuevo,cirujano="")=>{
    const ex=consEstados.find(e=>e.hospital===hospital&&e.sala===sala&&e.fecha===fecha&&e.turno===turno);
    setSaving(true);
    try{
      if(estadoNuevo==="blank"){
        if(ex)await dbDelete("consultas_estado",ex.id,session);
      }else if(estadoNuevo==="cerrada"){
        if(ex)await dbUpdate("consultas_estado",ex.id,{cerrado:true,cirujano:""},session);
        else await dbInsert("consultas_estado",{hospital,sala,fecha,turno,cerrado:true,cirujano:""},session);
      }else{
        if(ex)await dbUpdate("consultas_estado",ex.id,{cerrado:false,cirujano:cirujano||""},session);
        else await dbInsert("consultas_estado",{hospital,sala,fecha,turno,cerrado:false,cirujano:cirujano||""},session);
      }
      const ce=await dbGet("consultas_estado","order=fecha.asc");setConsEstados(ce);
      if(estadoNuevo!=="abierta"&&estadoNuevo!=="asignada")setConsEditSlot(null);
    }catch{alert("Error.");}finally{setSaving(false);}
  };

  // ── Personal ──
  const openNewP=()=>{setForm({nombre:"",rol:"Cirujano",hospitales:[],tel:"",color:COLORES[0],activo:true});setModal("p_n");};
  const saveP=async()=>{if(!form.nombre?.trim()){alert("Nombre obligatorio.");return;}setSaving(true);try{if(modal==="p_n")await dbInsert("personal",form);else{const{id,...d}=form;await dbUpdate("personal",id,d);}await loadAll();setModal(null);}catch{alert("Error.");}finally{setSaving(false);};};
  const delP=async(id)=>{if(!confirm("¿Eliminar?"))return;try{await dbUpdate("personal",id,{activo:false});await loadAll();setModal(null);}catch{alert("Error.");}};
  const togH=(h)=>{const a=form.hospitales||[];setForm({...form,hospitales:a.includes(h)?a.filter(x=>x!==h):[...a,h]});};

  // ── Hospitales ──
  const openNewH=()=>{setForm({nombre:"",direccion:"",activo:true});setModal("h_n");};
  const saveH=async()=>{if(!form.nombre?.trim()){alert("Nombre obligatorio.");return;}setSaving(true);try{if(modal==="h_n")await dbInsert("hospitales",form);else{const{id,...d}=form;await dbUpdate("hospitales",id,d);}await loadAll();setModal(null);}catch{alert("Error.");}finally{setSaving(false);};};
  const delH=async(id)=>{if(!confirm("¿Eliminar?"))return;try{await dbUpdate("hospitales",id,{activo:false});await loadAll();setModal(null);}catch{alert("Error.");}};

  // ── Usuarios (admin) ──
  const aprobarU=async(id)=>{try{await fetch(`${API("perfiles")}?id=eq.${id}`,{method:"PATCH",headers:H(session),body:JSON.stringify({estado:"aprobado"})});const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}catch{alert("Error.");}};
  const bloquearU=async(id)=>{if(!confirm("¿Bloquear?"))return;try{await fetch(`${API("perfiles")}?id=eq.${id}`,{method:"PATCH",headers:H(session),body:JSON.stringify({estado:"bloqueado"})});const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}catch{alert("Error.");}};
  const hacerAdmin=async(id)=>{if(!confirm("¿Dar permisos de admin?"))return;try{await fetch(`${API("perfiles")}?id=eq.${id}`,{method:"PATCH",headers:H(session),body:JSON.stringify({rol:"admin",rol_app:"admin"})});const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}catch{alert("Error.");}};
  const cambiarRolApp=async(id,rolApp)=>{try{await fetch(`${API("perfiles")}?id=eq.${id}`,{method:"PATCH",headers:H(session),body:JSON.stringify({rol_app:rolApp})});const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}catch{alert("Error.");}};
  const vincularPersonal=async(userId,personalNombre)=>{try{await fetch(`${API("perfiles")}?id=eq.${userId}`,{method:"PATCH",headers:H(session),body:JSON.stringify({nombre:personalNombre})});const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}catch{alert("Error al vincular.");}};
  const aprobarYVincular=async(userId,personalNombre)=>{try{await fetch(`${API("perfiles")}?id=eq.${userId}`,{method:"PATCH",headers:H(session),body:JSON.stringify({estado:"aprobado",nombre:personalNombre||undefined})});const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}catch{alert("Error.");}};
;

  // ── Export PDF semana ──
  const exportarSemana=()=>{
    const sd=new Date(selDate+'T12:00:00');const dow=sd.getDay();const monOff=(dow===0)?-6:1-dow;const mon=new Date(sd);mon.setDate(mon.getDate()+monOff);
    const wDates=Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(d.getDate()+i);return fmt(d);});
    const cxW=cirugias.filter(c=>wDates.includes(c.fecha)&&(agFiltHosp==="Todos"||c.hospital===agFiltHosp)&&(agFiltEst==="Todos"||c.estado===agFiltEst)).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.inicio.localeCompare(b.inicio));
    const rows=cxW.map(c=>`<tr><td>${c.fecha}</td><td>${DIAS_H[(new Date(c.fecha+'T12:00:00').getDay()+6)%7]}</td><td>${c.inicio||""}–${c.fin||""}</td><td>${c.tipo||""}</td><td>${c.paciente||""}</td><td>${c.cirujano||""}</td><td>${c.ayudante||""}</td><td>${c.hospital||""}</td><td>${c.estado||""}</td></tr>`).join("");
    const html=`<!DOCTYPE html><html><head><title>CIRMI – Semana ${wDates[0]}</title><style>body{font-family:Arial,sans-serif;font-size:12px;color:#1C2B3A;margin:20px}h1{font-size:16px;margin-bottom:4px;color:#2E3F52}h2{font-size:12px;font-weight:normal;color:#7A90A4;margin-bottom:18px}table{width:100%;border-collapse:collapse}th{background:#4A6079;color:white;padding:7px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px}td{padding:6px 8px;border-bottom:1px solid #DDE4EB;font-size:11px}tr:nth-child(even)td{background:#F2F5F8}footer{margin-top:20px;font-size:10px;color:#7A90A4}@media print{body{margin:0}button{display:none}}</style></head><body><h1>CIRMI — Parte semanal</h1><h2>Semana del ${wDates[0]} al ${wDates[6]}${agFiltHosp!=="Todos"?" · "+agFiltHosp:""}${agFiltEst!=="Todos"?" · "+agFiltEst:""} · ${cxW.length} intervención${cxW.length!==1?"es":""}</h2>${rows.length?`<table><thead><tr><th>Fecha</th><th>Día</th><th>Hora</th><th>Tipo</th><th>Paciente</th><th>Cirujano</th><th>Ayudante</th><th>Hospital</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`:"<p style='color:#7A90A4;text-align:center;padding:30px'>Sin cirugías en esta semana</p>"}<footer>Generado ${new Date().toLocaleString("es-ES")} · CIRMI Gestión Quirúrgica</footer><script>window.onload=function(){window.print()}<\/script></body></html>`;
    const w=window.open("","_blank","width=1100,height=720");if(w){w.document.write(html);w.document.close();}
  };

  // ── Stats ──
  const pendFact=cirugias.filter(c=>c.factura==="Pendiente").length;
  const hoyN=cirugias.filter(c=>c.fecha===todayStr).length;
  const mesN=cirugias.filter(c=>{const d=new Date(c.fecha);return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear();}).length;
  const cxDia=cirugias.filter(c=>c.fecha===selDate);
  const cxDiaFilt=cxDia.filter(c=>(agFiltHosp==="Todos"||c.hospital===agFiltHosp)&&(agFiltEst==="Todos"||c.estado===agFiltEst));
  const sugPend=sugerencias.filter(s=>s.estado==="pendiente");
  const alertasProact=notifProactivas?[
    ...cirugias.filter(c=>{const diff=(new Date(c.fecha+'T12:00:00')-today)/86400000;return diff>=0&&diff<=2&&c.estado!=="Cancelada"&&(!c.ayudante||!c.enfermera);}).map(c=>({tipo:"cx",msg:`Cirugía ${c.fecha} — ${c.tipo||"sin tipo"}: ${[!c.ayudante&&"sin ayudante",!c.enfermera&&"sin enfermera"].filter(Boolean).join(" y ")} · ${c.hospital}`})),
    ...hospNames.flatMap(h=>{const n14=Array.from({length:14},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()+i);return fmt(d);}).filter(f=>!guardias.find(g=>g.fecha===f&&g.hospital===h)).length;return n14>2?[{tipo:"guardia",msg:`${n14} días sin guardia asignada en los próximos 14 días · ${h}`}]:[];}),
    ...cirugias.filter(c=>c.fecha>=todayStr&&c.estado!=="Cancelada"&&esCerradoQuir(c.hospital,c.quirofano,c.fecha,turnoFromHora(c.inicio))).map(c=>({tipo:"quir",msg:`${c.quirofano} CERRADO con cirugía agendada: ${c.tipo||"sin tipo"} el ${c.fecha} ${c.inicio}–${c.fin} · ${c.hospital}`,fecha:c.fecha})),
  ]:[];
  const cxProg=cirugias.filter(c=>(filtCir==="Todos"||c.cirujano===filtCir||c.ayudante===filtCir)&&(filtCli==="Todos"||c.hospital===filtCli)).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.inicio.localeCompare(b.inicio));
  const docsFilt=documentos.filter(d=>filtCat==="Todos"||d.categoria===filtCat);

  // ── TABS config ──
  const TABS=[
    ["inicio","🏠","Inicio"],
    ["agenda","📅","Agenda"],
    ["programacion","👨‍⚕️","Programa"],
    ["guardias","🛡️","Guardias"],
    ["quirofanos","🏥","Quirófanos"],
    ["consultas","🩺","Consultas"],
    ["hospitales","🏨","Hospitales"],
    ["personal","👥","Personal"],
    ["documentos","📁","Documentos"],
    ...(isAdmin?[["facturacion","💰","Facturación"],["config","⚙️","Config"]]:[]),
  ];

  // ── CSS ──
  const css=`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    button{cursor:pointer;font-family:inherit}
    input,select,textarea{font-family:inherit}
    .card{background:white;border-radius:14px;box-shadow:0 1px 4px rgba(46,63,82,.08),0 4px 16px rgba(46,63,82,.04)}
    .btn-gold{background:${B.gold};color:${B.slateDark};border:none;padding:10px 18px;border-radius:9px;font-size:14px;font-weight:700;transition:all .15s}
    .btn-gold:hover{background:${B.goldDark};transform:translateY(-1px)}
    .btn-gold:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .btn-sec{background:white;color:${B.slate};border:1.5px solid ${B.border};padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;transition:all .15s;cursor:pointer}
    .btn-sec:hover{border-color:${B.slateLight};background:#F8FAFB}
    .btn-green{background:#E6F4EC;color:#2E7D52;border:1.5px solid #86EFAC;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}
    .btn-green:hover{background:#D1FAE5}
    .btn-danger{background:#FEF2F2;color:#DC2626;border:1.5px solid #FECACA;padding:8px 16px;border-radius:9px;font-size:13px;cursor:pointer}
    .btn-sm-danger{background:#FEF2F2;color:#DC2626;border:1.5px solid #FECACA;padding:4px 8px;border-radius:7px;font-size:11px;cursor:pointer}
    .inp{width:100%;padding:9px 12px;border:1.5px solid ${B.border};border-radius:8px;font-size:14px;outline:none;transition:border .15s;color:${B.text};background:white}
    .inp:focus{border-color:${B.slate}}
    .overlay{position:fixed;inset:0;background:rgba(30,43,58,.5);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
    .modal{background:white;border-radius:18px;padding:28px;max-width:580px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 30px 80px rgba(30,43,58,.25)}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}
    .stat-card{background:white;border-radius:13px;padding:16px 18px;box-shadow:0 1px 3px rgba(46,63,82,.06)}
    .config-item{display:flex;align-items:center;justify-content:space-between;padding:12px 15px;background:white;border:1.5px solid ${B.border};border-radius:11px;margin-bottom:7px}
    .config-item:hover{border-color:${B.slateLight}}
    .subtab{padding:8px 14px;border:none;background:none;font-size:13px;font-weight:500;color:${B.muted};cursor:pointer;border-bottom:2px solid transparent}
    .subtab.active{color:${B.slate};font-weight:700;border-bottom-color:${B.slate}}
    .avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;flex-shrink:0}
    .cal-day{border-bottom:1px solid ${B.border};padding:6px;cursor:pointer;transition:background .1s;position:relative;min-height:76px;}
    .cal-day:hover{background:#F0F4F8}
    .guard-day{border-bottom:1px solid ${B.border};padding:5px;cursor:pointer;transition:background .1s;min-height:68px;}
    .guard-day:hover{background:#F5F8FC}
    .notif-panel{position:absolute;right:0;top:calc(100% + 8px);width:320px;background:white;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.18);z-index:300;overflow:hidden}
    @keyframes spin{to{transform:rotate(360deg)}}

    /* MOBILE */
    @media(max-width:767px){
      .form-grid{grid-template-columns:1fr!important}
      .modal{padding:20px;border-radius:14px}
      .stat-card{padding:12px 14px}
      .hide-mobile{display:none!important}
      .full-mobile{width:100%!important}
      .cal-day{min-height:58px!important;padding:3px 2px!important}
      .guard-day{min-height:50px!important;padding:3px 2px!important}
      .cal-day>div:first-child,
      .guard-day>div:first-child{margin-bottom:1px!important}
    }
  `;

  // ── Auth gates ──
  if(authLoading)return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${B.slateDark},${B.slate})`,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{css}</style><Spin text="Iniciando CIRMI..."/></div>);
  if(!session)return(<><style>{css}</style><AuthScreen onAuth={handleAuth}/></>);
  if(!perfil||perfil.estado==="pendiente")return(<><style>{css}</style><PendingScreen perfil={perfil} onLogout={handleLogout}/></>);
  if(perfil.estado==="bloqueado")return(<><style>{css}</style><BlockedScreen onLogout={handleLogout}/></>);

  const navButton=(id,icon,label)=>(
    <button key={id} onClick={()=>{setTab(id);setShowNav(false);}}
      style={{display:"flex",flexDirection:mob?"row":"column",alignItems:"center",gap:mob?10:3,padding:mob?"12px 16px":"8px 12px",border:"none",background:tab===id?(mob?`${B.gold}20`:B.gold):"none",color:tab===id?(mob?B.goldDark:B.slateDark):"rgba(255,255,255,.6)",borderRadius:8,transition:"all .15s",width:mob?"100%":"auto",textAlign:mob?"left":"center",cursor:"pointer",fontSize:mob?14:11,fontWeight:tab===id?700:500}}>
      <span style={{fontSize:mob?18:16}}>{icon}</span>
      <span>{label}</span>
      {id==="guardias"&&sugPend.length>0&&isAdmin&&<span style={{background:"#EF4444",color:"white",borderRadius:10,padding:"1px 5px",fontSize:9,fontWeight:700,marginLeft:"auto"}}>{sugPend.length}</span>}
    </button>
  );

  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:B.bg,minHeight:"100vh",color:B.text}}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={{background:B.slateDark,padding:`0 ${mob?14:20}px`,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 16px rgba(20,30,42,.35)"}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <svg width="72" height="22" viewBox="0 0 72 22"><text x="0" y="18" fontFamily="Georgia,serif" fontSize="20" fontWeight="700" fill={B.white} letterSpacing="1">CIRMI</text><line x1="3" y1="2" x2="11" y2="20" stroke={B.gold} strokeWidth="1.8" strokeLinecap="round"/></svg>
            {!mob&&<><div style={{width:1,height:14,background:"rgba(255,255,255,.15)"}}/><span style={{color:"rgba(255,255,255,.4)",fontSize:10}}>Gestión Quirúrgica</span></>}
          </div>

          {/* Desktop nav */}
          {!mob&&(
            <div style={{display:"flex",gap:1,overflowX:"auto"}}>
              {TABS.map(([id,icon,label])=>navButton(id,icon,label))}
            </div>
          )}

          {/* Right actions */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* Búsqueda */}
            <button onClick={()=>{setShowBusqueda(true);setQueryBusq("");}} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:16}}>🔍</button>
            {/* Notificaciones */}
            {(()=>{
              const pendUsers=isAdmin?perfiles.filter(p=>p.estado==="pendiente"):[];
              const totalBadge=unread+(pendUsers.length);
              return(
              <div style={{position:"relative"}}>
                <button onClick={()=>setShowNotifs(!showNotifs)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:16,position:"relative"}}>
                  🔔
                  {totalBadge>0&&<span style={{position:"absolute",top:-3,right:-3,background:"#EF4444",color:"white",borderRadius:10,padding:"0 4px",fontSize:9,fontWeight:700,minWidth:16,textAlign:"center"}}>{totalBadge}</span>}
                </button>
                {showNotifs&&(
                  <div className="notif-panel">
                    <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontWeight:700,fontSize:14}}>Notificaciones</div>
                      {unread>0&&<button className="btn-sec" style={{padding:"3px 8px",fontSize:11}} onClick={markAllRead}>Marcar leídas</button>}
                    </div>
                    {/* Solicitudes pendientes de acceso — solo admin */}
                    {pendUsers.length>0&&(
                      <div style={{background:"#FFFBEB",borderBottom:`1px solid ${B.border}`}}>
                        <div style={{padding:"8px 16px 4px",fontSize:10,fontWeight:700,color:B.goldDark,textTransform:"uppercase",letterSpacing:.5}}>
                          ⏳ Solicitudes de acceso ({pendUsers.length})
                        </div>
                        {pendUsers.map(u=>(
                          <div key={u.id} style={{padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,borderBottom:`1px solid ${B.goldLight}`}}>
                            <div>
                              <div style={{fontSize:13,fontWeight:600}}>{u.nombre||"Sin nombre"}</div>
                              <div style={{fontSize:11,color:B.muted}}>{u.email}</div>
                            </div>
                            <button className="btn-green" style={{padding:"4px 10px",fontSize:11,whiteSpace:"nowrap"}}
                              onClick={()=>{aprobarU(u.id);setShowNotifs(false);setTab("config");setConfigTab("usuarios");}}>
                              ✓ Aprobar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{maxHeight:260,overflowY:"auto"}}>
                      {notifs.length===0&&pendUsers.length===0?<div style={{padding:"20px",textAlign:"center",color:B.muted,fontSize:13}}>Sin notificaciones</div>:notifs.map(n=>(
                        <div key={n.id} onClick={()=>markRead(n.id)} style={{padding:"12px 16px",borderBottom:`1px solid ${B.border}`,background:n.leida?"white":"#F0F7FF",cursor:"pointer",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background=B.bg} onMouseLeave={e=>e.currentTarget.style.background=n.leida?"white":"#F0F7FF"}>
                          <div style={{fontSize:13,lineHeight:1.5}}>{n.mensaje}</div>
                          <div style={{fontSize:10,color:B.muted,marginTop:3}}>{n.created_at?.split("T")[0]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              );
            })()}
            {pendFact>0&&!mob&&isAdmin&&<div onClick={()=>{setTab("facturacion");setFiltFact("Pendiente");}} style={{background:B.goldLight,color:B.goldDark,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",border:`1px solid ${B.gold}`}}>⚠ {pendFact}</div>}
            {/* User */}
            {!mob&&<div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.1)",borderRadius:20,padding:"3px 10px 3px 5px"}}>
              <div className="avatar" style={{background:isAdmin?B.gold:B.slateLight,width:22,height:22,fontSize:9,color:isAdmin?B.slateDark:"white"}}>{(perfil?.nombre||perfil?.email||"?")[0].toUpperCase()}</div>
              <span style={{color:"white",fontSize:11,fontWeight:500}}>{perfil?.nombre?.split(" ")[0]||perfil?.email}</span>
              {isAdmin&&<span style={{background:B.gold,color:B.slateDark,borderRadius:8,padding:"1px 5px",fontSize:9,fontWeight:700}}>ADMIN</span>}
            </div>}
            {canCreate&&<button onClick={()=>openNewCx()} className="btn-gold" style={{padding:"6px 12px",fontSize:12}}>+ Nueva</button>}
            {mob&&<button onClick={()=>setShowNav(!showNav)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,width:36,height:36,color:"white",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>☰</button>}
            {!mob&&<button onClick={handleLogout} className="btn-sec" style={{padding:"4px 10px",fontSize:11}}>Salir</button>}
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mob&&showNav&&(
          <div style={{borderTop:`1px solid rgba(255,255,255,.1)`,padding:"8px 0",display:"flex",flexDirection:"column",gap:2,maxHeight:"60vh",overflowY:"auto"}}>
            {TABS.map(([id,icon,label])=>navButton(id,icon,label))}
            <div style={{borderTop:`1px solid rgba(255,255,255,.1)`,marginTop:4,paddingTop:8}}>
              <button onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",border:"none",background:"none",color:"rgba(255,255,255,.5)",fontSize:13,width:"100%",cursor:"pointer"}}>🚪 Cerrar sesión</button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      {mob&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:B.slateDark,zIndex:90,borderTop:`1px solid rgba(255,255,255,.1)`,display:"flex",justifyContent:"space-around",padding:"6px 0 env(safe-area-inset-bottom)"}}>
          {[["agenda","📅"],["guardias","🛡️"],["documentos","📁"],["facturacion","💰"],["config","⚙️"]].filter(([id])=>(id!=="config"&&id!=="facturacion")||isAdmin).map(([id,icon])=>(
            <button key={id} onClick={()=>setTab(id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 12px",border:"none",background:"none",color:tab===id?B.gold:"rgba(255,255,255,.5)",fontSize:tab===id?20:18,fontWeight:700,cursor:"pointer",position:"relative",minWidth:48}}>
              {icon}
              <span style={{fontSize:9,fontWeight:600}}>{{"agenda":"Agenda","guardias":"Guardias","documentos":"Docs","facturacion":"Facturas","config":"Config"}[id]}</span>
              {id==="guardias"&&sugPend.length>0&&isAdmin&&<span style={{position:"absolute",top:0,right:6,background:"#EF4444",color:"white",borderRadius:10,padding:"0 3px",fontSize:8,fontWeight:700}}>{sugPend.length}</span>}
            </button>
          ))}
        </div>
      )}

      <div style={{maxWidth:1280,margin:"0 auto",padding:mob?"16px 14px":`22px 20px`,paddingBottom:mob?80:22}}>

        {/* STATS */}
        {(()=>{
          const hoyConf=cirugias.filter(c=>c.fecha===todayStr&&c.estado==="Confirmada").length;
          const hoyPend=cirugias.filter(c=>c.fecha===todayStr&&c.estado==="Pendiente").length;
          const prox7=cirugias.filter(c=>{const diff=(new Date(c.fecha+'T12:00:00')-today)/86400000;return diff>0&&diff<=7&&c.estado!=="Cancelada";}).length;
          const cards=[
            {label:"Hoy",value:hoyN,icon:"🔪",accent:hoyN>0?B.slate:"#94A3B8",
              sub:hoyN>0?`${hoyConf} confirmadas · ${hoyPend} pendientes`:"Sin cirugías",
              onClick:()=>{setSelDate(todayStr);setTab("agenda");}},
            {label:"Próx. 7 días",value:prox7,icon:"📅",accent:prox7>0?B.slateLight:"#94A3B8",
              sub:`${mesN} en el mes actual`,
              onClick:()=>setTab("agenda")},
            ...(isAdmin?[{label:"Fact. pendientes",value:pendFact,icon:"💰",
              accent:pendFact>0?B.goldDark:"#94A3B8",
              sub:pendFact>0?"Requieren atención":"Al día ✓",
              onClick:()=>{setTab("facturacion");setFiltFact("Pendiente");}}]:[]),
            {label:"Alertas",value:alertasProact.length,icon:"⚠️",
              accent:alertasProact.length>0?"#DC2626":"#94A3B8",
              sub:alertasProact.length>0?"Requieren revisión":"Sin alertas ✓",
              onClick:()=>setTab("inicio")},
          ];
          return(
            <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:20}}>
              {cards.map(s=>(
                <div key={s.label} onClick={s.onClick} className="stat-card"
                  style={{borderTop:`3px solid ${s.accent}`,cursor:"pointer",transition:"all .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(46,63,82,.13)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${s.accent}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
                  </div>
                  <div style={{fontSize:mob?26:32,fontWeight:800,color:s.accent,lineHeight:1,marginBottom:3}}>{s.value}</div>
                  <div style={{fontSize:12,fontWeight:600,color:B.text,marginBottom:2}}>{s.label}</div>
                  <div style={{fontSize:10,color:B.muted}}>{s.sub}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {loading?<Spin/>:(<>

          {/* ══ INICIO ══ */}
          {tab==="inicio"&&(()=>{
            const miNombre=perfil?.nombre||"";
            const saludo=(new Date().getHours()<14?"Buenos días":"Buenas tardes");
            const misCx=cirugias.filter(c=>c.fecha>=todayStr&&(c.cirujano===miNombre||c.ayudante===miNombre||c.enfermera===miNombre)).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.inicio.localeCompare(b.inicio));
            const misGuard=guardias.filter(g=>g.fecha>=todayStr&&(g.cirujano_principal===miNombre||g.cirujano_ayudante===miNombre)).sort((a,b)=>a.fecha.localeCompare(b.fecha));
            const hoyMisCx=misCx.filter(c=>c.fecha===todayStr);
            const semMisCx=misCx.filter(c=>{const d=new Date(c.fecha);const s=new Date(todayStr);const e=new Date(todayStr);e.setDate(e.getDate()+7);return d>=s&&d<=e;});
            return(
              <div>
                {/* Saludo */}
                <div style={{background:`linear-gradient(135deg,${B.slateDark},${B.slate})`,borderRadius:16,padding:mob?"18px 20px":"22px 28px",marginBottom:20,color:"white"}}>
                  <div style={{fontSize:mob?18:22,fontWeight:700,marginBottom:4}}>{saludo}, {miNombre.split(" ")[0]||"Doctor"} 👋</div>
                  <div style={{fontSize:13,opacity:.75}}>
                    {hoyMisCx.length>0?`Tienes ${hoyMisCx.length} cirugía${hoyMisCx.length>1?"s":""} hoy`:"Sin cirugías hoy"}
                    {semMisCx.length>0&&` · ${semMisCx.length} esta semana`}
                  </div>
                </div>

                {/* Stats personales */}
                {(()=>{
                  const proxCx=misCx.find(c=>c.fecha>todayStr)||misCx[0];
                  const proxGuard=misGuard[0];
                  const misCxConf=misCx.filter(c=>c.estado==="Confirmada").length;
                  const misCxHosp=[...new Set(misCx.map(c=>c.hospital))];
                  const pcards=[
                    {label:"Hoy",value:hoyMisCx.length,icon:"🔪",
                      accent:hoyMisCx.length>0?"#2E7D52":"#94A3B8",
                      sub:hoyMisCx.length>0?`${hoyMisCx[0].inicio}–${hoyMisCx[0].fin} · ${hoyMisCx[0].hospital}`:"Sin cirugías hoy",
                      onClick:()=>{setSelDate(todayStr);setTab("agenda");}},
                    {label:"Esta semana",value:semMisCx.length,icon:"📅",
                      accent:semMisCx.length>0?B.slate:"#94A3B8",
                      sub:proxCx&&proxCx.fecha>todayStr?`Próxima: ${proxCx.fecha} · ${proxCx.inicio}`:hoyMisCx.length>0?"Todas hoy":"Sin cirugías",
                      onClick:()=>setTab("agenda")},
                    {label:"Total próximas",value:misCx.length,icon:"📊",
                      accent:B.slateDark,
                      sub:misCx.length>0?`${misCxConf} confirmadas · ${misCxHosp.length} hospital${misCxHosp.length!==1?"es":""}`:"Sin cirugías",
                      onClick:()=>setTab("programacion")},
                    {label:"Guardias",value:misGuard.length,icon:"🛡️",
                      accent:misGuard.length>0?"#3D6B8C":"#94A3B8",
                      sub:proxGuard?`Próxima: ${proxGuard.fecha} · ${proxGuard.hospital}`:"Sin guardias",
                      onClick:()=>setTab("guardias")},
                  ];
                  return(
                    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:20}}>
                      {pcards.map(s=>(
                        <div key={s.label} onClick={s.onClick} className="stat-card"
                          style={{borderTop:`3px solid ${s.accent}`,cursor:"pointer",transition:"all .15s"}}
                          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(46,63,82,.13)"}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
                          <div style={{width:34,height:34,borderRadius:9,background:`${s.accent}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div>
                          <div style={{fontSize:mob?26:32,fontWeight:800,color:s.accent,lineHeight:1,marginBottom:3}}>{s.value}</div>
                          <div style={{fontSize:12,fontWeight:600,color:B.text,marginBottom:2}}>{s.label}</div>
                          <div style={{fontSize:10,color:B.muted}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:16}}>
                  {/* Mis próximas cirugías */}
                  <div className="card" style={{overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontWeight:700,fontSize:14,color:B.slateDark}}>🔪 Mis próximas cirugías</div>
                      <button className="btn-sec" style={{padding:"3px 9px",fontSize:11}} onClick={()=>setTab("agenda")}>Ver agenda →</button>
                    </div>
                    {misCx.length===0?<div style={{padding:"24px",textAlign:"center",color:B.muted,fontSize:13}}>Sin cirugías próximas</div>:misCx.slice(0,5).map(c=>(
                      <div key={c.id} style={{padding:"10px 16px",borderBottom:`1px solid ${B.border}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                          <div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:B.slate,fontWeight:600}}>{c.fecha} · {c.inicio}–{c.fin}</div>
                            <div style={{fontWeight:600,fontSize:13,marginTop:1}}>{c.tipo}</div>
                            <div style={{fontSize:11,color:B.muted}}>{c.hospital} · {c.cirujano===miNombre?"Principal":"Ayudante"}</div>
                          </div>
                          <Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mis guardias */}
                  <div className="card" style={{overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontWeight:700,fontSize:14,color:B.slateDark}}>🛡️ Mis guardias próximas</div>
                      <button className="btn-sec" style={{padding:"3px 9px",fontSize:11}} onClick={()=>setTab("guardias")}>Ver guardias →</button>
                    </div>
                    {misGuard.length===0?<div style={{padding:"24px",textAlign:"center",color:B.muted,fontSize:13}}>Sin guardias próximas</div>:misGuard.slice(0,5).map(g=>(
                      <div key={g.id} style={{padding:"10px 16px",borderBottom:`1px solid ${B.border}`}}>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:B.slate,fontWeight:600}}>{g.fecha}</div>
                        <div style={{fontWeight:600,fontSize:13,marginTop:1}}>{g.hospital}</div>
                        <div style={{fontSize:11,color:B.muted}}>{g.cirujano_principal===miNombre?"Principal":"Ayudante"}</div>
                      </div>
                    ))}
                  </div>
                </div>

              {/* Mi disponibilidad */}
              {(()=>{
                const misAus=ausencias.filter(a=>a.personal_nombre===miNombre&&a.fecha_fin>=todayStr).sort((a,b)=>a.fecha_inicio.localeCompare(b.fecha_inicio));
                return(
                  <div style={{marginTop:16,background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(46,63,82,.07)"}}>
                    <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:B.slateDark}}>📅 Mi disponibilidad</div>
                        <div style={{fontSize:11,color:B.muted,marginTop:1}}>Días no disponible · los bloqueados no se pueden asignar en cirugías ni guardias</div>
                      </div>
                      <button className="btn-sec" style={{padding:"4px 10px",fontSize:11,whiteSpace:"nowrap"}} onClick={()=>{setShowMiAusForm(!showMiAusForm);setMiAusForm({fecha_inicio:todayStr,fecha_fin:todayStr,motivo:""});}}>+ Añadir</button>
                    </div>
                    {showMiAusForm&&(
                      <div style={{padding:"12px 16px",background:B.bg,borderBottom:`1px solid ${B.border}`,display:"flex",flexDirection:"column",gap:9}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <FG label="Desde"><input type="date" className="inp" value={miAusForm.fecha_inicio} min={todayStr} onChange={e=>setMiAusForm({...miAusForm,fecha_inicio:e.target.value})}/></FG>
                          <FG label="Hasta"><input type="date" className="inp" value={miAusForm.fecha_fin} min={miAusForm.fecha_inicio||todayStr} onChange={e=>setMiAusForm({...miAusForm,fecha_fin:e.target.value})}/></FG>
                        </div>
                        <FG label="Motivo (opcional)"><input className="inp" value={miAusForm.motivo} onChange={e=>setMiAusForm({...miAusForm,motivo:e.target.value})} placeholder="Vacaciones, baja médica, congreso..."/></FG>
                        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                          <button className="btn-sec" style={{fontSize:12}} onClick={()=>setShowMiAusForm(false)}>Cancelar</button>
                          <button className="btn-gold" style={{fontSize:12}} onClick={addMiAusencia} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
                        </div>
                      </div>
                    )}
                    {misAus.length===0?(
                      <div style={{padding:"18px 16px",fontSize:12,color:B.muted,fontStyle:"italic"}}>Sin períodos de no disponibilidad registrados</div>
                    ):misAus.map(a=>(
                      <div key={a.id} style={{padding:"10px 16px",borderBottom:`1px solid ${B.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:"#B91C1C",flexShrink:0}}/>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:B.text}}>{a.fecha_inicio===a.fecha_fin?a.fecha_inicio:`${a.fecha_inicio} → ${a.fecha_fin}`}</div>
                            {a.motivo&&<div style={{fontSize:11,color:B.muted}}>{a.motivo}</div>}
                          </div>
                        </div>
                        <button onClick={()=>delAusencia(a.id)} style={{border:"none",background:"transparent",cursor:"pointer",color:"#B91C1C",fontSize:14,padding:"2px 8px",borderRadius:6,flexShrink:0}}>✕</button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Alertas proactivas */}
              {alertasProact.length>0&&(
                <div style={{marginTop:16,background:"white",borderRadius:14,border:`1.5px solid ${B.gold}`,overflow:"hidden"}}>
                  <div style={{padding:"10px 16px",background:B.goldLight,borderBottom:`1px solid ${B.gold}`,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:15}}>⚠️</span>
                    <div style={{fontWeight:700,fontSize:13,color:B.goldDark}}>Alertas ({alertasProact.length})</div>
                  </div>
                  {alertasProact.map((a,i)=>(
                    <div key={i} style={{padding:"9px 16px",borderBottom:i<alertasProact.length-1?`1px solid ${B.border}`:"none",fontSize:12,color:a.tipo==="quir"?"#B91C1C":B.text,display:"flex",gap:8,alignItems:"flex-start",background:a.tipo==="quir"?"#FEF2F2":"transparent"}}>
                      <span style={{fontSize:13,flexShrink:0}}>{a.tipo==="cx"?"🔪":a.tipo==="quir"?"⛔":"🛡️"}</span>
                      <span style={{flex:1}}>{a.msg}</span>
                      {a.tipo==="quir"&&a.fecha&&<button onClick={()=>{setSelDate(a.fecha);setTab("agenda");}} style={{flexShrink:0,padding:"2px 8px",borderRadius:6,border:"1px solid #FECACA",background:"white",fontSize:11,color:"#B91C1C",cursor:"pointer",fontWeight:600}}>Ver →</button>}
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle notificaciones proactivas */}
              <div style={{marginTop:16,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"white",borderRadius:10,border:`1px solid ${B.border}`}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:B.text}}>🔔 Alertas proactivas</div>
                  <div style={{fontSize:11,color:B.muted}}>Avisos de cirugías sin equipo y guardias sin cubrir</div>
                </div>
                <div onClick={toggleNotifProactivas} style={{width:40,height:22,borderRadius:11,background:notifProactivas?B.slate:B.border,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:notifProactivas?20:3,width:16,height:16,borderRadius:"50%",background:"white",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                </div>
              </div>
              </div>
            );
          })()}

          {/* ══ AGENDA ══ */}
          {tab==="agenda"&&(
            <div>
              {/* Toolbar */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",gap:3,background:B.bg,borderRadius:9,padding:3}}>
                  {[["mes","Mes"],["semana","Semana"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setAgendaVista(v)} style={{padding:"6px 14px",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:agendaVista===v?"white":B.bg,color:agendaVista===v?B.slateDark:B.muted,boxShadow:agendaVista===v?"0 1px 3px rgba(0,0,0,.08)":"none",transition:"all .15s"}}>{l}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  <select className="inp" style={{width:mob?"100%":160,padding:"6px 10px",fontSize:12}} value={agFiltHosp} onChange={e=>setAgFiltHosp(e.target.value)}>
                    <option value="Todos">Todos los hospitales</option>
                    {hospNames.map(h=><option key={h}>{h}</option>)}
                  </select>
                  <select className="inp" style={{width:mob?"100%":130,padding:"6px 10px",fontSize:12}} value={agFiltEst} onChange={e=>setAgFiltEst(e.target.value)}>
                    <option value="Todos">Todos los estados</option>
                    {ESTADOS_CX.map(e=><option key={e}>{e}</option>)}
                  </select>
                  <button className="btn-sec" onClick={exportarDia} style={{padding:"6px 12px",fontSize:12,whiteSpace:"nowrap"}}>📄 Parte día</button>
                  <button className="btn-sec" onClick={exportarSemana} style={{padding:"6px 12px",fontSize:12,whiteSpace:"nowrap"}}>📄 PDF semana</button>
                  <button className="btn-sec" onClick={exportICSAgenda} style={{padding:"6px 12px",fontSize:12,whiteSpace:"nowrap"}}>📅 Exportar .ics</button>
                </div>
              </div>

              {agendaVista==="mes"?(
                <>
                  <CalMes year={calY} month={calM}
                    onPrev={()=>prevM(calY,calM,setCalY,setCalM)}
                    onNext={()=>nextM(calY,calM,setCalY,setCalM)}
                    onToday={()=>{setCalY(today.getFullYear());setCalM(today.getMonth());setSelDate(todayStr);}}
                    holidays={festivosCat(calY)}
                    renderDay={({day,dateStr,isToday,isWeekend,isHoliday,col})=>{
                      const dc=cirugias.filter(c=>c.fecha===dateStr),isSel=dateStr===selDate;
                      const porClinica=hospitales.map((h,idx)=>({nombre:h.nombre,color:ACCENTS[idx%ACCENTS.length],n:dc.filter(c=>c.hospital===h.nombre).length})).filter(x=>x.n>0);
                      return(<div key={dateStr} className="cal-day" style={{borderRight:col<6?`1px solid ${B.border}`:"none",background:isSel?B.slateDark:(isWeekend||isHoliday)?"#EAECEF":"white"}} onClick={()=>setSelDate(dateStr)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday&&!isSel?B.gold:"transparent",color:isSel?"white":isToday?B.slateDark:(isWeekend||isHoliday)?B.muted:B.text,fontWeight:isToday||isSel?700:400,fontSize:12}}>{day}</div>
                          {isHoliday&&!isSel&&<div style={{width:5,height:5,borderRadius:"50%",background:"#B91C1C",flexShrink:0}}/>}
                        </div>
                        {porClinica.length>0&&(
                          <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                            {porClinica.map(({nombre,color,n})=>(
                              <div key={nombre} title={nombre} style={{background:isSel?"rgba(255,255,255,.28)":color,color:"white",borderRadius:5,padding:"2px 5px",fontSize:10,fontWeight:700,lineHeight:1.2}}>{n}</div>
                            ))}
                          </div>
                        )}
                        {isSel&&canCreate&&<button onClick={e=>{e.stopPropagation();openNewCx(dateStr);}} style={{position:"absolute",bottom:3,right:3,background:B.gold,border:"none",borderRadius:4,width:16,height:16,fontSize:11,fontWeight:700,color:B.slateDark,cursor:"pointer"}}>+</button>}
                      </div>);
                    }}
                  />
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <h3 style={{fontSize:16,fontWeight:700,color:B.slateDark}}>{selDate===todayStr?"Hoy":selDate} <span style={{fontSize:13,fontWeight:400,color:B.muted}}>({cxDiaFilt.length}{cxDiaFilt.length!==cxDia.length?` de ${cxDia.length}`:""})</span></h3>
                    {canCreate&&<button className="btn-gold" onClick={()=>openNewCx(selDate)} style={{padding:"7px 12px",fontSize:12}}>+ Añadir</button>}
                  </div>
                  {cxDiaFilt.length===0?(<div className="card" style={{padding:32,textAlign:"center",color:B.muted}}><div style={{fontSize:28,marginBottom:8}}>📋</div><div style={{fontWeight:600}}>{cxDia.length>0?"Sin resultados con estos filtros":"Sin cirugías"}</div>{canCreate&&cxDia.length===0&&<button className="btn-gold" onClick={()=>openNewCx(selDate)} style={{marginTop:12}}>+ Añadir</button>}</div>)
                  :cxDiaFilt.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                    <div key={c.id} className="card" style={{padding:"12px 14px",marginBottom:8,cursor:canCreate?"pointer":"default"}} onClick={()=>{if(canCreate){setForm({...c});setModal("cx_e");}}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                            <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:B.slateDark}}>{c.inicio}–{c.fin}</span>
                            <Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/>
                          </div>
                          <div style={{fontWeight:700,fontSize:14}}>{c.tipo}</div>
                          <div style={{fontSize:12,color:B.muted,marginTop:3}}>{c.hospital} · {c.quirofano}</div>
                          <div style={{fontSize:12,color:B.muted}}>🔪 {c.cirujano}{c.ayudante&&` · 🤝 ${c.ayudante}`}</div>
                          {c.obs&&<div style={{fontSize:11,color:B.goldDark,marginTop:2}}>⚠ {c.obs}</div>}
                          {esCerradoQuir(c.hospital,c.quirofano,c.fecha,turnoFromHora(c.inicio))&&<div style={{fontSize:11,color:"#B91C1C",marginTop:2,fontWeight:600}}>⛔ {c.quirofano} cerrado · <button onClick={e=>{e.stopPropagation();setTab("quirofanos");setQuirHosp(c.hospital);setQuirDate(c.fecha);}} style={{border:"none",background:"none",color:"#B91C1C",fontSize:11,fontWeight:600,cursor:"pointer",padding:0,textDecoration:"underline"}}>Abrir quirófano →</button></div>}
                        </div>
                        <Bdg label={c.factura} bg={bFact(c.factura)} color={cFact(c.factura)}/>
                      </div>
                    </div>
                  ))}
                </>
              ):(()=>{
                const sd2=new Date(selDate+'T12:00:00');const dow2=sd2.getDay();const mo=(dow2===0)?-6:1-dow2;const mon2=new Date(sd2);mon2.setDate(mon2.getDate()+mo);
                const wDates=Array.from({length:7},(_,i)=>{const d=new Date(mon2);d.setDate(d.getDate()+i);return fmt(d);});
                return(
                  <div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                      <div style={{fontWeight:700,fontSize:14,color:B.slateDark}}>{wDates[0]} — {wDates[6]}</div>
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn-sec" style={{padding:"5px 10px",fontSize:12}} onClick={()=>{const d=new Date(selDate+'T12:00:00');d.setDate(d.getDate()-7);setSelDate(fmt(d));}}>←</button>
                        <button className="btn-sec" style={{padding:"5px 10px",fontSize:12}} onClick={()=>setSelDate(todayStr)}>Hoy</button>
                        <button className="btn-sec" style={{padding:"5px 10px",fontSize:12}} onClick={()=>{const d=new Date(selDate+'T12:00:00');d.setDate(d.getDate()+7);setSelDate(fmt(d));}}>→</button>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(7,1fr)":"repeat(7,1fr)",gap:mob?3:8,marginBottom:20}}>
                      {wDates.map((ds,i)=>{
                        const isT=ds===todayStr,isSel=ds===selDate;
                        const isWE=i>=5,isHol=festivosCat(new Date(ds+'T12:00:00').getFullYear()).has(ds);
                        const cxDay=cirugias.filter(c=>c.fecha===ds&&(agFiltHosp==="Todos"||c.hospital===agFiltHosp)&&(agFiltEst==="Todos"||c.estado===agFiltEst));
                        return(
                          <div key={ds} onClick={()=>setSelDate(ds)} style={{background:isSel?"#EEF2F8":(isWE||isHol)?"#EAECEF":"white",borderRadius:10,border:`1.5px solid ${isT?B.gold:isSel?B.slate:B.border}`,padding:mob?"5px 4px":"8px 6px",cursor:"pointer",transition:"all .15s",minHeight:mob?52:88}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                              <div style={{fontSize:mob?8:9,fontWeight:700,color:B.muted,textTransform:"uppercase"}}>{DIAS_H[i]}</div>
                              <div style={{width:mob?16:20,height:mob?16:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isT?B.gold:"transparent",color:isT?B.slateDark:B.text,fontWeight:isT?700:500,fontSize:mob?10:12}}>{new Date(ds+'T12:00:00').getDate()}</div>
                            </div>
                            {!mob&&cxDay.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                              <div key={c.id} onClick={e=>{e.stopPropagation();if(canCreate){setForm({...c});setModal("cx_e");}}} style={{background:bEst(c.estado),borderRadius:5,padding:"3px 5px",marginBottom:3,fontSize:9,fontWeight:600,color:ceColor(c.estado),cursor:canCreate?"pointer":"default",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {c.inicio} {c.tipo?.slice(0,12)||"—"}
                              </div>
                            ))}
                            {mob&&cxDay.length>0&&<div style={{width:18,height:18,borderRadius:"50%",background:B.slate,color:"white",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{cxDay.length}</div>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                      <h3 style={{fontSize:16,fontWeight:700,color:B.slateDark}}>{selDate===todayStr?"Hoy":selDate} <span style={{fontSize:13,fontWeight:400,color:B.muted}}>({cxDiaFilt.length})</span></h3>
                      {canCreate&&<button className="btn-gold" onClick={()=>openNewCx(selDate)} style={{padding:"7px 12px",fontSize:12}}>+ Añadir</button>}
                    </div>
                    {cxDiaFilt.length===0?(<div className="card" style={{padding:32,textAlign:"center",color:B.muted}}><div style={{fontSize:28,marginBottom:8}}>📋</div><div style={{fontWeight:600}}>{cxDia.length>0?"Sin resultados con estos filtros":"Sin cirugías"}</div>{canCreate&&cxDia.length===0&&<button className="btn-gold" onClick={()=>openNewCx(selDate)} style={{marginTop:12}}>+ Añadir</button>}</div>)
                    :cxDiaFilt.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                      <div key={c.id} className="card" style={{padding:"12px 14px",marginBottom:8,cursor:canCreate?"pointer":"default"}} onClick={()=>{if(canCreate){setForm({...c});setModal("cx_e");}}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:B.slateDark}}>{c.inicio}–{c.fin}</span>
                              <Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/>
                            </div>
                            <div style={{fontWeight:700,fontSize:14}}>{c.tipo}</div>
                            <div style={{fontSize:12,color:B.muted,marginTop:3}}>{c.hospital} · {c.quirofano}</div>
                            <div style={{fontSize:12,color:B.muted}}>🔪 {c.cirujano}{c.ayudante&&` · 🤝 ${c.ayudante}`}</div>
                            {c.obs&&<div style={{fontSize:11,color:B.goldDark,marginTop:2}}>⚠ {c.obs}</div>}
                          </div>
                          <Bdg label={c.factura} bg={bFact(c.factura)} color={cFact(c.factura)}/>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ══ PROGRAMACIÓN ══ */}
          {tab==="programacion"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
                <div><h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>👨‍⚕️ Programación</h2><p style={{color:B.muted,fontSize:13,marginTop:2}}>Cirugías por cirujano y clínica</p></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <select className="inp" style={{width:mob?"100%":170}} value={filtCir} onChange={e=>setFiltCir(e.target.value)}><option value="Todos">Todos los cirujanos</option>{personal.map(p=><option key={p.id}>{p.nombre}</option>)}</select>
                  <select className="inp" style={{width:mob?"100%":155}} value={filtCli} onChange={e=>setFiltCli(e.target.value)}><option value="Todos">Todas las clínicas</option>{hospNames.map(h=><option key={h}>{h}</option>)}</select>
                </div>
              </div>
              {filtCir==="Todos"?(
                personal.map(p=>{
                  const cxs=cxProg.filter(c=>c.cirujano===p.nombre||c.ayudante===p.nombre);
                  if(cxs.length===0)return null;
                  const prox=cxs.filter(c=>c.fecha>=todayStr);
                  return(<div key={p.id} className="card" style={{marginBottom:14,overflow:"hidden"}}>
                    <div style={{background:p.color||B.slate,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                      <div className="avatar" style={{background:"rgba(255,255,255,.2)",width:36,height:36,fontSize:14}}>{(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
                      <div style={{flex:1}}><div style={{color:"white",fontWeight:700,fontSize:14}}>{p.nombre}</div><div style={{color:"rgba(255,255,255,.7)",fontSize:12}}>{p.rol}</div></div>
                      <div style={{textAlign:"right"}}><div style={{color:"white",fontWeight:700,fontSize:20}}>{prox.length}</div><div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>próximas</div></div>
                    </div>
                    {prox.length===0?<div style={{padding:16,textAlign:"center",color:B.muted,fontSize:13}}>Sin cirugías próximas</div>:prox.map(c=>(
                      <div key={c.id} style={{padding:"10px 14px",borderBottom:`1px solid ${B.border}`,cursor:canCreate?"pointer":"default"}} onClick={()=>{if(canCreate){setForm({...c});setModal("cx_e");}}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                          <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:B.slate,fontWeight:600}}>{c.fecha} · {c.inicio}–{c.fin}</div><div style={{fontWeight:600,fontSize:13,marginTop:2}}>{c.tipo}</div><div style={{fontSize:12,color:B.muted}}>{c.hospital}{c.cirujano!==p.nombre&&" · como ayudante"}</div></div>
                          <Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/>
                        </div>
                      </div>
                    ))}
                  </div>);
                })
              ):(
                <div className="card" style={{overflow:"hidden"}}>
                  {cxProg.length===0?<div style={{padding:36,textAlign:"center",color:B.muted}}>Sin resultados</div>:cxProg.map((c,i)=>(
                    <div key={c.id} style={{padding:"11px 16px",borderBottom:`1px solid ${B.border}`,cursor:canCreate?"pointer":"default",background:i%2===0?"white":"#FAFBFC"}} onClick={()=>{if(canCreate){setForm({...c});setModal("cx_e");}}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                        <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:B.slate,fontWeight:600}}>{c.fecha} · {c.inicio}–{c.fin}</div><div style={{fontWeight:600,fontSize:13,marginTop:1}}>{c.tipo}</div><div style={{fontSize:12,color:B.muted}}>{c.hospital} · {c.cirujano}</div></div>
                        <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}><Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/><Bdg label={c.factura} bg={bFact(c.factura)} color={cFact(c.factura)}/></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ GUARDIAS ══ */}
          {tab==="guardias"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
                <div><h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>🛡️ Guardias</h2><p style={{color:B.muted,fontSize:13,marginTop:2}}>Asignación mensual por clínica</p></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  {hospNames.map((h,i)=><button key={h} onClick={()=>setGuardHosp(h)} style={{padding:"7px 13px",borderRadius:9,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",background:guardHosp===h?ACCENTS[i%ACCENTS.length]:"white",color:guardHosp===h?"white":B.slate,borderColor:guardHosp===h?ACCENTS[i%ACCENTS.length]:B.border}}>{h}</button>)}
                  {canSugerirGuardia&&<button className="btn-gold" onClick={openSugerencia} style={{padding:"7px 13px",fontSize:13}}>+ Sugerir día</button>}
                  <button className="btn-sec" onClick={exportICSGuardias} style={{padding:"7px 13px",fontSize:13,whiteSpace:"nowrap"}}>📅 .ics</button>
                </div>
              </div>

              {/* Admin: solicitudes pendientes */}
              {isAdmin&&sugPend.length>0&&(
                <div style={{background:"white",borderRadius:13,border:`1.5px solid ${B.gold}`,padding:"14px 16px",marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:14,color:B.goldDark,marginBottom:10}}>⏳ Solicitudes pendientes ({sugPend.length})</div>
                  {sugPend.map(s=>(
                    <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${B.border}`,gap:10,flexWrap:"wrap"}}>
                      <div><div style={{fontWeight:600,fontSize:13}}>{s.usuario_nombre}</div><div style={{fontSize:12,color:B.muted}}>{s.fecha} · {s.hospital}</div>{s.nota&&<div style={{fontSize:11,color:B.muted,fontStyle:"italic"}}>"{s.nota}"</div>}</div>
                      <div style={{display:"flex",gap:6}}><button className="btn-green" onClick={()=>aprobarSug(s)}>✓ Aprobar</button><button className="btn-sm-danger" onClick={()=>rechazarSug(s)}>Rechazar</button></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mis sugerencias */}
              {canSugerirGuardia&&(
                <div style={{marginBottom:16}}>
                  <div style={{fontWeight:600,fontSize:13,color:B.slateDark,marginBottom:8}}>Mis sugerencias</div>
                  {sugerencias.filter(s=>s.usuario_id===authUser?.id).length===0?<div style={{fontSize:13,color:B.muted,fontStyle:"italic"}}>Aún no has sugerido ningún día de guardia.</div>:sugerencias.filter(s=>s.usuario_id===authUser?.id).slice(0,5).map(s=>(
                    <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"white",borderRadius:9,border:`1.5px solid ${B.border}`,marginBottom:6}}>
                      <div><div style={{fontWeight:600,fontSize:13}}>{s.fecha} · {s.hospital}</div>{s.nota&&<div style={{fontSize:11,color:B.muted}}>{s.nota}</div>}</div>
                      <Bdg label={s.estado} bg={{pendiente:B.goldLight,aprobada:"#E6F4EC",rechazada:"#FEE2E2"}[s.estado]||B.bg} color={{pendiente:B.goldDark,aprobada:"#2E7D52",rechazada:"#DC2626"}[s.estado]||B.muted}/>
                    </div>
                  ))}
                </div>
              )}

              {(()=>{
                const diasMes=new Date(gY,gM+1,0).getDate();
                const resumen=hospNames.map(h=>{const asignados=Array.from({length:diasMes},(_,i)=>fmt(new Date(gY,gM,i+1))).filter(f=>guardias.find(g=>g.fecha===f&&g.hospital===h)).length;return{h,asignados,total:diasMes,sin:diasMes-asignados};});
                return(<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                  {resumen.map(({h,asignados,sin},i)=>(
                    <div key={h} style={{flex:1,minWidth:120,background:"white",borderRadius:11,padding:"10px 14px",border:`1.5px solid ${sin===0?"#86EFAC":sin>10?B.gold:B.border}`}}>
                      <div style={{fontSize:10,fontWeight:700,color:ACCENTS[i%ACCENTS.length],textTransform:"uppercase",letterSpacing:.5,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h}</div>
                      <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                        <span style={{fontSize:22,fontWeight:700,color:sin===0?"#2E7D52":sin>10?B.goldDark:B.slate}}>{asignados}</span>
                        <span style={{fontSize:11,color:B.muted}}>/ {new Date(gY,gM+1,0).getDate()} días</span>
                      </div>
                      {sin>0?<div style={{fontSize:10,color:B.goldDark,marginTop:2}}>⚠ {sin} sin cubrir</div>:<div style={{fontSize:10,color:"#2E7D52",marginTop:2}}>✓ Mes completo</div>}
                    </div>
                  ))}
                </div>);
              })()}

              <CalMes year={gY} month={gM}
                onPrev={()=>prevM(gY,gM,setGY,setGM)}
                onNext={()=>nextM(gY,gM,setGY,setGM)}
                onToday={()=>{setGY(today.getFullYear());setGM(today.getMonth());}}
                holidays={festivosCat(gY)}
                renderDay={({day,dateStr,isToday,isWeekend,isHoliday,col})=>{
                  const g=guardias.find(x=>x.fecha===dateStr&&x.hospital===guardHosp);
                  return(<div key={dateStr} className="guard-day" style={{borderRight:col<6?`1px solid ${B.border}`:"none",background:isToday?B.goldLight:g?"#E6F4EC":(isWeekend||isHoliday)?"#EAECEF":"white"}} onClick={()=>isAdmin&&openGuardia(dateStr,guardHosp||hospNames[0])}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                      <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday?B.gold:"transparent",color:isToday?B.slateDark:(isWeekend||isHoliday)?B.muted:B.text,fontWeight:isToday?700:400,fontSize:11}}>{day}</div>
                      {isHoliday&&!g&&!isToday&&<div style={{width:5,height:5,borderRadius:"50%",background:"#B91C1C",flexShrink:0}}/>}
                      {g&&<div style={{width:7,height:7,borderRadius:"50%",background:"#2E7D52"}}/>}
                    </div>
                    {g?(<div style={{fontSize:mob?8:9,lineHeight:1.5}}>
                      {g.cirujano_principal&&<div style={{fontWeight:700,color:"#2E7D52",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🔪 {g.cirujano_principal.split(" ").slice(-1)[0]}</div>}
                      {g.cirujano_ayudante&&<div style={{color:B.slate,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🤝 {g.cirujano_ayudante.split(" ").slice(-1)[0]}</div>}
                    </div>):<div style={{fontSize:9,color:B.border,textAlign:"center",paddingTop:2}}>{isAdmin?"+ asignar":""}</div>}
                  </div>);
                }}
              />
            </div>
          )}

          {/* ══ QUIRÓFANOS ══ */}
          {tab==="quirofanos"&&(()=>{
            const esQuir=true;
            const titulo="🏥 Quirófanos";
            const salas=QUIROFANOS;
            const salaLabel="Quirófano";
            const selHosp=quirHosp;
            const setSelHosp=setQuirHosp;
            const calY=quirY;const calM2=quirM;
            const setPrevNext=[setQuirY,setQuirM];
            const selDia=quirDate;
            const setSelDia=setQuirDate;
            const getQuirRec=(sala,fecha,turno)=>quirEstados.find(e=>e.hospital===selHosp&&e.quirofano===sala&&e.fecha===fecha&&e.turno===turno)||null;
            const getQuirEst=(rec)=>{if(!rec)return"blank";if(rec.cerrado)return"cerrado";if(rec.cirujano)return"asignado";return"abierto";};
            const esCerrado=(sala,fecha,turno)=>esCerradoQuir(selHosp,sala,fecha,turno);
            return(
              <div>
                {/* Cabecera */}
                <div style={{marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>{titulo}</h2>
                    <button className="btn-sec" onClick={exportICSQuirofanos} style={{padding:"6px 12px",fontSize:12,whiteSpace:"nowrap"}}>📅 .ics</button>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {hospNames.map((h,i)=><button key={h} onClick={()=>{setSelHosp(h);setQuirEditSlot(null);}} style={{padding:"7px 13px",borderRadius:9,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",background:selHosp===h?ACCENTS[i%ACCENTS.length]:"white",color:selHosp===h?"white":B.slate,borderColor:selHosp===h?ACCENTS[i%ACCENTS.length]:B.border}}>{h}</button>)}
                  </div>
                </div>

                {/* Calendario */}
                <CalMes year={calY} month={calM2}
                  onPrev={()=>prevM(calY,calM2,...setPrevNext)}
                  onNext={()=>nextM(calY,calM2,...setPrevNext)}
                  onToday={()=>{setPrevNext[0](today.getFullYear());setPrevNext[1](today.getMonth());setSelDia(todayStr);}}
                  holidays={festivosCat(calY)}
                  renderDay={({day,dateStr,isToday,isWeekend,isHoliday,col})=>{
                    const isSel=dateStr===selDia;
                    const salaInfos=salas.map(s=>{
                      const recM=getQuirRec(s,dateStr,"mañana");
                      const recT=getQuirRec(s,dateStr,"tarde");
                      const estM=getQuirEst(recM);
                      const estT=getQuirEst(recT);
                      const isOpen=estM==="abierto"||estM==="asignado"||estT==="abierto"||estT==="asignado";
                      const isClosed=estM==="cerrado"||estT==="cerrado";
                      const cxs=cirugias.filter(c=>c.hospital===selHosp&&c.quirofano===s&&c.fecha===dateStr);
                      // Cirujano persiste aunque esté cerrado (cerrado = completo, no vacío)
                      const asigRec=estM==="asignado"?recM:estT==="asignado"?recT:
                                    (estM==="cerrado"&&recM?.cirujano)?recM:
                                    (estT==="cerrado"&&recT?.cirujano)?recT:null;
                      const cirColor=asigRec?personal.find(p=>p.nombre===asigRec.cirujano)?.color:null;
                      return{s,isOpen,isClosed,ocupado:cxs.length>0,cirColor};
                    });
                    const hasCerrado=salaInfos.some(x=>x.isClosed);
                    const hasCirugias=salaInfos.some(x=>x.isOpen&&x.ocupado);
                    const hasOpen=salaInfos.some(x=>x.isOpen);
                    const asigDots=salaInfos.filter(x=>x.cirColor); // incluye cerrados con cirujano
                    let dayBg="white";
                    if(isWeekend||isHoliday)dayBg="#EAECEF";
                    if(hasCerrado)dayBg="#FCA5A5";
                    if(hasCirugias&&!hasCerrado)dayBg="#FCD34D";
                    if(hasOpen&&!hasCirugias&&!hasCerrado)dayBg="#86EFAC";
                    if(isToday&&!isSel)dayBg=B.goldLight;
                    if(isSel)dayBg=B.slateDark;
                    const numColor=isSel?"white":hasCerrado?"#7F1D1D":hasCirugias?"#78350F":hasOpen?"#14532D":isToday?B.slateDark:(isWeekend||isHoliday)?B.muted:B.text;
                    return(
                      <div key={dateStr} className="cal-day" style={{borderRight:col<6?`1px solid ${B.border}`:"none",background:dayBg}} onClick={()=>setSelDia(dateStr)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",color:numColor,fontWeight:isToday||isSel?700:400,fontSize:12}}>{day}</div>
                          {isHoliday&&!isSel&&!hasOpen&&!hasCerrado&&!hasCirugias&&<div style={{width:5,height:5,borderRadius:"50%",background:"#B91C1C",flexShrink:0}}/>}
                        </div>
                        {asigDots.length>0&&(
                          <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
                            {asigDots.map(({s,cirColor})=>(
                              <div key={s} title={s} style={{width:mob?7:9,height:mob?7:9,borderRadius:"50%",background:isSel?"rgba(255,255,255,.7)":cirColor,flexShrink:0,boxShadow:"0 0 0 1.5px rgba(0,0,0,.15)"}}/>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                {/* Cabecera día */}
                <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:B.slateDark}}>{selDia===todayStr?"Hoy":selDia}</h3>
                  <span style={{fontSize:12,color:B.muted}}>{selHosp}</span>
                </div>

                {/* Leyenda */}
                <div style={{display:"flex",gap:14,marginBottom:12,flexWrap:"wrap"}}>
                  {[["#86EFAC","#14532D","Abierto sin cirugías"],["#FCD34D","#78350F","Abierto con cirugías"],["#FCA5A5","#7F1D1D","Cerrado"],["#EAECEF",B.muted,"Fin de semana / Festivo"]].map(([bg,col,l])=>(
                    <div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:14,height:14,borderRadius:4,background:bg,border:`1px solid ${B.border}`}}/><span style={{fontSize:11,color:B.muted}}>{l}</span></div>
                  ))}
                  <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:5,height:5,borderRadius:"50%",background:"#B91C1C"}}/><span style={{fontSize:11,color:B.muted}}>festivo cataluña</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:9,height:9,borderRadius:"50%",background:"#4A6079",boxShadow:"0 0 0 1.5px rgba(0,0,0,.2)"}}/><span style={{fontSize:11,color:B.muted}}>● cirujano asignado</span></div>
                </div>

                {/* Tabla salas × turno */}
                <div style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(46,63,82,.07)"}}>
                  <div style={{display:"grid",gridTemplateColumns:`${mob?64:90}px 1fr 1fr`,background:B.slateDark}}>
                    <div style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:.5}}>{salaLabel}</div>
                    {["Mañana","Tarde"].map(t=><div key={t} style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"white",textTransform:"uppercase",letterSpacing:.5,borderLeft:"1px solid rgba(255,255,255,.1)"}}>{t}</div>)}
                  </div>
                  {salas.map((sala,si)=>(
                    <div key={sala} style={{display:"grid",gridTemplateColumns:`${mob?64:90}px 1fr 1fr`,borderBottom:si<salas.length-1?`1px solid ${B.border}`:"none"}}>
                      <div style={{padding:"12px",fontWeight:700,fontSize:13,color:B.slateDark,display:"flex",alignItems:"center",background:"#FAFBFC",borderRight:`1px solid ${B.border}`}}>{sala}</div>
                      {["mañana","tarde"].map(turno=>{
                        const rec=getQuirRec(sala,selDia,turno);
                        const est=getQuirEst(rec);
                        const cxs=cirugias.filter(c=>c.hospital===selHosp&&c.quirofano===sala&&c.fecha===selDia&&turnoFromHora(c.inicio)===turno);
                        const cxCirujanos=[...new Set(cxs.map(c=>c.cirujano).filter(Boolean))];
                        // Cirujano persiste al cerrar: buscar en cualquier estado
                        const recCirujano=rec?.cirujano||"";
                        const asigColor=(est==="asignado"||(est==="cerrado"&&recCirujano))?personal.find(p=>p.nombre===recCirujano)?.color:null;
                        const bg=est==="cerrado"?(asigColor?`${asigColor}33`:"#FEF2F2"):asigColor?`${asigColor}22`:est==="abierto"?"#F0FDF4":cxs.length>0?"#FFFBEB":"#FAFBFC";
                        const dotColor=est==="cerrado"?"#B91C1C":asigColor||"#2E7D52";
                        const label=est==="cerrado"?`🔒 Completo${recCirujano?" · "+recCirujano:""}`:est==="asignado"?(recCirujano||"Asignado"):cxs.length>0?"Con cirugías":"Disponible";
                        const labelColor=est==="cerrado"?"#B91C1C":asigColor||"#166534";
                        const isEd=quirEditSlot?.sala===sala&&quirEditSlot?.turno===turno;
                        return(
                          <div key={turno} style={{borderLeft:`1px solid ${B.border}`}}>
                            <div style={{padding:"10px 12px",background:bg,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                              <div style={{flex:1}}>
                                <div style={{display:"inline-flex",alignItems:"center",gap:5,marginBottom:cxCirujanos.length>0?4:0}}>
                                  <div style={{width:8,height:8,borderRadius:"50%",background:dotColor,flexShrink:0}}/>
                                  <span style={{fontSize:11,fontWeight:600,color:labelColor}}>{label}</span>
                                </div>
                                {cxCirujanos.length>0&&<div style={{fontSize:11,color:B.muted,marginTop:2}}>🔪 {cxCirujanos.join(", ")}</div>}
                                {cxs.length>0&&<button onClick={e=>{e.stopPropagation();setSelDate(selDia);setTab("agenda");}} style={{marginTop:3,padding:"2px 7px",borderRadius:5,border:`1px solid ${B.border}`,background:"white",fontSize:10,color:B.slate,cursor:"pointer",fontWeight:600}}>{cxs.length} cx · Ver agenda →</button>}
                              </div>
                              {canCreate&&(
                                <button onClick={()=>setQuirEditSlot(isEd?null:{sala,turno})} disabled={saving}
                                  style={{flexShrink:0,padding:"3px 8px",borderRadius:6,border:"1.5px solid",fontSize:10,fontWeight:600,cursor:"pointer",
                                    background:isEd?"#EFF6FF":"white",color:B.slate,borderColor:B.border}}>
                                  {isEd?"▲":"▾"}
                                </button>
                              )}
                            </div>
                            {isEd&&(
                              <div style={{padding:"10px 12px",background:"#F8FAFC",borderTop:`1px solid ${B.border}`,display:"flex",flexDirection:"column",gap:7}}>
                                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                                  {est==="blank"&&<button onClick={()=>saveQuirofanoEstado(selHosp,sala,selDia,turno,"abierto","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:"1px solid #86EFAC",background:"#F0FDF4",fontSize:11,fontWeight:600,cursor:"pointer",color:"#166534"}}>🟢 Abrir</button>}
                                  {(est==="abierto"||est==="asignado")&&<button onClick={()=>saveQuirofanoEstado(selHosp,sala,selDia,turno,"cerrado","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:"1px solid #FECACA",background:"#FEF2F2",fontSize:11,fontWeight:600,cursor:"pointer",color:"#B91C1C"}}>🔒 Cerrar</button>}
                                  {est==="cerrado"&&<button onClick={()=>saveQuirofanoEstado(selHosp,sala,selDia,turno,"abierto","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:"1px solid #86EFAC",background:"#F0FDF4",fontSize:11,fontWeight:600,cursor:"pointer",color:"#166534"}}>🔓 Abrir</button>}
                                  {(est==="abierto"||est==="asignado")&&<button onClick={()=>saveQuirofanoEstado(selHosp,sala,selDia,turno,"blank","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${B.border}`,background:"white",fontSize:11,fontWeight:600,cursor:"pointer",color:B.muted}}>✕ Quitar</button>}
                                </div>
                                {(est==="abierto"||est==="asignado")&&(
                                  <select className="inp" style={{padding:"5px 8px",fontSize:12}} value={rec?.cirujano||""} onChange={e=>saveQuirofanoEstado(selHosp,sala,selDia,turno,"abierto",e.target.value)}>
                                    <option value="">— Sin asignar —</option>
                                    {personal.map(p=><option key={p.id}>{p.nombre}</option>)}
                                  </select>
                                )}
                                {canCreate&&(est==="abierto"||est==="asignado")&&<button onClick={()=>openNewCx(selDia,{hospital:selHosp,quirofano:sala})} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${B.gold}`,background:B.goldLight,fontSize:11,fontWeight:600,cursor:"pointer",color:B.slateDark}}>+ Nueva cirugía</button>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ══ CONSULTAS ══ */}
          {tab==="consultas"&&(()=>{
            const getConsRec=(sala,fecha,turno)=>consEstados.find(e=>e.hospital===consHosp&&e.sala===sala&&e.fecha===fecha&&e.turno===turno)||null;
            const getEst=(rec)=>{if(!rec)return"blank";if(rec.cerrado)return"cerrada";if(rec.cirujano)return"asignada";return"abierta";};
            const eColor={blank:"white",cerrada:"#FEF2F2",abierta:"#F0FDF4",asignada:"#FFFBEB"};
            const eDot={blank:B.border,cerrada:"#B91C1C",abierta:"#2E7D52",asignada:"#D4A820"};
            const eLabel={blank:"Sin consulta",cerrada:"Cerrada",abierta:"Abierta",asignada:"Asignada"};
            const eTxt={blank:B.muted,cerrada:"#B91C1C",abierta:"#166534",asignada:"#92400E"};
            return(
              <div>
                <div style={{marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>🩺 Consultas</h2>
                    <button className="btn-sec" onClick={exportICSConsultas} style={{padding:"6px 12px",fontSize:12,whiteSpace:"nowrap"}}>📅 .ics</button>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {hospNames.map((h,i)=><button key={h} onClick={()=>{setConsHosp(h);setConsEditSlot(null);}} style={{padding:"7px 13px",borderRadius:9,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",background:consHosp===h?ACCENTS[i%ACCENTS.length]:"white",color:consHosp===h?"white":B.slate,borderColor:consHosp===h?ACCENTS[i%ACCENTS.length]:B.border}}>{h}</button>)}
                  </div>
                </div>

                <CalMes year={consY} month={consM}
                  onPrev={()=>prevM(consY,consM,setConsY,setConsM)}
                  onNext={()=>nextM(consY,consM,setConsY,setConsM)}
                  onToday={()=>{setConsY(today.getFullYear());setConsM(today.getMonth());setConsDate(todayStr);}}
                  holidays={festivosCat(consY)}
                  renderDay={({day,dateStr,isToday,isWeekend,isHoliday,col})=>{
                    const isSel=dateStr===consDate;
                    const dots=SALAS_CONSULTA.flatMap(s=>["mañana","tarde"].map(t=>{const r=getConsRec(s,dateStr,t);return getEst(r);})).filter(e=>e!=="blank");
                    return(
                      <div key={dateStr} className="cal-day" style={{borderRight:col<6?`1px solid ${B.border}`:"none",background:isSel?B.slateDark:isToday?B.goldLight:(isWeekend||isHoliday)?"#EAECEF":"white"}} onClick={()=>{setConsDate(dateStr);setConsEditSlot(null);}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",color:isSel?"white":isToday?B.slateDark:(isWeekend||isHoliday)?B.muted:B.text,fontWeight:isToday||isSel?700:400,fontSize:12}}>{day}</div>
                          {isHoliday&&!isSel&&dots.length===0&&<div style={{width:5,height:5,borderRadius:"50%",background:"#B91C1C",flexShrink:0}}/>}
                        </div>
                        {dots.length>0&&(
                          <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
                            {dots.map((est,idx)=><div key={idx} style={{width:mob?6:8,height:mob?6:8,borderRadius:"50%",background:isSel?"rgba(255,255,255,.6)":eDot[est]}}/>)}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:B.slateDark}}>{consDate===todayStr?"Hoy":consDate}</h3>
                  <span style={{fontSize:12,color:B.muted}}>{consHosp}</span>
                </div>

                <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                  {[["blank","Sin consulta"],["abierta","Abierta (sin asignar)"],["asignada","Asignada"],["cerrada","Cerrada"]].map(([est,lbl])=>(
                    <div key={est} style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:eDot[est],border:`1px solid ${est==="blank"?B.border:"transparent"}`}}/>
                      <span style={{fontSize:11,color:B.muted}}>{lbl}</span>
                    </div>
                  ))}
                </div>

                <div style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(46,63,82,.07)"}}>
                  <div style={{display:"grid",gridTemplateColumns:`${mob?70:100}px 1fr 1fr`,background:B.slateDark}}>
                    <div style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:.5}}>Sala</div>
                    {["Mañana","Tarde"].map(t=><div key={t} style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"white",textTransform:"uppercase",letterSpacing:.5,borderLeft:"1px solid rgba(255,255,255,.1)"}}>{t}</div>)}
                  </div>
                  {SALAS_CONSULTA.map((sala,si)=>(
                    <div key={sala} style={{display:"grid",gridTemplateColumns:`${mob?70:100}px 1fr 1fr`,borderBottom:si<SALAS_CONSULTA.length-1?`1px solid ${B.border}`:"none"}}>
                      <div style={{padding:"12px",fontWeight:700,fontSize:13,color:B.slateDark,display:"flex",alignItems:"center",background:"#FAFBFC",borderRight:`1px solid ${B.border}`}}>{sala}</div>
                      {["mañana","tarde"].map(turno=>{
                        const rec=getConsRec(sala,consDate,turno);
                        const est=getEst(rec);
                        const isEd=consEditSlot?.sala===sala&&consEditSlot?.turno===turno;
                        return(
                          <div key={turno} style={{borderLeft:`1px solid ${B.border}`}}>
                            <div onClick={()=>canCreate&&setConsEditSlot(isEd?null:{sala,turno})}
                              style={{padding:"10px 12px",background:eColor[est],cursor:canCreate?"pointer":"default",display:"flex",alignItems:"center",gap:8,minHeight:52,transition:"filter .1s"}}
                              onMouseEnter={e=>{if(canCreate)e.currentTarget.style.filter="brightness(.97)";}}
                              onMouseLeave={e=>{e.currentTarget.style.filter="none";}}>
                              <div style={{width:10,height:10,borderRadius:"50%",background:eDot[est],flexShrink:0,border:`1px solid ${est==="blank"?B.border:"transparent"}`}}/>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:600,color:eTxt[est]}}>{eLabel[est]}</div>
                                {rec?.cirujano&&<div style={{fontSize:11,color:B.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🔪 {rec.cirujano}</div>}
                              </div>
                              {canCreate&&<span style={{fontSize:10,color:B.muted,flexShrink:0}}>{isEd?"▲":"▼"}</span>}
                            </div>
                            {isEd&&(
                              <div style={{padding:"10px 12px",background:"#F8FAFC",borderTop:`1px solid ${B.border}`,display:"flex",flexDirection:"column",gap:7}}>
                                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                                  {est==="blank"&&<><button onClick={()=>saveConsultaEstado(consHosp,sala,consDate,turno,"abierta","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:"1px solid #86EFAC",background:"#F0FDF4",fontSize:11,fontWeight:600,cursor:"pointer",color:"#166534"}}>✓ Abrir</button><button onClick={()=>saveConsultaEstado(consHosp,sala,consDate,turno,"cerrada","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:"1px solid #FECACA",background:"#FEF2F2",fontSize:11,fontWeight:600,cursor:"pointer",color:"#B91C1C"}}>🔒 Cerrada</button></>}
                                  {est==="cerrada"&&<><button onClick={()=>saveConsultaEstado(consHosp,sala,consDate,turno,"abierta","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:"1px solid #86EFAC",background:"#F0FDF4",fontSize:11,fontWeight:600,cursor:"pointer",color:"#166534"}}>✓ Abrir</button><button onClick={()=>saveConsultaEstado(consHosp,sala,consDate,turno,"blank","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${B.border}`,background:"white",fontSize:11,fontWeight:600,cursor:"pointer",color:B.muted}}>✕ Quitar</button></>}
                                  {(est==="abierta"||est==="asignada")&&<button onClick={()=>saveConsultaEstado(consHosp,sala,consDate,turno,"cerrada","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:"1px solid #FECACA",background:"#FEF2F2",fontSize:11,fontWeight:600,cursor:"pointer",color:"#B91C1C"}}>🔒 Cerrar</button>}
                                  {(est==="abierta"||est==="asignada")&&<button onClick={()=>saveConsultaEstado(consHosp,sala,consDate,turno,"blank","")} disabled={saving} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${B.border}`,background:"white",fontSize:11,fontWeight:600,cursor:"pointer",color:B.muted}}>✕ Quitar</button>}
                                </div>
                                {(est==="abierta"||est==="asignada")&&(
                                  <select className="inp" style={{padding:"5px 8px",fontSize:12}} value={rec?.cirujano||""} onChange={e=>saveConsultaEstado(consHosp,sala,consDate,turno,"abierta",e.target.value)}>
                                    <option value="">— Sin asignar —</option>
                                    {personal.map(p=><option key={p.id}>{p.nombre}</option>)}
                                  </select>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ══ HOSPITALES ══ */}
          {tab==="hospitales"&&(
            <div>
              <div style={{marginBottom:14}}>
                <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>🏨 Hospitales</h2>
                <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>
                  {hospitales.map((h,idx)=>(
                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:ACCENTS[idx%ACCENTS.length],flexShrink:0}}/>
                      <span style={{fontSize:12,color:B.muted,fontWeight:500}}>{h.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
              <CalMes year={hospY} month={hospM}
                onPrev={()=>prevM(hospY,hospM,setHospY,setHospM)}
                onNext={()=>nextM(hospY,hospM,setHospY,setHospM)}
                onToday={()=>{setHospY(today.getFullYear());setHospM(today.getMonth());setSelDate(todayStr);}}
                holidays={festivosCat(hospY)}
                renderDay={({day,dateStr,isToday,isWeekend,isHoliday,col})=>{
                  const isSel=dateStr===selDate;
                  const hospDots=hospitales.map((h,idx)=>({h,color:ACCENTS[idx%ACCENTS.length],n:cirugias.filter(c=>c.hospital===h.nombre&&c.fecha===dateStr).length})).filter(x=>x.n>0);
                  const total=hospDots.reduce((s,x)=>s+x.n,0);
                  return(
                    <div key={dateStr} className="cal-day" style={{borderRight:col<6?`1px solid ${B.border}`:"none",background:isSel?B.slateDark:isToday?B.goldLight:(isWeekend||isHoliday)?"#EAECEF":"white"}} onClick={()=>setSelDate(dateStr)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                        <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",color:isSel?"white":isToday?B.slateDark:(isWeekend||isHoliday)?B.muted:B.text,fontWeight:isToday||isSel?700:400,fontSize:12}}>{day}</div>
                        {isHoliday&&!isSel&&total===0&&<div style={{width:5,height:5,borderRadius:"50%",background:"#B91C1C",flexShrink:0}}/>}
                        {total>0&&<span style={{fontSize:9,fontWeight:700,background:isSel?"rgba(255,255,255,.25)":B.slateLight,color:"white",borderRadius:8,padding:"1px 4px"}}>{total}</span>}
                      </div>
                      {hospDots.length>0&&(
                        <div style={{display:"flex",gap:2,marginTop:2}}>
                          {hospDots.map(({h,color})=>(
                            <div key={h.id} style={{height:4,borderRadius:2,background:isSel?"rgba(255,255,255,.55)":color,flex:1}}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <h3 style={{fontSize:15,fontWeight:700,color:B.slateDark}}>{selDate===todayStr?"Hoy":selDate}</h3>
                <span style={{fontSize:13,color:B.muted}}>({cirugias.filter(c=>c.fecha===selDate).length} cirugía{cirugias.filter(c=>c.fecha===selDate).length!==1?"s":""})</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr":hospitales.length===1?"1fr":hospitales.length===2?"repeat(2,1fr)":"repeat(3,1fr)",gap:14}}>
                {hospitales.map((h,idx)=>{
                  const cxs=cirugias.filter(c=>c.hospital===h.nombre&&c.fecha===selDate),accent=ACCENTS[idx%ACCENTS.length];
                  return(<div key={h.id} style={{background:"white",borderRadius:13,overflow:"hidden",boxShadow:"0 1px 4px rgba(46,63,82,.07)"}}>
                    <div style={{background:accent,padding:"14px 16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div><div style={{color:"white",fontWeight:700,fontSize:15}}>{h.nombre}</div>{h.direccion&&<div style={{color:"rgba(255,255,255,.6)",fontSize:11,marginTop:1}}>{h.direccion}</div>}<div style={{color:"rgba(255,255,255,.65)",fontSize:12,marginTop:2}}>{cxs.length} cirugía{cxs.length!==1?"s":""}</div></div>
                        <div style={{background:B.gold,borderRadius:9,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:B.slateDark}}>{cxs.length}</div>
                      </div>
                    </div>
                    <div style={{padding:"12px 14px"}}>
                      {cxs.length===0?<div style={{color:B.muted,fontSize:13,textAlign:"center",padding:"16px 0"}}>Sin intervenciones</div>:cxs.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                        <div key={c.id} onClick={()=>{if(canCreate){setForm({...c});setModal("cx_e");}}} style={{padding:"9px 11px",borderRadius:9,border:`1.5px solid ${B.border}`,marginBottom:6,cursor:canCreate?"pointer":"default"}} onMouseEnter={e=>{if(canCreate)e.currentTarget.style.borderColor=accent;}} onMouseLeave={e=>e.currentTarget.style.borderColor=B.border}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,color:accent}}>{c.inicio}–{c.fin}</span><Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/></div>
                          <div style={{fontWeight:600,fontSize:13}}>{c.tipo}</div>
                          <div style={{fontSize:11,color:B.muted,marginTop:1}}>{c.quirofano} · {c.cirujano}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{padding:"0 14px 12px",borderTop:`1px solid ${B.border}`,paddingTop:10}}>
                      <ColH>Personal</ColH>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:7}}>
                        {personal.filter(p=>(p.hospitales||[]).includes(h.nombre)).map(p=>(
                          <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,background:B.bg,borderRadius:20,padding:"2px 7px 2px 4px",border:`1px solid ${B.border}`}}>
                            <div className="avatar" style={{background:p.color||B.slate,width:17,height:17,fontSize:7}}>{(p.nombre||"?")[0]}</div>
                            <span style={{fontSize:10,fontWeight:500}}>{p.nombre}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>);
                })}
              </div>
            </div>
          )}

          {/* ══ PERSONAL ══ */}
          {tab==="personal"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
                <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>👥 Personal</h2>
                {isAdmin&&<button className="btn-gold" onClick={openNewP} style={{padding:"8px 16px",fontSize:13}}>+ Añadir profesional</button>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:13}}>
                {personal.map(p=>{
                  const cxs=cirugias.filter(c=>[c.cirujano,c.ayudante,c.enfermera].includes(p.nombre));
                  const prox=cxs.filter(c=>c.fecha>=todayStr).sort((a,b)=>a.fecha.localeCompare(b.fecha));
                  return(<div key={p.id} className="card" style={{padding:16,borderLeft:`4px solid ${p.color||B.slate}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <div className="avatar" style={{background:p.color||B.slate,width:42,height:42,fontSize:15}}>{(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
                      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{p.nombre}</div><div style={{fontSize:12,color:B.muted}}>{p.rol}</div>{p.tel&&<div style={{fontSize:11,color:B.muted}}>📞 {p.tel}</div>}</div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <div style={{fontSize:20,fontWeight:700,color:p.color||B.slate}}>{cxs.length}</div>
                        {isAdmin&&<button className="btn-sec" style={{padding:"3px 8px",fontSize:11}} onClick={()=>{setForm({...p});setModal("p_e");}}>✏️</button>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>{(p.hospitales||[]).map(h=><span key={h} style={{background:B.bg,color:B.slate,borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:600,border:`1px solid ${B.border}`}}>{h}</span>)}</div>
                    {prox.length>0?(<div><ColH>Próximas</ColH><div style={{marginTop:6}}>{prox.slice(0,3).map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${B.border}`}}><div><div style={{fontSize:12,fontWeight:600}}>{c.tipo}</div><div style={{fontSize:11,color:B.muted}}>{c.fecha} · {c.hospital}</div></div><Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/></div>)}</div></div>):<div style={{color:B.muted,fontSize:12,fontStyle:"italic"}}>Sin intervenciones próximas</div>}
                  </div>);
                })}
              </div>
            </div>
          )}

          {/* ══ DOCUMENTOS ══ */}
          {tab==="documentos"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
                <div><h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>📁 Repositorio</h2><p style={{color:B.muted,fontSize:13,marginTop:2}}>Documentos y formularios del equipo</p></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <select className="inp" style={{width:mob?"100%":160}} value={filtCat} onChange={e=>setFiltCat(e.target.value)}><option value="Todos">Todas las categorías</option>{CAT_DOCS.map(c=><option key={c}>{c}</option>)}</select>
                  {isAdmin&&<button className="btn-gold" onClick={openSubirDoc} style={{padding:"8px 14px",fontSize:13}}>+ Subir documento</button>}
                </div>
              </div>

              {docsFilt.length===0?(
                <div className="card" style={{padding:48,textAlign:"center",color:B.muted}}>
                  <div style={{fontSize:40,marginBottom:12}}>📁</div>
                  <div style={{fontWeight:600,fontSize:15}}>No hay documentos aún</div>
                  {isAdmin&&<div style={{fontSize:13,marginTop:4,marginBottom:16}}>Sube los primeros documentos para el equipo</div>}
                  {isAdmin&&<button className="btn-gold" onClick={openSubirDoc}>+ Subir documento</button>}
                </div>
              ):(
                <div>
                  {CAT_DOCS.filter(cat=>filtCat==="Todos"||filtCat===cat).map(cat=>{
                    const docs=docsFilt.filter(d=>d.categoria===cat);
                    if(docs.length===0)return null;
                    return(<div key={cat} style={{marginBottom:20}}>
                      <div style={{fontSize:13,fontWeight:700,color:B.slateDark,marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                        {{"Consentimientos":"📝","Hojas de información":"ℹ️","Protocolos":"📋","Formularios":"📄","Otros":"📎"}[cat]||"📄"} {cat}
                        <span style={{background:B.bg,color:B.muted,borderRadius:10,padding:"1px 7px",fontSize:11}}>{docs.length}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:10}}>
                        {docs.map(doc=>(
                          <div key={doc.id} style={{background:"white",borderRadius:11,border:`1.5px solid ${B.border}`,padding:"14px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=B.slateLight} onMouseLeave={e=>e.currentTarget.style.borderColor=B.border}>
                            <div style={{display:"flex",alignItems:"flex-start",gap:12,flex:1}}>
                              <div style={{width:40,height:40,borderRadius:9,background:B.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📄</div>
                              <div style={{flex:1}}>
                                <div style={{fontWeight:700,fontSize:13}}>{doc.nombre}</div>
                                {doc.descripcion&&<div style={{fontSize:12,color:B.muted,marginTop:2}}>{doc.descripcion}</div>}
                                <div style={{fontSize:11,color:B.muted,marginTop:4,display:"flex",gap:8,flexWrap:"wrap"}}>
                                  <span>📦 {doc.tamanyo}</span>
                                  <span>👤 {doc.subido_por}</span>
                                  <span>📅 {doc.created_at?.split("T")[0]}</span>
                                </div>
                              </div>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                              <button className="btn-green" onClick={()=>descargarDoc(doc)} style={{fontSize:12,padding:"5px 10px"}}>⬇ Abrir</button>
                              {isAdmin&&<button className="btn-sm-danger" onClick={()=>eliminarDoc(doc)}>🗑</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>);
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ FACTURACIÓN ══ */}
          {tab==="facturacion"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
                <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>💰 Facturación</h2>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                  {["Todos","Pendiente","Facturada","En revisión","Cobrada"].map(f=><button key={f} onClick={()=>setFiltFact(f)} style={{padding:"6px 11px",borderRadius:7,border:"1.5px solid",fontSize:12,fontWeight:500,cursor:"pointer",background:filtFact===f?B.slateDark:"white",color:filtFact===f?"white":B.slate,borderColor:filtFact===f?B.slateDark:B.border}}>{f}</button>)}
                  <button className="btn-sec" onClick={exportarCSVMes} style={{padding:"6px 12px",fontSize:12}}>📊 CSV mes</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
                {["Pendiente","Facturada","En revisión","Cobrada"].map(e=>{const n=cirugias.filter(c=>c.factura===e).length;return(<div key={e} className="stat-card" style={{borderTop:`3px solid ${cFact(e)}`,cursor:"pointer"}} onClick={()=>setFiltFact(e)}><div style={{fontSize:22,fontWeight:700,color:cFact(e)}}>{n}</div><div style={{fontSize:12,color:B.muted,marginTop:2}}>{e}</div></div>);})}
              </div>
              <div className="card" style={{overflow:"hidden"}}>
                {cirugias.filter(c=>filtFact==="Todos"||c.factura===filtFact).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((c,i)=>(
                  <div key={c.id} style={{padding:"11px 14px",borderBottom:`1px solid ${B.border}`,cursor:"pointer",background:i%2===0?"white":"#FAFBFC"}} onClick={()=>{setForm({...c});setModal("cx_e");}} onMouseEnter={e=>e.currentTarget.style.background=B.bg} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"white":"#FAFBFC"}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,color:B.slate}}>{c.id}</span>
                          <Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/>
                        </div>
                        <div style={{fontWeight:600,fontSize:13}}>{c.tipo}</div>
                        <div style={{fontSize:12,color:B.muted}}>{c.fecha} · {c.hospital} · {c.cirujano}</div>
                      </div>
                      <div onClick={e=>e.stopPropagation()}>
                        <select className="inp" style={{padding:"4px 6px",fontSize:11,width:110}} value={c.factura} onChange={e=>updFact(c.id,e.target.value)}>
                          {ESTADOS_FA.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CONFIGURACIÓN ══ */}
          {tab==="config"&&isAdmin&&(
            <div>
              <div style={{marginBottom:16}}><h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>⚙️ Configuración</h2><p style={{color:B.muted,fontSize:12,marginTop:2}}>Solo visible para administradores</p></div>
              <div style={{display:"flex",gap:2,marginBottom:18,borderBottom:`2px solid ${B.border}`,overflowX:"auto"}}>
                {[["personal","👥 Personal"],["hospitales","🏨 Hospitales"],["usuarios","🔐 Usuarios"],["auditoria","📋 Historial"]].map(([id,l])=><button key={id} className={`subtab ${configTab===id?"active":""}`} onClick={()=>setConfigTab(id)}>{l}</button>)}
              </div>

              {configTab==="personal"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:13,fontWeight:600}}>{personal.length} profesionales</div><button className="btn-gold" onClick={openNewP}>+ Añadir</button></div>
                  {personal.map(p=>(
                    <div key={p.id} className="config-item">
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div className="avatar" style={{background:p.color||B.slate,width:38,height:38,fontSize:13}}>{(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
                        <div><div style={{fontWeight:700,fontSize:13}}>{p.nombre}</div><div style={{fontSize:12,color:B.muted}}>{p.rol}</div><div style={{display:"flex",gap:3,marginTop:2,flexWrap:"wrap"}}>{(p.hospitales||[]).map(h=><span key={h} style={{background:B.bg,color:B.slate,borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:600,border:`1px solid ${B.border}`}}>{h}</span>)}</div></div>
                      </div>
                      <button className="btn-sec" style={{padding:"4px 9px",fontSize:12}} onClick={()=>{setForm({...p});setModal("p_e");}}>✏️</button>
                    </div>
                  ))}
                </div>
              )}

              {configTab==="hospitales"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:13,fontWeight:600}}>{hospitales.length} hospitales</div><button className="btn-gold" onClick={openNewH}>+ Añadir</button></div>
                  {hospitales.map((h,idx)=>(
                    <div key={h.id} className="config-item">
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:38,height:38,borderRadius:8,background:ACCENTS[idx%ACCENTS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏥</div>
                        <div><div style={{fontWeight:700,fontSize:13}}>{h.nombre}</div>{h.direccion&&<div style={{fontSize:12,color:B.muted}}>{h.direccion}</div>}<div style={{fontSize:11,color:B.muted}}>{personal.filter(p=>(p.hospitales||[]).includes(h.nombre)).length} profesionales</div></div>
                      </div>
                      <button className="btn-sec" style={{padding:"4px 9px",fontSize:12}} onClick={()=>{setForm({...h});setModal("h_e");}}>✏️</button>
                    </div>
                  ))}
                </div>
              )}

              {configTab==="usuarios"&&(
                <div>
                  <div style={{fontSize:13,color:B.muted,marginBottom:14}}>Aprueba o bloquea el acceso del equipo.</div>
                  {["pendiente","aprobado","bloqueado"].map(estado=>{
                    const grupo=perfiles.filter(p=>p.estado===estado);
                    if(grupo.length===0)return null;
                    const labels={pendiente:"⏳ Pendientes",aprobado:"✅ Aprobados",bloqueado:"🚫 Bloqueados"};
                    const colors={pendiente:B.goldDark,aprobado:"#2E7D52",bloqueado:"#B91C1C"};
                    return(<div key={estado} style={{marginBottom:18}}>
                      <div style={{fontSize:13,fontWeight:700,color:colors[estado],marginBottom:8}}>{labels[estado]} ({grupo.length})</div>
                      {grupo.map(u=>(
                        <div key={u.id} style={{padding:"11px 14px",background:"white",border:`1.5px solid ${estado==="pendiente"?B.gold:B.border}`,borderRadius:11,marginBottom:6}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div className="avatar" style={{background:estado==="pendiente"?B.goldDark:estado==="aprobado"?B.slate:"#B91C1C",width:36,height:36,fontSize:13}}>{(u.nombre||u.email||"?")[0].toUpperCase()}</div>
                              <div>
                                <div style={{fontWeight:700,fontSize:13}}>{u.nombre||"Sin nombre"}</div>
                                <div style={{fontSize:12,color:B.muted}}>{u.email}</div>
                                {u.rol==="admin"&&<span style={{background:B.goldLight,color:B.goldDark,borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:700}}>ADMIN</span>}
                              </div>
                            </div>
                            <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                              {estado==="pendiente"&&<button className="btn-green" onClick={()=>aprobarU(u.id)}>✓ Aprobar</button>}
                              {estado==="aprobado"&&u.id!==authUser?.id&&u.rol!=="admin"&&<button className="btn-sec" style={{padding:"4px 9px",fontSize:12}} onClick={()=>hacerAdmin(u.id)}>👑 Admin</button>}
                              {u.id!==authUser?.id&&estado!=="bloqueado"&&<button className="btn-sm-danger" onClick={()=>bloquearU(u.id)}>Bloquear</button>}
                              {estado==="bloqueado"&&<button className="btn-green" onClick={()=>aprobarU(u.id)}>Reactivar</button>}
                            </div>
                          </div>
                          {/* Vincular con personal + selector de rol */}
                          {u.rol!=="admin"&&(
                            <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${B.border}`,display:"flex",flexDirection:"column",gap:8}}>
                              {/* Vincular con ficha de personal */}
                              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                                <span style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>Vincular a</span>
                                <select className="inp" style={{flex:1,maxWidth:260,padding:"5px 8px",fontSize:12}}
                                  value={personal.find(p=>p.nombre===u.nombre)?u.nombre:""}
                                  onChange={e=>vincularPersonal(u.id,e.target.value)}>
                                  <option value="">— Sin vincular —</option>
                                  {personal.map(p=><option key={p.id} value={p.nombre}>{p.nombre} · {p.rol}</option>)}
                                </select>
                                {personal.find(p=>p.nombre===u.nombre)
                                  ?<span style={{fontSize:11,color:"#2E7D52",fontWeight:600}}>✓ Vinculado</span>
                                  :<span style={{fontSize:11,color:B.goldDark,fontWeight:600}}>⚠ Sin vincular</span>}
                              </div>
                              {/* Selector de rol — solo aprobados */}
                              {estado==="aprobado"&&(
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <span style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.5}}>Rol app</span>
                                  <select className="inp" style={{flex:1,maxWidth:220,padding:"5px 8px",fontSize:12}}
                                    value={u.rol_app||""}
                                    onChange={e=>cambiarRolApp(u.id,e.target.value)}>
                                    <option value="">— Sin asignar —</option>
                                    <option value="cirujano_principal">Cirujano Principal</option>
                                    <option value="cirujano">Cirujano</option>
                                    <option value="enfermero">Enf. Instrumentista</option>
                                  </select>
                                  {u.rol_app&&<span style={{fontSize:11,color:"#2E7D52",fontWeight:600}}>✓ Asignado</span>}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>);
                  })}
                </div>
              )}

              {configTab==="auditoria"&&(()=>{
                const accionLabel={insert:"⊕ Creado",update:"✎ Editado",delete:"✕ Eliminado"};
                const accionColor={insert:"#2E7D52",update:B.slate,delete:"#B91C1C"};
                const tablaLabel={cirugias:"Cirugía",guardias:"Guardia",personal:"Personal",hospitales:"Hospital",ausencias:"Ausencia"};
                const audFilt=auditoria.filter(a=>(audFiltTabla==="todas"||a.tabla===audFiltTabla)&&(audFiltAccion==="todas"||a.accion===audFiltAccion));
                return(
                  <div>
                    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
                      <select className="inp" style={{width:150,padding:"6px 10px",fontSize:12}} value={audFiltTabla} onChange={e=>setAudFiltTabla(e.target.value)}>
                        <option value="todas">Todas las tablas</option>
                        {["cirugias","guardias","personal","hospitales","ausencias"].map(t=><option key={t} value={t}>{tablaLabel[t]||t}</option>)}
                      </select>
                      <select className="inp" style={{width:140,padding:"6px 10px",fontSize:12}} value={audFiltAccion} onChange={e=>setAudFiltAccion(e.target.value)}>
                        <option value="todas">Todas las acciones</option>
                        <option value="insert">Creaciones</option>
                        <option value="update">Ediciones</option>
                        <option value="delete">Eliminaciones</option>
                      </select>
                      <span style={{fontSize:12,color:B.muted,marginLeft:"auto"}}>{audFilt.length} registros</span>
                    </div>
                    {audFilt.length===0?(
                      <div style={{padding:"32px",textAlign:"center",color:B.muted,fontSize:13}}>Sin registros de auditoría{audFiltTabla!=="todas"||audFiltAccion!=="todas"?" con estos filtros":""}</div>
                    ):(
                      <div style={{background:"white",borderRadius:12,overflow:"hidden",border:`1px solid ${B.border}`}}>
                        {audFilt.map((a,i)=>{
                          const cambios=a.cambios||{};
                          const camposCambiados=Object.keys(cambios).filter(k=>cambios[k]?.de!==undefined);
                          return(
                            <div key={a.id||i} style={{padding:"10px 14px",borderBottom:i<audFilt.length-1?`1px solid ${B.border}`:"none",background:i%2===0?"white":"#FAFBFC"}}>
                              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap"}}>
                                    <span style={{fontSize:11,fontWeight:700,color:accionColor[a.accion]||B.muted}}>{accionLabel[a.accion]||a.accion}</span>
                                    <span style={{fontSize:11,background:B.bg,color:B.slate,borderRadius:5,padding:"1px 6px",fontWeight:600}}>{tablaLabel[a.tabla]||a.tabla}</span>
                                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:B.muted}}>{a.registro_id}</span>
                                  </div>
                                  {camposCambiados.length>0&&(
                                    <div style={{fontSize:11,color:B.muted,marginTop:2}}>
                                      {camposCambiados.map(k=><span key={k} style={{marginRight:8}}><strong>{k}:</strong> <span style={{textDecoration:"line-through",opacity:.6}}>{String(cambios[k].de).slice(0,20)}</span> → <span style={{color:B.text}}>{String(cambios[k].a).slice(0,20)}</span></span>)}
                                    </div>
                                  )}
                                </div>
                                <div style={{textAlign:"right",flexShrink:0}}>
                                  <div style={{fontSize:12,fontWeight:600,color:B.slateDark}}>{a.usuario_nombre||"—"}</div>
                                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:B.muted}}>{(a.created_at||"").slice(0,16).replace("T"," ")}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </>)}
      </div>

      {/* ══ MODALES ══ */}
      {modal&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal">

            {/* Cirugía */}
            {(modal==="cx_n"||modal==="cx_e")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div><h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>{modal==="cx_n"?"Nueva intervención":"Editar intervención"}</h3>{form.id&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:B.muted}}>{form.id}</div>}</div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:28,height:28,fontSize:16,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div className="form-grid">
                {[["Fecha",<input type="date" className="inp" value={form.fecha||""} onChange={e=>setForm({...form,fecha:e.target.value})}/>],["Hospital",<select className="inp" value={form.hospital||""} onChange={e=>setForm({...form,hospital:e.target.value})}>{hospNames.map(h=><option key={h}>{h}</option>)}</select>],["Quirófano",<select className="inp" value={form.quirofano||""} onChange={e=>setForm({...form,quirofano:e.target.value})}>{"Q-1,Q-2,Q-3,Q-4".split(",").map(q=><option key={q}>{q}</option>)}</select>],["Tipo de cirugía",<input className="inp" value={form.tipo||""} onChange={e=>setForm({...form,tipo:e.target.value})} placeholder="Ej: Laparoscopia"/>],["Hora inicio",<input type="time" className="inp" value={form.inicio||""} onChange={e=>setForm({...form,inicio:e.target.value})}/>],["Hora fin",<input type="time" className="inp" value={form.fin||""} onChange={e=>setForm({...form,fin:e.target.value})}/>],["Cirujano",<select className="inp" value={form.cirujano||""} onChange={e=>setForm({...form,cirujano:e.target.value})}>{pOpts(form.fecha)}</select>],["Ayudante",<select className="inp" value={form.ayudante||""} onChange={e=>setForm({...form,ayudante:e.target.value})}>{pOpts(form.fecha,true,"— Sin ayudante —")}</select>],["Enfermera",<select className="inp" value={form.enfermera||""} onChange={e=>setForm({...form,enfermera:e.target.value})}>{pOpts(form.fecha,true,"— Sin asignar —","Enf")}</select>],["Código paciente",<input className="inp" value={form.paciente||""} onChange={e=>setForm({...form,paciente:e.target.value})} placeholder="PAC-2025-XXX"/>],["Estado",<select className="inp" value={form.estado||""} onChange={e=>setForm({...form,estado:e.target.value})}>{ESTADOS_CX.map(s=><option key={s}>{s}</option>)}</select>],...(isAdmin?[["Factura",<select className="inp" value={form.factura||""} onChange={e=>setForm({...form,factura:e.target.value})}>{ESTADOS_FA.map(s=><option key={s}>{s}</option>)}</select>]]:[])]
                .map(([l,f])=><FG key={l} label={l}>{f}</FG>)}
              </div>
              <FG label="Material especial" style={{marginTop:12}}><input className="inp" value={form.material||""} onChange={e=>setForm({...form,material:e.target.value})} placeholder="Ej: Laparoscopio 5mm, sutura reabsorbible..."/></FG>
              <FG label="Observaciones" style={{marginTop:12}}><textarea className="inp" rows={2} value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} placeholder="Notas..." style={{resize:"vertical"}}/></FG>
              {form.fecha&&[form.cirujano,form.ayudante,form.enfermera].filter(Boolean).filter(n=>estaAusente(n,form.fecha)).map(n=>(
                <div key={n} style={{marginTop:8,padding:"7px 10px",background:"#FEF3C7",border:"1px solid #F59E0B",borderRadius:8,fontSize:12,color:"#92400E"}}>⚠ <strong>{n}</strong> tiene ausencia registrada el {form.fecha}</div>
              ))}
              {form.fecha&&form.inicio&&form.fin&&[{rol:"Cirujano",n:form.cirujano},{rol:"Ayudante",n:form.ayudante},{rol:"Enfermera",n:form.enfermera}].filter(x=>x.n).map(({rol,n})=>{const c=conflictoHorario(n,form.fecha,form.inicio,form.fin,form.id);return c?(<div key={n} style={{marginTop:8,padding:"7px 10px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,fontSize:12,color:"#B91C1C"}}>🔴 <strong>{n}</strong> ({rol}) tiene conflicto: <em>{c.tipo||"otra cirugía"}</em> {c.inicio}–{c.fin} en {c.hospital}</div>):null;})}
              {(()=>{const quirBloq=form.fecha&&form.quirofano&&form.inicio&&form.hospital&&esCerradoQuir(form.hospital,form.quirofano,form.fecha,turnoFromHora(form.inicio));return quirBloq?(<div style={{marginTop:8,padding:"9px 12px",background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:8,fontSize:12,color:"#B91C1C",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>⛔</span><div><strong>{form.quirofano}</strong> está <strong>cerrado</strong> para el turno {turnoFromHora(form.inicio)} del {form.fecha}. Abrilo desde la sección Quirófanos antes de agendar.</div></div>):null;})()}
              {modal==="cx_e"&&(()=>{const hist=auditoria.filter(a=>a.registro_id===form.id).slice(0,6);return hist.length>0?(<div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${B.border}`}}><div style={{fontSize:10,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Historial de cambios</div>{hist.map((a,i)=><div key={i} style={{fontSize:11,color:B.muted,marginBottom:5,padding:"5px 8px",background:B.bg,borderRadius:6}}><span style={{color:B.slate,fontWeight:600}}>{a.usuario_nombre}</span> · {(a.created_at||"").slice(0,16).replace("T"," ")} · {a.accion==="insert"?"⊕ Creada":a.accion==="delete"?"✕ Eliminada":`✎ ${Object.keys(a.cambios||{}).join(", ")}`}</div>)}</div>):null;})()}
              <div style={{display:"flex",gap:10,marginTop:18,justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:8}}>{modal==="cx_e"&&<button className="btn-danger" onClick={()=>delCx(form.id)} disabled={saving}>🗑</button>}{modal==="cx_e"&&<button className="btn-sec" onClick={duplicarCx} style={{fontSize:12}}>📋 Duplicar</button>}</div>
                <div style={{display:"flex",gap:10}}><button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button><button className="btn-gold" onClick={saveCx} disabled={saving||!!(form.fecha&&form.quirofano&&form.inicio&&form.hospital&&esCerradoQuir(form.hospital,form.quirofano,form.fecha,turnoFromHora(form.inicio)))}>{saving?"Guardando...":modal==="cx_n"?"Crear":"Guardar"}</button></div>
              </div>
            </>)}

            {/* Guardia */}
            {modal==="g_edit"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div><h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>🛡️ Guardia</h3><div style={{fontSize:12,color:B.muted,marginTop:1}}>{form.fecha} · {form.hospital}</div></div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:28,height:28,fontSize:16,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="Cirujano principal"><select className="inp" value={form.cirujano_principal||""} onChange={e=>setForm({...form,cirujano_principal:e.target.value})}>{pOpts(form.fecha,true)}</select></FG>
                <FG label="Cirujano ayudante"><select className="inp" value={form.cirujano_ayudante||""} onChange={e=>setForm({...form,cirujano_ayudante:e.target.value})}>{pOpts(form.fecha,true)}</select></FG>
                <FG label="Notas"><input className="inp" value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Observaciones..."/></FG>
              </div>
              {form.fecha&&[form.cirujano_principal,form.cirujano_ayudante].filter(Boolean).filter(n=>estaAusente(n,form.fecha)).map(n=>(
                <div key={n} style={{marginTop:8,padding:"7px 10px",background:"#FEF3C7",border:"1px solid #F59E0B",borderRadius:8,fontSize:12,color:"#92400E"}}>⚠ <strong>{n}</strong> tiene ausencia registrada el {form.fecha}</div>
              ))}
              <div style={{display:"flex",gap:10,marginTop:18,justifyContent:"space-between"}}>
                <div>{form.id&&<button className="btn-danger" onClick={()=>delGuardia(form.id)}>🗑 Eliminar</button>}</div>
                <div style={{display:"flex",gap:10}}><button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button><button className="btn-gold" onClick={saveGuardia} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></div>
              </div>
            </>)}

            {/* Sugerencia guardia */}
            {modal==="sug_n"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div><h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>📅 Sugerir día de guardia</h3><p style={{fontSize:12,color:B.muted,marginTop:2}}>El administrador confirmará o rechazará tu propuesta.</p></div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:28,height:28,fontSize:16,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="Fecha propuesta"><input type="date" className="inp" value={form.fecha||""} onChange={e=>setForm({...form,fecha:e.target.value})} min={todayStr}/></FG>
                <FG label="Hospital"><select className="inp" value={form.hospital||""} onChange={e=>setForm({...form,hospital:e.target.value})}>{hospNames.map(h=><option key={h}>{h}</option>)}</select></FG>
                <FG label="Nota (opcional)"><input className="inp" value={form.nota||""} onChange={e=>setForm({...form,nota:e.target.value})} placeholder="Ej: Disponible todo el día"/></FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:18,justifyContent:"flex-end"}}>
                <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                <button className="btn-gold" onClick={saveSugerencia} disabled={saving}>{saving?"Enviando...":"Enviar sugerencia"}</button>
              </div>
            </>)}

            {/* Subir documento */}
            {modal==="doc_n"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div><h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>📁 Subir documento</h3><p style={{fontSize:12,color:B.muted,marginTop:2}}>PDF, Word, imágenes — máx. recomendado 10MB</p></div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:28,height:28,fontSize:16,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="Archivo">
                  <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${form._file?B.slate:B.border}`,borderRadius:10,padding:"20px",textAlign:"center",cursor:"pointer",transition:"all .15s",background:form._file?"#F0F4F8":B.bg}} onMouseEnter={e=>e.currentTarget.style.borderColor=B.slate} onMouseLeave={e=>e.currentTarget.style.borderColor=form._file?B.slate:B.border}>
                    {form._file?(<><div style={{fontSize:24}}>📄</div><div style={{fontWeight:600,fontSize:13,marginTop:6}}>{form._file.name}</div><div style={{fontSize:11,color:B.muted}}>{fmtSize(form._file.size)}</div></>):(<><div style={{fontSize:28}}>☁️</div><div style={{fontSize:13,color:B.muted,marginTop:6}}>Toca para seleccionar archivo</div></>)}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_file:e.target.files[0],nombre:form.nombre||e.target.files[0].name.replace(/\.[^.]+$/,"")})}/>
                </FG>
                <FG label="Nombre del documento"><input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Consentimiento Laparoscopia"/></FG>
                <FG label="Categoría"><select className="inp" value={form.categoria||"Consentimientos"} onChange={e=>setForm({...form,categoria:e.target.value})}>{CAT_DOCS.map(c=><option key={c}>{c}</option>)}</select></FG>
                <FG label="Descripción (opcional)"><input className="inp" value={form.descripcion||""} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Breve descripción..."/></FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:18,justifyContent:"flex-end"}}>
                <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                <button className="btn-gold" onClick={subirDocumento} disabled={uploading||!form._file}>{uploading?"Subiendo...":"Subir documento"}</button>
              </div>
            </>)}

            {/* Personal */}
            {(modal==="p_n"||modal==="p_e")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>{modal==="p_n"?"Nuevo profesional":"Editar profesional"}</h3>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:28,height:28,fontSize:16,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div className="form-grid">
                <FG label="Nombre"><input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Dr. García"/></FG>
                <FG label="Rol"><select className="inp" value={form.rol||""} onChange={e=>setForm({...form,rol:e.target.value})}>{ROLES_P.map(r=><option key={r}>{r}</option>)}</select></FG>
                <FG label="Teléfono"><input className="inp" value={form.tel||""} onChange={e=>setForm({...form,tel:e.target.value})} placeholder="655 000 000"/></FG>
                <FG label="Color"><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>{COLORES.map(c=><div key={c} onClick={()=>setForm({...form,color:c})} style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?`3px solid ${B.slateDark}`:"3px solid transparent",transition:"all .15s"}}/>)}</div></FG>
              </div>
              <FG label="Hospitales" style={{marginTop:12}}><div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>{hospitales.map(h=><div key={h.id} onClick={()=>togH(h.nombre)} style={{padding:"6px 12px",borderRadius:8,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",background:(form.hospitales||[]).includes(h.nombre)?B.slate:"white",color:(form.hospitales||[]).includes(h.nombre)?"white":B.slate,borderColor:(form.hospitales||[]).includes(h.nombre)?B.slate:B.border}}>{h.nombre}</div>)}</div></FG>
              {modal==="p_e"&&(
                <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${B.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:700,color:B.slateDark}}>📅 Ausencias</div>
                    <button className="btn-sec" style={{padding:"3px 9px",fontSize:11}} onClick={()=>{setShowAusForm(!showAusForm);setAusForm({fecha_inicio:todayStr,fecha_fin:todayStr,motivo:""});}}>+ Añadir</button>
                  </div>
                  {showAusForm&&(
                    <div style={{background:B.bg,borderRadius:9,padding:"10px 12px",marginBottom:10,display:"flex",flexDirection:"column",gap:9}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <FG label="Desde"><input type="date" className="inp" value={ausForm.fecha_inicio} onChange={e=>setAusForm({...ausForm,fecha_inicio:e.target.value})}/></FG>
                        <FG label="Hasta"><input type="date" className="inp" value={ausForm.fecha_fin} onChange={e=>setAusForm({...ausForm,fecha_fin:e.target.value})}/></FG>
                      </div>
                      <FG label="Motivo (opcional)"><input className="inp" value={ausForm.motivo} onChange={e=>setAusForm({...ausForm,motivo:e.target.value})} placeholder="Vacaciones, baja, etc."/></FG>
                      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                        <button className="btn-sec" style={{fontSize:12}} onClick={()=>setShowAusForm(false)}>Cancelar</button>
                        <button className="btn-gold" style={{fontSize:12}} onClick={addAusencia} disabled={saving}>{saving?"Guardando...":"Guardar ausencia"}</button>
                      </div>
                    </div>
                  )}
                  {ausencias.filter(a=>a.personal_id===form.id).length===0?(
                    <div style={{fontSize:12,color:B.muted,fontStyle:"italic"}}>Sin ausencias registradas</div>
                  ):ausencias.filter(a=>a.personal_id===form.id).map(a=>(
                    <div key={a.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${B.border}`}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:B.text}}>{a.fecha_inicio===a.fecha_fin?a.fecha_inicio:`${a.fecha_inicio} → ${a.fecha_fin}`}</div>
                        {a.motivo&&<div style={{fontSize:11,color:B.muted}}>{a.motivo}</div>}
                      </div>
                      <button onClick={()=>delAusencia(a.id)} style={{border:"none",background:"transparent",cursor:"pointer",color:"#B91C1C",fontSize:14,padding:"2px 6px"}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:18,justifyContent:"space-between"}}>
                <div>{modal==="p_e"&&<button className="btn-danger" onClick={()=>delP(form.id)}>🗑</button>}</div>
                <div style={{display:"flex",gap:10}}><button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button><button className="btn-gold" onClick={saveP} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></div>
              </div>
            </>)}

            {/* Hospital */}
            {(modal==="h_n"||modal==="h_e")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>{modal==="h_n"?"Nuevo hospital":"Editar hospital"}</h3>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:28,height:28,fontSize:16,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="Nombre"><input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Hospital Vall d'Hebron"/></FG>
                <FG label="Dirección (opcional)"><input className="inp" value={form.direccion||""} onChange={e=>setForm({...form,direccion:e.target.value})} placeholder="Dirección..."/></FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:18,justifyContent:"space-between"}}>
                <div>{modal==="h_e"&&<button className="btn-danger" onClick={()=>delH(form.id)}>🗑</button>}</div>
                <div style={{display:"flex",gap:10}}><button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button><button className="btn-gold" onClick={saveH} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></div>
              </div>
            </>)}

          </div>
        </div>
      )}

      {/* ══ BÚSQUEDA GLOBAL ══ */}
      {showBusqueda&&(
        <div onClick={()=>setShowBusqueda(false)} style={{position:"fixed",inset:0,background:"rgba(28,43,58,.6)",backdropFilter:"blur(3px)",zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:72}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:16,width:"92%",maxWidth:580,maxHeight:"72vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.28)"}}>
            {/* Input */}
            <div style={{padding:"14px 16px",borderBottom:`1px solid ${B.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              <span style={{fontSize:17,color:B.muted,lineHeight:1}}>🔍</span>
              <input autoFocus placeholder="Buscar cirugías, personal, documentos…" value={queryBusq} onChange={e=>setQueryBusq(e.target.value)} onKeyDown={e=>e.key==="Escape"&&setShowBusqueda(false)} style={{flex:1,border:"none",outline:"none",fontSize:14,color:B.text,background:"transparent"}}/>
              {queryBusq&&<button onClick={()=>setQueryBusq("")} style={{border:"none",background:"transparent",cursor:"pointer",color:B.muted,fontSize:16,lineHeight:1,padding:2}}>✕</button>}
              <button onClick={()=>setShowBusqueda(false)} style={{border:"none",background:B.bg,borderRadius:6,padding:"4px 10px",fontSize:12,color:B.muted,cursor:"pointer",flexShrink:0}}>Esc</button>
            </div>
            {/* Results */}
            <div style={{overflowY:"auto",flex:1,padding:"10px 8px"}}>
              {queryBusq.trim().length<2?(
                <div style={{textAlign:"center",color:B.muted,fontSize:13,padding:"32px 0"}}>Escribe al menos 2 caracteres para buscar</div>
              ):(()=>{
                const q=queryBusq.trim().toLowerCase();
                const hi=(txt)=>{if(!txt)return"";const i=txt.toLowerCase().indexOf(q);if(i<0)return txt;return<>{txt.slice(0,i)}<mark style={{background:B.goldLight,borderRadius:2,padding:"0 1px"}}>{txt.slice(i,i+q.length)}</mark>{txt.slice(i+q.length)}</>;};
                const resCx=cirugias.filter(c=>[c.tipo,c.paciente,c.cirujano,c.ayudante,c.enfermera,c.hospital,c.estado].some(v=>v&&v.toLowerCase().includes(q))).slice(0,6);
                const resPers=personal.filter(p=>[p.nombre,p.rol].some(v=>v&&v.toLowerCase().includes(q))).slice(0,5);
                const resDocs=documentos.filter(d=>[d.nombre,d.descripcion,d.categoria].some(v=>v&&v.toLowerCase().includes(q))).slice(0,5);
                const total=resCx.length+resPers.length+resDocs.length;
                if(total===0)return<div style={{textAlign:"center",color:B.muted,fontSize:13,padding:"32px 0"}}>Sin resultados para «{queryBusq.trim()}»</div>;
                const Row=({icon,iconBg,title,sub,badge,onClick})=>(
                  <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:8,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=B.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{width:34,height:34,borderRadius:8,background:iconBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,color:B.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
                      <div style={{fontSize:11,color:B.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sub}</div>
                    </div>
                    {badge&&<div style={{flexShrink:0}}>{badge}</div>}
                  </div>
                );
                const SecH=({label,n})=><div style={{fontSize:10,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.9,padding:"8px 10px 4px"}}>{label} <span style={{fontWeight:500,opacity:.7}}>({n})</span></div>;
                return(<>
                  {resCx.length>0&&(<div style={{marginBottom:6}}>
                    <SecH label="Cirugías" n={resCx.length}/>
                    {resCx.map(c=>(
                      <Row key={c.id} icon="🏥" iconBg={bEst(c.estado)}
                        title={<>{hi(c.tipo||"Sin tipo")} — {hi(c.paciente||"Sin paciente")}</>}
                        sub={`${c.fecha} · ${c.hospital||""} · ${c.cirujano||""}`}
                        badge={<Bdg label={c.estado||"?"} bg={bEst(c.estado)} color={ceColor(c.estado)}/>}
                        onClick={()=>{setTab("agenda");setSelDate(c.fecha);setShowBusqueda(false);}}/>
                    ))}
                  </div>)}
                  {resPers.length>0&&(<div style={{marginBottom:6}}>
                    <SecH label="Personal" n={resPers.length}/>
                    {resPers.map(p=>(
                      <Row key={p.id}
                        icon={<span style={{color:"white",fontWeight:700,fontSize:12}}>{(p.nombre||"?")[0]}</span>}
                        iconBg={p.color||B.slate}
                        title={hi(p.nombre||"")}
                        sub={hi(p.rol||"")}
                        onClick={()=>{setTab("personal");setShowBusqueda(false);}}/>
                    ))}
                  </div>)}
                  {resDocs.length>0&&(<div style={{marginBottom:4}}>
                    <SecH label="Documentos" n={resDocs.length}/>
                    {resDocs.map(d=>(
                      <Row key={d.id} icon="📄" iconBg="#E8EDF2"
                        title={hi(d.nombre||"")}
                        sub={`${d.categoria||""} · ${d.descripcion?.slice(0,55)||""}`}
                        onClick={()=>{setTab("documentos");setShowBusqueda(false);}}/>
                    ))}
                  </div>)}
                </>);
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

    

