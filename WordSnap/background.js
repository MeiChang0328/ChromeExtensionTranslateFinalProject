// background.js — MyMemory（前端直連）+ 全域狀態
const STORAGE_KEY = "QTX_STATE";
const BACKEND_BASE = "http://localhost:8080"; // 單字本後端（若沒有，仍可翻譯）

chrome.runtime.onInstalled.addListener(async () => {
    const cur = await chrome.storage.local.get(STORAGE_KEY);
    if (!cur[STORAGE_KEY]) {
        await chrome.storage.local.set({ [STORAGE_KEY]: { enabled: true } });
    }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
        if (msg?.type === "QTX_GET_STATE") {
            const state = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || { enabled: true };
            sendResponse(state);
            return;
        }

        if (msg?.type === "QTX_TOGGLE") {
            const state = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || { enabled: true };
            const next = { enabled: !state.enabled };
            await chrome.storage.local.set({ [STORAGE_KEY]: next });
            chrome.tabs.query({}, (tabs) => {
                for (const t of tabs) {
                    try { chrome.tabs.sendMessage(t.id, { type: "QTX_STATE_CHANGED", payload: next }); } catch {}
                }
            });
            sendResponse(next);
            return;
        }

        if (msg?.type === "QTX_TRANSLATE") {
            try {
                const text = (msg.text || "").trim();
                if (!text) { sendResponse({ ok: false, error: "EMPTY_TEXT" }); return; }
                const data = await translateMyMemory(text);
                sendResponse({ ok: true, data });
            } catch (e) {
                sendResponse({ ok: false, error: String(e?.message || e) });
            }
            return;
        }

        if (msg?.type === "QTX_SAVE_WORD") {
            // 供 content.js 的「新增單字」按鈕使用（可選）
            if (!BACKEND_BASE) { sendResponse({ ok: false, error: "NO_BACKEND" }); return; }
            try {
                const res = await fetch(`${BACKEND_BASE}/api/words`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ word: msg.word, translation: msg.translation })
                });
                if (!res.ok) throw new Error("HTTP " + res.status);
                const js = await res.json();
                sendResponse({ ok: true, data: js });
            } catch (e) {
                sendResponse({ ok: false, error: String(e?.message || e) });
            }
            return;
        }
    })();
    return true; // async
});

// ===== MyMemory：來源不能用 auto，所以自行判斷 =====
function looksLikeChinese(s) {
    return /[\u3000-\u303F\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF]/.test(s);
}

async function translateMyMemory(text) {
    const src = looksLikeChinese(text) ? "zh-CN" : "en"; // 來源固定中或英
    const tgt = looksLikeChinese(text) ? "en" : "zh-TW"; // 中文→英；非中文→繁中

    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", `${src}|${tgt}`);

    const controller = new AbortController();
    const tmr = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();

        let translated = data?.responseData?.translatedText || "";
        if (Array.isArray(data?.matches) && data.matches.length) {
            data.matches.sort((a, b) => (b?.match || 0) - (a?.match || 0));
            const better = data.matches[0]?.translation;
            if (better) translated = better;
        }
        translated = String(translated).replace(/&quot;/g, '"').replace(/&#39;/g, "'");

        return { source: text, target: translated, lang: tgt };
    } finally {
        clearTimeout(tmr);
    }
}
