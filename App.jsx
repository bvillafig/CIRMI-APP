import { useState, useEffect } from "react";

// ─── CIRMI BRAND COLORS (from logo) ─────────────────────────────
// Azul pizarra: #4A6079  Dorado: #F5C842  Fondo: #F4F6F8

const BRAND = {
  slate: "#4A6079",
  slateDark: "#2E3F52",
  slateLight: "#6B8299",
  gold: "#F5C842",
  goldLight: "#FDF3C0",
  goldDark: "#D4A820",
  bg: "#F2F5F8",
  white: "#FFFFFF",
  text: "#1C2B3A",
  muted: "#7A90A4",
  border: "#DDE4EB",
};

// ─── DATA ───────────────────────────────────────────────────────
const HOSPITALES = ["Hospital A", "Hospital B", "Hospital C"];
const ESTADOS_CIRUGIA = ["Confirmada", "Pendiente", "Realizada", "Cancelada"];
const ESTADOS_FACTURA = ["Pendiente", "Facturada", "En revisión", "Cobrada"];

const initialPersonal = [
  { id: 1, nombre: "Dr. García", rol: "Cirujano Principal", hospitales: ["Hospital A","Hospital B","Hospital C"], tel: "655 000 000", color: BRAND.slate },
  { id: 2, nombre: "Dr. Ruiz", rol: "Cirujano Residente", hospitales: ["Hospital A","Hospital B"], tel: "655 000 001", color: BRAND.slateDark },
  { id: 3, nombre: "Dr. López", rol: "Cirujano Residente", hospitales: ["Hospital B","Hospital C"], tel: "655 000 002", color: BRAND.slateLight },
  { id: 4, nombre: "Enf. Martínez", rol: "Enf. Instrumentista", hospitales: ["Hospital A","Hospital C"], tel: "655 000 003", color: BRAND.goldDark },
  { id: 5, nombre: "Enf. Sánchez", rol: "Enf. Instrumentista", hospitales: ["Hospital B"], tel: "655 000 004", color: "#8B6914" },
  { id: 6, nombre: "Enf. Torres", rol: "Enf. Instrumentista", hospitales: ["Hospital A","Hospital B","Hospital C"], tel: "655 000 005", color: "#3D6B8C" },
];

const today = new Date();
const fmt = (d) => d.toISOString().split("T")[0];

const initialCirugias = [
  { id: "CIR-001", fecha: fmt(today), hospital: "Hospital A", quirofano: "Q-1", tipo: "Laparoscopia", cirujano: "Dr. García", ayudante: "Dr. Ruiz", enfermera: "Enf. Martínez", inicio: "08:00", fin: "10:00", estado: "Confirmada", factura: "Pendiente", paciente: "PAC-2025-001", obs: "" },
  { id: "CIR-002", fecha: fmt(today), hospital: "Hospital B", quirofano: "Q-2", tipo: "Colecistectomía", cirujano: "Dr. García", ayudante: "Dr. López", enfermera: "Enf. Sánchez", inicio: "12:00", fin: "14:30", estado: "Confirmada", factura: "Pendiente", paciente: "PAC-2025-002", obs: "Confirmar anestesista" },
  { id: "CIR-003", fecha: fmt(new Date(today.getTime() + 86400000)), hospital: "Hospital C", quirofano: "Q-1", tipo: "Hernia inguinal", cirujano: "Dr. García", ayudante: "Dr. Ruiz", enfermera: "Enf. Torres", inicio: "09:00", fin: "11:00", estado: "Pendiente", factura: "Pendiente", paciente: "PAC-2025-003", obs: "" },
  { id: "CIR-004", fecha: fmt(new Date(today.getTime() + 86400000*2)), hospital: "Hospital A", quirofano: "Q-2", tipo: "Apendicectomía", cirujano: "Dr. García", ayudante: "Dr. López", enfermera: "Enf. Martínez", inicio: "07:30", fin: "09:00", estado: "Confirmada", factura: "Facturada", paciente: "PAC-2025-004", obs: "" },
];

