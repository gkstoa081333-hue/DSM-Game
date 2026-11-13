// ===================== 설정 =====================
const TIERS=[
 {n:"미생",c:"#9aa1b5",e:"🌱"},
 {n:"수련준비생",c:"#4fd1a0",e:"📘"},
 {n:"수련생",c:"#4da3ff",e:"🩺"},
 {n:"전문요원",c:"#b46cff",e:"🎖️"},
 {n:"퇴사",c:"#ffc94d",e:"🏖️"}
];
const TOP=4, CAP=3;                 // 레벨테스트로는 전문요원(3)까지, 퇴사(4)는 최종 보스로만
const LT_CUT=[0,40,60,75];          // 레벨테스트 점수 → 미생/수련준비생/수련생/전문요원
const LT_N=30, PR_N=10, DOJO_N=10, DOJO_PASS=8, FINAL_N=40, FINAL_PASS=32, DUEL_N=10;
// 영역별 관문 보스 (질환이 아니라 '시험 관문'을 지키는 캐릭터)
const BOSS={
 [D1]:{e:"📚",n:"DSM 대사서"},[D2]:{e:"🔮",n:"스펙트럼 예언자"},[D3]:{e:"🌗",n:"달의 수호자"},
 [D4]:{e:"🛡️",n:"긴장의 문지기"},[D5]:{e:"🎭",n:"가면의 기사"},[D6]:{e:"⏳",n:"기억의 시계공"},
 [D7]:{e:"⚗️",n:"약물 연금술사"},[D8]:{e:"⚖️",n:"위기의 파수꾼"},[D9]:{e:"🧠",n:"무의식의 현자"},
 [D10]:{e:"🌙",n:"꿈의 파수꾼"},[D11]:{e:"📜",n:"법조문 수호자"}
};
const DOMS=[D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11];
const CORE=[D2,D3,D4,D6,D7,D11];

