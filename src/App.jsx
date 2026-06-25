import { useState, useEffect, useRef } from "react";

const SUPA_URL = "https://xpackkiprznsrotsohce.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwYWNra2lwcnpuc3JvdHNvaGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTkzMTIsImV4cCI6MjA5MTIzNTMxMn0.BBZzEnIkHfGcrMPoRa8cMp3_KKrlFAnsg8lXQijC9dA";
const SUPA_PUB = "sb_publishable_kwmh9aAwybdtGLZWA7Mqfg_PrsEEuGu";
const AUTH_STORAGE_KEY = "neylika_admin_session";

const adminLogin = async (email, password) => {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": SUPA_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error_description || data.msg || "Identifiants incorrects" };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  return { ok: true, session: data };
};

const adminLogout = () => { localStorage.removeItem(AUTH_STORAGE_KEY); };

// Lecture synchrone simple (utilisée pour l'affichage / vérif rapide, ne rafraîchit pas)
const getAdminSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expires_at && session.expires_at * 1000 < Date.now()) { localStorage.removeItem(AUTH_STORAGE_KEY); return null; }
    return session;
  } catch { return null; }
};

// Version robuste : si le token est expiré, tente un refresh avant d'abandonner.
// À utiliser pour toute action critique (suppression, modification) plutôt que getAdminSession().
const getValidAdminSession = async () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    const isExpired = session.expires_at && session.expires_at * 1000 < Date.now();
    if (!isExpired) return session;
    if (!session.refresh_token) { localStorage.removeItem(AUTH_STORAGE_KEY); return null; }
    const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "apikey": SUPA_PUB, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) { localStorage.removeItem(AUTH_STORAGE_KEY); return null; }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch { return null; }
};

const resetClientPassword = async (email) => {
  const res = await fetch(`${SUPA_URL}/auth/v1/recover`, {
    method: "POST",
    headers: { "apikey": SUPA_PUB, "Content-Type": "application/json" },
    body: JSON.stringify({ email, options: { redirectTo: "https://neylika.vercel.app/?reset=1" } }),
  });
  if (!res.ok) { const data = await res.json().catch(() => ({})); return { ok: false, error: data.error_description || data.msg || "Impossible d'envoyer l'email" }; }
  return { ok: true };
};

const updateClientPassword = async (accessToken, newPassword) => {
  const res = await fetch(`${SUPA_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { "apikey": SUPA_PUB, "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) { const data = await res.json().catch(() => ({})); return { ok: false, error: data.error_description || data.msg || "Impossible de modifier le mot de passe" }; }
  return { ok: true };
};

const EJS_SERVICE = "service_kavvgs8";
const EJS_TPL_CLIENTE = "template_db2x2jl";
const EJS_TPL_PRO = "template_7hrk5ea";
const EJS_KEY = "xmgbAOdC2q5UulDnS";

const sendEmails = async (rdv, clientEmail) => {
  const formatDate = (s) => {
    const [y,m,d] = s.split("-");
    const jours = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
    const mois = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
    const date = new Date(+y, +m-1, +d);
    return `${jours[date.getDay()]} ${+d} ${mois[+m-1]} ${y}`;
  };
  const params = { client_prenom: rdv.client_prenom, client_nom: rdv.client_nom, client_tel: rdv.client_tel, client_email: clientEmail, prestation: rdv.prestation, date: formatDate(rdv.date), slot: rdv.slot, prix: rdv.prix };
  try {
    const send = (tpl, to) => fetch("https://api.emailjs.com/api/v1.0/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service_id: EJS_SERVICE, template_id: tpl, user_id: EJS_KEY, template_params: { ...params, to_email: to } }) });
    await send(EJS_TPL_CLIENTE, clientEmail);
  } catch(e) { console.log("Email error:", e); }
};

const sendCancelEmail = async (rdv) => {
  if(!rdv.client_email) return;
  const JOURS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const dateObj = new Date(rdv.date + "T12:00:00");
  const dateFr = `${JOURS[dateObj.getDay()]} ${dateObj.getDate()} ${MOIS[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  const params = { client_prenom: rdv.client_prenom||"", client_nom: rdv.client_nom||"", client_tel: rdv.client_tel||"", client_email: rdv.client_email||"", prestation: rdv.prestation, date: dateFr, slot: rdv.slot||"", prix: rdv.prix||0, to_email: rdv.client_email };
  try { await fetch("https://api.emailjs.com/api/v1.0/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service_id: EJS_SERVICE, template_id: EJS_TPL_PRO, user_id: EJS_KEY, template_params: params }) }); } catch(e) { console.log("Cancel email error:", e); }
};

const NTFY_TOPIC = "neylika-rdv-q8mk3xfp7vwn";
const sendPush = async (title, message) => { try { await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, { method: "POST", body: `${title}\n${message}`, mode: "no-cors", keepalive: true }); } catch(e) { console.log("Push error:", e); } };

// ─── MAKE WEBHOOKS — gérés par des triggers Postgres pour création/annulation/suppression ──
// (table rdvs : triggers make-rdvs / trg_rdv_annule / trg_rdv_supprime)
// Seul le DÉPLACEMENT (changement de date/slot sans changement de statut) n'est couvert par
// aucun trigger Postgres : on appelle donc Make manuellement dans ce cas précis uniquement,
// pour supprimer l'ancien événement Google et recréer le nouveau au bon horaire.
const MAKE_HOOK_RDV_CREATED = "https://hook.eu1.make.com/ts1aq7d3ovff4g2sf4lxexdms1ssdxle";
const MAKE_HOOK_RDV_CANCELLED = "https://hook.eu1.make.com/hrrij492yn2c5wnhbkb7yd5xsvwhcucx";

const notifyMakeRdvCreated = async (rdv) => {
  try {
    await fetch(MAKE_HOOK_RDV_CREATED, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record: rdv }),
    });
  } catch(e) { console.log("Make webhook (création) error:", e); }
};

const notifyMakeRdvCancelled = async (rdv) => {
  try {
    await fetch(MAKE_HOOK_RDV_CANCELLED, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record: rdv }),
    });
  } catch(e) { console.log("Make webhook (annulation) error:", e); }
};

const HORS_FIDELITE = ["Dépose extérieure","Dépose Neylika","Dépose semi-permanent","Consultation"];
const checkFidelitePromo = (allRdvs, newRdv) => {
  if(newRdv.cat_id !== "ongles" && newRdv.cat_id !== "spray") return null;
  if(newRdv.statut !== "confirmé") return null;
  if(HORS_FIDELITE.includes(newRdv.prestation)) return null;
  const sameClient = (r) => { if(newRdv.user_id) return r.user_id === newRdv.user_id; return r.client_tel === newRdv.client_tel; };
  const existing = allRdvs.filter(r => r.cat_id === newRdv.cat_id && r.statut === "confirmé" && sameClient(r) && !HORS_FIDELITE.includes(r.prestation)).length;
  const nb = existing + 1;
  const cycle = nb % 10;
  if(cycle === 0) return {remise:10, msg:`🎁 PROMO -10€ à appliquer (${nb}e RDV ${newRdv.cat_id})`, nb};
  if(cycle === 5) return {remise:5, msg:`🎁 PROMO -5€ à appliquer (${nb}e RDV ${newRdv.cat_id})`, nb};
  return null;
};

const CLIENT_STORAGE_KEY = "nlb_sess";
const getClientSession = () => {
  try { const raw = localStorage.getItem(CLIENT_STORAGE_KEY); if (!raw) return null; return JSON.parse(raw); } catch { return null; }
};

