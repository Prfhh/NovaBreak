const STORAGE_KEYS = {
    settings: 'blackholeSettings',
    runtime: 'blackholeRuntime'
};

const DEFAULT_SETTINGS = {
    workMinutes: 20,
    breakSeconds: 30,
    permanentlyStopped: false
};

const DEFAULT_RUNTIME = {
    active: false,
    startedAt: null,
    endsAt: null,
    origin: null,
    nextBreakAt: null
};

const ALARM_WORK = 'blackhole-work-alarm';
const ALARM_BREAK = 'blackhole-break-end-alarm';

// Force checking state whenever a user switches active tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const runtime = await getRuntime();
    if (runtime.active) {
        try {
            chrome.tabs.sendMessage(activeInfo.tabId, { type: 'refreshBlackhole' });
        } catch (e) { /* Tab not ready or protected */ }
    }
});

chrome.runtime.onInstalled.addListener(async () => {
    await bootstrap();
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    for (const tab of tabs) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (e) {}
    }
});

chrome.runtime.onStartup.addListener(bootstrap);

chrome.alarms.onAlarm.addListener(async (alarm) => {
    const settings = await getSettings();
    if (settings.permanentlyStopped) return;

    if (alarm.name === ALARM_WORK) {
        await startBreakCycle();
    } else if (alarm.name === ALARM_BREAK) {
        await stopBreakCycle(false);
    }
});

chrome.idle.onStateChanged.addListener(async (state) => {
    if (state === 'idle' || state === 'locked') {
        const runtime = await getRuntime();
        if (runtime.active) {
            await stopBreakCycle(true);
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'startNow') {
        updatePermanentStatus(false).then(() => startBreakCycle());
        sendResponse({ ok: true });
    } else if (message.type === 'stopNow') {
        stopBreakCycle(true).then(() => sendResponse({ ok: true }));
    } else if (message.type === 'permanentlyStop') {
        updatePermanentStatus(true).then(() => sendResponse({ ok: true }));
    }
    return true;
});

async function bootstrap() {
    await chrome.idle.setDetectionInterval(30);
    await ensureDefaults();
    const settings = await getSettings();
    if (!settings.permanentlyStopped) {
        await scheduleNextWorkSession(settings.workMinutes);
    }
}

async function startBreakCycle() {
    const settings = await getSettings();
    if (settings.permanentlyStopped) return;

    const now = Date.now();
    const durationMS = settings.breakSeconds * 1000;

    await chrome.alarms.clearAll();
    
    await setRuntime({
        active: true,
        startedAt: now,
        endsAt: now + durationMS,
        origin: getRandomOrigin()
    });

    chrome.alarms.create(ALARM_BREAK, { delayInMinutes: settings.breakSeconds / 60 });
}

async function stopBreakCycle(manualDismiss = false) {
    const now = Date.now();
    const runtime = await getRuntime();
    const settings = await getSettings();

    await chrome.alarms.clearAll();

    if (settings.permanentlyStopped) {
        await setRuntime(DEFAULT_RUNTIME);
        return;
    }

    let coolDownSeconds = settings.breakSeconds;
    if (manualDismiss && runtime.startedAt) {
        const elapsedSeconds = Math.floor((now - runtime.startedAt) / 1000);
        coolDownSeconds = Math.min(120, settings.breakSeconds + elapsedSeconds);
    }

    await setRuntime({
        active: false,
        startedAt: null,
        endsAt: null,
        origin: null,
        nextBreakAt: now + (coolDownSeconds * 1000)
    });

    chrome.alarms.create(ALARM_WORK, { delayInMinutes: coolDownSeconds / 60 });
}

async function updatePermanentStatus(shouldStop) {
    const current = await getSettings();
    await chrome.storage.local.set({
        [STORAGE_KEYS.settings]: { ...current, permanentlyStopped: shouldStop }
    });
    await chrome.alarms.clearAll();
    if (shouldStop) {
        await setRuntime(DEFAULT_RUNTIME);
    } else {
        await scheduleNextWorkSession(current.workMinutes);
    }
}

async function scheduleNextWorkSession(minutes) {
    await chrome.alarms.clear(ALARM_WORK);
    chrome.alarms.create(ALARM_WORK, { delayInMinutes: minutes });
}

async function ensureDefaults() {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.runtime]);
    if (!stored[STORAGE_KEYS.settings]) await chrome.storage.local.set({ [STORAGE_KEYS.settings]: DEFAULT_SETTINGS });
    if (!stored[STORAGE_KEYS.runtime]) await chrome.storage.local.set({ [STORAGE_KEYS.runtime]: DEFAULT_RUNTIME });
}

async function getSettings() {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.settings]);
    return { ...DEFAULT_SETTINGS, ...stored[STORAGE_KEYS.settings] };
}

async function getRuntime() {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.runtime]);
    return { ...DEFAULT_RUNTIME, ...stored[STORAGE_KEYS.runtime] };
}

async function setRuntime(runtime) {
    await chrome.storage.local.set({ [STORAGE_KEYS.runtime]: runtime });
    await notifyTabs();
}

async function notifyTabs() {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
        try { chrome.tabs.sendMessage(t.id, { type: 'refreshBlackhole' }); } catch (e) {}
    }
}

function getRandomOrigin() {
    return { x: Math.round(15 + Math.random() * 70), y: Math.round(18 + Math.random() * 62) };
}