// ===================== 저장 =====================
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(_){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
const raw=store.get("pt_v4",null), old=raw?null:store.get("pt_v3",null), base=raw||old||{};
const S={level:{t:-1,score:null,date:null,dom:{},hist:[]},dojo:{cleared:[],best:{},final:false},rec:{surv:0,ta:0,tests:0,duelW:0,duelL:0,duelD:0},nick:""};
if(raw){Object.assign(S.level,raw.level||{});Object.assign(S.dojo,raw.dojo||{});Object.assign(S.rec,raw.rec||{});S.nick=raw.nick||""}
else if(old&&old.rec){S.rec.surv=old.rec.surv||0;S.rec.ta=old.rec.ta||0}
const seen=new Set(base.seen||store.get("dsm_seen",[]));
const wrong=new Set(base.wrong||store.get("dsm_wrong",[]));
const codex=new Set(base.codex||[]);
function data(){return {level:S.level,dojo:S.dojo,rec:S.rec,nick:S.nick,seen:[...seen],wrong:[...wrong],codex:[...codex]}}
function save(){store.set("pt_v4",data());if(typeof scheduleSync==="function")scheduleSync()}
function curTier(){return S.dojo.final?TOP:S.level.t}
function tierOf(score){let t=0;LT_CUT.forEach((c,k)=>{if(score>=c)t=k});return Math.min(t,CAP)}

// ===================== 유틸 =====================
const app=document.getElementById("app");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuf=a=>{for(let k=a.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a};
const goTop=()=>{try{window.scrollTo({top:0,behavior:"smooth"})}catch(_){}};
const ALL=BANK.map((_,i)=>i);
const idsOf=d=>ALL.filter(i=>BANK[i][0]===d);
function toQ(id){const b=BANK[id],o=shuf(b[2].slice());return {id,d:b[0],q:b[1],o,a:o.indexOf(b[2][0]),e:b[3],lv:(META[id]||{}).lv||2}}
function pickIds(pool,n,ex){ex=ex||new Set();const f=shuf(pool.filter(i=>!seen.has(i)&&!ex.has(i))),o=shuf(pool.filter(i=>seen.has(i)&&!ex.has(i)));return f.concat(o).slice(0,n)}
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(_){}}
function floatText(t,color){const d=document.createElement("div");d.className="float";d.textContent=t;if(color)d.style.color=color;document.body.appendChild(d);setTimeout(()=>d.remove(),1100)}
function emblem(t,size){const T=TIERS[t]||{c:"#4a5068",e:"?"};return `<div class="emblem" style="--tc:${T.c};width:${size}px;height:${size}px;font-size:${size*.42}px"><span>${T.e}</span></div>`}
const tierName=t=>t<0?"등급 미정":TIERS[t].n;
const stars=lv=>"★".repeat(lv)+"☆".repeat(3-lv);
const on=(id,f)=>{const e=document.getElementById(id);if(e)e.onclick=f};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
function shake(){setTimeout(()=>{const c=document.getElementById("qc");c&&c.classList.add("shake")},10)}

// 출처·검수 상태·신고
const REPO="https://github.com/gkstoa081333-hue/DSM-Game";
function srcLine(id){
  const m=META[id]||{};const s=m.src||{};
  const t=s.u?`<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t||"출처")}</a>`:esc(s.t||"");
  return `<div class="src">${m.st==="draft"?`<span class="badge">검수 전</span>`:""}${t?`<span>출처: ${t}</span>`:""}<button class="rep" data-rep="${id}">🚩 문제 신고</button></div><div class="repbox" id="rep-${id}"></div>`;
}
// 판정: 본 문제·오답노트·도감 기록을 바로 반영
function judge(q,k){
  seen.add(q.id);
  const r=k===-1?"idk":k===q.a?"ok":"ng";
  if(r==="ok"){wrong.delete(q.id);codex.add(q.id)}else wrong.add(q.id);
  save();return r;
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
   <div class="meta"><span class="tag">${q.d}</span><span>${opt.showLv?`<span class="lv">${stars(q.lv)}</span> `:""}${opt.counter||""}</span></div>
   <p class="q">${esc(q.q)}</p>${btns}
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

// ===================== 로비 =====================
let timer=null,unsub=null;
function stopAll(){clearInterval(timer);if(unsub){try{unsub()}catch(_){}unsub=null}}
function lobby(){
  stopAll();
  const t=curTier(),L=S.level,T=TIERS[t]||{c:"#4a5068"};
  const h=L.hist||[],prev=h.length>1?h[h.length-2].score:null,delta=prev!=null&&L.score!=null?L.score-prev:null;
  const cleared=S.dojo.cleared.length,unseen=BANK.length-[...seen].filter(i=>i<BANK.length).length;
  app.innerHTML=`
  <div class="card rankcard" style="--tc:${T.c}">
    ${emblem(t,92)}
    <div class="rk-name">${tierName(t)}</div>
    ${t<0?`<div class="rk-sub">레벨테스트로 지금 실력을 확인해 보세요</div>`
      :`<div class="rk-sub">레벨테스트 ${L.score}점${delta!=null?` <b style="color:${delta>=0?"var(--ok)":"var(--ng)"}">(${delta>=0?"+":""}${delta})</b>`:""} · ${L.date||""}${S.dojo.final?" · 최종 보스 격파":""}</div>`}
    <div class="ladder">${TIERS.map((x,k)=>`<span class="${k===t?"on":k<t?"done":""}" style="--tc:${x.c}">${x.e}<small>${x.n}</small></span>`).join("")}</div>
    ${t===CAP&&!S.dojo.final?`<p class="muted" style="margin:10px 0 0">🏖️ 퇴사는 도장깨기 11관문을 모두 깨고 최종 보스를 이겨야 얻어요</p>`:""}
    <div class="install" id="inst"></div>
  </div>
  <div class="modes">
    <button class="mode main" id="m-lt"><span class="mi">🎯</span><b>레벨테스트</b><small>${LT_N}문항 · 맞히면 어려워지는 적응형 · 결과로 등급 결정</small></button>
    <button class="mode" id="m-pr"><span class="mi">📝</span><b>일반 모드</b><small>영역 골라 ${PR_N}문항씩 연습</small></button>
    <button class="mode" id="m-dj"><span class="mi">🏯</span><b>도장깨기</b><small>${cleared} / ${DOMS.length} 관문 ${S.dojo.final?"· 퇴사 완료":""}</small></button>
    <button class="mode" id="m-du"><span class="mi">⚔️</span><b>1:1 대결</b><small>동료와 같은 ${DUEL_N}문제 · ${S.rec.duelW}승 ${S.rec.duelL}패</small></button>
    <button class="mode" id="m-ta"><span class="mi">⏱️</span><b>타임어택</b><small>20문항 · 20초 · 최고 ${S.rec.ta}점</small></button>
    <button class="mode" id="m-surv"><span class="mi">❤️</span><b>생존 모드</b><small>하트 3개 · 최고 ${S.rec.surv}문제</small></button>
    <button class="mode" id="m-rv" ${wrong.size?"":"disabled"}><span class="mi">📕</span><b>오답 복습</b><small>오답노트 ${wrong.size}문항</small></button>
    <button class="mode" id="m-cx"><span class="mi">📖</span><b>진단명 도감</b><small>${codex.size} / ${BANK.length} 수집</small></button>
  </div>
  <div class="card small" id="acc-wrap">${accountCardHTML()}</div>
  <div class="card small">
    <div class="stats"><div><b>${S.rec.tests}</b><small>레벨테스트</small></div><div><b>${cleared}</b><small>격파 관문</small></div><div><b>${unseen}</b><small>안 푼 문항</small></div><div><b>${Math.round(codex.size/BANK.length*100)}%</b><small>도감 완성</small></div></div>
    <details><summary>게임 규칙 보기</summary>
     <ul class="rules">
      <li><b>레벨테스트:</b> ${LT_N}문항. 영역마다 중간 난이도(★★)로 시작해서, 맞히면 더 어려운 문제, 틀리면 쉬운 문제가 나와요. 어려운 문제일수록 점수 비중이 커요.</li>
      <li><b>등급:</b> 레벨테스트 ${LT_CUT[1]}점↑ 수련준비생, ${LT_CUT[2]}점↑ 수련생, ${LT_CUT[3]}점↑ 전문요원. 다시 보면 최신 결과로 바뀌어요.</li>
      <li><b>도장깨기:</b> 영역마다 ${DOJO_N}문제 중 ${DOJO_PASS}개를 맞히면 관문 격파. 11관문을 다 깨면 최종 보스 '퇴사 시험'(${FINAL_N}문제 중 ${FINAL_PASS}개)에 도전할 수 있고, 통과하면 퇴사 등급이에요.</li>
      <li><b>1:1 대결:</b> 대결 코드를 동료에게 보내면 같은 ${DUEL_N}문제를 풀어요. 정답 수가 많은 쪽이 이기고, 같으면 더 빨리 푼 쪽이 이겨요.</li>
      <li><b>모름</b>을 누르면 바로 정답과 해설을 볼 수 있어요. 찍는 것보다 정직하게 누르는 게 진짜 실력 확인에 좋아요.</li>
     </ul>
     <p class="muted">기록은 이 기기에 먼저 저장되고, 로그인이 되어 있으면 서버와 동기화돼요.</p>
     <div class="nav" style="justify-content:flex-start;gap:8px;flex-wrap:wrap;margin:6px 0"><button class="btn ghost tiny" id="exp">백업 코드 복사</button><button class="btn ghost tiny" id="imp">백업 코드 붙여넣기</button><button class="btn ghost tiny" id="reset">이 기기 기록 초기화</button></div>
     <div id="bk"></div>
    </details>
  </div>`;
  showInstallHint();refreshAccountCard();
  on("m-lt",startLT);on("m-pr",practiceMenu);on("m-dj",dojoMap);on("m-du",duelMenu);on("m-ta",startTA);on("m-surv",startSurv);on("m-rv",startReview);on("m-cx",showCodex);
  on("exp",async e=>{const code=btoa(unescape(encodeURIComponent(JSON.stringify(data()))));
    document.getElementById("bk").innerHTML=`<textarea readonly>${code}</textarea>`;try{await navigator.clipboard.writeText(code);e.target.textContent="복사됐어요 ✓"}catch(_){e.target.textContent="아래 코드를 길게 눌러 복사하세요"}});
  on("imp",()=>{document.getElementById("bk").innerHTML=`<textarea id="bkin" placeholder="다른 기기에서 복사한 백업 코드를 붙여넣으세요"></textarea><div class="nav" style="justify-content:flex-start"><button class="btn tiny" id="bkgo">불러오기</button></div>`;
    on("bkgo",()=>{try{const d=JSON.parse(decodeURIComponent(escape(atob(document.getElementById("bkin").value.trim()))));if(!d.level||!d.rec)throw 0;store.set("pt_v4",d);location.reload()}catch(_){document.getElementById("bkgo").textContent="코드가 올바르지 않아요"}})});
  on("reset",e=>{const b=e.target;if(b.dataset.ok){try{localStorage.removeItem("pt_v4");localStorage.removeItem("pt_v3")}catch(_){}location.reload()}else{b.dataset.ok=1;b.textContent="한 번 더 누르면 이 기기 기록이 지워져요"}});
  goTop();
}

// ===================== 🎯 레벨테스트 =====================
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
  for(const dl of [0,1,-1,2,-2]){const want=lv+dl;const c=pool.filter(i=>(META[i]||{}).lv===want);if(c.length){const f=c.filter(i=>!seen.has(i));return shuf(f.length?f:c)[0]}}
  return shuf(pool)[0];
}
function ltNext(){const d=G.plan[G.i];const id=pickLv(d,G.lv[d]);G.used.add(id);G.q=toQ(id);ltQ()}
function ltQ(){
  const q=G.q,n=G.plan.length;
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">🎯 레벨테스트</span><span class="muted">${G.i+1} / ${n}</span></div>
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
  const summary=`[레벨테스트 결과] ${tierName(nt)} · ${score}점${prev!=null?` (지난번 ${prev}점)`:""}\n정답 ${c}/${G.log.length}\n`+Object.entries(dom).sort((a,b)=>a[1]-b[1]).map(([k,v])=>`- ${k}: ${v}`).join("\n")+`\n약점: ${weak.join(", ")}`;
  app.innerHTML=`<div class="card hero ${nt>prevT?"celebrate":""}">
    ${emblem(nt,110)}<h1>${tierName(nt)}</h1>
    <div class="lvbig">${score}점${prev!=null?` <span style="font-size:1rem;color:${score>=prev?"var(--ok)":"var(--ng)"}">(${score>=prev?"+":""}${score-prev})</span>`:""}</div>
    <p class="muted">정답 ${c} / ${G.log.length} · 어려운 문제일수록 점수 비중이 커요</p>
    ${nt===CAP&&!S.dojo.final?`<p class="muted">🏖️ 퇴사 등급은 도장깨기 최종 보스로만 얻을 수 있어요</p>`:""}
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
  if(nt>prevT)for(let k=0;k<3;k++)setTimeout(()=>floatText(["🎉","✨","⬆️"][k]+" "+TIERS[nt].n+"!","#ffc94d"),k*350);
  goTop();
}

// ===================== 📝 일반 모드 =====================
function practiceMenu(){
  stopAll();const dom=S.level.dom||{},weak=Object.entries(dom).sort((a,b)=>a[1]-b[1]).slice(0,3).map(([k])=>k);
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">📝 일반 모드</span><span class="muted">영역을 골라 ${PR_N}문항씩</span></div>
   <p class="muted" style="margin:6px 0 0">틀린 문제 → 안 푼 문제 순서로 나와요. 등급에는 영향이 없어요.</p></div>
   <div class="modes">
    <button class="mode" data-pm="all"><span class="mi">🎲</span><b>전체 섞기</b><small>모든 영역에서</small></button>
    ${weak.length?`<button class="mode" data-pm="weak"><span class="mi">🎯</span><b>약점 집중</b><small>${weak.join(", ")}</small></button>`:""}
    ${DOMS.map(d=>{const ids=idsOf(d),got=ids.filter(i=>codex.has(i)).length;return `<button class="mode" data-pm="${esc(d)}"><span class="mi">${BOSS[d].e}</span><b>${d}</b><small>${ids.length}문항 · 도감 ${got}${dom[d]!=null?` · 실력 ${dom[d]}`:""}</small></button>`}).join("")}
   </div><div class="nav" style="justify-content:center"><button class="btn ghost" id="lb">로비로</button></div>`;
  on("lb",lobby);app.querySelectorAll("[data-pm]").forEach(b=>b.onclick=()=>startPractice(b.dataset.pm));goTop();
}
function startPractice(sel){
  const weak=Object.entries(S.level.dom||{}).sort((a,b)=>a[1]-b[1]).slice(0,3).map(([k])=>k);
  const pool=sel==="all"?ALL:sel==="weak"?ALL.filter(i=>weak.includes(BANK[i][0])):idsOf(sel);
  const w=shuf(pool.filter(i=>wrong.has(i)));const ids=w.concat(pickIds(pool,PR_N,new Set(w))).slice(0,PR_N);
  const label=sel==="all"?"전체 섞기":sel==="weak"?"약점 집중":sel;
  G={mode:"pr",sel,label,qs:ids.map(toQ),i:0};prQ();
}
function prQ(){
  const q=G.qs[G.i];
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">📝 ${esc(G.label)}</span><span class="muted">${G.i+1} / ${G.qs.length}</span></div>
    <div class="pips">${G.qs.map((x,k)=>`<span class="${x.r==="ok"?"ok":x.r?"ng":k===G.i?"now":""}">${x.r==="ok"?"✔":x.r?"✖":k+1}</span>`).join("")}</div></div>`+
    qCard(q,q.r,{showLv:true,nextLabel:G.i===G.qs.length-1?"결과 보기":"다음 →"});
  bindQ(k=>{q.pick=k;q.r=judge(q,k);if(q.r!=="ok")shake();prQ()},()=>{if(G.i===G.qs.length-1)prEnd();else{G.i++;prQ();goTop()}});
}
function prEnd(){
  const c=G.qs.filter(q=>q.r==="ok").length,miss=G.qs.filter(q=>q.r!=="ok");
  app.innerHTML=`<div class="card hero"><div style="font-size:3rem">${c>=8?"🔥":c>=5?"👍":"💪"}</div><h1>${c} / ${G.qs.length}</h1><p class="muted">${esc(G.label)} 연습 완료</p>
   <div class="nav" style="justify-content:center;gap:8px;flex-wrap:wrap"><button class="btn" id="again">한 세트 더</button><button class="btn ghost" id="pm">다른 영역</button><button class="btn ghost" id="lb">로비로</button></div></div>
   ${miss.length?`<div class="card"><b>다시 볼 문제</b>${miss.map(q=>`<div class="wrong">${esc(q.q)}<br><span class="a">정답: ${esc(q.o[q.a])}</span><br><span class="muted">${esc(q.e)}</span></div>`).join("")}</div>`:""}`;
  on("again",()=>startPractice(G.sel));on("pm",practiceMenu);on("lb",lobby);goTop();
}

// ===================== 🏯 도장깨기 =====================
function dojoMap(){
  stopAll();const cl=new Set(S.dojo.cleared),all=cl.size===DOMS.length;
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">🏯 도장깨기</span><span class="muted">${cl.size} / ${DOMS.length} 격파</span></div>
    <div class="lpbar" style="max-width:none"><i style="width:${cl.size/DOMS.length*100}%"></i></div>
    <p class="muted" style="margin:6px 0 0">관문마다 ${DOJO_N}문제 중 ${DOJO_PASS}개를 맞히면 격파. 3개 틀리면 그 자리에서 탈락이에요.</p></div>
   <div class="gates">${DOMS.map(d=>{const b=BOSS[d],ok=cl.has(d),best=(S.dojo.best||{})[d];return `<button class="gate ${ok?"clear":""}" data-dj="${esc(d)}"><span class="ge">${b.e}</span><b>${b.n}</b><small>${d}</small><small>${ok?"✅ 격파":best!=null?`최고 ${best}/${DOJO_N}`:"도전 전"}</small></button>`}).join("")}</div>
   <div class="card finalboss ${all?"open":""}"><div style="font-size:2.6rem">🏖️</div><b>최종 보스: 퇴사 시험</b>
     <p class="muted">${S.dojo.final?"이미 격파했어요. 축하해요, 퇴사입니다 🎉":all?`전 영역 ${FINAL_N}문제 중 ${FINAL_PASS}개를 맞히면 퇴사 등급!`:`11관문을 모두 깨면 열려요 (${DOMS.length-cl.size}개 남음)`}</p>
     ${all?`<button class="btn promo-btn" id="final">${S.dojo.final?"다시 도전":"도전하기"}</button>`:""}</div>
   <div class="nav" style="justify-content:center"><button class="btn ghost" id="lb">로비로</button></div>`;
  on("lb",lobby);on("final",startFinal);app.querySelectorAll("[data-dj]").forEach(b=>b.onclick=()=>startDojo(b.dataset.dj));goTop();
}
function startDojo(d){G={mode:"dj",d,qs:pickIds(idsOf(d),DOJO_N).map(toQ),i:0,ok:0,ng:0,pass:DOJO_PASS,fail:DOJO_N-DOJO_PASS+1,boss:BOSS[d]};djQ()}
function startFinal(){
  const per=Math.ceil(FINAL_N/DOMS.length),ids=[];DOMS.forEach(d=>pickIds(idsOf(d),per).forEach(i=>ids.push(i)));
  G={mode:"fin",d:"전 영역",qs:shuf(ids).slice(0,FINAL_N).map(toQ),i:0,ok:0,ng:0,pass:FINAL_PASS,fail:FINAL_N-FINAL_PASS+1,boss:{e:"🏖️",n:"퇴사 시험"}};djQ();
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
    <h1>${fin?(win?"퇴사 시험 통과! 🏖️":"퇴사는 아직…"):(win?`${G.boss.n} 격파!`:"관문 돌파 실패")}</h1>
    <p>${G.ok}개 정답 · ${G.ng}개 오답</p>
    <p class="muted">${fin?(win?(wasFinal?"다시 한 번 증명했어요.":"최고 등급 '퇴사'를 얻었어요. 고생 많았어요!"):`${FINAL_PASS}개를 맞혀야 해요. 약한 영역을 일반 모드로 다지고 다시 와요.`):(win?(all?"11관문을 모두 깼어요! 최종 보스가 열렸어요.":"도장깨기 지도에 격파 표시가 생겼어요."):"일반 모드에서 이 영역을 연습하고 다시 도전해 보세요.")}</p>
    <div class="nav" style="justify-content:center;gap:8px;flex-wrap:wrap">
     ${!win&&!fin?`<button class="btn" id="pr">이 영역 연습하기</button>`:""}<button class="btn ${win?"":"ghost"}" id="map">도장깨기 지도</button><button class="btn ghost" id="lb">로비로</button></div></div>`;
  on("pr",()=>startPractice(G.d));on("map",dojoMap);on("lb",lobby);
  if(win)for(let k=0;k<3;k++)setTimeout(()=>floatText(["🎉","💥","✨"][k],"#ffc94d"),k*300);
  goTop();
}

// ===================== ⚔️ 1:1 대결 =====================
function duelMenu(){
  stopAll();
  if(!ACC.ready){app.innerHTML=`<div class="card hero"><div style="font-size:3rem">⚔️</div><h1>1:1 대결</h1><p class="muted">${ACC.err?esc(ACC.err):"서버에 연결하는 중이에요. 잠시 후 다시 눌러주세요."}</p><button class="btn ghost" id="lb">로비로</button></div>`;on("lb",lobby);return}
  app.innerHTML=`<div class="card hero"><div style="font-size:3rem">⚔️</div><h1>1:1 대결</h1>
    <p class="muted">같은 ${DUEL_N}문제를 각자 풀어요. 정답이 많은 쪽이 이기고, 같으면 더 빨리 푼 쪽이 이겨요.</p>
    <label class="muted" for="nick">상대에게 보일 닉네임 (실명 대신 별명 추천)</label>
    <input id="nick" maxlength="12" value="${esc(S.nick)}" placeholder="예: 수련왕">
    <div class="nav" style="justify-content:center;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn" id="mk">대결 만들기</button></div>
    <div class="joinrow"><input id="code" maxlength="6" placeholder="받은 코드 6자리" autocapitalize="characters"><button class="btn" id="jn">참가</button></div>
    <p class="warn" id="dmsg"></p>
    <button class="btn ghost" id="lb">로비로</button></div>`;
  const nick=()=>{const v=document.getElementById("nick").value.trim().slice(0,12);if(!v){document.getElementById("dmsg").textContent="닉네임을 입력해 주세요";return null}if(v!==S.nick){S.nick=v;save()}return v};
  on("lb",lobby);
  on("mk",async e=>{const n=nick();if(!n)return;e.target.disabled=true;try{const code=await createDuel(n);duelWait(code)}catch(err){e.target.disabled=false;document.getElementById("dmsg").textContent="대결을 만들지 못했어요. 다시 시도해 주세요."}});
  on("jn",async e=>{const n=nick();if(!n)return;const code=document.getElementById("code").value.trim().toUpperCase();if(code.length!==6){document.getElementById("dmsg").textContent="코드 6자리를 입력해 주세요";return}
    e.target.disabled=true;const res=await joinDuel(code,n);if(res!=="ok"){e.target.disabled=false;document.getElementById("dmsg").textContent=res;return}duelPlay(code,"guest")});
}
function duelWait(code){
  app.innerHTML=`<div class="card hero"><div style="font-size:3rem">⏳</div><h1>상대를 기다리는 중</h1>
    <p class="muted">이 코드를 동료에게 보내주세요</p><div class="code">${code}</div>
    <div class="nav" style="justify-content:center;gap:8px"><button class="btn" id="cc">코드 복사</button><button class="btn ghost" id="cx">취소</button></div></div>`;
  on("cc",async e=>{try{await navigator.clipboard.writeText(`DSM 랭크전 1:1 대결 코드: ${code}\n${location.origin+location.pathname}`);e.target.textContent="복사됐어요 ✓"}catch(_){e.target.textContent=code}});
  on("cx",lobby);
  unsub=watchDuel(code,d=>{if(d&&d.guest){stopAll();duelPlay(code,"host")}});
}
function duelPlay(code,role){
  stopAll();const other=role==="host"?"guest":"host";
  G={mode:"du",code,role,other,qs:null,i:0,score:0,ans:[],t0:Date.now(),opp:null,me:null,closed:false};
  unsub=watchDuel(code,d=>{if(!d)return;G.opp=d[other];G.me=d[role];if(!G.qs){G.qs=d.qids.map(toQ);duQ()}else if(G.finished)duResult();else duHead()});
}
function duHeadHTML(){
  const o=G.opp||{},on_=(o.ans||[]).length;
  return `<div class="plrow"><span class="score">⚔️ 나 ${G.score}</span><span class="muted">${G.i+1} / ${G.qs.length}</span><span class="score">${esc(o.nick||"상대")} ${o.score||0}</span></div>
   <div class="duelbar"><div><i style="width:${G.ans.length/G.qs.length*100}%"></i></div><div class="opp"><i style="width:${on_/G.qs.length*100}%"></i></div></div>`;
}
function duHead(){const h=document.getElementById("dhead");if(h)h.innerHTML=duHeadHTML()}
function duQ(){
  const q=G.qs[G.i];
  app.innerHTML=`<div class="arena" id="dhead">${duHeadHTML()}</div>`+qCard(q,q.r,{noIdk:true,nextLabel:G.i===G.qs.length-1?"제출하기":"다음 →"});
  bindQ(async k=>{if(q.r)return;q.pick=k;q.r=judge(q,k);G.ans.push(q.r==="ok"?1:0);if(q.r==="ok")G.score++;else shake();duQ();
      try{await duelUpdate(G.code,G.role,{ans:G.ans,score:G.score})}catch(_){}},
    async()=>{if(G.i<G.qs.length-1){G.i++;duQ();goTop();return}
      G.finished=true;const ms=Date.now()-G.t0;try{await duelUpdate(G.code,G.role,{ans:G.ans,score:G.score,done:true,ms})}catch(_){}duResult()});
}
function duResult(){
  const me=G.me||{},o=G.opp||{};
  if(!o.done){app.innerHTML=`<div class="card hero"><div style="font-size:3rem">⏳</div><h1>${G.score} / ${G.qs.length}</h1><p class="muted">${esc(o.nick||"상대")}님이 아직 푸는 중이에요 (${(o.ans||[]).length}/${G.qs.length})</p><button class="btn ghost" id="lb">로비로 (결과는 나중에 못 봐요)</button></div>`;on("lb",lobby);return}
  if(!me.done)return;
  const res=me.score!==o.score?(me.score>o.score?"W":"L"):(me.ms===o.ms?"D":(me.ms<o.ms?"W":"L"));
  if(!G.closed){G.closed=true;S.rec[res==="W"?"duelW":res==="L"?"duelL":"duelD"]++;save()}
  const sec=x=>Math.round((x||0)/1000)+"초";
  app.innerHTML=`<div class="card hero ${res==="W"?"celebrate":""}"><div style="font-size:3.4rem">${res==="W"?"🏆":res==="L"?"🥲":"🤝"}</div>
    <h1>${res==="W"?"승리!":res==="L"?"패배":"무승부"}</h1>
    <div class="vs"><div><b>${esc(me.nick||"나")}</b><span>${me.score}</span><small>${sec(me.ms)}</small></div><div class="x">VS</div><div><b>${esc(o.nick||"상대")}</b><span>${o.score}</span><small>${sec(o.ms)}</small></div></div>
    <p class="muted">통산 ${S.rec.duelW}승 ${S.rec.duelL}패 ${S.rec.duelD}무</p>
    <div class="nav" style="justify-content:center;gap:8px"><button class="btn" id="re">새 대결</button><button class="btn ghost" id="lb">로비로</button></div></div>
    <div class="card"><b>문제 다시 보기</b>${G.qs.map(q=>`<div class="wrong">${q.r==="ok"?"✔":"✖"} ${esc(q.q)}<br><span class="a">정답: ${esc(q.o[q.a])}</span><br><span class="muted">${esc(q.e)}</span></div>`).join("")}</div>`;
  stopAll();on("re",duelMenu);on("lb",lobby);goTop();
}

// ===================== ❤️ 생존 모드 =====================
function startSurv(){
  const ids=pickIds(ALL,BANK.length);
  G={mode:"surv",queue:ids,i:0,hearts:3,score:0,fifty:2,revive:1,q:null,hidden:new Set()};
  G.q=toQ(G.queue[0]);survQ();
}
function survQ(){
  const q=G.q;
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="hearts big">${"❤️".repeat(G.hearts)}${"🖤".repeat(3-G.hearts)}</span><span class="score">🏅 ${G.score}문제</span></div>
   <div class="items"><button class="item" id="ff" ${G.fifty&&!q.r?"":"disabled"}>✂️ 50:50 ×${G.fifty}</button><span class="item ghost">💖 부활 ×${G.revive}</span><span class="muted" style="margin-left:auto">최고 ${S.rec.surv}문제</span></div></div>`+
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
  app.innerHTML=`<div class="card hero"><div style="font-size:3.4rem">💀</div><h1>게임 오버</h1>
   <p><b style="font-size:1.6rem;color:var(--ink)">${G.score}문제</b> 버텼어요${rec?" · <b style='color:var(--gold)'>신기록!</b>":` (최고 ${S.rec.surv})`}</p>
   <div class="nav" style="justify-content:center;gap:8px;flex-wrap:wrap">
    ${G.revive?`<button class="btn promo-btn" id="rv">💖 부활하기 (하트 1개)</button>`:""}
    <button class="btn" id="again">다시 도전</button><button class="btn ghost" id="lb">로비로</button></div></div>`;
  on("rv",()=>{G.revive--;G.hearts=1;survNext()});on("again",startSurv);on("lb",lobby);goTop();
}

// ===================== ⏱️ 타임어택 =====================
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
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">📕 오답 복습</span><span class="muted">${G.i+1} / ${G.qs.length} · 맞히면 졸업</span></div></div>`+qCard(q,q.r,{showLv:true,nextLabel:G.i===G.qs.length-1?"결과 보기":"다음 →",gain:q.r==="ok"?"🎓 졸업!":""});
  bindQ(k=>{q.pick=k;q.r=judge(q,k);rvQ()},()=>{if(G.i===G.qs.length-1)rvEnd();else{G.i++;rvQ();goTop()}});
}
function rvEnd(){
  const g=G.qs.filter(q=>q.r==="ok").length;
  app.innerHTML=`<div class="card hero"><div style="font-size:3.4rem">🎓</div><h1>${g}문항 졸업</h1><p>${G.qs.length}문항 중 ${g}개를 맞혀 오답노트에서 뺐어요. 남은 오답노트 ${wrong.size}문항.</p>
   <div class="nav" style="justify-content:center;gap:8px">${wrong.size?`<button class="btn" id="again">한 번 더 복습</button>`:""}<button class="btn ghost" id="lb">로비로</button></div></div>`;
  on("again",startReview);on("lb",lobby);goTop();
}

