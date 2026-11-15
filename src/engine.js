// ===================== 설정 =====================
const TIERS=[
 {n:"미생",r:"E",c:"#8a96ad",e:"🌱"},
 {n:"수련준비생",r:"C",c:"#3fd1a0",e:"📘"},
 {n:"수련생",r:"B",c:"#3fa0ff",e:"🩺"},
 {n:"전문요원",r:"A",c:"#a46cff",e:"🎖️"},
 {n:"퇴사",r:"S",c:"#ffc94d",e:"🏖️"}
];
const TOP=4, CAP=3;                 // 레벨테스트로는 전문요원(3)까지, 퇴사(4)는 최종 보스로만
const LT_CUT=[0,40,60,75];          // 레벨테스트 점수 → 미생/수련준비생/수련생/전문요원
const LT_N=30, PR_N=10, DOJO_N=10, DOJO_PASS=8, FINAL_N=40, FINAL_PASS=32;
// 영역별 관문 보스 (질환이 아니라 '시험 관문'을 지키는 캐릭터)
const BOSS={
 [D1]:{e:"📚",n:"DSM 대사서"},[D2]:{e:"🔮",n:"스펙트럼 예언자"},[D3]:{e:"🌗",n:"달의 수호자"},
 [D4]:{e:"🛡️",n:"긴장의 문지기"},[D5]:{e:"🎭",n:"가면의 기사"},[D6]:{e:"⏳",n:"기억의 시계공"},
 [D7]:{e:"⚗️",n:"약물 연금술사"},[D8]:{e:"⚖️",n:"위기의 파수꾼"},[D9]:{e:"🧠",n:"무의식의 현자"},
 [D10]:{e:"🌙",n:"꿈의 파수꾼"},[D11]:{e:"📜",n:"법조문 수호자"},[D12]:{e:"🔤",n:"약어 해독가"}
};
const DOMS=[D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11,D12];
const CORE=[D2,D3,D4,D6,D7,D11];

