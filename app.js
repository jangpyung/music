// Fetch song data and initialize the player
let songs = [];

function initPlayer() {
  renderPlaylist();
  renderLinks();
  const initialIndex = getInitialTrackIndex();
  const initialAutoplay = getInitialAutoplay();
  loadTrack(initialIndex, false).then(() => {
    updateShareQuery(initialIndex);
    if (initialAutoplay) playCurrent();
  });
  audio.volume = +volumeEl.value;
  registerSW();

// ---------- Version update modal ----------
function showUpdateModal(){
  const modal=document.getElementById('updateModal');
  if(!modal) return;
  if(localStorage.getItem('hideUpdate')==='true') return;
  modal.classList.remove('hidden');
}
// Listen for SW broadcast
if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('message', e=>{
    if(e.data && e.data.type==='SW_UPDATED') showUpdateModal();
  });
}
// Close button handling
const closeBtn=document.getElementById('closeUpdate');
if(closeBtn){
  closeBtn.addEventListener('click',()=>{
    const modal=document.getElementById('updateModal');
    if(modal) modal.classList.add('hidden');
    const hide=document.getElementById('hideUpdate');
    if(hide && hide.checked){
      localStorage.setItem('hideUpdate','true');
    }
  });
}
// ------------------------------------------
}

// Load songs data
fetch('songs.json')
  .then(r => r.json())
  .then(data => {
    songs = data;
    initPlayer();
  })
  .catch(err => console.error('Failed to load songs:', err));

const state = { cur:0, lyrics:[], shuffle:false, repeat:false, deferredPrompt:null };

const $  = id => document.getElementById(id);
const audio         = $('audio');
const titleEl       = $('title');
const artistEl      = $('artist');
const coverEl       = $('cover');
const progressEl    = $('progress');
const playBtn       = $('playBtn');
const prevBtn       = $('prevBtn');
const nextBtn       = $('nextBtn');
const shuffleBtn    = $('shuffleBtn');
const repeatBtn     = $('repeatBtn');
const volumeEl      = $('volume');
const currentTimeEl = $('currentTime');
const durationEl    = $('duration');
const playlistEl    = $('playlist');
const trackLinksEl  = $('trackLinks');
const lyricsInner   = $('lyricsInner');
const lrcTrackName  = $('lrcTrackName');
const installBtn    = $('installBtn');
const refreshBtn    = $('refreshBtn');
const swStatus      = $('swStatus');
const artEq         = $('artEq');
const miniPlay      = $('miniPlay');
const miniPrev      = $('miniPrev');
const miniNext      = $('miniNext');
const miniCover     = $('miniCover');
const miniTitle     = $('miniTitle');
const miniArtist    = $('miniArtist');
const miniFill      = $('miniFill');
const lfFill        = $('lfFill');
const lfCur         = $('lf-cur');
const lfDur         = $('lf-dur');