const api = {
  h: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
  ah: (t) => ({ "apikey": SUPA_KEY, "Authorization": `Bearer ${t}`, "Content-Type": "application/json", "Prefer": "return=representation" }),
  authHeaders() {
    const clientSess = getClientSession();
    if (clientSess && clientSess.token) return this.ah(clientSess.token);
    const s = getAdminSession();
    return s ? this.ah(s.access_token) : this.h;
  },
  async get(table, q="") { const r=await fetch(`${SUPA_URL}/rest/v1/${table}?${q}`,{headers:this.authHeaders()}); return r.json(); },
  async post(table, body, token) { const h=token?this.ah(token):{...this.authHeaders(),"Prefer":"return=representation"}; const r=await fetch(`${SUPA_URL}/rest/v1/${table}`,{method:"POST",headers:h,body:JSON.stringify(body)}); return r.json(); },
  async patch(table, filter, body, token) { const h=token?{...this.ah(token),"Prefer":"return=representation"}:{...this.authHeaders(),"Prefer":"return=representation"}; const r=await fetch(`${SUPA_URL}/rest/v1/${table}?${filter}`,{method:"PATCH",headers:h,body:JSON.stringify(body)}); return r.json(); },
  async del(table, filter, token) { const h=token?this.ah(token):this.authHeaders(); const r=await fetch(`${SUPA_URL}/rest/v1/${table}?${filter}`,{method:"DELETE",headers:h}); if(r.status===204) return {ok:true}; try { return await r.json(); } catch { return {ok:r.ok}; } },
  async signUp(email, password) { const r=await fetch(`${SUPA_URL}/auth/v1/signup`,{method:"POST",headers:{"apikey":SUPA_PUB,"Content-Type":"application/json"},body:JSON.stringify({email,password})}); return r.json(); },
  async signIn(email, password) { const r=await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"apikey":SUPA_PUB,"Content-Type":"application/json"},body:JSON.stringify({email,password})}); return r.json(); },
  async refreshToken(refresh_token) { const r=await fetch(`${SUPA_URL}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:{"apikey":SUPA_PUB,"Content-Type":"application/json"},body:JSON.stringify({refresh_token})}); return r.json(); },
  async signOut(token) { await fetch(`${SUPA_URL}/auth/v1/logout`,{method:"POST",headers:{"apikey":SUPA_PUB,"Authorization":`Bearer ${token}`}}); },
  async upsert(table, body, token) { const r=await fetch(`${SUPA_URL}/rest/v1/${table}`,{method:"POST",headers:{...this.ah(token),"Prefer":"return=representation,resolution=merge-duplicates"},body:JSON.stringify(body)}); return r.json(); },
};

// ─── SERVICES ────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: "ongles", label: "Prothésie Ongulaire — Mains", color: "#c4a882",
    desc: "Gainage, capsules & nail art",
    subcats: [
      {
        id: "gainage", label: "Gainage sur ongle naturel",
        prestations: [
          { id:"g1", nom:"Naturel / Milky", duree:120, prix:45, acompte:15 },
          { id:"g2", nom:"Couleur uni", duree:120, prix:50, acompte:15 },
          { id:"g3", nom:"French", duree:120, prix:50, acompte:15 },
          { id:"g4", nom:"Chrome", duree:120, prix:50, acompte:15 },
          { id:"g5", nom:"Nail art", duree:120, prix:null, acompte:0, devis:true },
        ],
      },
      {
        id: "capsules", label: "Rallongement capsules gel",
        prestations: [
          { id:"c1", nom:"Naturel / Milky", duree:120, prix:50, acompte:15 },
          { id:"c2", nom:"Couleur uni", duree:120, prix:55, acompte:15 },
          { id:"c3", nom:"French", duree:120, prix:55, acompte:15 },
          { id:"c4", nom:"Chrome", duree:120, prix:55, acompte:15 },
          { id:"c5", nom:"Nail art", duree:120, prix:null, acompte:0, devis:true },
        ],
      },
      {
        id: "remplissage", label: "Remplissage",
        note: "⚠️ Au-delà de 3 semaines, un supplément de 5 € sera demandé le jour J.",
        prestations: [
          { id:"r1", nom:"Naturel / Milky", duree:120, prix:45, acompte:15 },
          { id:"r2", nom:"Couleur", duree:120, prix:50, acompte:15 },
          { id:"r3", nom:"French", duree:120, prix:50, acompte:15 },
          { id:"r4", nom:"Chrome", duree:120, prix:50, acompte:15 },
          { id:"r5", nom:"Nail art", duree:120, prix:null, acompte:0, devis:true },
        ],
      },
      {
        id: "semi_permanent", label: "Semi-permanent",
        note: "💅 Le nail art n'est pas disponible en semi-permanent.",
        prestations: [
          { id:"sp1", nom:"Couleur", duree:60, prix:35, acompte:0 },
        ],
      },
      {
        id: "depose", label: "Dépose",
        prestations: [
          { id:"d1", nom:"Dépose extérieure", duree:30, prix:20, acompte:0 },
          { id:"d2", nom:"Dépose Neylika", duree:30, prix:10, acompte:0 },
        ],
      },
    ],
  },
  {
    id: "laser", label: "Épilation Laser Diode", color: "#9a8fb0",
    desc: "Épilation définitive à domicile",
    locked: true,
    subcats: [
      {
        id: "laser_consult", label: "Consultation obligatoire", noLock: true,
        note: "💜 La consultation est obligatoire avant tout traitement laser. Les 20 € seront déduits de votre première prestation si vous poursuivez votre parcours avec nous.",
        prestations: [
          { id:"lc1", nom:"Consultation", duree:30, prix:20, acompte:0 },
        ],
      },
      {
        id: "laser_forfaits", label: "Forfaits 8 séances combinés",
        prestations: [
          { id:"lf1", nom:"Aisselles + Maillot intégral", duree:55, prix:620, prixNormal:1240, acompte:0 },
          { id:"lf2", nom:"Aisselles + Maillot intégral + Demi-jambes", duree:95, prix:1180, prixNormal:2360, acompte:0 },
          { id:"lf3", nom:"Aisselles + Maillot intégral + Jambes entières", duree:115, prix:1660, prixNormal:3320, acompte:0 },
        ],
      },
      {
        id: "laser_forfaits_zone", label: "Forfaits 8 séances par zone",
        prestations: [
          { id:"lfz1", nom:"Aisselles", duree:15, prix:360, acompte:0 },
          { id:"lfz2", nom:"Maillot simple", duree:25, prix:560, acompte:0 },
          { id:"lfz3", nom:"Maillot échancré", duree:30, prix:720, acompte:0 },
          { id:"lfz4", nom:"Maillot intégral", duree:35, prix:880, acompte:0 },
          { id:"lfz5", nom:"Demi-jambes", duree:20, prix:1120, acompte:0 },
          { id:"lfz6", nom:"Jambes entières", duree:30, prix:2080, acompte:0 },
          { id:"lfz7", nom:"Bras", duree:25, prix:1280, acompte:0 },
          { id:"lfz8", nom:"Ligne ventrale", duree:10, prix:320, acompte:0 },
        ],
      },
      {
        id: "laser_seances", label: "Séances à l'unité (retouches)",
        note: "🔄 Séances à l'unité réservées aux retouches après un forfait.",
        prestations: [
          { id:"ls1", nom:"Aisselles", duree:15, prix:45, acompte:0 },
          { id:"ls2", nom:"Maillot simple", duree:25, prix:70, acompte:0 },
          { id:"ls3", nom:"Maillot échancré", duree:30, prix:90, acompte:0 },
          { id:"ls4", nom:"Maillot intégral", duree:35, prix:110, acompte:0 },
          { id:"ls5", nom:"Demi-jambes", duree:20, prix:140, acompte:0 },
          { id:"ls6", nom:"Jambes entières", duree:30, prix:260, acompte:0 },
          { id:"ls7", nom:"Bras", duree:25, prix:160, acompte:0 },
          { id:"ls8", nom:"Ligne ventrale", duree:10, prix:40, acompte:0 },
        ],
      },
    ],
  },
  {
    id: "spray", label: "Spray Tan", color: "#c49060",
    desc: "Bronzage naturel & durable",
    autoOpen: true,
    subcats: [
      {
        id: "spray_all", label: "Spray Tan",
        prestations: [
          { id:"sp1", nom:"Corps + visage", duree:40, prix:30, acompte:10 },
          { id:"sp2", nom:"Corps", duree:30, prix:25, acompte:10 },
          { id:"sp3", nom:"Visage", duree:15, prix:20, acompte:0 },
        ],
      },
    ],
  },
];

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_S = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const DAYS_L = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function parseD(s) { const [y,m,d]=s.split("-"); return new Date(+y,+m-1,+d); }
function fmtLong(s) { const d=parseD(s); return `${DAYS_L[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function firstDay(y,m) { const d=new Date(y,m,1).getDay(); return d===0?6:d-1; }
function daysIn(y,m) { return new Date(y,m+1,0).getDate(); }

const C = {
  bg:"#1a1620", surface:"#221e2a", surfaceAlt:"#1e1a26",
  border:"#2e2838", borderLight:"#281e30",
  text:"#ffffff", textMid:"#d4c4e8", textLight:"#a090b8",
  accent:"#c9a0c0", accentDark:"#c090b8", accentLight:"#2e1e30",
  locked:"#2a2040", lockedText:"#b8a8d8",
  warn:"#2a2010", warnText:"#d8b850", warnBorder:"#4a3820",
  tanGold:"#c49060", tanLight:"#2a1e10", tanBorder:"#4a3218",
};

const GS = () => (
  <>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Raleway:wght@300;400;500;600&display=swap" rel="stylesheet"/>
    <style>{`
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      body{background:${C.bg};font-family:'Raleway',sans-serif;color:${C.text};}
      input,textarea,select,button{font-family:'Raleway',sans-serif;}
      input:focus,textarea:focus{outline:none;}
      ::-webkit-scrollbar{width:0;}
      input::placeholder{color:${C.textLight};}
      @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      @keyframes slideUp{from{opacity:0;transform:translateY(100%);}to{opacity:1;transform:translateY(0);}}
      .fu{animation:fadeUp .35s cubic-bezier(.22,.68,0,1.1) both;}
      .fi{animation:fadeIn .2s ease both;}
      .su{animation:slideUp .32s cubic-bezier(.22,.68,0,1.1) both;}
    `}</style>
  </>
);

const Lbl = ({children}) => <div style={{fontSize:10,letterSpacing:2.5,textTransform:"uppercase",color:C.textLight,marginBottom:10,fontWeight:500}}>{children}</div>;
const Inp = (props) => <input {...props} style={{width:"100%",padding:"13px 16px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,transition:"border-color .15s",...props.style}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>;
const PBtn = ({children,onClick,disabled,style={}}) => <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"15px",borderRadius:12,border:"none",background:disabled?C.border:`linear-gradient(135deg,#c9a0c0,#7a4878)`,color:disabled?C.textLight:"#fff",fontSize:14,fontWeight:600,letterSpacing:.4,boxShadow:disabled?"none":"0 4px 18px rgba(196,168,130,.28)",transition:"all .2s",cursor:disabled?"default":"pointer",...style}}>{children}</button>;
const GBtn = ({children,onClick,style={}}) => <button onClick={onClick} style={{width:"100%",padding:"13px",borderRadius:12,border:`1.5px solid ${C.border}`,background:"transparent",color:C.textMid,fontSize:14,cursor:"pointer",...style}}>{children}</button>;
const Toast = ({msg,type="ok"}) => <div className="fi" style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:type==="err"?"#fff0f0":"#f0faf4",border:`1px solid ${type==="err"?"#f0c8c8":"#a8d8b8"}`,color:type==="err"?"#c05050":"#3a8050",padding:"12px 24px",borderRadius:12,fontSize:13,fontWeight:500,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,.08)"}}>{msg}</div>;

// ── MODAL CONSIGNES SPRAY TAN ─────────────────────────────────────────────────
function SprayTanModal({ onConfirm }) {
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = (e) => { const el=e.target; if(el.scrollTop+el.clientHeight>=el.scrollHeight*0.8) setScrolled(true); };
  const Sec = ({title,emoji,color,children}) => (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${C.tanBorder}`}}>
        <span style={{fontSize:17}}>{emoji}</span>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color,letterSpacing:.5}}>{title}</span>
      </div>
      {children}
    </div>
  );
  const It = ({text,ok=true}) => (
    <div style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:7}}>
      <span style={{fontSize:13,flexShrink:0,marginTop:1,color:ok?"#a0c090":"#e05050"}}>{ok?"✓":"✗"}</span>
      <span style={{fontSize:13,color:C.textMid,lineHeight:1.55}}>{text}</span>
    </div>
  );
  return (
    <div className="fi" style={{position:"fixed",inset:0,zIndex:600,background:"rgba(20,14,28,.88)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div className="fu" style={{width:"100%",maxWidth:480,background:C.surface,border:`1.5px solid ${C.tanGold}`,borderRadius:20,display:"flex",flexDirection:"column",maxHeight:"88vh",boxShadow:"0 8px 40px rgba(196,144,96,.18)"}}>
        <div style={{padding:"20px 22px 14px",borderBottom:`1px solid ${C.tanBorder}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:20}}>🌟</span>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,color:C.text,letterSpacing:.5}}>Conseils Spray Tan</div>
          </div>
          <div style={{fontSize:12,color:C.textLight,lineHeight:1.5}}>Merci de lire attentivement avant de réserver — lecture obligatoire.</div>
        </div>
        <div onScroll={handleScroll} style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
          <Sec title="24h avant la séance" emoji="📅" color={C.tanGold}>
            <It text="Faire un gommage sur tout le corps — marc de café ou gant exfoliant. Élimine les peaux mortes et traces de crème."/>
            <It text="Faire son épilation 24h avant la séance."/>
          </Sec>
          <Sec title="Le jour J" emoji="🚿" color={C.tanGold}>
            <It text="Douche obligatoire 2h max avant le RDV — eau uniquement ou gel douche pH neutre."/>
            <It text="Tenue : sous-vêtements ou maillot sombre. Après la séance : vêtements amples et foncés — évitez jeans et leggings."/>
            <It text="Peau propre : pas de maquillage, crème, déodorant, parfum ni bijoux." ok={false}/>
          </Sec>
          <Sec title="Pendant le temps de pose" emoji="⏱️" color="#e09050">
            <div style={{background:C.tanLight,border:`1px solid ${C.tanBorder}`,borderRadius:9,padding:"9px 12px",marginBottom:10,fontSize:12,color:C.tanGold,fontWeight:600}}>⚠️ Ne pas se mouiller pendant le temps de pose !</div>
            <It text="Pas d'eau — ne pas se laver les mains." ok={false}/>
            <It text="Pas de gel hydroalcoolique." ok={false}/>
            <It text="Ne pas boire à la bouteille — utiliser une paille." ok={false}/>
            <It text="Pas de sport." ok={false}/>
            <It text="Se protéger de la pluie — prévoir un parapluie si besoin." ok={false}/>
          </Sec>
          <Sec title="Après le temps de pose" emoji="✨" color="#a0c090">
            <It text="Première douche sans savon — rinçage à l'eau uniquement."/>
            <It text="Le lendemain : douche habituelle normale."/>
            <It text="Hydrater votre peau matin & soir — plus vous hydratez, plus votre bronzage tient."/>
            <It text="Pour retirer le tan : faire un gommage."/>
            <It text="Pas de crème grasse, pas de monoï, pas de gommage." ok={false}/>
            <It text="Épilation : attendre minimum 3 jours après la séance." ok={false}/>
          </Sec>
          <Sec title="Contre-indications" emoji="🚫" color="#e05050">
            <It text="Peaux avec lésions ouvertes ou infections cutanées" ok={false}/>
            <It text="Allergie aux ingrédients autobronzants (DHA)" ok={false}/>
            <It text="Asthme ou troubles respiratoires — à signaler impérativement pour éviter l'inhalation" ok={false}/>
            <It text="L'épilation laser n'est pas conseillée avec le spray tan" ok={false}/>
          </Sec>
          <div style={{height:6}}/>
        </div>
        <div style={{padding:"14px 22px 18px",borderTop:`1px solid ${C.tanBorder}`,flexShrink:0}}>
          {!scrolled&&<div style={{textAlign:"center",fontSize:12,color:C.textLight,marginBottom:9}}>↓ Faites défiler jusqu'en bas pour continuer</div>}
          <button onClick={scrolled?onConfirm:undefined} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:scrolled?`linear-gradient(135deg,#c9a0c0,#7a4878)`:C.border,color:scrolled?"#fff":C.textLight,fontSize:14,fontWeight:600,letterSpacing:.4,cursor:scrolled?"pointer":"default",transition:"all .3s",boxShadow:scrolled?"0 4px 18px rgba(196,168,130,.28)":"none"}}>
            {scrolled?"✓ J'ai lu et je continue":"Lisez les conseils ci-dessus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PAGE CONSEILS SPRAY TAN (compte client) ───────────────────────────────────
function SprayTanConseilsPage({ onClose }) {
  const Sec = ({title,emoji,color,children}) => (
    <div style={{marginBottom:22}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11,paddingBottom:8,borderBottom:`1px solid ${C.tanBorder}`}}>
        <span style={{fontSize:18}}>{emoji}</span>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color,letterSpacing:.5}}>{title}</span>
      </div>
      {children}
    </div>
  );
  const It = ({text,ok=true}) => (
    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
      <span style={{fontSize:13,flexShrink:0,marginTop:2,color:ok?"#a0c090":"#e05050"}}>{ok?"✓":"✗"}</span>
      <span style={{fontSize:13,color:C.textMid,lineHeight:1.6}}>{text}</span>
    </div>
  );
  return (
    <div className="fu">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:C.text}}>Conseils Spray Tan 🌟</div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMid,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>← Retour</button>
      </div>
      <div style={{background:C.tanLight,border:`1.5px solid ${C.tanGold}`,borderRadius:13,padding:"13px 17px",marginBottom:22}}>
        <div style={{fontSize:13,color:C.tanGold,fontWeight:600,marginBottom:3}}>🌟 Pour un bronzage parfait et durable</div>
        <div style={{fontSize:12,color:C.textMid,lineHeight:1.6}}>Retrouvez ici tous vos conseils avant et après séance, à consulter à tout moment.</div>
      </div>
      <Sec title="24h avant la séance" emoji="📅" color={C.tanGold}>
        <It text="Faire un gommage sur tout le corps — marc de café ou gant exfoliant. Élimine les peaux mortes et traces de crème."/>
        <It text="Faire son épilation 24h avant la séance."/>
      </Sec>
      <Sec title="Le jour J" emoji="🚿" color={C.tanGold}>
        <It text="Douche obligatoire 2h max avant le RDV — eau uniquement ou gel douche pH neutre."/>
        <It text="Tenue : sous-vêtements ou maillot sombre. Après la séance : vêtements amples et foncés — évitez jeans et leggings."/>
        <It text="Peau propre : pas de maquillage, crème, déodorant, parfum ni bijoux." ok={false}/>
      </Sec>
      <Sec title="Pendant le temps de pose" emoji="⏱️" color="#e09050">
        <div style={{background:C.tanLight,border:`1px solid ${C.tanBorder}`,borderRadius:9,padding:"9px 12px",marginBottom:10,fontSize:12,color:C.tanGold,fontWeight:600}}>⚠️ Ne pas se mouiller pendant le temps de pose !</div>
        <It text="Pas d'eau — ne pas se laver les mains." ok={false}/>
        <It text="Pas de gel hydroalcoolique." ok={false}/>
        <It text="Ne pas boire à la bouteille — utiliser une paille." ok={false}/>
        <It text="Pas de sport." ok={false}/>
        <It text="Se protéger de la pluie — prévoir un parapluie si besoin." ok={false}/>
      </Sec>
      <Sec title="Après le temps de pose" emoji="✨" color="#a0c090">
        <It text="Première douche sans savon — rinçage à l'eau uniquement."/>
        <It text="Le lendemain : douche habituelle normale."/>
        <It text="Hydrater votre peau matin & soir — plus vous hydratez, plus votre bronzage tient."/>
        <It text="Pour retirer le tan : faire un gommage."/>
        <It text="Pas de crème grasse, pas de monoï, pas de gommage." ok={false}/>
        <It text="Épilation : attendre minimum 3 jours après la séance." ok={false}/>
      </Sec>
      <Sec title="Contre-indications" emoji="🚫" color="#e05050">
        <It text="Peaux avec lésions ouvertes ou infections cutanées" ok={false}/>
        <It text="Allergie aux ingrédients autobronzants (DHA)" ok={false}/>
        <It text="Asthme ou troubles respiratoires — à signaler impérativement" ok={false}/>
        <It text="L'épilation laser n'est pas conseillée avec le spray tan" ok={false}/>
      </Sec>
    </div>
  );
}

