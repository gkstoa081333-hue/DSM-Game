// ===================== 계정·동기화 (Firebase) =====================
// FIREBASE_CONFIG가 null이면 지금처럼 기기에만 저장하는 모드로 동작해요.
const FIREBASE_CONFIG = null; // ← Firebase 콘솔의 firebaseConfig 객체를 여기에 붙여넣기
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

// 서버 기록과 기기 기록 합치기: 본 문제·도감은 합집합, 랭크와 최고 기록은 높은 쪽
function mergeInto(remote) {
  if (!remote) return;
  (remote.seen || []).forEach(i => seen.add(i));
  (remote.codex || []).forEach(i => codex.add(i));
  (remote.wrong || []).forEach(i => { if (!codex.has(i) || wrong.has(i)) wrong.add(i); });
  if (remote.rank && rankScore(remote.rank) > rankScore(S.rank)) S.rank = remote.rank;
  if (remote.rec) for (const k of Object.keys(remote.rec)) S.rec[k] = Math.max(S.rec[k] || 0, remote.rec[k] || 0);
}
function snapshot() {
  return { rank: S.rank, rec: S.rec, seen: [...seen], wrong: [...wrong], codex: [...codex], updatedAt: firebase.firestore.FieldValue.serverTimestamp(), app: "dsm-game" };
}
async function pullAndMerge() {
  try {
    const ref = ACC.db.collection("users").doc(ACC.user.uid);
    const doc = await ref.get();
    mergeInto(doc.exists ? doc.data() : null);
    store.set("pt_v3", { rank: S.rank, rec: S.rec, seen: [...seen], wrong: [...wrong], codex: [...codex] });
    await ref.set(snapshot());
    ACC.lastSync = new Date();
    if (document.querySelector(".rankcard")) lobby();
  } catch (e) { ACC.err = "기록 동기화에 실패했어요. 다음에 다시 시도할게요."; }
}
function scheduleSync() {
  if (!ACC.ready) return;
  clearTimeout(ACC.syncTimer);
  ACC.syncTimer = setTimeout(async () => {
    try { await ACC.db.collection("users").doc(ACC.user.uid).set(snapshot()); ACC.lastSync = new Date(); ACC.err = null; }
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
      const local = { rank: S.rank, rec: { ...S.rec }, seen: [...seen], wrong: [...wrong], codex: [...codex] };
      await ACC.auth.signInWithCredential(e.credential);
      ACC.user = ACC.auth.currentUser; mergeInto(local); await pullAndMerge();
    } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      ACC.err = "Google 연결에 실패했어요(" + (e.code || "알 수 없음") + ")";
    }
  }
  refreshAccountCard();
}
async function signOutAll() {
  await ACC.auth.signOut(); // 로그아웃하면 새 익명 계정으로 다시 시작
  try { localStorage.removeItem("pt_v3"); } catch (_) {}
  location.reload();
}
async function deleteMyData() {
  try {
    await ACC.db.collection("users").doc(ACC.user.uid).delete();
    await ACC.user.delete();
  } catch (e) {
    if (e.code === "auth/requires-recent-login") { ACC.err = "보안을 위해 Google로 다시 로그인한 뒤 삭제해 주세요."; refreshAccountCard(); return; }
  }
  try { localStorage.removeItem("pt_v3"); } catch (_) {}
  location.reload();
}

// 로비의 계정 카드
function accountCardHTML() {
  if (!FIREBASE_CONFIG) return `<div class="acc"><b>👤 계정</b><p class="muted">아직 로그인 기능이 꺼져 있어요. 기록은 이 기기에만 저장돼요.</p></div>`;
  const u = ACC.user, google = u && u.providerData.some(p => p.providerId === "google.com");
  const who = !u ? "연결 중…" : google ? `Google 계정 (${esc(u.email || "")})` : "익명 계정 (이 기기 전용)";
  const sync = ACC.lastSync ? `마지막 동기화 ${ACC.lastSync.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}` : "";
  return `<div class="acc"><b>👤 ${who}</b>${sync ? `<span class="muted" style="margin-left:8px">${sync}</span>` : ""}
    ${ACC.err ? `<p class="warn">${esc(ACC.err)}</p>` : ""}
    ${u && !google ? `<p class="muted">Google 계정을 연결하면 기기를 바꿔도 기록이 이어져요.</p><button class="btn tiny" id="acc-google">Google로 기록 지키기</button>` : ""}
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
  <li><b>수집하는 것:</b> 계정 식별번호(무작위 ID), 학습 기록(랭크, 푼 문제, 오답노트, 도감), 문제 신고 내용. Google 계정을 연결하면 로그인 확인을 위해 이메일 주소가 Firebase 인증에 저장돼요.</li>
  <li><b>수집하지 않는 것:</b> 실명, 소속, 연락처, 위치</li>
  <li><b>목적:</b> 기기 간 학습 기록 동기화, 문제 오류 수정</li>
  <li><b>보관:</b> 직접 삭제하거나 서비스를 종료할 때까지. 「내 데이터 삭제」를 누르면 서버 기록과 계정이 바로 지워져요.</li>
  <li><b>공개 범위:</b> 내 기록은 나만 볼 수 있어요. 다른 사용자나 운영자 화면에 이름·기록이 노출되지 않아요.</li>
  <li><b>처리 위탁:</b> Google Firebase(인증·데이터 저장)</li>
  <li><b>문의:</b> 운영자 김한샘</li>
 </ul></div>`;

// 게임 안 문제 신고 (계정 없이)
function openReport(id) {
  const m = META[id] || {}, box = document.getElementById("rep-" + id);
  if (!box) return;
  if (!ACC.ready) { // 로그인 기능이 꺼져 있으면 GitHub Issue로
    const body = encodeURIComponent(`문항 ID: ${m.key}\n문제: ${BANK[id][1]}\n표시된 정답: ${BANK[id][2][0]}\n\n무엇이 잘못됐나요?\n`);
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
