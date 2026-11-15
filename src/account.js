// ===================== 계정·동기화 (Firebase) =====================
// FIREBASE_CONFIG가 null이면 지금처럼 기기에만 저장하는 모드로 동작해요.
// Firebase 웹 설정값은 공개용 식별자예요(비밀번호 아님). 실제 보호는 firestore.rules가 맡아요.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDx5ETXnljBBuYff-TwA8JeZM5-5sQsFnk",
  authDomain: "dsm-game-98fec.firebaseapp.com",
  projectId: "dsm-game-98fec",
  storageBucket: "dsm-game-98fec.firebasestorage.app",
  messagingSenderId: "319638969319",
  appId: "1:319638969319:web:fffe09116209db40f87b42"
};
const FB_VER = "10.12.2";
const ACC = { ready: false, user: null, db: null, auth: null, syncTimer: null, lastSync: null, err: null };

function loadScript(src) {
  return new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
}
async function initAccount() {
  if (!FIREBASE_CONFIG) return;
  try {
    for (const m of ["app", "auth", "firestore"]) await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${m}-compat.js`);
    firebase.initializeApp(FIREBASE_CONFIG);
    ACC.auth = firebase.auth(); ACC.db = firebase.firestore();
    await ACC.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); // 휴대폰에 로그인 유지
    ACC.auth.onAuthStateChanged(async u => {
      ACC.user = u;
      if (!u) { try { await ACC.auth.signInAnonymously(); } catch (e) { ACC.err = "로그인에 실패했어요. 기록은 이 기기에만 저장돼요."; refreshAccountCard(); } return; }
      ACC.ready = true; await pullAndMerge(); refreshAccountCard();
    });
  } catch (e) { ACC.err = "서버에 연결하지 못했어요. 기록은 이 기기에만 저장돼요."; refreshAccountCard(); }
}

// 서버 기록과 기기 기록 합치기: 본 문제·도감·격파 관문은 합집합, 레벨테스트는 최신 결과, 기록은 높은 쪽
function mergeInto(remote) {
  if (!remote) return;
  fromStored(remote.seen).forEach(i => seen.add(i));
  fromStored(remote.codex).forEach(i => codex.add(i));
  fromStored(remote.wrong).forEach(i => { if (!codex.has(i) || wrong.has(i)) wrong.add(i); });
  const rl = remote.level;
  if (rl && rl.date && (!S.level.date || rl.date > S.level.date || (rl.date === S.level.date && (rl.hist || []).length > (S.level.hist || []).length))) S.level = rl;
  if (remote.dojo) {
    (remote.dojo.cleared || []).forEach(d => { if (!S.dojo.cleared.includes(d)) S.dojo.cleared.push(d); });
    S.dojo.best = S.dojo.best || {};
    for (const [k, v] of Object.entries(remote.dojo.best || {})) S.dojo.best[k] = Math.max(S.dojo.best[k] || 0, v);
    S.dojo.final = S.dojo.final || !!remote.dojo.final;
  }
  if (remote.rec) for (const k of Object.keys(remote.rec)) {
    const v = remote.rec[k];
    if (typeof v === "number") S.rec[k] = Math.max(S.rec[k] || 0, v);
    else if (k === "daily" && v && (!S.rec.daily || (v.date || "") > (S.rec.daily.date || ""))) S.rec.daily = v;
  }
  if (!S.nick && remote.nick) S.nick = remote.nick;
}
function snapshot() {
  return { ...data(), updatedAt: firebase.firestore.FieldValue.serverTimestamp(), app: "dsm-game" };
}
async function pullAndMerge() {
  try {
    const ref = ACC.db.collection("users").doc(ACC.user.uid);
    const doc = await ref.get();
    mergeInto(doc.exists ? doc.data() : null);
    store.set("pt_v4", data());
    await ref.set(snapshot());
    await ensureNick();
    await pushBoard();
    ACC.lastSync = new Date();
    if (!S.nick) { if (isGoogle()) nickSetup(); else if (!guestMode()) loginGate(); }
    else if (document.getElementById("gg")) { lobby(); systemMsg([`헌터 인증이 완료되었습니다.`, `돌아오신 것을 환영합니다, ${S.nick} 헌터님.`, `저장된 등급과 기록을 불러왔습니다.`]); }
    else if (document.querySelector(".rankcard")) lobby();
  } catch (e) { ACC.err = "기록 동기화에 실패했어요. 다음에 다시 시도할게요."; }
}
function scheduleSync() {
  if (!ACC.ready) return;
  clearTimeout(ACC.syncTimer);
  ACC.syncTimer = setTimeout(async () => {
    try { await ACC.db.collection("users").doc(ACC.user.uid).set(snapshot()); await pushBoard(); ACC.lastSync = new Date(); ACC.err = null; }
    catch (e) { ACC.err = "기록 동기화에 실패했어요. 인터넷 연결을 확인해 주세요."; }
    refreshAccountCard();
  }, 3000);
}

// Google 계정 연결: 익명 기록을 그대로 Google 계정에 옮김
async function linkGoogle() {
  const p = new firebase.auth.GoogleAuthProvider();
  try { await ACC.user.linkWithPopup(p); ACC.user = ACC.auth.currentUser; await pullAndMerge(); }
  catch (e) {
    if (e.code === "auth/credential-already-in-use" && e.credential) {
      // 다른 기기에서 이미 쓰던 Google 계정 → 그 계정으로 들어가서 이 기기 기록을 합침
      const local = JSON.parse(JSON.stringify(data()));
      S.nick = ""; // 그 Google 계정에 등록된 헌터명을 우선 복원
      await ACC.auth.signInWithCredential(e.credential);
      ACC.user = ACC.auth.currentUser; mergeInto(local); await pullAndMerge();
    } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      ACC.err = "Google 연결에 실패했어요(" + (e.code || "알 수 없음") + ")";
    }
  }
  refreshAccountCard();
}
const isGoogle = () => !!(ACC.user && ACC.user.providerData.some(p => p.providerId === "google.com"));
const guestMode = () => { try { return sessionStorage.getItem("pt_guest") === "1"; } catch (_) { return false; } };
async function signOutAll() {
  await ACC.auth.signOut(); // 로그아웃하면 새 익명 계정으로 다시 시작
  try { localStorage.removeItem("pt_v4"); localStorage.removeItem("pt_v3"); } catch (_) {}
  location.reload();
}
async function deleteMyData() {
  try {
    await ACC.db.collection("board").doc(ACC.user.uid).delete().catch(() => {});
    if (S.nick) await ACC.db.collection("names").doc(nickKey(S.nick)).delete().catch(() => {});
    await ACC.db.collection("users").doc(ACC.user.uid).delete();
    await ACC.user.delete();
  } catch (e) {
    if (e.code === "auth/requires-recent-login") { ACC.err = "보안을 위해 Google로 다시 로그인한 뒤 삭제해 주세요."; refreshAccountCard(); return; }
  }
  try { localStorage.removeItem("pt_v4"); localStorage.removeItem("pt_v3"); } catch (_) {}
  location.reload();
}

// 로비의 계정 카드
function accountCardHTML() {
  if (!FIREBASE_CONFIG) return `<div class="acc"><b>👤 계정</b><p class="muted">아직 로그인 기능이 꺼져 있어요. 기록은 이 기기에만 저장돼요.</p></div>`;
  const u = ACC.user, google = isGoogle();
  const who = !u ? "연결 중…" : google ? `Google 계정 (${esc(u.email || "")})` : "익명 계정 (이 기기 전용)";
  const sync = ACC.lastSync ? `마지막 동기화 ${ACC.lastSync.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}` : "";
  const nickLine = S.nick ? `<div class="nickline">🏷️ 헌터명 <b>${esc(S.nick)}</b> <button class="btn ghost tiny" id="acc-nick">변경</button></div>` : "";
  return `<div class="acc">${nickLine}<b>👤 ${who}</b>${sync ? `<span class="muted" style="margin-left:8px">${sync}</span>` : ""}
    ${ACC.err ? `<p class="warn">${esc(ACC.err)}</p>` : ""}
    ${u && !google ? `<p class="${S.nick ? "warn" : "muted"}">${S.nick ? "⚠️ 지금은 이 기기 전용 계정이에요. 앱 데이터가 지워지거나 기기를 바꾸면 헌터명과 기록이 사라져요. Google로 연결해 두세요." : "Google로 로그인하면 헌터명을 등록하고, 로그아웃하거나 기기를 바꿔도 기록이 이어져요."}</p><button class="btn tiny" id="acc-google">Google로 로그인</button>` : ""}
    <div class="nav" style="justify-content:flex-start;gap:6px;flex-wrap:wrap;margin-top:8px">
      <button class="btn ghost tiny" id="acc-privacy">개인정보 안내</button>
      ${google ? `<button class="btn ghost tiny" id="acc-out">로그아웃</button>` : ""}
      ${u ? `<button class="btn ghost tiny" id="acc-del">내 데이터 삭제</button>` : ""}
    </div><div id="acc-more"></div></div>`;
}
function refreshAccountCard() {
  const el = document.getElementById("acc-wrap"); if (!el) return;
  el.innerHTML = accountCardHTML();
  const on = (id, f) => { const e = document.getElementById(id); if (e) e.onclick = f; };
  on("acc-google", linkGoogle);
  on("acc-nick", () => nickSetup(true));
  on("acc-out", signOutAll);
  on("acc-privacy", () => { document.getElementById("acc-more").innerHTML = PRIVACY_HTML; });
  on("acc-del", e => {
    const b = e.target;
    if (b.dataset.ok) deleteMyData();
    else { b.dataset.ok = 1; b.textContent = "한 번 더 누르면 서버와 이 기기의 기록이 모두 지워져요"; }
  });
}
const PRIVACY_HTML = `<div class="privacy">
 <b>개인정보 수집·이용 안내</b>
 <ul>
  <li><b>수집하는 것:</b> 계정 식별번호(무작위 ID), 학습 기록(각성 측정 결과, 푼 문제, 패널티 존, 그림자 군단, 게이트 공략, 일일 퀘스트), 직접 정한 헌터명(닉네임), 랭킹용 게임 기록(등급·점수·게이트·긴급 퀘스트·던전 브레이크), 문제 신고 내용. Google 계정을 연결하면 로그인 확인을 위해 이메일 주소가 Firebase 인증에 저장돼요.</li>
  <li><b>수집하지 않는 것:</b> 실명, 소속, 연락처, 위치</li>
  <li><b>목적:</b> 기기 간 학습 기록 동기화, 문제 오류 수정</li>
  <li><b>보관:</b> 직접 삭제하거나 서비스를 종료할 때까지. 「내 데이터 삭제」를 누르면 서버 기록과 계정이 바로 지워져요.</li>
  <li><b>공개 범위:</b> 헌터명과 랭킹용 게임 기록은 이 게임을 쓰는 다른 사용자에게 랭킹으로 보여요. 푼 문제·오답노트 같은 학습 기록은 나만 볼 수 있어요. 실명 대신 별명을 써주세요.</li>
  <li><b>처리 위탁:</b> Google Firebase(인증·데이터 저장)</li>
  <li><b>문의:</b> 운영자 김한샘</li>
 </ul></div>`;

// 게임 안 문제 신고 (계정 없이)
function openReport(id) {
  const m = QB[id] || {}, box = document.getElementById("rep-" + id);
  if (!box) return;
  if (!ACC.ready) { // 로그인 기능이 꺼져 있으면 GitHub Issue로
    const body = encodeURIComponent(`문항 ID: ${m.key}\n문제: ${QB[id].q}\n표시된 정답: ${QB[id].a}\n\n무엇이 잘못됐나요?\n`);
    window.open(`${REPO}/issues/new?title=${encodeURIComponent("[문제 신고] " + m.key)}&labels=report&body=${body}`, "_blank", "noopener");
    return;
  }
  box.innerHTML = `<textarea id="rep-t-${id}" maxlength="500" placeholder="무엇이 잘못됐나요? (예: 정답이 3번이 아니라 2번 같아요, 법 조항이 바뀌었어요)"></textarea>
   <div class="nav" style="justify-content:flex-start;gap:6px"><button class="btn tiny" id="rep-go-${id}">신고 보내기</button></div>`;
  document.getElementById("rep-go-" + id).onclick = async e => {
    const note = document.getElementById("rep-t-" + id).value.trim().slice(0, 500);
    if (!note) return;
    e.target.disabled = true;
    try {
      await ACC.db.collection("reports").add({ qid: m.key, note, uid: ACC.user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      box.innerHTML = `<p class="muted">신고가 접수됐어요. 고마워요!</p>`;
    } catch (_) { e.target.disabled = false; e.target.textContent = "전송 실패 · 다시 시도"; }
  };
}


// ===================== 닉네임 · 랭킹 (names/{닉네임}, board/{uid}) =====================
const NICK_RE = /^[가-힣a-zA-Z0-9_]{2,12}$/;
const nickKey = n => n.toLowerCase();
// 이 기기의 닉네임이 서버에서 내 것인지 확인하고, 아니면 차지 시도 (계정 전환 대비)
async function ensureNick() {
  if (!S.nick) return;
  try {
    const ref = ACC.db.collection("names").doc(nickKey(S.nick));
    await ACC.db.runTransaction(async tx => {
      const d = await tx.get(ref);
      if (d.exists && d.data().uid !== ACC.user.uid) throw new Error("taken");
      if (!d.exists) tx.set(ref, { uid: ACC.user.uid });
    });
  } catch (e) { if (e.message === "taken") { S.nick = ""; save(); } }
}
async function claimNick(nick) {
  if (!NICK_RE.test(nick)) return "한글·영문·숫자·밑줄(_)로 2~12자로 정해 주세요.";
  if (!ACC.ready) return "서버에 연결하는 중이에요. 잠시 후 다시 시도해 주세요.";
  const newRef = ACC.db.collection("names").doc(nickKey(nick));
  const oldKey = S.nick ? nickKey(S.nick) : null;
  try {
    await ACC.db.runTransaction(async tx => {
      const d = await tx.get(newRef);
      if (d.exists && d.data().uid !== ACC.user.uid) throw new Error("taken");
      if (!d.exists) tx.set(newRef, { uid: ACC.user.uid });
      if (oldKey && oldKey !== nickKey(nick)) tx.delete(ACC.db.collection("names").doc(oldKey));
    });
  } catch (e) { return e.message === "taken" ? "이미 다른 사람이 쓰는 닉네임이에요." : "저장하지 못했어요. 다시 시도해 주세요."; }
  S.nick = nick; save();
  try { await pushBoard(); } catch (_) {}
  return "ok";
}
function boardRow() {
  const t = curTier(), sc = S.level.score == null ? -1 : S.level.score, n = S.dojo.cleared.length;
  return { nick: S.nick, tier: t, score: sc, rk: (t + 1) * 1000 + Math.max(sc, 0), dojo: n, final: !!S.dojo.final, dk: (S.dojo.final ? 100 : 0) + n,
    ta: S.rec.ta || 0, surv: S.rec.surv || 0, tests: S.rec.tests || 0, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
}
async function pushBoard() { if (ACC.ready && S.nick) await ACC.db.collection("board").doc(ACC.user.uid).set(boardRow()); }
async function fetchBoard(field) {
  const q = await ACC.db.collection("board").orderBy(field, "desc").limit(50).get();
  return q.docs.map(d => ({ uid: d.id, ...d.data() }));
}
