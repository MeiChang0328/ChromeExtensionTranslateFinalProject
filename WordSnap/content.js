// finalproject/content.js — 1.7.5 基礎 + 新增單字串接
const Z_TOP = 2147483647;
const THROTTLE_MS = 500;

let lastTs = 0;
let bubble = null;
let enabled = true;

// 記錄最近一次的原文與翻譯，供「新增單字」使用
let lastSourceText = "";
let lastTranslation = "";

// 取得初始狀態
chrome.runtime.sendMessage({ type: "QTX_GET_STATE" }, (st) => {
    enabled = !!(st?.enabled ?? true);
});

// 監聽背景狀態切換
chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "QTX_STATE_CHANGED") {
        enabled = !!msg.payload?.enabled;
        if (!enabled) removeBubble();
    }
});

// 觸發：雙擊、選字放開、Alt+T
document.addEventListener("dblclick", handleTrigger, true);
document.addEventListener("mouseup", () => setTimeout(handleTrigger, 0), true);
document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "t" || e.key === "T")) handleTrigger(e);
}, true);

// 小工具
function throttleOk() {
    const t = Date.now();
    if (t - lastTs < THROTTLE_MS) return false;
    lastTs = t;
    return true;
}

function getSelectedText() {
    const s = window.getSelection?.();
    if (!s || s.isCollapsed) return "";
    return s.toString().trim();
}

async function handleTrigger() {
    if (!enabled) return;
    if (!throttleOk()) return;

    const text = getSelectedText();
    if (!text) return;

    // 顯示「翻譯中…」
    lastSourceText = text;
    lastTranslation = "";
    showBubble("翻譯中…", lastSourceText);

    // 要求背景翻譯
    chrome.runtime.sendMessage({ type: "QTX_TRANSLATE", text }, (resp) => {
        if (!resp?.ok) {
            showBubble("（翻譯失敗）" + (resp?.error || ""), lastSourceText);
            return;
        }
        lastTranslation = resp.data?.target || "";
        showBubble(lastTranslation || "（無結果）", lastSourceText);
    });
}

function showBubble(translation, sourceText) {
    if (!bubble) {
        bubble = document.createElement("div");
        bubble.style.position = "fixed";
        bubble.style.zIndex = Z_TOP;
        bubble.style.maxWidth = "460px";
        bubble.style.padding = "10px 12px";
        bubble.style.background = "rgba(20,20,20,.92)";
        bubble.style.color = "#fff";
        bubble.style.borderRadius = "12px";
        bubble.style.boxShadow = "0 6px 20px rgba(0,0,0,.25)";
        bubble.style.fontSize = "14px";
        bubble.style.lineHeight = "1.5";
        bubble.style.backdropFilter = "blur(2px)";
        bubble.style.cursor = "default";
        bubble.addEventListener("mousedown", (e) => e.stopPropagation());

        const textEl = document.createElement("div");
        textEl.id = "qtx-text";
        bubble.appendChild(textEl);

        // 按鈕列
        const row = document.createElement("div");
        row.style.marginTop = "8px";
        row.style.display = "flex";
        row.style.gap = "8px";

        const btnAdd = document.createElement("button");
        btnAdd.id = "qtx-btn-add";
        btnAdd.textContent = "新增單字";
        btnAdd.style.padding = "4px 10px";
        btnAdd.style.borderRadius = "8px";
        btnAdd.style.border = "0";
        btnAdd.style.cursor = "pointer";

        btnAdd.addEventListener("click", () => {
            // 使用目前記錄的 lastSourceText / lastTranslation
            const word = lastSourceText?.trim();
            const translation = lastTranslation?.trim();
            if (!word) {
                btnAdd.textContent = "沒有原文";
                return;
            }
            btnAdd.disabled = true;
            btnAdd.textContent = "新增中…";

            chrome.runtime.sendMessage(
                { type: "QTX_SAVE_WORD", word, translation },
                (resp) => {
                    if (resp?.ok) {
                        btnAdd.textContent = "已新增";
                    } else {
                        btnAdd.textContent = "新增失敗";
                        btnAdd.disabled = false;
                    }
                }
            );
        });

        row.appendChild(btnAdd);
        bubble.appendChild(row);

        document.documentElement.appendChild(bubble);
    }

    // 更新內容
    const textEl = bubble.querySelector("#qtx-text");
    if (textEl) textEl.textContent = translation || "";

    // 位置盡量靠近選取範圍
    const pos = { x: window.scrollX + 24, y: window.scrollY + 24 };
    try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
            const rect = sel.getRangeAt(0).getBoundingClientRect();
            pos.x = Math.max(12, rect.left + rect.width / 2);
            pos.y = Math.max(12, rect.top - 12);
        }
    } catch {}
    bubble.style.left = pos.x + "px";
    bubble.style.top = pos.y + "px";

    // 自動關閉 & 點空白關閉
    clearTimeout(bubble._tmr);
    bubble._tmr = setTimeout(removeBubble, 6000);
    window.removeEventListener("mousedown", onDocClose, true);
    window.addEventListener("mousedown", onDocClose, true);
}

function onDocClose(e) {
    if (!bubble) return;
    if (bubble.contains(e.target)) return;
    removeBubble();
}

function removeBubble() {
    if (bubble && bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
    }
    bubble = null;
    window.removeEventListener("mousedown", onDocClose, true);
}
