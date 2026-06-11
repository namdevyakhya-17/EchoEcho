// @ts-nocheck
import "./styles.css";
import { startIconObserver } from "../../shared/icons";

startIconObserver();

/* ═══════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════ */
const CARD_ACCENTS = ['#ff5858', '#c058ff', '#3d9eff', '#f7b731'];
const CARD_VARIANTS = ['Default', 'Atmospheric', 'Upbeat', 'Raw'];
const CARD_DURATIONS = ['3:12', '2:47', '4:01', '2:33'];
const CARD_NAMES = ['Midnight Rain v1', 'Midnight Rain v2', 'Midnight Rain v3', 'Midnight Rain v4'];

/* Playing state per card */
const playState = [false, false, false, false];
let playIntervals = [null, null, null, null];
let heartState = [false, false, false, false];
let selectedCard = 0; // default: Best Match

/* ═══════════════════════════════════════════════
   AUTH GUARD
═══════════════════════════════════════════════ */
(function init() {
  if (!localStorage.getItem('echo_auth_token')) {
    window.location.href = '/login';
    return;
  }
  const inspo = JSON.parse(localStorage.getItem('echo_pending_inspo') || '{}');
  buildInspoPills(inspo);
  buildAllTags(inspo);
  buildAllWaveforms();
})();

/* ═══════════════════════════════════════════════
   INSPO PILLS
═══════════════════════════════════════════════ */
function buildInspoPills(inspo) {
  const mood  = inspo.mood  || 'Melancholy';
  const genre = inspo.genre || 'Lo-fi';
  const bpm   = inspo.bpm   || 90;

  const container = document.getElementById('inspo-pills');
  container.innerHTML = `
    <span class="inspo-pill mood-pill">${mood}</span>
    <span class="inspo-pill genre-pill">${genre}</span>
    <span class="inspo-pill bpm-pill">${bpm} BPM</span>
    ${inspo.theme ? `<span class="inspo-pill">${inspo.theme}</span>` : ''}
    ${inspo.instrument ? `<span class="inspo-pill">${inspo.instrument}</span>` : ''}
  `;
}

/* ═══════════════════════════════════════════════
   TAGS PER CARD
═══════════════════════════════════════════════ */
function buildAllTags(inspo) {
  const mood  = inspo.mood  || 'Melancholy';
  const genre = inspo.genre || 'Lo-fi';
  const bpm   = inspo.bpm   || 90;
  const subtitles = CARD_VARIANTS;

  for (let i = 0; i < 4; i++) {
    const container = document.getElementById('tags-' + i);
    const accentBg = CARD_ACCENTS[i] + '22';
    container.innerHTML = `
      <span class="c-tag mood">${mood}</span>
      <span class="c-tag genre">${genre}</span>
      <span class="c-tag">${bpm} BPM</span>
      <span class="c-tag" style="background:${accentBg};color:${CARD_ACCENTS[i]}">${subtitles[i]}</span>
    `;
  }
}

/* ═══════════════════════════════════════════════
   WAVEFORMS
═══════════════════════════════════════════════ */
function buildWaveform(containerId, accent, barCount) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    bar.className = 'wv-bar';

    /* Randomised heights for organic look */
    const minH = 6 + Math.random() * 8;
    const maxH = 20 + Math.random() * 44;

    /* Wave pattern: taller in the middle */
    const center = barCount / 2;
    const dist = Math.abs(i - center) / center;
    const shapedMaxH = maxH * (1 - dist * 0.45);

    const dur = (0.6 + Math.random() * 1.4).toFixed(2) + 's';
    const delay = (Math.random() * 1.8).toFixed(2) + 's';

    bar.style.cssText = `
      height: ${minH}px;
      background: ${accent};
      --min-h: ${minH}px;
      --max-h: ${shapedMaxH}px;
      --dur: ${dur};
      --delay: ${delay};
      animation: wave ${dur} ease-in-out infinite alternate ${delay};
      opacity: 0.7;
    `;

    container.appendChild(bar);
  }
}

function buildAllWaveforms() {
  for (let i = 0; i < 4; i++) {
    buildWaveform('wave-' + i, CARD_ACCENTS[i], 50);
  }
}

/* ═══════════════════════════════════════════════
   PLAYBACK (FAKE)
═══════════════════════════════════════════════ */
const durSeconds = [192, 167, 241, 153]; // 3:12, 2:47, 4:01, 2:33
const fakeProgress = [0, 0, 0, 0];

function togglePlay(idx) {
  const wasPlaying = playState[idx];

  // Stop all others
  for (let i = 0; i < 4; i++) {
    if (playState[i]) stopCard(i);
  }

  if (wasPlaying) {
    stopCard(idx);
  } else {
    startCard(idx);
  }
}

function startCard(idx) {
  playState[idx] = true;

  /* Update play icon → pause */
  document.getElementById('play-icon-' + idx).innerHTML =
    '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';

  /* Waveform fast mode */
  const card = document.getElementById('card-' + idx);
  card.classList.add('playing');

  /* Highlight selected card */
  selectedCard = idx;
  document.querySelectorAll('.output-card').forEach((c, i) => {
    c.style.outline = i === idx
      ? `2px solid ${CARD_ACCENTS[idx]}66`
      : 'none';
  });
  // best-match-wrap needs special treatment
  const wrap = document.querySelector('.best-match-wrap');
  if (wrap) {
    wrap.style.boxShadow = idx === 0
      ? `0 0 0 2px ${CARD_ACCENTS[0]}55`
      : 'none';
  }

  /* Tick fake progress */
  clearInterval(playIntervals[idx]);
  playIntervals[idx] = setInterval(() => {
    fakeProgress[idx] = Math.min(fakeProgress[idx] + (100 / durSeconds[idx]), 100);
    updateProgressUI(idx);
    if (fakeProgress[idx] >= 100) stopCard(idx);
  }, 1000);

  showToast('Playing: ' + CARD_NAMES[idx]);
}

