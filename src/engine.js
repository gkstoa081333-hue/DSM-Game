// ===================== 설정 =====================
const TIERS=[
 {n:"미생",c:"#9aa1b5",e:"🌱"},
 {n:"수련준비생",c:"#4fd1a0",e:"📘"},
 {n:"수련생",c:"#4da3ff",e:"🩺"},
 {n:"전문요원",c:"#b46cff",e:"🎖️"},
 {n:"퇴사",c:"#ffc94d",e:"🏖️"}
];
const ROMAN=["","Ⅰ","Ⅱ","Ⅲ","Ⅳ"];
const TOP=TIERS.length-1;
// 영역별 보스 (질환이 아니라 '시험 관문'을 지키는 캐릭터)
const BOSS={
 [D1]:{e:"📚",n:"DSM 대사서"},
 [D2]:{e:"🔮",n:"스펙트럼 예언자"},
 [D3]:{e:"🌗",n:"달의 수호자"},
 [D4]:{e:"🛡️",n:"긴장의 문지기"},
 [D5]:{e:"🎭",n:"가면의 기사"},
 [D6]:{e:"⏳",n:"기억의 시계공"},
 [D7]:{e:"⚗️",n:"약물 연금술사"},
 [D8]:{e:"⚖️",n:"법정의 심판관"},
 [D9]:{e:"🧠",n:"무의식의 현자"},
 [D10]:{e:"🌙",n:"꿈의 파수꾼"},
 [D11]:{e:"📜",n:"법조문 수호자"}
};
const CORE=[D2,D3,D4,D6,D7];
const DOMS=[D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11];
// LP 규칙
const LP={ok:4,ng:-6,idk:-2,comboMax:1,kill:5,allClear:10,wipe:-10,demoteTo:75,promoFail:70};

