// @ts-nocheck
import "./styles.css";
import { startIconObserver } from "../../shared/icons";

startIconObserver();

/* ── Auth Guard ─────────────────────────────────────── */
  (function() {
    if (!localStorage.getItem('echo_auth_token')) {
      window.location.replace('/login');
    }
  })();

  /* ── Read inspo from localStorage ──────────────────── */
  const inspo = JSON.parse(localStorage.getItem('echo_pending_inspo') || '{}');

  /* ── Build inspo pills ──────────────────────────────── */
  const pillsRow = document.getElementById('pills-row');
  const pillDefs = [
    { key: 'mood',       label: 'Mood' },
    { key: 'genre',      label: 'Genre' },
    { key: 'theme',      label: 'Theme' },
    { key: 'instrument', label: 'Instrument' },
    { key: 'style',      label: 'Style' },
    { key: 'bpm',        label: 'BPM' },
    { key: 'tempoFeel',  label: 'Tempo' },
  ];

  let pillsRendered = 0;
  pillDefs.forEach(({ key, label }) => {
    if (!inspo[key]) return;
    pillsRendered++;
    const el = document.createElement('div');
    el.className = 'pill';
    el.innerHTML = `<div class="pill-dot"></div><span>${label}:</span>${inspo[key]}`;
    pillsRow.appendChild(el);
  });

  // Fallback pills if localStorage is empty
  if (pillsRendered === 0) {
    [['Mood', 'Energetic'], ['Genre', 'Electronic'], ['BPM', '128']].forEach(([label, val]) => {
      const el = document.createElement('div');
      el.className = 'pill';
      el.innerHTML = `<div class="pill-dot"></div><span>${label}:</span>${val}`;
      pillsRow.appendChild(el);
    });
  }

  /* ── Build waveform bars ────────────────────────────── */
  const waveform = document.getElementById('waveform');
  const BAR_COUNT = 40;
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div');
    bar.className = 'wave-bar';
    const minH = 4 + Math.random() * 8;
    const maxH = 20 + Math.random() * 36;
    const dur  = (0.5 + Math.random() * 1.3).toFixed(2);
    const delay = (Math.random() * 1.0).toFixed(2);
    bar.style.cssText = `--min-h:${minH}px;--max-h:${maxH}px;--dur:${dur}s;--delay:${delay}s;height:${minH}px`;
    waveform.appendChild(bar);
  }

  /* ── Headline cycling ───────────────────────────────── */
  const HEADLINES = [
    'Tuning your melody...',
    'Layering instruments...',
    'Composing harmony...',
    'Rendering audio...',
    'Finishing touches...',
  ];
  let hlIdx = 0;
  const hlEl = document.getElementById('status-headline');

  function cycleHeadline() {
    // exit animation
    hlEl.classList.add('exiting');
    setTimeout(() => {
      hlIdx = (hlIdx + 1) % HEADLINES.length;
      hlEl.textContent = HEADLINES[hlIdx];
      hlEl.classList.remove('exiting');
      // restart enter animation
      hlEl.style.animation = 'none';
      void hlEl.offsetWidth; // reflow
      hlEl.style.animation = '';
    }, 300);
  }
  const headlineInterval = setInterval(cycleHeadline, 4000);

  /* ── Elapsed timer ──────────────────────────────────── */
  const timerEl = document.getElementById('status-timer');
  const startTime = Date.now();

  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  }

  const timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    timerEl.textContent = formatTime(elapsed);
  }, 500);

  /* ── Steps ──────────────────────────────────────────── */
  const STEPS = [
    { id: 'step-1', label: 'Analysing mood & genre',     doneAt: 4  },
    { id: 'step-2', label: 'Building melody structure',  doneAt: 10 },
    { id: 'step-3', label: 'Layering instruments',        doneAt: 18 },
    { id: 'step-4', label: 'Rendering final track',       doneAt: 25 },
  ];

  const stepsList = document.getElementById('steps-list');
  const stepEls = {};

  STEPS.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'step pending-state';
    el.id = s.id;
    el.innerHTML = `
      <div class="step-icon pending" id="${s.id}-icon"></div>
      <div class="step-label">${s.label}</div>
      <div class="step-time" id="${s.id}-time"></div>
    `;
    stepsList.appendChild(el);
    stepEls[s.id] = el;
  });

  // Mark first step as active immediately
  activateStep('step-1');

  function activateStep(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(id + '-icon');
    if (!el || !icon) return;
    el.classList.remove('pending-state');
    el.classList.add('active');
    icon.className = 'step-icon spinning';
  }

  function completeStep(id, elapsedSec) {
    const el = document.getElementById(id);
    const icon = document.getElementById(id + '-icon');
    const timeEl = document.getElementById(id + '-time');
    if (!el || !icon) return;

    el.classList.remove('active', 'pending-state');
    el.classList.add('done');
    icon.className = 'step-icon done-icon';
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
    if (timeEl) timeEl.textContent = formatTime(elapsedSec * 1000);
  }

  // Step timers
  const stepTimers = STEPS.map((s, i) => {
    return setTimeout(() => {
      completeStep(s.id, s.doneAt);
      // Activate next step
      if (STEPS[i + 1]) {
        activateStep(STEPS[i + 1].id);
      }
    }, s.doneAt * 1000);
  });

  /* ── Auto-navigate at 30s ───────────────────────────── */
  const navTimer = setTimeout(() => {
    clearInterval(headlineInterval);
    clearInterval(timerInterval);
    window.location.href = '/output';
  }, 30000);

  /* ── Skip links navigate immediately ───────────────── */
  document.querySelectorAll('a[href="/output"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimeout(navTimer);
      clearInterval(headlineInterval);
      clearInterval(timerInterval);
      stepTimers.forEach(clearTimeout);
      window.location.href = '/output';
    });
  });


Object.assign(window, {
  cycleHeadline,
  formatTime,
  activateStep,
  completeStep,
});

