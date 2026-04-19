import { useState, useEffect, useRef } from "react";

const SUPA_URL = "https://xpackkiprznsrotsohce.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwYWNra2lwcnpuc3JvdHNvaGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTkzMTIsImV4cCI6MjA5MTIzNTMxMn0.BBZzEnIkHfGcrMPoRa8cMp3_KKrlFAnsg8lXQijC9dA";
const SUPA_PUB = "sb_publishable_kwmh9aAwybdtGLZWA7Mqfg_PrsEEuGu";

const api = {
  h: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
  ah: (t) => ({ "apikey": SUPA_KEY, "Authorization": `Bearer ${t}`, "Content-Type": "application/json", "Prefer": "return=representation" }),
  async get(table, q="") { const r=await fetch(`${SUPA_URL}/rest/v1/${table}?${q}`,{headers:this.h}); return r.json(); },
  async post(table, body, token) { const h=token?this.ah(token):{...this.h,"Prefer":"return=representation"}; const r=await fetch(`${SUPA_URL}/rest/v1/${table}`,{method:"POST",headers:h,body:JSON.stringify(body)}); return r.json(); },
  async patch(table, filter, body) { const r=await fetch(`${SUPA_URL}/rest/v1/${table}?${filter}`,{method:"PATCH",headers:{...this.h,"Prefer":"return=representation"},body:JSON.stringify(body)}); return r.json(); },
  async signUp(email, password) { const r=await fetch(`${SUPA_URL}/auth/v1/signup`,{method:"POST",headers:{"apikey":SUPA_PUB,"Content-Type":"application/json"},body:JSON.stringify({email,password})}); return r.json(); },
  async signIn(email, password) { const r=await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"apikey":SUPA_PUB,"Content-Type":"application/json"},body:JSON.stringify({email,password})}); return r.json(); },
  async refreshToken(refresh_token) { const r=await fetch(`${SUPA_URL}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:{"apikey":SUPA_PUB,"Content-Type":"application/json"},body:JSON.stringify({refresh_token})}); return r.json(); },
  async signOut(token) { await fetch(`${SUPA_URL}/auth/v1/logout`,{method:"POST",headers:{"apikey":SUPA_PUB,"Authorization":`Bearer ${token}`}}); },
  async upsert(table, body, token) { const r=await fetch(`${SUPA_URL}/rest/v1/${table}`,{method:"POST",headers:{...this.ah(token),"Prefer":"return=representation,resolution=merge-duplicates"},body:JSON.stringify(body)}); return r.json(); },
};

// ─── SERVICES avec sous-catégories ───────────────────────────────────────────
const SERVICES = [
  {
    id: "ongles", label: "Prothésie Ongulaire", color: "#c4a882",
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
        id: "laser_consult", label: "Consultation", noLock: true,
        prestations: [
          { id:"lc1", nom:"Consultation", duree:30, prix:20, acompte:0 },
        ],
      },
      {
        id: "laser_forfaits", label: "Forfaits 8 séances 🔥 -50%",
        note: "🎉 Prix de lancement — 50% de réduction sur tous les forfaits.",
        prestations: [
          { id:"lf1", nom:"Aisselles + Maillot intégral", duree:55, prix:620, prixNormal:1240, acompte:80 },
          { id:"lf2", nom:"Aisselles + Maillot intégral + Demi-jambes", duree:95, prix:1180, prixNormal:2360, acompte:150 },
          { id:"lf3", nom:"Aisselles + Maillot intégral + Jambes entières", duree:115, prix:1660, prixNormal:3320, acompte:200 },
        ],
      },
      {
        id: "laser_seances", label: "Séances à l'unité",
        prestations: [
          { id:"ls1", nom:"Aisselles", duree:20, prix:45, acompte:15 },
          { id:"ls2", nom:"Maillot simple", duree:25, prix:70, acompte:20 },
          { id:"ls3", nom:"Maillot échancré", duree:30, prix:90, acompte:25 },
          { id:"ls4", nom:"Maillot intégral", duree:35, prix:110, acompte:30 },
          { id:"ls5", nom:"Demi-jambes", duree:40, prix:140, acompte:35 },
          { id:"ls6", nom:"Jambes entières", duree:60, prix:260, acompte:60 },
          { id:"ls7", nom:"Bras", duree:45, prix:160, acompte:40 },
          { id:"ls8", nom:"Ligne ventrale", duree:15, prix:40, acompte:10 },
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

const SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
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
  text:"#f0eaf8", textMid:"#b8a8cc", textLight:"#7a6a8a",
  accent:"#c9a0c0", accentDark:"#9a6090", accentLight:"#2e1e30",
  locked:"#2a2040", lockedText:"#a090c8",
  warn:"#2a2010", warnText:"#c8a840", warnBorder:"#4a3820",
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

function Calendar({selected,onSelect,bookedDates=[],unavailableDates=[],firstAvailable=null}) {
  const t=new Date();
  const [yr,setYr]=useState(()=>{
    if(firstAvailable){const [y]=firstAvailable.split("-");return +y;}
    return t.getFullYear();
  });
  const [mo,setMo]=useState(()=>{
    if(firstAvailable){const [,m]=firstAvailable.split("-");return +m-1;}
    return t.getMonth();
  });
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
          const isPast=s<todayS;
          const isUnavail=unavailableDates.includes(s);
          const isSel=s===selected;
          const isFirst=s===firstAvailable&&!isSel;
          const isDisabled=isPast||isUnavail;
          return (
            <div key={d} onClick={()=>!isDisabled&&onSelect(s)} style={{
              textAlign:"center",padding:"9px 2px",borderRadius:8,position:"relative",
              cursor:isDisabled?"default":"pointer",
              background:isSel?C.accent:isFirst?"#3a2848":"transparent",
              color:isSel?"#fff":isDisabled?C.borderLight:isFirst?C.accent:C.text,
              fontWeight:isSel?600:isFirst?600:400,
              fontSize:13,transition:"all .15s",
              opacity:isUnavail?.35:1,
            }}>
              {d}
              {isFirst&&!isSel&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",fontSize:6,color:C.accent}}>●</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function AuthModal({onAuth,onClose,booking}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState(""),[pw,setPw]=useState("");
  const [prenom,setPrenom]=useState(""),[nom,setNom]=useState(""),[tel,setTel]=useState("");
  const [loading,setLoading]=useState(false),[err,setErr]=useState("");

  const submit=async()=>{
    setErr("");setLoading(true);
    try {
      if(mode==="login"){
        const res=await api.signIn(email,pw);
        if(res.error){setErr("Email ou mot de passe incorrect.");setLoading(false);return;}
        const prof=await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${res.user.id}&select=*`,{headers:{"apikey":SUPA_PUB,"Authorization":`Bearer ${res.access_token}`}}).then(r=>r.json());
        onAuth({user:res.user,token:res.access_token,refresh_token:res.refresh_token,profile:prof[0]||{}});
      } else {
        if(!prenom||!nom||!tel){setErr("Tous les champs sont requis.");setLoading(false);return;}
        const res=await api.signUp(email,pw);
        if(res.error){setErr(res.error.message);setLoading(false);return;}
        if(res.user){
          await api.upsert("profiles",{id:res.user.id,prenom,nom,tel,email},res.access_token);
          onAuth({user:res.user,token:res.access_token,refresh_token:res.refresh_token,profile:{prenom,nom,tel,email}});
        } else setErr("Vérifiez votre email pour confirmer.");
      }
    } catch{setErr("Erreur réseau.");}
    setLoading(false);
  };

  return (
    <div className="fi" style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-end",background:"rgba(38,25,14,.42)",backdropFilter:"blur(6px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="su" style={{width:"100%",maxHeight:"92vh",overflowY:"auto",background:C.surface,borderRadius:"24px 24px 0 0",padding:"28px 24px 52px",boxShadow:"0 -8px 40px rgba(0,0,0,.1)"}}>
        <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 28px"}}/>
        {booking&&(
          <div style={{background:C.accentLight,borderRadius:14,padding:"14px 18px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:C.accentDark}}>{booking.nom}</div>
              <div style={{fontSize:12,color:C.textMid,marginTop:2}}>{fmtLong(booking.date)} · {booking.slot}</div>
            </div>
            <div style={{fontSize:16,fontWeight:700,color:C.accentDark}}>{booking.prix>0?`${booking.prix} €`:"Gratuit"}</div>
          </div>
        )}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,marginBottom:4}}>{mode==="login"?"Connexion":"Créer un compte"}</div>
        <div style={{fontSize:13,color:C.textMid,marginBottom:22}}>{mode==="login"?"Vos infos seront pré-remplies automatiquement.":"Un compte pour gérer vos rendez-vous."}</div>
        <div style={{display:"flex",background:C.surfaceAlt,borderRadius:10,padding:4,marginBottom:20}}>
          {[["login","Se connecter"],["signup","Créer un compte"]].map(([id,label])=>(
            <button key={id} onClick={()=>{setMode(id);setErr("");}} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:mode===id?C.surface:"transparent",color:mode===id?C.text:C.textMid,fontSize:13,fontWeight:mode===id?600:400,boxShadow:mode===id?"0 1px 6px rgba(0,0,0,.07)":"none",transition:"all .2s",cursor:"pointer"}}>{label}</button>
          ))}
        </div>
        {mode==="signup"&&(
          <div className="fu">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:0}}>
              <div style={{marginBottom:12}}><Lbl>Prénom</Lbl><Inp value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Marie"/></div>
              <div style={{marginBottom:12}}><Lbl>Nom</Lbl><Inp value={nom} onChange={e=>setNom(e.target.value)} placeholder="Dupont"/></div>
            </div>
            <div style={{marginBottom:12}}><Lbl>Téléphone</Lbl><Inp value={tel} onChange={e=>setTel(e.target.value)} placeholder="06 00 00 00 00" type="tel"/></div>
          </div>
        )}
        <div style={{marginBottom:12}}><Lbl>Email</Lbl><Inp value={email} onChange={e=>setEmail(e.target.value)} placeholder="marie@email.fr" type="email"/></div>
        <div style={{marginBottom:12}}><Lbl>Mot de passe</Lbl><Inp value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" type="password"/></div>
        {err&&<div style={{fontSize:13,color:"#c05050",marginBottom:14,padding:"10px 14px",background:"#fff0f0",borderRadius:8}}>{err}</div>}
        <PBtn onClick={submit} disabled={loading}>{loading?"Chargement…":mode==="login"?"Confirmer ma réservation":"Créer mon compte et réserver"}</PBtn>
        <div style={{textAlign:"center",fontSize:11,color:C.textLight,marginTop:14,lineHeight:1.6}}>Vos données sont utilisées uniquement pour la gestion de vos rendez-vous.</div>
      </div>
    </div>
  );
}

