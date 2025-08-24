<template>
  <div class="wm-wrap">
    <header class="wm-header">
      <h2 class="wm-title">Vocabulary Manager</h2>
      <span class="wm-pill">Backend: {{ BASE }}</span>
      <span class="wm-status">{{ status }}</span>
    </header>

    <!-- Toolbar -->
    <div class="wm-toolbar">
      <div class="wm-input">
        <input
            v-model.trim="search"
            placeholder="Search by word or translation"
            @keydown.enter.prevent="doSearch"
        />
      </div>
      <button class="btn" @click="doSearch">Search</button>
      <button class="btn" @click="reload">Reload</button>

      <div class="wm-spacer"></div>

      <div class="wm-new">
        <input
            v-model.trim="newWord.word"
            class="wm-new-input"
            placeholder="New word"
        />
        <input
            v-model.trim="newWord.translation"
            class="wm-new-input"
            placeholder="Translation (optional)"
        />
        <button class="btn primary" @click="create">＋ Add</button>
      </div>
    </div>

    <!-- Table -->
    <div class="wm-table-wrap">
      <table class="wm-table">
        <thead>
        <tr>
          <th style="width:80px;">ID</th>
          <th style="width:30%;">Word</th>
          <th style="width:40%;">Translation</th>
          <th style="width:20%;">Created</th>
          <th>Actions</th>
        </tr>
        </thead>

        <tbody v-if="loading">
        <tr><td colspan="5" class="muted">Loading…</td></tr>
        </tbody>

        <tbody v-else-if="list.length === 0">
        <tr><td colspan="5" class="muted">No data</td></tr>
        </tbody>

        <tbody v-else>
        <tr v-for="row in list" :key="row.id">
          <!-- ID -->
          <td>{{ row.id }}</td>

          <!-- Word (修正重點：用 row.word，不是 row.name) -->
          <td>
            <template v-if="editId !== row.id">
              <span>{{ row.word }}</span>
            </template>
            <template v-else>
              <input
                  v-model="editWord.word"
                  :class="{'q-dirty': isDirty}"
                  class="wm-cell-input"
              />
            </template>
          </td>

          <!-- Translation -->
          <td>
            <template v-if="editId !== row.id">
              <span>{{ row.translation }}</span>
            </template>
            <template v-else>
              <input
                  v-model="editWord.translation"
                  :class="{'q-dirty': isDirty}"
                  class="wm-cell-input"
              />
            </template>
          </td>

          <!-- CreatedAt -->
          <td>{{ row.createdAt }}</td>

          <!-- Actions -->
          <td class="row-actions">
            <template v-if="editId !== row.id">
              <button class="btn" @click="beginEdit(row)">Edit</button>
              <button class="btn danger" @click="remove(row.id)">Delete</button>
            </template>

            <template v-else>
              <button
                  class="btn primary"
                  :class="{
                    'btn--loading': saving,
                    'btn--ok': saveOk,
                    'btn--error': saveErr
                  }"
                  :disabled="!isDirty || saving"
                  @click="saveEdit"
              >
                {{ saving ? 'Saving…' : (saveOk ? 'Saved ✓' : (saveErr ? 'Save Failed' : 'Save')) }}
              </button>
              <button class="btn" @click="cancelEdit">Cancel</button>
              <button class="btn danger" @click="remove(row.id)">Delete</button>
            </template>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';

/**
 * 後端位址：
 * - 若有設定 VITE_API_BASE，優先使用（例如 http://localhost:8080）
 * - 否則預設 http://localhost:8080
 */
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const status = ref('—');
const loading = ref(false);

// 列表資料
const list = ref([]);

// 搜尋字
const search = ref('');

// 新增資料
const newWord = reactive({
  word: '',
  translation: ''
});

// 編輯狀態
const editId = ref(null);
const editWord = reactive({
  word: '',
  translation: ''
});
// 原始值用來判斷 dirty
const original = reactive({
  word: '',
  translation: ''
});

// 儲存回饋
const saving = ref(false);
const saveOk = ref(false);
const saveErr = ref(false);

const isDirty = computed(() =>
    editId.value !== null &&
    (editWord.word !== original.word || editWord.translation !== original.translation)
);

