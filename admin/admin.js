const SESSION_KEY = 'latrova_admin_session';
const CONTENT_STORAGE_KEY = 'latrova_site_content';
const CONTENT_URL = '../data/content.json';

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const contentForm = document.getElementById('content-form');
const areasEditor = document.getElementById('areas-editor');
const saveStatus = document.getElementById('save-status');

let currentContent = null;

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function setLoggedIn(value) {
  if (value) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
}

function showAdmin(show) {
  loginView.hidden = show;
  adminView.hidden = !show;
}

function setByPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {};
    cur = cur[key];
  }
  cur[keys[keys.length - 1]] = value;
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

async function fetchDefaultContent() {
  const res = await fetch(CONTENT_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar content.json');
  return res.json();
}

function loadStoredContent() {
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fillForm(content) {
  contentForm.querySelectorAll('[name]').forEach((field) => {
    if (field.name.startsWith('areas.items')) return;
    const value = getByPath(content, field.name);
    if (value != null) field.value = value;
    else field.value = '';
  });
  renderAreas(content.areas && content.areas.items ? content.areas.items : []);
}

function renderAreas(items) {
  areasEditor.innerHTML = '';
  items.forEach((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'area-item';
    wrap.dataset.index = String(index);
    wrap.innerHTML = `
      <div class="area-item-head">
        <span>Área ${index + 1}</span>
        <button type="button" class="btn-remove" data-remove="${index}">Remover</button>
      </div>
      <label>Título
        <input type="text" data-area-field="title" value="${escapeAttr(item.title || '')}">
      </label>
      <label>Descrição
        <textarea rows="2" data-area-field="description">${escapeText(item.description || '')}</textarea>
      </label>
    `;
    areasEditor.appendChild(wrap);
  });
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readAreasFromEditor() {
  return Array.from(areasEditor.querySelectorAll('.area-item')).map((item) => ({
    title: item.querySelector('[data-area-field="title"]').value.trim(),
    description: item.querySelector('[data-area-field="description"]').value.trim(),
  }));
}

function collectFormContent() {
  const content = structuredClone(currentContent || {});
  contentForm.querySelectorAll('[name]').forEach((field) => {
    setByPath(content, field.name, field.value);
  });
  if (!content.areas) content.areas = {};
  content.areas.items = readAreasFromEditor();
  return content;
}

function setStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.classList.toggle('error', isError);
}

function downloadContent(content) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'content.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function initContent() {
  const stored = loadStoredContent();
  currentContent = stored || (await fetchDefaultContent());
  fillForm(currentContent);
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const hash = await sha256(pass);
  const config = window.ADMIN_CONFIG || {};

  if (user === config.user && hash === config.passwordHash) {
    setLoggedIn(true);
    showAdmin(true);
    await initContent();
  } else {
    loginError.hidden = false;
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  setLoggedIn(false);
  showAdmin(false);
  loginForm.reset();
  setStatus('');
});

document.getElementById('btn-add-area').addEventListener('click', () => {
  const items = readAreasFromEditor();
  items.push({ title: 'Nova área', description: '' });
  renderAreas(items);
});

areasEditor.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove]');
  if (!btn) return;
  const index = Number(btn.getAttribute('data-remove'));
  const items = readAreasFromEditor().filter((_, i) => i !== index);
  renderAreas(items);
});

contentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  try {
    const content = collectFormContent();
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    currentContent = content;
    setStatus('Alterações salvas. Abra o site neste navegador para conferir.');
  } catch (err) {
    console.error(err);
    setStatus('Erro ao salvar. Tente novamente.', true);
  }
});

document.getElementById('btn-download').addEventListener('click', () => {
  const content = collectFormContent();
  downloadContent(content);
  setStatus('Arquivo content.json baixado. Substitua data/content.json no projeto para publicar.');
});

document.getElementById('btn-reset').addEventListener('click', async () => {
  if (!confirm('Restaurar o conteúdo padrão do arquivo data/content.json? As alterações locais serão apagadas.')) {
    return;
  }
  localStorage.removeItem(CONTENT_STORAGE_KEY);
  currentContent = await fetchDefaultContent();
  fillForm(currentContent);
  setStatus('Conteúdo padrão restaurado.');
});

(async function boot() {
  if (isLoggedIn()) {
    showAdmin(true);
    try {
      await initContent();
    } catch (err) {
      console.error(err);
      setStatus('Não foi possível carregar o conteúdo.', true);
    }
  } else {
    showAdmin(false);
  }
})();