function Calendar({selected,onSelect,bookedDates=[],unavailableDates=[],firstAvailable=null,allowPast=false}) {
  const t=new Date();
  const [yr,setYr]=useState(()=>{if(firstAvailable){const [y]=firstAvailable.split("-");return +y;}return t.getFullYear();});
  const [mo,setMo]=useState(()=>{if(firstAvailable){const [,m]=firstAvailable.split("-");return +m-1;}return t.getMonth();});
  const todayS=todayStr();
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <button onClick={()=>mo===0?(setMo(11),setYr(yr-1)):setMo(mo-1)} style={{background:"none",border:"none",color:C.textLight,fontSize:20,padding:"4px 10px",cursor:"pointer"}}>‹</button>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:C.text,letterSpacing:.5}}>{MONTHS[mo]} {yr}</span>
        <button onClick={()=>mo===11?(setMo(0),setYr(yr+1)):setMo(mo+1)} style={{background:"none",border:"none",color:C.textLight,fontSize:20,padding:"4px 10px",cursor:"pointer"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:8}}>
        {DAYS_S.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.textLight,fontWeight:500,letterSpacing:.8,textTransform:"uppercase",paddingBottom:8}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px 0"}}>
        {Array(firstDay(yr,mo)).fill(null).map((_,i)=><div key={`e${i}`}/>)}
        {Array(daysIn(yr,mo)).fill(null).map((_,i)=>{
          const d=i+1;
          const s=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const isPast=s<todayS;const isUnavail=unavailableDates.includes(s);const isSel=s===selected;
          const isFirst=s===firstAvailable&&!isSel;const isDisabled=allowPast?isUnavail:(isPast||isUnavail);
          const isBooked=bookedDates.includes(s);const isTodayDate=s===todayS;
          return (
            <div key={d} onClick={()=>!isDisabled&&onSelect(s)} style={{textAlign:"center",padding:"9px 2px",borderRadius:8,position:"relative",cursor:isDisabled?"default":"pointer",background:isSel?C.accent:isFirst?"#3a2848":"transparent",color:isSel?"#fff":isDisabled?C.borderLight:isPast?C.textLight:isFirst?C.accent:C.text,fontWeight:isSel?600:isFirst||isTodayDate?600:400,fontSize:13,transition:"all .15s",opacity:isUnavail?.35:isPast&&allowPast?.6:1,border:isTodayDate&&!isSel?`1px solid ${C.accent}`:"none"}}>
              {d}
              {isFirst&&!isSel&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",fontSize:6,color:C.accent}}>●</div>}
              {isBooked&&!isFirst&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:isSel?"#fff":"#e09050"}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResetPasswordView({accessToken,onDone}) {
  const [pw1,setPw1]=useState("");const [pw2,setPw2]=useState("");const [loading,setLoading]=useState(false);const [err,setErr]=useState("");const [success,setSuccess]=useState(false);
  const submit=async()=>{setErr("");if(pw1.length<6){setErr("Le mot de passe doit faire au moins 6 caractères.");return;}if(pw1!==pw2){setErr("Les mots de passe ne correspondent pas.");return;}setLoading(true);const res=await updateClientPassword(accessToken,pw1);setLoading(false);if(res.ok){setSuccess(true);setTimeout(()=>onDone(),2000);}else setErr(res.error);};
  if(success) return (<div className="fu" style={{textAlign:"center",padding:"60px 20px"}}><div style={{width:56,height:56,borderRadius:"50%",background:C.accentLight,border:`1.5px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",color:C.accentDark,fontSize:22}}>✓</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,marginBottom:10}}>Mot de passe modifié</div><div style={{fontSize:14,color:C.textMid}}>Vous pouvez maintenant vous connecter.</div></div>);
  return (
    <div className="fu" style={{maxWidth:400,margin:"0 auto",padding:"60px 20px"}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,marginBottom:8}}>Nouveau mot de passe</div>
      <div style={{fontSize:13,color:C.textMid,marginBottom:24}}>Choisissez un nouveau mot de passe pour votre compte.</div>
      <div style={{marginBottom:12}}><Lbl>Nouveau mot de passe</Lbl><Inp value={pw1} onChange={e=>setPw1(e.target.value)} type="password" placeholder="••••••••" autoComplete="new-password"/></div>
      <div style={{marginBottom:14}}><Lbl>Confirmer le mot de passe</Lbl><Inp value={pw2} onChange={e=>setPw2(e.target.value)} type="password" placeholder="••••••••" autoComplete="new-password"/></div>
      {err&&<div style={{fontSize:13,color:"#c05050",marginBottom:14,padding:"10px 14px",background:"#fff0f0",borderRadius:8}}>{err}</div>}
      <PBtn onClick={submit} disabled={loading}>{loading?"Mise à jour…":"Valider"}</PBtn>
    </div>
  );
}

function AuthModal({onAuth,onClose,booking}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState(()=>localStorage.getItem("nlb_email")||""),[pw,setPw]=useState("");
  const [prenom,setPrenom]=useState(""),[nom,setNom]=useState(""),[tel,setTel]=useState("");
  const [loading,setLoading]=useState(false),[err,setErr]=useState("");
  const [resetMsg,setResetMsg]=useState(""),[resetLoading,setResetLoading]=useState(false);
  const submit=async()=>{
    setErr("");setLoading(true);
    try {
      if(mode==="login"){
        const res=await api.signIn(email,pw);
        if(res.error){setErr("Email ou mot de passe incorrect.");setLoading(false);return;}
        const prof=await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${res.user.id}&select=*`,{headers:{"apikey":SUPA_PUB,"Authorization":`Bearer ${res.access_token}`}}).then(r=>r.json());
        localStorage.setItem("nlb_email",email);
        onAuth({user:res.user,token:res.access_token,refresh_token:res.refresh_token,expires_at:res.expires_at,profile:prof[0]||{}});
      } else {
        if(!prenom||!nom||!tel){setErr("Tous les champs sont requis.");setLoading(false);return;}
        const res=await api.signUp(email,pw);
        if(res.error){setErr(res.error.message);setLoading(false);return;}
        if(res.user){
          await api.upsert("profiles",{id:res.user.id,prenom,nom,tel,email},res.access_token);
          onAuth({user:res.user,token:res.access_token,refresh_token:res.refresh_token,expires_at:res.expires_at,profile:{prenom,nom,tel,email}});
        } else setErr(res.msg||res.message||res.error_description||"Mot de passe trop court (6 caractères minimum).");
      }
    } catch{setErr("Erreur réseau.");}
    setLoading(false);
  };
  return (
    <div className="fi" style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-end",background:"rgba(38,25,14,.42)",backdropFilter:"blur(6px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="su" style={{width:"100%",maxHeight:"92vh",overflowY:"auto",background:C.surface,borderRadius:"24px 24px 0 0",padding:"28px 24px 52px",boxShadow:"0 -8px 40px rgba(0,0,0,.1)"}}>
        <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 28px"}}/>
        {booking&&(<div style={{background:C.accentLight,borderRadius:14,padding:"14px 18px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:14,fontWeight:600,color:C.accentDark}}>{booking.nom}</div><div style={{fontSize:12,color:C.textMid,marginTop:2}}>{fmtLong(booking.date)} · {booking.slot}</div></div><div style={{fontSize:16,fontWeight:700,color:C.accentDark}}>{booking.prix>0?`${booking.prix} €`:"Gratuit"}</div></div>)}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,marginBottom:4}}>{mode==="login"?"Connexion":"Créer un compte"}</div>
        <div style={{fontSize:13,color:C.textMid,marginBottom:22}}>{mode==="login"?"Vos infos seront pré-remplies automatiquement.":"Un compte pour gérer vos rendez-vous."}</div>
        <div style={{display:"flex",background:C.surfaceAlt,borderRadius:10,padding:4,marginBottom:20}}>
          {[["login","Se connecter"],["signup","Créer un compte"]].map(([id,label])=>(<button key={id} onClick={()=>{setMode(id);setErr("");}} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:mode===id?C.surface:"transparent",color:mode===id?C.text:C.textMid,fontSize:13,fontWeight:mode===id?600:400,boxShadow:mode===id?"0 1px 6px rgba(0,0,0,.07)":"none",transition:"all .2s",cursor:"pointer"}}>{label}</button>))}
        </div>
        {mode==="signup"&&(<div className="fu"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:0}}><div style={{marginBottom:12}}><Lbl>Prénom</Lbl><Inp value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Marie"/></div><div style={{marginBottom:12}}><Lbl>Nom</Lbl><Inp value={nom} onChange={e=>setNom(e.target.value)} placeholder="Dupont"/></div></div><div style={{marginBottom:12}}><Lbl>Téléphone</Lbl><Inp value={tel} onChange={e=>setTel(e.target.value)} placeholder="06 00 00 00 00" type="tel"/></div></div>)}
        <div style={{marginBottom:12}}><Lbl>Email</Lbl><Inp value={email} onChange={e=>setEmail(e.target.value)} placeholder="marie@email.fr" type="email"/></div>
        <div style={{marginBottom:12}}><Lbl>Mot de passe</Lbl><Inp value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" type="password"/></div>
        {mode==="login"&&(<div style={{marginBottom:14,marginTop:-8,textAlign:"right"}}><button type="button" onClick={async()=>{if(!email){setResetMsg("Saisis ton email d'abord.");return;}setResetLoading(true);setResetMsg("");const r=await resetClientPassword(email);setResetLoading(false);if(r.ok){setResetMsg("✓ Email envoyé ! Vérifie ta boîte (et les spams).");}else{setResetMsg("Erreur : "+r.error);}}} style={{background:"none",border:"none",color:C.accentDark,fontSize:13,cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"inherit"}}>{resetLoading?"Envoi…":"Mot de passe oublié ?"}</button></div>)}
        {resetMsg&&<div style={{fontSize:13,color:resetMsg.startsWith("✓")?"#2d7a4f":"#c05050",marginBottom:14,padding:"10px 14px",background:resetMsg.startsWith("✓")?"#e8f5ee":"#fff0f0",borderRadius:8}}>{resetMsg}</div>}
        {err&&<div style={{fontSize:13,color:"#c05050",marginBottom:14,padding:"10px 14px",background:"#fff0f0",borderRadius:8}}>{err}</div>}
        <PBtn onClick={submit} disabled={loading}>{loading?"Chargement…":mode==="login"?booking?"Confirmer ma réservation":"Se connecter":booking?"Créer mon compte et réserver":"Créer un compte"}</PBtn>
        <div style={{textAlign:"center",fontSize:11,color:C.textLight,marginTop:14,lineHeight:1.6}}>Vos données sont utilisées uniquement pour la gestion de vos rendez-vous.</div>
      </div>
    </div>
  );
}

function PlanityDatePicker({selPresta,allRdvs,allSupaBlocked,selectedDate,selectedSlot,onSelect}) {
  const ALL_SLOTS=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const SEMAINE=["17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const WEEKEND=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const DAYS_S_L=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const MONTHS_F=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS_L_L=["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const today=new Date();const minDate=new Date(today.getTime()+24*60*60*1000);const minDateStr=minDate.toISOString().split("T")[0];
  const [yr,setYr]=useState(today.getFullYear());const [mo,setMo]=useState(today.getMonth());
  const getAvailSlots=(dateStr)=>{
    const dow=parseD(dateStr).getDay();const isWE=dow===0||dow===6;const allowed=isWE?WEEKEND:SEMAINE;
    const dur=selPresta?.duree||30;const slotsNeeded=Math.ceil(dur/30);
    const rdvsDay=allRdvs.filter(r=>r.date===dateStr&&r.statut!=="annulé");const supaDay=allSupaBlocked[dateStr]||[];const avail=[];
    for(let j=0;j<=allowed.length-slotsNeeded;j++){
      let ok=true;
      for(let k=0;k<slotsNeeded;k++){
        const sl=allowed[j+k];if(!sl){ok=false;break;}if(supaDay.includes(sl)){ok=false;break;}
        const slotDateTime=new Date(`${dateStr}T${sl}:00`);if(slotDateTime.getTime()-Date.now()<24*60*60*1000){ok=false;break;}
        const idx=ALL_SLOTS.indexOf(sl);
        for(const r of rdvsDay){const rIdx=ALL_SLOTS.indexOf(r.slot);const rEnd=rIdx+Math.ceil((r.duree||30)/30);if(idx>=rIdx&&idx<rEnd){ok=false;break;}}
        if(!ok)break;
      }
      if(ok)avail.push(allowed[j]);
    }
    return avail;
  };
  useEffect(()=>{
    if(selectedDate)return;
    const d=new Date(minDate);
    for(let i=0;i<49;i++){const s=new Date(d.getTime()+i*86400000).toISOString().split("T")[0];if(getAvailSlots(s).length>0){const[y,m]=s.split("-");setYr(+y);setMo(+m-1);onSelect(s,null);break;}}
  },[selPresta]);
  const firstDayOfMonth=(new Date(yr,mo,1).getDay()||7)-1;const daysInMonth=new Date(yr,mo+1,0).getDate();const selectedSlots=selectedDate?getAvailSlots(selectedDate):[];
  return (
    <div>
      <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"20px 18px",marginBottom:16}}>
        {(()=>{
          const maxDate=new Date(today.getTime()+49*24*60*60*1000);const maxYr=maxDate.getFullYear();const maxMo=maxDate.getMonth();
          const nextDisabled=(yr>maxYr)||(yr===maxYr&&mo>=maxMo);const prevDisabled=(yr<today.getFullYear())||(yr===today.getFullYear()&&mo<=today.getMonth());
          return (<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <button onClick={()=>{if(prevDisabled)return;mo===0?(setMo(11),setYr(yr-1)):setMo(mo-1);}} disabled={prevDisabled} style={{background:"none",border:"none",color:prevDisabled?C.borderLight:C.textLight,fontSize:22,cursor:prevDisabled?"default":"pointer",padding:"0 8px",opacity:prevDisabled?.3:1}}>‹</button>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:C.text,letterSpacing:.5}}>{MONTHS_F[mo]} {yr}</span>
            <button onClick={()=>{if(nextDisabled)return;mo===11?(setMo(0),setYr(yr+1)):setMo(mo+1);}} disabled={nextDisabled} style={{background:"none",border:"none",color:nextDisabled?C.borderLight:C.textLight,fontSize:22,cursor:nextDisabled?"default":"pointer",padding:"0 8px",opacity:nextDisabled?.3:1}}>›</button>
          </div>);
        })()}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:8}}>
          {DAYS_S_L.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.textLight,fontWeight:500,letterSpacing:.8,textTransform:"uppercase",paddingBottom:8}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px 0"}}>
          {Array(firstDayOfMonth).fill(null).map((_,i)=><div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const d=i+1;const ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const isPast=ds<minDateStr;const avail=!isPast?getAvailSlots(ds):[];const hasDispo=avail.length>0;const isSel=ds===selectedDate;
            return (<div key={d} onClick={()=>hasDispo&&!isPast&&onSelect(ds,null)} style={{textAlign:"center",padding:"8px 2px",borderRadius:8,position:"relative",cursor:hasDispo&&!isPast?"pointer":"default",background:isSel?C.accent:"transparent",color:isSel?"#fff":isPast||!hasDispo?"#3a3040":C.text,fontWeight:isSel?700:400,fontSize:13,transition:"all .15s"}}>
              {d}{hasDispo&&!isSel&&<div style={{width:4,height:4,borderRadius:"50%",background:C.accent,position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)"}}/>}
            </div>);
          })}
        </div>
      </div>
      {selectedDate&&selectedSlots.length>0&&(<div className="fu"><div style={{fontSize:12,color:C.textMid,marginBottom:12}}>{DAYS_L_L[parseD(selectedDate).getDay()]} {parseD(selectedDate).getDate()} {MONTHS_F[parseD(selectedDate).getMonth()]}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>{selectedSlots.map(s=>{const active=selectedSlot===s;return(<div key={s} onClick={()=>onSelect(selectedDate,s)} style={{padding:"12px 4px",textAlign:"center",borderRadius:10,border:`1.5px solid ${active?C.accent:C.border}`,background:active?C.accent:C.surface,color:active?"#fff":C.textMid,fontSize:13,fontWeight:active?700:400,cursor:"pointer",transition:"all .15s"}}>{s}</div>);})}</div></div>)}
      {selectedDate&&selectedSlots.length===0&&<div style={{textAlign:"center",padding:"16px",fontSize:13,color:C.textLight}}>Aucun créneau disponible ce jour.</div>}
    </div>
  );
}

function AdresseBlock(){
  const adresse="9 rue André Saves, 31300 Toulouse";const adresseEncoded=encodeURIComponent(adresse);
  const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${adresseEncoded}`;const wazeUrl=`https://waze.com/ul?q=${adresseEncoded}&navigate=yes`;
  const instaUrl="https://ig.me/m/neylika31";const smsUrl="sms:+33680894349";
  const btnN={display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.textMid,textDecoration:"none",fontWeight:500};
  const btnA={...btnN,background:C.accentLight,border:`1px solid ${C.accentDark}`,color:C.accent};
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",marginTop:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{fontSize:18,color:C.accent}}>📍</span><div style={{fontWeight:500,fontSize:14,color:C.text}}>Adresse du rendez-vous</div></div>
      <div style={{fontSize:16,marginBottom:4,color:C.text,fontWeight:500}}>9 rue André Saves</div>
      <div style={{fontSize:14,marginBottom:16,color:C.textLight}}>31300 Toulouse</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={btnN}>🗺️ Maps</a>
        <a href={wazeUrl} target="_blank" rel="noopener noreferrer" style={btnN}>🧭 Waze</a>
      </div>
      <div style={{borderTop:`1px solid ${C.borderLight}`,paddingTop:14}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:12}}><span style={{fontSize:16,color:C.accent,marginTop:2}}>🔔</span><div style={{fontSize:13,color:C.textMid,lineHeight:1.5}}>Préviens-moi quand tu arrives 💜</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <a href={instaUrl} target="_blank" rel="noopener noreferrer" style={btnA}>📷 Instagram</a>
          <a href={smsUrl} style={btnN}>💬 SMS</a>
        </div>
      </div>
    </div>
  );
}

function ReservationView({session,allRdvs,onBooked,laserUnlocked,onAuth}) {
  const [svcId,setSvcId]=useState(null);const [openSub,setOpenSub]=useState(null);const [selPresta,setSelPresta]=useState(null);
  const [date,setDate]=useState("");const [slot,setSlot]=useState("");const [showAuth,setShowAuth]=useState(false);const [done,setDone]=useState(null);
  const [showSprayModal,setShowSprayModal]=useState(false);
  const svc=svcId?SERVICES.find(s=>s.id===svcId):null;
  const ALL_SLOTS_RES=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const SEMAINE_RES=["17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const WEEKEND_RES=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const [supaBlocked,setSupaBlocked]=useState([]);const [allSupaBlocked,setAllSupaBlocked]=useState({});
  useEffect(()=>{if(!selPresta)return;api.get("blocked_slots","select=date,slot").then(d=>{if(!Array.isArray(d))return;const map={};d.forEach(r=>{if(!map[r.date])map[r.date]=[];map[r.date].push(r.slot);});setAllSupaBlocked(map);});},[selPresta]);
  useEffect(()=>{if(!date)return;api.get("blocked_slots",`date=eq.${date}&select=slot`).then(d=>{if(Array.isArray(d))setSupaBlocked(d.map(r=>r.slot));});},[date]);
  const isDayAvailable=(dateStr)=>{
    if(!selPresta)return true;const dow=parseD(dateStr).getDay();const isWE=dow===0||dow===6;const allowed=isWE?WEEKEND_RES:SEMAINE_RES;
    const dur=selPresta.duree||30;const slotsNeeded=Math.ceil(dur/30);const rdvsDay=allRdvs.filter(r=>r.date===dateStr&&r.statut!=="annulé");const supaDay=allSupaBlocked[dateStr]||[];
    for(let i=0;i<=allowed.length-slotsNeeded;i++){let ok=true;for(let j=0;j<slotsNeeded;j++){const s=allowed[i+j];if(supaDay.includes(s)){ok=false;break;}const idx=ALL_SLOTS_RES.indexOf(s);for(const r of rdvsDay){const rIdx=ALL_SLOTS_RES.indexOf(r.slot);const rEnd=rIdx+Math.ceil((r.duree||30)/30);if(idx>=rIdx&&idx<rEnd){ok=false;break;}}if(!ok)break;}if(ok)return true;}
    return false;
  };
  const {unavailableDates,firstAvailable}=(()=>{
    if(!selPresta)return{unavailableDates:[],firstAvailable:null};
    const unavail=[];let first=null;const today=new Date();
    for(let i=0;i<49;i++){const d=new Date(today);d.setDate(today.getDate()+i);const s=d.toISOString().split("T")[0];if(isDayAvailable(s)){if(!first)first=s;}else{unavail.push(s);}}
    return{unavailableDates:unavail,firstAvailable:first};
  })();
  useEffect(()=>{if(firstAvailable&&!date)setDate(firstAvailable);},[firstAvailable]);
  const takenSlots=(()=>{const blocked=new Set();if(date){const dow=parseD(date).getDay();const isWE=dow===0||dow===6;const allowed=isWE?WEEKEND_RES:SEMAINE_RES;ALL_SLOTS_RES.forEach(s=>{if(!allowed.includes(s))blocked.add(s);});}supaBlocked.forEach(s=>blocked.add(s));allRdvs.filter(r=>r.date===date&&r.statut!=="annulé").forEach(r=>{const idx=ALL_SLOTS_RES.indexOf(r.slot);if(idx===-1)return;let mins=0;for(let i=idx;i<ALL_SLOTS_RES.length&&mins<(r.duree||30);i++){blocked.add(ALL_SLOTS_RES[i]);mins+=30;}});return blocked;})();
  const r2=useRef(null),r3=useRef(null),r5=useRef(null),doneRef=useRef(null);
  const sc=(ref,d=100)=>setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth",block:"start"}),d);
  const isLocked=(s)=>s.locked&&!laserUnlocked;
  const [confirming,setConfirming]=useState(false);const [confirmError,setConfirmError]=useState("");
  const handleConfirm=async(sess)=>{
    setShowAuth(false);if(!selPresta||!date||!slot)return;if(confirming)return;setConfirming(true);setConfirmError("");
    try{
      const liveRdvs=await api.get("rdvs",`date=eq.${date}&statut=neq.annulé&select=slot,duree`);
      if(Array.isArray(liveRdvs)){const ALL=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];const wantedIdx=ALL.indexOf(slot);const wantedSlotsNeeded=Math.ceil((selPresta.duree||30)/30);for(const r of liveRdvs){const rIdx=ALL.indexOf(r.slot);if(rIdx===-1)continue;const rEnd=rIdx+Math.ceil((r.duree||30)/30);const wantedEnd=wantedIdx+wantedSlotsNeeded;if(wantedIdx<rEnd&&wantedEnd>rIdx){setConfirmError("Désolée, ce créneau vient d'être réservé par quelqu'un d'autre. Choisissez-en un autre.");setSlot("");setConfirming(false);return;}}}
      const rdv={user_id:sess.user.id,cat_id:svcId,service:svc.label,prestation:selPresta.nom,duree:selPresta.duree,prix:selPresta.prix||0,acompte:selPresta.acompte,date,slot,client_prenom:sess.profile.prenom,client_nom:sess.profile.nom,client_tel:sess.profile.tel,client_email:sess.user.email,statut:"confirmé"};
      const res=await api.post("rdvs",rdv,sess.token);
      if(res&&res.code){setConfirmError(res.code==="23505"?"Vous avez déjà un rendez-vous à cet horaire. Choisissez un autre créneau.":"Erreur : "+(res.message||"impossible de créer le rendez-vous."));setConfirming(false);return;}
      const saved=Array.isArray(res)?res[0]:res;
      if(!saved||!saved.id){setConfirmError("Erreur : le rendez-vous n'a pas pu être enregistré. Réessayez ou contactez-nous.");setConfirming(false);return;}
      await Promise.all([sendEmails(saved,sess.user.email),sendPush(`${saved.client_prenom} ${saved.client_nom}`,`${saved.prestation} · ${fmtLong(saved.date)} à ${saved.slot}`)]);
      const promoFid=checkFidelitePromo(allRdvs,saved);if(promoFid)await sendPush(`🎁 FIDÉLITÉ — ${saved.client_prenom} ${saved.client_nom}`,promoFid.msg);
      setDone(saved);onBooked(saved);sc(doneRef);
    }catch(e){console.log("Erreur réservation:",e);setConfirmError("Erreur réseau. Vérifiez votre connexion et réessayez.");}
    setConfirming(false);
  };
  const selectPresta=(p)=>{if(selPresta?.id===p.id){setSelPresta(null);setDate("");setSlot("");return;}setSelPresta(p);setDate("");setSlot("");sc(r3);};
  if(done) return (
    <div ref={doneRef} className="fu" style={{textAlign:"center",padding:"52px 0"}}>
      <div style={{width:56,height:56,borderRadius:"50%",background:C.accentLight,border:`1.5px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",color:C.accentDark,fontSize:22}}>✓</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:C.text,marginBottom:10}}>Rendez-vous confirmé</div>
      <div style={{fontSize:14,color:C.textMid,lineHeight:2,marginBottom:8}}>{done.prestation}<br/>{fmtLong(done.date)} à {done.slot}</div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:36,lineHeight:1.7}}>Un SMS de rappel vous sera envoyé 24h avant.</div>
      <AdresseBlock/>
      <GBtn onClick={()=>{setDone(null);setSvcId(null);setOpenSub(null);setSelPresta(null);setDate("");setSlot("");setShowSprayModal(false);}}>Nouvelle réservation</GBtn>
    </div>
  );
  return (
    <div>
      {showSprayModal&&<SprayTanModal onConfirm={()=>{setShowSprayModal(false);sc(r2);}}/>}
      {showAuth&&<AuthModal onAuth={(s)=>{if(onAuth)onAuth(s);handleConfirm(s);}} onClose={()=>setShowAuth(false)} booking={selPresta?{nom:selPresta.nom,date,slot,prix:selPresta.prix||0}:null}/>}
      <div>
        <Lbl>Choisissez un service</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {SERVICES.map(s=>{
            const active=svcId===s.id;const locked=isLocked(s);
            return (
              <div key={s.id} onClick={()=>{
                const newSvc=SERVICES.find(sv=>sv.id===s.id);
                if(svcId!==s.id){setSelPresta(null);setDate("");setSlot("");setShowSprayModal(false);if(newSvc?.autoOpen)setOpenSub(newSvc.subcats[0].id);else setOpenSub(null);}
                if(s.id==="spray"&&svcId!==s.id){setSvcId(s.id);setShowSprayModal(true);return;}
                setSvcId(s.id);sc(r2);
              }} style={{padding:"18px 20px",borderRadius:14,border:`1.5px solid ${active?s.color:C.border}`,background:active?s.color+"0f":C.surface,cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:active?"0 2px 14px rgba(0,0,0,.05)":"none"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:active?C.text:C.textMid,display:"flex",alignItems:"center",gap:8}}>{s.label}{locked&&!active&&<span style={{fontSize:10,background:C.locked,color:C.lockedText,padding:"2px 8px",borderRadius:10,fontWeight:500}}>Consultation dispo</span>}</div>
                  <div style={{fontSize:13,color:'#b8a8d0',marginTop:3}}>{s.desc}</div>
                </div>
                <div style={{width:8,height:8,borderRadius:"50%",background:active?s.color:C.border,flexShrink:0}}/>
              </div>
            );
          })}
        </div>
      </div>
      {svc&&(
        <div ref={r2} className="fu" style={{marginTop:36}}>
          <Lbl>Prestation</Lbl>
          {isLocked(svc)&&<div style={{marginBottom:14,padding:"12px 16px",background:C.locked+"44",border:`1px solid ${C.locked}`,borderRadius:12,fontSize:13,color:C.lockedText,lineHeight:1.6}}>🔒 Les séances sont accessibles après consultation. Réservez d'abord votre consultation.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {svc.subcats.filter(sub=>!isLocked(svc)||sub.noLock).map(sub=>{
              const isOpen=openSub===sub.id;
              return (
                <div key={sub.id} style={{borderRadius:14,border:`1.5px solid ${isOpen?C.accent:C.border}`,overflow:"hidden",background:C.surface,transition:"all .2s"}}>
                  <div onClick={()=>setOpenSub(isOpen?null:sub.id)} style={{padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",background:isOpen?C.accentLight:"transparent",transition:"background .2s"}}>
                    <span style={{fontSize:15,fontWeight:isOpen?600:500,color:isOpen?C.accentDark:C.text}}>{sub.label}</span>
                    <span style={{color:isOpen?C.accent:C.textLight,fontSize:18,transition:"transform .2s",display:"inline-block",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
                  </div>
                  {isOpen&&(
                    <div>
                      {sub.note&&<div style={{padding:"10px 18px",background:C.warn,borderBottom:`1px solid ${C.warnBorder}`,fontSize:12,color:C.warnText,lineHeight:1.6}}>{sub.note}</div>}
                      {sub.prestations.map((p,i)=>{
                        const active=selPresta?.id===p.id;
                        return (
                          <div key={p.id} onClick={()=>!p.devis&&selectPresta(p)} style={{padding:"14px 18px",borderTop:i>0?`1px solid ${C.borderLight}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center",background:active?C.accentLight:"transparent",cursor:p.devis?"default":"pointer",transition:"background .15s"}}>
                            <div>
                              <div style={{fontSize:14,fontWeight:active?600:400,color:active?C.accentDark:C.text}}>{p.nom}</div>
                              <div style={{fontSize:12,color:"#a090c0",marginTop:2}}>{p.duree} min</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              {p.devis?<span style={{fontSize:14,fontWeight:600,color:C.lockedText}}>Sur devis</span>:<>{p.prixNormal&&<div style={{fontSize:11,color:C.textLight,textDecoration:"line-through",marginBottom:1}}>{p.prixNormal} €</div>}<div style={{fontSize:15,fontWeight:700,color:p.prixNormal?"#e07070":active?C.accentDark:C.textMid}}>{p.prix} €</div>{p.prixNormal&&<div style={{fontSize:10,color:"#e07070",fontWeight:700,letterSpacing:.5}}>-50%</div>}</>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {selPresta&&(
        <div ref={r3} className="fu" style={{marginTop:36}}>
          <Lbl>Date &amp; horaire</Lbl>
          <PlanityDatePicker selPresta={selPresta} allRdvs={allRdvs} allSupaBlocked={allSupaBlocked} selectedDate={date} selectedSlot={slot} onSelect={(d,s)=>{setDate(d);if(s){setSlot(s);sc(r5);}else setSlot("");}}/>
        </div>
      )}
      {slot&&(
        <div ref={r5} className="fu" style={{marginTop:36}}>
          <Lbl>Récapitulatif</Lbl>
          <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"20px",marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,.03)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:14,borderBottom:`1px solid ${C.borderLight}`,marginBottom:14}}>
              <div><div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:4}}>{selPresta.nom}</div><div style={{fontSize:13,color:C.textMid}}>{svc?.label} · {selPresta.duree} min</div></div>
              <div style={{fontSize:18,fontWeight:700,color:C.accentDark}}>{selPresta.prix>0?`${selPresta.prix} €`:"Offert"}</div>
            </div>
            {[["Date",fmtLong(date)],["Heure",slot]].map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0"}}><span style={{color:C.textLight}}>{k}</span><span style={{color:C.textMid,fontWeight:500}}>{v}</span></div>))}
          </div>
          <div style={{background:C.accentLight,border:`1px solid ${C.accent}`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>💶</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.accentDark,marginBottom:2}}>Paiement uniquement en espèces</div><div style={{fontSize:11,color:C.textMid,lineHeight:1.5}}>Merci de prévoir l'appoint le jour du rendez-vous.</div></div>
          </div>
          <PBtn onClick={()=>session?handleConfirm(session):setShowAuth(true)} disabled={confirming}>{confirming?"Confirmation en cours…":session?"Confirmer le rendez-vous":"Continuer pour confirmer"}</PBtn>
          {confirmError&&<div style={{textAlign:"center",fontSize:13,color:"#f08080",marginTop:10,padding:"10px 14px",background:"#2a1010",border:"1px solid #5a2020",borderRadius:8}}>{confirmError}</div>}
          {!session&&<div style={{textAlign:"center",fontSize:12,color:C.textLight,marginTop:10}}>Connexion requise pour finaliser</div>}
        </div>
      )}
    </div>
  );
}

