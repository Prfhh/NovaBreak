const STORAGE_KEYS = {
  settings: 'blackholeSettings',
  runtime: 'blackholeRuntime'
};

const ROOT_ID = 'blackhole-break-root';
const STYLE_ID = 'blackhole-break-styles';

let overlayRoot = null;
let renderTimer = null;

init();

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === 'refreshBlackhole') syncState();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && (changes[STORAGE_KEYS.runtime] || changes[STORAGE_KEYS.settings])) {
    syncState();
  }
});

async function init() {
  ensureStyles();
  await syncState();
}

async function syncState() {
  const { blackholeRuntime } = await chrome.storage.local.get([STORAGE_KEYS.runtime]);

  if (blackholeRuntime && blackholeRuntime.active) {
    showOverlay({
      startedAt: blackholeRuntime.startedAt || Date.now(),
      endsAt: blackholeRuntime.endsAt || Date.now() + 30000,
      origin: blackholeRuntime.origin || {x: 50, y: 50}
    });
    return;
  }
  hideOverlay();
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: none;
      pointer-events: none;
      overflow: hidden;
      font-family: system-ui, sans-serif;
    }

    #${ROOT_ID}.visible {
      display: block;
    }

    .blackhole-environment {
      position: absolute;
      inset: 0;
      background: transparent;
      pointer-events: none;
    }

    /* Master Anomaly Structure */
    .blackhole-shell {
      position: absolute;
      left: var(--hole-x, 50%);
      top: var(--hole-y, 50%);
      width: clamp(320px, 40vw, 520px);
      height: clamp(320px, 40vw, 520px);
      transform: translate(-50%, -50%);
      display: grid;
      place-items: center;
      perspective: 1200px;
      isolation: isolate;
      pointer-events: auto;
      --hole-scale: 1;
      --ring-tilt: -8deg;
    }

    /* Gravitational Space Dimming */
    .blackhole-space-distortion {
      position: absolute;
      inset: -25%;
      border-radius: 50%;
      background: radial-gradient(circle at center, rgba(0,0,0,0.65) 0%, rgba(15,10,5,0.3) 40%, transparent 75%);
      mix-blend-mode: multiply;
      pointer-events: none;
    }

    /* 1. Einstein Gravitational Lensing Loop (Light bent over the top/bottom) */
    .blackhole-gravitational-halo {
      position: absolute;
      width: calc(62% * var(--hole-scale));
      height: calc(62% * var(--hole-scale));
      border-radius: 50%;
      background: transparent;
      box-shadow: 
        0 0 40px rgba(255, 130, 40, 0.45),
        inset 0 0 50px rgba(255, 90, 20, 0.35);
      border: 18px solid rgba(255, 165, 75, 0.9);
      filter: blur(8px) contrast(150%) saturate(140%);
      transform: rotateX(50deg) rotateY(var(--ring-tilt));
      mix-blend-mode: screen;
      z-index: 1;
    }

    /* 2. Realistic Asymmetric Accretion Disk (Doppler Beaming Shift) */
    .blackhole-interstellar-belt {
      position: absolute;
      width: 210%;
      height: 28%;
      top: 36%;
      left: -55%;
      /* Left side bursts with bright energy, right side decays completely into dark dust */
      background: linear-gradient(90deg, 
        rgba(255, 120, 30, 0) 0%, 
        rgba(255, 245, 220, 1) 18%,      /* Ultra-bright hot core approaching observer */
        rgba(255, 170, 50, 0.95) 32%, 
        rgba(240, 90, 20, 0.8) 44%,
        rgba(0, 0, 0, 1) 50%,            /* Clean shadow cutoff at the horizon border */
        rgba(180, 50, 10, 0.4) 62%,      /* Red-shifted receding gas fades down dramatically */
        rgba(110, 25, 2, 0.1) 80%,
        rgba(110, 25, 2, 0) 100%
      );
      filter: blur(4px) drop-shadow(0 0 25px rgba(255, 120, 30, 0.85));
      transform: rotate(var(--ring-tilt)) rotateX(72deg);
      border-radius: 50% 50% 48% 48%;
      mix-blend-mode: screen;
      z-index: 4; 
      animation: plasma-churn 5s ease-in-out infinite alternate;
    }

    /* Extra soft plasma smoke layer over the belt to break hard lines */
    .blackhole-interstellar-belt::after {
      content: '';
      position: absolute;
      inset: -10%;
      background: inherit;
      filter: blur(12px);
      opacity: 0.6;
      mix-blend-mode: screen;
    }

    /* 3. Cosmic Swirl Particulates (Adds authentic textured dust fields) */
    .blackhole-cosmic-shards {
      position: absolute;
      inset: -15%;
      border-radius: 50%;
      background: repeating-conic-gradient(
        from 0deg,
        transparent 0deg 18deg,
        rgba(255, 160, 60, 0.2) 22deg,
        rgba(255, 235, 180, 0.35) 25deg,
        transparent 28deg 50deg
      );
      filter: blur(6px);
      mix-blend-mode: screen;
      opacity: 0.65;
      transform: rotateX(60deg);
      animation: cosmic-spin 16s linear infinite;
      z-index: 2;
    }

    /* 4. Fine-line Photon Ring (The absolute light trap boundary) */
    .blackhole-photon-edge {
      position: absolute;
      width: calc(41.5% * var(--hole-scale));
      height: calc(41.5% * var(--hole-scale));
      border-radius: 50%;
      box-shadow: 
        0 0 0 2.5px #ffffff,
        0 0 15px #ff9d3b,
        inset 0 0 20px #ff4500;
      background: transparent;
      z-index: 3;
      filter: drop-shadow(0 0 5px #fff) blur(0.3px);
    }

    /* 5. Central Schwarzschild Singularity Core (Deep Black Vacuum Void) */
    .blackhole-singularity-core {
      position: absolute;
      width: calc(38.5% * var(--hole-scale));
      height: calc(38.5% * var(--hole-scale));
      border-radius: 50%;
      background: #000000;
      box-shadow: 
        0 0 35px #000000,
        0 0 60px rgba(0,0,0,0.95),
        inset 0 0 25px rgba(0,0,0,1);
      z-index: 5; 
    }

    /* Compact Hover Info Overlay Button Setup */
    .blackhole-mini-panel {
      position: absolute;
      top: 108%;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      width: 135px;
      padding: 0.45rem;
      border-radius: 6px;
      background: rgba(5, 3, 2, 0.96);
      border: 1px solid rgba(255, 150, 50, 0.2);
      box-shadow: 0 15px 40px rgba(0,0,0,0.8);
      color: #fff;
      font-size: 0.7rem;
      z-index: 6;
      text-align: center;
      opacity: 0.15;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .blackhole-shell:hover .blackhole-mini-panel {
      opacity: 1;
    }

    .blackhole-btn-clear {
      border: 0;
      background: linear-gradient(135deg, #ffbc6e, #ff4500);
      color: white;
      font-weight: bold;
      padding: 0.25rem;
      border-radius: 3px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    @keyframes cosmic-spin {
      from { transform: rotateX(60deg) rotate(0deg); }
      to { transform: rotateX(60deg) rotate(360deg); }
    }

    @keyframes plasma-churn {
      0% { transform: rotate(var(--ring-tilt)) rotateX(72deg) scaleY(0.98); filter: blur(4px) drop-shadow(0 0 22px rgba(255, 120, 30, 0.8)); }
      100% { transform: rotate(var(--ring-tilt)) rotateX(72deg) scaleY(1.03); filter: blur(4.5px) drop-shadow(0 0 30px rgba(255, 160, 50, 0.95)); }
    }
  `;
  document.documentElement.appendChild(style);
}

function showOverlay(state) {
  if (!overlayRoot) {
    overlayRoot = document.createElement('div');
    overlayRoot.id = ROOT_ID;
    overlayRoot.innerHTML = `
      <div class="blackhole-environment"></div>
      <div class="blackhole-shell">
        <div class="blackhole-space-distortion"></div>
        <div class="blackhole-gravitational-halo"></div>
        <div class="blackhole-cosmic-shards"></div>
        <div class="blackhole-photon-edge"></div>
        <div class="blackhole-singularity-core"></div>
        <div class="blackhole-interstellar-belt"></div>
        
        <div class="blackhole-mini-panel">
          <div style="font-weight:bold;color:#ffbc6e" data-role="state">Singularity Vector</div>
          <div data-role="countdown">--s</div>
          <button class="blackhole-btn-clear" data-role="stop">Dismiss</button>
        </div>
      </div>
    `;
    overlayRoot.querySelector('[data-role="stop"]').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'stopNow' });
    });
    document.documentElement.appendChild(overlayRoot);
  }

  overlayRoot.style.setProperty('--hole-x', state.origin.x + '%');
  overlayRoot.style.setProperty('--hole-y', state.origin.y + '%');
  overlayRoot.classList.add('visible');

  if (renderTimer) clearInterval(renderTimer);
  renderTimer = setInterval(() => renderIntensity(state), 50);
}

function renderIntensity(state) {
  if (!overlayRoot) return;
  const now = Date.now();
  const elapsedSeconds = Math.max(0, (now - state.startedAt) / 1000);
  const remainingSeconds = Math.max(0, Math.ceil((state.endsAt - now) / 1000));

  const currentScale = Math.min(1.8, 1.0 + (elapsedSeconds * 0.02));

  const shell = overlayRoot.querySelector('.blackhole-shell');
  const countdown = overlayRoot.querySelector('[data-role="countdown"]');

  if (shell) shell.style.setProperty('--hole-scale', String(currentScale));
  if (countdown) countdown.textContent = `${remainingSeconds}s remaining`;
}

function hideOverlay() {
  if (renderTimer) { clearInterval(renderTimer); renderTimer = null; }
  if (overlayRoot) overlayRoot.classList.remove('visible');
}