// ===================== 저장 =====================
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(_){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
const raw=store.get("pt_v3",null);
const S=raw||{rank:{t:0,d:4,lp:0,promo:false},rec:{games:0,clears:0,surv:0,ta:0,peak:0}};
const seen=new Set(raw?raw.seen:store.get("dsm_seen",[]));
const wrong=new Set(raw?raw.wrong:store.get("dsm_wrong",[]));
const codex=new Set(raw?raw.codex:[]);
function save(){store.set("pt_v3",{rank:S.rank,rec:S.rec,seen:[...seen],wrong:[...wrong],codex:[...codex]});if(typeof scheduleSync==="function")scheduleSync()}

// ===================== 유틸 =====================
const app=document.getElementById("app");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuf=a=>{for(let k=a.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a};
const goTop=()=>{try{window.scrollTo({top:0,behavior:"smooth"})}catch(_){}};
function toQ(id){const b=BANK[id],o=shuf(b[2].slice());return {id,d:b[0],q:b[1],o,a:o.indexOf(b[2][0]),e:b[3]}}
function pickIds(pool,n,ex){ex=ex||new Set();const f=shuf(pool.filter(i=>!seen.has(i)&&!ex.has(i))),o=shuf(pool.filter(i=>seen.has(i)&&!ex.has(i)));return f.concat(o).slice(0,n)}
const idsOf=d=>BANK.map((_,i)=>i).filter(i=>BANK[i][0]===d);
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(_){}}
function floatText(t,color){const d=document.createElement("div");d.className="float";d.textContent=t;if(color)d.style.color=color;document.body.appendChild(d);setTimeout(()=>d.remove(),1100)}
function rankLabel(r){return TIERS[r.t].n+(r.t<TOP?" "+ROMAN[r.d]:"")}
function rankScore(r){return r.t*400+(r.t<TOP?(4-r.d)*100:0)+r.lp}
function emblem(r,size){const T=TIERS[r.t];return `<div class="emblem" style="--tc:${T.c};width:${size}px;height:${size}px;font-size:${size*.42}px"><span>${T.e}</span></div>`}

// 출처·검수 상태·신고 링크
const REPO="https://github.com/gkstoa081333-hue/DSM-Game";
function srcLine(id){
  const m=META[id]||{};const s=m.src||{};
  const t=s.u?`<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t||"출처")}</a>`:esc(s.t||"");
  return `<div class="src">${m.st==="draft"?`<span class="badge">검수 전</span>`:""}${t?`<span>출처: ${t}</span>`:""}<button class="rep" data-rep="${id}">🚩 문제 신고</button></div><div class="repbox" id="rep-${id}"></div>`;
}

// 문항 판정: 기록(본 문제·오답노트·도감)을 바로 반영
function judge(q,k){
  seen.add(q.id);
  let r;
  if(k===-1)r="idk";else if(k===q.a)r="ok";else r="ng";
  if(r==="ok"){wrong.delete(q.id);codex.add(q.id)}else wrong.add(q.id);
  save();return r;
}

// ===================== 랭크/LP =====================
function applyLP(delta){
  const r=S.rank,ev=[];
  if(r.promo)return ev; // 승급전 대기 중에는 LP 고정
  r.lp+=delta;
  if(r.t===TOP){if(r.lp<0)r.lp=0;return ev}
  while(r.lp>=100&&r.d>1){r.lp-=100;r.d--;ev.push({k:"up",t:rankLabel(r)})}
  if(r.d===1&&r.lp>=100){r.lp=100;r.promo=true;ev.push({k:"promo",t:`${TIERS[r.t+1].n} 승급전 진입!`})}
  if(r.lp<0){if(r.d<4){r.d++;r.lp+=LP.demoteTo;ev.push({k:"down",t:rankLabel(r)})}else r.lp=0}
  S.rec.peak=Math.max(S.rec.peak,rankScore(r));
  return ev;
}

// ===================== 공통 문제 카드 =====================
function qCard(q,r,opt){
  opt=opt||{};const hid=opt.hidden||new Set();
  const btns=q.o.map((t,k)=>{
    if(!r&&hid.has(k))return `<button class="opt gone" disabled>${k+1}. ─</button>`;
    let c="";if(r){if(k===q.a)c="ok";else if(k===q.pick)c="ng"}
    return `<button class="opt ${c}" data-k="${k}" ${r?"disabled":""}>${k+1}. ${esc(t)}</button>`}).join("");
  const head=r==="ok"?"정답!":r==="ng"?(q.timeout?"⏰ 시간 초과! 정답은 ":"아쉬워요, 정답은 ")+(q.a+1)+"번":"정답은 "+(q.a+1)+"번이에요";
  return `<div class="card" id="qc">
   <div class="meta"><span class="tag">${q.d}</span><span>${opt.counter||""}</span></div>
   <p class="q">${esc(q.q)}</p>${btns}
   ${opt.noIdk?"":`<button class="idkbtn" id="idk" ${r?"disabled":""}>🤔 모름 (정답 보기)</button>`}
   ${r?`<div class="fb ${r}"><div class="h">${head}${opt.gain?`<span class="gain">${opt.gain}</span>`:""}</div>${esc(q.e)}${srcLine(q.id)}</div>
   <div class="nav"><button class="btn" id="next">${opt.nextLabel||"다음 →"}</button></div>`:""}
  </div>`;
}
function bindQ(onPick,onNext){
  app.querySelectorAll(".opt[data-k]").forEach(b=>b.onclick=()=>onPick(+b.dataset.k));
  const i=document.getElementById("idk");if(i)i.onclick=()=>onPick(-1);
  const n=document.getElementById("next");if(n)n.onclick=onNext;
  app.querySelectorAll("[data-rep]").forEach(b=>b.onclick=()=>openReport(+b.dataset.rep));
}

// ===================== 로비 =====================
let timer=null;
function lobby(){
  clearInterval(timer);
  const r=S.rank,T=TIERS[r.t];
  const unseen=BANK.length-[...seen].filter(i=>i<BANK.length).length;
  const lpPct=r.t===TOP?100:Math.min(100,r.lp);
  app.innerHTML=`
  <div class="card rankcard" style="--tc:${T.c}">
    ${emblem(r,92)}
    <div class="rk-name">${rankLabel(r)}</div>
    <div class="rk-sub">${r.t===TOP?`LP ${r.lp} · 최고 등급 달성`:`${r.lp} / 100 LP`}</div>
    ${r.t<TOP?`<div class="lpbar"><i style="width:${lpPct}%"></i></div>`:""}
    <div class="ladder">${TIERS.map((x,k)=>`<span class="${k===r.t?"on":k<r.t?"done":""}" style="--tc:${x.c}">${x.e}<small>${x.n}</small></span>`).join("")}</div>
    <div class="install" id="inst"></div>
    ${r.promo?`<button class="btn big promo-btn" id="promo">🏆 ${TIERS[r.t+1].n} 승급전 도전</button>`:""}
  </div>
  <div class="modes">
    <button class="mode main" id="m-raid" ${r.promo?"disabled":""}><span class="mi">⚔️</span><b>보스 레이드</b><small>${r.promo?"승급전을 먼저 치르세요":"랭크전 · 보스 5마리 · 25문항"}</small></button>
    <button class="mode" id="m-surv"><span class="mi">❤️</span><b>생존 모드</b><small>하트 3개 · 최고 ${S.rec.surv}문제</small></button>
    <button class="mode" id="m-ta"><span class="mi">⏱️</span><b>타임어택</b><small>20문항 · 20초 · 최고 ${S.rec.ta}점</small></button>
    <button class="mode" id="m-rv" ${wrong.size?"":"disabled"}><span class="mi">📕</span><b>오답 복습</b><small>오답노트 ${wrong.size}문항</small></button>
    <button class="mode" id="m-cx"><span class="mi">📖</span><b>진단명 도감</b><small>${codex.size} / ${BANK.length} 수집</small></button>
  </div>
  <div class="card small" id="acc-wrap">${accountCardHTML()}</div>
  <div class="card small">
    <div class="stats"><div><b>${S.rec.games}</b><small>레이드 횟수</small></div><div><b>${S.rec.clears}</b><small>올클리어</small></div><div><b>${unseen}</b><small>안 푼 문항</small></div><div><b>${Math.round(codex.size/BANK.length*100)}%</b><small>도감 완성</small></div></div>
    <details><summary>랭크 규칙 보기</summary>
     <ul class="rules">
      <li>정답 <b>+${LP.ok} LP</b>, 3콤보 이상이면 문제마다 +${LP.comboMax} 보너스</li>
      <li>오답 <b>${LP.ng} LP</b> · 모름 <b>${LP.idk} LP</b> (찍는 것보다 정직하게 누르는 쪽이 이득)</li>
      <li>보스 격파 +${LP.kill} · 5마리 올클리어 +${LP.allClear} · 하트 5개를 다 잃으면 ${LP.wipe}</li>
      <li>100 LP가 되면 다음 단계(Ⅳ→Ⅲ→Ⅱ→Ⅰ)로 올라가요. Ⅰ에서 100 LP가 되면 <b>승급전</b>(5문제 중 3개 정답)을 치러요.</li>
      <li>LP가 0 아래로 떨어지면 한 단계 내려가요. 티어 자체는 떨어지지 않아요.</li>
      <li>보스 HP 100: 정답은 20 데미지, 3콤보 이상이면 크리티컬 30 데미지</li>
     </ul>
     <p class="muted">기록은 이 기기·브라우저에만 저장돼요. PC와 휴대폰 기록을 옮기려면 아래 백업 코드를 쓰세요.</p>
     <div class="nav" style="justify-content:flex-start;gap:8px;flex-wrap:wrap;margin:6px 0"><button class="btn ghost tiny" id="exp">백업 코드 복사</button><button class="btn ghost tiny" id="imp">백업 코드 붙여넣기</button></div>
     <div id="bk"></div>
     <button class="btn ghost tiny" id="reset">기록 초기화</button>
    </details>
  </div>`;
  const on=(id,f)=>{const e=document.getElementById(id);if(e)e.onclick=f};
  showInstallHint();refreshAccountCard();
  on("m-raid",startRaid);on("m-surv",startSurv);on("m-ta",startTA);on("m-rv",startReview);on("m-cx",showCodex);on("promo",startPromo);
  on("exp",async e=>{const code=btoa(unescape(encodeURIComponent(JSON.stringify({rank:S.rank,rec:S.rec,seen:[...seen],wrong:[...wrong],codex:[...codex]}))));
    document.getElementById("bk").innerHTML=`<textarea readonly>${code}</textarea>`;try{await navigator.clipboard.writeText(code);e.target.textContent="복사됐어요 ✓"}catch(_){e.target.textContent="아래 코드를 길게 눌러 복사하세요"}});
  on("imp",()=>{document.getElementById("bk").innerHTML=`<textarea id="bkin" placeholder="다른 기기에서 복사한 백업 코드를 붙여넣으세요"></textarea><div class="nav" style="justify-content:flex-start"><button class="btn tiny" id="bkgo">불러오기</button></div>`;
    document.getElementById("bkgo").onclick=()=>{try{const d=JSON.parse(decodeURIComponent(escape(atob(document.getElementById("bkin").value.trim()))));if(!d.rank||!d.rec)throw 0;store.set("pt_v3",d);location.reload()}catch(_){document.getElementById("bkgo").textContent="코드가 올바르지 않아요"}}});
  on("reset",e=>{const b=e.target;if(b.dataset.ok){localStorage.removeItem&&store.set("pt_v3",null);try{localStorage.removeItem("pt_v3")}catch(_){}location.reload()}else{b.dataset.ok=1;b.textContent="한 번 더 누르면 모든 기록이 지워져요"}});
  goTop();
}

// ===================== 보스 레이드 =====================
let G;
function startRaid(){
  const doms=shuf(CORE.slice()).slice(0,3).concat(shuf(DOMS.filter(d=>!CORE.includes(d))).slice(0,2));
  const taken=new Set();
  const bosses=shuf(doms).map(d=>{const ids=pickIds(idsOf(d),5,taken);ids.forEach(i=>taken.add(i));return {d,...BOSS[d],hp:100,qs:ids.map(toQ),dead:false}});
  G={mode:"raid",bosses,bi:0,qi:0,hearts:5,combo:0,maxCombo:0,lp:0,log:[],before:{...S.rank}};
  raidQ();
}
function raidHeader(hit){
  const b=G.bosses[G.bi];
  return `<div class="arena">
   <div class="bossrow">
     <div class="bossemoji ${hit||""} ${b.dead?"dead":""}">${b.e}</div>
     <div class="bossinfo"><div class="bossname">BOSS ${G.bi+1}/5 · ${b.n}</div><div class="bossdom">${b.d}</div>
      <div class="hp"><i style="width:${Math.max(0,b.hp)}%"></i></div>
      <div class="hpt">HP ${Math.max(0,b.hp)} / 100 · ${b.dead?"💥 격파!":`남은 공격 ${5-G.qi}회`}</div></div>
   </div>
   <div class="plrow"><span class="hearts">${"❤️".repeat(G.hearts)}${"🖤".repeat(5-G.hearts)}</span>
    <span class="combo ${G.combo>=3?"hot":""}">🔥 ${G.combo}콤보</span>
    <span class="lpd ${G.lp>=0?"up":"down"}">${G.lp>=0?"+":""}${G.lp} LP</span></div>
   <div class="pips">${G.bosses.map((x,k)=>`<span class="${k<G.bi?(x.dead?"ok":"ng"):k===G.bi?"now":""}">${x.e}</span>`).join("")}</div>
  </div>`;
}
function raidQ(hit){
  const b=G.bosses[G.bi],q=b.qs[G.qi];
  app.innerHTML=raidHeader(hit)+qCard(q,q.r,{counter:`공격 ${G.qi+1}/5`,gain:q.gain,nextLabel:G.hearts===0?"전멸… 결과 보기":G.qi===4?"전투 결과 →":"다음 공격 →"});
  bindQ(k=>raidPick(k),raidNext);
}
function raidPick(k){
  const b=G.bosses[G.bi],q=b.qs[G.qi];q.pick=k;q.r=judge(q,k);G.log.push(q);
  let hit="";
  if(q.r==="ok"){G.combo++;G.maxCombo=Math.max(G.maxCombo,G.combo);const crit=G.combo>=3;const dmg=crit?30:20;
    const bonus=G.combo>=3?LP.comboMax:0;const g=LP.ok+bonus;G.lp+=g;q.gain=`+${g} LP`;
    b.hp-=dmg;hit="hit";
    if(crit)buzz(30);
    if(b.hp<=0&&!b.dead){b.dead=true;buzz([40,30,120]);G.lp+=LP.kill;q.gain+=` · 격파 +${LP.kill}`;setTimeout(()=>floatText("💥 보스 격파!","#ffc94d"),50)}
    else setTimeout(()=>floatText(crit?`⚡ 크리티컬 -${dmg}`:`-${dmg}`,crit?"#ff9d4d":"#fff"),50);
  }else if(q.r==="ng"){G.combo=0;G.hearts--;G.lp+=LP.ng;q.gain=`${LP.ng} LP · ❤️-1`;buzz([60,40,60]);hit="";setTimeout(()=>{const c=document.getElementById("qc");c&&c.classList.add("shake")},10)}
  else{G.combo=0;G.lp+=LP.idk;q.gain=`${LP.idk} LP`}
  raidQ(hit);
}
function raidNext(){
  if(G.hearts===0)return raidEnd(true);
  if(G.qi<4){G.qi++;raidQ();goTop();return}
  // 보스 전투 종료
  const b=G.bosses[G.bi];
  app.innerHTML=raidHeader()+`<div class="card hero">
    <div style="font-size:3.4rem">${b.dead?"💥":"💨"}</div>
    <h2>${b.dead?`${b.n} 격파!`:`${b.n}이(가) 도망쳤다…`}</h2>
    <p class="muted">${b.dead?"이 영역은 탄탄해요.":"5번 중 4번 이상, 콤보를 이어 맞혀야 잡을 수 있어요."}</p>
    <button class="btn big" id="go">${G.bi<4?"다음 보스 →":"레이드 결과 →"}</button></div>`;
  document.getElementById("go").onclick=()=>{if(G.bi<4){G.bi++;G.qi=0;raidQ();goTop()}else raidEnd(false)};
}
function raidEnd(wiped){
  const kills=G.bosses.filter(b=>b.dead).length,allClear=kills===5&&!wiped;
  if(allClear)G.lp+=LP.allClear;
  if(wiped)G.lp+=LP.wipe;
  S.rec.games++;if(allClear)S.rec.clears++;
  const before=rankLabel(G.before),beforeT=G.before.t;
  const ev=applyLP(G.lp);save();
  const c=G.log.filter(q=>q.r==="ok").length,n=G.log.filter(q=>q.r==="ng").length,u=G.log.filter(q=>q.r==="idk").length;
  const dom={};G.log.forEach(q=>{dom[q.d]=dom[q.d]||{c:0,t:0};dom[q.d].t++;if(q.r==="ok")dom[q.d].c++});
  const D=Object.entries(dom),weak=D.filter(([k,v])=>v.c/v.t<0.6).map(([k])=>k);
  const misses=G.log.filter(q=>q.r!=="ok");
  const title=allClear?"🏆 올클리어!":wiped?"☠️ 전멸":"⚔️ 레이드 종료";
  const summary=`[보스 레이드 결과] ${title.replace(/^\S+ /,"")}\n랭크: ${before} → ${rankLabel(S.rank)} (${G.lp>=0?"+":""}${G.lp} LP)\n격파 ${kills}/5 · 정답 ${c} · 오답 ${n} · 모름 ${u} · 최대콤보 ${G.maxCombo}\n`+D.map(([k,v])=>`- ${k}: ${v.c}/${v.t}`).join("\n")+`\n틀리거나 모른 문제: `+(misses.map(q=>q.q.slice(0,22)+"…").join(" / ")||"없음");
  app.innerHTML=`<div class="card hero">
    <h1 style="margin:0">${title}</h1>
    <div class="bosslist">${G.bosses.map(b=>`<span class="${b.dead?"ok":"ng"}">${b.e}<small>${b.dead?"격파":"도주"}</small></span>`).join("")}</div>
    <div class="rkchange">
      <div>${emblem(G.before,54)}<small>${before}</small></div>
      <div class="arrow ${G.lp>=0?"up":"down"}">${G.lp>=0?"+":""}${G.lp} LP<br>➜</div>
      <div>${emblem(S.rank,54)}<small>${rankLabel(S.rank)}</small></div>
    </div>
    ${ev.map(e=>`<div class="event ${e.k}">${e.k==="up"?"⬆️ 승급! "+e.t:e.k==="down"?"⬇️ 강등… "+e.t:"🏆 "+e.t}</div>`).join("")}
    ${S.rank.t<TOP&&!S.rank.promo?`<div class="lpbar" style="margin-top:12px"><i style="width:${S.rank.lp}%"></i></div><div class="muted">${S.rank.lp} / 100 LP</div>`:""}
    <div class="stats"><div><b>${c}</b><small>정답</small></div><div><b>${n}</b><small>오답</small></div><div><b>${u}</b><small>모름</small></div><div><b>${G.maxCombo}</b><small>최대 콤보</small></div></div>
  </div>
  <div class="card"><b>이번 판 영역별 결과</b>${D.map(([k,v])=>{const r=v.c/v.t,col=r>=.8?"var(--ok)":r>=.5?"var(--gold)":"var(--ng)";return `<div class="row"><span>${BOSS[k].e} ${k}</span><span class="b"><i style="width:${r*100}%;background:${col}"></i></span><span>${v.c}/${v.t}</span></div>`}).join("")}
   ${weak.length?`<p style="margin:12px 0 0"><b>다음 퀘스트</b></p><ul>${weak.map(w=>`<li><b>${w}</b>: ${STUDY[w]}</li>`).join("")}</ul>`:""}</div>
  ${misses.length?`<div class="card"><b>틀리거나 모른 문제</b>${misses.map(q=>`<div class="wrong">${esc(q.q)} <span class="muted">(${q.r==="idk"?"모름":"오답"})</span><br><span class="a">정답: ${esc(q.o[q.a])}</span><br><span class="muted">${esc(q.e)}</span></div>`).join("")}</div>`:""}
  <div class="card"><b>결과를 채팅에 붙여넣기</b><pre>${esc(summary)}</pre>
   <div class="nav" style="justify-content:flex-start;gap:8px;flex-wrap:wrap"><button class="btn" id="cp">결과 복사</button>
   ${S.rank.promo?`<button class="btn promo-btn" id="pr">🏆 승급전 도전</button>`:`<button class="btn" id="again">⚔️ 한 판 더</button>`}
   <button class="btn ghost" id="lb">로비로</button></div></div>`;
  document.getElementById("cp").onclick=async e=>{try{await navigator.clipboard.writeText(summary);e.target.textContent="복사됐어요 ✓"}catch(_){e.target.textContent="위 텍스트를 직접 복사해 주세요"}};
  const on=(id,f)=>{const e=document.getElementById(id);if(e)e.onclick=f};
  on("again",startRaid);on("pr",startPromo);on("lb",lobby);
  if(ev.some(e=>e.k==="up"||e.k==="promo"))setTimeout(()=>floatText(ev.some(e=>e.k==="promo")?"🏆 승급전 진입!":"⬆️ RANK UP!","#ffc94d"),200);
  goTop();
}

// ===================== 승급전 =====================
function startPromo(){
  const ids=pickIds(BANK.map((_,i)=>i).filter(i=>CORE.includes(BANK[i][0])),5);
  G={mode:"promo",qs:ids.map(toQ),i:0,ok:0,ng:0};promoQ();
}
function promoHead(){
  const r=S.rank;return `<div class="arena promo"><div class="promo-title">🏆 승급전</div>
   <div class="rkchange small"><div>${emblem(r,44)}<small>${TIERS[r.t].n}</small></div><div class="arrow up">➜</div><div>${emblem({t:r.t+1,d:4,lp:0},44)}<small>${TIERS[r.t+1].n}</small></div></div>
   <div class="pips big">${G.qs.map((q,k)=>`<span class="${q.r||(k===G.i?"now":"")}">${q.r==="ok"?"✔":q.r?"✖":k+1}</span>`).join("")}</div>
   <div class="muted">5문제 중 3개를 맞히면 승급 · 현재 ${G.ok}승 ${G.ng}패</div></div>`;
}
function promoQ(){
  const q=G.qs[G.i];app.innerHTML=promoHead()+qCard(q,q.r,{counter:`${G.i+1} / 5`,nextLabel:(G.ok>=3||G.ng>=3)?"결과 보기":"다음 →"});
  bindQ(k=>{q.pick=k;q.r=judge(q,k);if(q.r==="ok")G.ok++;else G.ng++;promoQ()},()=>{if(G.ok>=3||G.ng>=3||G.i===4)promoEnd();else{G.i++;promoQ();goTop()}});
}
function promoEnd(){
  const r=S.rank,win=G.ok>=3,from=TIERS[r.t].n;
  if(win){r.t++;r.d=r.t===TOP?0:4;r.lp=0;r.promo=false}else{r.lp=LP.promoFail;r.promo=false}
  S.rec.peak=Math.max(S.rec.peak,rankScore(r));save();
  app.innerHTML=`<div class="card hero ${win?"celebrate":""}">
    ${emblem(r,120)}
    <h1>${win?`${TIERS[r.t].n} 승급!`:"승급 실패…"}</h1>
    <p>${win?`${from}에서 <b style="color:${TIERS[r.t].c}">${TIERS[r.t].n}</b>(으)로 올라갔어요.${r.t===TOP?" 최고 등급이에요. 이제 LP를 계속 쌓아보세요.":""}`:`${G.ok}승 ${G.ng}패예요. ${rankLabel(r)} ${LP.promoFail} LP로 돌아가요. 레이드로 30 LP만 더 모으면 다시 도전할 수 있어요.`}</p>
    <div class="nav" style="justify-content:center;gap:8px"><button class="btn" id="again">⚔️ 레이드 하기</button><button class="btn ghost" id="lb">로비로</button></div></div>`;
  document.getElementById("again").onclick=startRaid;document.getElementById("lb").onclick=lobby;
  if(win){for(let k=0;k<3;k++)setTimeout(()=>floatText(["🎉","👑","✨"][k]+" PROMOTED!","#ffc94d"),k*350)}
  goTop();
}

// ===================== 생존 모드 =====================
function startSurv(){
  const ids=pickIds(BANK.map((_,i)=>i),BANK.length);
  G={mode:"surv",queue:ids,i:0,hearts:3,score:0,fifty:2,revive:1,q:null,hidden:new Set()};
  G.q=toQ(G.queue[0]);survQ();
}
function survQ(){
  const q=G.q;
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="hearts big">${"❤️".repeat(G.hearts)}${"🖤".repeat(3-G.hearts)}</span><span class="score">🏅 ${G.score}문제</span></div>
   <div class="items"><button class="item" id="ff" ${G.fifty&&!q.r?"":"disabled"}>✂️ 50:50 ×${G.fifty}</button><span class="item ghost">💖 부활 ×${G.revive}</span><span class="muted" style="margin-left:auto">최고 ${S.rec.surv}문제</span></div></div>`+
   qCard(q,q.r,{counter:`${G.i+1}번째`,hidden:G.hidden,nextLabel:G.hearts===0?"게임 오버…":"다음 →"});
  const ff=document.getElementById("ff");if(ff)ff.onclick=()=>{if(!G.fifty)return;G.fifty--;const w=shuf([0,1,2,3].filter(k=>k!==q.a)).slice(0,2);G.hidden=new Set(w);survQ()};
  bindQ(k=>{q.pick=k;q.r=judge(q,k);if(q.r==="ok"){G.score++;setTimeout(()=>floatText("+1","#3ddc97"),30)}else{G.hearts--;setTimeout(()=>{const c=document.getElementById("qc");c&&c.classList.add("shake")},10)}survQ()},survNext);
}
function survNext(){
  if(G.hearts===0)return survOver();
  G.i++;G.hidden=new Set();
  if(G.i>=G.queue.length){G.queue=shuf(G.queue.slice());G.i=0}
  G.q=toQ(G.queue[G.i]);survQ();goTop();
}
function survOver(){
  const rec=G.score>S.rec.surv;if(rec){S.rec.surv=G.score;save()}
  app.innerHTML=`<div class="card hero"><div style="font-size:3.4rem">💀</div><h1>게임 오버</h1>
   <p><b style="font-size:1.6rem;color:var(--ink)">${G.score}문제</b> 버텼어요${rec?" · <b style='color:var(--gold)'>신기록!</b>":` (최고 ${S.rec.surv})`}</p>
   <div class="nav" style="justify-content:center;gap:8px;flex-wrap:wrap">
    ${G.revive?`<button class="btn promo-btn" id="rv">💖 부활하기 (하트 1개)</button>`:""}
    <button class="btn" id="again">다시 도전</button><button class="btn ghost" id="lb">로비로</button></div></div>`;
  const on=(id,f)=>{const e=document.getElementById(id);if(e)e.onclick=f};
  on("rv",()=>{G.revive--;G.hearts=1;G.i++;G.hidden=new Set();if(G.i>=G.queue.length){G.queue=shuf(G.queue.slice());G.i=0}G.q=toQ(G.queue[G.i]);survQ()});
  on("again",startSurv);on("lb",lobby);goTop();
}

// ===================== 타임어택 =====================
const TA_N=20,TA_SEC=20;
function startTA(){
  const ids=pickIds(BANK.map((_,i)=>i),TA_N);
  G={mode:"ta",qs:ids.map(toQ),i:0,score:0,ok:0,left:TA_SEC};taQ(true);
}
function taQ(fresh){
  clearInterval(timer);
  const q=G.qs[G.i];
  if(fresh){G.left=TA_SEC;G.t0=Date.now()}
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">⏱️ ${G.i+1} / ${TA_N}</span><span class="score">⭐ ${G.score}점</span><span class="muted">최고 ${S.rec.ta}</span></div>
   <div class="timer"><i id="tbar" style="width:${G.left/TA_SEC*100}%"></i></div><div class="tleft" id="tleft">${q.r?"":Math.ceil(G.left)+"초"}</div></div>`+
   qCard(q,q.r,{counter:"",gain:q.gain,noIdk:true,nextLabel:G.i===TA_N-1?"결과 보기":"다음 →"});
  bindQ(k=>taPick(k),()=>{if(G.i===TA_N-1)taEnd();else{G.i++;taQ(true);goTop()}});
  if(!q.r){timer=setInterval(()=>{G.left=TA_SEC-(Date.now()-G.t0)/1000;const b=document.getElementById("tbar"),t=document.getElementById("tleft");
    if(b){b.style.width=Math.max(0,G.left/TA_SEC*100)+"%";b.style.background=G.left<5?"var(--ng)":""}if(t)t.textContent=Math.max(0,Math.ceil(G.left))+"초";
    if(G.left<=0){q.timeout=true;taPick(-2)}},100)}
}
function taPick(k){
  clearInterval(timer);const q=G.qs[G.i];if(q.r)return;q.pick=k;
  q.r=judge(q,k<0?-2:k);if(k===-2)q.r="ng";
  if(q.r==="ok"){const pts=100+Math.max(0,Math.round(G.left))*10;G.score+=pts;G.ok++;q.gain=`+${pts}점`;setTimeout(()=>floatText(`+${pts}`,"#ffc94d"),30)}
  else setTimeout(()=>{const c=document.getElementById("qc");c&&c.classList.add("shake")},10);
  taQ(false);
}
function taEnd(){
  clearInterval(timer);const rec=G.score>S.rec.ta;if(rec){S.rec.ta=G.score;save()}
  app.innerHTML=`<div class="card hero"><div style="font-size:3.4rem">⏱️</div><h1>${G.score}점</h1>
   <p>${TA_N}문제 중 ${G.ok}개 정답${rec?" · <b style='color:var(--gold)'>신기록!</b>":` (최고 ${S.rec.ta}점)`}</p>
   <p class="muted">정답 100점 + 남은 시간 1초당 10점</p>
   <div class="nav" style="justify-content:center;gap:8px"><button class="btn" id="again">다시 도전</button><button class="btn ghost" id="lb">로비로</button></div></div>`;
  document.getElementById("again").onclick=startTA;document.getElementById("lb").onclick=lobby;goTop();
}

// ===================== 오답 복습 =====================
function startReview(){
  const ids=shuf([...wrong]).slice(0,25);if(!ids.length)return // ===================== 설치(PWA) =====================
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;showInstallHint()});
function showInstallHint(){
  const el=document.getElementById("inst");if(!el)return;
  const standalone=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone;
  if(standalone||store.get("pt_hide_inst",false))return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(deferredPrompt){el.style.display="block";el.innerHTML=`📲 홈 화면에 앱으로 설치할 수 있어요. <button class="btn tiny" id="instgo">설치</button> <button class="btn ghost tiny" id="instx">닫기</button>`;
    document.getElementById("instgo").onclick=async()=>{deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(_){}deferredPrompt=null;el.style.display="none"}}
  else if(ios&&location.protocol==="https:"){el.style.display="block";el.innerHTML=`📲 Safari 아래쪽 <b>공유 버튼</b> → <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요. <button class="btn ghost tiny" id="instx">닫기</button>`}
  else return;
  const x=document.getElementById("instx");if(x)x.onclick=()=>{store.set("pt_hide_inst",true);el.style.display="none"};
}
if("serviceWorker" in navigator&&location.protocol==="https:"&&window.self===window.top){navigator.serviceWorker.register("sw.js").catch(()=>{})}
lobby();
  G={mode:"rv",qs:ids.map(toQ),i:0};rvQ();
}
function rvQ(){
  const q=G.qs[G.i];
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">📕 오답 복습</span><span class="muted">${G.i+1} / ${G.qs.length} · 맞히면 오답노트에서 졸업</span></div></div>`+qCard(q,q.r,{nextLabel:G.i===G.qs.length-1?"결과 보기":"다음 →",gain:q.r==="ok"?"🎓 졸업!":""});
  bindQ(k=>{q.pick=k;q.r=judge(q,k);rvQ()},()=>{if(G.i===G.qs.length-1)rvEnd();else{G.i++;rvQ();goTop()}});
}
function rvEnd(){
  const g=G.qs.filter(q=>q.r==="ok").length;
  app.innerHTML=`<div class="card hero"><div style="font-size:3.4rem">🎓</div><h1>${g}문항 졸업</h1><p>${G.qs.length}문항 중 ${g}개를 맞혀 오답노트에서 뺐어요. 남은 오답노트 ${wrong.size}문항.</p>
   <div class="nav" style="justify-content:center;gap:8px">${wrong.size?`<button class="btn" id="again">한 번 더 복습</button>`:""}<button class="btn ghost" id="lb">로비로</button></div></div>`;
  const a=document.getElementById("again");if(a)a.onclick=startReview;document.getElementById("lb").onclick=lobby;goTop();
}