// ── MODIFY PICKER — défini hors de MesRdvsView pour respecter les règles React ──
function ModifyPicker({rdv, newDate, setNewDate, newSlot, setNewSlot, modifyDone, modifyError, modifying, handleModify, onClose, getAvailSlotsModify}) {
  const DAYS_S_M=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const MONTHS_M=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS_L_M=["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const today=new Date();const minDate=new Date(today.getTime()+24*60*60*1000);const minDateStr=minDate.toISOString().split("T")[0];
  const [yr,setYr]=useState(today.getFullYear());const [mo,setMo]=useState(today.getMonth());
  const firstDayOfMonth=(new Date(yr,mo,1).getDay()||7)-1;const daysInMonth=new Date(yr,mo+1,0).getDate();
  const maxDate=new Date(today.getTime()+49*24*60*60*1000);const maxYr=maxDate.getFullYear();const maxMo=maxDate.getMonth();
  const nextDisabled=(yr>maxYr)||(yr===maxYr&&mo>=maxMo);const prevDisabled=(yr<today.getFullYear())||(yr===today.getFullYear()&&mo<=today.getMonth());
  const availSlots=newDate?getAvailSlotsModify(newDate,rdv):[];
  if(modifyDone)return <div style={{textAlign:"center",padding:"20px 0",color:"#a0c090",fontSize:14,fontWeight:600}}>✓ Rendez-vous déplacé ! Un email de confirmation vous a été envoyé.</div>;
  return (
    <div style={{marginTop:12,padding:"14px",background:C.surfaceAlt,borderRadius:12,border:`1px solid ${C.border}`}}>
      <div style={{fontSize:11,color:C.textLight,marginBottom:12,letterSpacing:1,textTransform:"uppercase"}}>Choisir un nouveau créneau</div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 12px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>{if(prevDisabled)return;mo===0?(setMo(11),setYr(yr-1)):setMo(mo-1);}} disabled={prevDisabled} style={{background:"none",border:"none",color:prevDisabled?C.borderLight:C.textLight,fontSize:20,cursor:prevDisabled?"default":"pointer",padding:"0 6px",opacity:prevDisabled?.3:1}}>‹</button>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:C.text}}>{MONTHS_M[mo]} {yr}</span>
          <button onClick={()=>{if(nextDisabled)return;mo===11?(setMo(0),setYr(yr+1)):setMo(mo+1);}} disabled={nextDisabled} style={{background:"none",border:"none",color:nextDisabled?C.borderLight:C.textLight,fontSize:20,cursor:nextDisabled?"default":"pointer",padding:"0 6px",opacity:nextDisabled?.3:1}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
          {DAYS_S_M.map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:C.textLight,fontWeight:500,letterSpacing:.5,textTransform:"uppercase",paddingBottom:6}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px 0"}}>
          {Array(firstDayOfMonth).fill(null).map((_,i)=><div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const d=i+1;const ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const isPast=ds<minDateStr;const avail=!isPast?getAvailSlotsModify(ds,rdv):[];const hasDispo=avail.length>0;const isSel=ds===newDate;
            return(<div key={d} onClick={()=>{if(hasDispo&&!isPast){setNewDate(ds);setNewSlot("");}}} style={{textAlign:"center",padding:"7px 2px",borderRadius:6,cursor:hasDispo&&!isPast?"pointer":"default",background:isSel?C.accent:"transparent",color:isSel?"#fff":isPast||!hasDispo?"#3a3040":C.text,fontWeight:isSel?700:400,fontSize:12,position:"relative"}}>
              {d}{hasDispo&&!isSel&&<div style={{width:3,height:3,borderRadius:"50%",background:C.accent,position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)"}}/>}
            </div>);
          })}
        </div>
      </div>
      {newDate&&availSlots.length>0&&(
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:C.textMid,marginBottom:8}}>{DAYS_L_M[parseD(newDate).getDay()]} {parseD(newDate).getDate()} {MONTHS_M[parseD(newDate).getMonth()]}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {availSlots.map(s=>{const active=newSlot===s;return(<div key={s} onClick={()=>setNewSlot(s)} style={{padding:"10px 4px",textAlign:"center",borderRadius:8,border:`1.5px solid ${active?C.accent:C.border}`,background:active?C.accent:C.surface,color:active?"#fff":C.textMid,fontSize:12,fontWeight:active?700:400,cursor:"pointer"}}>{s}</div>);})}
          </div>
        </div>
      )}
      {newDate&&availSlots.length===0&&<div style={{fontSize:12,color:C.textLight,marginBottom:12,textAlign:"center"}}>Aucun créneau disponible ce jour.</div>}
      {modifyError&&<div style={{fontSize:12,color:"#f08080",marginBottom:10,padding:"8px 12px",background:"#2a1010",border:"1px solid #5a2020",borderRadius:8}}>{modifyError}</div>}
      <div style={{display:"flex",gap:8}}>
        <button onClick={onClose} style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:C.textMid,fontSize:12,cursor:"pointer"}}>Fermer</button>
        <button onClick={handleModify} disabled={!newDate||!newSlot||modifying} style={{flex:2,padding:"9px",borderRadius:8,border:"none",background:(!newDate||!newSlot||modifying)?C.border:`linear-gradient(135deg,#c9a0c0,#7a4878)`,color:(!newDate||!newSlot||modifying)?C.textLight:"#fff",fontSize:12,fontWeight:600,cursor:(!newDate||!newSlot||modifying)?"default":"pointer"}}>{modifying?"Déplacement…":"Confirmer le déplacement"}</button>
      </div>
    </div>
  );
}

