const STORAGE_KEYS = {
    settings: 'blackholeSettings',
    runtime: 'blackholeRuntime'
};

// UI Elements
const engineToggle = document.getElementById('engineToggle');
const toggleStateLabel = document.getElementById('toggleStateLabel');
const workSlider = document.getElementById('workMinutes');
const workValue = document.getElementById('workValue');
const breakSlider = document.getElementById('breakSeconds');
const breakValue = document.getElementById('breakValue');
const statusText = document.getElementById('statusText');
const nextBreakText = document.getElementById('nextBreakText');
const startBtn = document.getElementById('startNow');
const stopBtn = document.getElementById('stopNow');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await initUI();
    setupEventListeners();
});

async function initUI() {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.runtime]);
    
    const settings = stored[STORAGE_KEYS.settings] || { workMinutes: 20, breakSeconds: 30, permanentlyStopped: false };
    const runtime = stored[STORAGE_KEYS.runtime] || { active: false, nextBreakAt: null };

    // Set configuration controls
    workSlider.value = settings.workMinutes || 20;
    workValue.textContent = `${workSlider.value}m`;
    
    breakSlider.value = settings.breakSeconds || 30;
    breakValue.textContent = `${breakSlider.value}s`;

    // Engine Switch position mapping
    engineToggle.checked = !settings.permanentlyStopped;
    updateToggleLabel(!settings.permanentlyStopped);

    updateStatusDisplay(runtime, settings.permanentlyStopped);
}

function setupEventListeners() {
    // Dynamic sliders readout tracking
    workSlider.addEventListener('input', (e) => { workValue.textContent = `${e.target.value}m`; });
    breakSlider.addEventListener('input', (e) => { breakValue.textContent = `${e.target.value}s`; });

    // Commit parameters updates back to local storage
    const saveSettings = async () => {
        const workMinutes = parseInt(workSlider.value, 10);
        const breakSeconds = parseInt(breakSlider.value, 10);
        const permanentlyStopped = !engineToggle.checked;

        await chrome.storage.local.set({
            [STORAGE_KEYS.settings]: { workMinutes, breakSeconds, permanentlyStopped }
        });
    };

    workSlider.addEventListener('change', saveSettings);
    breakSlider.addEventListener('change', saveSettings);

    // Master operational switch mechanism
    engineToggle.addEventListener('change', async (e) => {
        const isRunning = e.target.checked;
        updateToggleLabel(isRunning);
        await saveSettings();
        
        if (isRunning) {
            await chrome.runtime.sendMessage({ type: 'startNow' });
        } else {
            await chrome.runtime.sendMessage({ type: 'permanentlyStop' });
        }
    });

    // Operational manual buttons triggers
    startBtn.addEventListener('click', async () => {
        if (!engineToggle.checked) {
            engineToggle.checked = true;
            updateToggleLabel(true);
            await saveSettings();
        }
        await chrome.runtime.sendMessage({ type: 'startNow' });
    });

    stopBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ type: 'stopNow' });
    });

    // Realtime loop refresh bindings
    chrome.storage.onChanged.addListener(async (changes, areaName) => {
        if (areaName === 'local') {
            const stored = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.runtime]);
            const settings = stored[STORAGE_KEYS.settings] || {};
            const runtime = stored[STORAGE_KEYS.runtime] || {};
            updateStatusDisplay(runtime, settings.permanentlyStopped);
        }
    });
}

function updateToggleLabel(isRunning) {
    if (isRunning) {
        toggleStateLabel.textContent = 'Active Engine';
        toggleStateLabel.style.color = '#7cf4ff';
    }
}

function updateStatusDisplay(runtime, permanentlyStopped) {
    if (permanentlyStopped) {
        statusText.textContent = 'Disabled';
        statusText.style.color = '#ff6d6d';
        nextBreakText.textContent = 'Offline';
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        return;
    }

    if (runtime && runtime.active) {
        statusText.textContent = 'Singularity Formed';
        statusText.style.color = '#ff9454';
        nextBreakText.textContent = 'In progress...';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
    } else {
        statusText.textContent = 'Dormant';
        statusText.style.color = '#7cf4ff';
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';

        if (runtime && runtime.nextBreakAt) {
            const diffMs = runtime.nextBreakAt - Date.now();
            if (diffMs <= 0) {
                nextBreakText.textContent = 'Imminent';
            } else {
                const totalSecs = Math.ceil(diffMs / 1000);
                if (totalSecs < 60) {
                    nextBreakText.textContent = `In ${totalSecs}s`;
                } else {
                    nextBreakText.textContent = `In ${Math.ceil(totalSecs / 60)}m`;
                }
            }
        } else {
            nextBreakText.textContent = 'Calculating...';
        }
    }
}