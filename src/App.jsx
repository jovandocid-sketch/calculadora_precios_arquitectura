import React, { useMemo, useState } from "react";

/** ====== RANGOS UF/m² – versión FULL (honorarios de PROYECTO) ====== */
const RANGOS = {
  "Vivienda de interés social": [0.35, 0.40, 0.45],
  "Vivienda económica": [0.45, 0.525, 0.60],
  "Vivienda social estandarizada": [0.60, 0.675, 0.75],
  "Vivienda unifamiliar": [0.80, 0.90, 1.00],
  "Vivienda unifamiliar premium": [1.10, 1.25, 1.40],
  "Viviendas turísticas / Refugios / Hostales": [1.00, 1.30, 1.60],

  "Interiorismo residencial (proyecto)": [0.50, 1.00, 1.50],
  "Interiorismo comercial básico (proyecto)": [0.50, 1.00, 1.00],
  "Interiorismo comercial alta gama (proyecto)": [1.00, 1.50, 2.00],

  "Regularización (genérica)": [0.33, 0.39, 0.45],

  "Recepción Final – Estándar (proyecto propio)": [0.10, 0.125, 0.15],
  "Recepción Final – Compleja": [0.15, 0.175, 0.20],
  "Recepción Final – Encargo aislado (+recargo)": [0.18, 0.22, 0.26]
};

const TIPOS = Object.keys(RANGOS);

function fUF(n) {
  return `${(Number(n) || 0).toFixed(3)} UF`;
}

function fCLP(n) { return (Number(n)||0).toLocaleString("es-CL", { style:"currency", currency:"CLP", maximumFractionDigits:0 }); }

export default function App() {
  const [tipo, setTipo] = useState("Vivienda unifamiliar");
  const [m2, setM2] = useState(100);
  const [ufCLP, setUfCLP] = useState(39428);   // editable; botón intenta traer automático
  const [recargo, setRecargo] = useState(0);   // %
  const [costoObra, setCostoObra] = useState("");

  const [bajo, medio, alto] = useMemo(() => RANGOS[tipo], [tipo]);
  const factor = 1 + (Number(recargo) || 0) / 100;

  const resultados = useMemo(() => {
    const calc = (t) => {
      const ufTotal = (Number(m2)||0) * t * factor;
      return {
        tasa: t,
        ufTotal,
        clpTotal: ufTotal * (Number(ufCLP)||0)
      };
    };
    return { bajo: calc(bajo), medio: calc(medio), alto: calc(alto) };
  }, [bajo, medio, alto, m2, ufCLP, factor]);

  const obraTotal = useMemo(() => {
    const v = Number(costoObra);
    if (!v || v <= 0) return null;
    return v * (Number(m2)||0);
  }, [costoObra, m2]);

  async function obtenerUF() {
    try {
      const res = await fetch("https://mindicador.cl/api/uf");
      const data = await res.json();
      const valor = Number(data?.serie?.[0]?.valor);
      if (valor > 0) setUfCLP(Math.round(valor));
      else alert("No se pudo leer la UF automática. Ingresa manual.");
    } catch (e) {
      alert("Error de conexión al obtener UF. Ingresa manual.");
    }
  }

  return (
    <div style={wrap}>
      <header style={header}>
        <div style={logos}>
          <img src="/logos/joc.png" alt="J. Ovando Cid & Arquitectos" style={{ height: 40, objectFit:"contain" }} />
          <span style={{ color: "#999" }}>·</span>
          <img src="/logos/dolab.png" alt="Do+Lab" style={{ height: 32, objectFit:"contain" }} />
        </div>
        <h1 style={h1}>Calculadora de Precios · UF/m² → UF & CLP</h1>
      </header>

      <section style={panel}>
        <label style={label}>Tipo / destino</label>
        <select value={tipo} onChange={(e)=>setTipo(e.target.value)} style={input}>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={subtle}>Rango UF/m²: {fUF(bajo)} · {fUF(medio)} · {fUF(alto)}</div>
      </section>

      <section style={{...grid, marginTop:12}}>
        <div>
          <label style={label}>Superficie (m²)</label>
          <input type="number" value={m2} onChange={(e)=>setM2(Math.max(0, Number(e.target.value)))} style={input} />
        </div>
        <div>
          <label style={label}>Valor UF (CLP)</label>
          <div style={{ display:"flex", gap:8 }}>
            <input type="number" value={ufCLP} onChange={(e)=>setUfCLP(Math.max(1, Number(e.target.value)))} style={{...input, flex:1}} />
            <button onClick={obtenerUF} style={btnGhost}>UF automática</button>
          </div>
          <div style={{ ...subtle, marginTop: 6 }}>
            Si la UF automática falla, ingrésala manualmente (SII mensual).
          </div>
        </div>
        <div>
          <label style={label}>Recargo (%)</label>
          <input type="number" value={recargo} onChange={(e)=>setRecargo(Math.max(0, Number(e.target.value)))} style={input} />
          <div style={{ ...subtle, marginTop: 6 }}>Para encargos aislados u otras condiciones especiales.</div>
        </div>
      </section>

      <section style={{...grid, marginTop:18}}>
        {["bajo","medio","alto"].map((k,i) => (
          <div key={k} style={card}>
            <div style={chip}>{k.toUpperCase()}</div>
            <div style={ufTotal}>{fUF(resultados[k].ufTotal)}</div>
            <div style={clpTotal}>{fCLP(resultados[k].clpTotal)}</div>
            <div style={base}>Base: {fUF(resultados[k].tasa)} · m²: {m2}{recargo?` · recargo: ${recargo}%`:""}</div>
          </div>
        ))}
      </section>

      <section style={{...panel, marginTop:18}}>
        <h3 style={h3}>Construcción estimativa (opcional)</h3>
        <div style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))" }}>
          <div>
            <label style={label}>Costo de obra (CLP/m²)</label>
            <input type="number" value={costoObra} onChange={(e)=>setCostoObra(e.target.value)} placeholder="Ej: 600000" style={input} />
          </div>
          <div>
            <label style={label}>Superficie (m²)</label>
            <input type="number" value={m2} onChange={(e)=>setM2(Math.max(0, Number(e.target.value)))} style={input} />
          </div>
        </div>
        {obraTotal!=null && (
          <div style={{ marginTop:10, fontWeight:600 }}>
            Referencia de obra: {fCLP(obraTotal)} <span style={subtle}>(no se usa en el cálculo de honorarios)</span>
          </div>
        )}
      </section>

      <section style={{...panel, marginTop:18}}>
        <h3 style={h3}>Alcance general (proyecto)</h3>
        <ul style={ul}>
          <li>Desarrollo de proyecto con antecedentes para Permiso de Edificación y/o Recepción Final según aplique.</li>
          <li>Gestión y coordinación básica con especialistas (estructuras, instalaciones, eficiencia energética) según alcance contratado.</li>
          <li>Para “encargo aislado” de Recepción Final se considera estudio del expediente y ajustes mínimos a la planimetría.</li>
        </ul>

        <h3 style={h3}>Notas</h3>
        <ul style={ul}>
          <li>Los valores corresponden a <strong>honorarios de proyecto</strong>, no a costos de construcción.</li>
          <li>Para interiorismo, los rangos son del <strong>proyecto</strong> (no consideran mobiliario ni materiales de ejecución).</li>
          <li>El recargo aplica en encargos aislados o condiciones singulares (viajes, urgencias, etc.).</li>
        </ul>

        <h3 style={h3}>Descargo</h3>
        <p style={p}>Esta herramienta entrega rangos de referencia. La propuesta definitiva puede variar según complejidad, ubicación, normativa y alcance específico.</p>
      </section>

      <section style={{ marginTop:18 }}>
        <a href="mailto:contacto@jovandocid.com" style={btnSolid}>Solicitar cotización por correo</a>
      </section>

      <footer style={footer}>
        Desarrollado por <strong>J. Ovando Cid & Arquitectos</strong> · <strong>Do+Lab</strong>
      </footer>
    </div>
  );
}