// ===================== 도감 =====================
function showCodex(){
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">📖 진단명 도감</span><span class="score">${codex.size} / ${BANK.length}</span></div>
   <div class="lpbar"><i style="width:${codex.size/BANK.length*100}%"></i></div><p class="muted" style="margin:6px 0 0">문제를 맞히면 카드가 열려요. 열린 카드를 누르면 해설을 다시 볼 수 있어요.</p></div>
   ${DOMS.map(d=>{const ids=idsOf(d),got=ids.filter(i=>codex.has(i)).length;return `<div class="card"><div class="cxhead"><span>${BOSS[d].e} <b>${d}</b></span><span class="muted">${got}/${ids.length}${got===ids.length?" · 🏅 완성":""}</span></div>
     <div class="cards">${ids.map(i=>codex.has(i)?`<button class="cx on" data-i="${i}">${esc(BANK[i][2][0].length>26?BANK[i][2][0].slice(0,25)+"…":BANK[i][2][0])}</button>`:`<span class="cx">?</span>`).join("")}</div></div>`}).join("")}
   <div id="modal"></div>
   <div class="nav" style="justify-content:center"><button class="btn ghost" id="lb">로비로</button></div>`;
  document.getElementById("lb").onclick=lobby;
  app.querySelectorAll(".cx.on").forEach(b=>b.onclick=()=>{const x=BANK[+b.dataset.i];document.getElementById("modal").innerHTML=`<div class="modal" id="mbg"><div class="card mcard"><div class="meta"><span class="tag">${x[0]}</span></div><p class="q">${esc(x[1])}</p><p class="a" style="color:var(--ok);font-weight:700">✔ ${esc(x[2][0])}</p><p class="muted" style="font-size:.92rem">${esc(x[3])}</p><div class="nav"><button class="btn" id="mx">닫기</button></div></div></div>`;
    document.getElementById("mx").onclick=()=>document.getElementById("modal").innerHTML="";document.getElementById("mbg").onclick=e=>{if(e.target.id==="mbg")document.getElementById("modal").innerHTML=""}});
  goTop();
}

// ===================== 설치(PWA) =====================
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;showInstallHint()});
function showInstallHint(){
  const el=document.getElementById("inst");if(!el)return;
  const standalone=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone;
  if(standalone||store.get("pt_hide_inst",false))return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(deferredPrompt){el.style.display="block";el.innerHTML=`📲 홈 화면에 앱으로 설치할 수 있어요. <button class="btn tiny" id="instgo">설치</button> <button class="btn ghost tiny" id="instx">닫기</button>`;
    document.getElementById("instgo").onclick=async()=>{deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(_){}deferredPrompt=null;el.style.display="none"}}
  else if(ios&&location.protocol==="https:"){el.style.display="block";el.innerHTML=`📲 Safari 아래쪽 <b>공유 버튼</b> → <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요. <button class="btn ghost tiny" id="instx">닫기</button>`}
  else return;
  const x=document.getElementById("instx");if(x)x.onclick=()=>{store.set("pt_hide_inst",true);el.style.display="none"};
}
if("serviceWorker" in navigator&&location.protocol==="https:"&&window.self===window.top){navigator.serviceWorker.register("sw.js").catch(()=>{})}
initAccount();
lobby();