function MesRdvsView({rdvs,loading,session,onRdvCancelled,onRdvModified,allRdvs}) {
  const up=rdvs.filter(r=>r.date>=todayStr()&&r.statut!=="annulé").sort((a,b)=>a.date.localeCompare(b.date));
  const past=rdvs.filter(r=>r.date<todayStr()||r.statut==="annulé").sort((a,b)=>b.date.localeCompare(a.date));
  const svcColor=(catId)=>SERVICES.find(s=>s.id===catId)?.color||C.accent;
  const [cancelling,setCancelling]=useState(false);
  const [cancelError,setCancelError]=useState("");
  // État pour le flow modification
  const [modifyingRdv,setModifyingRdv]=useState(null);
  const [newDate,setNewDate]=useState("");
  const [newSlot,setNewSlot]=useState("");
  const [modifying,setModifying]=useState(false);
  const [modifyError,setModifyError]=useState("");
  const [modifyDone,setModifyDone]=useState(false);
  const [allSupaBlocked,setAllSupaBlocked]=useState({});

  const ALL_SLOTS=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const SEMAINE_M=["17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const WEEKEND_M=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];

  useEffect(()=>{
    if(!modifyingRdv)return;
    api.get("blocked_slots","select=date,slot").then(d=>{
      if(!Array.isArray(d))return;
      const map={};d.forEach(r=>{if(!map[r.date])map[r.date]=[];map[r.date].push(r.slot);});
      setAllSupaBlocked(map);
    });
  },[modifyingRdv]);

  const getAvailSlotsModify=(dateStr,rdv)=>{
    const dow=parseD(dateStr).getDay();const isWE=dow===0||dow===6;const allowed=isWE?WEEKEND_M:SEMAINE_M;
    const dur=rdv?.duree||30;const slotsNeeded=Math.ceil(dur/30);
    // Exclure le RDV en cours de modification des rdvs pris
    const rdvsDay=(allRdvs||[]).filter(r=>r.date===dateStr&&r.statut!=="annulé"&&r.id!==rdv?.id);
    const supaDay=allSupaBlocked[dateStr]||[];const avail=[];
    for(let j=0;j<=allowed.length-slotsNeeded;j++){
      let ok=true;
      for(let k=0;k<slotsNeeded;k++){
        const sl=allowed[j+k];if(!sl){ok=false;break;}if(supaDay.includes(sl)){ok=false;break;}
        const slotDateTime=new Date(`${dateStr}T${sl}:00`);
        if(slotDateTime.getTime()-Date.now()<24*60*60*1000){ok=false;break;}
        const idx=ALL_SLOTS.indexOf(sl);
        for(const r of rdvsDay){const rIdx=ALL_SLOTS.indexOf(r.slot);const rEnd=rIdx+Math.ceil((r.duree||30)/30);if(idx>=rIdx&&idx<rEnd){ok=false;break;}}
        if(!ok)break;
      }
      if(ok)avail.push(allowed[j]);
    }
    return avail;
  };

  const canModify=(r)=>{const rdvDate=new Date(`${r.date}T${r.slot}:00`);return rdvDate.getTime()-Date.now()>24*60*60*1000;};

  const handleModify=async()=>{
    if(!newDate||!newSlot){setModifyError("Choisissez une date et un créneau.");return;}
    if(modifying)return;
    setModifying(true);setModifyError("");
    try{
      const token=session?.token;if(!token){setModifyError("Session expirée.");setModifying(false);return;}
      const liveRdvs=await api.get("rdvs",`date=eq.${newDate}&statut=neq.annulé&select=id,slot,duree`);
      if(Array.isArray(liveRdvs)){
        const wantedIdx=ALL_SLOTS.indexOf(newSlot);const slotsNeeded=Math.ceil((modifyingRdv.duree||30)/30);
        for(const r of liveRdvs){
          if(r.id===modifyingRdv.id)continue;
          const rIdx=ALL_SLOTS.indexOf(r.slot);if(rIdx===-1)continue;
          const rEnd=rIdx+Math.ceil((r.duree||30)/30);
          if(wantedIdx<rEnd&&wantedIdx+slotsNeeded>rIdx){setModifyError("Ce créneau vient d'être pris. Choisissez-en un autre.");setModifying(false);return;}
        }
      }
      const res=await api.patch("rdvs",`id=eq.${modifyingRdv.id}`,{date:newDate,slot:newSlot},token);
      const updated=Array.isArray(res)?res[0]:res;
      if(!updated||updated.error){setModifyError("Impossible de modifier. Contactez-nous.");setModifying(false);return;}
      const rdvUpdated={...modifyingRdv,date:newDate,slot:newSlot};
      await Promise.all([
        sendEmails(rdvUpdated,session.user.email),
        sendPush(`✏️ Modification − ${modifyingRdv.client_prenom} ${modifyingRdv.client_nom}`,`${modifyingRdv.prestation} · ${fmtLong(newDate)} à ${newSlot} (était ${fmtLong(modifyingRdv.date)} à ${modifyingRdv.slot})`),
        notifyMakeRdvCancelled(modifyingRdv),
        notifyMakeRdvCreated(rdvUpdated),
      ]);
      if(onRdvModified)onRdvModified(modifyingRdv.id,{date:newDate,slot:newSlot});
      setModifyDone(true);
      setTimeout(()=>{setModifyingRdv(null);setModifyDone(false);setNewDate("");setNewSlot("");},2000);
    }catch(e){setModifyError("Erreur réseau. Réessayez.");}
    setModifying(false);
  };

  const canCancel=(r)=>{const rdvDate=new Date(`${r.date}T${r.slot}:00`);const now=new Date();return rdvDate.getTime()-now.getTime()>24*60*60*1000;};
  const handleCancel=async(r)=>{
    if(!confirm("Annuler ce rendez-vous ?"))return;if(cancelling)return;setCancelling(true);setCancelError("");
    try{
      const token=session?.token;if(!token){setCancelError("Session expirée. Veuillez vous reconnecter.");setCancelling(false);return;}
      const patchRes=await api.patch("rdvs",`id=eq.${r.id}`,{statut:"annulé"},token);const updated=Array.isArray(patchRes)?patchRes[0]:patchRes;
      if(!updated||updated.error||(updated.statut&&updated.statut!=="annulé")){setCancelError("Impossible d'annuler ce rendez-vous. Contactez-nous.");setCancelling(false);return;}
      await Promise.all([sendCancelEmail(r),sendPush(`❌ Annulation − ${r.client_prenom} ${r.client_nom}`,`${r.prestation} · ${fmtLong(r.date)} à ${r.slot}`)]);
      if(onRdvCancelled)onRdvCancelled(r.id);
    }catch(e){console.log("Erreur annulation:",e);setCancelError("Erreur réseau. Réessayez.");}
    setCancelling(false);
  };

  const Card=({r})=>{
    const isUpcoming=r.statut!=="annulé"&&r.date>=todayStr();
    const isModifying=modifyingRdv?.id===r.id;
    return (
      <div style={{padding:"16px 0",borderBottom:`1px solid ${C.borderLight}`,display:"flex",gap:14,alignItems:"stretch",opacity:r.statut==="annulé"?0.5:1}}>
        <div style={{width:3,alignSelf:"stretch",borderRadius:2,background:svcColor(r.cat_id),flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{textAlign:"center",paddingBottom:isUpcoming?14:0,borderBottom:isUpcoming?`1px solid ${C.borderLight}`:"none",marginBottom:isUpcoming?14:0}}>
            <div style={{fontSize:18,fontWeight:500,color:C.text,marginBottom:6}}>{r.prestation}</div>
            <div style={{fontSize:14,color:C.accent}}>{fmtLong(r.date)} · {r.slot}</div>
            <div style={{fontSize:13,color:C.textLight,marginTop:4}}>{r.prix} €</div>
            {r.statut==="annulé"&&<div style={{fontSize:12,color:"#c05050",marginTop:6}}>Annulé</div>}
          </div>
          {isUpcoming&&<AdresseBlock/>}
          {isUpcoming&&canModify(r)&&(
            <button onClick={()=>{setModifyingRdv(isModifying?null:r);setNewDate("");setNewSlot("");setModifyError("");}} style={{marginTop:14,width:"100%",fontSize:12,color:isModifying?C.textLight:C.accentDark,background:"none",border:`1px solid ${isModifying?C.border:C.accent}`,borderRadius:8,padding:"9px",cursor:"pointer"}}>
              {isModifying?"✕ Fermer":"📅 Modifier / Déplacer"}
            </button>
          )}
          {isModifying&&<ModifyPicker rdv={r} newDate={newDate} setNewDate={setNewDate} newSlot={newSlot} setNewSlot={setNewSlot} modifyDone={modifyDone} modifyError={modifyError} modifying={modifying} handleModify={handleModify} onClose={()=>{setModifyingRdv(null);setNewDate("");setNewSlot("");setModifyError("");}} getAvailSlotsModify={getAvailSlotsModify}/>}
        </div>
      </div>
    );
  };
  if(loading)return <div style={{textAlign:"center",padding:48,color:C.textLight,fontSize:14}}>Chargement…</div>;
  return (
    <div>
      {cancelError&&<div style={{padding:"12px 14px",background:"#2a1010",border:"1px solid #5a2020",borderRadius:8,marginBottom:16,fontSize:13,color:"#f08080"}}>{cancelError}</div>}
      {up.length>0&&<div style={{marginBottom:32}}><Lbl>À venir</Lbl>{up.map(r=><Card key={r.id} r={r}/>)}</div>}
      {past.length>0&&<div><Lbl>Historique</Lbl>{past.map(r=><Card key={r.id} r={r}/>)}</div>}
      {up.length===0&&past.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:C.textLight,fontSize:14}}>Aucun rendez-vous pour l'instant.</div>}
    </div>
  );
}

function PlanningAdmin({rdvs}) {
  const ALL_SLOTS=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const SEMAINE=["17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const WEEKEND=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const [selDate,setSelDate]=useState(todayStr());const [supaBlocked,setSupaBlocked]=useState([]);const [saving,setSaving]=useState(false);
  const dow=selDate?parseD(selDate).getDay():1;const isWE=dow===0||dow===6;const autoAllowed=isWE?WEEKEND:SEMAINE;
  const loadBlocked=async(date)=>{const d=await api.get("blocked_slots",`date=eq.${date}&select=slot`);if(Array.isArray(d))setSupaBlocked(d.map(r=>r.slot));};
  useEffect(()=>{loadBlocked(selDate);},[selDate]);
  const isAutoBlocked=(slot)=>!autoAllowed.includes(slot);const isManualBlocked=(slot)=>supaBlocked.includes(slot);
  const toggleSlot=async(slot)=>{if(isAutoBlocked(slot)||rdvBySlot(slot))return;setSaving(true);if(isManualBlocked(slot)){await fetch(`${SUPA_URL}/rest/v1/blocked_slots?date=eq.${selDate}&slot=eq.${encodeURIComponent(slot)}`,{method:"DELETE",headers:api.authHeaders()});setSupaBlocked(p=>p.filter(s=>s!==slot));}else{await api.post("blocked_slots",{date:selDate,slot});setSupaBlocked(p=>[...p,slot]);}setSaving(false);};
  const blockFullDay=async()=>{setSaving(true);const toBlock=autoAllowed.filter(s=>!supaBlocked.includes(s)&&!rdvBySlot(s));for(const slot of toBlock)await api.post("blocked_slots",{date:selDate,slot});setSupaBlocked(p=>[...new Set([...p,...toBlock])]);setSaving(false);};
  const unblockFullDay=async()=>{setSaving(true);await fetch(`${SUPA_URL}/rest/v1/blocked_slots?date=eq.${selDate}`,{method:"DELETE",headers:api.authHeaders()});setSupaBlocked([]);setSaving(false);};

  // RDV confirmés du jour sélectionné, et leur étendue de créneaux (selon durée)
  const rdvsJour=(rdvs||[]).filter(r=>r.date===selDate&&r.statut!=="annulé");
  const svcColor=(catId)=>SERVICES.find(s=>s.id===catId)?.color||C.accent;
  const isPastDay=selDate<todayStr();
  // Pour chaque créneau de la grille, retrouve le RDV qui l'occupe (le RDV peut durer plusieurs créneaux de 30min)
  const rdvBySlot=(slot)=>{
    const idx=ALL_SLOTS.indexOf(slot);
    for(const r of rdvsJour){
      const rIdx=ALL_SLOTS.indexOf(r.slot);if(rIdx===-1)continue;
      const rEnd=rIdx+Math.ceil((r.duree||30)/30);
      if(idx>=rIdx&&idx<rEnd)return {rdv:r,isStart:idx===rIdx};
    }
    return null;
  };
  // Jours du mois affiché qui ont au moins un RDV — pour le point indicateur sur le calendrier
  const bookedDatesSet=[...new Set((rdvs||[]).filter(r=>r.statut!=="annulé").map(r=>r.date))];

  return (
    <div>
      <div style={{marginBottom:20,padding:"12px 16px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,fontSize:12,color:C.textMid,lineHeight:1.8}}>
        <span style={{color:C.accentDark,fontWeight:600}}>■</span> Ouvert &nbsp;·&nbsp;
        <span style={{color:"#e09050",fontWeight:600}}>■</span> RDV pris &nbsp;·&nbsp;
        <span style={{color:"#f07070",fontWeight:600}}>■</span> Bloqué par toi &nbsp;·&nbsp;
        <span style={{color:C.textLight,fontWeight:600}}>■</span> Hors horaires
      </div>
      <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"20px 18px",marginBottom:20}}><Calendar selected={selDate} onSelect={setSelDate} bookedDates={bookedDatesSet} allowPast/></div>
      <div style={{fontSize:13,fontWeight:600,color:C.textMid,marginBottom:4}}>{fmtLong(selDate)}{isPastDay&&<span style={{fontSize:11,color:C.textLight,fontWeight:400,marginLeft:8}}>(jour passé — historique)</span>}</div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:16}}>{rdvsJour.length===0?"Aucun rendez-vous ce jour":`${rdvsJour.length} rendez-vous ce jour`}</div>
      {!isPastDay&&(<div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={blockFullDay} disabled={saving} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:C.textMid,fontSize:12,cursor:"pointer"}}>Bloquer les créneaux libres</button>
        <button onClick={unblockFullDay} disabled={saving} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:C.textMid,fontSize:12,cursor:"pointer"}}>Tout débloquer</button>
      </div>)}
      {saving&&<div style={{textAlign:"center",fontSize:12,color:C.textLight,marginBottom:12}}>Sauvegarde…</div>}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {ALL_SLOTS.map(s=>{
          const autoB=isAutoBlocked(s),manualB=isManualBlocked(s);const occ=rdvBySlot(s);
          if(occ){
            // Créneau occupé par un RDV — n'affiche le détail (nom, prestation) qu'au créneau de départ pour éviter la répétition
            if(!occ.isStart)return null;
            const r=occ.rdv;
            return (
              <div key={s} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:`1.5px solid #4a3218`,background:"#2a1e10",opacity:isPastDay?.7:1}}>
                <div style={{width:3,alignSelf:"stretch",borderRadius:2,background:svcColor(r.cat_id),flexShrink:0,minHeight:20}}/>
                <div style={{minWidth:44,fontSize:12,fontWeight:700,color:"#e09050"}}>{s}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{r.client_prenom} {r.client_nom}</div>
                  <div style={{fontSize:11,color:C.textMid,marginTop:1}}>{r.prestation} · {r.duree}min</div>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:"#e09050"}}>{r.prix}€</div>
              </div>
            );
          }
          if(isPastDay)return null;
          return(
            <div key={s} onClick={()=>toggleSlot(s)} style={{padding:"10px 12px",textAlign:"center",borderRadius:10,border:`1.5px solid ${manualB?"#c05050":autoB?C.border:C.accent}`,background:manualB?"#2a1010":autoB?C.surfaceAlt:C.accentLight,color:manualB?"#f07070":autoB?C.textLight:C.accentDark,fontSize:13,cursor:autoB?"default":"pointer",transition:"all .15s",fontWeight:(!autoB&&!manualB)?600:400}}>{s}</div>
          );
        })}
      </div>
    </div>
  );
}