const fmt = s => !Number.isFinite(s) ? '00:00'
  : `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

/* ── Tabs ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ── Playing state ── */
function setPlaying(on) {
  coverEl.classList.toggle('spinning', on);
  coverEl.classList.toggle('paused', !on);
  artEq.classList.toggle('on', on);
  const ic = on ? '⏸' : '▶';
  playBtn.textContent = miniPlay.textContent = ic;
  playBtn.setAttribute('aria-label', on ? '일시정지' : '재생');
  miniPlay.setAttribute('aria-label', on ? '일시정지' : '재생');
  renderPlaylist();
}

/* ── Playlist ── */
function renderPlaylist() {
  playlistEl.innerHTML = '';
  $('plCount').textContent = `${songs.length}곡`;
  songs.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'track-btn' + (i === state.cur ? ' active' : '');
    btn.type = 'button';
    const playing = i === state.cur && !audio.paused;
    btn.innerHTML = `
      <img class="t-thumb" src="${esc(s.cover)}" alt="" onerror="this.style.display='none';this.nextSibling.style.display='grid'">
      <div class="t-ph">🎵</div>
      <div class="t-meta">
        <div class="t-name">${esc(s.title)}</div>
        <div class="t-by">${esc(s.artist)}</div>
      </div>
      <div>${playing ? '<div class="eq-sm"><div class="esb"></div><div class="esb"></div><div class="esb"></div></div>' : ''}</div>`;
    btn.addEventListener('click', () => loadTrack(i, true));
    playlistEl.appendChild(btn);
  });
}

/* ── Track links ── */
function renderLinks() {
  trackLinksEl.innerHTML = '';
  songs.forEach((s, i) => {
    const ytBtn = s.youtube?.trim()
      ? `<a class="lk-btn yt" href="${s.youtube}" target="_blank" rel="noopener noreferrer"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>YouTube</a>`
      : `<span class="lk-btn off">YouTube 없음</span>`;
    const card = document.createElement('div');
    card.className = 'lk-card';
    card.innerHTML = `
      <div class="lk-head">
        <div class="lk-num">${String(i+1).padStart(2,'0')}</div>
        <div class="lk-title">${esc(s.title)}</div>
      </div>
      <div class="lk-btns">
        <a class="lk-btn mp3" href="${s.url}" download>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>MP3 다운</a>
        <a class="lk-btn lrc" href="${s.lrc}" download>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>가사</a>
        ${ytBtn}
      </div>`;
    trackLinksEl.appendChild(card);
  });
}

/* ── LRC ── */
async function fetchText(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(r.status);
  const buf = await r.arrayBuffer();
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
  catch { try { return new TextDecoder('euc-kr').decode(buf); }
          catch { return new TextDecoder('utf-8').decode(buf); } }
}

async function parseLRC(path) {
  lyricsInner.innerHTML = '<div class="lyric-line">가사를 불러오는 중…</div>';
  lyricsInner.style.top = '12px';
  state.lyrics = [];
  try {
    const text = await fetchText(path);
    const re = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
    for (const raw of text.replace(/\r/g, '\n').split('\n')) {
      const line = raw.trim();
      const ms = [...line.matchAll(re)];
      if (!ms.length) continue;
      const content = line.replace(re, '').trim();
      if (!content) continue;
      for (const m of ms) {
        const frac = m[3].length === 2 ? +m[3]/100 : +m[3]/1000;
        state.lyrics.push({ time: +m[1]*60 + +m[2] + frac, content });
      }
    }
    state.lyrics.sort((a, b) => a.time - b.time);
    lyricsInner.innerHTML = state.lyrics.length
      ? state.lyrics.map((l, i) => `<div class="lyric-line" id="ln${i}">${esc(l.content)}</div>`).join('')
      : '<div class="lyric-line">가사가 없습니다</div>';
  } catch {
    lyricsInner.innerHTML = '<div class="lyric-line">가사를 불러올 수 없습니다</div>';
  }
}

/* ── Playback ── */
async function loadTrack(idx, autoplay = false) {
  state.cur = idx;
  updateShareQuery(idx);
  const s = songs[idx];
  titleEl.textContent  = miniTitle.textContent  = s.title;
  artistEl.textContent = miniArtist.textContent = s.artist;
  lrcTrackName.textContent = s.title;
  coverEl.src = miniCover.src = s.cover;
  audio.src = s.url;
  progressEl.value = 0;
  miniFill.style.width = lfFill.style.width = '0%';
  currentTimeEl.textContent = durationEl.textContent = '00:00';
  lfCur.textContent = lfDur.textContent = '00:00';
  renderPlaylist();
  await parseLRC(s.lrc);
  setPlaying(false);
  if (autoplay) playCurrent();
}

async function playCurrent() {
  try { await audio.play(); setPlaying(true); }
  catch(e) { console.error(e); }
}
function pauseCurrent() { audio.pause(); setPlaying(false); }
const togglePlay = () => audio.paused ? playCurrent() : pauseCurrent();
const nextTrack  = () => loadTrack(state.shuffle
  ? Math.floor(Math.random() * songs.length)
  : (state.cur + 1) % songs.length, true);
const prevTrack  = () => loadTrack((state.cur - 1 + songs.length) % songs.length, true);

/* ── Lyrics sync ── */
function syncLyrics(t) {
  if (!state.lyrics.length) return;
  let ai = -1;
  for (let i = 0; i < state.lyrics.length; i++) {
    const nx = state.lyrics[i + 1];
    if (t >= state.lyrics[i].time && (!nx || t < nx.time)) { ai = i; break; }
  }
  document.querySelectorAll('.lyric-line').forEach((el, i) => {
    el.classList.remove('active', 'near');
    if (i === ai) el.classList.add('active');
    else if (Math.abs(i - ai) === 1) el.classList.add('near');
  });
  if (ai >= 0) {
    const topOffset = Math.min(12, 12 - ai * 44);
    lyricsInner.style.top = topOffset + 'px';
  }
}

/* ── Events ── */
playBtn.addEventListener('click', togglePlay);
miniPlay.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevTrack);
miniPrev.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);
miniNext.addEventListener('click', nextTrack);

shuffleBtn.addEventListener('click', () => {
  state.shuffle = !state.shuffle;
  shuffleBtn.classList.toggle('lit', state.shuffle);
});
repeatBtn.addEventListener('click', () => {
  state.repeat = !state.repeat;
  repeatBtn.classList.toggle('lit', state.repeat);
});

progressEl.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (progressEl.value / 100) * audio.duration;
});
volumeEl.addEventListener('input', () => { audio.volume = +volumeEl.value; });

refreshBtn.addEventListener('click', async () => {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) r.update();
  }
  location.reload();
});

audio.addEventListener('loadedmetadata', () => { durationEl.textContent = lfDur.textContent = fmt(audio.duration); });
audio.addEventListener('timeupdate', () => {
  const pct = audio.duration ? ((audio.currentTime / audio.duration) * 100).toFixed(2) : 0;
  progressEl.value = pct;
  miniFill.style.width = lfFill.style.width = pct + '%';
  currentTimeEl.textContent = lfCur.textContent = fmt(audio.currentTime);
  syncLyrics(audio.currentTime);
});
audio.addEventListener('ended', () =>
  state.repeat ? (audio.currentTime = 0, playCurrent()) : nextTrack());
audio.addEventListener('pause', () => setPlaying(false));
audio.addEventListener('play',  () => setPlaying(true));

/* ── PWA ── */
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); state.deferredPrompt = e; installBtn.hidden = false; });
installBtn.addEventListener('click', async () => {
  if (!state.deferredPrompt) return;
  state.deferredPrompt.prompt();
  await state.deferredPrompt.userChoice;
  state.deferredPrompt = null; installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js');
    swStatus.textContent = 'PWA 준비됨';
    if (reg.waiting) swStatus.textContent = '업데이트 대기 중';
  } catch { swStatus.textContent = 'SW 오류'; }
}

/* ── Query param helpers ── */
function getInitialTrackIndex() {
  const params = new URLSearchParams(location.search);
  const rawNo = params.get('no');
  const rawTrack = params.get('track');
  const rawTitle = params.get('title');
  if (rawNo !== null) {
    const no = parseInt(rawNo, 10);
    if (Number.isInteger(no) && no >= 1 && no <= songs.length) return no - 1;
  }
  if (rawTrack !== null) {
    const idx = parseInt(rawTrack, 10);
    if (Number.isInteger(idx) && idx >= 0 && idx < songs.length) return idx;
  }
  if (rawTitle) {
    const q = rawTitle.trim().toLowerCase();
    const idx = songs.findIndex(s => s.title.toLowerCase() === q);
    if (idx >= 0) return idx;
  }
  return 0;
}

function getInitialAutoplay() {
  const params = new URLSearchParams(location.search);
  if (params.has('autoplay')) {
    const v = String(params.get('autoplay') || '').toLowerCase();
    return v === '' || v === '1' || v === 'true' || v === 'yes' || v === 'on';
  }
  return params.has('no') || params.has('track') || params.has('title');
}

function updateShareQuery(idx) {
  const url = new URL(location.href);
  url.searchParams.set('no', String(idx + 1));
  history.replaceState(null, '', url.toString());
}
