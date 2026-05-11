import { useState, useEffect, useRef } from "react";

const SB_URL = "https://itcarcntzopvchxoeyzv.supabase.co";
const SB_KEY = "sb_publishable_sp21Q5eB6VqFrSgGjz28jQ_LMVoSmCk";
const API     = (t) => `${SB_URL}/rest/v1/${t}`;
const STORAGE = `${SB_URL}/storage/v1`;
const AUTH_EP = (p) => `${SB_URL}/auth/v1/${p}`;
const H = (tok) => ({"Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${tok||SB_KEY}`,"Prefer":"return=representation"});
const dbGet    = async (t,q="",tok)  => { const r=await fetch(`${API(t)}?${q}`,{headers:H(tok)}); if(!r.ok)throw new Error(await r.text()); return r.json(); };
const dbInsert = async (t,d,tok)     => { const r=await fetch(API(t),{method:"POST",headers:H(tok),body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); return r.json(); };
const dbUpdate = async (t,id,d,tok)  => { const r=await fetch(`${API(t)}?id=eq.${id}`,{method:"PATCH",headers:H(tok),body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); return r.json(); };
const dbDelete = async (t,id,tok)    => { const r=await fetch(`${API(t)}?id=eq.${id}`,{method:"DELETE",headers:H(tok)}); if(!r.ok)throw new Error(await r.text()); };
const authSignUp = async (email,pwd,nombre) => { const r=await fetch(AUTH_EP("signup"),{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email,password:pwd,data:{nombre}})}); return r.json(); };
const authSignIn = async (email,pwd) => { const r=await fetch(`${AUTH_EP("token")}?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email,password:pwd})}); return r.json(); };
const authSignOut = async (tok) => { await fetch(AUTH_EP("logout"),{method:"POST",headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`}}); };
const uploadDoc = async (path,file,tok) => { const r=await fetch(`${STORAGE}/object/documentos/${path}`,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`,"Content-Type":file.type,"x-upsert":"true"},body:file}); return r.json(); };
const getSignedUrl = async (path,tok) => { const r=await fetch(`${STORAGE}/object/sign/documentos/${path}`,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`,"Content-Type":"application/json"},body:JSON.stringify({expiresIn:3600})}); const d=await r.json(); return `${SB_URL}${d.signedURL}`; };
const deleteStorageFile = async (path,tok) => { await fetch(`${STORAGE}/object/documentos`,{method:"DELETE",headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`,"Content-Type":"application/json"},body:JSON.stringify({prefixes:[path]})}); };

const B={slate:"#4A6079",slateDark:"#2E3F52",slateLight:"#6B8299",gold:"#F5C842",goldLight:"#FDF3C0",goldDark:"#D4A820",bg:"#F2F5F8",white:"#FFFFFF",text:"#1C2B3A",muted:"#7A90A4",border:"#DDE4EB"};
const ACCENTS=[B.slate,B.slateDark,B.slateLight,"#3D6B8C","#6B4F9A","#2E7D52"];
const COLORES=["#4A6079","#2E3F52","#6B8299","#D4A820","#8B6914","#3D6B8C","#6B4F9A","#2E7D52","#B91C1C","#1D6FA4"];
const ESTADOS_CX=["Confirmada","Pendiente","Realizada","Cancelada"];
const ESTADOS_FA=["Pendiente","Facturada","En revisión","Cobrada"];
const DIAS_H=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CAT_DOCS=["Consentimientos","Hojas de información","Protocolos","Formularios","Otros"];
const HOSP_PUBLICO="Hospital Público";
const ROL_ADMIN="admin";
const ROL_CIR_PRINCIPAL="cirujano_principal";
const ROL_CIRUJANO="cirujano";
const ROL_ENFERMERO="enfermero";
const ROLES_APP=[ROL_ADMIN,ROL_CIR_PRINCIPAL,ROL_CIRUJANO,ROL_ENFERMERO];
const ROLES_LABELS={admin:"Administrador",cirujano_principal:"Cirujano Principal",cirujano:"Cirujano",enfermero:"Enf. Instrumentista"};

const today=new Date();
const fmt=(d)=>{const x=new Date(d);x.setHours(12);return x.toISOString().split("T")[0];};
const todayStr=fmt(today);
const newId=()=>`CIR-${Date.now().toString().slice(-6)}`;
const fmtSize=(b)=>b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(1)}KB`:`${(b/1048576).toFixed(1)}MB`;
const ceColor=(e)=>({"Confirmada":"#2E7D52","Pendiente":"#9A6B00","Realizada":B.slate,"Cancelada":"#B91C1C"}[e]||B.muted);
const bEst=(e)=>({"Confirmada":"#E6F4EC","Pendiente":B.goldLight,"Realizada":"#E8EDF2","Cancelada":"#FEE2E2"}[e]||"#F1F5F9");
const cFact=(e)=>({"Pendiente":"#9A6B00","Facturada":B.slate,"En revisión":"#B91C1C","Cobrada":"#2E7D52"}[e]||B.muted);
const bFact=(e)=>({"Pendiente":B.goldLight,"Facturada":"#E8EDF2","En revisión":"#FEE2E2","Cobrada":"#E6F4EC"}[e]||"#F1F5F9");
const useWindowWidth=()=>{const[w,setW]=useState(window.innerWidth);useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w;};

const Bdg=({label,bg,color,style={}})=><span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,background:bg,color,whiteSpace:"nowrap",...style}}>{label}</span>;
const FG=({label,children,style={}})=>(<div style={style}><label style={{display:"block",fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:6}}>{label}</label>{children}</div>);
const ColH=({children})=><div style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.5}}>{children}</div>;
const Spin=({text="Cargando..."})=>(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 0",gap:14}}><div style={{width:32,height:32,border:`3px solid ${B.border}`,borderTopColor:B.slate,borderRadius:"50%",animation:"spin 1s linear infinite"}}/><div style={{color:B.muted,fontSize:13}}>{text}</div></div>);

function CalMes({year,month,renderDay,onPrev,onNext,onToday}){
  const first=new Date(year,month,1),last=new Date(year,month+1,0);
  let sd=first.getDay()-1;if(sd<0)sd=6;
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
          if(!day)return<div key={`e${i}`} style={{minHeight:72,background:"#FAFBFC",borderRight:i%7<6?`1px solid ${B.border}`:"none",borderBottom:`1px solid ${B.border}`}}/>;
          const ds=fmt(new Date(year,month,day));
          return renderDay({day,dateStr:ds,isToday:ds===todayStr,isWeekend:(i%7)>=5,col:i%7});
        })}
      </div>
    </div>
  );
}

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
      try{const d=await authSignIn(form.email,form.password);if(d.error||!d.access_token){setError(d.error_description||"Credenciales incorrectas.");return;}localStorage.setItem("cirmi_token",d.access_token);onAuth(d.access_token,d.user);}
      catch{setError("Error de conexión.");}finally{setLoading(false);}
    }else{
      if(!form.email||!form.password||!form.nombre){setError("Completa todos los campos.");return;}
      if(form.password!==form.confirm){setError("Las contraseñas no coinciden.");return;}
      if(form.password.length<6){setError("Mínimo 6 caracteres.");return;}
      setLoading(true);
      try{const d=await authSignUp(form.email,form.password,form.nombre);if(d.error){setError(d.msg||"Error al registrarse.");return;}setSuccess("Registro completado. El administrador revisará tu solicitud.");setMode("login");}
      catch{setError("Error de conexión.");}finally{setLoading(false);}
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
  const[ayudantias,setAyudantias]=useState([]);
  const[dispEnfermeria,setDispEnfermeria]=useState([]);
  const[showNotifs,setShowNotifs]=useState(false);
  const[modal,setModal]=useState(null);
  const[form,setForm]=useState({});
  const[selDate,setSelDate]=useState(todayStr);
  const[calY,setCalY]=useState(today.getFullYear());
  const[calM,setCalM]=useState(today.getMonth());
  const[gY,setGY]=useState(today.getFullYear());
  const[gM,setGM]=useState(today.getMonth());
  const[ayY,setAyY]=useState(today.getFullYear());
  const[ayM,setAyM]=useState(today.getMonth());
  const[dispY,setDispY]=useState(today.getFullYear());
  const[dispM,setDispM]=useState(today.getMonth());
  const[filtFact,setFiltFact]=useState("Todos");
  const[filtCat,setFiltCat]=useState("Todos");
  const[configTab,setConfigTab]=useState("personal");
  const[guardHosp,setGuardHosp]=useState(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[uploading,setUploading]=useState(false);
  // ── MODO VISTA ADMIN ──
  const[vistaRol,setVistaRol]=useState("");
  const fileRef=useRef();

  // ── Roles reales ──
  const isAdmin=perfil?.rol==="admin"||perfil?.rol_app===ROL_ADMIN;

  // ── Rol efectivo (admin puede simular otro rol) ──
  const rolEfectivo=isAdmin&&vistaRol?vistaRol:(perfil?.rol_app||ROL_CIRUJANO);
  const isCirPrincipal=rolEfectivo===ROL_CIR_PRINCIPAL||(isAdmin&&!vistaRol);
  const isCirujano=rolEfectivo===ROL_CIRUJANO;
  const isEnfermero=rolEfectivo===ROL_ENFERMERO;
  const canCreateCx=isAdmin&&!vistaRol||isCirPrincipal;
  const canSeeFacturacion=isAdmin&&!vistaRol;
  const canSeePersonal=isAdmin&&!vistaRol;
  const canSeeHospPublico=isCirPrincipal||isAdmin&&!vistaRol;

  const unread=notifs.filter(n=>!n.leida).length;
  const sugPend=sugerencias.filter(s=>s.estado==="pendiente");
  const ayudPend=ayudantias.filter(a=>a.estado==="pendiente");

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

  const loadAll=async()=>{
    setLoading(true);
    try{
      const[c,p,h,g,s,d,n,ay,de]=await Promise.all([
        dbGet("cirugias","order=fecha.asc,inicio.asc"),
        dbGet("personal","order=nombre.asc&activo=eq.true"),
        dbGet("hospitales","order=nombre.asc&activo=eq.true"),
        dbGet("guardias","order=fecha.asc"),
        dbGet("sugerencias_guardia","order=created_at.desc"),
        dbGet("documentos","order=created_at.desc"),
        dbGet("notificaciones",`usuario_id=eq.${authUser?.id}&order=created_at.desc&limit=20`),
        dbGet("ayudantias","order=created_at.desc"),
        dbGet("disponibilidad_enfermeria","order=fecha.asc"),
      ]);
      setCirugias(c);setPersonal(p);setHospitales(h);setGuardias(g);setSugerencias(s);setDocumentos(d);setNotifs(n);setAyudantias(ay);setDispEnfermeria(de);
      if(h.length>0&&!guardHosp)setGuardHosp(h.filter(x=>x.nombre!==HOSP_PUBLICO)[0]?.nombre||h[0]?.nombre);
      if(isAdmin){const pf=await dbGet("perfiles","order=created_at.desc");setPerfiles(pf);}
    }catch(e){console.error(e);}finally{setLoading(false);}
  };

  const hospNames=hospitales.map(h=>h.nombre);
  const hospNamesNoPublico=hospNames.filter(h=>h!==HOSP_PUBLICO);
  const prevM=(y,m,sY,sM)=>{if(m===0){sY(y-1);sM(11);}else sM(m-1);};
  const nextM=(y,m,sY,sM)=>{if(m===11){sY(y+1);sM(0);}else sM(m+1);};

  const markRead=async(id)=>{try{await dbUpdate("notificaciones",id,{leida:true},session);setNotifs(n=>n.map(x=>x.id===id?{...x,leida:true}:x));}catch{}};
  const markAllRead=async()=>{try{await Promise.all(notifs.filter(n=>!n.leida).map(n=>dbUpdate("notificaciones",n.id,{leida:true},session)));setNotifs(n=>n.map(x=>({...x,leida:true})));}catch{}};
  const createNotif=async(uid,msg)=>{try{await dbInsert("notificaciones",{usuario_id:uid,mensaje:msg},session);}catch{}};

  const notificarAyudantia=async(cx,solicitante)=>{
    const admins=perfiles.filter(p=>p.rol==="admin"||p.rol_app===ROL_ADMIN);
    for(const a of admins){if(a.id!==authUser?.id)await createNotif(a.id,`🤝 ${solicitante} se ha apuntado como ayudante en "${cx.tipo}" el ${cx.fecha} (${cx.hospital})`);}
    const cirProf=perfiles.find(p=>p.nombre===cx.cirujano);
    if(cirProf&&cirProf.id!==authUser?.id)await createNotif(cirProf.id,`🤝 ${solicitante} solicita ser tu ayudante en "${cx.tipo}" el ${cx.fecha}`);
  };

  const openNewCx=(fecha=selDate)=>{
    if(!canCreateCx){alert("No tienes permisos para crear cirugías.");return;}
    setForm({id:newId(),fecha,hospital:hospNamesNoPublico[0]||"",quirofano:"Q-1",tipo:"",turno:"mañana",cirujano:personal.filter(p=>p.rol_app===ROL_CIR_PRINCIPAL||p.rol==="admin")[0]?.nombre||"",ayudante_requerido:"no",instrumentista_requerido:"no",ayudante:"",enfermera:"",inicio:"08:00",fin:"10:00",estado:"Confirmada",factura:"Pendiente",paciente:"",obs:""});
    setModal("cx_n");
  };
  const saveCx=async()=>{
    if(!form.tipo?.trim()){alert("El tipo de cirugía es obligatorio.");return;}
    if(!form.ayudante_requerido){alert("Indica si se requiere ayudante.");return;}
    if(!form.instrumentista_requerido){alert("Indica si se requiere instrumentista.");return;}
    setSaving(true);
    try{
      if(modal==="cx_n")await dbInsert("cirugias",form);
      else{const{id,...d}=form;await dbUpdate("cirugias",id,d);}
      await loadAll();setModal(null);
    }catch{alert("Error al guardar.");}finally{setSaving(false);}
  };
  const delCx=async(id)=>{if(!confirm("¿Eliminar?"))return;try{await dbDelete("cirugias",id);await loadAll();setModal(null);}catch{alert("Error.");}};
  const updFact=async(id,v)=>{try{await dbUpdate("cirugias",id,{factura:v});setCirugias(p=>p.map(c=>c.id===id?{...c,factura:v}:c));}catch{alert("Error.");}};

  const openGuardia=(fecha,hospital)=>{
    const hospPubGuardia=guardias.find(g=>g.fecha===fecha&&g.hospital===HOSP_PUBLICO);
    setForm({fecha,hospital,cirujano_principal:"",cirujano_ayudante:"",notas:"",_incompatibilidad:hospPubGuardia?`⚠️ ${hospPubGuardia.cirujano_principal||"Alguien"} tiene guardia en Hospital Público este día`:null,...(guardias.find(g=>g.fecha===fecha&&g.hospital===hospital)||{})});
    setModal("g_edit");
  };
  const saveGuardia=async()=>{
    const{_incompatibilidad,...data}=form;
    setSaving(true);
    try{
      if(data.id){const{id,...d}=data;await dbUpdate("guardias",id,d);}
      else await dbInsert("guardias",data);
      // Notificar incompatibilidad al admin
      if(_incompatibilidad){
        const admins=perfiles.filter(p=>p.rol==="admin"||p.rol_app===ROL_ADMIN);
        for(const a of admins){await createNotif(a.id,`⚠️ Guardia asignada en ${data.hospital} el ${data.fecha} con posible incompatibilidad: ${_incompatibilidad}`);}
      }
      await loadAll();setModal(null);
    }catch{alert("Error.");}finally{setSaving(false);}
  };
  const delGuardia=async(id)=>{if(!confirm("¿Eliminar?"))return;try{await dbDelete("guardias",id);await loadAll();setModal(null);}catch{alert("Error.");}};

  const openSugerencia=()=>{setForm({fecha:todayStr,hospital:hospNames[0]||"",nota:""});setModal("sug_n");};
  const saveSugerencia=async()=>{
    if(!form.fecha||!form.hospital){alert("Selecciona fecha y hospital.");return;}
    setSaving(true);
    try{await dbInsert("sugerencias_guardia",{...form,usuario_id:authUser?.id,usuario_nombre:perfil?.nombre||perfil?.email,estado:"pendiente"});await loadAll();setModal(null);}
    catch{alert("Error.");}finally{setSaving(false);}
  };
  const aprobarSug=async(sug)=>{
    try{
      const existe=guardias.find(g=>g.fecha===sug.fecha&&g.hospital===sug.hospital);
      if(!existe)await dbInsert("guardias",{fecha:sug.fecha,hospital:sug.hospital,cirujano_principal:sug.usuario_nombre,notas:sug.nota||""});
      await dbUpdate("sugerencias_guardia",sug.id,{estado:"aprobada"});
      await createNotif(sug.usuario_id,`✅ Tu sugerencia de guardia para el ${sug.fecha} en ${sug.hospital} ha sido APROBADA.`);
      await loadAll();
    }catch{alert("Error.");}
  };
  const rechazarSug=async(sug)=>{
    try{await dbUpdate("sugerencias_guardia",sug.id,{estado:"rechazada"});await createNotif(sug.usuario_id,`❌ Tu sugerencia de guardia para el ${sug.fecha} en ${sug.hospital} ha sido RECHAZADA.`);await loadAll();}
    catch{alert("Error.");}
  };

  const solicitarAyudantia=async(cx,turno)=>{
    const yaSolicite=ayudantias.find(a=>a.cirugia_id===cx.id&&a.usuario_id===authUser?.id);
    if(yaSolicite){alert("Ya has solicitado esta ayudantía.");return;}
    setSaving(true);
    try{
      await dbInsert("ayudantias",{cirugia_id:cx.id,fecha:cx.fecha,hospital:cx.hospital,tipo:turno,cirujano_solicitante:perfil?.nombre||perfil?.email,usuario_id:authUser?.id,estado:"pendiente"});
      await notificarAyudantia(cx,perfil?.nombre||perfil?.email);
      await loadAll();
      alert("✅ Solicitud enviada. El administrador te confirmará.");
    }catch{alert("Error.");}finally{setSaving(false);}
  };
  const aprobarAyudantia=async(ay)=>{
    try{
      await dbUpdate("ayudantias",ay.id,{estado:"aprobada"});
      const cx=cirugias.find(c=>c.id===ay.cirugia_id);
      if(cx)await dbUpdate("cirugias",cx.id,{ayudante:ay.cirujano_solicitante});
      await createNotif(ay.usuario_id,`✅ Tu solicitud de ayudantía para "${cirugias.find(c=>c.id===ay.cirugia_id)?.tipo||"cirugía"}" el ${ay.fecha} ha sido APROBADA.`);
      const otras=ayudantias.filter(a=>a.cirugia_id===ay.cirugia_id&&a.id!==ay.id&&a.estado==="pendiente");
      for(const o of otras){await dbUpdate("ayudantias",o.id,{estado:"rechazada"});await createNotif(o.usuario_id,`❌ Tu solicitud de ayudantía para el ${o.fecha} no ha sido seleccionada.`);}
      await loadAll();
    }catch{alert("Error.");}
  };
  const rechazarAyudantia=async(ay)=>{
    try{await dbUpdate("ayudantias",ay.id,{estado:"rechazada"});await createNotif(ay.usuario_id,`❌ Tu solicitud de ayudantía para el ${ay.fecha} ha sido RECHAZADA.`);await loadAll();}
    catch{alert("Error.");}
  };

  const openDisp=(fecha)=>{
    const exist=dispEnfermeria.find(d=>d.fecha===fecha&&d.usuario_id===authUser?.id);
    setForm(exist?{...exist}:{fecha,turno:"mañana",nota:"",usuario_id:authUser?.id,usuario_nombre:perfil?.nombre||perfil?.email});
    setModal("disp_edit");
  };
  const saveDisp=async()=>{
    setSaving(true);
    try{
      if(form.id){const{id,...d}=form;await dbUpdate("disponibilidad_enfermeria",id,d);}
      else await dbInsert("disponibilidad_enfermeria",form);
      await loadAll();setModal(null);
    }catch{alert("Error.");}finally{setSaving(false);}
  };
  const delDisp=async(id)=>{if(!confirm("¿Eliminar?"))return;try{await dbDelete("disponibilidad_enfermeria",id);await loadAll();setModal(null);}catch{alert("Error.");}};

  const solicitarAsignacionEnf=async(cx)=>{
    setSaving(true);
    try{
      const admins=perfiles.filter(p=>p.rol==="admin"||p.rol_app===ROL_ADMIN);
      for(const a of admins){await createNotif(a.id,`💉 ${perfil?.nombre} solicita ser instrumentista en "${cx.tipo}" el ${cx.fecha} (${cx.hospital})`);}
      alert("✅ Solicitud enviada al administrador.");
    }catch{alert("Error.");}finally{setSaving(false);}
  };

  const openNewP=()=>{setForm({nombre:"",rol_app:ROL_CIRUJANO,hospitales:[],tel:"",color:COLORES[0],activo:true});setModal("p_n");};
  const saveP=async()=>{if(!form.nombre?.trim()){alert("Nombre obligatorio.");return;}setSaving(true);try{if(modal==="p_n")await dbInsert("personal",form);else{const{id,...d}=form;await dbUpdate("personal",id,d);}await loadAll();setModal(null);}catch{alert("Error.");}finally{setSaving(false);}};
  const delP=async(id)=>{if(!confirm("¿Eliminar?"))return;try{await dbUpdate("personal",id,{activo:false});await loadAll();setModal(null);}catch{alert("Error.");}};
  const togH=(h)=>{const a=form.hospitales||[];setForm({...form,hospitales:a.includes(h)?a.filter(x=>x!==h):[...a,h]});};

  const openNewH=()=>{setForm({nombre:"",direccion:"",activo:true});setModal("h_n");};
  const saveH=async()=>{if(!form.nombre?.trim()){alert("Nombre obligatorio.");return;}setSaving(true);try{if(modal==="h_n")await dbInsert("hospitales",form);else{const{id,...d}=form;await dbUpdate("hospitales",id,d);}await loadAll();setModal(null);}catch{alert("Error.");}finally{setSaving(false);}};
  const delH=async(id)=>{if(!confirm("¿Eliminar?"))return;try{await dbUpdate("hospitales",id,{activo:false});await loadAll();setModal(null);}catch{alert("Error.");}};

  const openSubirDoc=()=>{setForm({nombre:"",descripcion:"",categoria:"Consentimientos",_file:null});setModal("doc_n");};
  const subirDoc=async()=>{
    if(!form._file||!form.nombre.trim()){alert("Selecciona un archivo y ponle nombre.");return;}
    setUploading(true);
    try{
      const path=`${Date.now()}-${form._file.name.replace(/\s/g,"_")}`;
      await uploadDoc(path,form._file,session);
      await dbInsert("documentos",{nombre:form.nombre,descripcion:form.descripcion||"",categoria:form.categoria,url:path,tamanyo:fmtSize(form._file.size),subido_por:perfil?.nombre||perfil?.email});
      await loadAll();setModal(null);
    }catch{alert("Error al subir.");}finally{setUploading(false);}
  };
  const descargarDoc=async(doc)=>{try{const url=await getSignedUrl(doc.url,session);window.open(url,"_blank");}catch{alert("Error al generar enlace.");}};
  const eliminarDoc=async(doc)=>{if(!confirm("¿Eliminar?"))return;try{await deleteStorageFile(doc.url,session);await dbDelete("documentos",doc.id);await loadAll();}catch{alert("Error.");}};

  const aprobarU=async(id,rApp=ROL_CIRUJANO)=>{try{await fetch(`${API("perfiles")}?id=eq.${id}`,{method:"PATCH",headers:H(session),body:JSON.stringify({estado:"aprobado",rol_app:rApp})});const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}catch{alert("Error.");}};
  const bloquearU=async(id)=>{if(!confirm("¿Bloquear?"))return;try{await fetch(`${API("perfiles")}?id=eq.${id}`,{method:"PATCH",headers:H(session),body:JSON.stringify({estado:"bloqueado"})});const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}catch{alert("Error.");}};
  const cambiarRolU=async(id,nuevoRol)=>{try{await fetch(`${API("perfiles")}?id=eq.${id}`,{method:"PATCH",headers:H(session),body:JSON.stringify({rol_app:nuevoRol})});const pf=await dbGet("perfiles","order=created_at.desc",session);setPerfiles(pf);}catch{alert("Error.");}};

  const pendFact=cirugias.filter(c=>c.factura==="Pendiente").length;
  const hoyN=cirugias.filter(c=>c.fecha===todayStr).length;
  const mesN=cirugias.filter(c=>{const d=new Date(c.fecha);return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear();}).length;
  const cxDia=cirugias.filter(c=>c.fecha===selDate);
  const cxConAyudante=cirugias.filter(c=>c.ayudante_requerido==="si"||c.ayudante_requerido===true);

  // ── TABS según rol efectivo ──
  const TABS=[
    ["agenda","📅","Agenda"],
    ...(isCirPrincipal||isCirujano?[["guardias","🛡️","Guardias"]]:[] ),
    ...(isEnfermero?[["disponibilidad","📆","Disponibilidad"]]:[] ),
    ...(isAdmin&&!vistaRol?[["disponibilidad","📆","Enf. Disp."]]:[] ),
    ["ayudantias","🤝","Ayudantías"],
    ["hospitales","🏨","Hospitales"],
    ...(canSeePersonal?[["personal","👥","Personal"]]:[] ),
    ["documentos","📁","Documentos"],
    ...(canSeeFacturacion?[["facturacion","💰","Facturación"]]:[] ),
    ...(isAdmin&&!vistaRol?[["metricas","📊","Métricas"],["config","⚙️","Config"]]:[] ),
  ];

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    button{cursor:pointer;font-family:inherit}
    input,select,textarea{font-family:inherit}
    .card{background:white;border-radius:14px;box-shadow:0 1px 4px rgba(46,63,82,.08),0 4px 16px rgba(46,63,82,.04)}
    .btn-gold{background:${B.gold};color:${B.slateDark};border:none;padding:10px 18px;border-radius:9px;font-size:14px;font-weight:700;transition:all .15s}
    .btn-gold:hover{background:${B.goldDark};transform:translateY(-1px)}
    .btn-gold:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .btn-sec{background:white;color:${B.slate};border:1.5px solid ${B.border};padding:8px 14px;border-radius:9px;font-size:13px;font-weight:500;transition:all .15s;cursor:pointer}
    .btn-sec:hover{border-color:${B.slateLight};background:#F8FAFB}
    .btn-green{background:#E6F4EC;color:#2E7D52;border:1.5px solid #86EFAC;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}
    .btn-green:hover{background:#D1FAE5}
    .btn-danger{background:#FEF2F2;color:#DC2626;border:1.5px solid #FECACA;padding:8px 14px;border-radius:9px;font-size:13px;cursor:pointer}
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
    .notif-panel{position:absolute;right:0;top:calc(100% + 8px);width:300px;background:white;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.18);z-index:300;overflow:hidden}
    .toggle-btn{display:flex;border-radius:8px;overflow:hidden;border:1.5px solid ${B.border}}
    .toggle-opt{padding:7px 14px;border:none;background:white;font-size:13px;font-weight:500;cursor:pointer;color:${B.muted};transition:all .15s}
    .toggle-opt.active{background:${B.slateDark};color:white;font-weight:700}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:767px){.form-grid{grid-template-columns:1fr!important}.modal{padding:20px;border-radius:14px}}
  `;

  if(authLoading)return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${B.slateDark},${B.slate})`,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{css}</style><Spin text="Iniciando CIRMI..."/></div>);
  if(!session)return(<><style>{css}</style><AuthScreen onAuth={handleAuth}/></>);
  if(!perfil||perfil.estado==="pendiente")return(<><style>{css}</style><PendingScreen perfil={perfil} onLogout={handleLogout}/></>);
  if(perfil.estado==="bloqueado")return(<><style>{css}</style><BlockedScreen onLogout={handleLogout}/></>);

  const navBtn=(id,icon,label)=>(
    <button key={id} onClick={()=>{setTab(id);setShowNav(false);}}
      style={{display:"flex",flexDirection:mob?"row":"column",alignItems:"center",gap:mob?10:3,padding:mob?"12px 16px":"7px 10px",border:"none",background:tab===id?(mob?`${B.gold}20`:B.gold):"none",color:tab===id?(mob?B.goldDark:B.slateDark):"rgba(255,255,255,.6)",borderRadius:8,transition:"all .15s",width:mob?"100%":"auto",textAlign:mob?"left":"center",cursor:"pointer",fontSize:mob?14:11,fontWeight:tab===id?700:500}}>
      <span style={{fontSize:mob?18:15}}>{icon}</span><span>{label}</span>
      {id==="ayudantias"&&ayudPend.length>0&&isAdmin&&!vistaRol&&<span style={{background:"#EF4444",color:"white",borderRadius:10,padding:"0 4px",fontSize:9,fontWeight:700,marginLeft:"auto"}}>{ayudPend.length}</span>}
    </button>
  );

  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:B.bg,minHeight:"100vh",color:B.text}}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={{background:B.slateDark,padding:`0 ${mob?14:18}px`,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 16px rgba(20,30,42,.35)"}}>
        <div style={{maxWidth:1400,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <svg width="70" height="20" viewBox="0 0 70 20"><text x="0" y="17" fontFamily="Georgia,serif" fontSize="19" fontWeight="700" fill={B.white} letterSpacing="1">CIRMI</text><line x1="3" y1="2" x2="10" y2="18" stroke={B.gold} strokeWidth="1.8" strokeLinecap="round"/></svg>
            {!mob&&<><div style={{width:1,height:14,background:"rgba(255,255,255,.15)"}}/><span style={{color:"rgba(255,255,255,.35)",fontSize:10}}>{vistaRol?`Vista: ${ROLES_LABELS[vistaRol]}`:(ROLES_LABELS[perfil?.rol_app]||"Admin")}</span></>}
          </div>
          {!mob&&<div style={{display:"flex",gap:1,overflowX:"auto"}}>{TABS.map(([id,icon,label])=>navBtn(id,icon,label))}</div>}
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            {/* Selector modo vista — solo admin */}
            {isAdmin&&!mob&&(
              <select value={vistaRol} onChange={e=>{setVistaRol(e.target.value);setTab("agenda");}}
                style={{padding:"4px 8px",borderRadius:7,border:"1.5px solid rgba(255,255,255,.25)",background:vistaRol?"rgba(245,200,66,.2)":"rgba(255,255,255,.1)",color:vistaRol?B.gold:"rgba(255,255,255,.7)",fontSize:11,cursor:"pointer",outline:"none"}}>
                <option value="">👁 Vista Admin</option>
                {Object.entries(ROLES_LABELS).filter(([k])=>k!==ROL_ADMIN).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            )}
            {/* Notificaciones */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowNotifs(!showNotifs)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:15,position:"relative",cursor:"pointer"}}>
                🔔{unread>0&&<span style={{position:"absolute",top:-3,right:-3,background:"#EF4444",color:"white",borderRadius:10,padding:"0 4px",fontSize:9,fontWeight:700,minWidth:15,textAlign:"center"}}>{unread}</span>}
              </button>
              {showNotifs&&<div className="notif-panel">
                <div style={{padding:"11px 14px",borderBottom:`1px solid ${B.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontWeight:700,fontSize:13}}>Notificaciones</div>
                  {unread>0&&<button className="btn-sec" style={{padding:"2px 7px",fontSize:11}} onClick={markAllRead}>Leídas</button>}
                </div>
                <div style={{maxHeight:280,overflowY:"auto"}}>
                  {notifs.length===0?<div style={{padding:"18px",textAlign:"center",color:B.muted,fontSize:13}}>Sin notificaciones</div>:notifs.map(n=>(
                    <div key={n.id} onClick={()=>markRead(n.id)} style={{padding:"10px 14px",borderBottom:`1px solid ${B.border}`,background:n.leida?"white":"#F0F7FF",cursor:"pointer"}}>
                      <div style={{fontSize:12,lineHeight:1.5}}>{n.mensaje}</div>
                      <div style={{fontSize:10,color:B.muted,marginTop:2}}>{n.created_at?.split("T")[0]}</div>
                    </div>
                  ))}
                </div>
              </div>}
            </div>
            {canCreateCx&&!mob&&<button className="btn-gold" onClick={()=>openNewCx()} style={{padding:"6px 11px",fontSize:12}}>+ Nueva</button>}
            {!mob&&<button onClick={handleLogout} className="btn-sec" style={{padding:"4px 9px",fontSize:11}}>Salir</button>}
            {mob&&<button onClick={()=>setShowNav(!showNav)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,width:34,height:34,color:"white",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>☰</button>}
          </div>
        </div>
        {/* Modo vista banner */}
        {vistaRol&&<div style={{background:B.goldLight,padding:"4px 18px",textAlign:"center",fontSize:12,color:B.goldDark,fontWeight:600}}>
          👁 Viendo como: <strong>{ROLES_LABELS[vistaRol]}</strong> — <button onClick={()=>{setVistaRol("");setTab("agenda");}} style={{border:"none",background:"none",color:B.goldDark,cursor:"pointer",fontWeight:700,textDecoration:"underline",fontSize:12}}>Volver a Admin</button>
        </div>}
        {mob&&showNav&&<div style={{borderTop:`1px solid rgba(255,255,255,.1)`,padding:"6px 0",display:"flex",flexDirection:"column",gap:1,maxHeight:"60vh",overflowY:"auto"}}>
          {isAdmin&&<div style={{padding:"8px 16px",borderBottom:`1px solid rgba(255,255,255,.1)`}}>
            <select value={vistaRol} onChange={e=>{setVistaRol(e.target.value);setTab("agenda");setShowNav(false);}}
              style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1.5px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"white",fontSize:12}}>
              <option value="">👁 Vista Admin</option>
              {Object.entries(ROLES_LABELS).filter(([k])=>k!==ROL_ADMIN).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>}
          {TABS.map(([id,icon,label])=>navBtn(id,icon,label))}
          {canCreateCx&&<button onClick={()=>{openNewCx();setShowNav(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",border:"none",background:"none",color:B.gold,fontSize:14,fontWeight:700,width:"100%",cursor:"pointer"}}>➕ Nueva cirugía</button>}
          <button onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",border:"none",background:"none",color:"rgba(255,255,255,.4)",fontSize:13,width:"100%",cursor:"pointer"}}>🚪 Salir</button>
        </div>}
      </div>

      {/* Mobile bottom nav */}
      {mob&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:B.slateDark,zIndex:90,borderTop:`1px solid rgba(255,255,255,.1)`,display:"flex",justifyContent:"space-around",padding:"5px 0 env(safe-area-inset-bottom)"}}>
        {[["agenda","📅"],["ayudantias","🤝"],["documentos","📁"],
          ...(isCirPrincipal||isCirujano?[["guardias","🛡️"]]:isEnfermero?[["disponibilidad","📆"]]:isAdmin&&!vistaRol?[["disponibilidad","📆"],["guardias","🛡️"]]:[] ),
          ...(isAdmin&&!vistaRol?[["config","⚙️"]]:[] )
        ].map(([id,icon])=>(
          <button key={id} onClick={()=>setTab(id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"4px 10px",border:"none",background:"none",color:tab===id?B.gold:"rgba(255,255,255,.5)",cursor:"pointer",position:"relative",minWidth:44}}>
            <span style={{fontSize:tab===id?20:17}}>{icon}</span>
            <span style={{fontSize:9,fontWeight:600}}>{{"agenda":"Agenda","ayudantias":"Ayudantías","documentos":"Docs","guardias":"Guardias","disponibilidad":"Disp.","config":"Config"}[id]}</span>
            {id==="ayudantias"&&ayudPend.length>0&&isAdmin&&!vistaRol&&<span style={{position:"absolute",top:0,right:4,background:"#EF4444",color:"white",borderRadius:10,padding:"0 3px",fontSize:8,fontWeight:700}}>{ayudPend.length}</span>}
          </button>
        ))}
      </div>}

      <div style={{maxWidth:1400,margin:"0 auto",padding:mob?"14px 12px":"20px",paddingBottom:mob?80:20}}>

        {/* STATS */}
        <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:18}}>
          {[
            {label:"Hoy",value:hoyN,icon:"🔪",accent:B.slate},
            {label:"Este mes",value:mesN,icon:"📅",accent:B.slateLight},
            ...(canSeeFacturacion?[{label:"Fact. pend.",value:pendFact,icon:"📋",accent:B.goldDark}]:[]),
            ...(canSeeFacturacion?[{label:"Total",value:cirugias.length,icon:"📊",accent:B.slateDark}]:[{label:"Mis ayudantías",value:ayudantias.filter(a=>a.usuario_id===authUser?.id&&a.estado==="aprobada").length,icon:"🤝",accent:B.slateDark}]),
          ].map(s=>(
            <div key={s.label} className="stat-card" style={{borderLeft:`4px solid ${s.accent}`}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div><div style={{fontSize:mob?20:24,fontWeight:700,color:s.accent,lineHeight:1}}>{s.value}</div><div style={{fontSize:11,color:B.muted,marginTop:3}}>{s.label}</div></div>
                <span style={{fontSize:mob?16:18}}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {loading?<Spin/>:(<>

          {/* ══ AGENDA ══ */}
          {tab==="agenda"&&(
            <div>
              <CalMes year={calY} month={calM}
                onPrev={()=>prevM(calY,calM,setCalY,setCalM)}
                onNext={()=>nextM(calY,calM,setCalY,setCalM)}
                onToday={()=>{setCalY(today.getFullYear());setCalM(today.getMonth());setSelDate(todayStr);}}
                renderDay={({day,dateStr,isToday,isWeekend,col})=>{
                  const dc=cirugias.filter(c=>c.fecha===dateStr),isSel=dateStr===selDate;
                  return(<div key={dateStr} className="cal-day" style={{borderRight:col<6?`1px solid ${B.border}`:"none",background:isSel?B.slateDark:isWeekend?"#FAFBFC":"white"}} onClick={()=>setSelDate(dateStr)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                      <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday&&!isSel?B.gold:"transparent",color:isSel?"white":isToday?B.slateDark:isWeekend?B.muted:B.text,fontWeight:isToday||isSel?700:400,fontSize:12}}>{day}</div>
                      {dc.length>0&&<span style={{fontSize:9,fontWeight:700,background:isSel?"rgba(255,255,255,.2)":B.slateLight,color:"white",borderRadius:8,padding:"1px 4px"}}>{dc.length}</span>}
                    </div>
                    {dc.slice(0,2).map(c=><div key={c.id} style={{background:isSel?"rgba(255,255,255,.15)":bEst(c.estado),color:isSel?"white":ceColor(c.estado),borderRadius:3,padding:"1px 3px",fontSize:9,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:1}}>{c.inicio} {c.tipo}</div>)}
                    {dc.length>2&&<div style={{fontSize:9,color:isSel?"rgba(255,255,255,.6)":B.muted}}>+{dc.length-2}</div>}
                    {isSel&&canCreateCx&&<button onClick={e=>{e.stopPropagation();openNewCx(dateStr);}} style={{position:"absolute",bottom:3,right:3,background:B.gold,border:"none",borderRadius:4,width:16,height:16,fontSize:11,fontWeight:700,color:B.slateDark,cursor:"pointer"}}>+</button>}
                  </div>);
                }}
              />
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <h3 style={{fontSize:15,fontWeight:700,color:B.slateDark}}>{selDate===todayStr?"Hoy":selDate} <span style={{fontSize:13,fontWeight:400,color:B.muted}}>({cxDia.length})</span></h3>
                {canCreateCx&&<button className="btn-gold" onClick={()=>openNewCx(selDate)} style={{padding:"6px 11px",fontSize:12}}>+ Añadir</button>}
              </div>
              {cxDia.length===0?<div className="card" style={{padding:28,textAlign:"center",color:B.muted}}><div style={{fontSize:28,marginBottom:8}}>📋</div><div style={{fontWeight:600}}>Sin cirugías</div>{canCreateCx&&<button className="btn-gold" onClick={()=>openNewCx(selDate)} style={{marginTop:10}}>+ Añadir</button>}</div>
              :cxDia.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                <div key={c.id} className="card" style={{padding:"12px 14px",marginBottom:8,cursor:canCreateCx?"pointer":"default"}} onClick={()=>{if(canCreateCx){setForm({...c});setModal("cx_e");}}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:B.slateDark}}>{c.inicio}–{c.fin}</span>
                        <Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/>
                        {c.turno&&<Bdg label={c.turno} bg={B.bg} color={B.muted}/>}
                      </div>
                      <div style={{fontWeight:700,fontSize:14}}>{c.tipo}</div>
                      <div style={{fontSize:12,color:B.muted,marginTop:2}}>{c.hospital} · {c.quirofano}</div>
                      <div style={{fontSize:12,color:B.muted}}>🔪 {c.cirujano}</div>
                      {c.ayudante_requerido==="si"&&!c.ayudante&&<div style={{fontSize:11,color:B.goldDark,marginTop:2}}>🤝 Ayudante requerido — sin asignar</div>}
                      {c.ayudante&&<div style={{fontSize:12,color:B.muted}}>🤝 {c.ayudante}</div>}
                      {c.instrumentista_requerido==="si"&&!c.enfermera&&<div style={{fontSize:11,color:B.goldDark}}>💉 Instrumentista requerida — sin asignar</div>}
                      {c.enfermera&&<div style={{fontSize:12,color:B.muted}}>💉 {c.enfermera}</div>}
                      {c.obs&&<div style={{fontSize:11,color:B.goldDark,marginTop:2}}>⚠ {c.obs}</div>}
                      {isEnfermero&&c.instrumentista_requerido==="si"&&!c.enfermera&&(
                        <button className="btn-green" style={{marginTop:6,fontSize:11}} onClick={e=>{e.stopPropagation();solicitarAsignacionEnf(c);}}>💉 Solicitar asignación</button>
                      )}
                    </div>
                    {canSeeFacturacion&&<Bdg label={c.factura} bg={bFact(c.factura)} color={cFact(c.factura)}/>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ AYUDANTÍAS ══ */}
          {tab==="ayudantias"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
                <div><h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>🤝 Ayudantías</h2><p style={{color:B.muted,fontSize:13,marginTop:2}}>{isAdmin&&!vistaRol?"Gestiona las solicitudes de ayudantía":"Cirugías disponibles para ayudar"}</p></div>
              </div>
              {isAdmin&&!vistaRol&&ayudPend.length>0&&(
                <div style={{background:"white",borderRadius:13,border:`1.5px solid ${B.gold}`,padding:"14px 16px",marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:14,color:B.goldDark,marginBottom:10}}>⏳ Solicitudes pendientes ({ayudPend.length})</div>
                  {ayudPend.map(ay=>{
                    const cx=cirugias.find(c=>c.id===ay.cirugia_id);
                    return(<div key={ay.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${B.border}`,gap:10,flexWrap:"wrap"}}>
                      <div><div style={{fontWeight:600,fontSize:13}}>{ay.cirujano_solicitante}</div><div style={{fontSize:12,color:B.muted}}>{cx?.tipo||"—"} · {ay.fecha} · {ay.hospital}</div><div style={{fontSize:11,color:B.muted}}>Turno: {ay.tipo}</div></div>
                      <div style={{display:"flex",gap:6}}><button className="btn-green" onClick={()=>aprobarAyudantia(ay)}>✓ Aprobar</button><button className="btn-sm-danger" onClick={()=>rechazarAyudantia(ay)}>Rechazar</button></div>
                    </div>);
                  })}
                </div>
              )}
              <CalMes year={ayY} month={ayM}
                onPrev={()=>prevM(ayY,ayM,setAyY,setAyM)}
                onNext={()=>nextM(ayY,ayM,setAyY,setAyM)}
                onToday={()=>{setAyY(today.getFullYear());setAyM(today.getMonth());}}
                renderDay={({day,dateStr,isToday,isWeekend,col})=>{
                  const dcAy=cxConAyudante.filter(c=>c.fecha===dateStr);
                  return(<div key={dateStr} style={{minHeight:76,borderRight:col<6?`1px solid ${B.border}`:"none",borderBottom:`1px solid ${B.border}`,padding:6,background:isToday?B.goldLight:isWeekend?"#FAFBFC":"white",cursor:"default"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                      <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday?B.gold:"transparent",color:isToday?B.slateDark:isWeekend?B.muted:B.text,fontWeight:isToday?700:400,fontSize:11}}>{day}</div>
                      {dcAy.length>0&&<span style={{fontSize:9,fontWeight:700,background:"#E6F4EC",color:"#2E7D52",borderRadius:8,padding:"1px 4px"}}>{dcAy.length}</span>}
                    </div>
                    {dcAy.slice(0,2).map(c=>{
                      const miSol=ayudantias.find(a=>a.cirugia_id===c.id&&a.usuario_id===authUser?.id);
                      const turno=parseInt(c.inicio)<13?"mañana":"tarde";
                      return(<div key={c.id} style={{background:miSol?.estado==="aprobada"?"#E6F4EC":miSol?.estado==="pendiente"?B.goldLight:"#F0F4F8",borderRadius:4,padding:"2px 4px",marginBottom:2,fontSize:9}}>
                        <div style={{fontWeight:600,color:B.slateDark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.tipo}</div>
                        {!miSol&&(isCirujano||isCirPrincipal)&&<button onClick={()=>solicitarAyudantia(c,turno)} style={{fontSize:8,background:B.gold,border:"none",borderRadius:3,padding:"1px 4px",cursor:"pointer",fontWeight:700,color:B.slateDark,marginTop:1}}>Apuntarme</button>}
                        {miSol&&<div style={{fontSize:8,fontWeight:600,color:miSol.estado==="aprobada"?"#2E7D52":miSol.estado==="pendiente"?B.goldDark:"#B91C1C"}}>{miSol.estado==="aprobada"?"✓ Asignado":miSol.estado==="pendiente"?"⏳ Pendiente":"✗ No seleccionado"}</div>}
                      </div>);
                    })}
                  </div>);
                }}
              />
              <h3 style={{fontSize:15,fontWeight:700,color:B.slateDark,marginBottom:12}}>Cirugías con ayudante requerido</h3>
              {cxConAyudante.filter(c=>c.fecha>=todayStr).length===0?<div className="card" style={{padding:28,textAlign:"center",color:B.muted}}>No hay cirugías pendientes de ayudante</div>:
              cxConAyudante.filter(c=>c.fecha>=todayStr).sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(c=>{
                const miSol=ayudantias.find(a=>a.cirugia_id===c.id&&a.usuario_id===authUser?.id);
                const turno=parseInt(c.inicio)<13?"mañana":"tarde";
                const solicitudes=ayudantias.filter(a=>a.cirugia_id===c.id);
                return(<div key={c.id} className="card" style={{padding:"13px 15px",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                        <Bdg label={turno} bg={turno==="mañana"?"#EFF6FF":"#FFF7ED"} color={turno==="mañana"?"#1D4ED8":"#C2410C"}/>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:B.muted}}>{c.fecha}</span>
                        <Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/>
                      </div>
                      <div style={{fontWeight:700,fontSize:14}}>{c.tipo}</div>
                      <div style={{fontSize:12,color:B.muted}}>{c.hospital} · {c.inicio}–{c.fin}</div>
                      <div style={{fontSize:12,color:B.muted}}>🔪 {c.cirujano}</div>
                      {c.ayudante?<div style={{fontSize:12,color:"#2E7D52",marginTop:2}}>✅ Ayudante: {c.ayudante}</div>:<div style={{fontSize:11,color:B.goldDark}}>Sin ayudante asignado</div>}
                      {isAdmin&&!vistaRol&&solicitudes.length>0&&<div style={{fontSize:11,color:B.muted,marginTop:2}}>{solicitudes.length} solicitud{solicitudes.length>1?"es":""}</div>}
                    </div>
                    <div>
                      {(isCirujano||isCirPrincipal)&&!c.ayudante&&!miSol&&<button className="btn-green" onClick={()=>solicitarAyudantia(c,turno)} disabled={saving}>🤝 Apuntarme</button>}
                      {miSol&&<Bdg label={miSol.estado==="aprobada"?"✓ Asignado":miSol.estado==="pendiente"?"⏳ Pendiente":"✗ No seleccionado"} bg={miSol.estado==="aprobada"?"#E6F4EC":miSol.estado==="pendiente"?B.goldLight:"#FEE2E2"} color={miSol.estado==="aprobada"?"#2E7D52":miSol.estado==="pendiente"?B.goldDark:"#DC2626"}/>}
                    </div>
                  </div>
                </div>);
              })}
            </div>
          )}

          {/* ══ GUARDIAS ══ */}
          {tab==="guardias"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
                <div><h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>🛡️ Guardias</h2></div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  {hospitales.filter(h=>canSeeHospPublico||h.nombre!==HOSP_PUBLICO).map((h,i)=>(
                    <button key={h.nombre} onClick={()=>setGuardHosp(h.nombre)} style={{padding:"6px 12px",borderRadius:9,border:"1.5px solid",fontSize:12,fontWeight:600,cursor:"pointer",background:guardHosp===h.nombre?ACCENTS[i%ACCENTS.length]:"white",color:guardHosp===h.nombre?"white":B.slate,borderColor:guardHosp===h.nombre?ACCENTS[i%ACCENTS.length]:B.border}}>
                      {h.nombre===HOSP_PUBLICO?"🔒 "+h.nombre:h.nombre}
                    </button>
                  ))}
                  {(isCirPrincipal||isCirujano)&&<button className="btn-gold" onClick={openSugerencia} style={{padding:"6px 12px",fontSize:12}}>+ Sugerir día</button>}
                </div>
              </div>
              {guardHosp===HOSP_PUBLICO&&<div style={{background:B.goldLight,border:`1.5px solid ${B.gold}`,borderRadius:11,padding:"11px 13px",marginBottom:13,fontSize:13,color:B.goldDark}}>🏥 <strong>Hospital Público</strong> — Registra guardias externas e incompatibilidades personales.</div>}
              {isAdmin&&!vistaRol&&sugPend.length>0&&(
                <div style={{background:"white",borderRadius:13,border:`1.5px solid ${B.gold}`,padding:"13px 15px",marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:13,color:B.goldDark,marginBottom:8}}>⏳ Sugerencias pendientes ({sugPend.length})</div>
                  {sugPend.map(s=>(<div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${B.border}`,gap:8,flexWrap:"wrap"}}>
                    <div><div style={{fontWeight:600,fontSize:12}}>{s.usuario_nombre}</div><div style={{fontSize:11,color:B.muted}}>{s.fecha} · {s.hospital}</div>{s.nota&&<div style={{fontSize:10,color:B.muted,fontStyle:"italic"}}>"{s.nota}"</div>}</div>
                    <div style={{display:"flex",gap:5}}><button className="btn-green" onClick={()=>aprobarSug(s)}>✓</button><button className="btn-sm-danger" onClick={()=>rechazarSug(s)}>✗</button></div>
                  </div>))}
                </div>
              )}
              <CalMes year={gY} month={gM}
                onPrev={()=>prevM(gY,gM,setGY,setGM)}
                onNext={()=>nextM(gY,gM,setGY,setGM)}
                onToday={()=>{setGY(today.getFullYear());setGM(today.getMonth());}}
                renderDay={({day,dateStr,isToday,isWeekend,col})=>{
                  const g=guardias.find(x=>x.fecha===dateStr&&x.hospital===guardHosp);
                  const hospPubG=guardHosp!==HOSP_PUBLICO?guardias.find(x=>x.fecha===dateStr&&x.hospital===HOSP_PUBLICO):null;
                  const hasIncompat=hospPubG&&g;
                  return(<div key={dateStr} style={{minHeight:72,borderRight:col<6?`1px solid ${B.border}`:"none",borderBottom:`1px solid ${B.border}`,padding:5,background:hasIncompat?"#FFF7ED":isToday?B.goldLight:g?"#E6F4EC":isWeekend?"#FAFBFC":"white",cursor:(isCirPrincipal&&!isCirujano)?"pointer":"default"}} onClick={()=>isCirPrincipal&&!isCirujano&&openGuardia(dateStr,guardHosp||hospNames[0])}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                      <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday?B.gold:"transparent",color:isToday?B.slateDark:isWeekend?B.muted:B.text,fontWeight:isToday?700:400,fontSize:11}}>{day}</div>
                      {hasIncompat&&<span style={{fontSize:9}}>⚠️</span>}
                      {g&&!hasIncompat&&<div style={{width:7,height:7,borderRadius:"50%",background:"#2E7D52"}}/>}
                    </div>
                    {g&&<div style={{fontSize:9,lineHeight:1.5}}>
                      {g.cirujano_principal&&<div style={{fontWeight:700,color:"#2E7D52",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🔪 {g.cirujano_principal.split(" ").slice(-1)[0]}</div>}
                      {g.cirujano_ayudante&&<div style={{color:B.slate,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🤝 {g.cirujano_ayudante.split(" ").slice(-1)[0]}</div>}
                    </div>}
                    {!g&&isCirPrincipal&&!isCirujano&&<div style={{fontSize:8,color:B.border,textAlign:"center",paddingTop:2}}>+ asignar</div>}
                  </div>);
                }}
              />
            </div>
          )}

          {/* ══ DISPONIBILIDAD ENFERMERÍA ══ */}
          {tab==="disponibilidad"&&(isEnfermero||isAdmin)&&(
            <div>
              <div style={{marginBottom:14}}>
                <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>📆 {isAdmin&&!vistaRol?"Disponibilidad Enfermería":"Mi Disponibilidad"}</h2>
                <p style={{color:B.muted,fontSize:13,marginTop:2}}>{isAdmin&&!vistaRol?"Vista global de disponibilidad del equipo de enfermería":"Solo visible para ti y el administrador"}</p>
              </div>
              {isAdmin&&!vistaRol&&(
                <div style={{marginBottom:14,padding:"10px 14px",background:B.bg,borderRadius:10,fontSize:12,color:B.muted}}>
                  Colores: <span style={{color:"#1D4ED8",fontWeight:600}}>Mañana</span> · <span style={{color:"#C2410C",fontWeight:600}}>Tarde</span> · <span style={{color:"#2E7D52",fontWeight:600}}>Todo el día</span> · <span style={{color:"#B91C1C",fontWeight:600}}>No disponible</span>
                </div>
              )}
              <CalMes year={dispY} month={dispM}
                onPrev={()=>prevM(dispY,dispM,setDispY,setDispM)}
                onNext={()=>nextM(dispY,dispM,setDispY,setDispM)}
                onToday={()=>{setDispY(today.getFullYear());setDispM(today.getMonth());}}
                renderDay={({day,dateStr,isToday,isWeekend,col})=>{
                  const miDisp=dispEnfermeria.filter(d=>d.fecha===dateStr&&(isAdmin&&!vistaRol?true:d.usuario_id===authUser?.id));
                  const colores={"mañana":"#EFF6FF","tarde":"#FFF7ED","todo el día":"#E6F4EC","no disponible":"#FEE2E2"};
                  const colText={"mañana":"#1D4ED8","tarde":"#C2410C","todo el día":"#2E7D52","no disponible":"#B91C1C"};
                  return(<div key={dateStr} style={{minHeight:76,borderRight:col<6?`1px solid ${B.border}`:"none",borderBottom:`1px solid ${B.border}`,padding:5,background:isToday?B.goldLight:isWeekend?"#FAFBFC":"white",cursor:isEnfermero?"pointer":"default"}} onClick={()=>isEnfermero&&openDisp(dateStr)}>
                    <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday?B.gold:"transparent",color:isToday?B.slateDark:isWeekend?B.muted:B.text,fontWeight:isToday?700:400,fontSize:11,marginBottom:3}}>{day}</div>
                    {miDisp.map(d=><div key={d.id} style={{background:colores[d.turno]||B.bg,borderRadius:3,padding:"1px 4px",marginBottom:1,fontSize:9,fontWeight:600,color:colText[d.turno]||B.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isAdmin&&!vistaRol?`${d.usuario_nombre?.split(" ")[0]}: ${d.turno}`:d.turno}</div>)}
                    {miDisp.length===0&&isEnfermero&&<div style={{fontSize:8,color:B.border,textAlign:"center",paddingTop:3}}>+ marcar</div>}
                  </div>);
                }}
              />
            </div>
          )}

          {/* ══ HOSPITALES ══ */}
          {tab==="hospitales"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>🏨 Hospitales</h2>
                <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} className="inp" style={{width:mob?"100%":160}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr":hospitales.filter(h=>canSeeHospPublico||h.nombre!==HOSP_PUBLICO).length<=2?"repeat(2,1fr)":"repeat(3,1fr)",gap:12}}>
                {hospitales.filter(h=>canSeeHospPublico||h.nombre!==HOSP_PUBLICO).map((h,idx)=>{
                  const cxs=cirugias.filter(c=>c.hospital===h.nombre&&c.fecha===selDate),accent=ACCENTS[idx%ACCENTS.length];
                  return(<div key={h.id} style={{background:"white",borderRadius:13,overflow:"hidden",boxShadow:"0 1px 4px rgba(46,63,82,.07)"}}>
                    <div style={{background:accent,padding:"13px 15px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div><div style={{color:"white",fontWeight:700,fontSize:14}}>{h.nombre}</div>{h.direccion&&<div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>{h.direccion}</div>}<div style={{color:"rgba(255,255,255,.65)",fontSize:12,marginTop:2}}>{cxs.length} cirugía{cxs.length!==1?"s":""}</div></div>
                        <div style={{background:B.gold,borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:B.slateDark}}>{cxs.length}</div>
                      </div>
                    </div>
                    <div style={{padding:"12px 14px"}}>
                      {cxs.length===0?<div style={{color:B.muted,fontSize:13,textAlign:"center",padding:"14px 0"}}>Sin intervenciones</div>:cxs.sort((a,b)=>a.inicio.localeCompare(b.inicio)).map(c=>(
                        <div key={c.id} onClick={()=>{if(canCreateCx){setForm({...c});setModal("cx_e");}}} style={{padding:"9px 11px",borderRadius:9,border:`1.5px solid ${B.border}`,marginBottom:6,cursor:canCreateCx?"pointer":"default"}} onMouseEnter={e=>canCreateCx&&(e.currentTarget.style.borderColor=accent)} onMouseLeave={e=>e.currentTarget.style.borderColor=B.border}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,color:accent}}>{c.inicio}–{c.fin}</span><Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/></div>
                          <div style={{fontWeight:600,fontSize:13}}>{c.tipo}</div>
                          <div style={{fontSize:11,color:B.muted}}>{c.quirofano} · {c.cirujano}</div>
                        </div>
                      ))}
                    </div>
                  </div>);
                })}
              </div>
            </div>
          )}

          {/* ══ PERSONAL ══ */}
          {tab==="personal"&&canSeePersonal&&(
            <div>
              <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark,marginBottom:14}}>👥 Personal</h2>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:12}}>
                {personal.map(p=>{
                  const cxs=cirugias.filter(c=>[c.cirujano,c.ayudante,c.enfermera].includes(p.nombre));
                  const prox=cxs.filter(c=>c.fecha>=todayStr).sort((a,b)=>a.fecha.localeCompare(b.fecha));
                  return(<div key={p.id} className="card" style={{padding:15,borderLeft:`4px solid ${p.color||B.slate}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}>
                      <div className="avatar" style={{background:p.color||B.slate,width:40,height:40,fontSize:14}}>{(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
                      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{p.nombre}</div><div style={{fontSize:11,color:B.muted}}>{ROLES_LABELS[p.rol_app]||p.rol_app}</div>{p.tel&&<div style={{fontSize:11,color:B.muted}}>📞 {p.tel}</div>}</div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <div style={{fontSize:20,fontWeight:700,color:p.color||B.slate}}>{cxs.length}</div>
                        <button className="btn-sec" style={{padding:"3px 7px",fontSize:11}} onClick={()=>{setForm({...p});setModal("p_e");}}>✏️</button>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:9}}>{(p.hospitales||[]).map(h=><span key={h} style={{background:B.bg,color:B.slate,borderRadius:5,padding:"2px 6px",fontSize:10,fontWeight:600,border:`1px solid ${B.border}`}}>{h}</span>)}</div>
                    {prox.length>0?(<div><ColH>Próximas</ColH><div style={{marginTop:5}}>{prox.slice(0,2).map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${B.border}`}}><div><div style={{fontSize:12,fontWeight:600}}>{c.tipo}</div><div style={{fontSize:11,color:B.muted}}>{c.fecha} · {c.hospital}</div></div><Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/></div>)}</div></div>):<div style={{color:B.muted,fontSize:12,fontStyle:"italic"}}>Sin intervenciones próximas</div>}
                  </div>);
                })}
              </div>
            </div>
          )}

          {/* ══ DOCUMENTOS ══ */}
          {tab==="documentos"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
                <div><h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>📁 Repositorio</h2></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <select className="inp" style={{width:mob?"100%":155}} value={filtCat} onChange={e=>setFiltCat(e.target.value)}><option value="Todos">Todas las categorías</option>{CAT_DOCS.map(c=><option key={c}>{c}</option>)}</select>
                  {isAdmin&&!vistaRol&&<button className="btn-gold" onClick={openSubirDoc} style={{padding:"7px 13px",fontSize:12}}>+ Subir</button>}
                </div>
              </div>
              {documentos.filter(d=>filtCat==="Todos"||d.categoria===filtCat).length===0?<div className="card" style={{padding:36,textAlign:"center",color:B.muted}}><div style={{fontSize:36,marginBottom:10}}>📁</div><div style={{fontWeight:600}}>No hay documentos aún</div>{isAdmin&&!vistaRol&&<button className="btn-gold" onClick={openSubirDoc} style={{marginTop:12}}>+ Subir</button>}</div>:(
                CAT_DOCS.filter(cat=>filtCat==="Todos"||filtCat===cat).map(cat=>{
                  const docs=documentos.filter(d=>d.categoria===cat&&(filtCat==="Todos"||d.categoria===filtCat));
                  if(docs.length===0)return null;
                  return(<div key={cat} style={{marginBottom:18}}>
                    <div style={{fontSize:13,fontWeight:700,color:B.slateDark,marginBottom:9}}>{{"Consentimientos":"📝","Hojas de información":"ℹ️","Protocolos":"📋","Formularios":"📄","Otros":"📎"}[cat]} {cat} <span style={{background:B.bg,color:B.muted,borderRadius:10,padding:"1px 6px",fontSize:10}}>{docs.length}</span></div>
                    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:9}}>
                      {docs.map(doc=><div key={doc.id} style={{background:"white",borderRadius:11,border:`1.5px solid ${B.border}`,padding:"13px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
                        <div style={{display:"flex",gap:10,flex:1}}>
                          <div style={{width:36,height:36,borderRadius:8,background:B.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📄</div>
                          <div><div style={{fontWeight:700,fontSize:13}}>{doc.nombre}</div>{doc.descripcion&&<div style={{fontSize:11,color:B.muted}}>{doc.descripcion}</div>}<div style={{fontSize:10,color:B.muted,marginTop:3}}>📦 {doc.tamanyo} · {doc.created_at?.split("T")[0]}</div></div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:4}}>
                          <button className="btn-green" onClick={()=>descargarDoc(doc)} style={{fontSize:11,padding:"4px 8px"}}>⬇ Abrir</button>
                          {isAdmin&&!vistaRol&&<button className="btn-sm-danger" onClick={()=>eliminarDoc(doc)}>🗑</button>}
                        </div>
                      </div>)}
                    </div>
                  </div>);
                })
              )}
            </div>
          )}

          {/* ══ FACTURACIÓN ══ */}
          {tab==="facturacion"&&canSeeFacturacion&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
                <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>💰 Facturación</h2>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{["Todos","Pendiente","Facturada","En revisión","Cobrada"].map(f=><button key={f} onClick={()=>setFiltFact(f)} style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid",fontSize:12,fontWeight:500,cursor:"pointer",background:filtFact===f?B.slateDark:"white",color:filtFact===f?"white":B.slate,borderColor:filtFact===f?B.slateDark:B.border}}>{f}</button>)}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
                {["Pendiente","Facturada","En revisión","Cobrada"].map(e=>{const n=cirugias.filter(c=>c.factura===e).length;return(<div key={e} className="stat-card" style={{borderTop:`3px solid ${cFact(e)}`,cursor:"pointer"}} onClick={()=>setFiltFact(e)}><div style={{fontSize:20,fontWeight:700,color:cFact(e)}}>{n}</div><div style={{fontSize:11,color:B.muted,marginTop:2}}>{e}</div></div>);})}</div>
              <div className="card" style={{overflow:"hidden"}}>
                {cirugias.filter(c=>filtFact==="Todos"||c.factura===filtFact).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((c,i)=>(
                  <div key={c.id} style={{padding:"10px 13px",borderBottom:`1px solid ${B.border}`,cursor:"pointer",background:i%2===0?"white":"#FAFBFC"}} onClick={()=>{setForm({...c});setModal("cx_e");}} onMouseEnter={e=>e.currentTarget.style.background=B.bg} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"white":"#FAFBFC"}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                      <div><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,color:B.slate}}>{c.id}</span><Bdg label={c.estado} bg={bEst(c.estado)} color={ceColor(c.estado)}/></div><div style={{fontWeight:600,fontSize:13,marginTop:1}}>{c.tipo}</div><div style={{fontSize:11,color:B.muted}}>{c.fecha} · {c.hospital} · {c.cirujano}</div></div>
                      <div onClick={e=>e.stopPropagation()}><select className="inp" style={{padding:"3px 6px",fontSize:11,width:105}} value={c.factura} onChange={e=>updFact(c.id,e.target.value)}>{ESTADOS_FA.map(s=><option key={s}>{s}</option>)}</select></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ MÉTRICAS ══ */}
          {tab==="metricas"&&isAdmin&&!vistaRol&&(
            <div>
              <h2 style={{fontSize:20,fontWeight:700,color:B.slateDark,marginBottom:16}}>📊 Métricas</h2>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:14,marginBottom:20}}>
                <div className="card" style={{padding:18}}>
                  <div style={{fontWeight:700,fontSize:14,color:B.slateDark,marginBottom:12}}>🏥 Por hospital</div>
                  {hospitales.map((h,i)=>{const n=cirugias.filter(c=>c.hospital===h.nombre).length;const pct=cirugias.length>0?Math.round(n/cirugias.length*100):0;return(<div key={h.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:500}}>{h.nombre}</span><span style={{fontSize:13,fontWeight:700,color:ACCENTS[i%ACCENTS.length]}}>{n}</span></div><div style={{height:6,background:B.bg,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:ACCENTS[i%ACCENTS.length],borderRadius:3,width:`${pct}%`,transition:"width .3s"}}/></div></div>);})}
                </div>
                <div className="card" style={{padding:18}}>
                  <div style={{fontWeight:700,fontSize:14,color:B.slateDark,marginBottom:12}}>👨‍⚕️ Por cirujano</div>
                  {personal.filter(p=>p.rol_app===ROL_CIR_PRINCIPAL).map(p=>{const n=cirugias.filter(c=>c.cirujano===p.nombre).length;const pct=cirugias.length>0?Math.round(n/cirugias.length*100):0;return(<div key={p.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:500}}>{p.nombre}</span><span style={{fontSize:13,fontWeight:700,color:p.color||B.slate}}>{n}</span></div><div style={{height:6,background:B.bg,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:p.color||B.slate,borderRadius:3,width:`${pct}%`,transition:"width .3s"}}/></div></div>);})}
                </div>
                <div className="card" style={{padding:18}}>
                  <div style={{fontWeight:700,fontSize:14,color:B.slateDark,marginBottom:12}}>💰 Facturación</div>
                  {ESTADOS_FA.map(e=>{const n=cirugias.filter(c=>c.factura===e).length;const pct=cirugias.length>0?Math.round(n/cirugias.length*100):0;return(<div key={e} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:500}}>{e}</span><span style={{fontSize:13,fontWeight:700,color:cFact(e)}}>{n}</span></div><div style={{height:6,background:B.bg,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:cFact(e),borderRadius:3,width:`${pct}%`,transition:"width .3s"}}/></div></div>);})}
                </div>
              </div>
              <div className="card" style={{padding:18}}>
                <div style={{fontWeight:700,fontSize:14,color:B.slateDark,marginBottom:14}}>📅 Por mes ({today.getFullYear()})</div>
                <div style={{display:"flex",gap:6,alignItems:"flex-end",height:100}}>
                  {MESES.map((mes,i)=>{
                    const n=cirugias.filter(c=>{const d=new Date(c.fecha);return d.getMonth()===i&&d.getFullYear()===today.getFullYear();}).length;
                    const max=Math.max(...MESES.map((_,j)=>cirugias.filter(c=>{const d=new Date(c.fecha);return d.getMonth()===j&&d.getFullYear()===today.getFullYear();}).length),1);
                    const h=Math.max(n/max*80,n>0?8:2);
                    return(<div key={mes} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{fontSize:9,fontWeight:700,color:B.slate}}>{n>0?n:""}</div>
                      <div style={{width:"100%",height:`${h}px`,background:i===today.getMonth()?B.gold:B.slateLight,borderRadius:"3px 3px 0 0",transition:"height .3s",minHeight:2}}/>
                      <div style={{fontSize:8,color:B.muted,textAlign:"center"}}>{mes.slice(0,3)}</div>
                    </div>);
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ CONFIGURACIÓN ══ */}
          {tab==="config"&&isAdmin&&!vistaRol&&(
            <div>
              <div style={{marginBottom:14}}><h2 style={{fontSize:20,fontWeight:700,color:B.slateDark}}>⚙️ Configuración</h2><p style={{color:B.muted,fontSize:12,marginTop:2}}>Solo visible para administradores</p></div>
              <div style={{display:"flex",gap:2,marginBottom:16,borderBottom:`2px solid ${B.border}`,overflowX:"auto"}}>
                {[["personal","👥 Personal"],["hospitales","🏨 Hospitales"],["usuarios","🔐 Usuarios"]].map(([id,l])=><button key={id} className={`subtab ${configTab===id?"active":""}`} onClick={()=>setConfigTab(id)}>{l}</button>)}
              </div>
              {configTab==="personal"&&(<div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}><div style={{fontSize:13,fontWeight:600}}>{personal.length} profesionales</div><button className="btn-gold" onClick={openNewP}>+ Añadir</button></div>
                {personal.map(p=><div key={p.id} className="config-item">
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div className="avatar" style={{background:p.color||B.slate,width:36,height:36,fontSize:12}}>{(p.nombre||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
                    <div><div style={{fontWeight:700,fontSize:13}}>{p.nombre}</div><div style={{fontSize:11,color:B.muted}}>{ROLES_LABELS[p.rol_app]||p.rol_app}</div><div style={{display:"flex",gap:3,marginTop:2,flexWrap:"wrap"}}>{(p.hospitales||[]).map(h=><span key={h} style={{background:B.bg,color:B.slate,borderRadius:4,padding:"1px 5px",fontSize:9,fontWeight:600,border:`1px solid ${B.border}`}}>{h}</span>)}</div></div>
                  </div>
                  <button className="btn-sec" style={{padding:"4px 8px",fontSize:11}} onClick={()=>{setForm({...p});setModal("p_e");}}>✏️</button>
                </div>)}
              </div>)}
              {configTab==="hospitales"&&(<div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}><div style={{fontSize:13,fontWeight:600}}>{hospitales.length} hospitales</div><button className="btn-gold" onClick={openNewH}>+ Añadir</button></div>
                {hospitales.map((h,idx)=><div key={h.id} className="config-item">
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:8,background:ACCENTS[idx%ACCENTS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{h.nombre===HOSP_PUBLICO?"🔒":"🏥"}</div>
                    <div><div style={{fontWeight:700,fontSize:13}}>{h.nombre}</div>{h.direccion&&<div style={{fontSize:11,color:B.muted}}>{h.direccion}</div>}{h.nombre===HOSP_PUBLICO&&<div style={{fontSize:10,color:B.goldDark}}>Guardias externas e incompatibilidades</div>}</div>
                  </div>
                  <button className="btn-sec" style={{padding:"4px 8px",fontSize:11}} onClick={()=>{setForm({...h});setModal("h_e");}}>✏️</button>
                </div>)}
              </div>)}
              {configTab==="usuarios"&&(<div>
                <div style={{fontSize:12,color:B.muted,marginBottom:12}}>Gestiona el acceso y rol de cada miembro.</div>
                {["pendiente","aprobado","bloqueado"].map(estado=>{
                  const grupo=perfiles.filter(p=>p.estado===estado);
                  if(grupo.length===0)return null;
                  const labels={pendiente:"⏳ Pendientes",aprobado:"✅ Aprobados",bloqueado:"🚫 Bloqueados"};
                  const colors={pendiente:B.goldDark,aprobado:"#2E7D52",bloqueado:"#B91C1C"};
                  return(<div key={estado} style={{marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:700,color:colors[estado],marginBottom:7}}>{labels[estado]} ({grupo.length})</div>
                    {grupo.map(u=><div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 13px",background:"white",border:`1.5px solid ${estado==="pendiente"?B.gold:B.border}`,borderRadius:11,marginBottom:6,gap:8,flexWrap:"wrap"}}>
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <div className="avatar" style={{background:estado==="pendiente"?B.goldDark:estado==="aprobado"?B.slate:"#B91C1C",width:34,height:34,fontSize:12}}>{(u.nombre||u.email||"?")[0].toUpperCase()}</div>
                        <div><div style={{fontWeight:700,fontSize:13}}>{u.nombre||"Sin nombre"}</div><div style={{fontSize:11,color:B.muted}}>{u.email}</div><div style={{fontSize:10,color:B.muted}}>{ROLES_LABELS[u.rol_app]||u.rol_app||"—"}</div></div>
                      </div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                        {estado==="pendiente"&&(<>
                          <select style={{padding:"5px 8px",borderRadius:7,border:`1.5px solid ${B.border}`,fontSize:11,cursor:"pointer"}} defaultValue={ROL_CIRUJANO} id={`rol-${u.id}`}>
                            {ROLES_APP.filter(r=>r!==ROL_ADMIN).map(r=><option key={r} value={r}>{ROLES_LABELS[r]}</option>)}
                          </select>
                          <button className="btn-green" onClick={()=>{const sel=document.getElementById(`rol-${u.id}`);aprobarU(u.id,sel?.value||ROL_CIRUJANO);}}>✓ Aprobar</button>
                        </>)}
                        {estado==="aprobado"&&u.id!==authUser?.id&&(<>
                          <select style={{padding:"4px 7px",borderRadius:7,border:`1.5px solid ${B.border}`,fontSize:11,cursor:"pointer"}} value={u.rol_app||ROL_CIRUJANO} onChange={e=>cambiarRolU(u.id,e.target.value)}>
                            {ROLES_APP.map(r=><option key={r} value={r}>{ROLES_LABELS[r]}</option>)}
                          </select>
                        </>)}
                        {u.id!==authUser?.id&&estado!=="bloqueado"&&<button className="btn-sm-danger" onClick={()=>bloquearU(u.id)}>Bloquear</button>}
                        {estado==="bloqueado"&&<button className="btn-green" onClick={()=>aprobarU(u.id)}>Reactivar</button>}
                      </div>
                    </div>)}
                  </div>);
                })}
              </div>)}
            </div>
          )}
        </>)}
      </div>

      {/* ══ MODALES ══ */}
      {modal&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal">

            {/* Cirugía */}
            {(modal==="cx_n"||modal==="cx_e")&&canCreateCx&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>{modal==="cx_n"?"Nueva intervención":"Editar"}</h3>{form.id&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:B.muted}}>{form.id}</div>}</div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:27,height:27,fontSize:15,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div className="form-grid">
                {[["Fecha",<input type="date" className="inp" value={form.fecha||""} onChange={e=>setForm({...form,fecha:e.target.value})}/>],
                  ["Hospital",<select className="inp" value={form.hospital||""} onChange={e=>setForm({...form,hospital:e.target.value})}>{hospNamesNoPublico.map(h=><option key={h}>{h}</option>)}</select>],
                  ["Quirófano",<select className="inp" value={form.quirofano||""} onChange={e=>setForm({...form,quirofano:e.target.value})}>{"Q-1,Q-2,Q-3,Q-4".split(",").map(q=><option key={q}>{q}</option>)}</select>],
                  ["Turno",<select className="inp" value={form.turno||"mañana"} onChange={e=>setForm({...form,turno:e.target.value})}><option value="mañana">Mañana</option><option value="tarde">Tarde</option></select>],
                  ["Hora inicio",<input type="time" className="inp" value={form.inicio||""} onChange={e=>setForm({...form,inicio:e.target.value})}/>],
                  ["Hora fin",<input type="time" className="inp" value={form.fin||""} onChange={e=>setForm({...form,fin:e.target.value})}/>],
                ].map(([l,f])=><FG key={l} label={l}>{f}</FG>)}
              </div>
              <FG label="Tipo de cirugía" style={{marginTop:13}}><input className="inp" value={form.tipo||""} onChange={e=>setForm({...form,tipo:e.target.value})} placeholder="Ej: Laparoscopia"/></FG>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginTop:13}}>
                <FG label="¿Ayudante? *">
                  <div className="toggle-btn">{["si","no"].map(v=><button key={v} className={`toggle-opt ${form.ayudante_requerido===v?"active":""}`} onClick={()=>setForm({...form,ayudante_requerido:v})}>{v==="si"?"✓ Sí":"✗ No"}</button>)}</div>
                </FG>
                <FG label="¿Instrumentista? *">
                  <div className="toggle-btn">{["si","no"].map(v=><button key={v} className={`toggle-opt ${form.instrumentista_requerido===v?"active":""}`} onClick={()=>setForm({...form,instrumentista_requerido:v})}>{v==="si"?"✓ Sí":"✗ No"}</button>)}</div>
                </FG>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginTop:13}}>
                <FG label="Cirujano principal">
                  <select className="inp" value={form.cirujano||""} onChange={e=>setForm({...form,cirujano:e.target.value})}>
                    {personal.filter(p=>p.rol_app===ROL_CIR_PRINCIPAL||p.rol==="admin").map(p=><option key={p.id}>{p.nombre}</option>)}
                  </select>
                </FG>
                {form.ayudante_requerido==="si"&&<FG label="Ayudante"><select className="inp" value={form.ayudante||""} onChange={e=>setForm({...form,ayudante:e.target.value})}><option value="">— Pendiente —</option>{personal.filter(p=>p.rol_app===ROL_CIR_PRINCIPAL||p.rol_app===ROL_CIRUJANO||p.rol==="admin").map(p=><option key={p.id}>{p.nombre}</option>)}</select></FG>}
                {form.instrumentista_requerido==="si"&&<FG label="Instrumentista"><select className="inp" value={form.enfermera||""} onChange={e=>setForm({...form,enfermera:e.target.value})}><option value="">— Pendiente —</option>{personal.filter(p=>p.rol_app===ROL_ENFERMERO).map(p=><option key={p.id}>{p.nombre}</option>)}</select></FG>}
              </div>
              <FG label="Código paciente" style={{marginTop:13}}>
                <input className="inp" value={form.paciente||""} onChange={e=>setForm({...form,paciente:e.target.value})} placeholder="Ej: J.G.R. · HC-4521"/>
                <div style={{fontSize:10,color:B.goldDark,marginTop:4}}>⚠️ Solo iniciales y número de historia clínica. No introducir datos identificativos.</div>
              </FG>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginTop:13}}>
                <FG label="Estado"><select className="inp" value={form.estado||""} onChange={e=>setForm({...form,estado:e.target.value})}>{ESTADOS_CX.map(s=><option key={s}>{s}</option>)}</select></FG>
                {canSeeFacturacion&&<FG label="Factura"><select className="inp" value={form.factura||""} onChange={e=>setForm({...form,factura:e.target.value})}>{ESTADOS_FA.map(s=><option key={s}>{s}</option>)}</select></FG>}
              </div>
              <FG label="Observaciones" style={{marginTop:13}}><textarea className="inp" rows={2} value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} placeholder="Notas..." style={{resize:"vertical"}}/></FG>
              <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"space-between"}}>
                <div>{modal==="cx_e"&&<button className="btn-danger" onClick={()=>delCx(form.id)} disabled={saving}>🗑</button>}</div>
                <div style={{display:"flex",gap:10}}><button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button><button className="btn-gold" onClick={saveCx} disabled={saving}>{saving?"Guardando...":modal==="cx_n"?"Crear":"Guardar"}</button></div>
              </div>
            </>)}

            {/* Guardia */}
            {modal==="g_edit"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>🛡️ Guardia</h3><div style={{fontSize:12,color:B.muted}}>{form.fecha} · {form.hospital}</div></div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:27,height:27,fontSize:15,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              {form._incompatibilidad&&<div style={{background:"#FFF7ED",border:`1.5px solid ${B.gold}`,borderRadius:10,padding:"10px 13px",marginBottom:13,fontSize:13,color:B.goldDark}}>{form._incompatibilidad}</div>}
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="Cirujano principal"><select className="inp" value={form.cirujano_principal||""} onChange={e=>setForm({...form,cirujano_principal:e.target.value})}><option value="">— Sin asignar —</option>{personal.filter(p=>p.rol_app===ROL_CIR_PRINCIPAL||p.rol==="admin").map(p=><option key={p.id}>{p.nombre}</option>)}</select></FG>
                <FG label="Cirujano ayudante"><select className="inp" value={form.cirujano_ayudante||""} onChange={e=>setForm({...form,cirujano_ayudante:e.target.value})}><option value="">— Sin asignar —</option>{personal.map(p=><option key={p.id}>{p.nombre}</option>)}</select></FG>
                <FG label="Notas"><input className="inp" value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})} placeholder={form.hospital===HOSP_PUBLICO?"Ej: Guardia externa, no disponible tarde":"Observaciones..."}/></FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"space-between"}}>
                <div>{form.id&&<button className="btn-danger" onClick={()=>delGuardia(form.id)}>🗑</button>}</div>
                <div style={{display:"flex",gap:10}}><button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button><button className="btn-gold" onClick={saveGuardia} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></div>
              </div>
            </>)}

            {/* Sugerencia guardia */}
            {modal==="sug_n"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>📅 Sugerir guardia</h3></div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:27,height:27,fontSize:15,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="Fecha"><input type="date" className="inp" value={form.fecha||""} onChange={e=>setForm({...form,fecha:e.target.value})} min={todayStr}/></FG>
                <FG label="Hospital"><select className="inp" value={form.hospital||""} onChange={e=>setForm({...form,hospital:e.target.value})}>{hospNames.map(h=><option key={h}>{h}</option>)}</select></FG>
                <FG label="Nota (opcional)"><input className="inp" value={form.nota||""} onChange={e=>setForm({...form,nota:e.target.value})} placeholder="Ej: Disponible todo el día"/></FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
                <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                <button className="btn-gold" onClick={saveSugerencia} disabled={saving}>{saving?"Enviando...":"Enviar"}</button>
              </div>
            </>)}

            {/* Disponibilidad enfermería */}
            {modal==="disp_edit"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>📆 Mi disponibilidad</h3><div style={{fontSize:12,color:B.muted}}>{form.fecha}</div></div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:27,height:27,fontSize:15,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="Turno disponible">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                    {["mañana","tarde","todo el día","no disponible"].map(t=>(
                      <button key={t} onClick={()=>setForm({...form,turno:t})} style={{padding:"10px",border:"1.5px solid",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",background:form.turno===t?B.slateDark:"white",color:form.turno===t?"white":B.slate,borderColor:form.turno===t?B.slateDark:B.border,textTransform:"capitalize"}}>{t}</button>
                    ))}
                  </div>
                </FG>
                <FG label="Nota (opcional)"><input className="inp" value={form.nota||""} onChange={e=>setForm({...form,nota:e.target.value})} placeholder="Ej: Solo por la mañana"/></FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"space-between"}}>
                <div>{form.id&&<button className="btn-danger" onClick={()=>delDisp(form.id)}>🗑</button>}</div>
                <div style={{display:"flex",gap:10}}><button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button><button className="btn-gold" onClick={saveDisp} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></div>
              </div>
            </>)}

            {/* Subir documento */}
            {modal==="doc_n"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>📁 Subir documento</h3></div>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:27,height:27,fontSize:15,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="Archivo">
                  <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${form._file?B.slate:B.border}`,borderRadius:10,padding:"18px",textAlign:"center",cursor:"pointer",background:form._file?"#F0F4F8":B.bg}}>
                    {form._file?<><div style={{fontSize:22}}>📄</div><div style={{fontWeight:600,fontSize:13,marginTop:4}}>{form._file.name}</div><div style={{fontSize:11,color:B.muted}}>{fmtSize(form._file.size)}</div></>:<><div style={{fontSize:26}}>☁️</div><div style={{fontSize:13,color:B.muted,marginTop:4}}>Toca para seleccionar</div></>}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_file:e.target.files[0],nombre:form.nombre||e.target.files[0].name.replace(/\.[^.]+$/,"")})}/>
                </FG>
                <FG label="Nombre"><input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Consentimiento Laparoscopia"/></FG>
                <FG label="Categoría"><select className="inp" value={form.categoria||"Consentimientos"} onChange={e=>setForm({...form,categoria:e.target.value})}>{CAT_DOCS.map(c=><option key={c}>{c}</option>)}</select></FG>
                <FG label="Descripción (opcional)"><input className="inp" value={form.descripcion||""} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Breve descripción..."/></FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
                <button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button>
                <button className="btn-gold" onClick={subirDoc} disabled={uploading||!form._file}>{uploading?"Subiendo...":"Subir"}</button>
              </div>
            </>)}

            {/* Personal */}
            {(modal==="p_n"||modal==="p_e")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>{modal==="p_n"?"Nuevo profesional":"Editar"}</h3>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:27,height:27,fontSize:15,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div className="form-grid">
                <FG label="Nombre"><input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Dr. García"/></FG>
                <FG label="Rol">
                  <select className="inp" value={form.rol_app||ROL_CIRUJANO} onChange={e=>setForm({...form,rol_app:e.target.value})}>
                    {[ROL_CIR_PRINCIPAL,ROL_CIRUJANO,ROL_ENFERMERO].map(r=><option key={r} value={r}>{ROLES_LABELS[r]}</option>)}
                  </select>
                </FG>
                <FG label="Teléfono"><input className="inp" value={form.tel||""} onChange={e=>setForm({...form,tel:e.target.value})} placeholder="655 000 000"/></FG>
                <FG label="Color"><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>{COLORES.map(c=><div key={c} onClick={()=>setForm({...form,color:c})} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?`3px solid ${B.slateDark}`:"3px solid transparent"}}/>)}</div></FG>
              </div>
              <FG label="Hospitales" style={{marginTop:13}}><div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>{hospitales.map(h=><div key={h.id} onClick={()=>togH(h.nombre)} style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid",fontSize:12,fontWeight:600,cursor:"pointer",background:(form.hospitales||[]).includes(h.nombre)?B.slate:"white",color:(form.hospitales||[]).includes(h.nombre)?"white":B.slate,borderColor:(form.hospitales||[]).includes(h.nombre)?B.slate:B.border}}>{h.nombre}</div>)}</div></FG>
              <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"space-between"}}>
                <div>{modal==="p_e"&&<button className="btn-danger" onClick={()=>delP(form.id)}>🗑</button>}</div>
                <div style={{display:"flex",gap:10}}><button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button><button className="btn-gold" onClick={saveP} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></div>
              </div>
            </>)}

            {/* Hospital */}
            {(modal==="h_n"||modal==="h_e")&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h3 style={{fontSize:17,fontWeight:700,color:B.slateDark}}>{modal==="h_n"?"Nuevo hospital":"Editar hospital"}</h3>
                <button onClick={()=>setModal(null)} style={{border:"none",background:B.bg,borderRadius:7,width:27,height:27,fontSize:15,color:B.muted,cursor:"pointer"}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="Nombre"><input className="inp" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Hospital Vall d'Hebron"/></FG>
                <FG label="Dirección (opcional)"><input className="inp" value={form.direccion||""} onChange={e=>setForm({...form,direccion:e.target.value})} placeholder="Dirección..."/></FG>
              </div>
              <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"space-between"}}>
                <div>{modal==="h_e"&&<button className="btn-danger" onClick={()=>delH(form.id)}>🗑</button>}</div>
                <div style={{display:"flex",gap:10}}><button className="btn-sec" onClick={()=>setModal(null)}>Cancelar</button><button className="btn-gold" onClick={saveH} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></div>
              </div>
            </>)}

          </div>
        </div>
      )}
    </div>
  );
}

    
