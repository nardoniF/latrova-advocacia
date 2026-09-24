/**
 * Carrega e aplica o conteúdo do site a partir de data/content.json
 * (ou da versão salva no admin via localStorage).
 */
const CONTENT_STORAGE_KEY = 'latrova_site_content';
const CONTENT_FILE = 'data/content.json';

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyTextContent(content) {
  document.querySelectorAll('[data-content]').forEach((el) => {
    const value = getByPath(content, el.getAttribute('data-content'));
    if (value != null) el.textContent = value;
  });

  document.querySelectorAll('[data-content-html]').forEach((el) => {
    const value = getByPath(content, el.getAttribute('data-content-html'));
    if (value != null) el.innerHTML = value;
  });

  document.querySelectorAll('[data-content-multiline]').forEach((el) => {
    const value = getByPath(content, el.getAttribute('data-content-multiline'));
    if (value != null) {
      el.innerHTML = escapeHtml(value).replace(/\n/g, '<br>');
    }
  });
}

function applyMeta(content) {
  if (content.meta && content.meta.title) {
    document.title = content.meta.title;
  }
}

function applyHeroBackground(content) {
  const hero = document.getElementById('hero');
  if (!hero || !content.hero || !content.hero.backgroundImage) return;
  const img = String(content.hero.backgroundImage).replace(/'/g, '%27');
  hero.style.background =
    `linear-gradient(rgba(12,20,38,0.85), rgba(12,20,38,0.85)), url('${img}') center/cover`;
}

function applyWhatsappLinks(content) {
  const number = content.whatsapp && content.whatsapp.number;
  if (!number) return;
  const url = `https://wa.me/${number.replace(/\D/g, '')}`;
  document.querySelectorAll('[data-whatsapp-link]').forEach((el) => {
    el.setAttribute('href', url);
  });
}

function applyAreas(content) {
  const grid = document.getElementById('areas-grid');
  if (!grid || !content.areas || !Array.isArray(content.areas.items)) return;

  grid.innerHTML = content.areas.items
    .map(
      (item) => `
      <div class="card reveal">
        <h3>${escapeHtml(item.title || '')}</h3>
        <p>${escapeHtml(item.description || '')}</p>
      </div>`
    )
    .join('');
}

function applyContactForm(content) {
  const contact = content.contact;
  if (!contact) return;

  const form = document.getElementById('contact-form');
  if (form && contact.formEmail) {
    form.action = `https://formsubmit.co/${contact.formEmail}`;
  }

  const cc = document.getElementById('form-cc');
  if (cc && contact.formCc != null) cc.value = contact.formCc;

  const name = document.getElementById('form-name');
  if (name && contact.formNamePlaceholder) name.placeholder = contact.formNamePlaceholder;

  const email = document.getElementById('form-email');
  if (email && contact.formEmailPlaceholder) email.placeholder = contact.formEmailPlaceholder;

  const message = document.getElementById('form-message');
  if (message && contact.formMessagePlaceholder) {
    message.placeholder = contact.formMessagePlaceholder;
  }
}

function applySiteContent(content) {
  if (!content) return;
  applyMeta(content);
  applyHeroBackground(content);
  applyTextContent(content);
  applyWhatsappLinks(content);
  applyAreas(content);
  applyContactForm(content);
  window.dispatchEvent(new CustomEvent('content:applied'));
}

async function loadSiteContent() {
  let content = null;

  try {
    const stored = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (stored) content = JSON.parse(stored);
  } catch (e) {
    console.warn('Conteúdo local inválido, usando arquivo.', e);
  }

  if (!content) {
    const response = await fetch(CONTENT_FILE, { cache: 'no-store' });
    if (!response.ok) throw new Error('Não foi possível carregar o conteúdo.');
    content = await response.json();
  }

  applySiteContent(content);
  return content;
}

window.LatrovaContent = {
  STORAGE_KEY: CONTENT_STORAGE_KEY,
  CONTENT_FILE,
  loadSiteContent,
  applySiteContent,
  getByPath,
};