function AdminCreateRdvView({allRdvs,profs,onCreated}) {
  const ALL_SLOTS=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const [mode,setMode]=useState("existing");const [selectedClientId,setSelectedClientId]=useState("");
  const [newPrenom,setNewPrenom]=useState("");const [newNom,setNewNom]=useState("");const [newTel,setNewTel]=useState("");const [newEmail,setNewEmail]=useState("");
  const [svcId,setSvcId]=useState("");const [subId,setSubId]=useState("");const [prestaId,setPrestaId]=useState("");
  const [date,setDate]=useState(todayStr());const [slot,setSlot]=useState("");const [saving,setSaving]=useState(false);const [msg,setMsg]=useState(null);
  const svc=svcId?SERVICES.find(s=>s.id===svcId):null;const sub=svc&&subId?svc.subcats.find(s=>s.id===subId):null;const presta=sub&&prestaId?sub.prestations.find(p=>p.id===prestaId):null;
  const takenSlots=(()=>{const blocked=new Set();allRdvs.filter(r=>r.date===date&&r.statut!=="annulé").forEach(r=>{const idx=ALL_SLOTS.indexOf(r.slot);if(idx===-1)return;let mins=0;for(let i=idx;i<ALL_SLOTS.length&&mins<(r.duree||30);i++){blocked.add(ALL_SLOTS[i]);mins+=30;}});return blocked;})();
  const slotFitsDuration=(s)=>{if(!presta)return true;const idx=ALL_SLOTS.indexOf(s);if(idx===-1)return false;const slotsNeeded=Math.ceil((presta.duree||30)/30);for(let i=0;i<slotsNeeded;i++){const checkSlot=ALL_SLOTS[idx+i];if(!checkSlot)return false;if(takenSlots.has(checkSlot))return false;}return true;};
  const handleCreate=async()=>{
    if(saving)return;setMsg(null);
    if(!presta){setMsg({type:"err",text:"Choisis une prestation."});return;}if(!date||!slot){setMsg({type:"err",text:"Choisis une date et un créneau."});return;}if(!slotFitsDuration(slot)){setMsg({type:"err",text:"Ce créneau chevauche un autre RDV."});return;}
    let client_prenom,client_nom,client_tel,client_email,user_id;
    if(mode==="existing"){if(!selectedClientId){setMsg({type:"err",text:"Choisis une cliente."});return;}const c=profs.find(p=>p.id===selectedClientId);if(!c){setMsg({type:"err",text:"Cliente introuvable."});return;}client_prenom=c.prenom;client_nom=c.nom;client_tel=c.tel;client_email=c.email||"";user_id=c.id;}
    else{if(!newPrenom||!newNom||!newTel){setMsg({type:"err",text:"Prénom, nom et téléphone requis."});return;}client_prenom=newPrenom;client_nom=newNom;client_tel=newTel;client_email=newEmail||"";user_id=null;}
    setSaving(true);
    try{
      const liveRdvs=await api.get("rdvs",`date=eq.${date}&statut=neq.annulé&select=slot,duree`);
      if(Array.isArray(liveRdvs)){const wantedIdx=ALL_SLOTS.indexOf(slot);const wantedSlotsNeeded=Math.ceil((presta.duree||30)/30);for(const r of liveRdvs){const rIdx=ALL_SLOTS.indexOf(r.slot);if(rIdx===-1)continue;const rEnd=rIdx+Math.ceil((r.duree||30)/30);const wantedEnd=wantedIdx+wantedSlotsNeeded;if(wantedIdx<rEnd&&wantedEnd>rIdx){setMsg({type:"err",text:"Ce créneau vient d'être pris. Rafraîchis et choisis-en un autre."});setSaving(false);return;}}}
      const rdv={user_id,cat_id:svcId,service:svc.label,prestation:presta.nom,duree:presta.duree,prix:presta.prix||0,acompte:presta.acompte||0,date,slot,client_prenom,client_nom,client_tel,client_email,statut:"confirmé"};
      const res=await api.post("rdvs",rdv);
      if(res&&res.code){setMsg({type:"err",text:res.code==="23505"?"Cette cliente a déjà un RDV à cet horaire.":"Erreur : "+(res.message||"inconnue")});setSaving(false);return;}
      const saved=Array.isArray(res)?res[0]:res;if(!saved||saved.error){setMsg({type:"err",text:"Erreur insertion : "+(saved?.message||"inconnue")});setSaving(false);return;}
      const tasks=[];if(client_email)tasks.push(sendEmails(rdv,client_email));tasks.push(sendPush(`${client_prenom} ${client_nom}`,`${rdv.prestation} · ${fmtLong(rdv.date)} à ${rdv.slot}`));await Promise.all(tasks);
      const promoFidAdmin=checkFidelitePromo(allRdvs,rdv);if(promoFidAdmin)await sendPush(`🎁 FIDÉLITÉ — ${client_prenom} ${client_nom}`,promoFidAdmin.msg);
      setMsg({type:"ok",text:`RDV créé pour ${client_prenom} ${client_nom} le ${fmtLong(date)} à ${slot}${client_email?" — email envoyé":""}.`});if(onCreated)onCreated(saved);
      setSlot("");setPrestaId("");setSubId("");setSvcId("");setSelectedClientId("");setNewPrenom("");setNewNom("");setNewTel("");setNewEmail("");
    }catch(e){setMsg({type:"err",text:"Erreur réseau : "+e.message});}
    setSaving(false);
  };
  return (
    <div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,marginBottom:18}}>Créer un rendez-vous</div>
      <Lbl>Cliente</Lbl>
      <div style={{display:"flex",background:C.surfaceAlt,borderRadius:10,padding:4,marginBottom:16}}>{[["existing","Cliente existante"],["new","Nouvelle cliente"]].map(([id,label])=>(<button key={id} onClick={()=>setMode(id)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:mode===id?C.surface:"transparent",color:mode===id?C.text:C.textMid,fontSize:13,fontWeight:mode===id?600:400,cursor:"pointer"}}>{label}</button>))}</div>
      {mode==="existing"?(<div style={{marginBottom:18}}><select value={selectedClientId} onChange={e=>setSelectedClientId(e.target.value)} style={{width:"100%",padding:"13px 16px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14}}><option value="">— Choisir une cliente —</option>{[...profs].sort((a,b)=>(a.prenom||"").localeCompare(b.prenom||"")).map(p=>(<option key={p.id} value={p.id}>{p.prenom} {p.nom} — {p.tel}</option>))}</select></div>):(<div style={{marginBottom:18}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><Inp value={newPrenom} onChange={e=>setNewPrenom(e.target.value)} placeholder="Prénom"/><Inp value={newNom} onChange={e=>setNewNom(e.target.value)} placeholder="Nom"/></div><Inp value={newTel} onChange={e=>setNewTel(e.target.value)} placeholder="Téléphone" type="tel" style={{marginBottom:10}}/><Inp value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="Email (optionnel)" type="email"/></div>)}
      <Lbl>Service</Lbl>
      <select value={svcId} onChange={e=>{setSvcId(e.target.value);setSubId("");setPrestaId("");}} style={{width:"100%",padding:"13px 16px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,marginBottom:12}}><option value="">— Choisir un service —</option>{SERVICES.map(s=>(<option key={s.id} value={s.id}>{s.label}</option>))}</select>
      {svc&&(<select value={subId} onChange={e=>{setSubId(e.target.value);setPrestaId("");}} style={{width:"100%",padding:"13px 16px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,marginBottom:12}}><option value="">— Choisir une sous-catégorie —</option>{svc.subcats.map(s=>(<option key={s.id} value={s.id}>{s.label}</option>))}</select>)}
      {sub&&(<select value={prestaId} onChange={e=>setPrestaId(e.target.value)} style={{width:"100%",padding:"13px 16px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,marginBottom:18}}><option value="">— Choisir une prestation —</option>{sub.prestations.map(p=>(<option key={p.id} value={p.id}>{p.nom} — {p.duree}min — {p.prix?p.prix+"€":"Sur devis"}</option>))}</select>)}
      <Lbl>Date</Lbl>
      <Inp type="date" value={date} min={todayStr()} onChange={e=>{setDate(e.target.value);setSlot("");}} style={{marginBottom:16}}/>
      {presta&&(<><Lbl>Créneau (durée {presta.duree} min)</Lbl><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>{ALL_SLOTS.map(s=>{const isTaken=takenSlots.has(s);const fits=!isTaken&&slotFitsDuration(s);const active=slot===s;const disabled=isTaken||!fits;return(<div key={s} onClick={()=>!disabled&&setSlot(s)} style={{padding:"11px 4px",textAlign:"center",borderRadius:10,border:`1.5px solid ${active?C.accent:C.border}`,background:active?C.accent:disabled?"#2a1010":C.surface,color:active?"#fff":disabled?"#7a4040":C.textMid,fontSize:13,fontWeight:active?700:400,cursor:disabled?"default":"pointer",transition:"all .15s",textDecoration:isTaken?"line-through":"none"}}>{s}</div>);})}
      </div></>)}
      {msg&&(<div style={{padding:"12px 14px",borderRadius:10,marginBottom:14,fontSize:13,background:msg.type==="ok"?"#0f2a18":"#2a1010",color:msg.type==="ok"?"#8dd0a0":"#f08080",border:`1px solid ${msg.type==="ok"?"#1f4028":"#5a2020"}`}}>{msg.text}</div>)}
      <PBtn onClick={handleCreate} disabled={saving}>{saving?"Création…":"Créer le rendez-vous"}</PBtn>
    </div>
  );
}

function AdminView({onExit}) {
  const [isUnlocked,setIsUnlocked]=useState(false);const [adminEmail,setAdminEmail]=useState("");const [adminPwd,setAdminPwd]=useState("");
  const [rdvs,setRdvs]=useState([]),[profs,setProfs]=useState([]);const [loading,setLoading]=useState(false),[tab,setTab]=useState("today");
  const [laserAccess,setLaserAccess]=useState(()=>{try{return JSON.parse(localStorage.getItem("laser_access")||"{}");}catch{return {};}});
  // Année affichée dans l'onglet CA mensuel (permet de naviguer entre les années)
  const [caYear,setCaYear]=useState(()=>new Date().getFullYear());
  useEffect(()=>{const session=getAdminSession();if(session){setIsUnlocked(true);load();}},[]);
  // Rafraîchit le token admin avant expiration — sans ça, les actions (suppression, modif) échouent silencieusement après ~1h
  useEffect(()=>{
    const interval=setInterval(async()=>{
      const session=getAdminSession();
      if(!session||!session.refresh_token)return;
      try{
        const res=await api.refreshToken(session.refresh_token);
        if(res.access_token){
          const updated={...session,access_token:res.access_token,refresh_token:res.refresh_token||session.refresh_token,expires_at:res.expires_at};
          localStorage.setItem(AUTH_STORAGE_KEY,JSON.stringify(updated));
        }
      }catch(e){console.log("Admin refresh failed:",e);}
    },20*60*1000);
    return()=>clearInterval(interval);
  },[]);
  const load=async()=>{
    setLoading(true);const[d,p]=await Promise.all([api.get("rdvs","select=*&order=date.asc,slot.asc"),api.get("profiles","select=*")]);
    if(Array.isArray(d))setRdvs(d);
    if(Array.isArray(p)){setProfs(p);const accessMap={};p.forEach(prof=>{accessMap[prof.id]=prof.laser_access||false;});setLaserAccess(accessMap);localStorage.setItem("laser_access",JSON.stringify(accessMap));}
    setLoading(false);
  };
  const toggleLaser=async(uid)=>{
    const newVal=!laserAccess[uid];
    const res=await fetch(`${SUPA_URL}/rest/v1/rpc/admin_set_laser_access`,{method:"POST",headers:api.authHeaders(),body:JSON.stringify({target_user_id:uid,new_value:newVal,admin_code:"2604"})});
    if(!res.ok){const errText=await res.text();alert("Erreur déblocage laser : "+errText);return;}
    const updated={...laserAccess,[uid]:newVal};setLaserAccess(updated);localStorage.setItem("laser_access",JSON.stringify(updated));
  };
  // ── Annulation = suppression DÉFINITIVE du RDV (DELETE), plus de statut "annulé" qui restait affiché ──
  const cancel=async(id)=>{
    if(!confirm("Supprimer définitivement ce rendez-vous ? Cette action est irréversible."))return;
    const rdvAnn=rdvs.find(r=>r.id===id);
    const session=await getValidAdminSession();
    if(!session){alert("Session admin expirée. Reconnecte-toi puis réessaie.");setIsUnlocked(false);return;}
    const res=await api.del("rdvs",`id=eq.${id}`,session.access_token);
    if(res&&res.ok===false){alert("La suppression a échoué (session probablement expirée). Reconnecte-toi puis réessaie.");setIsUnlocked(false);return;}
    if(res&&!Array.isArray(res)&&res.error){alert("Erreur lors de la suppression : "+(res.error.message||res.error));return;}
    // Supabase répond avec un tableau contenant la ligne supprimée grâce à Prefer:return=representation.
    // Un tableau vide veut dire que rien n'a été supprimé (RLS a silencieusement bloqué, sans erreur HTTP).
    if(Array.isArray(res)&&res.length===0){alert("Le rendez-vous n'a pas pu être supprimé (droits insuffisants). Reconnecte-toi puis réessaie.");setIsUnlocked(false);return;}
    setRdvs(p=>p.filter(r=>r.id!==id));
    if(rdvAnn)await Promise.all([sendCancelEmail(rdvAnn),sendPush(`❌ Suppression − ${rdvAnn.client_prenom} ${rdvAnn.client_nom}`,`${rdvAnn.prestation} · ${fmtLong(rdvAnn.date)} à ${rdvAnn.slot}`)]);
  };

  // États édition — doivent être AVANT tout return conditionnel
  const [editingId,setEditingId]=useState(null);
  const [editPrix,setEditPrix]=useState("");
  const [editPresta,setEditPresta]=useState("");
  const [editDate,setEditDate]=useState("");
  const [editSlot,setEditSlot]=useState("");
  const [editSaving,setEditSaving]=useState(false);
  const ALL_SLOTS_ADMIN=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const saveEdit=async(r)=>{
    setEditSaving(true);
    const body={};
    if(editPresta.trim()&&editPresta.trim()!==r.prestation) body.prestation=editPresta.trim();
    const p=parseFloat(editPrix);
    if(!isNaN(p)&&p!==r.prix) body.prix=p;
    if(editDate&&editDate!==r.date) body.date=editDate;
    if(editSlot&&editSlot!==r.slot) body.slot=editSlot;
    if(Object.keys(body).length>0){
      const session=await getValidAdminSession();
      if(!session){alert("Session admin expirée. Reconnecte-toi puis réessaie.");setIsUnlocked(false);setEditSaving(false);return;}
      const patchRes=await api.patch("rdvs",`id=eq.${r.id}`,body,session.access_token);
      if(patchRes&&patchRes.error){alert("Erreur lors de la modification : "+(patchRes.error.message||patchRes.error));setEditSaving(false);return;}
      setRdvs(prev=>prev.map(x=>x.id===r.id?{...x,...body}:x));
      if(body.date||body.slot){
        const nd=body.date||r.date;const ns=body.slot||r.slot;
        const rdvUpdated={...r,...body};
        await sendPush(`✏️ Déplacé (admin) − ${r.client_prenom} ${r.client_nom}`,`${r.prestation} · ${fmtLong(nd)} à ${ns}`);
        if(r.client_email) await sendEmails(rdvUpdated,r.client_email);
        await Promise.all([notifyMakeRdvCancelled(r),notifyMakeRdvCreated(rdvUpdated)]);
      }
    }
    setEditingId(null);setEditSaving(false);
  };

  if(!isUnlocked) return (
    <div className="fu" style={{padding:"0 20px",maxWidth:360,margin:"0 auto",paddingTop:60}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:C.text,marginBottom:8}}>Administration</div>
      <div style={{marginBottom:12}}><Lbl>Email</Lbl><Inp value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} type="email" placeholder="ton@email.com" autoComplete="email"/></div>
      <div style={{marginBottom:12}}><Lbl>Mot de passe</Lbl><Inp value={adminPwd} onChange={e=>setAdminPwd(e.target.value)} type="password" placeholder="••••••••" autoComplete="current-password"/></div>
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <GBtn onClick={onExit}>Retour</GBtn>
        <PBtn onClick={async()=>{if(!adminEmail||!adminPwd){alert("Renseigne ton email et mot de passe");return;}const result=await adminLogin(adminEmail,adminPwd);if(result.ok){setIsUnlocked(true);load();}else alert("Connexion impossible : "+result.error);}}>Se connecter</PBtn>
      </div>
    </div>
  );
  const confirmes=rdvs.filter(r=>r.statut==="confirmé");const todayRdvs=rdvs.filter(r=>r.date===todayStr()&&r.statut!=="annulé").sort((a,b)=>a.slot.localeCompare(b.slot));
  const upcoming=rdvs.filter(r=>r.date>=todayStr()&&r.statut!=="annulé").sort((a,b)=>a.date.localeCompare(b.date)||a.slot.localeCompare(b.slot));
  const groupByDate=list=>{const g={};list.forEach(r=>{if(!g[r.date])g[r.date]=[];g[r.date].push(r);});return g;};
  const svcColor=(catId)=>SERVICES.find(s=>s.id===catId)?.color||C.accent;
  const now=new Date();const currentYear=now.getFullYear();const currentMonth=now.getMonth();
  const caMoisCourant=confirmes.filter(r=>{const d=parseD(r.date);return d.getFullYear()===currentYear&&d.getMonth()===currentMonth;}).reduce((s,r)=>s+(r.prix||0),0);
  const caAnneeCourante=confirmes.filter(r=>parseD(r.date).getFullYear()===currentYear).reduce((s,r)=>s+(r.prix||0),0);
  const nbRdvAVenir=confirmes.filter(r=>r.date>=todayStr()).length;
  // CA par mois pour une année donnée (caYear) — permet de voir TOUS les mois, et de naviguer d'année en année
  const caParMoisAnnee=(annee)=>{const t=Array(12).fill(0).map((_,i)=>({mois:i,ca:0,nb:0}));confirmes.forEach(r=>{const d=parseD(r.date);if(d.getFullYear()===annee){t[d.getMonth()].ca+=(r.prix||0);t[d.getMonth()].nb+=1;}});return t;};
  const caParMois=caParMoisAnnee(caYear);
  const caMaxMensuel=Math.max(...caParMois.map(m=>m.ca),1);
  const caTotalAnneeAffichee=caParMois.reduce((s,m)=>s+m.ca,0);
  const nbRdvAnneeAffichee=caParMois.reduce((s,m)=>s+m.nb,0);
  // Années disponibles dans les données (pour limiter/orienter la navigation, sans bloquer si vide)
  const anneesAvecData=[...new Set(confirmes.map(r=>parseD(r.date).getFullYear()))];
  const getPromoFor=(r)=>{if(r.cat_id!=="ongles"&&r.cat_id!=="spray")return null;if(r.statut!=="confirmé")return null;const sameClient=(x)=>r.user_id?x.user_id===r.user_id:x.client_tel===r.client_tel;const allSame=rdvs.filter(x=>x.cat_id===r.cat_id&&x.statut==="confirmé"&&sameClient(x)).sort((a,b)=>(a.date+a.slot).localeCompare(b.date+b.slot));const idx=allSame.findIndex(x=>x.id===r.id);if(idx===-1)return null;const nb=idx+1;const cycle=nb%10;if(cycle===0)return{remise:10,nb};if(cycle===5)return{remise:5,nb};return null;};
  const Row=({r,allRdvsAdmin})=>{
    const isEditing=editingId===r.id;
    const smsUrl=`sms:${r.client_tel}`;
    return (
    <div style={{padding:"16px 0",borderBottom:`1px solid ${C.borderLight}`,display:"flex",gap:14,alignItems:"flex-start",opacity:r.statut==="annulé"?.35:1}}>
      <div style={{minWidth:44}}><div style={{fontSize:13,fontWeight:700,color:C.text}}>{r.slot}</div><div style={{fontSize:11,color:C.textLight,marginTop:2}}>{r.duree}min</div></div>
      <div style={{width:3,alignSelf:"stretch",borderRadius:2,background:svcColor(r.cat_id),flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:2,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>{r.prestation}{(()=>{const promo=getPromoFor(r);if(!promo)return null;return(<span style={{fontSize:10,fontWeight:700,background:"#3a2848",color:"#f0c060",padding:"2px 8px",borderRadius:10,letterSpacing:.3}}>🎁 -{promo.remise}€ ({promo.nb}e)</span>);})()}</div>
            <div style={{fontSize:12,color:C.textMid}}>{r.client_prenom} {r.client_nom} · {r.client_tel}</div>
          </div>
          <div style={{textAlign:"right",display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:14,fontWeight:700,color:C.textMid}}>{r.prix} €</div>
            {r.statut!=="annulé"&&<button onClick={()=>{setEditingId(isEditing?null:r.id);setEditPrix(String(r.prix));setEditPresta(r.prestation);setEditDate(r.date);setEditSlot(r.slot);}} style={{fontSize:11,color:C.textLight,background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"3px 8px",cursor:"pointer"}}>{isEditing?"✕":"✏️"}</button>}
          </div>
        </div>
        {isEditing&&(
          <div style={{marginTop:10,padding:"12px 14px",background:C.surfaceAlt,borderRadius:10,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.textLight,marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>Modifier le RDV</div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,color:C.textLight,marginBottom:4}}>Prestation</div>
              <input value={editPresta} onChange={e=>setEditPresta(e.target.value)} style={{width:"100%",padding:"8px 10px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:13}}/>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,color:C.textLight,marginBottom:4}}>Prix (€)</div>
              <input value={editPrix} onChange={e=>setEditPrix(e.target.value)} type="number" style={{width:"100%",padding:"8px 10px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:13}}/>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,color:C.textLight,marginBottom:4}}>Date</div>
              <input value={editDate} onChange={e=>{setEditDate(e.target.value);setEditSlot("");}} type="date" style={{width:"100%",padding:"8px 10px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:13}}/>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:C.textLight,marginBottom:6}}>Créneau</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
                {ALL_SLOTS_ADMIN.map(s=>{
                  const isTakenByOther=(allRdvsAdmin||[]).some(x=>x.date===editDate&&x.slot===s&&x.statut!=="annulé"&&x.id!==r.id);
                  const active=editSlot===s;
                  return(<div key={s} onClick={()=>!isTakenByOther&&setEditSlot(s)} style={{padding:"7px 2px",textAlign:"center",borderRadius:6,border:`1px solid ${active?C.accent:isTakenByOther?C.borderLight:C.border}`,background:active?C.accent:isTakenByOther?C.surfaceAlt:C.surface,color:active?"#fff":isTakenByOther?C.borderLight:C.textMid,fontSize:11,cursor:isTakenByOther?"default":"pointer",textDecoration:isTakenByOther?"line-through":"none"}}>{s}</div>);
                })}
              </div>
            </div>
            <button onClick={()=>saveEdit(r)} disabled={editSaving} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:`linear-gradient(135deg,#c9a0c0,#7a4878)`,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>{editSaving?"Sauvegarde…":"Enregistrer"}</button>
          </div>
        )}
        {r.statut!=="annulé"&&(<div style={{display:"flex",gap:8,marginTop:10}}>
          <a href={`tel:${r.client_tel}`} style={{fontSize:12,color:C.textMid,textDecoration:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px"}}>📞 Appeler</a>
          <a href={smsUrl} style={{fontSize:12,color:C.textMid,textDecoration:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px"}}>💬 Message</a>
          <button onClick={()=>cancel(r.id)} style={{fontSize:12,color:"#c05050",background:"none",border:"1px solid #f0d0d0",borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>Supprimer</button>
        </div>)}
        {r.statut==="annulé"&&<div style={{fontSize:11,color:"#c05050",marginTop:6}}>Annulé</div>}
      </div>
    </div>
  );};
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"0 20px 100px"}}>
      <div style={{paddingTop:48,paddingBottom:32}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontSize:10,letterSpacing:2.5,textTransform:"uppercase",color:C.textLight,marginBottom:10}}>Administration</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:C.text,letterSpacing:4,textTransform:"uppercase"}}>Neylika</div></div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={onExit} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMid,padding:"8px 14px",fontSize:12,cursor:"pointer"}}>Quitter</button>
            <button onClick={()=>{adminLogout();setIsUnlocked(false);setAdminEmail("");setAdminPwd("");}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMid,padding:"8px 14px",fontSize:12,cursor:"pointer"}}>Déconnexion</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:24}}>
          <div style={{background:`linear-gradient(135deg,${C.accentLight},${C.surface})`,border:`1.5px solid ${C.accent}`,borderRadius:12,padding:"16px 14px"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,marginBottom:4,fontWeight:600}}>{caMoisCourant} €</div><div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.accent,fontWeight:600}}>CA {MONTHS[currentMonth]}</div></div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 14px"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,marginBottom:4}}>{caAnneeCourante} €</div><div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.textLight}}>CA {currentYear}</div></div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 14px"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,marginBottom:4}}>{nbRdvAVenir}</div><div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.textLight}}>RDV à venir</div></div>
        </div>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:24,overflowX:"auto"}}>
        {[["today","Aujourd'hui"],["upcoming","À venir"],["all","Tous"],["create","+ Créer RDV"],["planning","Planning"],["ca","CA mensuel"],["laser","Laser 🔒"]].map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,padding:"11px 10px",background:"none",border:"none",borderBottom:`2px solid ${tab===id?C.accent:"transparent"}`,color:tab===id?C.accentDark:C.textLight,fontSize:11,fontWeight:tab===id?600:400,marginBottom:-1,letterSpacing:.3,cursor:"pointer"}}>{label}</button>))}
      </div>
      {loading&&<div style={{textAlign:"center",padding:40,color:C.textLight}}>Chargement…</div>}
      {!loading&&tab==="today"&&(<div><div style={{fontSize:12,color:C.textLight,marginBottom:16}}>{fmtLong(todayStr())}</div>{todayRdvs.length===0?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Aucun rendez-vous aujourd'hui.</div>:todayRdvs.map(r=><Row key={r.id} r={r} allRdvsAdmin={rdvs}/>)}</div>)}
      {!loading&&tab==="upcoming"&&(<div>{upcoming.length===0?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Aucun rendez-vous à venir.</div>:Object.entries(groupByDate(upcoming)).map(([d,list])=>(<div key={d} style={{marginBottom:28}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.textLight,marginBottom:12}}>{fmtLong(d)}</div>{list.map(r=><Row key={r.id} r={r} allRdvsAdmin={rdvs}/>)}</div>))}</div>)}
      {!loading&&tab==="all"&&(<div>{rdvs.length===0?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Aucun rendez-vous.</div>:Object.entries(groupByDate([...rdvs].sort((a,b)=>b.date.localeCompare(a.date)))).map(([d,list])=>(<div key={d} style={{marginBottom:28}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.textLight,marginBottom:12}}>{fmtLong(d)}</div>{list.map(r=><Row key={r.id} r={r} allRdvsAdmin={rdvs}/>)}</div>))}</div>)}
      {!loading&&tab==="create"&&(<AdminCreateRdvView allRdvs={rdvs} profs={profs} onCreated={(saved)=>{setRdvs(p=>[...p,saved]);setTab("today");}}/>)}
      {!loading&&tab==="planning"&&(<PlanningAdmin rdvs={rdvs}/>)}
      {!loading&&tab==="ca"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text}}>Chiffre d'affaires {caYear}</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <button onClick={()=>setCaYear(y=>y-1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMid,width:30,height:30,fontSize:16,cursor:"pointer"}}>‹</button>
              <button onClick={()=>setCaYear(currentYear)} style={{background:caYear===currentYear?C.accentLight:"none",border:`1px solid ${caYear===currentYear?C.accent:C.border}`,borderRadius:8,color:caYear===currentYear?C.accentDark:C.textLight,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>Aujourd'hui</button>
              <button onClick={()=>setCaYear(y=>y+1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMid,width:30,height:30,fontSize:16,cursor:"pointer"}}>›</button>
            </div>
          </div>
          <div style={{fontSize:12,color:C.textLight,marginBottom:24}}>Détail des 12 mois — uniquement les RDV confirmés{anneesAvecData.length>0&&!anneesAvecData.includes(caYear)?" · aucune donnée cette année":""}</div>
          <div style={{background:`linear-gradient(135deg,${C.accentLight},${C.surface})`,border:`1.5px solid ${C.accent}`,borderRadius:14,padding:"18px 20px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:C.accent,fontWeight:600,marginBottom:4}}>Total {caYear}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:C.text,fontWeight:600}}>{caTotalAnneeAffichee} €</div></div><div style={{textAlign:"right"}}><div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:C.textLight,marginBottom:4}}>RDV {caYear}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:C.textMid,fontWeight:500}}>{nbRdvAnneeAffichee}</div></div></div>
          {caParMois.map(m=>{const isCurrent=caYear===currentYear&&m.mois===currentMonth;const pct=(m.ca/caMaxMensuel)*100;return(<div key={m.mois} style={{marginBottom:14,padding:"14px 16px",background:isCurrent?C.accentLight:C.surface,border:`1px solid ${isCurrent?C.accent:C.border}`,borderRadius:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14,fontWeight:isCurrent?700:500,color:isCurrent?C.accentDark:C.text}}>{MONTHS[m.mois]}</span>{isCurrent&&<span style={{fontSize:9,background:C.accent,color:"#fff",padding:"2px 7px",borderRadius:8,letterSpacing:.5,fontWeight:600}}>EN COURS</span>}</div><div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:700,color:isCurrent?C.accentDark:C.text}}>{m.ca} €</div><div style={{fontSize:11,color:C.textLight,marginTop:1}}>{m.nb} RDV</div></div></div>{m.ca>0&&<div style={{height:4,background:C.surfaceAlt,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:isCurrent?C.accent:C.accentDark,borderRadius:4,transition:"width .8s ease"}}/></div>}</div>);})}
        </div>
      )}
      {!loading&&tab==="laser"&&(
        <div>
          <div style={{padding:"14px 18px",background:C.locked+"44",border:`1px solid ${C.locked}`,borderRadius:12,marginBottom:24,fontSize:13,color:C.lockedText,lineHeight:1.7}}>Activez l'accès laser pour chaque cliente vue en consultation. Elle pourra ensuite réserver ses séances.</div>
          {profs.length===0?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Aucune cliente inscrite.</div>:profs.map(p=>{const hasAccess=laserAccess[p.id];const nb=rdvs.filter(r=>r.user_id===p.id&&r.cat_id==="laser").length;return(<div key={p.id} style={{padding:"16px 0",borderBottom:`1px solid ${C.borderLight}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.text}}>{p.prenom} {p.nom}</div><div style={{fontSize:12,color:C.textMid,marginTop:2}}>{p.tel} · {nb} séance{nb>1?"s":""} laser</div></div><div onClick={()=>toggleLaser(p.id)} style={{width:50,height:28,borderRadius:14,background:hasAccess?C.accent:C.border,position:"relative",cursor:"pointer",transition:"background .25s",flexShrink:0}}><div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:hasAccess?25:3,transition:"left .25s",boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}/></div></div>);})}
        </div>
      )}
      {!loading&&(
        <div style={{marginTop:48}}>
          <Lbl>Répartition par service</Lbl>
          {SERVICES.map(s=>{const nb=confirmes.filter(r=>r.cat_id===s.id).length;const ca=confirmes.filter(r=>r.cat_id===s.id).reduce((a,r)=>a+r.prix,0);const pct=confirmes.length>0?(nb/confirmes.length)*100:0;return(<div key={s.id} style={{marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,color:C.textMid}}>{s.label}</span><span style={{fontSize:13,color:C.textLight}}>{nb} RDV · {ca} €</span></div><div style={{height:3,background:C.surfaceAlt,borderRadius:3}}><div style={{height:"100%",width:`${pct}%`,background:s.color,borderRadius:3,transition:"width .8s ease"}}/></div></div>);})}
        </div>
      )}
    </div>
  );
}

function FideliteCard({rdvs}) {
  const rdvOngles=rdvs.filter(r=>r.cat_id==="ongles"&&r.statut==="confirmé").length;
  const rdvSpray=rdvs.filter(r=>r.cat_id==="spray"&&r.statut==="confirmé").length;
  const getPromo=(nb)=>{if(nb===0)return null;const cycle=nb%10;if(cycle===0)return{remise:10,msg:`🎁 Félicitations ! -10€ sur votre prochain RDV`};if(cycle===5)return{remise:5,msg:`🎁 Bravo ! -5€ sur votre prochain RDV`};return null;};
  const getProgress=(nb)=>{const cycle=nb%10;const next=cycle<5?5-cycle:10-cycle;const nextRemise=cycle<5?5:10;return{next,nextRemise,cycle};};
  const renderSection=(label,nb,color)=>{
    const promo=getPromo(nb);const{next,nextRemise,cycle}=getProgress(nb);const pct=(cycle/(cycle<5?5:10))*100;
    return (<div style={{background:C.surface,border:`1px solid ${promo?C.accent:C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:14,fontWeight:600,color:C.text}}>{label}</div><div style={{fontSize:13,color:C.textLight}}>{nb} RDV</div></div>
      {promo?(<div style={{background:C.accentLight,border:`1px solid ${C.accent}`,borderRadius:10,padding:"12px 14px",fontSize:13,color:C.accentDark,fontWeight:600,marginBottom:10}}>{promo.msg}<div style={{fontSize:11,color:C.textMid,fontWeight:400,marginTop:4}}>Mentionnez-le lors de votre prochain RDV 😊</div></div>):(<div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textLight,marginBottom:6}}><span>Prochain avantage dans {next} RDV</span><span>-{nextRemise}€</span></div><div style={{height:4,background:C.surfaceAlt,borderRadius:4}}><div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4,transition:"width .8s ease"}}/></div></div>)}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Array(10).fill(null).map((_,i)=>(<div key={i} style={{width:22,height:22,borderRadius:"50%",background:i<(nb%10===0&&nb>0?10:nb%10)?color:C.surfaceAlt,border:`1px solid ${i<(nb%10===0&&nb>0?10:nb%10)?color:C.border}`,transition:"all .3s"}}/>))}</div>
    </div>);
  };
  if(rdvOngles===0&&rdvSpray===0) return (<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:16}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:6}}>Programme fidélité 🎁</div><div style={{fontSize:12,color:C.textLight,lineHeight:1.7}}>Réservez vos premiers RDV ongles ou spray tan pour cumuler des avantages !</div><div style={{fontSize:11,color:C.textLight,marginTop:8}}>-5€ tous les 5 RDV · -10€ tous les 10 RDV</div></div>);
  return (<div style={{marginBottom:16}}><div style={{fontSize:10,letterSpacing:2.5,textTransform:"uppercase",color:C.textLight,marginBottom:12,fontWeight:500}}>Programme fidélité</div>{rdvOngles>0&&renderSection("Prothésie Ongulaire",rdvOngles,"#c4a882")}{rdvSpray>0&&renderSection("Spray Tan",rdvSpray,"#c49060")}</div>);
}