function stopCard(idx) {
  playState[idx] = false;
  clearInterval(playIntervals[idx]);
  playIntervals[idx] = null;

  /* Restore play icon */
  document.getElementById('play-icon-' + idx).innerHTML =
    '<polygon points="5,3 19,12 5,21"/>';

  /* Remove playing state */
  document.getElementById('card-' + idx).classList.remove('playing');
}

function updateProgressUI(idx) {
  const pct = fakeProgress[idx];
  const range = document.getElementById('range-' + idx);
  range.value = pct;
  updateRangeTrack(idx, pct, CARD_ACCENTS[idx]);

  const elapsed = Math.round((pct / 100) * durSeconds[idx]);
  document.getElementById('time-' + idx).textContent =
    formatTime(elapsed) + ' / ' + CARD_DURATIONS[idx];
}

function onRangeInput(idx, input) {
  const pct = parseFloat(input.value);
  fakeProgress[idx] = pct;
  updateRangeTrack(idx, pct, CARD_ACCENTS[idx]);
  const elapsed = Math.round((pct / 100) * durSeconds[idx]);
  document.getElementById('time-' + idx).textContent =
    formatTime(elapsed) + ' / ' + CARD_DURATIONS[idx];
}

function updateRangeTrack(idx, pct, accent) {
  const range = document.getElementById('range-' + idx);
  range.style.background =
    `linear-gradient(to right, ${accent} ${pct}%, var(--greyF4) ${pct}%)`;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m + ':' + String(s).padStart(2, '0');
}

/* ═══════════════════════════════════════════════
   HEART / FAVOURITE
═══════════════════════════════════════════════ */
function toggleHeart(idx) {
  heartState[idx] = !heartState[idx];
  const btn = document.getElementById('heart-' + idx);
  const icon = document.getElementById('heart-icon-' + idx);
  const accent = CARD_ACCENTS[idx];

  if (heartState[idx]) {
    btn.classList.add('liked');
    icon.setAttribute('fill', accent);
    showToast('<span data-echo-icon="heart"></span> Added to favourites');
  } else {
    btn.classList.remove('liked');
    icon.setAttribute('fill', 'none');
    showToast('Removed from favourites');
  }
}

/* ═══════════════════════════════════════════════
   DOWNLOAD
═══════════════════════════════════════════════ */
function downloadTrack(idx, fmt) {
  showToast('Downloading ' + CARD_NAMES[idx] + '.' + fmt + '…');
}

/* ═══════════════════════════════════════════════
   SAVE TO LIBRARY
═══════════════════════════════════════════════ */
function saveToLibrary(cardIdx) {
  const tracks = JSON.parse(localStorage.getItem('echo_tracks') || '[]');
  const inspo = JSON.parse(localStorage.getItem('echo_pending_inspo') || '{}');
  const newTrack = {
    id: 't' + Date.now(),
    name: `${inspo.theme || 'New'} ${inspo.instrument || 'Track'} v${cardIdx + 1}`,
    mood: inspo.mood || 'Custom',
    genre: inspo.genre || 'Mixed',
    bpm: inspo.bpm || 90,
    dur: ['3:12', '2:47', '4:01', '2:33'][cardIdx],
    date: 'Just now',
    color: ['#ff5858', '#c058ff', '#3d9eff', '#f7b731'][cardIdx],
    emoji: '<span data-echo-icon="music"></span>',
    fav: false,
  };
  tracks.unshift(newTrack);
  localStorage.setItem('echo_tracks', JSON.stringify(tracks));
  window.location.href = '/dashboard';
}

/* ═══════════════════════════════════════════════
   GENERATE MORE
═══════════════════════════════════════════════ */
function generateMore() {
  // Clear pending inspo and go back to dashboard to trigger popup
  localStorage.removeItem('echo_pending_inspo');
  localStorage.setItem('echo_open_create', '1');
  window.location.href = '/dashboard';
}

/* ═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ═══════════════════════════════════════════════
   CARD SELECTION (click anywhere on card)
═══════════════════════════════════════════════ */
(function bindCardSelection() {
  document.querySelectorAll('.output-card').forEach((card, idx) => {
    card.addEventListener('click', function(e) {
      // Don't override button clicks
      if (e.target.closest('button') || e.target.closest('input')) return;
      selectedCard = idx;
      showToast(CARD_NAMES[idx] + ' selected');
    });
  });
})();


Object.assign(window, {
  buildInspoPills,
  buildAllTags,
  buildWaveform,
  buildAllWaveforms,
  togglePlay,
  startCard,
  stopCard,
  updateProgressUI,
  onRangeInput,
  updateRangeTrack,
  formatTime,
  toggleHeart,
  downloadTrack,
  saveToLibrary,
  generateMore,
  showToast,
});