// ===================== 문제 목록(QB): 고정 문항 + 사실표 자동 문항 =====================
const OX_P=0.2;   // 고정·자동 문항 일부를 O/X로 바꿔 내는 비율(레벨테스트·최종 보스 제외)
const QB=BANK.map((b,i)=>({d:b[0],q:b[1],a:b[2][0],w:b[2].slice(1),e:b[3],key:META[i].key,lv:META[i].lv,st:META[i].st,src:META[i].src}));
// 받침에 따라 조사 고르기 (한글이 아니면 "은(는)"처럼 둘 다 표시)
function J(w,a,b){const c=String(w).replace(/[)\]'"’”\s]+$/,"").slice(-1),k=c.charCodeAt(0)-0xAC00;if(k<0||k>11171)return w+a+"("+b+")";return w+((k%28)?a:b)}
(function genFacts(){
  const F=FACTS,DN=F.domains,uniq=a=>[...new Set(a)];
  const add=o=>QB.push(Object.assign({st:"auto",src:F.src},o));
  // 진단 → 범주 (정방향) / 범주에 속하지 않는 것 (헷갈리는 함정 정답)
  const cats=uniq(F.cat.map(r=>r[1]));
  F.cat.forEach((r,i)=>add({key:`f:cat:${i}`,d:DN.DSM,lv:1,q:`${J("'"+r[0]+"'",'은','는')} DSM-5의 어느 범주에 속하나?`,a:r[1],pool:cats.filter(c=>c!==r[1]),e:`${J(r[0],'은','는')} DSM-5에서 '${r[1]}' 범주예요.`}));
  cats.forEach((c,i)=>{const mem=F.cat.filter(r=>r[1]===c).map(r=>r[0]);if(mem.length<3)return;
    const trap=F.cat_trap[c]||F.cat.find(r=>r[1]!==c)[0],tc=(F.cat.find(r=>r[0]===trap)||[])[1];
    add({key:`f:catneg:${i}`,d:DN.DSM,lv:2,neg:true,q:`다음 중 DSM-5 '${c}'에 속하지 않는 것은?`,a:trap,pool:mem,e:`${J(trap,'은','는')} '${tc}' 범주예요. '${c}'에는 ${J(mem.join(", "),'이','가')} 속해요.`})});
  // 진단 기준 기간·나이 (양방향, 같은 종류끼리만 오답)
  const kind=s=>/세 (이전|이상)$/.test(s)?"age":"dur",durs=uniq(F.dur.map(r=>r[2]));
  F.dur.forEach((r,i)=>{
    add({key:`f:dur:${i}`,d:r[0],lv:2,q:`'${r[1]}'의 DSM-5 기준은?`,a:r[2],pool:durs.filter(x=>x!==r[2]&&kind(x)===kind(r[2])),e:`${r[1]}: ${r[2]}.`});
    if(F.dur.filter(x=>x[2]===r[2]).length===1&&kind(r[2])==="dur")
      add({key:`f:durr:${i}`,d:r[0],lv:3,q:`DSM-5 기준이 '${r[2]}'인 것은?`,a:r[1],pool:F.dur.filter(x=>x[2]!==r[2]&&kind(x[2])==="dur").map(x=>x[1]),e:`${r[1]}의 기준이 ${r[2]}예요.`});
  });
  // 영어 약어 ↔ 뜻
  F.abbr.forEach((r,i)=>{
    add({key:`f:ab:${i}`,d:DN.ABBR,lv:1,q:`'${r[0]}'의 뜻은?`,a:r[1],pool:F.abbr.map(x=>x[1]).filter(x=>x!==r[1]),e:`${r[0]} = ${r[1]}.`});
    add({key:`f:abr:${i}`,d:DN.ABBR,lv:2,q:`${J("'"+r[1]+"'",'을','를')} 뜻하는 약어는?`,a:r[0],pool:F.abbr.map(x=>x[0]).filter(x=>x!==r[0]),e:`${r[1]} = ${r[0]}.`});
  });
  // 약물 → 계열 / 계열에 속하지 않는 약
  const classes=uniq(F.drug.map(r=>r[1]));
  F.drug.forEach((r,i)=>add({key:`f:dg:${i}`,d:DN.TX,lv:2,q:`'${r[0]}'의 약물 계열은?`,a:r[1],pool:classes.filter(c=>c!==r[1]),e:`${J(r[0],'은','는')} ${r[1]}이에요.`}));
  classes.forEach((c,i)=>{const mem=F.drug.filter(r=>r[1]===c).map(r=>r[0]),trap=F.drug_trap[c];if(mem.length<3||!trap)return;
    const tc=F.drug.find(r=>r[0]===trap)[1];
    add({key:`f:dgneg:${i}`,d:DN.TX,lv:3,neg:true,q:`다음 중 ${J(c,'이','가')} 아닌 약은?`,a:trap,pool:mem,e:`${J(trap,'은','는')} ${tc}이에요. ${c}: ${mem.join(", ")}.`})});
  // 약물 ↔ 특히 주의할 부작용
  F.adv.forEach((r,i)=>{
    add({key:`f:adv:${i}`,d:DN.TX,lv:2,q:`'${r[0]}'에서 특히 주의해야 할 부작용은?`,a:r[1],pool:F.adv.map(x=>x[1]).filter(x=>x!==r[1]),e:`${r[0]}: ${r[1]}.`});
    add({key:`f:advr:${i}`,d:DN.TX,lv:3,q:`${J("'"+r[1]+"'",'을','를')} 특히 주의해야 하는 약은?`,a:r[0],pool:F.adv.map(x=>x[0]).filter(x=>x!==r[0]),e:`${r[0]}: ${r[1]}.`});
  });
  // 학자 ↔ 개념
  F.people.forEach((r,i)=>{
    add({key:`f:pp:${i}`,d:DN.THY,lv:1,q:`${J(r[0],'과','와')} 관련 깊은 것은?`,a:r[1],pool:F.people.map(x=>x[1]).filter(x=>x!==r[1]),e:`${r[0]}: ${r[1]}.`});
    add({key:`f:ppr:${i}`,d:DN.THY,lv:2,q:`${J("'"+r[1]+"'",'과','와')} 관련 깊은 학자는?`,a:r[0],pool:F.people.map(x=>x[0]).filter(x=>x!==r[0]),e:`${r[1]}: ${r[0]}.`});
  });
  // 방어기제 ↔ 예시
  F.def.forEach((r,i)=>{
    add({key:`f:df:${i}`,d:DN.THY,lv:2,q:`다음 예에 해당하는 방어기제는? "${r[1]}"`,a:r[0],pool:F.def.map(x=>x[0]).filter(x=>x!==r[0]),e:`'${r[0]}'의 예예요.`});
    add({key:`f:dfr:${i}`,d:DN.THY,lv:3,q:`'${r[0]}'의 예로 가장 알맞은 것은?`,a:r[1],pool:F.def.map(x=>x[1]).filter(x=>x!==r[1]),e:`'${r[0]}'의 예예요.`});
  });
})();
const KEY2ID={};QB.forEach((x,i)=>KEY2ID[x.key]=i);
// 기록은 문항 키(문자열)로 저장. 예전 기록(숫자 번호)은 고정 문항 번호로 해석
function fromStored(a){return (a||[]).map(x=>typeof x==="number"?(x<BANK.length?x:null):KEY2ID[x]).filter(x=>x!=null)}
const toStored=set=>[...set].filter(i=>QB[i]).map(i=>QB[i].key);

// ===================== 저장 =====================
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(_){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
const raw=store.get("pt_v4",null), old=raw?null:store.get("pt_v3",null), base=raw||old||{};
const S={level:{t:-1,score:null,date:null,dom:{},hist:[]},dojo:{cleared:[],best:{},final:false},rec:{surv:0,ta:0,tests:0,duelW:0,duelL:0,duelD:0},nick:""};
if(raw){Object.assign(S.level,raw.level||{});Object.assign(S.dojo,raw.dojo||{});Object.assign(S.rec,raw.rec||{});S.nick=raw.nick||""}
else if(old&&old.rec){S.rec.surv=old.rec.surv||0;S.rec.ta=old.rec.ta||0}
const seen=new Set(fromStored(base.seen||store.get("dsm_seen",[])));
const wrong=new Set(fromStored(base.wrong||store.get("dsm_wrong",[])));
const codex=new Set(fromStored(base.codex||[]));
function data(){return {level:S.level,dojo:S.dojo,rec:S.rec,nick:S.nick,seen:toStored(seen),wrong:toStored(wrong),codex:toStored(codex)}}
function save(){store.set("pt_v4",data());if(typeof scheduleSync==="function")scheduleSync()}
function curTier(){return S.dojo.final?TOP:S.level.t}
function tierOf(score){let t=0;LT_CUT.forEach((c,k)=>{if(score>=c)t=k});return Math.min(t,CAP)}

// ===================== 유틸 =====================
const app=document.getElementById("app");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuf=a=>{for(let k=a.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a};
const goTop=()=>{try{window.scrollTo({top:0,behavior:"smooth"})}catch(_){}};
const ALL=QB.map((_,i)=>i);
const idsOf=d=>ALL.filter(i=>QB[i].d===d);
// 출제: 오답은 고정 문항이면 그대로, 자동 문항이면 같은 표에서 매번 새로 뽑음. 일부는 O/X로 변형
function toQ(id,opt){
  const x=QB[id],w=x.w?shuf(x.w.slice()):shuf(x.pool.filter(p=>p!==x.a)).slice(0,3);
  if(!(opt&&opt.noOX)&&!x.neg&&!/않은|아닌|없는|않는|옳지/.test(x.q)&&Math.random()<OX_P){
    const truth=Math.random()<0.5,shown=truth?x.a:w[0];
    return {id,d:x.d,q:x.q,ox:shown,o:["⭕ 맞다","❌ 틀리다"],a:truth?0:1,e:(truth?"":`정답은 '${x.a}'예요. `)+x.e,lv:x.lv};
  }
  const o=shuf([x.a].concat(w));return {id,d:x.d,q:x.q,o,a:o.indexOf(x.a),e:x.e,lv:x.lv};
}
function pickIds(pool,n,ex){ex=ex||new Set();const f=shuf(pool.filter(i=>!seen.has(i)&&!ex.has(i))),o=shuf(pool.filter(i=>seen.has(i)&&!ex.has(i)));return f.concat(o).slice(0,n)}
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(_){}}
function floatText(t,color){const d=document.createElement("div");d.className="float";d.textContent=t;if(color)d.style.color=color;document.body.appendChild(d);setTimeout(()=>d.remove(),1100)}
function emblem(t,size){const T=TIERS[t]||{c:"#4a5068",e:"?",r:"?"};return `<div class="emblem" style="--tc:${T.c};width:${size}px;height:${size}px;font-size:${size*.42}px"><span>${T.e}</span><b class="rkl" style="font-size:${Math.max(11,size*.2)}px">${T.r}</b></div>`}
const tierName=t=>t<0?"미각성":`${TIERS[t].r}급 ${TIERS[t].n}`;
const stars=lv=>"★".repeat(lv)+"☆".repeat(3-lv);
const on=(id,f)=>{const e=document.getElementById(id);if(e)e.onclick=f};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
function shadowToast(){const t=document.createElement("div");t.className="shadow";t.textContent="🌑 그림자 추출 — 일어나라";document.body.appendChild(t);setTimeout(()=>t.remove(),1300)}
function shake(){setTimeout(()=>{const c=document.getElementById("qc");c&&c.classList.add("shake")},10)}

// 출처·검수 상태·신고
const REPO="https://github.com/gkstoa081333-hue/DSM-Game";
function srcLine(id){
  const m=QB[id]||{};const s=m.src||{};
  const t=s.u?`<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t||"출처")}</a>`:esc(s.t||"");
  return `<div class="src">${m.st==="draft"?`<span class="badge">검수 전</span>`:m.st==="auto"?`<span class="badge auto">사실표 출제</span>`:""}${t?`<span>출처: ${t}</span>`:""}<button class="rep" data-rep="${id}">🚩 문제 신고</button></div><div class="repbox" id="rep-${id}"></div>`;
}
// 판정: 본 문제·오답노트·도감 기록을 바로 반영
function judge(q,k){
  seen.add(q.id);
  const r=k===-1?"idk":k===q.a?"ok":"ng";
  if(r==="ok"){wrong.delete(q.id);if(!codex.has(q.id)){codex.add(q.id);setTimeout(()=>shadowToast(),60)}}else wrong.add(q.id);
  save();return r;
}

// ===================== 공통 문제 카드 =====================
function qCard(q,r,opt){
  opt=opt||{};const hid=opt.hidden||new Set();
  const btns=q.o.map((t,k)=>{
    if(!r&&hid.has(k))return `<button class="opt gone" disabled>${k+1}. ─</button>`;
    let c="";if(r){if(k===q.a)c="ok";else if(k===q.pick)c="ng"}
    return `<button class="opt ${c}" data-k="${k}" ${r?"disabled":""}>${k+1}. ${esc(t)}</button>`}).join("");
  const ans=q.ox!=null?(q.a===0?"⭕":"❌"):(q.a+1)+"번";const head=r==="ok"?"정답!":r==="ng"?(q.timeout?"⏰ 시간 초과! 정답은 ":"아쉬워요, 정답은 ")+ans:"정답은 "+ans+"이에요";
  return `<div class="card" id="qc">
   <div class="meta"><span class="tag">${q.d}</span><span>${opt.showLv?`<span class="lv">${stars(q.lv)}</span> `:""}${opt.counter||""}</span></div>
   <p class="q">${q.ox!=null?`<span class="oxtag">O/X</span> `:""}${esc(q.q)}</p>${q.ox!=null?`<div class="oxbox">👉 ${esc(q.ox)}</div>`:""}${btns}
   ${opt.noIdk?"":`<button class="idkbtn" id="idk" ${r?"disabled":""}>🤔 모름 (정답 보기)</button>`}
   ${r&&!opt.hideFb?`<div class="fb ${r}"><div class="h">${head}${opt.gain?`<span class="gain">${opt.gain}</span>`:""}</div>${esc(q.e)}${srcLine(q.id)}</div>`:""}
   ${r?`<div class="nav"><button class="btn" id="next">${opt.nextLabel||"다음 →"}</button></div>`:""}
  </div>`;
}
function bindQ(onPick,onNext){
  app.querySelectorAll(".opt[data-k]").forEach(b=>b.onclick=()=>onPick(+b.dataset.k));
  on("idk",()=>onPick(-1));
  on("next",onNext);
  app.querySelectorAll("[data-rep]").forEach(b=>b.onclick=()=>openReport(+b.dataset.rep));
}
function domBars(dom){
  return Object.entries(dom).sort((a,b)=>a[1]-b[1]).map(([k,v])=>{const col=v>=80?"var(--ok)":v>=50?"var(--gold)":"var(--ng)";
    return `<div class="row"><span>${(BOSS[k]||{}).e||""} ${k}</span><span class="b"><i style="width:${v}%;background:${col}"></i></span><span>${v}</span></div>`}).join("");
}

// ===================== 시스템 창 =====================
function systemMsg(lines,title){
  const d=document.createElement("div");d.className="sysbg";
  d.innerHTML=`<div class="sys"><div class="syshead">${esc(title||"알림")}</div>${lines.map(l=>`<p>${esc(l)}</p>`).join("")}<button class="sysok">확인</button></div>`;
  document.body.appendChild(d);buzz(20);
  const close=()=>d.remove();d.querySelector(".sysok").onclick=close;d.onclick=ev=>{if(ev.target===d)close()};
}
// 일일 퀘스트: 하루 한 번 완료하면 연속 달성
function dailyLabel(){const q=S.rec.daily||{};return q.date===today()?`오늘 완료 ✅ · 연속 ${q.streak||1}일`:`오늘의 퀘스트 미완료 · 연속 ${q.streak&&q.date===yesterday()?q.streak:0}일`}
function yesterday(){const d=new Date(Date.now()-864e5);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function completeDaily(){
  const q=S.rec.daily||{};if(q.date===today())return false;
  const streak=q.date===yesterday()?(q.streak||0)+1:1;S.rec.daily={date:today(),streak};save();return streak;
}

// ===================== 로비 =====================
let timer=null,unsub=null;
function stopAll(){clearInterval(timer);if(unsub){try{unsub()}catch(_){}unsub=null}}
function lobby(){
  stopAll();
  const t=curTier(),L=S.level,T=TIERS[t]||{c:"#4a5068"};
  const h=L.hist||[],prev=h.length>1?h[h.length-2].score:null,delta=prev!=null&&L.score!=null?L.score-prev:null;
  const cleared=S.dojo.cleared.length,unseen=QB.length-[...seen].filter(i=>i<QB.length).length;
  app.innerHTML=`
  <div class="gametitle"><small>정신건강전문요원 수련 필기 대비</small>나 혼자만 <b>수련레벨업</b></div>
  <div class="card rankcard" style="--tc:${T.c}">
    ${emblem(t,92)}
    <div class="rk-name">${S.nick?`<span class="hname">${esc(S.nick)}</span>`:""}${tierName(t)}</div>
    ${t<0?`<div class="rk-sub">각성 측정으로 헌터 등급을 확인하세요</div>`
      :`<div class="rk-sub">각성 측정 ${L.score}점${delta!=null?` <b style="color:${delta>=0?"var(--ok)":"var(--ng)"}">(${delta>=0?"+":""}${delta})</b>`:""} · ${L.date||""}${S.dojo.final?" · 최종 보스 격파":""}</div>`}
    <div class="ladder">${TIERS.map((x,k)=>`<span class="${k===t?"on":k<t?"done":""}" style="--tc:${x.c}"><b>${x.r}</b><small>${x.n}</small></span>`).join("")}</div>
    ${t===CAP&&!S.dojo.final?`<p class="muted" style="margin:10px 0 0">🏖️ S급(퇴사)은 게이트 ${DOMS.length}개를 모두 클리어하고 S급 게이트를 넘어야 얻어요</p>`:""}
    <div class="install" id="inst"></div>
  </div>
  <div class="modes">
    <button class="mode main" id="m-lt"><span class="mi">⚡</span><b>각성 측정</b><small>${LT_N}문항 적응형 · 헌터 등급을 측정합니다</small></button>
    <button class="mode" id="m-pr"><span class="mi">📋</span><b>일일 퀘스트</b><small>${dailyLabel()}</small></button>
    <button class="mode" id="m-dj"><span class="mi">🌀</span><b>게이트 공략</b><small>${cleared} / ${DOMS.length} 클리어 ${S.dojo.final?"· S급 게이트 클리어":""}</small></button>
    <button class="mode" id="m-rk"><span class="mi">🏆</span><b>헌터 랭킹</b><small>${S.nick?esc(S.nick)+"님의 순위 보기":"동료들과 기록 겨루기"}</small></button>
    <button class="mode" id="m-ta"><span class="mi">⏱️</span><b>긴급 퀘스트</b><small>20문항 · 20초 · 최고 ${S.rec.ta}점</small></button>
    <button class="mode" id="m-surv"><span class="mi">💀</span><b>던전 브레이크</b><small>하트 3개 · 최고 ${S.rec.surv}문제</small></button>
    <button class="mode" id="m-rv" ${wrong.size?"":"disabled"}><span class="mi">⛓️</span><b>패널티 존</b><small>틀린 문제 ${wrong.size}개 수감 중</small></button>
    <button class="mode" id="m-cx"><span class="mi">🌑</span><b>그림자 군단</b><small>${codex.size} / ${QB.length} 추출</small></button>
  </div>
  <div class="card small" id="acc-wrap">${accountCardHTML()}</div>
  <div class="card small">
    <div class="stats"><div><b>${S.rec.tests}</b><small>각성 측정</small></div><div><b>${cleared}</b><small>클리어 게이트</small></div><div><b>${unseen}</b><small>안 푼 문항</small></div><div><b>${Math.round(codex.size/QB.length*100)}%</b><small>그림자 추출</small></div></div>
    <details><summary>게임 규칙 보기</summary>
     <ul class="rules">
      <li><b>각성 측정:</b> ${LT_N}문항. 영역마다 중간 난이도(★★)로 시작해서, 맞히면 더 어려운 문제, 틀리면 쉬운 문제가 나와요. 어려운 문제일수록 점수 비중이 커요.</li>
      <li><b>헌터 등급:</b> 각성 측정 ${LT_CUT[1]}점↑ C급 수련준비생, ${LT_CUT[2]}점↑ B급 수련생, ${LT_CUT[3]}점↑ A급 전문요원. 다시 측정하면 최신 결과로 바뀌어요. S급(퇴사)은 S급 게이트를 넘어야 얻어요.</li>
      <li><b>게이트 공략:</b> 영역마다 ${DOJO_N}문제 중 ${DOJO_PASS}개를 맞히면 게이트 클리어. ${DOMS.length}개를 다 깨면 S급 게이트 '퇴사'(${FINAL_N}문제 중 ${FINAL_PASS}개)가 열려요.</li><li><b>일일 퀘스트:</b> 하루 한 번 ${PR_N}문항을 끝내면 연속 달성 일수가 쌓여요.</li>
      <li><b>헌터 랭킹:</b> 처음 정한 헌터명으로 등급·게이트·긴급 퀘스트·던전 브레이크 기록이 동료들에게 공개돼요. 학습 기록(푼 문제·오답)은 공개되지 않아요.</li>
      <li><b>모름</b>을 누르면 바로 정답과 해설을 볼 수 있어요. 찍는 것보다 정직하게 누르는 게 진짜 실력 확인에 좋아요.</li>
     </ul>
     <p class="muted">기록은 이 기기에 먼저 저장되고, 로그인이 되어 있으면 서버와 동기화돼요.</p>
     <div class="nav" style="justify-content:flex-start;gap:8px;flex-wrap:wrap;margin:6px 0"><button class="btn ghost tiny" id="exp">백업 코드 복사</button><button class="btn ghost tiny" id="imp">백업 코드 붙여넣기</button><button class="btn ghost tiny" id="reset">이 기기 기록 초기화</button></div>
     <div id="bk"></div>
    </details>
  </div>`;
  showInstallHint();refreshAccountCard();
  on("m-lt",startLT);on("m-pr",practiceMenu);on("m-dj",dojoMap);on("m-rk",()=>rankingView());on("m-ta",startTA);on("m-surv",startSurv);on("m-rv",startReview);on("m-cx",showCodex);
  on("exp",async e=>{const code=btoa(unescape(encodeURIComponent(JSON.stringify(data()))));
    document.getElementById("bk").innerHTML=`<textarea readonly>${code}</textarea>`;try{await navigator.clipboard.writeText(code);e.target.textContent="복사됐어요 ✓"}catch(_){e.target.textContent="아래 코드를 길게 눌러 복사하세요"}});
  on("imp",()=>{document.getElementById("bk").innerHTML=`<textarea id="bkin" placeholder="다른 기기에서 복사한 백업 코드를 붙여넣으세요"></textarea><div class="nav" style="justify-content:flex-start"><button class="btn tiny" id="bkgo">불러오기</button></div>`;
    on("bkgo",()=>{try{const d=JSON.parse(decodeURIComponent(escape(atob(document.getElementById("bkin").value.trim()))));if(!d.level||!d.rec)throw 0;store.set("pt_v4",d);location.reload()}catch(_){document.getElementById("bkgo").textContent="코드가 올바르지 않아요"}})});
  on("reset",e=>{const b=e.target;if(b.dataset.ok){try{localStorage.removeItem("pt_v4");localStorage.removeItem("pt_v3")}catch(_){}location.reload()}else{b.dataset.ok=1;b.textContent="한 번 더 누르면 이 기기 기록이 지워져요"}});
  goTop();
}

// ===================== ⚡ 각성 측정 =====================
let G;
function startLT(){
  const order=shuf(DOMS.slice()),cnt={};DOMS.forEach(d=>cnt[d]=2);
  const extra=shuf(CORE.slice()).concat(shuf(DOMS.filter(d=>!CORE.includes(d))));
  for(let k=0;k<LT_N-DOMS.length*2;k++)cnt[extra.at(k%extra.length)]++;
  const plan=[];for(let r=0;r<4;r++)order.forEach(d=>{if(cnt[d]>r)plan.push(d)});
  const lv={};DOMS.forEach(d=>lv[d]=2);
  G={mode:"lt",plan,lv,used:new Set(),log:[],i:0};ltNext();
}
function pickLv(d,lv){
  const pool=idsOf(d).filter(i=>!G.used.has(i));
  for(const dl of [0,1,-1,2,-2]){const want=lv+dl;const c=pool.filter(i=>QB[i].lv===want);if(c.length){const f=c.filter(i=>!seen.has(i));return shuf(f.length?f:c)[0]}}
  return shuf(pool)[0];
}
function ltNext(){const d=G.plan[G.i];const id=pickLv(d,G.lv[d]);G.used.add(id);G.q=toQ(id,{noOX:true});ltQ()}
function ltQ(){
  const q=G.q,n=G.plan.length;
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">⚡ 각성 측정</span><span class="muted">${G.i+1} / ${n}</span></div>
    <div class="lpbar" style="max-width:none"><i style="width:${G.i/n*100}%"></i></div>
    <p class="muted" style="margin:6px 0 0">맞히면 다음 문제가 어려워져요. 모르면 찍지 말고 '모름'</p></div>`+
    qCard(q,q.r,{showLv:true,nextLabel:G.i===n-1?"결과 보기 🏁":"다음 →"});
  bindQ(k=>{q.pick=k;q.r=judge(q,k);G.log.push({d:q.d,lv:q.lv,r:q.r,q});G.lv[q.d]=q.r==="ok"?Math.min(3,q.lv+1):Math.max(1,q.lv-1);if(q.r!=="ok")shake();ltQ()},
        ()=>{G.i++;if(G.i>=G.plan.length)ltEnd();else{ltNext();goTop()}});
}
function ltEnd(){
  const acc={};let E=0,P=0;
  G.log.forEach(x=>{acc[x.d]=acc[x.d]||{e:0,p:0};acc[x.d].p+=x.lv;P+=x.lv;if(x.r==="ok"){acc[x.d].e+=x.lv;E+=x.lv}});
  const dom={};Object.entries(acc).forEach(([k,v])=>dom[k]=Math.round(v.e/v.p*100));
  const score=Math.round(E/P*100),t=tierOf(score),prev=S.level.score,prevT=curTier();
  const hist=(S.level.hist||[]).concat([{date:today(),score}]).slice(-10);
  S.level={t,score,date:today(),dom,hist};S.rec.tests++;save();
  const nt=curTier(),weak=Object.entries(dom).sort((a,b)=>a[1]-b[1]).slice(0,3).map(([k])=>k);
  const c=G.log.filter(x=>x.r==="ok").length,misses=G.log.filter(x=>x.r!=="ok");
  const summary=`[각성 측정 결과] ${tierName(nt)} · ${score}점${prev!=null?` (지난번 ${prev}점)`:""}\n정답 ${c}/${G.log.length}\n`+Object.entries(dom).sort((a,b)=>a[1]-b[1]).map(([k,v])=>`- ${k}: ${v}`).join("\n")+`\n약점: ${weak.join(", ")}`;
  app.innerHTML=`<div class="card hero ${nt>prevT?"celebrate":""}">
    ${emblem(nt,110)}<h1>${tierName(nt)}</h1>
    <div class="lvbig">${score}점${prev!=null?` <span style="font-size:1rem;color:${score>=prev?"var(--ok)":"var(--ng)"}">(${score>=prev?"+":""}${score-prev})</span>`:""}</div>
    <p class="muted">정답 ${c} / ${G.log.length} · 어려운 문제일수록 점수 비중이 커요</p>
    ${nt===CAP&&!S.dojo.final?`<p class="muted">🏖️ S급(퇴사)은 S급 게이트를 넘어야만 얻을 수 있어요</p>`:""}
    ${t<CAP?`<p class="muted">다음 등급(${TIERS[t+1].n})까지 ${LT_CUT[t+1]-score}점</p>`:""}
  </div>
  <div class="card"><b>영역별 실력 (약한 순)</b>${domBars(dom)}</div>
  <div class="card"><b>먼저 공부할 영역</b>
    ${weak.map(w=>`<div class="weak"><div><b>${BOSS[w].e} ${w}</b><br><span class="muted">${STUDY[w]}</span></div><button class="btn tiny" data-pr="${esc(w)}">연습하기</button></div>`).join("")}</div>
  ${misses.length?`<div class="card"><b>틀리거나 모른 문제 ${misses.length}개</b>${misses.map(x=>`<div class="wrong">${esc(x.q.q)}<br><span class="a">정답: ${esc(x.q.o[x.q.a])}</span><br><span class="muted">${esc(x.q.e)}</span></div>`).join("")}</div>`:""}
  <div class="card"><b>결과 공유</b><pre>${esc(summary)}</pre>
   <div class="nav" style="justify-content:flex-start;gap:8px;flex-wrap:wrap"><button class="btn" id="cp">결과 복사</button><button class="btn ghost" id="lb">로비로</button></div></div>`;
  on("cp",async e=>{try{await navigator.clipboard.writeText(summary);e.target.textContent="복사됐어요 ✓"}catch(_){e.target.textContent="위 텍스트를 직접 복사해 주세요"}});
  on("lb",lobby);app.querySelectorAll("[data-pr]").forEach(b=>b.onclick=()=>startPractice(b.dataset.pr));
  if(prevT<0)setTimeout(()=>systemMsg([`각성 측정이 완료되었습니다.`,`당신의 등급: ${tierName(nt)}`,"약점 영역부터 일일 퀘스트로 단련하세요."],"각성"),400);
  else if(nt>prevT)setTimeout(()=>systemMsg([`등급이 상승했습니다.`,`${tierName(prevT)} → ${tierName(nt)}`,nt===CAP?"S급 게이트에 도전할 자격을 얻으려면 게이트를 모두 클리어하세요.":"다음 등급까지 계속 성장하세요."],"레벨 업"),400);
  goTop();
}

// ===================== 📝 일반 모드 =====================
function practiceMenu(){
  stopAll();const dom=S.level.dom||{},weak=Object.entries(dom).sort((a,b)=>a[1]-b[1]).slice(0,3).map(([k])=>k);
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">📋 일일 퀘스트</span><span class="muted">${dailyLabel()}</span></div>
   <p class="muted" style="margin:6px 0 0">[퀘스트] 영역을 골라 ${PR_N}문항을 완료하세요. 틀린 문제 → 안 푼 문제 순서로 나와요.</p></div>
   <div class="modes">
    <button class="mode" data-pm="all"><span class="mi">🎲</span><b>전체 섞기</b><small>모든 영역에서</small></button>
    ${weak.length?`<button class="mode" data-pm="weak"><span class="mi">🎯</span><b>약점 집중</b><small>${weak.join(", ")}</small></button>`:""}
    ${DOMS.map(d=>{const ids=idsOf(d),got=ids.filter(i=>codex.has(i)).length;return `<button class="mode" data-pm="${esc(d)}"><span class="mi">${BOSS[d].e}</span><b>${d}</b><small>${ids.length}문항 · 그림자 ${got}${dom[d]!=null?` · 실력 ${dom[d]}`:""}</small></button>`}).join("")}
   </div><div class="nav" style="justify-content:center"><button class="btn ghost" id="lb">로비로</button></div>`;
  on("lb",lobby);app.querySelectorAll("[data-pm]").forEach(b=>b.onclick=()=>startPractice(b.dataset.pm));goTop();
}
function startPractice(sel){
  const weak=Object.entries(S.level.dom||{}).sort((a,b)=>a[1]-b[1]).slice(0,3).map(([k])=>k);
  const pool=sel==="all"?ALL:sel==="weak"?ALL.filter(i=>weak.includes(QB[i].d)):idsOf(sel);
  const w=shuf(pool.filter(i=>wrong.has(i)));const ids=w.concat(pickIds(pool,PR_N,new Set(w))).slice(0,PR_N);
  const label=sel==="all"?"전체 섞기":sel==="weak"?"약점 집중":sel;
  G={mode:"pr",sel,label,qs:ids.map(toQ),i:0};prQ();
}
function prQ(){
  const q=G.qs[G.i];
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">📋 ${esc(G.label)}</span><span class="muted">${G.i+1} / ${G.qs.length}</span></div>
    <div class="pips">${G.qs.map((x,k)=>`<span class="${x.r==="ok"?"ok":x.r?"ng":k===G.i?"now":""}">${x.r==="ok"?"✔":x.r?"✖":k+1}</span>`).join("")}</div></div>`+
    qCard(q,q.r,{showLv:true,nextLabel:G.i===G.qs.length-1?"결과 보기":"다음 →"});
  bindQ(k=>{q.pick=k;q.r=judge(q,k);if(q.r!=="ok")shake();prQ()},()=>{if(G.i===G.qs.length-1)prEnd();else{G.i++;prQ();goTop()}});
}
function prEnd(){
  const c=G.qs.filter(q=>q.r==="ok").length,miss=G.qs.filter(q=>q.r!=="ok"),streak=completeDaily();
  app.innerHTML=`<div class="card hero"><div style="font-size:3rem">${c>=8?"🔥":c>=5?"👍":"💪"}</div><h1>${c} / ${G.qs.length}</h1><p class="muted">${esc(G.label)} 퀘스트 완료</p>
   <div class="nav" style="justify-content:center;gap:8px;flex-wrap:wrap"><button class="btn" id="again">한 세트 더</button><button class="btn ghost" id="pm">다른 퀘스트</button><button class="btn ghost" id="lb">로비로</button></div></div>
   ${miss.length?`<div class="card"><b>다시 볼 문제</b>${miss.map(q=>`<div class="wrong">${esc(q.q)}<br><span class="a">정답: ${esc(q.o[q.a])}</span><br><span class="muted">${esc(q.e)}</span></div>`).join("")}</div>`:""}`;
  on("again",()=>startPractice(G.sel));on("pm",practiceMenu);on("lb",lobby);goTop();
  if(streak)systemMsg([`일일 퀘스트를 완료했습니다.`,`연속 달성 ${streak}일째.`,streak>=7?"꾸준함이 레벨을 만듭니다.":"내일도 접속하면 연속 기록이 이어집니다."],"퀘스트 완료");
}

// ===================== 🏯 도장깨기 =====================
function dojoMap(){
  stopAll();const cl=new Set(S.dojo.cleared),all=cl.size===DOMS.length;
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">🌀 게이트 공략</span><span class="muted">${cl.size} / ${DOMS.length} 클리어</span></div>
    <div class="lpbar" style="max-width:none"><i style="width:${cl.size/DOMS.length*100}%"></i></div>
    <p class="muted" style="margin:6px 0 0">게이트마다 ${DOJO_N}문제 중 ${DOJO_PASS}개를 맞히면 클리어. 3번 틀리면 공략 실패예요.</p></div>
   <div class="gates">${DOMS.map(d=>{const b=BOSS[d],ok=cl.has(d),best=(S.dojo.best||{})[d];return `<button class="gate ${ok?"clear":""}" data-dj="${esc(d)}"><span class="ge">${b.e}</span><b>${b.n}</b><small>${d}</small><small>${ok?"✅ 클리어":best!=null?`최고 ${best}/${DOJO_N}`:"도전 전"}</small></button>`}).join("")}</div>
   <div class="card finalboss ${all?"open":""}"><div style="font-size:2.6rem">🏖️</div><b>S급 게이트: 퇴사</b>
     <p class="muted">${S.dojo.final?"이미 클리어했어요. 원래 세계로 귀환 완료 🏖️":all?`전 영역 ${FINAL_N}문제 중 ${FINAL_PASS}개를 맞히면 퇴사 등급!`:`게이트 ${DOMS.length}개를 모두 클리어하면 열려요 (${DOMS.length-cl.size}개 남음)`}</p>
     ${all?`<button class="btn promo-btn" id="final">${S.dojo.final?"다시 도전":"도전하기"}</button>`:""}</div>
   <div class="nav" style="justify-content:center"><button class="btn ghost" id="lb">로비로</button></div>`;
  on("lb",lobby);on("final",startFinal);app.querySelectorAll("[data-dj]").forEach(b=>b.onclick=()=>startDojo(b.dataset.dj));goTop();
}
function startDojo(d){G={mode:"dj",d,qs:pickIds(idsOf(d),DOJO_N).map(toQ),i:0,ok:0,ng:0,pass:DOJO_PASS,fail:DOJO_N-DOJO_PASS+1,boss:BOSS[d]};djQ()}
function startFinal(){
  const per=Math.ceil(FINAL_N/DOMS.length),ids=[];DOMS.forEach(d=>pickIds(idsOf(d),per).forEach(i=>ids.push(i)));
  G={mode:"fin",d:"전 영역",qs:shuf(ids).slice(0,FINAL_N).map(i=>toQ(i,{noOX:true})),i:0,ok:0,ng:0,pass:FINAL_PASS,fail:FINAL_N-FINAL_PASS+1,boss:{e:"🏖️",n:"S급 게이트: 퇴사"}};djQ();
}
function djQ(hit){
  const q=G.qs[G.i],hp=Math.max(0,100-Math.round(G.ok/G.pass*100));
  const done=G.ok>=G.pass||G.ng>=G.fail||G.i===G.qs.length-1;
  app.innerHTML=`<div class="arena"><div class="bossrow"><div class="bossemoji ${hit||""} ${G.ok>=G.pass?"dead":""}">${G.boss.e}</div>
     <div class="bossinfo"><div class="bossname">${G.boss.n}</div><div class="bossdom">${esc(G.d)}</div>
      <div class="hp"><i style="width:${hp}%"></i></div>
      <div class="hpt">정답 ${G.ok}/${G.pass} · 남은 목숨 ${"❤️".repeat(Math.max(0,G.fail-G.ng))}${"🖤".repeat(Math.min(G.ng,G.fail))}</div></div></div></div>`+
    qCard(q,q.r,{counter:`${G.i+1} / ${G.qs.length}`,nextLabel:done&&q.r?"결과 보기":"다음 →"});
  bindQ(k=>{q.pick=k;q.r=judge(q,k);let h="";if(q.r==="ok"){G.ok++;h="hit";buzz(30);setTimeout(()=>floatText(G.ok>=G.pass?"💥 격파!":"-HP","#ffc94d"),40)}else{G.ng++;shake();buzz([60,40,60])}djQ(h)},
        ()=>{if(G.ok>=G.pass||G.ng>=G.fail||G.i===G.qs.length-1)djEnd();else{G.i++;djQ();goTop()}});
}
function djEnd(){
  const win=G.ok>=G.pass,fin=G.mode==="fin";
  if(!fin){S.dojo.best=S.dojo.best||{};S.dojo.best[G.d]=Math.max(S.dojo.best[G.d]||0,G.ok);if(win&&!S.dojo.cleared.includes(G.d))S.dojo.cleared.push(G.d)}
  const wasFinal=S.dojo.final;if(fin&&win)S.dojo.final=true;save();
  const all=S.dojo.cleared.length===DOMS.length;
  app.innerHTML=`<div class="card hero ${win?"celebrate":""}">
    ${fin&&win?emblem(TOP,120):`<div style="font-size:3.4rem">${win?"💥":"💀"}</div>`}
    <h1>${fin?(win?"S급 게이트 클리어! 🏖️":"아직 귀환할 수 없습니다…"):(win?`${G.boss.n} 처치!`:"게이트 공략 실패")}</h1>
    <p>${G.ok}개 정답 · ${G.ng}개 오답</p>
    <p class="muted">${fin?(win?(wasFinal?"다시 한 번 증명했어요.":"S급 헌터 '퇴사' 달성. 원래 세계로 귀환합니다. 고생 많았어요!"):`${FINAL_PASS}개를 맞혀야 해요. 약한 영역을 일반 모드로 다지고 다시 와요.`):(win?(all?`게이트 ${DOMS.length}개를 모두 클리어했어요!`+" S급 게이트가 열렸어요.":"게이트 지도에 클리어 표시가 생겼어요."):"일일 퀘스트로 이 영역을 단련하고 다시 도전해 보세요.")}</p>
    <div class="nav" style="justify-content:center;gap:8px;flex-wrap:wrap">
     ${!win&&!fin?`<button class="btn" id="pr">이 영역 단련하기</button>`:""}<button class="btn ${win?"":"ghost"}" id="map">게이트 지도</button><button class="btn ghost" id="lb">로비로</button></div></div>`;
  on("pr",()=>startPractice(G.d));on("map",dojoMap);on("lb",lobby);
  if(win)setTimeout(()=>systemMsg(fin?["S급 게이트를 클리어했습니다.","등급이 S급 '퇴사'로 상승했습니다.","원래 세계로 귀환합니다. 🏖️"]:[`게이트를 클리어했습니다: ${G.boss.n}`,all?"모든 게이트를 클리어했습니다. S급 게이트가 열립니다.":`남은 게이트 ${DOMS.length-S.dojo.cleared.length}개`],fin?"레벨 업":"게이트 클리어"),300);
  goTop();
}

// ===================== 🏷️ 닉네임 정하기 =====================
function nickSetup(change){
  stopAll();
  app.innerHTML=`<div class="card hero"><div style="font-size:3rem">🏷️</div><div class="systag">[시스템]</div><h1>${change?"헌터명 변경":"플레이어로 선택되었습니다"}</h1>
    <p class="muted">${change?"헌터 랭킹에 표시될 이름을 바꿉니다.":"헌터명을 등록하세요. 헌터 랭킹에 이 이름으로 기록이 남아요. 실명 대신 별명을 추천해요."}</p>
    <input id="nick" maxlength="12" value="${esc(S.nick)}" placeholder="예: 수련왕, 퇴사가꿈" autocomplete="off">
    <p class="muted" style="font-size:.8rem">한글·영문·숫자·밑줄(_) 2~12자 · 다른 사람과 겹칠 수 없어요</p>
    <p class="warn" id="nmsg"></p>
    <div class="nav" style="justify-content:center;gap:8px"><button class="btn big" id="nsave">${change?"변경":"등록"}</button>${change?`<button class="btn ghost" id="lb">취소</button>`:""}</div></div>`;
  const go=async e=>{const v=document.getElementById("nick").value.trim();e&&e.target&&(e.target.disabled=true);const r=await claimNick(v);
    if(r==="ok"){lobby();systemMsg(change?[`헌터명이 '${v}'(으)로 변경되었습니다.`]:[`플레이어 등록이 완료되었습니다.`,`환영합니다, ${v} 헌터님.`,`각성 측정으로 등급을 확인하세요.`])}else{document.getElementById("nmsg").textContent=r;const b=document.getElementById("nsave");if(b)b.disabled=false}};
  on("nsave",go);on("lb",lobby);
  document.getElementById("nick").addEventListener("keydown",e=>{if(e.key==="Enter")go()});
  goTop();
}

// ===================== 🏆 랭킹 =====================
const RANK_TABS=[{k:"rk",n:"등급",f:r=>r.score<0?"-":`${TIERS[r.tier]?TIERS[r.tier].e:""} ${tierName(r.tier)} · ${r.score}점`},
 {k:"dk",n:"게이트",f:r=>r.final?"🏖️ S급 게이트 클리어":`${r.dojo} / ${DOMS.length} 게이트`},
 {k:"ta",n:"긴급",f:r=>`${r.ta}점`},{k:"surv",n:"브레이크",f:r=>`${r.surv}문제`}];
async function rankingView(tab){
  stopAll();tab=tab||"rk";
  if(!ACC.ready){app.innerHTML=`<div class="card hero"><div style="font-size:3rem">🏆</div><h1>헌터 랭킹</h1><p class="muted">${ACC.err?esc(ACC.err):"서버에 연결하는 중이에요. 잠시 후 다시 눌러주세요."}</p><button class="btn ghost" id="lb">로비로</button></div>`;on("lb",lobby);return}
  if(!S.nick)return nickSetup();
  const T=RANK_TABS.find(x=>x.k===tab);
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">🏆 헌터 랭킹</span><span class="muted">나: ${esc(S.nick)}</span></div>
    <div class="tabs">${RANK_TABS.map(x=>`<button class="tab ${x.k===tab?"on":""}" data-tab="${x.k}">${x.n}</button>`).join("")}</div></div>
    <div class="card" id="rlist"><p class="muted">불러오는 중…</p></div>
    <div class="nav" style="justify-content:center"><button class="btn ghost" id="lb">로비로</button></div>`;
  on("lb",lobby);app.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>rankingView(b.dataset.tab));
  try{await pushBoard()}catch(_){}
  let rows;try{rows=(await fetchBoard(tab)).filter(r=>tab!=="rk"||r.score>=0)}catch(e){document.getElementById("rlist").innerHTML=`<p class="warn">랭킹을 불러오지 못했어요.</p>`;return}
  const me=ACC.user.uid,mine=rows.findIndex(r=>r.uid===me);
  const medal=i=>["🥇","🥈","🥉"][i]||`${i+1}`;
  document.getElementById("rlist").innerHTML=(rows.length?rows.map((r,i)=>`<div class="rrow ${r.uid===me?"me":""}"><span class="rno">${medal(i)}</span><span class="rnick">${esc(r.nick)}</span><span class="rval">${T.f(r)}</span></div>`).join("")
    :`<p class="muted">아직 기록이 없어요. 첫 기록의 주인공이 되어 보세요!</p>`)+
    (mine<0&&rows.length>=50?`<p class="muted" style="margin-top:10px">내 기록은 50위 밖이에요.</p>`:"")+
    (tab==="rk"&&S.level.score==null?`<p class="muted" style="margin-top:10px">각성 측정을 하면 등급 랭킹에 올라가요.</p>`:"");
}

// ===================== ❤️ 생존 모드 =====================
function startSurv(){
  const ids=pickIds(ALL,QB.length);
  G={mode:"surv",queue:ids,i:0,hearts:3,score:0,fifty:2,revive:1,q:null,hidden:new Set()};
  G.q=toQ(G.queue[0]);survQ();
}
function survQ(){
  const q=G.q;
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="hearts big">${"❤️".repeat(G.hearts)}${"🖤".repeat(3-G.hearts)}</span><span class="score">🏅 ${G.score}문제</span></div>
   <div class="items"><button class="item" id="ff" ${G.fifty&&!q.r&&q.o.length===4?"":"disabled"}>✂️ 50:50 ×${G.fifty}</button><span class="item ghost">💖 부활 ×${G.revive}</span><span class="muted" style="margin-left:auto">최고 ${S.rec.surv}문제</span></div></div>`+
   qCard(q,q.r,{counter:`${G.i+1}번째`,hidden:G.hidden,nextLabel:G.hearts===0?"게임 오버…":"다음 →"});
  on("ff",()=>{if(!G.fifty)return;G.fifty--;G.hidden=new Set(shuf([0,1,2,3].filter(k=>k!==q.a)).slice(0,2));survQ()});
  bindQ(k=>{q.pick=k;q.r=judge(q,k);if(q.r==="ok"){G.score++;setTimeout(()=>floatText("+1","#3ddc97"),30)}else{G.hearts--;shake();buzz([60,40,60])}survQ()},survNext);
}
function survNext(){
  if(G.hearts===0)return survOver();
  G.i++;G.hidden=new Set();if(G.i>=G.queue.length){G.queue=shuf(G.queue.slice());G.i=0}
  G.q=toQ(G.queue[G.i]);survQ();goTop();
}
function survOver(){
  const rec=G.score>S.rec.surv;if(rec){S.rec.surv=G.score;save()}
  app.innerHTML=`<div class="card hero"><div style="font-size:3.4rem">💀</div><h1>던전 브레이크 종료</h1>
   <p><b style="font-size:1.6rem;color:var(--ink)">${G.score}문제</b> 버텼어요${rec?" · <b style='color:var(--gold)'>신기록!</b>":` (최고 ${S.rec.surv})`}</p>
   <div class="nav" style="justify-content:center;gap:8px;flex-wrap:wrap">
    ${G.revive?`<button class="btn promo-btn" id="rv">💖 부활하기 (하트 1개)</button>`:""}
    <button class="btn" id="again">다시 도전</button><button class="btn ghost" id="lb">로비로</button></div></div>`;
  on("rv",()=>{G.revive--;G.hearts=1;survNext()});on("again",startSurv);on("lb",lobby);goTop();
}

// ===================== ⏱️ 긴급 퀘스트 =====================
const TA_N=20,TA_SEC=20;
function startTA(){G={mode:"ta",qs:pickIds(ALL,TA_N).map(toQ),i:0,score:0,ok:0,left:TA_SEC};taQ(true)}
function taQ(fresh){
  clearInterval(timer);const q=G.qs[G.i];
  if(fresh){G.left=TA_SEC;G.t0=Date.now()}
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">⏱️ ${G.i+1} / ${TA_N}</span><span class="score">⭐ ${G.score}점</span><span class="muted">최고 ${S.rec.ta}</span></div>
   <div class="timer"><i id="tbar" style="width:${G.left/TA_SEC*100}%"></i></div><div class="tleft" id="tleft">${q.r?"":Math.ceil(G.left)+"초"}</div></div>`+
   qCard(q,q.r,{gain:q.gain,noIdk:true,nextLabel:G.i===TA_N-1?"결과 보기":"다음 →"});
  bindQ(k=>taPick(k),()=>{if(G.i===TA_N-1)taEnd();else{G.i++;taQ(true);goTop()}});
  if(!q.r){timer=setInterval(()=>{G.left=TA_SEC-(Date.now()-G.t0)/1000;const b=document.getElementById("tbar"),t=document.getElementById("tleft");
    if(b){b.style.width=Math.max(0,G.left/TA_SEC*100)+"%";b.style.background=G.left<5?"var(--ng)":""}if(t)t.textContent=Math.max(0,Math.ceil(G.left))+"초";
    if(G.left<=0){q.timeout=true;taPick(-2)}},100)}
}
function taPick(k){
  clearInterval(timer);const q=G.qs[G.i];if(q.r)return;q.pick=k;
  q.r=judge(q,k);if(k===-2)q.r="ng";
  if(q.r==="ok"){const pts=100+Math.max(0,Math.round(G.left))*10;G.score+=pts;G.ok++;q.gain=`+${pts}점`;setTimeout(()=>floatText(`+${pts}`,"#ffc94d"),30)}else shake();
  taQ(false);
}
function taEnd(){
  clearInterval(timer);const rec=G.score>S.rec.ta;if(rec){S.rec.ta=G.score;save()}
  app.innerHTML=`<div class="card hero"><div style="font-size:3.4rem">⏱️</div><h1>${G.score}점</h1>
   <p>${TA_N}문제 중 ${G.ok}개 정답${rec?" · <b style='color:var(--gold)'>신기록!</b>":` (최고 ${S.rec.ta}점)`}</p>
   <p class="muted">정답 100점 + 남은 시간 1초당 10점</p>
   <div class="nav" style="justify-content:center;gap:8px"><button class="btn" id="again">다시 도전</button><button class="btn ghost" id="lb">로비로</button></div></div>`;
  on("again",startTA);on("lb",lobby);goTop();
}

// ===================== 📕 오답 복습 =====================
function startReview(){const ids=shuf([...wrong]).slice(0,25);if(!ids.length)return lobby();G={mode:"rv",qs:ids.map(toQ),i:0};rvQ()}
function rvQ(){
  const q=G.qs[G.i];
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">⛓️ 패널티 존</span><span class="muted">${G.i+1} / ${G.qs.length} · 맞히면 탈출</span></div></div>`+qCard(q,q.r,{showLv:true,nextLabel:G.i===G.qs.length-1?"결과 보기":"다음 →",gain:q.r==="ok"?"🔓 탈출!":""});
  bindQ(k=>{q.pick=k;q.r=judge(q,k);rvQ()},()=>{if(G.i===G.qs.length-1)rvEnd();else{G.i++;rvQ();goTop()}});
}
function rvEnd(){
  const g=G.qs.filter(q=>q.r==="ok").length;
  app.innerHTML=`<div class="card hero"><div style="font-size:3.4rem">🔓</div><h1>${g}문제 탈출</h1><p>${G.qs.length}문제 중 ${g}개를 맞혀 패널티 존에서 풀려났어요. 남은 수감 ${wrong.size}문제.</p>
   <div class="nav" style="justify-content:center;gap:8px">${wrong.size?`<button class="btn" id="again">한 번 더</button>`:""}<button class="btn ghost" id="lb">로비로</button></div></div>`;
  on("again",startReview);on("lb",lobby);goTop();
}

// ===================== 📖 도감 =====================
function showCodex(){
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">🌑 그림자 군단</span><span class="score">${codex.size} / ${QB.length}</span></div>
   <div class="lpbar" style="max-width:none"><i style="width:${codex.size/QB.length*100}%"></i></div><p class="muted" style="margin:6px 0 0">문제를 맞히면 그림자를 추출해 군단에 합류시켜요. 그림자를 누르면 해설을 다시 볼 수 있어요.</p></div>
   ${DOMS.map(d=>{const ids=idsOf(d),got=ids.filter(i=>codex.has(i)).length;return `<div class="card"><div class="cxhead"><span>${BOSS[d].e} <b>${d}</b></span><span class="muted">${got}/${ids.length}${got===ids.length?" · 👑 군단 완성":""}</span></div>
     <div class="cards">${ids.map(i=>codex.has(i)?`<button class="cx on" data-i="${i}">${esc(QB[i].a.length>26?QB[i].a.slice(0,25)+"…":QB[i].a)}</button>`:`<span class="cx">?</span>`).join("")}</div></div>`}).join("")}
   <div id="modal"></div><div class="nav" style="justify-content:center"><button class="btn ghost" id="lb">로비로</button></div>`;
  on("lb",lobby);
  app.querySelectorAll(".cx.on").forEach(b=>b.onclick=()=>{const x=QB[+b.dataset.i];document.getElementById("modal").innerHTML=`<div class="modal" id="mbg"><div class="card mcard"><div class="meta"><span class="tag">${x.d}</span></div><p class="q">${esc(x.q)}</p><p class="a" style="color:var(--ok);font-weight:700">✔ ${esc(x.a)}</p><p class="muted" style="font-size:.92rem">${esc(x.e)}</p><div class="nav"><button class="btn" id="mx">닫기</button></div></div></div>`;
    on("mx",()=>document.getElementById("modal").innerHTML="");document.getElementById("mbg").onclick=e=>{if(e.target.id==="mbg")document.getElementById("modal").innerHTML=""}});
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
    on("instgo",async()=>{deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(_){}deferredPrompt=null;el.style.display="none"})}
  else if(ios&&location.protocol==="https:"){el.style.display="block";el.innerHTML=`📲 Safari 아래쪽 <b>공유 버튼</b> → <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요. <button class="btn ghost tiny" id="instx">닫기</button>`}
  else return;
  on("instx",()=>{store.set("pt_hide_inst",true);el.style.display="none"});
}
if("serviceWorker" in navigator&&location.protocol==="https:"&&window.self===window.top){navigator.serviceWorker.register("sw.js").catch(()=>{})}
initAccount();
lobby();