export default function App() {
  const [session,setSession]=useState(null);const [view,setView]=useState("main");const [tab,setTab]=useState("reserver");
  const [allRdvs,setAllRdvs]=useState([]);const [clientRdvs,setClientRdvs]=useState([]);const [loadingRdvs,setLoadingRdvs]=useState(false);
  const [toast,setToast]=useState(null);const [laserAccess,setLaserAccess]=useState(()=>{try{return JSON.parse(localStorage.getItem("laser_access")||"{}");}catch{return {};}});
  const [showLoginModal,setShowLoginModal]=useState(false);const [resetMode,setResetMode]=useState(false);const [resetToken,setResetToken]=useState(null);
  const [showSprayConseils,setShowSprayConseils]=useState(false);
  const [showMentions,setShowMentions]=useState(false);
  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};
  useEffect(()=>{
    const hash=window.location.hash||"";const search=window.location.search||"";
    if(hash.includes("type=recovery")||search.includes("reset=1")){
      const params=new URLSearchParams(hash.replace(/^#/,""));const accessToken=params.get("access_token");const type=params.get("type");
      if(accessToken&&type==="recovery"){setResetToken(accessToken);setResetMode(true);window.history.replaceState(null,"",window.location.pathname);}
    }
  },[]);
  useEffect(()=>{
    const init=async()=>{
      const saved=localStorage.getItem("nlb_sess");if(!saved)return;
      try{
        const s=JSON.parse(saved);
        if(s.expires_at&&s.expires_at*1000<Date.now()){if(!s.refresh_token){localStorage.removeItem("nlb_sess");return;}const res=await api.refreshToken(s.refresh_token);if(res.access_token){const newSession={...s,token:res.access_token,refresh_token:res.refresh_token||s.refresh_token,expires_at:res.expires_at};setSession(newSession);localStorage.setItem("nlb_sess",JSON.stringify(newSession));}else localStorage.removeItem("nlb_sess");}
        else setSession(s);
      }catch{localStorage.removeItem("nlb_sess");}
    };
    init();
    api.get("rdvs","select=*&order=date.asc").then(d=>{if(Array.isArray(d))setAllRdvs(d);});
    const onStorage=()=>setLaserAccess(()=>{try{return JSON.parse(localStorage.getItem("laser_access")||"{}");}catch{return {};}});
    window.addEventListener("storage",onStorage);return()=>window.removeEventListener("storage",onStorage);
  },[]);
  useEffect(()=>{
    const refreshAllRdvs=()=>{api.get("rdvs","select=*&order=date.asc").then(d=>{if(Array.isArray(d))setAllRdvs(d);});};
    const interval=setInterval(refreshAllRdvs,30*1000);
    const onVisible=()=>{if(document.visibilityState==="visible")refreshAllRdvs();};
    document.addEventListener("visibilitychange",onVisible);window.addEventListener("focus",refreshAllRdvs);
    return()=>{clearInterval(interval);document.removeEventListener("visibilitychange",onVisible);window.removeEventListener("focus",refreshAllRdvs);};
  },[]);
  useEffect(()=>{
    if(!session)return;setLoadingRdvs(true);
    fetch(`${SUPA_URL}/rest/v1/rdvs?select=*&user_id=eq.${session.user.id}&order=date.asc`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${session.token}`,"Content-Type":"application/json"}})
      .then(r=>r.json()).then(d=>{if(Array.isArray(d))setClientRdvs(d);setLoadingRdvs(false);}).catch(e=>{console.log("Erreur chargement RDV cliente:",e);setLoadingRdvs(false);});
  },[session]);
  const handleAuth=(s)=>{setSession(s);localStorage.setItem("nlb_sess",JSON.stringify(s));showToast(`Bienvenue ${s.profile?.prenom||""} !`);};
  useEffect(()=>{
    const interval=setInterval(async()=>{
      const saved=localStorage.getItem("nlb_sess");if(!saved)return;
      try{const s=JSON.parse(saved);if(!s.refresh_token)return;const res=await api.refreshToken(s.refresh_token);if(res.access_token){const newSession={...s,token:res.access_token,refresh_token:res.refresh_token||s.refresh_token,expires_at:res.expires_at};setSession(newSession);localStorage.setItem("nlb_sess",JSON.stringify(newSession));}}catch(e){console.log("Refresh failed:",e);}
    },50*60*1000);return()=>clearInterval(interval);
  },[]);
  const handleBooked=(rdv)=>{setAllRdvs(p=>[...p,rdv]);setClientRdvs(p=>[...p,rdv]);setTab("mesrdvs");showToast("Rendez-vous confirmé !");};
  const handleLogout=async()=>{if(session?.token)await api.signOut(session.token);localStorage.removeItem("nlb_sess");setSession(null);setClientRdvs([]);showToast("Déconnecté·e");};
  const handleRdvModified=(rdvId,changes)=>{
    setClientRdvs(p=>p.map(r=>r.id===rdvId?{...r,...changes}:r));
    setAllRdvs(p=>p.map(r=>r.id===rdvId?{...r,...changes}:r));
    showToast("Rendez-vous déplacé !");
  };
  const handleRdvCancelled=(rdvId)=>{setClientRdvs(p=>p.map(r=>r.id===rdvId?{...r,statut:"annulé"}:r));setAllRdvs(p=>p.map(r=>r.id===rdvId?{...r,statut:"annulé"}:r));showToast("Rendez-vous annulé");};
  const [supaLaserAccess,setSupaLaserAccess]=useState(false);
  useEffect(()=>{if(!session)return;api.get("profiles",`id=eq.${session.user.id}&select=laser_access`).then(d=>{if(Array.isArray(d)&&d[0])setSupaLaserAccess(d[0].laser_access||false);});},[session]);
  const laserUnlocked=supaLaserAccess;
  const hasSprayRdv=clientRdvs.some(r=>r.cat_id==="spray"&&r.statut==="confirmé");
  if(resetMode&&resetToken) return (<div style={{minHeight:"100vh",background:C.bg}}><GS/><ResetPasswordView accessToken={resetToken} onDone={()=>{setResetMode(false);setResetToken(null);showToast("Mot de passe modifié. Connectez-vous.");}}/></div>);
  if(view==="admin") return <div style={{minHeight:"100vh",background:C.bg}}><GS/>{toast&&<Toast {...toast}/>}<AdminView onExit={()=>setView("main")}/></div>;
  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <GS/>
      {toast&&<Toast {...toast}/>}
      {showLoginModal&&<AuthModal onAuth={(s)=>{handleAuth(s);setShowLoginModal(false);setTab("compte");}} onClose={()=>setShowLoginModal(false)} booking={null}/>}
      <div style={{maxWidth:520,margin:"0 auto",padding:"0 20px 100px"}}>
        <div style={{paddingTop:48,paddingBottom:36}}>
          <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"#c0b0d8",marginBottom:12}}>Institut de beauté · Toulouse — Cartoucherie</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:300,color:C.text,lineHeight:1,letterSpacing:6,textTransform:"uppercase"}}>Neylika</h1>
            {session?(<div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:500,color:C.textMid}}>{session.profile?.prenom}</div><button onClick={handleLogout} style={{fontSize:11,color:C.textLight,background:"none",border:"none",cursor:"pointer",marginTop:2}}>Déconnexion</button></div>):(<button onClick={()=>setShowLoginModal(true)} style={{fontSize:13,color:"#d4c4e8",background:"none",border:`1px solid ${C.border}`,borderRadius:20,padding:"8px 16px",cursor:"pointer"}}>Se connecter</button>)}
          </div>
          <p style={{fontSize:15,color:"#d4c4ec",marginTop:10,lineHeight:1.7,letterSpacing:.5,fontStyle:"italic"}}>Ton adresse beauté à la Cartoucherie · Ongles · Laser · Bronzage</p>
          <div style={{display:"flex",gap:12,marginTop:12,alignItems:"center"}}>
            <a href="https://www.instagram.com/neylika31/" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,textDecoration:"none"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="6" stroke="#c9a0c0" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="#c9a0c0" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="#c9a0c0"/></svg>
              <span style={{fontSize:16,color:C.accent,letterSpacing:.5,fontWeight:500}}>@neylika31</span>
            </a>
            <a href="https://ig.me/m/neylika31" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,textDecoration:"none",background:C.accentLight,border:`1px solid ${C.accent}`,borderRadius:20,padding:"5px 12px"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke="#c9a0c0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8.5" cy="12" r="1" fill="#c9a0c0"/><circle cx="12" cy="12" r="1" fill="#c9a0c0"/><circle cx="15.5" cy="12" r="1" fill="#c9a0c0"/></svg>
              <span style={{fontSize:12,color:C.accent}}>Me contacter</span>
            </a>
          </div>
        </div>
        {tab==="reserver"&&<ReservationView session={session} allRdvs={allRdvs} onBooked={handleBooked} laserUnlocked={laserUnlocked} onAuth={handleAuth}/>}
        {tab==="mesrdvs"&&(
          <div className="fu">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,marginBottom:24}}>Mes rendez-vous</div>
            {!session?<div style={{textAlign:"center",padding:"48px 0",color:C.textLight}}><div style={{fontSize:14,marginBottom:20}}>Connectez-vous pour voir vos rendez-vous.</div><PBtn onClick={()=>setTab("reserver")} style={{maxWidth:220,margin:"0 auto"}}>Réserver</PBtn></div>:<MesRdvsView rdvs={clientRdvs} loading={loadingRdvs} session={session} onRdvCancelled={handleRdvCancelled} onRdvModified={handleRdvModified} allRdvs={allRdvs}/>}
          </div>
        )}
        {tab==="compte"&&(
          <div className="fu">
            {showSprayConseils?(
              <SprayTanConseilsPage onClose={()=>setShowSprayConseils(false)}/>
            ):(
              <>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,marginBottom:24}}>Mon compte</div>
                {!session?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Connectez-vous d'abord.</div>:(
                  <>
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"4px 20px",marginBottom:16}}>
                      {[["Prénom",session.profile?.prenom],["Nom",session.profile?.nom],["Téléphone",session.profile?.tel],["Email",session.user?.email]].map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${C.borderLight}`,fontSize:14}}><span style={{color:C.textLight}}>{k}</span><span style={{color:C.textMid,fontWeight:500}}>{v||"—"}</span></div>))}
                    </div>
                    {laserUnlocked&&<div style={{padding:"12px 16px",background:C.locked+"44",border:`1px solid ${C.locked}`,borderRadius:12,marginBottom:16,fontSize:13,color:C.lockedText}}>✓ Accès laser activé — vous pouvez réserver vos séances.</div>}
                    {hasSprayRdv&&(
                      <div onClick={()=>setShowSprayConseils(true)} style={{background:C.tanLight,border:`1.5px solid ${C.tanGold}`,borderRadius:14,padding:"16px 20px",marginBottom:16,cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
                        <span style={{fontSize:24}}>🌟</span>
                        <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.tanGold,marginBottom:3}}>Conseils Spray Tan</div><div style={{fontSize:12,color:C.textMid,lineHeight:1.5}}>Retrouvez vos recommandations avant et après séance</div></div>
                        <span style={{color:C.tanGold,fontSize:18}}>›</span>
                      </div>
                    )}
                    <FideliteCard rdvs={clientRdvs}/>
                    <GBtn onClick={handleLogout}>Se déconnecter</GBtn>
                  </>
                )}
                <div style={{textAlign:"center",padding:"8px",marginTop:32}}>
                  <span onClick={()=>setShowMentions(true)} style={{fontSize:9,color:"rgba(200,169,154,0.25)",cursor:"pointer",letterSpacing:"0.05em"}}>Mentions légales &amp; CGV</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {/* Modale mentions légales */}
      {showMentions&&(
        <div className="fi" onClick={()=>setShowMentions(false)} style={{position:"fixed",inset:0,zIndex:700,background:"rgba(0,0,0,.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div className="su" onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,maxHeight:"85vh",overflowY:"auto",background:"#1a1020",borderRadius:"20px 20px 0 0",padding:"28px 24px 48px",boxShadow:"0 -8px 40px rgba(0,0,0,.3)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#C8A99A",letterSpacing:.5}}>Mentions légales &amp; CGV</div>
              <button onClick={()=>setShowMentions(false)} style={{background:"none",border:"none",color:"rgba(200,169,154,0.5)",fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
            </div>
            {[
              {titre:"Éditeur du site",contenu:"EL RAKAAWI Nevine — NEYLIKA\n9 rue André Savès, 31300 Toulouse\nnlbeauty31@gmail.com"},
              {titre:"Hébergement",contenu:"Vercel Inc.\n340 Pine Street, Suite 701\nSan Francisco, CA 94104, USA\nvercel.com"},
              {titre:"Protection des données (RGPD)",contenu:"Les données collectées (nom, prénom, email, téléphone) sont utilisées uniquement pour la gestion des réservations. Aucune donnée n'est transmise à des tiers. Pour exercer vos droits d'accès, de rectification ou de suppression, contactez : nlbeauty31@gmail.com"},
              {titre:"Conditions Générales de Vente",contenu:"Paiement : uniquement en espèces, le jour du rendez-vous.\n\nAnnulation : possible jusqu'à 24h avant le rendez-vous via votre espace personnel. Passé ce délai, le rendez-vous est dû.\n\nNo-show : tout rendez-vous manqué sans annulation préalable répétée pourra entraîner un refus de réservation future."},
            ].map(({titre,contenu})=>(
              <div key={titre} style={{marginBottom:20,paddingBottom:20,borderBottom:"1px solid rgba(200,169,154,0.1)"}}>
                <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#C8A99A",marginBottom:8,fontWeight:600}}>{titre}</div>
                <div style={{fontSize:13,color:"rgba(200,169,154,0.7)",lineHeight:1.7,whiteSpace:"pre-line"}}>{contenu}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",boxShadow:"0 -4px 18px rgba(0,0,0,.05)"}}>
        {[["reserver","Réserver"],["mesrdvs","Mes RDV"],["compte","Compte"]].map(([id,label])=>(<button key={id} onClick={()=>{setTab(id);setShowSprayConseils(false);}} style={{flex:1,padding:"14px 8px 20px",background:"none",border:"none",color:tab===id?C.accentDark:C.textLight,fontSize:11,letterSpacing:1.5,textTransform:"uppercase",fontWeight:tab===id?600:400,cursor:"pointer",position:"relative",transition:"color .2s"}}>{label}{tab===id&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2,background:C.accent,borderRadius:1}}/>}</button>))}
        <button onClick={()=>setView("admin")} style={{padding:"14px 16px 20px",background:"none",border:"none",color:C.borderLight,fontSize:10,letterSpacing:1,cursor:"pointer"}}>⚙</button>
      </div>
    </div>
  );
}