// ===== API =====
async function apiList(q) {
  // 有搜尋字 → 先打後端搜尋；若失敗 fallback 全取再前端過濾
  try {
    if (q && q.trim()) {
      const u = new URL(`${BASE}/api/words/search`);
      u.searchParams.set('name', q.trim());
      const r = await fetch(u);
      if (r.ok) return await r.json();
      // 失敗時 fallback
      console.warn('search API failed', r.status, await r.text().catch(() => ''));
      const all = await apiList('');
      const kw = q.trim().toLowerCase();
      return all.filter(w =>
          String(w.word || '').toLowerCase().includes(kw) ||
          String(w.translation || '').toLowerCase().includes(kw)
      );
    } else {
      const r = await fetch(`${BASE}/api/words`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    }
  } catch (e) {
    throw e;
  }
}

async function apiCreate(body) {
  const r = await fetch(`${BASE}/api/words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Create failed ${r.status}`);
  return await r.json();
}

async function apiUpdate(id, body) {
  const r = await fetch(`${BASE}/api/words/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Update failed ${r.status}`);
  return await r.json();
}

async function apiRemove(id) {
  const r = await fetch(`${BASE}/api/words/${id}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 204) throw new Error(`Delete failed ${r.status}`);
  return true;
}

// ===== 行為 =====
async function load(q = '') {
  try {
    loading.value = true;
    status.value = 'Loading…';
    const data = await apiList(q);
    list.value = Array.isArray(data) ? data : (data.content ?? []);
    status.value = `Total ${list.value.length}`;
  } catch (e) {
    console.error(e);
    list.value = [];
    status.value = `Load failed: ${e.message || e}`;
  } finally {
    loading.value = false;
  }
}

function reload() {
  load(search.value);
}

function doSearch() {
  load(search.value);
}

async function create() {
  if (!newWord.word?.trim()) {
    alert('Please input a word.');
    return;
  }
  try {
    status.value = 'Creating…';
    const created = await apiCreate({
      word: newWord.word.trim(),
      translation: newWord.translation?.trim() || ''
    });
    // 插入到最前
    list.value = [created, ...list.value];
    // 清空表單
    newWord.word = '';
    newWord.translation = '';
    status.value = `Created #${created.id ?? ''}`;
  } catch (e) {
    console.error(e);
    status.value = `Create failed: ${e.message || e}`;
    alert(status.value);
  }
}

function beginEdit(row) {
  editId.value = row.id;
  editWord.word = row.word ?? '';
  editWord.translation = row.translation ?? '';
  original.word = row.word ?? '';
  original.translation = row.translation ?? '';
  // 清除儲存回饋狀態
  saving.value = false;
  saveOk.value = false;
  saveErr.value = false;
}

function cancelEdit() {
  editId.value = null;
  editWord.word = '';
  editWord.translation = '';
  original.word = '';
  original.translation = '';
  saving.value = false;
  saveOk.value = false;
  saveErr.value = false;
}

async function saveEdit() {
  if (editId.value === null || !isDirty.value) return;
  try {
    saving.value = true;
    saveOk.value = false;
    saveErr.value = false;
    status.value = 'Saving…';

    const payload = {
      word: editWord.word ?? '',
      translation: editWord.translation ?? ''
    };
    const saved = await apiUpdate(editId.value, payload);

    // 更新列表中的那一筆
    const idx = list.value.findIndex(w => w.id === editId.value);
    if (idx >= 0) {
      list.value[idx] = { ...list.value[idx], ...saved };
    }

    // 更新原始值、收起/保留可依需求：這裡保持在編輯狀態但清掉 dirty
    original.word = saved.word ?? payload.word ?? '';
    original.translation = saved.translation ?? payload.translation ?? '';
    saveOk.value = true;
    status.value = `Saved #${editId.value}`;

    // 1.2 秒後把「Saved ✓」字樣還原，但仍維持在編輯狀態，等待後續修改
    setTimeout(() => { saveOk.value = false; }, 1200);
  } catch (e) {
    console.error(e);
    saveErr.value = true;
    status.value = `Save failed: ${e.message || e}`;
    // 1.5 秒後允許再次嘗試
    setTimeout(() => { saveErr.value = false; }, 1500);
  } finally {
    saving.value = false;
  }
}

async function remove(id) {
  if (!confirm(`Delete #${id}?`)) return;
  try {
    status.value = 'Deleting…';
    await apiRemove(id);
    list.value = list.value.filter(w => w.id !== id);
    status.value = `Deleted #${id}`;
    if (editId.value === id) cancelEdit();
  } catch (e) {
    console.error(e);
    status.value = `Delete failed: ${e.message || e}`;
    alert(status.value);
  }
}

onMounted(() => {
  load('');
});
</script>

<style scoped>
/* 主題（知識藍 + 深色白字） */
:root {
  --bg:#0f172a;
  --panel:#1e293b;
  --text:#ffffff;
  --muted:#94a3b8;
  --primary:#3b82f6;
  --primary2:#1d4ed8;
  --danger:#ef4444;
  --border:#334155;
  --radius:10px;
  --shadow:0 6px 16px rgba(0,0,0,.35);
}
@media (prefers-color-scheme: light) {
  :root {
    --bg:#ffffff;
    --panel:#f8fafc;
    --text:#1e293b;
    --muted:#475569;
    --primary:#2563eb;
    --primary2:#1e40af;
    --danger:#dc2626;
    --border:#cbd5e1;
    --shadow:0 4px 10px rgba(15,23,42,.08);
  }
}

.wm-wrap { color: var(--text); }
.wm-header {
  display:flex; align-items:center; gap:12px; margin-bottom:14px;
}
.wm-title { font-size:20px; font-weight:700; color:var(--primary); }
.wm-pill {
  font-size:12px; color:var(--muted);
  background:var(--panel); border:1px solid var(--border);
  border-radius:999px; padding:4px 10px;
}
.wm-status { margin-left:auto; color:var(--muted); font-size:12px; }

.wm-toolbar {
  display:flex; gap:10px; flex-wrap:wrap; align-items:center;
  padding:12px; border:1px solid var(--border); border-radius:var(--radius);
  background:var(--panel); box-shadow:var(--shadow); margin-bottom:12px;
}
.wm-input {
  display:flex; align-items:center; gap:6px;
  border:1px solid var(--border); border-radius:8px; padding:4px 8px;
  background:var(--bg);
}
.wm-input input {
  border:0; outline:0; background:transparent; color:var(--text); width:160px; font-size:13px;
}
.wm-spacer { flex: 1 1 auto; }
.wm-new { display:flex; align-items:center; gap:8px; }
.wm-new-input {
  border:1px solid var(--border); background:var(--bg); color:var(--text);
  border-radius:8px; padding:6px 8px; font-size:13px; width:160px;
}

.btn {
  border:1px solid var(--border);
  background:var(--panel);
  color:var(--text);
  padding:6px 10px;
  border-radius:8px;
  cursor:pointer;
  font-size:13px;
  transition:border-color .2s, color .2s, transform .05s;
}
.btn:hover { border-color:var(--primary); color:var(--primary); }
.btn.primary {
  background:linear-gradient(180deg,var(--primary),var(--primary2));
  color:#fff; border:none;
  box-shadow:0 4px 10px rgba(59,130,246,.3);
}
.btn.danger {
  background:linear-gradient(180deg,#ef4444,#b91c1c);
  color:#fff; border:none;
}

.wm-table-wrap { overflow:auto; border:1px solid var(--border); border-radius:var(--radius); background:var(--panel); box-shadow:var(--shadow); }
.wm-table { width:100%; border-collapse:collapse; font-size:13px; color:var(--text); }
.wm-table thead th {
  text-align:left; padding:8px 10px; color:var(--muted);
  border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--panel);
}
.wm-table tbody td { padding:8px 10px; border-bottom:1px solid var(--border); }
.wm-table tbody tr:hover { background:rgba(59,130,246,.10); }

.muted { color:var(--muted); }

.row-actions { display:flex; gap:8px; align-items:center; }

.wm-cell-input {
  width: 90%;
  max-width: 220px;
  padding: 6px 8px;
  font-size: 13px;
  border:1px solid var(--border);
  border-radius:6px;
  background:var(--bg);
  color:var(--text);
}

/* Dirty 高亮 & 儲存回饋 */
.q-dirty {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--primary) 25%, transparent) !important;
}
.btn--loading { opacity:.75; pointer-events:none; }
.btn--ok { filter: drop-shadow(0 0 6px rgba(34,197,94,.45)); }
.btn--error {
  background: linear-gradient(180deg, #ef4444, #b91c1c) !important;
  color: #fff !important;
  border: none !important;
}
</style>
