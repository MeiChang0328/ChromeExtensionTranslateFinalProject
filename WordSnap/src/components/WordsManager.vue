<template>
  <div>
    <header>
      <h2 style="margin:0;">單字管理</h2>
      <span class="pill">後端：<span>{{ backendBase }}</span></span>
      <span class="status">{{ status }}</span>
    </header>
    <div class="toolbar">
      <input v-model="q" placeholder="搜尋：word " />
      <button @click="search">搜尋</button>
      <button @click="reload">重新整理</button>
      <button @click="showCreateDialog = true">＋ 新增一筆</button>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:80px">ID</th>
          <th style="width:30%">Word</th>
          <th style="width:40%">Translation</th>
          <th style="width:20%">建立時間</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="5" class="muted">載入中…</td></tr>
        <tr v-for="word in words" :key="word.id">
          <td>{{ word.id }}</td>
          <td>
            <span v-if="editId !== word.id">{{ word.name }}</span>
            <input v-else v-model="editWord.name" />
          </td>
          <td>
            <span v-if="editId !== word.id">{{ word.translation }}</span>
            <input v-else v-model="editWord.translation" />
          </td>
          <td>{{ word.createdAt }}</td>
          <td class="row-actions">
            <button v-if="editId !== word.id" @click="edit(word)">編輯</button>
            <button v-if="editId === word.id" @click="saveEdit">儲存</button>
            <button v-if="editId === word.id" @click="cancelEdit">取消</button>
            <button @click="remove(word.id)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="showCreateDialog" class="dialog">
      <h4>新增單字</h4>
      <input v-model="newWord.name" placeholder="Word" />
      <input v-model="newWord.translation" placeholder="Translation" />
      <button @click="create">新增</button>
      <button @click="showCreateDialog = false">取消</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const BASE = 'http://localhost:8080';
const backendBase = BASE;
const status = ref('—');
const q = ref('');
const words = ref([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const newWord = reactive({ name: '', translation: '' });
const editId = ref(null);
const editWord = reactive({ name: '', translation: '' });

function setStatus(msg) {
  status.value = msg ?? '—';
}

async function fetchWords(query = '') {
  loading.value = true;
  setStatus('載入中…');
  try {
    let url = query.trim()
      ? `${BASE}/api/words/search?name=${encodeURIComponent(query.trim())}`
      : `${BASE}/api/words`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('讀取失敗 ' + res.status);
    words.value = await res.json();
    setStatus('');
  } catch (e) {
    setStatus(e.message);
    words.value = [];
  } finally {
    loading.value = false;
  }
}

function search() {
  fetchWords(q.value);
}
function reload() {
  q.value = '';
  fetchWords();
}
async function create() {
  try {
    const res = await fetch(`${BASE}/api/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWord)
    });
    if (!res.ok) throw new Error('新增失敗 ' + res.status);
    showCreateDialog.value = false;
    newWord.name = '';
    newWord.translation = '';
    fetchWords();
  } catch (e) {
    setStatus(e.message);
  }
}
function edit(word) {
  editId.value = word.id;
  editWord.name = word.name;
  editWord.translation = word.translation;
}
async function saveEdit() {
  try {
    const res = await fetch(`${BASE}/api/words/${editId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editWord)
    });
    if (!res.ok) throw new Error('更新失敗 ' + res.status);
    editId.value = null;
    fetchWords();
  } catch (e) {
    setStatus(e.message);
  }
}
function cancelEdit() {
  editId.value = null;
}
async function remove(id) {
  if (!confirm('確定要刪除？')) return;
  try {
    const res = await fetch(`${BASE}/api/words/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('刪除失敗 ' + res.status);
    fetchWords();
  } catch (e) {
    setStatus(e.message);
  }
}

onMounted(() => {
  fetchWords();
});
</script>

<style scoped>
:root {
  --bg: #0f172a;
  --panel: #1e293b;
  --text: #ffffff;
  --muted: #94a3b8;
  --primary: #3b82f6;
  --primary2: #1d4ed8;
  --danger: #ef4444;
  --border: #334155;
  --radius: 10px;
  --shadow: 0 6px 16px rgba(0, 0, 0, .35);
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff;
    --panel: #f8fafc;
    --text: #1e293b;
    --muted: #475569;
    --primary: #2563eb;
    --primary2: #1e40af;
    --danger: #dc2626;
    --border: #cbd5e1;
    --shadow: 0 4px 10px rgba(15, 23, 42, .08);
  }
}
html, body {
  margin: 0;
  background: var(--bg);
  font: 14px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans TC", Arial, sans-serif;
  color: var(--text);
}
header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
input, button, select {
  font-size: 14px;
  padding: 6px 10px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
}
th {
  background: #f6f6f6;
  text-align: left;
}
.row-actions {
  display: flex;
  gap: 8px;
}
.muted {
  color: #666;
  font-size: 12px;
}
.toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: #f0f0f0;
  font-size: 12px;
}
.status {
  margin-left: auto;
  font-size: 12px;
  color: #666;
}
.dialog {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  margin-top: 16px;
}
</style>