// ===================== 📖 도감 =====================
function showCodex(){
  app.innerHTML=`<div class="arena"><div class="plrow"><span class="score">📖 진단명 도감</span><span class="score">${codex.size} / ${BANK.length}</span></div>
   <div class="lpbar" style="max-width:none"><i style="width:${codex.size/BANK.length*100}%"></i></div><p class="muted" style="margin:6px 0 0">문제를 맞히면 카드가 열려요. 열린 카드를 누르면 해설을 다시 볼 수 있어요.</p></div>
   ${DOMS.map(d=>{const ids=idsOf(d),got=ids.filter(i=>codex.has(i)).length;return `<div class="card"><div class="cxhead"><span>${BOSS[d].e} <b>${d}</b></span><span class="muted">${got}/${ids.length}${got===ids.length?" · 🏅 완성":""}</span></div>
     <div class="cards">${ids.map(i=>codex.has(i)?`<button class="cx on" data-i="${i}">${esc(BANK[i][2][0].length>26?BANK[i][2][0].slice(0,25)+"…":BANK[i][2][0])}</button>`:`<span class="cx">?</span>`).join("")}</div></div>`}).join("")}
   <div id="modal"></div><div class="nav" style="justify-content:center"><button class="btn ghost" id="lb">로비로</button></div>`;
  on("lb",lobby);
  app.querySelectorAll(".cx.on").forEach(b=>b.onclick=()=>{const x=BANK[+b.dataset.i];document.getElementById("modal").innerHTML=`<div class="modal" id="mbg"><div class="card mcard"><div class="meta"><span class="tag">${x[0]}</span></div><p class="q">${esc(x[1])}</p><p class="a" style="color:var(--ok);font-weight:700">✔ ${esc(x[2][0])}</p><p class="muted" style="font-size:.92rem">${esc(x[3])}</p><div class="nav"><button class="btn" id="mx">닫기</button></div></div></div>`;
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