const wrap = { fontFamily:"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto", padding:"24px", maxWidth:1100, margin:"0 auto" };
const header = { display:"flex", alignItems:"center", gap:16, marginBottom:16, flexWrap:"wrap" };
const logos = { display:"flex", alignItems:"center", gap:10 };
const h1 = { fontSize:26, margin:0, lineHeight:1.1 };
const h3 = { fontSize:18, margin:"0 0 8px 0" };
const p  = { margin:"6px 0", color:"#333" };
const panel = { border:"1px solid #eaeaea", borderRadius:14, padding:14, background:"#fff" };
const grid  = { display:"grid", gap:14, gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))" };
const input = { width:"100%", padding:"12px 14px", borderRadius:12, border:"1px solid #ccc", outline:"none", fontSize:16 };
const label = { display:"block", fontWeight:600, marginBottom:6 };
const subtle = { color:"#666", fontSize:13 };
const card = { border:"1px solid #eaeaea", borderRadius:16, padding:16, background:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,.04)" };
const chip = { fontSize:12, color:"#666", letterSpacing:1, textTransform:"uppercase", marginBottom:6 };
const ufTotal = { fontSize:22, fontWeight:800, marginBottom:2 };
const clpTotal = { fontWeight:700, marginBottom:8, color:"#111" };
const base = { fontSize:12, color:"#777" };
const btnSolid = { display:"inline-block", padding:"12px 16px", borderRadius:12, background:"#111", color:"#fff", textDecoration:"none", fontWeight:700 };
const btnGhost = { padding:"12px 14px", borderRadius:12, background:"#f3f4f6", border:"1px solid #e5e7eb", cursor:"pointer" };
const ul = { margin:"6px 0 2px 0", paddingLeft: "20px" };
const footer = { marginTop:28, color:"#666", fontSize:13, display:"flex", gap:6, flexWrap:"wrap" };