// ── DATE PICKER Option 1 : Calendrier + créneaux dessous ────────────────────
function PlanityDatePicker({selPresta,allRdvs,allSupaBlocked,selectedDate,selectedSlot,onSelect}) {
  const ALL_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const SEMAINE = ["17:00","17:30","18:00","18:30","19:00"];
  const WEEKEND = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const DAYS_S = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const MONTHS_F = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS_L = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

  const today = new Date();
  const minDate = new Date(today.getTime() + 24*60*60*1000);
  const minDateStr = minDate.toISOString().split("T")[0];

  const [yr, setYr] = useState(today.getFullYear());
  const [mo, setMo] = useState(today.getMonth());

  // Calculer les créneaux dispo pour un jour donné
  const getAvailSlots = (dateStr) => {
    const dow = parseD(dateStr).getDay();
    const isWE = dow===0||dow===6;
    const allowed = isWE ? WEEKEND : SEMAINE;
    const dur = selPresta?.duree||30;
    const slotsNeeded = Math.ceil(dur/30);
    const rdvsDay = allRdvs.filter(r=>r.date===dateStr&&r.statut!=="annulé");
    const supaDay = allSupaBlocked[dateStr]||[];
    const avail = [];
    for(let j=0; j<=allowed.length-slotsNeeded; j++){
      let ok=true;
      for(let k=0;k<slotsNeeded;k++){
        const sl=allowed[j+k];
        if(!sl){ok=false;break;}
        if(supaDay.includes(sl)){ok=false;break;}
        // Vérifier règle 24h : le créneau doit être dans plus de 24h
        const slotDateTime = new Date(`${dateStr}T${sl}:00`);
        if(slotDateTime.getTime() - Date.now() < 24*60*60*1000){ok=false;break;}
        const idx=ALL_SLOTS.indexOf(sl);
        for(const r of rdvsDay){
          const rIdx=ALL_SLOTS.indexOf(r.slot);
          const rEnd=rIdx+Math.ceil((r.duree||30)/30);
          if(idx>=rIdx&&idx<rEnd){ok=false;break;}
        }
        if(!ok)break;
      }
      if(ok) avail.push(allowed[j]);
    }
    return avail;
  };

  // Auto-sélectionner le premier jour dispo au chargement
  useEffect(()=>{
    if(selectedDate) return;
    const d = new Date(minDate);
    for(let i=0;i<60;i++){
      const s = new Date(d.getTime()+i*86400000).toISOString().split("T")[0];
      if(getAvailSlots(s).length>0){
        const [y,m] = s.split("-");
        setYr(+y); setMo(+m-1);
        onSelect(s, null);
        break;
      }
    }
  },[selPresta]);

  const firstDayOfMonth = (new Date(yr,mo,1).getDay()||7)-1;
  const daysInMonth = new Date(yr,mo+1,0).getDate();
  const selectedSlots = selectedDate ? getAvailSlots(selectedDate) : [];

  return (
    <div>
      {/* Calendrier */}
      <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"20px 18px",marginBottom:16}}>
        {/* Nav mois */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <button onClick={()=>mo===0?(setMo(11),setYr(yr-1)):setMo(mo-1)} style={{background:"none",border:"none",color:C.textLight,fontSize:22,cursor:"pointer",padding:"0 8px"}}>‹</button>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:C.text,letterSpacing:.5}}>{MONTHS_F[mo]} {yr}</span>
          <button onClick={()=>mo===11?(setMo(0),setYr(yr+1)):setMo(mo+1)} style={{background:"none",border:"none",color:C.textLight,fontSize:22,cursor:"pointer",padding:"0 8px"}}>›</button>
        </div>
        {/* Jours semaine */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:8}}>
          {DAYS_S.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.textLight,fontWeight:500,letterSpacing:.8,textTransform:"uppercase",paddingBottom:8}}>{d}</div>)}
        </div>
        {/* Cases */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px 0"}}>
          {Array(firstDayOfMonth).fill(null).map((_,i)=><div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const d=i+1;
            const ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const isPast=ds<minDateStr; // minDateStr = demain si avant l'heure min
            const avail=!isPast?getAvailSlots(ds):[];
            const hasDispo=avail.length>0;
            const isSel=ds===selectedDate;
            return (
              <div key={d} onClick={()=>hasDispo&&!isPast&&onSelect(ds,null)} style={{
                textAlign:"center", padding:"8px 2px", borderRadius:8, position:"relative",
                cursor:hasDispo&&!isPast?"pointer":"default",
                background:isSel?C.accent:"transparent",
                color:isSel?"#fff":isPast||!hasDispo?"#3a3040":C.text,
                fontWeight:isSel?700:400, fontSize:13, transition:"all .15s",
              }}>
                {d}
                {/* Point si dispo */}
                {hasDispo&&!isSel&&(
                  <div style={{width:4,height:4,borderRadius:"50%",background:C.accent,position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)"}}/>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Créneaux du jour sélectionné */}
      {selectedDate&&selectedSlots.length>0&&(
        <div className="fu">
          <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>
            {DAYS_L[parseD(selectedDate).getDay()]} {parseD(selectedDate).getDate()} {MONTHS_F[parseD(selectedDate).getMonth()]}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {selectedSlots.map(s=>{
              const active=selectedSlot===s;
              return (
                <div key={s} onClick={()=>onSelect(selectedDate,s)} style={{
                  padding:"12px 4px",textAlign:"center",borderRadius:10,
                  border:`1.5px solid ${active?C.accent:C.border}`,
                  background:active?C.accent:C.surface,
                  color:active?"#fff":C.textMid,
                  fontSize:13,fontWeight:active?700:400,
                  cursor:"pointer",transition:"all .15s",
                }}>
                  {s}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {selectedDate&&selectedSlots.length===0&&(
        <div style={{textAlign:"center",padding:"16px",fontSize:13,color:C.textLight}}>
          Aucun créneau disponible ce jour.
        </div>
      )}
    </div>
  );
}

// ── RÉSERVATION ───────────────────────────────────────────────────────────────
function ReservationView({session,allRdvs,onBooked,laserUnlocked,onAuth}) {
  const [svcId,setSvcId]=useState(null);
  const [openSub,setOpenSub]=useState(null);
  const [selPresta,setSelPresta]=useState(null);
  const [date,setDate]=useState("");
  const [slot,setSlot]=useState("");
  const [showAuth,setShowAuth]=useState(false);
  const [done,setDone]=useState(null);

  const svc=svcId?SERVICES.find(s=>s.id===svcId):null;
  const ALL_SLOTS_RES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const SEMAINE_RES = ["17:00","17:30","18:00","18:30","19:00"];
  const WEEKEND_RES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const [supaBlocked, setSupaBlocked] = useState([]);
  const [allSupaBlocked, setAllSupaBlocked] = useState({}); // {date: [slots]}

  // Charger tous les blocages Supabase une fois la prestation choisie
  useEffect(()=>{
    if(!selPresta) return;
    api.get("blocked_slots","select=date,slot").then(d=>{
      if(!Array.isArray(d)) return;
      const map={};
      d.forEach(r=>{ if(!map[r.date])map[r.date]=[]; map[r.date].push(r.slot); });
      setAllSupaBlocked(map);
    });
  },[selPresta]);

  useEffect(()=>{
    if(!date) return;
    api.get("blocked_slots",`date=eq.${date}&select=slot`).then(d=>{
      if(Array.isArray(d)) setSupaBlocked(d.map(r=>r.slot));
    });
  },[date]);

  // Calculer si un jour est dispo pour la durée de la prestation
  const isDayAvailable = (dateStr) => {
    if(!selPresta) return true;
    const dow = parseD(dateStr).getDay();
    const isWE = dow===0||dow===6;
    const allowed = isWE ? WEEKEND_RES : SEMAINE_RES;
    const dur = selPresta.duree||30;
    const slotsNeeded = Math.ceil(dur/30);
    const rdvsDay = allRdvs.filter(r=>r.date===dateStr&&r.statut!=="annulé");
    const supaDay = allSupaBlocked[dateStr]||[];
    // Pour chaque slot autorisé, vérifier si on peut caser la durée
    for(let i=0;i<=allowed.length-slotsNeeded;i++){
      let ok=true;
      for(let j=0;j<slotsNeeded;j++){
        const s=allowed[i+j];
        if(supaDay.includes(s)){ok=false;break;}
        // Vérifier si ce slot est pris par un RDV existant
        const idx=ALL_SLOTS_RES.indexOf(s);
        for(const r of rdvsDay){
          const rIdx=ALL_SLOTS_RES.indexOf(r.slot);
          const rEnd=rIdx+Math.ceil((r.duree||30)/30);
          if(idx>=rIdx&&idx<rEnd){ok=false;break;}
        }
        if(!ok)break;
      }
      if(ok) return true;
    }
    return false;
  };

  // Calculer les jours indisponibles et le premier dispo sur 60 jours
  const {unavailableDates, firstAvailable} = (() => {
    if(!selPresta) return {unavailableDates:[], firstAvailable:null};
    const unavail=[];
    let first=null;
    const today=new Date();
    for(let i=0;i<60;i++){
      const d=new Date(today);
      d.setDate(today.getDate()+i);
      const s=d.toISOString().split("T")[0];
      if(isDayAvailable(s)){
        if(!first) first=s;
      } else {
        unavail.push(s);
      }
    }
    return {unavailableDates:unavail, firstAvailable:first};
  })();

  // Auto-sélectionner le premier jour dispo quand on choisit une prestation
  useEffect(()=>{
    if(firstAvailable&&!date) setDate(firstAvailable);
  },[firstAvailable]);
  const takenSlots = (() => {
    const blocked = new Set();
    if(date) {
      const dow = parseD(date).getDay();
      const isWE = dow===0||dow===6;
      const allowed = isWE ? WEEKEND_RES : SEMAINE_RES;
      ALL_SLOTS_RES.forEach(s=>{ if(!allowed.includes(s)) blocked.add(s); });
    }
    supaBlocked.forEach(s=>blocked.add(s));
    allRdvs.filter(r=>r.date===date&&r.statut!=="annulé").forEach(r=>{
      const idx=ALL_SLOTS_RES.indexOf(r.slot);
      if(idx===-1) return;
      let mins=0;
      for(let i=idx;i<ALL_SLOTS_RES.length&&mins<(r.duree||30);i++){blocked.add(ALL_SLOTS_RES[i]);mins+=30;}
    });
    return blocked;
  })();

  const r2=useRef(null),r3=useRef(null),r4=useRef(null),r5=useRef(null),doneRef=useRef(null);
  const sc=(ref,d=100)=>setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth",block:"start"}),d);

  const isLocked=(s)=>s.locked&&!laserUnlocked;

  const handleConfirm=async(sess)=>{
    setShowAuth(false);
    if(!selPresta||!date||!slot)return;
    try {
      const rdv={
        user_id:sess.user.id,cat_id:svcId,service:svc.label,
        prestation:selPresta.nom,duree:selPresta.duree,
        prix:selPresta.prix||0,acompte:selPresta.acompte,
        date,slot,
        client_prenom:sess.profile.prenom,client_nom:sess.profile.nom,
        client_tel:sess.profile.tel,client_email:sess.user.email,
        statut:"confirmé",
      };
      const res=await api.post("rdvs",rdv,sess.token);
      if(res&&res[0]){setDone(res[0]);onBooked(res[0]);sc(doneRef);}
    } catch{alert("Erreur lors de la réservation.");}
  };

  const selectPresta=(p,subcat)=>{
    if(selPresta?.id===p.id){setSelPresta(null);setDate("");setSlot("");return;}
    setSelPresta(p);setDate("");setSlot("");sc(r3);
  };

  if(done) return (
    <div ref={doneRef} className="fu" style={{textAlign:"center",padding:"52px 0"}}>
      <div style={{width:56,height:56,borderRadius:"50%",background:C.accentLight,border:`1.5px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",color:C.accentDark,fontSize:22}}>✓</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:C.text,marginBottom:10}}>Rendez-vous confirmé</div>
      <div style={{fontSize:14,color:C.textMid,lineHeight:2,marginBottom:8}}>{done.prestation}<br/>{fmtLong(done.date)} à {done.slot}</div>
      {done.acompte>0&&<div style={{fontSize:13,color:C.accentDark,fontWeight:500,marginBottom:20}}>Acompte {done.acompte} € réglé ✓</div>}
      <div style={{fontSize:12,color:C.textLight,marginBottom:36,lineHeight:1.7}}>Un SMS de rappel vous sera envoyé 24h avant.</div>
      <GBtn onClick={()=>{setDone(null);setSvcId(null);setOpenSub(null);setSelPresta(null);setDate("");setSlot("");}}>Nouvelle réservation</GBtn>
    </div>
  );

  return (
    <div>
      {showAuth&&<AuthModal onAuth={(s)=>{if(onAuth)onAuth(s);handleConfirm(s);}} onClose={()=>setShowAuth(false)} booking={selPresta?{nom:selPresta.nom,date,slot,prix:selPresta.prix||0}:null}/>}

      {/* ── SERVICES ── */}
      <div>
        <Lbl>Choisissez un service</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {SERVICES.map(s=>{
            const active=svcId===s.id;
            const locked=isLocked(s);
            return (
              <div key={s.id} onClick={()=>{
                const newSvc = SERVICES.find(sv=>sv.id===s.id);
                if(svcId!==s.id){setSelPresta(null);setDate("");setSlot("");
                  if(newSvc?.autoOpen) setOpenSub(newSvc.subcats[0].id);
                  else setOpenSub(null);
                }
                setSvcId(s.id);sc(r2);
              }} style={{padding:"18px 20px",borderRadius:14,border:`1.5px solid ${active?s.color:C.border}`,background:active?s.color+"0f":C.surface,cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:active?"0 2px 14px rgba(0,0,0,.05)":"none"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:active?C.text:C.textMid,display:"flex",alignItems:"center",gap:8}}>
                    {s.label}
                    {locked&&!active&&<span style={{fontSize:10,background:C.locked,color:C.lockedText,padding:"2px 8px",borderRadius:10,fontWeight:500}}>Consultation dispo</span>}
                  </div>
                  <div style={{fontSize:12,color:C.textLight,marginTop:3}}>{s.desc}</div>
                </div>
                <div style={{width:8,height:8,borderRadius:"50%",background:active?s.color:C.border,flexShrink:0}}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SOUS-CATÉGORIES ── */}
      {svc&&(
        <div ref={r2} className="fu" style={{marginTop:36}}>
          <Lbl>Prestation</Lbl>
          {isLocked(svc)&&(
            <div style={{marginBottom:14,padding:"12px 16px",background:C.locked+"44",border:`1px solid ${C.locked}`,borderRadius:12,fontSize:13,color:C.lockedText,lineHeight:1.6}}>
              🔒 Les séances sont accessibles après consultation. Réservez d'abord votre consultation.
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {svc.subcats.filter(sub=>!isLocked(svc)||sub.noLock).map(sub=>{
              const isOpen=openSub===sub.id;
              return (
                <div key={sub.id} style={{borderRadius:14,border:`1.5px solid ${isOpen?C.accent:C.border}`,overflow:"hidden",background:C.surface,transition:"all .2s"}}>
                  {/* Header sous-cat */}
                  <div onClick={()=>setOpenSub(isOpen?null:sub.id)} style={{padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",background:isOpen?C.accentLight:"transparent",transition:"background .2s"}}>
                    <span style={{fontSize:15,fontWeight:isOpen?600:500,color:isOpen?C.accentDark:C.text}}>{sub.label}</span>
                    <span style={{color:isOpen?C.accent:C.textLight,fontSize:18,transition:"transform .2s",display:"inline-block",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
                  </div>
                  {/* Prestations */}
                  {isOpen&&(
                    <div>
                      {sub.note&&<div style={{padding:"10px 18px",background:C.warn,borderBottom:`1px solid ${C.warnBorder}`,fontSize:12,color:C.warnText,lineHeight:1.6}}>{sub.note}</div>}
                      {sub.prestations.map((p,i)=>{
                        const active=selPresta?.id===p.id;
                        return (
                          <div key={p.id} onClick={()=>!p.devis&&selectPresta(p,sub)} style={{padding:"14px 18px",borderTop:i>0?`1px solid ${C.borderLight}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center",background:active?C.accentLight:"transparent",cursor:p.devis?"default":"pointer",transition:"background .15s"}}>
                            <div>
                              <div style={{fontSize:14,fontWeight:active?600:400,color:active?C.accentDark:C.text}}>{p.nom}</div>
                              <div style={{fontSize:12,color:C.textLight,marginTop:2}}>{p.duree} min</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              {p.devis
                                ?<span style={{fontSize:14,fontWeight:600,color:C.lockedText}}>Sur devis</span>
                                :<>
                                  {p.prixNormal&&<div style={{fontSize:11,color:C.textLight,textDecoration:"line-through",marginBottom:1}}>{p.prixNormal} €</div>}
                                  <div style={{fontSize:15,fontWeight:700,color:p.prixNormal?"#e07070":active?C.accentDark:C.textMid}}>{p.prix} €</div>
                                  {p.prixNormal&&<div style={{fontSize:10,color:"#e07070",fontWeight:700,letterSpacing:.5}}>-50%</div>}
                                </>
                              }
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

      {/* ── DATE & HORAIRES style Planity ── */}
      {selPresta&&(
        <div ref={r3} className="fu" style={{marginTop:36}}>
          <Lbl>Date &amp; horaire</Lbl>
          <PlanityDatePicker
            selPresta={selPresta}
            allRdvs={allRdvs}
            allSupaBlocked={allSupaBlocked}
            selectedDate={date}
            selectedSlot={slot}
            onSelect={(d,s)=>{
              setDate(d);
              if(s) { setSlot(s); sc(r5); }
              else setSlot("");
            }}
          />
        </div>
      )}

      {/* ── RÉCAP ── */}
      {slot&&(
        <div ref={r5} className="fu" style={{marginTop:36}}>
          <Lbl>Récapitulatif</Lbl>
          <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"20px",marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,.03)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:14,borderBottom:`1px solid ${C.borderLight}`,marginBottom:14}}>
              <div>
                <div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:4}}>{selPresta.nom}</div>
                <div style={{fontSize:13,color:C.textMid}}>{svc?.label} · {selPresta.duree} min</div>
              </div>
              <div style={{fontSize:18,fontWeight:700,color:C.accentDark}}>{selPresta.prix>0?`${selPresta.prix} €`:"Offert"}</div>
            </div>
            {[["Date",fmtLong(date)],["Heure",slot]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0"}}>
                <span style={{color:C.textLight}}>{k}</span><span style={{color:C.textMid,fontWeight:500}}>{v}</span>
              </div>
            ))}

          </div>

          <PBtn onClick={()=>{
            if(session){
              // Vérifier que le slot est bien défini
              if(!slot){alert("Veuillez sélectionner un créneau horaire.");return;}
              if(!date){alert("Veuillez sélectionner une date.");return;}
              handleConfirm(session);
            } else {
              setShowAuth(true);
            }
          }}>
            {session?"Confirmer le rendez-vous":"Continuer pour confirmer"}
          </PBtn>
          {!session&&<div style={{textAlign:"center",fontSize:12,color:C.textLight,marginTop:10}}>Connexion requise pour finaliser</div>}
          <div style={{textAlign:"center",fontSize:11,color:C.textLight,marginTop:8}}>Annulation sans frais jusqu'à 24h avant</div>
        </div>
      )}
    </div>
  );
}

// ── MES RDV ───────────────────────────────────────────────────────────────────
function MesRdvsView({rdvs,loading}) {
  const up=rdvs.filter(r=>r.date>=todayStr()&&r.statut!=="annulé").sort((a,b)=>a.date.localeCompare(b.date));
  const past=rdvs.filter(r=>r.date<todayStr()||r.statut==="annulé").sort((a,b)=>b.date.localeCompare(a.date));
  const svcColor=(catId)=>SERVICES.find(s=>s.id===catId)?.color||C.accent;
  const canCancel=(r)=>{
    const rdvDate=new Date(`${r.date}T${r.slot}:00`);
    const now=new Date();
    return rdvDate.getTime()-now.getTime()>24*60*60*1000;
  };
  const handleCancel=async(r)=>{
    if(!confirm("Annuler ce rendez-vous ?")) return;
    await api.patch("rdvs",`id=eq.${r.id}`,{statut:"annulé"});
    window.location.reload();
  };
  const Card=({r})=>(
    <div style={{padding:"16px 0",borderBottom:`1px solid ${C.borderLight}`,display:"flex",gap:14,alignItems:"flex-start",opacity:r.statut==="annulé"?.4:1}}>
      <div style={{width:3,alignSelf:"stretch",borderRadius:2,background:svcColor(r.cat_id),flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:3}}>{r.prestation}</div>
            <div style={{fontSize:12,color:C.textMid}}>{fmtLong(r.date)} · {r.slot}</div>
            {r.statut==="annulé"&&<div style={{fontSize:11,color:"#c05050",marginTop:4}}>Annulé</div>}
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:14,fontWeight:700,color:C.textMid}}>{r.prix} €</div>
          </div>
        </div>
        {r.statut!=="annulé"&&r.date>=todayStr()&&(
          canCancel(r)
            ?<button onClick={()=>handleCancel(r)} style={{marginTop:10,fontSize:12,color:"#c05050",background:"none",border:"1px solid #3a1a1a",borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>Annuler</button>
            :<div style={{marginTop:8,fontSize:11,color:C.textLight,fontStyle:"italic"}}>Annulation impossible — moins de 24h</div>
        )}
      </div>
    </div>
  );
  if(loading) return <div style={{textAlign:"center",padding:48,color:C.textLight,fontSize:14}}>Chargement…</div>;
  return (
    <div>
      {up.length>0&&<div style={{marginBottom:32}}><Lbl>À venir</Lbl>{up.map(r=><Card key={r.id} r={r}/>)}</div>}
      {past.length>0&&<div><Lbl>Historique</Lbl>{past.map(r=><Card key={r.id} r={r}/>)}</div>}
      {up.length===0&&past.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:C.textLight,fontSize:14}}>Aucun rendez-vous pour l'instant.</div>}
    </div>
  );
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function PlanningAdmin() {
  const ALL_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const SEMAINE = ["17:00","17:30","18:00","18:30","19:00"];
  const WEEKEND = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
  const [selDate, setSelDate] = useState(todayStr());
  const [supaBlocked, setSupaBlocked] = useState([]);
  const [saving, setSaving] = useState(false);

  const dow = selDate ? parseD(selDate).getDay() : 1;
  const isWE = dow===0||dow===6;
  const autoAllowed = isWE ? WEEKEND : SEMAINE;

  const loadBlocked = async (date) => {
    const d = await api.get("blocked_slots", `date=eq.${date}&select=slot`);
    if(Array.isArray(d)) setSupaBlocked(d.map(r=>r.slot));
  };

  useEffect(()=>{ loadBlocked(selDate); },[selDate]);

  const isAutoBlocked = (slot) => !autoAllowed.includes(slot);
  const isManualBlocked = (slot) => supaBlocked.includes(slot);

  const toggleSlot = async (slot) => {
    if(isAutoBlocked(slot)) return;
    setSaving(true);
    if(isManualBlocked(slot)) {
      await fetch(`${SUPA_URL}/rest/v1/blocked_slots?date=eq.${selDate}&slot=eq.${encodeURIComponent(slot)}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
      setSupaBlocked(p=>p.filter(s=>s!==slot));
    } else {
      await api.post("blocked_slots",{date:selDate,slot});
      setSupaBlocked(p=>[...p,slot]);
    }
    setSaving(false);
  };

  const blockFullDay = async () => {
    setSaving(true);
    const toBlock = autoAllowed.filter(s=>!supaBlocked.includes(s));
    for(const slot of toBlock) await api.post("blocked_slots",{date:selDate,slot});
    setSupaBlocked(autoAllowed);
    setSaving(false);
  };

  const unblockFullDay = async () => {
    setSaving(true);
    await fetch(`${SUPA_URL}/rest/v1/blocked_slots?date=eq.${selDate}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
    setSupaBlocked([]);
    setSaving(false);
  };

  return (
    <div>
      <div style={{marginBottom:20,padding:"12px 16px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,fontSize:12,color:C.textMid,lineHeight:1.8}}>
        <span style={{color:C.accentDark,fontWeight:600}}>■</span> Ouvert &nbsp;·&nbsp;
        <span style={{color:"#f07070",fontWeight:600}}>■</span> Bloqué par toi &nbsp;·&nbsp;
        <span style={{color:C.textLight,fontWeight:600}}>■</span> Hors horaires
      </div>
      <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"20px 18px",marginBottom:20}}>
        <Calendar selected={selDate} onSelect={setSelDate} bookedDates={[]}/>
      </div>
      <div style={{fontSize:13,fontWeight:600,color:C.textMid,marginBottom:12}}>{fmtLong(selDate)}</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={blockFullDay} disabled={saving} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:C.textMid,fontSize:12,cursor:"pointer"}}>Bloquer toute la journée</button>
        <button onClick={unblockFullDay} disabled={saving} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:C.textMid,fontSize:12,cursor:"pointer"}}>Tout débloquer</button>
      </div>
      {saving && <div style={{textAlign:"center",fontSize:12,color:C.textLight,marginBottom:12}}>Sauvegarde…</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {ALL_SLOTS.map(s=>{
          const autoB=isAutoBlocked(s), manualB=isManualBlocked(s);
          return (
            <div key={s} onClick={()=>toggleSlot(s)} style={{
              padding:"11px 4px", textAlign:"center", borderRadius:10,
              border:`1.5px solid ${manualB?"#c05050":autoB?C.border:C.accent}`,
              background: manualB?"#2a1010":autoB?C.surfaceAlt:C.accentLight,
              color: manualB?"#f07070":autoB?C.textLight:C.accentDark,
              fontSize:13, cursor:autoB?"default":"pointer", transition:"all .15s",
              fontWeight:(!autoB&&!manualB)?600:400,
            }}>
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminView({onExit}) {
  const [code,setCode]=useState(""),[isUnlocked,setIsUnlocked]=useState(false);
  const [rdvs,setRdvs]=useState([]),[profs,setProfs]=useState([]);
  const [loading,setLoading]=useState(false),[tab,setTab]=useState("today");
  const [laserAccess,setLaserAccess]=useState(()=>{try{return JSON.parse(localStorage.getItem("laser_access")||"{}");}catch{return {};}});

  const load=async()=>{
    setLoading(true);
    const [d,p]=await Promise.all([api.get("rdvs","select=*&order=date.asc,slot.asc"),api.get("profiles","select=*")]);
    if(Array.isArray(d))setRdvs(d);
    if(Array.isArray(p))setProfs(p);
    setLoading(false);
  };

  const toggleLaser=(uid)=>{
    const updated={...laserAccess,[uid]:!laserAccess[uid]};
    setLaserAccess(updated);
    localStorage.setItem("laser_access",JSON.stringify(updated));
  };

  const cancel=async(id)=>{
    if(!confirm("Annuler ce rendez-vous ?"))return;
    await api.patch("rdvs",`id=eq.${id}`,{statut:"annulé"});
    setRdvs(p=>p.map(r=>r.id===id?{...r,statut:"annulé"}:r));
  };

  if(!isUnlocked) return (
    <div className="fu" style={{padding:"0 20px",maxWidth:360,margin:"0 auto",paddingTop:60}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:C.text,marginBottom:8}}>Administration</div>
      <div style={{marginBottom:12}}><Lbl>Code d'accès</Lbl><Inp value={code} onChange={e=>setCode(e.target.value)} type="password" placeholder="••••••••••"/></div>
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <GBtn onClick={onExit}>Retour</GBtn>
        <PBtn onClick={()=>{if(code==="2604"){setIsUnlocked(true);load();}else alert("Code incorrect");}}>Accéder</PBtn>
      </div>
    </div>
  );

  const confirmes=rdvs.filter(r=>r.statut==="confirmé");
  const todayRdvs=rdvs.filter(r=>r.date===todayStr()&&r.statut!=="annulé").sort((a,b)=>a.slot.localeCompare(b.slot));
  const upcoming=rdvs.filter(r=>r.date>=todayStr()&&r.statut!=="annulé").sort((a,b)=>a.date.localeCompare(b.date)||a.slot.localeCompare(b.slot));
  const groupByDate=list=>{const g={};list.forEach(r=>{if(!g[r.date])g[r.date]=[];g[r.date].push(r);});return g;};
  const svcColor=(catId)=>SERVICES.find(s=>s.id===catId)?.color||C.accent;

  const Row=({r})=>(
    <div style={{padding:"16px 0",borderBottom:`1px solid ${C.borderLight}`,display:"flex",gap:14,alignItems:"flex-start",opacity:r.statut==="annulé"?.35:1}}>
      <div style={{minWidth:44}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text}}>{r.slot}</div>
        <div style={{fontSize:11,color:C.textLight,marginTop:2}}>{r.duree}min</div>
      </div>
      <div style={{width:3,alignSelf:"stretch",borderRadius:2,background:svcColor(r.cat_id),flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:2}}>{r.prestation}</div>
            <div style={{fontSize:12,color:C.textMid}}>{r.client_prenom} {r.client_nom} · {r.client_tel}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:14,fontWeight:700,color:C.textMid}}>{r.prix} €</div>

          </div>
        </div>
        {r.statut!=="annulé"&&(
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <a href={`tel:${r.client_tel}`} style={{fontSize:12,color:C.textMid,textDecoration:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px"}}>Appeler</a>
            <button onClick={()=>cancel(r.id)} style={{fontSize:12,color:"#c05050",background:"none",border:"1px solid #f0d0d0",borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>Annuler</button>
          </div>
        )}
        {r.statut==="annulé"&&<div style={{fontSize:11,color:"#c05050",marginTop:6}}>Annulé</div>}
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"0 20px 100px"}}>
      <div style={{paddingTop:48,paddingBottom:32}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:10,letterSpacing:2.5,textTransform:"uppercase",color:C.textLight,marginBottom:10}}>Administration</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:C.text,letterSpacing:4,textTransform:"uppercase"}}>Neylika</div>
          </div>
          <button onClick={onExit} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMid,padding:"8px 14px",fontSize:12,cursor:"pointer"}}>Quitter</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:24}}>
          {[[confirmes.length,"RDV"],[confirmes.reduce((s,r)=>s+r.prix,0)+" €","CA"],[confirmes.reduce((s,r)=>s+r.acompte,0)+" €","Acomptes"]].map(([v,l],i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 14px",boxShadow:"0 1px 8px rgba(0,0,0,.04)"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,marginBottom:4}}>{v}</div>
              <div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.textLight}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:24,overflowX:"auto"}}>
        {[["today","Aujourd'hui"],["upcoming","À venir"],["all","Tous"],["planning","Planning"],["laser","Laser 🔒"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,padding:"11px 10px",background:"none",border:"none",borderBottom:`2px solid ${tab===id?C.accent:"transparent"}`,color:tab===id?C.accentDark:C.textLight,fontSize:11,fontWeight:tab===id?600:400,marginBottom:-1,letterSpacing:.3,cursor:"pointer"}}>{label}</button>
        ))}
      </div>

      {loading&&<div style={{textAlign:"center",padding:40,color:C.textLight}}>Chargement…</div>}

      {!loading&&tab==="today"&&(
        <div>
          <div style={{fontSize:12,color:C.textLight,marginBottom:16}}>{fmtLong(todayStr())}</div>
          {todayRdvs.length===0?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Aucun rendez-vous aujourd'hui.</div>:todayRdvs.map(r=><Row key={r.id} r={r}/>)}
        </div>
      )}
      {!loading&&tab==="upcoming"&&(
        <div>
          {upcoming.length===0?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Aucun rendez-vous à venir.</div>
            :Object.entries(groupByDate(upcoming)).map(([d,list])=>(
              <div key={d} style={{marginBottom:28}}>
                <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.textLight,marginBottom:12}}>{fmtLong(d)}</div>
                {list.map(r=><Row key={r.id} r={r}/>)}
              </div>
            ))}
        </div>
      )}
      {!loading&&tab==="all"&&(
        <div>
          {rdvs.length===0?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Aucun rendez-vous.</div>
            :Object.entries(groupByDate([...rdvs].sort((a,b)=>b.date.localeCompare(a.date)))).map(([d,list])=>(
              <div key={d} style={{marginBottom:28}}>
                <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.textLight,marginBottom:12}}>{fmtLong(d)}</div>
                {list.map(r=><Row key={r.id} r={r}/>)}
              </div>
            ))}
        </div>
      )}
      {!loading&&tab==="planning"&&(
        <PlanningAdmin/>
      )}
      {!loading&&tab==="laser"&&(
        <div>
          <div style={{padding:"14px 18px",background:C.locked+"44",border:`1px solid ${C.locked}`,borderRadius:12,marginBottom:24,fontSize:13,color:C.lockedText,lineHeight:1.7}}>
            Activez l'accès laser pour chaque cliente vue en consultation. Elle pourra ensuite réserver ses séances.
          </div>
          {profs.length===0?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Aucune cliente inscrite.</div>
            :profs.map(p=>{
              const hasAccess=laserAccess[p.id];
              const nb=rdvs.filter(r=>r.user_id===p.id&&r.cat_id==="laser").length;
              return (
                <div key={p.id} style={{padding:"16px 0",borderBottom:`1px solid ${C.borderLight}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.text}}>{p.prenom} {p.nom}</div>
                    <div style={{fontSize:12,color:C.textMid,marginTop:2}}>{p.tel} · {nb} séance{nb>1?"s":""} laser</div>
                  </div>
                  <div onClick={()=>toggleLaser(p.id)} style={{width:50,height:28,borderRadius:14,background:hasAccess?C.accent:C.border,position:"relative",cursor:"pointer",transition:"background .25s",flexShrink:0}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:hasAccess?25:3,transition:"left .25s",boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}/>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
      {!loading&&(
        <div style={{marginTop:48}}>
          <Lbl>Répartition par service</Lbl>
          {SERVICES.map(s=>{
            const nb=confirmes.filter(r=>r.cat_id===s.id).length;
            const ca=confirmes.filter(r=>r.cat_id===s.id).reduce((a,r)=>a+r.prix,0);
            const pct=confirmes.length>0?(nb/confirmes.length)*100:0;
            return (
              <div key={s.id} style={{marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:13,color:C.textMid}}>{s.label}</span>
                  <span style={{fontSize:13,color:C.textLight}}>{nb} RDV · {ca} €</span>
                </div>
                <div style={{height:3,background:C.surfaceAlt,borderRadius:3}}>
                  <div style={{height:"100%",width:`${pct}%`,background:s.color,borderRadius:3,transition:"width .8s ease"}}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [session,setSession]=useState(null);
  const [view,setView]=useState("main");
  const [tab,setTab]=useState("reserver");
  const [allRdvs,setAllRdvs]=useState([]);
  const [clientRdvs,setClientRdvs]=useState([]);
  const [loadingRdvs,setLoadingRdvs]=useState(false);
  const [toast,setToast]=useState(null);
  const [laserAccess,setLaserAccess]=useState(()=>{try{return JSON.parse(localStorage.getItem("laser_access")||"{}");}catch{return {};}});
  const [showLoginModal,setShowLoginModal]=useState(false);

  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};

  useEffect(()=>{
    api.get("rdvs","select=*&order=date.asc").then(d=>{if(Array.isArray(d))setAllRdvs(d);});
    const saved=localStorage.getItem("nlb_sess");
    if(saved){try{setSession(JSON.parse(saved));}catch{}}
    const onStorage=()=>setLaserAccess(()=>{try{return JSON.parse(localStorage.getItem("laser_access")||"{}");}catch{return {};}});
    window.addEventListener("storage",onStorage);
    return ()=>window.removeEventListener("storage",onStorage);
  },[]);

  useEffect(()=>{
    if(!session)return;
    setLoadingRdvs(true);
    api.get("rdvs",`select=*&user_id=eq.${session.user.id}&order=date.asc`).then(d=>{if(Array.isArray(d))setClientRdvs(d);setLoadingRdvs(false);});
  },[session]);

  const handleAuth=(s)=>{setSession(s);localStorage.setItem("nlb_sess",JSON.stringify(s));showToast(`Bienvenue ${s.profile?.prenom||""} !`);};
  
  // Refresh automatique du token toutes les 50 minutes
  useEffect(()=>{
    const interval = setInterval(async()=>{
      const saved = localStorage.getItem("nlb_sess");
      if(!saved) return;
      try {
        const s = JSON.parse(saved);
        if(!s.refresh_token) return;
        const res = await api.refreshToken(s.refresh_token);
        if(res.access_token) {
          const newSession = {...s, token: res.access_token, refresh_token: res.refresh_token||s.refresh_token};
          setSession(newSession);
          localStorage.setItem("nlb_sess", JSON.stringify(newSession));
        }
      } catch(e) { console.log("Refresh failed:", e); }
    }, 50*60*1000);
    return ()=>clearInterval(interval);
  },[]);
  const handleBooked=(rdv)=>{setAllRdvs(p=>[...p,rdv]);setClientRdvs(p=>[...p,rdv]);setTab("mesrdvs");showToast("Rendez-vous confirmé !");};
  const handleLogout=async()=>{if(session?.token)await api.signOut(session.token);localStorage.removeItem("nlb_sess");setSession(null);setClientRdvs([]);showToast("Déconnecté·e");};

  const laserUnlocked=session?(laserAccess[session.user?.id]||false):false;

  if(view==="admin") return <div style={{minHeight:"100vh",background:C.bg}}><GS/>{toast&&<Toast {...toast}/>}<AdminView onExit={()=>setView("main")}/></div>;

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <GS/>
      {toast&&<Toast {...toast}/>}
      {showLoginModal&&<AuthModal onAuth={(s)=>{handleAuth(s);setShowLoginModal(false);setTab("compte");}} onClose={()=>setShowLoginModal(false)} booking={null}/>}
      <div style={{maxWidth:520,margin:"0 auto",padding:"0 20px 100px"}}>
        <div style={{paddingTop:48,paddingBottom:36}}>
          <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:C.textLight,marginBottom:12}}>Institut de beauté · Toulouse</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:300,color:C.text,lineHeight:1,letterSpacing:6,textTransform:"uppercase"}}>Neylika</h1>
            {session?(
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:500,color:C.textMid}}>{session.profile?.prenom}</div>
                <button onClick={handleLogout} style={{fontSize:11,color:C.textLight,background:"none",border:"none",cursor:"pointer",marginTop:2}}>Déconnexion</button>
              </div>
            ):(
              <button onClick={()=>setShowLoginModal(true)} style={{fontSize:12,color:C.textMid,background:"none",border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 14px",cursor:"pointer"}}>Se connecter</button>
            )}
          </div>
          <p style={{fontSize:12,color:C.textLight,marginTop:10,lineHeight:1.7,letterSpacing:1,fontStyle:"italic"}}>Ton espace beauté à domicile · Ongles · Laser · Bronzage</p>
        </div>

        {tab==="reserver"&&<ReservationView session={session} allRdvs={allRdvs} onBooked={handleBooked} laserUnlocked={laserUnlocked} onAuth={handleAuth}/>}

        {tab==="mesrdvs"&&(
          <div className="fu">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,marginBottom:24}}>Mes rendez-vous</div>
            {!session?<div style={{textAlign:"center",padding:"48px 0",color:C.textLight}}><div style={{fontSize:14,marginBottom:20}}>Connectez-vous pour voir vos rendez-vous.</div><PBtn onClick={()=>setTab("reserver")} style={{maxWidth:220,margin:"0 auto"}}>Réserver</PBtn></div>:<MesRdvsView rdvs={clientRdvs} loading={loadingRdvs}/>}
          </div>
        )}

        {tab==="compte"&&(
          <div className="fu">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,marginBottom:24}}>Mon compte</div>
            {!session?<div style={{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:14}}>Connectez-vous d'abord.</div>:(
              <>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"4px 20px",marginBottom:16}}>
                  {[["Prénom",session.profile?.prenom],["Nom",session.profile?.nom],["Téléphone",session.profile?.tel],["Email",session.user?.email]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${C.borderLight}`,fontSize:14}}>
                      <span style={{color:C.textLight}}>{k}</span><span style={{color:C.textMid,fontWeight:500}}>{v||"—"}</span>
                    </div>
                  ))}
                </div>
                {laserUnlocked&&<div style={{padding:"12px 16px",background:C.locked+"44",border:`1px solid ${C.locked}`,borderRadius:12,marginBottom:16,fontSize:13,color:C.lockedText}}>✓ Accès laser activé — vous pouvez réserver vos séances.</div>}
                <GBtn onClick={handleLogout}>Se déconnecter</GBtn>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",boxShadow:"0 -4px 18px rgba(0,0,0,.05)"}}>
        {[["reserver","Réserver"],["mesrdvs","Mes RDV"],["compte","Compte"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"14px 8px 20px",background:"none",border:"none",color:tab===id?C.accentDark:C.textLight,fontSize:11,letterSpacing:1.5,textTransform:"uppercase",fontWeight:tab===id?600:400,cursor:"pointer",position:"relative",transition:"color .2s"}}>
            {label}
            {tab===id&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2,background:C.accent,borderRadius:1}}/>}
          </button>
        ))}
        <button onClick={()=>setView("admin")} style={{padding:"14px 16px 20px",background:"none",border:"none",color:C.borderLight,fontSize:10,letterSpacing:1,cursor:"pointer"}}>⚙</button>
      </div>
    </div>
  );
}