// ─── HELPERS ────────────────────────────────────────────────────
const colorEstado = (e) => ({ "Confirmada": "#2E7D52", "Pendiente": "#9A6B00", "Realizada": BRAND.slate, "Cancelada": "#B91C1C" }[e] || BRAND.muted);
const bgEstado   = (e) => ({ "Confirmada": "#E6F4EC", "Pendiente": BRAND.goldLight, "Realizada": "#E8EDF2", "Cancelada": "#FEE2E2" }[e] || "#F1F5F9");
const colorFact  = (e) => ({ "Pendiente": "#9A6B00", "Facturada": BRAND.slate, "En revisión": "#B91C1C", "Cobrada": "#2E7D52" }[e] || BRAND.muted);
const bgFact     = (e) => ({ "Pendiente": BRAND.goldLight, "Facturada": "#E8EDF2", "En revisión": "#FEE2E2", "Cobrada": "#E6F4EC" }[e] || "#F1F5F9");

// ─── LOGO SVG (recreated from brand) ────────────────────────────
const CirmiLogo = ({ size = 32 }) => (
  <svg width={size * 3.2} height={size} viewBox="0 0 128 40" fill="none">
    <text x="0" y="32" fontFamily="Georgia, serif" fontSize="36" fontWeight="700" fill={BRAND.white} letterSpacing="-1">CIRMI</text>
    <line x1="8" y1="4" x2="22" y2="36" stroke={BRAND.gold} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function App() {
  const [tab, setTab] = useState("agenda");
  const [cirugias, setCirugias] = useState(initialCirugias);
  const [personal] = useState(initialPersonal);
  const [modal, setModal] = useState(null);
  const [selectedHosp, setSelectedHosp] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState(fmt(today));
  const [form, setForm] = useState({});
  const [filtroFactura, setFiltroFactura] = useState("Todos");
  const [nextId, setNextId] = useState(5);

  const openNew = () => {
    setForm({ id: `CIR-00${nextId}`, fecha: selectedDate, hospital: "Hospital A", quirofano: "Q-1", tipo: "", cirujano: "Dr. García", ayudante: "", enfermera: "", inicio: "08:00", fin: "10:00", estado: "Confirmada", factura: "Pendiente", paciente: "", obs: "" });
    setModal("nueva");
  };

  const saveForm = () => {
    if (modal === "nueva") { setCirugias(p => [...p, form]); setNextId(n => n+1); }
    else { setCirugias(p => p.map(c => c.id === form.id ? form : c)); }
    setModal(null);
  };

  const deleteCirugia = (id) => { setCirugias(p => p.filter(c => c.id !== id)); setModal(null); };

  const cirugiasDia = cirugias.filter(c =>
    (selectedHosp === "Todos" || c.hospital === selectedHosp) && c.fecha === selectedDate
  );

  const pendFactura = cirugias.filter(c => c.factura === "Pendiente").length;
  const hoyCount = cirugias.filter(c => c.fecha === fmt(today)).length;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: BRAND.bg, minHeight: "100vh", color: BRAND.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { cursor: pointer; font-family: inherit; }
        input, select, textarea { font-family: inherit; }

        .card { background: white; border-radius: 14px; box-shadow: 0 1px 4px rgba(46,63,82,0.08), 0 4px 16px rgba(46,63,82,0.04); }
        .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: .2px; }

        .btn-prim { background: ${BRAND.gold}; color: ${BRAND.slateDark}; border: none; padding: 10px 20px; border-radius: 9px; font-size: 14px; font-weight: 700; transition: all .15s; }
        .btn-prim:hover { background: ${BRAND.goldDark}; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245,200,66,0.4); }
        .btn-sec { background: white; color: ${BRAND.slate}; border: 1.5px solid ${BRAND.border}; padding: 9px 18px; border-radius: 9px; font-size: 14px; font-weight: 500; transition: all .15s; }
        .btn-sec:hover { border-color: ${BRAND.slateLight}; background: #F8FAFB; }
        .btn-danger { background: #FEF2F2; color: #DC2626; border: 1.5px solid #FECACA; padding: 9px 18px; border-radius: 9px; font-size: 14px; font-weight: 500; transition: background .15s; }
        .btn-danger:hover { background: #FEE2E2; }

        .tab-btn { padding: 9px 18px; border: none; background: none; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.6); border-radius: 8px; transition: all .15s; }
        .tab-btn.active { background: ${BRAND.gold}; color: ${BRAND.slateDark}; font-weight: 700; }
        .tab-btn:hover:not(.active) { background: rgba(255,255,255,0.1); color: white; }

        .inp { width: 100%; padding: 9px 12px; border: 1.5px solid ${BRAND.border}; border-radius: 8px; font-size: 14px; outline: none; transition: border .15s; color: ${BRAND.text}; }
        .inp:focus { border-color: ${BRAND.slate}; }

        .row-card { background: white; border: 1.5px solid ${BRAND.border}; border-radius: 11px; padding: 14px 18px; margin-bottom: 8px; cursor: pointer; transition: all .15s; display: grid; grid-template-columns: 80px 1fr 1fr 1fr 100px 100px 28px; gap: 12px; align-items: center; }
        .row-card:hover { border-color: ${BRAND.slateLight}; box-shadow: 0 3px 12px rgba(46,63,82,0.1); transform: translateY(-1px); }

        .overlay { position: fixed; inset: 0; background: rgba(30,43,58,0.5); backdrop-filter: blur(6px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: white; border-radius: 18px; padding: 32px; max-width: 640px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 30px 80px rgba(30,43,58,0.25); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-group label { display: block; font-size: 11px; font-weight: 700; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; }

        .avatar { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; flex-shrink: 0; }
        .stat-card { background: white; border-radius: 14px; padding: 20px 22px; box-shadow: 0 1px 3px rgba(46,63,82,0.06); }

        .hosp-card { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(46,63,82,0.07); }
        .col-header { font-size: 11px; font-weight: 700; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: .5px; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: BRAND.slateDark, padding: "0 28px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 16px rgba(20,30,42,0.35)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>

          {/* Logo area */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Stylized CIRMI wordmark matching logo colors */}
              <svg width="96" height="28" viewBox="0 0 96 28">
                <text x="0" y="22" fontFamily="Georgia, 'Times New Roman', serif" fontSize="26" fontWeight="700" fill={BRAND.white} letterSpacing="1">CIRMI</text>
                <line x1="5" y1="2" x2="16" y2="26" stroke={BRAND.gold} strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: .3 }}>Gestión Quirúrgica</span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {[["agenda","📅 Agenda"],["hospitales","🏨 Hospitales"],["personal","👥 Personal"],["facturacion","💰 Facturación"]].map(([id, label]) => (
              <button key={id} className={`tab-btn ${tab===id?"active":""}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {pendFactura > 0 && (
              <div onClick={() => { setTab("facturacion"); setFiltroFactura("Pendiente"); }}
                style={{ background: BRAND.goldLight, color: BRAND.goldDark, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${BRAND.gold}` }}>
                ⚠ {pendFactura} fact. pendiente{pendFactura > 1 ? "s" : ""}
              </div>
            )}
            <button className="btn-prim" onClick={openNew} style={{ padding: "8px 16px", fontSize: 13 }}>+ Nueva cirugía</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 28px" }}>

        {/* ── STATS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Cirugías hoy", value: hoyCount, icon: "🔪", accent: BRAND.slate },
            { label: "Próximos 7 días", value: cirugias.filter(c => { const d=new Date(c.fecha); return d>=today && d<=new Date(today.getTime()+7*86400000); }).length, icon: "📅", accent: BRAND.slateLight },
            { label: "Fact. pendiente", value: pendFactura, icon: "📋", accent: BRAND.goldDark },
            { label: "Profesionales", value: personal.length, icon: "👥", accent: BRAND.slateDark },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.accent}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: s.accent, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: BRAND.muted, fontWeight: 500, marginTop: 5 }}>{s.label}</div>
                </div>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════ AGENDA ══════════════ */}
        {tab === "agenda" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: BRAND.slateDark }}>Agenda de Quirófano</h2>
                <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 3 }}>Intervenciones programadas por fecha y centro</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="inp" style={{ width: 165 }} />
                <select className="inp" style={{ width: 148 }} value={selectedHosp} onChange={e => setSelectedHosp(e.target.value)}>
                  <option>Todos</option>
                  {HOSPITALES.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 100px 100px 28px", gap: 12, padding: "6px 18px", marginBottom: 6 }}>
              {["Horario","Intervención","Equipo","Centro / Q","Estado","Factura",""].map(h => (
                <div key={h} className="col-header">{h}</div>
              ))}
            </div>

            {cirugiasDia.length === 0 ? (
              <div className="card" style={{ padding: 52, textAlign: "center", color: BRAND.muted }}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Sin cirugías para esta fecha</div>
                <div style={{ fontSize: 13, marginTop: 5 }}>Cambia la fecha o añade una nueva intervención</div>
                <button className="btn-prim" onClick={openNew} style={{ marginTop: 18 }}>+ Añadir cirugía</button>
              </div>
            ) : cirugiasDia.sort((a,b) => a.inicio.localeCompare(b.inicio)).map(c => (
              <div key={c.id} className="row-card" onClick={() => { setForm({...c}); setModal("edit"); }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 600, color: BRAND.slateDark }}>{c.inicio}</div>
                  <div style={{ fontSize: 11, color: BRAND.muted, marginTop: 2 }}>→ {c.fin}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: BRAND.text }}>{c.tipo}</div>
                  <div style={{ fontSize: 11, color: BRAND.muted, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{c.id}</div>
                  {c.obs && <div style={{ fontSize: 11, color: BRAND.goldDark, marginTop: 3 }}>⚠ {c.obs}</div>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 600 }}>🔪 {c.cirujano}</div>
                  {c.ayudante && <div style={{ color: BRAND.muted }}>🤝 {c.ayudante}</div>}
                  {c.enfermera && <div style={{ color: BRAND.muted }}>💉 {c.enfermera}</div>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.hospital}</div>
                  <div style={{ fontSize: 12, color: BRAND.muted }}>{c.quirofano}</div>
                </div>
                <span className="badge" style={{ background: bgEstado(c.estado), color: colorEstado(c.estado) }}>{c.estado}</span>
                <span className="badge" style={{ background: bgFact(c.factura), color: colorFact(c.factura) }}>{c.factura}</span>
                <span style={{ color: BRAND.border, fontSize: 20 }}>›</span>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════ HOSPITALES ══════════════ */}
        {tab === "hospitales" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: BRAND.slateDark }}>Vista por Hospital</h2>
                <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 3 }}>Situación en cada centro para la fecha seleccionada</p>
              </div>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="inp" style={{ width: 165 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
              {HOSPITALES.map((h, idx) => {
                const cxs = cirugias.filter(c => c.hospital === h && c.fecha === selectedDate);
                const accentColors = [BRAND.slate, BRAND.slateDark, BRAND.slateLight];
                const accent = accentColors[idx];
                return (
                  <div key={h} className="hosp-card">
                    <div style={{ background: accent, padding: "20px 22px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ color: "white", fontWeight: 700, fontSize: 17 }}>{h}</div>
                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 }}>
                            {cxs.length} cirugía{cxs.length !== 1 ? "s" : ""} · {selectedDate}
                          </div>
                        </div>
                        <div style={{ background: BRAND.gold, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: BRAND.slateDark }}>
                          {cxs.length}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "16px 18px" }}>
                      {cxs.length === 0 ? (
                        <div style={{ color: BRAND.muted, fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>🏥</div>
                          Sin intervenciones este día
                        </div>
                      ) : cxs.sort((a,b) => a.inicio.localeCompare(b.inicio)).map(c => (
                        <div key={c.id}
                          onClick={() => { setForm({...c}); setModal("edit"); }}
                          style={{ padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${BRAND.border}`, marginBottom: 8, cursor: "pointer", transition: "all .15s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor=accent; e.currentTarget.style.background="#FAFBFC"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor=BRAND.border; e.currentTarget.style.background="white"; }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: accent }}>{c.inicio}–{c.fin}</span>
                            <span className="badge" style={{ background: bgEstado(c.estado), color: colorEstado(c.estado), fontSize: 11 }}>{c.estado}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{c.tipo}</div>
                          <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 3 }}>{c.quirofano} · {c.cirujano}</div>
                          {c.obs && <div style={{ fontSize: 11, color: BRAND.goldDark, marginTop: 4 }}>⚠ {c.obs}</div>}
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${BRAND.border}`, paddingTop: 14 }}>
                      <div className="col-header" style={{ marginBottom: 10 }}>Personal asignado</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {personal.filter(p => p.hospitales.includes(h)).map(p => (
                          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, background: BRAND.bg, borderRadius: 20, padding: "4px 10px 4px 5px", border: `1px solid ${BRAND.border}` }}>
                            <div className="avatar" style={{ background: p.color, width: 22, height: 22, fontSize: 9 }}>
                              {p.nombre.split(" ").slice(-1)[0][0]}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{p.nombre}</span>
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

        {/* ══════════════ PERSONAL ══════════════ */}
        {tab === "personal" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: BRAND.slateDark }}>Gestión de Personal</h2>
              <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 3 }}>Carga de trabajo y próximas intervenciones del equipo</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              {personal.map(p => {
                const cxs = cirugias.filter(c => [c.cirujano, c.ayudante, c.enfermera].includes(p.nombre));
                const proximas = cxs.filter(c => new Date(c.fecha) >= today).sort((a,b) => new Date(a.fecha)-new Date(b.fecha));
                return (
                  <div key={p.id} className="card" style={{ padding: 22, borderLeft: `4px solid ${p.color}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div className="avatar" style={{ background: p.color, width: 50, height: 50, fontSize: 18 }}>
                        {p.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{p.nombre}</div>
                        <div style={{ fontSize: 13, color: BRAND.muted }}>{p.rol}</div>
                        <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>📞 {p.tel}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 26, fontWeight: 700, color: p.color }}>{cxs.length}</div>
                        <div style={{ fontSize: 11, color: BRAND.muted }}>cirugías</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                      {p.hospitales.map(h => (
                        <span key={h} style={{ background: BRAND.bg, color: BRAND.slate, borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 600, border: `1px solid ${BRAND.border}` }}>{h}</span>
                      ))}
                    </div>

                    {proximas.length > 0 ? (
                      <div>
                        <div className="col-header" style={{ marginBottom: 8 }}>Próximas intervenciones</div>
                        {proximas.slice(0,3).map(c => (
                          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${BRAND.border}` }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.tipo}</div>
                              <div style={{ fontSize: 12, color: BRAND.muted }}>{c.fecha} · {c.hospital}</div>
                            </div>
                            <span className="badge" style={{ background: bgEstado(c.estado), color: colorEstado(c.estado), fontSize: 11 }}>{c.estado}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: BRAND.muted, fontSize: 13, padding: "8px 0", fontStyle: "italic" }}>Sin intervenciones próximas programadas</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════ FACTURACIÓN ══════════════ */}
        {tab === "facturacion" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: BRAND.slateDark }}>Facturación</h2>
                <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 3 }}>Seguimiento de cobros por intervención</p>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Todos","Pendiente","Facturada","En revisión","Cobrada"].map(f => (
                  <button key={f} onClick={() => setFiltroFactura(f)}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .15s",
                      background: filtroFactura===f ? BRAND.slateDark : "white",
                      color: filtroFactura===f ? "white" : BRAND.slate,
                      borderColor: filtroFactura===f ? BRAND.slateDark : BRAND.border }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
              {["Pendiente","Facturada","En revisión","Cobrada"].map(estado => {
                const n = cirugias.filter(c => c.factura === estado).length;
                return (
                  <div key={estado} className="stat-card" style={{ borderTop: `3px solid ${colorFact(estado)}`, cursor: "pointer", transition: "all .15s" }}
                    onClick={() => setFiltroFactura(estado)}
                    onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform="none"}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: colorFact(estado) }}>{n}</div>
                    <div style={{ fontSize: 13, color: BRAND.muted, marginTop: 3 }}>{estado}</div>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "90px 100px 1fr 140px 110px 130px 40px", gap: 12, padding: "12px 20px", background: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                {["ID","Fecha","Intervención / Cirujano","Hospital","Estado","Factura",""].map(h => (
                  <div key={h} className="col-header">{h}</div>
                ))}
              </div>
              {cirugias.filter(c => filtroFactura==="Todos" || c.factura===filtroFactura)
                .sort((a,b) => new Date(b.fecha)-new Date(a.fecha))
                .map((c, i) => (
                <div key={c.id}
                  style={{ display: "grid", gridTemplateColumns: "90px 100px 1fr 140px 110px 130px 40px", gap: 12, padding: "13px 20px", borderBottom: `1px solid ${BRAND.border}`, alignItems: "center", background: i%2===0?"white":"#FAFBFC", cursor: "pointer", transition: "background .1s" }}
                  onClick={() => { setForm({...c}); setModal("edit"); }}
                  onMouseEnter={e => e.currentTarget.style.background="#F0F4F8"}
                  onMouseLeave={e => e.currentTarget.style.background=i%2===0?"white":"#FAFBFC"}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600, color: BRAND.slate }}>{c.id}</div>
                  <div style={{ fontSize: 13, color: BRAND.muted }}>{c.fecha}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.tipo}</div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>{c.cirujano}</div>
                  </div>
                  <div style={{ fontSize: 13 }}>{c.hospital}<br/><span style={{ color: BRAND.muted, fontSize: 12 }}>{c.quirofano}</span></div>
                  <span className="badge" style={{ background: bgEstado(c.estado), color: colorEstado(c.estado), fontSize: 11 }}>{c.estado}</span>
                  <div onClick={e => e.stopPropagation()}>
                    <select className="inp" style={{ padding: "5px 8px", fontSize: 12 }} value={c.factura}
                      onChange={e => setCirugias(p => p.map(x => x.id===c.id ? {...x, factura: e.target.value} : x))}>
                      {ESTADOS_FACTURA.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <span style={{ color: BRAND.border, fontSize: 20, textAlign: "center" }}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ MODAL ══════════════ */}
      {modal && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: BRAND.slateDark }}>{modal==="nueva" ? "Nueva intervención" : "Editar intervención"}</h3>
                {form.id && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: BRAND.muted, marginTop: 2 }}>{form.id}</div>}
              </div>
              <button onClick={() => setModal(null)} style={{ border: "none", background: BRAND.bg, borderRadius: 8, width: 32, height: 32, fontSize: 18, color: BRAND.muted, cursor: "pointer" }}>×</button>
            </div>

            <div className="form-grid">
              {[
                ["Fecha", <input type="date" className="inp" value={form.fecha||""} onChange={e=>setForm({...form,fecha:e.target.value})} />],
                ["Hospital", <select className="inp" value={form.hospital||""} onChange={e=>setForm({...form,hospital:e.target.value})}>{HOSPITALES.map(h=><option key={h}>{h}</option>)}</select>],
                ["Quirófano", <select className="inp" value={form.quirofano||""} onChange={e=>setForm({...form,quirofano:e.target.value})}>{"Q-1,Q-2,Q-3,Q-4".split(",").map(q=><option key={q}>{q}</option>)}</select>],
                ["Tipo de cirugía", <input className="inp" value={form.tipo||""} onChange={e=>setForm({...form,tipo:e.target.value})} placeholder="Ej: Laparoscopia" />],
                ["Hora inicio", <input type="time" className="inp" value={form.inicio||""} onChange={e=>setForm({...form,inicio:e.target.value})} />],
                ["Hora fin", <input type="time" className="inp" value={form.fin||""} onChange={e=>setForm({...form,fin:e.target.value})} />],
                ["Cirujano principal", <select className="inp" value={form.cirujano||""} onChange={e=>setForm({...form,cirujano:e.target.value})}>{personal.map(p=><option key={p.id}>{p.nombre}</option>)}</select>],
                ["Ayudante", <select className="inp" value={form.ayudante||""} onChange={e=>setForm({...form,ayudante:e.target.value})}><option value="">— Sin ayudante —</option>{personal.map(p=><option key={p.id}>{p.nombre}</option>)}</select>],
                ["Enfermera instrumentista", <select className="inp" value={form.enfermera||""} onChange={e=>setForm({...form,enfermera:e.target.value})}><option value="">— Sin asignar —</option>{personal.filter(p=>p.rol.includes("Enf")).map(p=><option key={p.id}>{p.nombre}</option>)}</select>],
                ["Código paciente", <input className="inp" value={form.paciente||""} onChange={e=>setForm({...form,paciente:e.target.value})} placeholder="PAC-2025-XXX" />],
                ["Estado cirugía", <select className="inp" value={form.estado||""} onChange={e=>setForm({...form,estado:e.target.value})}>{ESTADOS_CIRUGIA.map(s=><option key={s}>{s}</option>)}</select>],
                ["Estado factura", <select className="inp" value={form.factura||""} onChange={e=>setForm({...form,factura:e.target.value})}>{ESTADOS_FACTURA.map(s=><option key={s}>{s}</option>)}</select>],
              ].map(([label, field]) => (
                <div className="form-group" key={label}>
                  <label>{label}</label>
                  {field}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Observaciones</label>
              <textarea className="inp" rows={3} value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} placeholder="Notas, avisos, incidencias..." style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 26, justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {modal==="edit" && <button className="btn-danger" onClick={() => deleteCirugia(form.id)}>🗑 Eliminar</button>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-sec" onClick={() => setModal(null)}>Cancelar</button>
                <button className="btn-prim" onClick={saveForm}>{modal==="nueva" ? "Crear intervención" : "Guardar cambios"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
