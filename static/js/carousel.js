// POOL must be defined as a global before this script loads (injected by index template)
function seededRand(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}
const rand = seededRand(Math.floor(Date.now() / 3600000));

function pickThree(pool) {
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 3);
}

const selected = pickThree(POOL);
const track    = document.getElementById('track');
const dotsEl   = document.getElementById('dots');

selected.forEach((p, i) => {
  const card = document.createElement('div');
  card.className = 'paper-card';

  const awardPills = (p.awards || [])
    .map(a => `<span class="paper-meta-award">${a}</span>`).join('');
  const bookPill  = p.isBook ? `<span class="paper-type-pill">Book</span>` : '';
  const imgClass  = p.isBook ? 'paper-image is-book' : 'paper-image';
  const imgHTML   = p.image
    ? `<img src="${p.image}" alt="">` : `<span class="paper-image-placeholder">Image placeholder</span>`;
  const linkLabel = p.isBook ? 'Publisher' : 'Journal';

  card.innerHTML = `
    <div class="${imgClass}">${imgHTML}</div>
    <div class="paper-card-body">
      <p class="paper-meta"><span>${p.meta}</span>${awardPills}${bookPill}</p>
      <h2 class="paper-title">${p.title}</h2>
      <p class="paper-finding">${p.finding}</p>
    </div>
    <div class="paper-footer">
      <div class="paper-links">
        <a class="paper-link" href="${p.pdf || '#'}">PDF</a>
        <a class="paper-link" href="${p.url || '#'}">${linkLabel}</a>
      </div>
      <span class="paper-badge">${p.badge}</span>
    </div>`;

  track.appendChild(card);

  const dot = document.createElement('button');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dot.setAttribute('aria-label', `Item ${i + 1}`);
  dot.addEventListener('click', () => goTo(i));
  dotsEl.appendChild(dot);
});

const INTERVAL = 10000;
const fill     = document.getElementById('progress-fill');
const lbl      = document.getElementById('progress-label');
let cur = 0, paused = false, elapsed = 0, lastTick = null;

function goTo(idx) {
  cur = ((idx % 3) + 3) % 3;
  track.style.transition = 'transform 0.55s cubic-bezier(0.4,0,0.2,1)';
  track.style.transform  = `translateX(-${cur * 100}%)`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === cur));
  elapsed = 0; lastTick = null; fill.style.width = '0%';
}

// ── Arrow buttons ──
document.getElementById('prev').addEventListener('click', () => goTo(cur - 1));
document.getElementById('next').addEventListener('click', () => goTo(cur + 1));

// ── Mouse hover pause ──
document.getElementById('carousel').addEventListener('mouseenter', () => { paused = true; });
document.getElementById('carousel').addEventListener('mouseleave', () => { paused = false; lastTick = null; });

// ── Touch swipe ──
let touchStartX = 0;
let touchStartY = 0;

document.getElementById('carousel').addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  paused = true;
}, { passive: true });

document.getElementById('carousel').addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  // Only fire if horizontal swipe dominates over vertical scroll
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
    if (dx < 0) goTo(cur + 1); // swipe left  → next
    else         goTo(cur - 1); // swipe right → prev
  }
  paused = false;
  lastTick = null;
}, { passive: true });

// ── Auto-advance ──
requestAnimationFrame(function tick(ts) {
  if (!paused) {
    if (lastTick === null) lastTick = ts;
    elapsed += ts - lastTick; lastTick = ts;
    fill.style.width = Math.min(elapsed / INTERVAL * 100, 100) + '%';
    lbl.textContent  = Math.ceil((INTERVAL - elapsed) / 1000) + 's';
    if (elapsed >= INTERVAL) goTo(cur + 1);
  } else { lastTick = null; }
  requestAnimationFrame(tick);
});
