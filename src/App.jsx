import { useState, useEffect, useRef } from "react";

const SUPA_URL = "https://xpackkiprznsrotsohce.supabase.co";
const SUPA_KEY = "sb_publishable_kwmh9aAwybdtGLZWA7Mqfg_PrsEEuGu";

const api = {
  h: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
  ah: (t) => ({ "apikey": SUPA_KEY, "Authorization": `Bearer ${t}`, "Content-Type": "application/json", "Prefer": "return=representation" }),
  async get(table, q="") {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${q}`, { headers: this.h });
    return r.json();
  },
  async post(table, body, token) {
    const h = token ? this.ah(token) : { ...this.h, "Prefer": "return=representation" };
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, { method:"POST", headers:h, body:JSON.stringify(body) });
    return r.json();
  },
  async patch(table, id, body) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, { method:"PATCH", headers:{ ...this.h, "Prefer":"return=representation" }, body:JSON.stringify(body) });
    return r.json();
  },
  async signUp(email, password) {
    const r = await fetch(`${SUPA_URL}/auth/v1/signup`, { method:"POST", headers:{ "apikey":SUPA_KEY, "Content-Type":"application/json" }, body:JSON.stringify({ email, password }) });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, { method:"POST", headers:{ "apikey":SUPA_KEY, "Content-Type":"application/json" }, body:JSON.stringify({ email, password }) });
    return r.json();
  },
  async signOut(token) {
    await fetch(`${SUPA_URL}/auth/v1/logout`, { method:"POST", headers:{ "apikey":SUPA_KEY, "Authorization":`Bearer ${token}` } });
  },
  async upsert(table, body, token) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, { method:"POST", headers:{ ...this.ah(token), "Prefer":"return=representation,resolution=merge-duplicates" }, body:JSON.stringify(body) });
    return r.json();
  },
};

const SERVICES = {
  ongles: {
    id:"ongles", label:"Prothésie Ongulaire", color:"#c4a882", desc:"Pose, remplissage & nail art",
    prestations:[
      { id:"o1", nom:"Pose gel complète", duree:75, prix:55, acompte:15 },
      { id:"o2", nom:"Remplissage gel", duree:60, prix:40, acompte:10 },
      { id:"o3", nom:"Dépose + soin", duree:45, prix:25, acompte:0 },
      { id:"o4", nom:"Nail art", duree:30, prix:15, acompte:0 },
      { id:"o5", nom:"Pose capsules", duree:90, prix:65, acompte:20 },
    ],
  },
  laser: {
    id:"laser", label:"Épilation Laser Diode", color:"#9a8fb0", desc:"Technologie 4 longueurs d'onde",
    prestations:[
      { id:"l1", nom:"Lèvre supérieure", duree:15, prix:30, acompte:10 },
      { id:"l2", nom:"Aisselles", duree:20, prix:45, acompte:15 },
      { id:"l3", nom:"Maillot classique", duree:25, prix:55, acompte:15 },
      { id:"l4", nom:"Maillot intégral", duree:35, prix:75, acompte:20 },
      { id:"l5", nom:"Demi-jambes", duree:40, prix:65, acompte:20 },
      { id:"l6", nom:"Jambes complètes", duree:60, prix:90, acompte:25 },
      { id:"l7", nom:"Dos complet", duree:45, prix:80, acompte:25 },
      { id:"l8", nom:"Forfait corps", duree:120, prix:180, acompte:50 },
    ],
  },
  spray: {
    id:"spray", label:"Spray Tan", color:"#c49060", desc:"Bronzage naturel & durable",
    prestations:[
      { id:"s1", nom:"Corps entier", duree:30, prix:35, acompte:10 },
      { id:"s2", nom:"Visage", duree:15, prix:20, acompte:0 },
      { id:"s3", nom:"Corps + visage", duree:40, prix:50, acompte:15 },
      { id:"s4", nom:"Séance modèle", duree:60, prix:0, acompte:0 },
    ],
  },
};

const SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30"];
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_S = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const DAYS_L = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function parseD(s) { const [y,m,d]=s.split("-"); return new Date(+y,+m-1,+d); }
function fmtLong(s) { const d=parseD(s); return `${DAYS_L[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function firstDay(y,m) { const d=new Date(y,m,1).getDay(); return d===0?6:d-1; }
function daysIn(y,m) { return new Date(y,m+1,0).getDate(); }

const C = {
  bg:"#faf7f4", surface:"#ffffff", surfaceAlt:"#f5f0eb",
  border:"#e8e0d8", borderLight:"#f0ebe5",
  text:"#2a2018", textMid:"#7a6e64", textLight:"#b0a898",
  accent:"#c4a882", accentDark:"#9a7a58", accentLight:"#f5ede2",
};

const GS = () => (
  <>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
    <style>{`
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      body{background:${C.bg};font-family:'Jost',sans-serif;color:${C.text};}
      input,textarea,select,button{font-family:'Jost',sans-serif;}
      input:focus,textarea:focus{outline:none;}
      ::-webkit-scrollbar{width:0;}
      input::placeholder,textarea::placeholder{color:${C.textLight};}
      @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      @keyframes slideUp{from{opacity:0;transform:translateY(100%);}to{opacity:1;transform:translateY(0);}}
      .fu{animation:fadeUp .38s cubic-bezier(.22,.68,0,1.1) both;}
      .fi{animation:fadeIn .25s ease both;}
      .su{animation:slideUp .35s cubic-bezier(.22,.68,0,1.1) both;}
    `}</style>
  </>
);

const Label = ({ children }) => (
  <div style={{ fontSize:10, letterSpacing:2.5, textTransform:"uppercase", color:C.textLight, marginBottom:10, fontWeight:500 }}>{children}</div>
);
const Field = ({ label, children }) => (
  <div style={{ marginBottom:14 }}><Label>{label}</Label>{children}</div>
);
const Inp = (props) => (
  <input {...props} style={{ width:"100%", padding:"13px 16px", background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, transition:"border-color .15s", ...props.style }}
    onFocus={e=>e.target.style.borderColor=C.accent}
    onBlur={e=>e.target.style.borderColor=C.border} />
);
const PrimaryBtn = ({ children, onClick, disabled, style={} }) => (
  <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:"15px", borderRadius:12, border:"none", background:disabled?C.border:`linear-gradient(135deg,${C.accent},${C.accentDark})`, color:disabled?C.textLight:"#fff", fontSize:14, fontWeight:600, letterSpacing:.5, boxShadow:disabled?"none":"0 4px 20px rgba(196,168,130,.35)", transition:"all .2s", cursor:disabled?"default":"pointer", ...style }}>{children}</button>
);
const GhostBtn = ({ children, onClick, style={} }) => (
  <button onClick={onClick} style={{ width:"100%", padding:"13px", borderRadius:12, border:`1.5px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:14, cursor:"pointer", transition:"all .15s", ...style }}>{children}</button>
);
const Toast = ({ msg, type="ok" }) => (
  <div className="fi" style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:type==="err"?"#fff0f0":"#f0faf4", border:`1px solid ${type==="err"?"#f0c8c8":"#a8d8b8"}`, color:type==="err"?"#c05050":"#3a8050", padding:"12px 24px", borderRadius:12, fontSize:13, fontWeight:500, zIndex:9999, whiteSpace:"nowrap", boxShadow:"0 4px 24px rgba(0,0,0,.08)" }}>{msg}</div>
);

function Calendar({ selected, onSelect, bookedDates=[] }) {
  const t=new Date();
  const [yr,setYr]=useState(t.getFullYear());
  const [mo,setMo]=useState(t.getMonth());
  const todayS=todayStr();
  const prev=()=>mo===0?(setMo(11),setYr(yr-1)):setMo(mo-1);
  const next=()=>mo===11?(setMo(0),setYr(yr+1)):setMo(mo+1);
  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
        <button onClick={prev} style={{ background:"none",border:"none",color:C.textLight,fontSize:20,padding:"4px 10px",cursor:"pointer" }}>‹</button>
        <span style={{ fontFamily:"'Cormorant',serif",fontSize:17,color:C.text,fontWeight:400,letterSpacing:.5 }}>{MONTHS[mo]} {yr}</span>
        <button onClick={next} style={{ background:"none",border:"none",color:C.textLight,fontSize:20,padding:"4px 10px",cursor:"pointer" }}>›</button>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:8 }}>
        {DAYS_S.map(d=><div key={d} style={{ textAlign:"center",fontSize:10,color:C.textLight,fontWeight:500,letterSpacing:.8,textTransform:"uppercase",paddingBottom:8 }}>{d}</div>)}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px 0" }}>
        {Array(firstDay(yr,mo)).fill(null).map((_,i)=><div key={`e${i}`}/>)}
        {Array(daysIn(yr,mo)).fill(null).map((_,i)=>{
          const d=i+1;
          const s=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const isPast=s<todayS,isSel=s===selected,isToday=s===todayS;
          const hasDot=bookedDates.includes(s);
          return (
            <div key={d} onClick={()=>!isPast&&onSelect(s)} style={{ textAlign:"center",padding:"9px 2px",borderRadius:8,position:"relative",cursor:isPast?"default":"pointer",background:isSel?C.accent:"transparent",color:isSel?"#fff":isPast?C.borderLight:isToday?C.accentDark:C.text,fontWeight:isSel?600:isToday?500:400,fontSize:13,transition:"all .15s" }}>
              {d}
              {hasDot&&!isSel&&<div style={{ width:3,height:3,borderRadius:"50%",background:C.accent,position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)" }}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuthModal({ onAuth, onClose, booking }) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [prenom,setPrenom]=useState("");
  const [nom,setNom]=useState("");
  const [tel,setTel]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  const submit=async()=>{
    setErr(""); setLoading(true);
    try {
      if(mode==="login"){
        const res=await api.signIn(email,password);
        if(res.error){setErr("Email ou mot de passe incorrect.");setLoading(false);return;}
        const profiles=await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${res.user.id}&select=*`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${res.access_token}`}}).then(r=>r.json());
        onAuth({user:res.user,token:res.access_token,profile:profiles[0]||{}});
      } else {
        if(!prenom||!nom||!tel){setErr("Tous les champs sont requis.");setLoading(false);return;}
        const res=await api.signUp(email,password);
        if(res.error){setErr(res.error.message);setLoading(false);return;}
        if(res.user){
          await api.upsert("profiles",{id:res.user.id,prenom,nom,tel,email},res.access_token);
          onAuth({user:res.user,token:res.access_token,profile:{prenom,nom,tel,email}});
        } else {setErr("Vérifiez votre email pour confirmer votre compte.");}
      }
    } catch{setErr("Erreur réseau.");}
    setLoading(false);
  };

  return (
    <div className="fi" style={{ position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-end",background:"rgba(42,32,24,.4)",backdropFilter:"blur(4px)" }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="su" style={{ width:"100%",maxHeight:"90vh",overflowY:"auto",background:C.surface,borderRadius:"24px 24px 0 0",padding:"32px 24px 48px",boxShadow:"0 -8px 48px rgba(0,0,0,.12)" }}>
        <div style={{ width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 28px" }}/>
        {booking&&(
          <div style={{ background:C.accentLight,borderRadius:12,padding:"14px 16px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14,fontWeight:600,color:C.accentDark }}>{booking.presta}</div>
              <div style={{ fontSize:12,color:C.textMid,marginTop:2 }}>{fmtLong(booking.date)} · {booking.slot}</div>
            </div>
            <div style={{ fontSize:16,fontWeight:700,color:C.accentDark }}>{booking.prix>0?`${booking.prix} €`:"Gratuit"}</div>
          </div>
        )}
        <div style={{ fontFamily:"'Cormorant',serif",fontSize:24,color:C.text,marginBottom:4 }}>{mode==="login"?"Connexion":"Créer un compte"}</div>
        <div style={{ fontSize:13,color:C.textMid,marginBottom:24 }}>{mode==="login"?"Vos informations seront pré-remplies automatiquement.":"Un compte pour gérer tous vos rendez-vous."}</div>
        <div style={{ display:"flex",background:C.surfaceAlt,borderRadius:10,padding:4,marginBottom:22 }}>
          {[["login","Se connecter"],["signup","Créer un compte"]].map(([id,label])=>(
            <button key={id} onClick={()=>{setMode(id);setErr("");}} style={{ flex:1,padding:"9px",borderRadius:8,border:"none",background:mode===id?C.surface:"transparent",color:mode===id?C.text:C.textMid,fontSize:13,fontWeight:mode===id?600:400,boxShadow:mode===id?"0 1px 6px rgba(0,0,0,.08)":"none",transition:"all .2s",cursor:"pointer" }}>{label}</button>
          ))}
        </div>
        {mode==="signup"&&(
          <div className="fu">
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
              <Field label="Prénom"><Inp value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Marie"/></Field>
              <Field label="Nom"><Inp value={nom} onChange={e=>setNom(e.target.value)} placeholder="Dupont"/></Field>
            </div>
            <Field label="Téléphone"><Inp value={tel} onChange={e=>setTel(e.target.value)} placeholder="06 00 00 00 00" type="tel"/></Field>
          </div>
        )}
        <Field label="Email"><Inp value={email} onChange={e=>setEmail(e.target.value)} placeholder="marie@email.fr" type="email"/></Field>
        <Field label="Mot de passe"><Inp value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type="password"/></Field>
        {err&&<div style={{ fontSize:13,color:"#c05050",marginBottom:16,padding:"10px 14px",background:"#fff0f0",borderRadius:8 }}>{err}</div>}
        <PrimaryBtn onClick={submit} disabled={loading} style={{ marginTop:4 }}>
          {loading?"Chargement…":mode==="login"?"Confirmer ma réservation":"Créer mon compte et réserver"}
        </PrimaryBtn>
        <div style={{ textAlign:"center",fontSize:11,color:C.textLight,marginTop:14,lineHeight:1.6 }}>Vos données sont utilisées uniquement pour la gestion de vos rendez-vous.</div>
      </div>
    </div>
  );
}

function ReservationView({ session, allRdvs, onBooked }) {
  const [catId,setCatId]=useState(null);
  const [prestaId,setPrestaId]=useState(null);
  const [date,setDate]=useState("");
  const [slot,setSlot]=useState("");
  const [showAuth,setShowAuth]=useState(false);
  const [done,setDone]=useState(null);

  const cat=catId?SERVICES[catId]:null;
  const presta=cat&&prestaId?cat.prestations.find(p=>p.id===prestaId):null;
  const takenSlots=allRdvs.filter(r=>r.date===date&&r.statut!=="annulé").map(r=>r.slot);

  const r2=useRef(null),r3=useRef(null),r4=useRef(null),r5=useRef(null);
  const sc=(ref,d=120)=>setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth",block:"start"}),d);

  const handleConfirm=async(sess)=>{
    setShowAuth(false);
    try {
      const rdv={user_id:sess.user.id,cat_id:catId,service:cat.label,prestation:presta.nom,duree:presta.duree,prix:presta.prix,acompte:presta.acompte,date,slot,client_prenom:sess.profile.prenom,client_nom:sess.profile.nom,client_tel:sess.profile.tel,client_email:sess.user.email,statut:"confirmé"};
      const res=await api.post("rdvs",rdv,sess.token);
      if(res&&res[0]){setDone(res[0]);onBooked(res[0]);}
    } catch{alert("Erreur lors de la réservation.");}
  };

  const handleCTA=()=>{ if(session)handleConfirm(session); else setShowAuth(true); };

  if(done) return (
    <div className="fu" style={{ textAlign:"center",padding:"48px 0" }}>
      <div style={{ width:56,height:56,borderRadius:"50%",background:C.accentLight,border:`1.5px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",color:C.accentDark,fontSize:22 }}>✓</div>
      <div style={{ fontFamily:"'Cormorant',serif",fontSize:30,color:C.text,marginBottom:10 }}>Rendez-vous confirmé</div>
      <div style={{ fontSize:14,color:C.textMid,lineHeight:2,marginBottom:8 }}>{done.prestation}<br/>{fmtLong(done.date)} à {done.slot}</div>
      {done.acompte>0&&<div style={{ fontSize:13,color:C.accentDark,fontWeight:500,marginBottom:24 }}>Acompte de {done.acompte} € réglé</div>}
      <div style={{ fontSize:12,color:C.textLight,marginBottom:32 }}>Un SMS de rappel vous sera envoyé 24h avant votre rendez-vous.</div>
      <GhostBtn onClick={()=>{setDone(null);setCatId(null);setPrestaId(null);setDate("");setSlot("");}}>Nouvelle réservation</GhostBtn>
    </div>
  );

  return (
    <div>
      {showAuth&&<AuthModal onAuth={handleConfirm} onClose={()=>setShowAuth(false)} booking={presta?{presta:presta.nom,date,slot,prix:presta.prix}:null}/>}
      <div>
        <Label>Choisissez un service</Label>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {Object.values(SERVICES).map(s=>{
            const active=catId===s.id;
            return (
              <div key={s.id} onClick={()=>{if(catId!==s.id){setPrestaId(null);setDate("");setSlot("");}setCatId(s.id);sc(r2);}} style={{ padding:"18px 20px",borderRadius:14,border:`1.5px solid ${active?s.color:C.border}`,background:active?s.color+"10":C.surface,cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:active?"0 2px 16px rgba(0,0,0,.06)":"none" }}>
                <div>
                  <div style={{ fontSize:15,fontWeight:600,color:active?C.text:C.textMid }}>{s.label}</div>
                  <div style={{ fontSize:12,color:C.textLight,marginTop:3 }}>{s.desc}</div>
                </div>
                <div style={{ width:8,height:8,borderRadius:"50%",background:active?s.color:C.border,flexShrink:0 }}/>
              </div>
            );
          })}
        </div>
      </div>

      {cat&&(
        <div ref={r2} className="fu" style={{ marginTop:36 }}>
          <Label>Prestation</Label>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {cat.prestations.map(p=>{
              const active=prestaId===p.id;
              return (
                <div key={p.id} onClick={()=>{setPrestaId(p.id);setDate("");setSlot("");sc(r3);}} style={{ padding:"15px 18px",borderRadius:12,border:`1.5px solid ${active?C.accent:C.border}`,background:active?C.accentLight:C.surface,cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:14,fontWeight:active?600:400,color:active?C.accentDark:C.text }}>{p.nom}</div>
                    <div style={{ fontSize:12,color:C.textLight,marginTop:2 }}>{p.duree} min</div>
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <div style={{ fontSize:15,fontWeight:700,color:active?C.accentDark:C.textMid }}>{p.prix>0?`${p.prix} €`:"Offert"}</div>
                    {p.acompte>0&&<div style={{ fontSize:11,color:C.textLight,marginTop:2 }}>Acompte {p.acompte} €</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {presta&&(
        <div ref={r3} className="fu" style={{ marginTop:36 }}>
          <Label>Date du rendez-vous</Label>
          <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"20px 18px",boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
            <Calendar selected={date} onSelect={d=>{setDate(d);setSlot("");sc(r4);}} bookedDates={allRdvs.filter(r=>r.statut!=="annulé").map(r=>r.date)}/>
          </div>
        </div>
      )}

      {date&&(
        <div ref={r4} className="fu" style={{ marginTop:36 }}>
          <Label>Horaire — {fmtLong(date)}</Label>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
            {SLOTS.map(s=>{
              const taken=takenSlots.includes(s),active=slot===s;
              return (
                <div key={s} onClick={()=>!taken&&(setSlot(s),sc(r5))} style={{ padding:"11px 4px",textAlign:"center",borderRadius:10,border:`1.5px solid ${active?C.accent:taken?C.borderLight:C.border}`,background:active?C.accent:taken?C.surfaceAlt:C.surface,color:active?"#fff":taken?C.borderLight:C.textMid,fontSize:13,fontWeight:active?700:400,cursor:taken?"default":"pointer",textDecoration:taken?"line-through":"none",transition:"all .15s" }}>
                  {s}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {slot&&(
        <div ref={r5} className="fu" style={{ marginTop:36 }}>
          <Label>Récapitulatif</Label>
          <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"20px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:14,borderBottom:`1px solid ${C.borderLight}`,marginBottom:14 }}>
              <div>
                <div style={{ fontSize:16,fontWeight:600,color:C.text,marginBottom:4 }}>{presta?.nom}</div>
                <div style={{ fontSize:13,color:C.textMid }}>{cat?.label} · {presta?.duree} min</div>
              </div>
              <div style={{ fontSize:18,fontWeight:700,color:C.accentDark }}>{presta?.prix>0?`${presta.prix} €`:"Offert"}</div>
            </div>
            {[["Date",fmtLong(date)],["Heure",slot]].map(([k,v])=>(
              <div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"6px 0" }}>
                <span style={{ color:C.textLight }}>{k}</span>
                <span style={{ color:C.textMid,fontWeight:500 }}>{v}</span>
              </div>
            ))}
            {presta?.acompte>0&&(
              <>
                <div style={{ height:1,background:C.borderLight,margin:"12px 0" }}/>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4 }}>
                  <span style={{ color:C.textLight }}>Acompte à régler</span>
                  <span style={{ color:C.accentDark,fontWeight:700 }}>{presta.acompte} €</span>
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12 }}>
                  <span style={{ color:C.textLight }}>Solde le jour J</span>
                  <span style={{ color:C.textLight }}>{presta.prix-presta.acompte} €</span>
                </div>
              </>
            )}
          </div>
          {presta?.acompte>0&&(
            <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"20px",marginBottom:16 }}>
              <Label>Paiement sécurisé</Label>
              <Field label="Numéro de carte"><Inp placeholder="4242 4242 4242 4242"/></Field>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <Field label="Expiration"><Inp placeholder="MM / AA"/></Field>
                <Field label="CVV"><Inp placeholder="•••" type="password"/></Field>
              </div>
              <div style={{ fontSize:11,color:C.textLight,textAlign:"center",marginTop:8,letterSpacing:.3 }}>Paiement 3D Secure · SSL · Stripe</div>
            </div>
          )}
          <PrimaryBtn onClick={handleCTA}>
            {session ? presta?.acompte>0?`Confirmer et payer ${presta.acompte} €`:"Confirmer le rendez-vous" : "Continuer pour confirmer"}
          </PrimaryBtn>
          {!session&&<div style={{ textAlign:"center",fontSize:12,color:C.textLight,marginTop:10 }}>Connexion ou création de compte requise — rapide et gratuit</div>}
          <div style={{ textAlign:"center",fontSize:11,color:C.textLight,marginTop:8 }}>Annulation sans frais jusqu'à 24h avant</div>
        </div>
      )}
    </div>
  );
}

function MesRdvsView({ rdvs, loading }) {
  const up=rdvs.filter(r=>r.date>=todayStr()&&r.statut!=="annulé").sort((a,b)=>a.date.localeCompare(b.date));
  const past=rdvs.filter(r=>r.date<todayStr()||r.statut==="annulé").sort((a,b)=>b.date.localeCompare(a.date));
  const Card=({r})=>{
    const s=SERVICES[r.cat_id];
    return (
      <div style={{ padding:"16px 0",borderBottom:`1px solid ${C.borderLight}`,display:"flex",gap:14,alignItems:"flex-start",opacity:r.statut==="annulé"?.4:1 }}>
        <div style={{ width:3,alignSelf:"stretch",borderRadius:2,background:s?.color||C.accent,flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:14,fontWeight:600,color:C.text,marginBottom:3 }}>{r.prestation}</div>
              <div style={{ fontSize:12,color:C.textMid }}>{fmtLong(r.date)} · {r.slot}</div>
              {r.statut==="annulé"&&<div style={{ fontSize:11,color:"#c05050",marginTop:4 }}>Annulé</div>}
            </div>
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <div style={{ fontSize:14,fontWeight:700,color:C.textMid }}>{r.prix} €</div>
              {r.acompte>0&&<div style={{ fontSize:11,color:C.textLight,marginTop:2 }}>Acpte {r.acompte}€</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };
  if(loading) return <div style={{ textAlign:"center",padding:48,color:C.textLight,fontSize:14 }}>Chargement…</div>;
  return (
    <div>
      {up.length>0&&<div style={{ marginBottom:32 }}><Label>À venir</Label>{up.map(r=><Card key={r.id} r={r}/>)}</div>}
      {past.length>0&&<div><Label>Historique</Label>{past.map(r=><Card key={r.id} r={r}/>)}</div>}
      {up.length===0&&past.length===0&&<div style={{ textAlign:"center",padding:"48px 0",color:C.textLight,fontSize:14 }}>Aucun rendez-vous pour l'instant.</div>}
    </div>
  );
}

function AdminView({ onExit }) {
  const [code,setCode]=useState("");
  const [unlocked,setUnlocked]=useState(false);
  const [rdvs,setRdvs]=useState([]);
  const [loading,setLoading]=useState(false);
  const [tab,setTab]=useState("today");
  const load=async()=>{setLoading(true);const d=await api.get("rdvs","select=*&order=date.asc,slot.asc");if(Array.isArray(d))setRdvs(d);setLoading(false);};
  const cancel=async(id)=>{if(!confirm("Annuler ce rendez-vous ?"))return;await api.patch("rdvs",id,{statut:"annulé"});setRdvs(p=>p.map(r=>r.id===id?{...r,statut:"annulé"}:r));};

  if(!unlocked) return (
    <div className="fu" style={{ padding:"0 20px",maxWidth:360,margin:"0 auto",paddingTop:60 }}>
      <div style={{ fontFamily:"'Cormorant',serif",fontSize:28,color:C.text,marginBottom:8 }}>Administration</div>
      <div style={{ fontSize:13,color:C.textLight,marginBottom:28 }}>Code démo : <span style={{ color:C.textMid }}>nl2024</span></div>
      <Field label="Code d'accès"><Inp value={code} onChange={e=>setCode(e.target.value)} type="password" placeholder="••••••"/></Field>
      <div style={{ display:"flex",gap:10,marginTop:4 }}>
        <GhostBtn onClick={onExit}>Retour</GhostBtn>
        <PrimaryBtn onClick={()=>{if(code==="nl2024"){setUnlocked(true);load();}else alert("Code incorrect");}}>Accéder</PrimaryBtn>
      </div>
    </div>
  );

  const confirmes=rdvs.filter(r=>r.statut==="confirmé");
  const todayRdvs=rdvs.filter(r=>r.date===todayStr()&&r.statut!=="annulé").sort((a,b)=>a.slot.localeCompare(b.slot));
  const upcoming=rdvs.filter(r=>r.date>=todayStr()&&r.statut!=="annulé").sort((a,b)=>a.date.localeCompare(b.date)||a.slot.localeCompare(b.slot));
  const groupByDate=list=>{const g={};list.forEach(r=>{if(!g[r.date])g[r.date]=[];g[r.date].push(r);});return g;};

  const Row=({r})=>{
    const s=SERVICES[r.cat_id];
    return (
      <div style={{ padding:"16px 0",borderBottom:`1px solid ${C.borderLight}`,display:"flex",gap:14,alignItems:"flex-start",opacity:r.statut==="annulé"?.35:1 }}>
        <div style={{ minWidth:42 }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{r.slot}</div>
          <div style={{ fontSize:11,color:C.textLight,marginTop:2 }}>{r.duree}min</div>
        </div>
        <div style={{ width:3,alignSelf:"stretch",borderRadius:2,background:s?.color||C.accent,flexShrink:0 }}/>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6 }}>
            <div>
              <div style={{ fontSize:14,fontWeight:600,color:C.text,marginBottom:2 }}>{r.prestation}</div>
              <div style={{ fontSize:12,color:C.textMid }}>{r.client_prenom} {r.client_nom} · {r.client_tel}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:14,fontWeight:700,color:C.textMid }}>{r.prix} €</div>
              {r.acompte>0&&<div style={{ fontSize:11,color:C.textLight }}>Acpte {r.acompte}€</div>}
            </div>
          </div>
          {r.statut!=="annulé"&&(
            <div style={{ display:"flex",gap:8,marginTop:10 }}>
              <a href={`tel:${r.client_tel}`} style={{ fontSize:12,color:C.textMid,textDecoration:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px" }}>Appeler</a>
              <button onClick={()=>cancel(r.id)} style={{ fontSize:12,color:"#c05050",background:"none",border:"1px solid #f0d0d0",borderRadius:8,padding:"5px 12px",cursor:"pointer" }}>Annuler</button>
            </div>
          )}
          {r.statut==="annulé"&&<div style={{ fontSize:11,color:"#c05050",marginTop:6 }}>Annulé</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth:560,margin:"0 auto",padding:"0 20px 100px" }}>
      <div style={{ paddingTop:48,paddingBottom:32 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:10,letterSpacing:2.5,textTransform:"uppercase",color:C.textLight,marginBottom:10 }}>Administration</div>
            <div style={{ fontFamily:"'Cormorant',serif",fontSize:30,color:C.text }}>NL Beauty</div>
          </div>
          <button onClick={onExit} style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMid,padding:"8px 14px",fontSize:12,cursor:"pointer" }}>Quitter</button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:24 }}>
          {[[confirmes.length,"RDV"],[confirmes.reduce((s,r)=>s+r.prix,0)+" €","CA"],[confirmes.reduce((s,r)=>s+r.acompte,0)+" €","Acomptes"]].map(([v,l],i)=>(
            <div key={i} style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 14px",boxShadow:"0 1px 8px rgba(0,0,0,.04)" }}>
              <div style={{ fontFamily:"'Cormorant',serif",fontSize:22,color:C.text,marginBottom:4 }}>{v}</div>
              <div style={{ fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.textLight }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:24 }}>
        {[["today","Aujourd'hui"],["upcoming","À venir"],["all","Tous"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ flex:1,padding:"12px",background:"none",border:"none",borderBottom:`2px solid ${tab===id?C.accent:"transparent"}`,color:tab===id?C.accentDark:C.textLight,fontSize:12,fontWeight:tab===id?600:400,marginBottom:-1,letterSpacing:.5,cursor:"pointer" }}>{label}</button>
        ))}
      </div>
      {loading&&<div style={{ textAlign:"center",padding:40,color:C.textLight }}>Chargement…</div>}
      {!loading&&tab==="today"&&(
        <div>
          <div style={{ fontSize:12,color:C.textLight,marginBottom:16 }}>{fmtLong(todayStr())}</div>
          {todayRdvs.length===0?<div style={{ textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14 }}>Aucun rendez-vous aujourd'hui.</div>:todayRdvs.map(r=><Row key={r.id} r={r}/>)}
        </div>
      )}
      {!loading&&tab==="upcoming"&&(
        <div>
          {upcoming.length===0?<div style={{ textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14 }}>Aucun rendez-vous à venir.</div>
            :Object.entries(groupByDate(upcoming)).map(([d,list])=>(
              <div key={d} style={{ marginBottom:28 }}>
                <div style={{ fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.textLight,marginBottom:12 }}>{fmtLong(d)}</div>
                {list.map(r=><Row key={r.id} r={r}/>)}
              </div>
            ))}
        </div>
      )}
      {!loading&&tab==="all"&&(
        <div>
          {rdvs.length===0?<div style={{ textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14 }}>Aucun rendez-vous.</div>
            :Object.entries(groupByDate([...rdvs].sort((a,b)=>b.date.localeCompare(a.date)))).map(([d,list])=>(
              <div key={d} style={{ marginBottom:28 }}>
                <div style={{ fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.textLight,marginBottom:12 }}>{fmtLong(d)}</div>
                {list.map(r=><Row key={r.id} r={r}/>)}
              </div>
            ))}
        </div>
      )}
      <div style={{ marginTop:48 }}>
        <Label>Répartition par service</Label>
        {Object.values(SERVICES).map(s=>{
          const nb=confirmes.filter(r=>r.cat_id===s.id).length;
          const ca=confirmes.filter(r=>r.cat_id===s.id).reduce((a,r)=>a+r.prix,0);
          const pct=confirmes.length>0?(nb/confirmes.length)*100:0;
          return (
            <div key={s.id} style={{ marginBottom:20 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <span style={{ fontSize:13,color:C.textMid }}>{s.label}</span>
                <span style={{ fontSize:13,color:C.textLight }}>{nb} RDV · {ca} €</span>
              </div>
              <div style={{ height:3,background:C.surfaceAlt,borderRadius:3 }}>
                <div style={{ height:"100%",width:`${pct}%`,background:s.color,borderRadius:3,transition:"width .8s ease" }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [session,setSession]=useState(null);
  const [view,setView]=useState("main");
  const [tab,setTab]=useState("reserver");
  const [allRdvs,setAllRdvs]=useState([]);
  const [clientRdvs,setClientRdvs]=useState([]);
  const [loadingRdvs,setLoadingRdvs]=useState(false);
  const [toast,setToast]=useState(null);

  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  useEffect(()=>{
    const loadAll=async()=>{const d=await api.get("rdvs","select=*&order=date.asc");if(Array.isArray(d))setAllRdvs(d);};
    loadAll();
    const saved=localStorage.getItem("nlb_sess");
    if(saved){try{setSession(JSON.parse(saved));}catch{}}
  },[]);

  useEffect(()=>{
    if(!session)return;
    const load=async()=>{setLoading(true);const d=await api.get("rdvs",`select=*&user_id=eq.${session.user.id}&order=date.asc`);if(Array.isArray(d))setClientRdvs(d);setLoading(false);};
    load();
  },[session]);

  const setLoading=(v)=>setLoadingRdvs(v);
  const handleAuth=(s)=>{setSession(s);localStorage.setItem("nlb_sess",JSON.stringify(s));showToast(`Bienvenue ${s.profile?.prenom||""} !`);};
  const handleBooked=(rdv)=>{setAllRdvs(p=>[...p,rdv]);setClientRdvs(p=>[...p,rdv]);setTab("mesrdvs");showToast("Rendez-vous confirmé !");};
  const handleLogout=async()=>{if(session?.token)await api.signOut(session.token);localStorage.removeItem("nlb_sess");setSession(null);setClientRdvs([]);showToast("Déconnecté·e");};

  if(view==="admin") return <div style={{ minHeight:"100vh",background:C.bg }}><GS/>{toast&&<Toast {...toast}/>}<AdminView onExit={()=>setView("main")}/></div>;

  return (
    <div style={{ minHeight:"100vh",background:C.bg }}>
      <GS/>
      {toast&&<Toast {...toast}/>}
      <div style={{ maxWidth:520,margin:"0 auto",padding:"0 20px 100px" }}>
        <div style={{ paddingTop:48,paddingBottom:36 }}>
          <div style={{ fontSize:9,letterSpacing:3,textTransform:"uppercase",color:C.textLight,marginBottom:12 }}>Toulouse · Sur rendez-vous</div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <h1 style={{ fontFamily:"'Cormorant',serif",fontSize:38,fontWeight:300,color:C.text,lineHeight:1 }}>NL Beauty</h1>
            {session?(
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13,fontWeight:500,color:C.textMid }}>{session.profile?.prenom}</div>
                <button onClick={handleLogout} style={{ fontSize:11,color:C.textLight,background:"none",border:"none",cursor:"pointer",marginTop:2 }}>Déconnexion</button>
              </div>
            ):(
              <button onClick={()=>setTab("reserver")} style={{ fontSize:12,color:C.textMid,background:"none",border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 14px",cursor:"pointer" }}>Se connecter</button>
            )}
          </div>
          <p style={{ fontSize:13,color:C.textLight,marginTop:10,lineHeight:1.7 }}>Institut de beauté à domicile — Ongles, laser & bronzage.</p>
        </div>

        {tab==="reserver"&&<ReservationView session={session} allRdvs={allRdvs} onBooked={handleBooked} onAuth={handleAuth}/>}
        {tab==="mesrdvs"&&(
          <div className="fu">
            <div style={{ fontFamily:"'Cormorant',serif",fontSize:24,color:C.text,marginBottom:24 }}>Mes rendez-vous</div>
            {!session?(
              <div style={{ textAlign:"center",padding:"40px 0",color:C.textLight }}>
                <div style={{ fontSize:14,marginBottom:16 }}>Connectez-vous pour voir vos rendez-vous.</div>
                <PrimaryBtn onClick={()=>setTab("reserver")} style={{ maxWidth:200,margin:"0 auto" }}>Réserver</PrimaryBtn>
              </div>
            ):<MesRdvsView rdvs={clientRdvs} loading={loadingRdvs}/>}
          </div>
        )}
        {tab==="compte"&&(
          <div className="fu">
            <div style={{ fontFamily:"'Cormorant',serif",fontSize:24,color:C.text,marginBottom:24 }}>Mon compte</div>
            {!session?(
              <div style={{ textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14 }}>Connectez-vous d'abord.</div>
            ):(
              <>
                <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"4px 20px",marginBottom:16 }}>
                  {[["Prénom",session.profile?.prenom],["Nom",session.profile?.nom],["Téléphone",session.profile?.tel],["Email",session.user?.email]].map(([k,v])=>(
                    <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${C.borderLight}`,fontSize:14 }}>
                      <span style={{ color:C.textLight }}>{k}</span>
                      <span style={{ color:C.textMid,fontWeight:500 }}>{v||"—"}</span>
                    </div>
                  ))}
                </div>
                <GhostBtn onClick={handleLogout}>Se déconnecter</GhostBtn>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",boxShadow:"0 -4px 20px rgba(0,0,0,.05)" }}>
        {[["reserver","Réserver"],["mesrdvs","Mes RDV"],["compte","Compte"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ flex:1,padding:"14px 8px 20px",background:"none",border:"none",color:tab===id?C.accentDark:C.textLight,fontSize:11,letterSpacing:1.5,textTransform:"uppercase",fontWeight:tab===id?600:400,cursor:"pointer",position:"relative",transition:"color .2s" }}>
            {label}
            {tab===id&&<div style={{ position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2,background:C.accent,borderRadius:1 }}/>}
          </button>
        ))}
        <button onClick={()=>setView("admin")} style={{ padding:"14px 16px 20px",background:"none",border:"none",color:C.borderLight,fontSize:10,letterSpacing:1,cursor:"pointer" }}>⚙</button>
      </div>
    </div>
  );
}
