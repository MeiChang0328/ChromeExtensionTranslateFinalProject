// —— 單字管理（搜尋 / 新增 / 編輯 / 儲存 / 刪除）整合版 ——
// 後端位址：若非本機 8080，請改這裡
const BASE = "http://localhost:8080";

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);
const setStatus = (msg) => { const n = $("#status"); if (n) n.textContent = msg ?? "—"; };

// 顯示後端位址
const backendBaseEl = $("#backendBase");
if (backendBaseEl) backendBaseEl.textContent = BASE;

// ===== API =====
const api = {
    async list(q) {
        let u;
        if (q && q.trim()) {
            // 後端搜尋 API：/api/words/search?name=xxx
            u = new URL(BASE + "/api/words/search");
            u.searchParams.set("name", q.trim());
        } else {
            // 全部列表
            u = new URL(BASE + "/api/words");
        }
        const res = await fetch(u);
        if (!res.ok) throw new Error("讀取失敗 " + res.status);
        return res.json();
    },
    async create(body) {
        const res = await fetch(BASE + "/api/words", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error("新增失敗 " + res.status);
        return res.json();
    },
    async update(id, body) {
        const res = await fetch(`${BASE}/api/words/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error("更新失敗 " + res.status);
        return res.json();
    },
    async remove(id) {
        const res = await fetch(`${BASE}/api/words/${id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 204) throw new Error("刪除失敗 " + res.status);
        return true;
    }
};

// ===== DOM 綁定 =====
const tbody = $("#tbody");
const qInput = $("#q");
$("#btnSearch")?.addEventListener("click", () => load(qInput?.value));
$("#btnReload")?.addEventListener("click", () => load(qInput?.value));
$("#btnCreate")?.addEventListener("click", onCreate);

// Enter 直接搜尋
qInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        $("#btnSearch")?.click();
    }
});

// 首次載入
load("");

// ===== 邏輯 =====
async function load(q) {
    try {
        setStatus("讀取中…");
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="muted">讀取中…</td></tr>`;
        const data = await api.list(q);
        const list = Array.isArray(data) ? data : (data.content ?? []);
        renderRows(list);
        setStatus(`共 ${Array.isArray(data) ? data.length : (data.totalElements ?? list.length)} 筆`);
    } catch (e) {
        console.error(e);
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="muted">讀取失敗：${e.message}</td></tr>`;
        setStatus("讀取失敗");
    }
}

function renderRows(list) {
    if (!tbody) return;
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="muted">沒有資料</td></tr>`;
        return;
    }
    tbody.innerHTML = "";
    for (const item of list) {
        tbody.appendChild(rowView(item));
    }
}

function rowView(item) {
    const tr = el("tr");

    // ID
    tr.appendChild(el("td", { textContent: item.id ?? item.ID ?? "" }));

    // Word（可編輯但不自動儲存）
    const tdWord = el("td");
    const inpWord = el("input", { value: item.word ?? "", style: "width:100%;" });
    inpWord.dataset.original = item.word ?? "";
    tdWord.appendChild(inpWord);
    tr.appendChild(tdWord);

    // Translation（可編輯但不自動儲存）
    const tdTrans = el("td");
    const inpTrans = el("input", { value: item.translation ?? "", style: "width:100%;" });
    inpTrans.dataset.original = item.translation ?? "";
    tdTrans.appendChild(inpTrans);
    tr.appendChild(tdTrans);

    // 建立時間
    tr.appendChild(el("td", { textContent: item.createdAt ?? "" }));

    // 操作（儲存 + 刪除）
    const tdAct = el("td");
    tdAct.className = "row-actions";

    const btnSave = el("button", { textContent: "儲存", className: "btn primary", disabled: true });
    const btnDel  = el("button", { textContent: "刪除", className: "btn danger" });

    // 有變更才開放儲存
    const onChange = () => {
        const dirty = isDirty();
        btnSave.disabled = !dirty || btnSave.classList.contains("btn--loading");
        markDirty(inpWord, inpTrans, dirty);
    };
    inpWord.addEventListener("input", onChange);
    inpTrans.addEventListener("input", onChange);

    // 儲存
    btnSave.addEventListener("click", async () => {
        if (!isDirty() || btnSave.classList.contains("btn--loading")) return;
        try {
            setSaving(true);
            const payload = { word: inpWord.value, translation: inpTrans.value };
            const saved = await api.update(item.id, payload);
            // 更新原始值並清除 dirty
            inpWord.dataset.original = saved.word ?? payload.word ?? "";
            inpTrans.dataset.original = saved.translation ?? payload.translation ?? "";
            markDirty(inpWord, inpTrans, false);
            setSaved();
            setStatus(`已儲存 #${item.id}`);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setSaving(false);
        }
    });

    // 刪除
    btnDel.addEventListener("click", async () => {
        if (!confirm(`確定刪除 #${item.id}？`)) return;
        try {
            await api.remove(item.id);
            tr.remove();
            setStatus(`已刪除 #${item.id}`);
        } catch (e) {
            console.error(e);
            alert("刪除失敗：" + e.message);
            setStatus("刪除失敗");
        }
    });

    // 視覺狀態輔助
    const setSaving = (on) => {
        if (on) {
            btnSave.classList.add("btn--loading");
            btnSave.disabled = true;
            btnSave.dataset.label = btnSave.textContent;
            btnSave.textContent = "儲存中…";
        } else {
            btnSave.classList.remove("btn--loading");
            btnSave.textContent = btnSave.dataset.label || "儲存";
        }
    };
    const setSaved = () => {
        btnSave.classList.add("btn--ok");
        btnSave.disabled = true;
        btnSave.textContent = "已儲存 ✓";
        // 1.2 秒後還原文字（保持 disabled；有變更才再啟用）
        setTimeout(() => {
            btnSave.classList.remove("btn--ok");
            btnSave.textContent = "儲存";
        }, 1200);
    };
    const setError = (msg) => {
        btnSave.classList.add("btn--error", "shake");
        btnSave.textContent = "儲存失敗";
        setStatus("更新失敗：" + (msg || ""));
        setTimeout(() => btnSave.classList.remove("shake"), 400);
        setTimeout(() => {
            btnSave.classList.remove("btn--error");
            btnSave.textContent = "儲存";
            btnSave.disabled = !isDirty();
        }, 1500);
    };

    tdAct.append(btnSave, btnDel);
    tr.appendChild(tdAct);

    function isDirty() {
        return (inpWord.value !== inpWord.dataset.original) ||
            (inpTrans.value !== inpTrans.dataset.original);
    }
    function markDirty(w, t, dirty) {
        const cls = "q-dirty";
        [w, t].forEach(x => {
            if (!x) return;
            if (dirty) x.classList.add(cls); else x.classList.remove(cls);
        });
    }

    return tr;
}

async function onCreate() {
    const word = prompt("請輸入單字");
    if (!word) return;
    const translation = prompt("翻譯（可留空）") ?? "";
    try {
        const created = await api.create({ word, translation });
        // 插入最上方
        const row = rowView(created);
        if (tbody) tbody.insertBefore(row, tbody.firstChild || null);
        setStatus(`已新增 #${created.id ?? ""}`);
    } catch (e) {
        console.error(e);
        alert("新增失敗：" + e.message);
        setStatus("新增失敗");
    }
}
