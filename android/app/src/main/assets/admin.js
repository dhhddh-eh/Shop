const LS = {
  ITEMS: 'slw_items', PROMOS: 'slw_promos', ORDERS: 'slw_orders',
  BANNER: 'slw_banner', SETTINGS: 'slw_settings', AUTH: 'slw_admin_auth'
};
const _r = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
const _w = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function settings() { return _r(LS.SETTINGS, { adminPassword: 'admin123' }); }
function items() { return _r(LS.ITEMS, []); }
function promos() { return _r(LS.PROMOS, []); }
function orders() { return _r(LS.ORDERS, []); }

// ==================== ЛОГИН ====================
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');

function isLogged() { return localStorage.getItem(LS.AUTH) === '1'; }
function showDash() {
  loginScreen.hidden = true;
  dashboard.hidden = false;
  logoutBtn.hidden = false;
  renderItems(); renderPromos(); renderOrders();
  loadBanner(); loadPromoItemsList();
}
function showLogin() {
  loginScreen.hidden = false;
  dashboard.hidden = true;
  logoutBtn.hidden = true;
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  if (loginPassword.value === settings().adminPassword) {
    localStorage.setItem(LS.AUTH, '1');
    loginPassword.value = ''; loginError.hidden = true;
    showDash();
  } else {
    loginError.textContent = 'Неверный пароль'; loginError.hidden = false;
  }
});
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(LS.AUTH);
  showLogin();
});

if (isLogged()) showDash(); else showLogin();

// ==================== ТАБЫ ====================
document.querySelectorAll('.admin-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ==================== ТОВАРЫ ====================
const itemForm = document.getElementById('itemForm');
const itemsTable = document.getElementById('itemsTable');
const itemSubmitBtn = document.getElementById('itemSubmitBtn');
const itemCancelBtn = document.getElementById('itemCancelBtn');

function renderItems() {
  const list = items();
  if (!list.length) { itemsTable.innerHTML = '<p class="hint">Нет товаров</p>'; return; }
  const rows = list.map(it => `
    <tr>
      <td>${it.name}</td>
      <td>${it.type}</td>
      <td>${it.price != null ? it.price + ' ₽' : (it.priceLabel || '—')}</td>
      <td><span class="color-dot color-${it.color}"></span> ${it.color}</td>
      <td>
        <button class="btn-mini edit" data-id="${it.id}">✏️</button>
        <button class="btn-mini del" data-id="${it.id}">🗑</button>
      </td>
    </tr>`).join('');
  itemsTable.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Название</th><th>Тип</th><th>Цена</th><th>Цвет</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  itemsTable.querySelectorAll('.edit').forEach(b => b.addEventListener('click', () => editItem(b.dataset.id)));
  itemsTable.querySelectorAll('.del').forEach(b => b.addEventListener('click', () => deleteItem(b.dataset.id)));
}

function editItem(id) {
  const it = items().find(x => x.id === id);
  if (!it) return;
  document.getElementById('itemEditId').value = id;
  document.getElementById('itemName').value = it.name;
  document.getElementById('itemType').value = it.type || 'other';
  document.getElementById('itemPrice').value = it.price != null ? it.price : '';
  document.getElementById('itemPriceLabel').value = it.priceLabel || '';
  document.getElementById('itemColor').value = it.color || 'blue';
  document.getElementById('itemList').value = (it.list || []).join('\n');
  itemSubmitBtn.textContent = '💾 Сохранить изменения';
  itemCancelBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteItem(id) {
  if (!confirm('Удалить товар?')) return;
  _w(LS.ITEMS, items().filter(i => i.id !== id));
  renderItems();
}

itemCancelBtn.addEventListener('click', resetItemForm);
function resetItemForm() {
  itemForm.reset();
  document.getElementById('itemEditId').value = '';
  itemSubmitBtn.textContent = 'Добавить товар';
  itemCancelBtn.hidden = true;
}

itemForm.addEventListener('submit', e => {
  e.preventDefault();
  const editId = document.getElementById('itemEditId').value;
  const priceVal = document.getElementById('itemPrice').value;
  const data = {
    id: editId || 'item-' + Date.now(),
    name: document.getElementById('itemName').value.trim(),
    type: document.getElementById('itemType').value,
    price: priceVal === '' ? null : Number(priceVal),
    priceLabel: document.getElementById('itemPriceLabel').value.trim(),
    color: document.getElementById('itemColor').value,
    list: document.getElementById('itemList').value.split('\n').map(s => s.trim()).filter(Boolean)
  };
  const list = items();
  if (editId) {
    const i = list.findIndex(x => x.id === editId);
    if (i >= 0) list[i] = data;
  } else {
    list.push(data);
  }
  _w(LS.ITEMS, list);
  resetItemForm();
  renderItems();
});

// ==================== АКЦИИ ====================
const promoForm = document.getElementById('promoForm');
const promosTable = document.getElementById('promosTable');
const promoScope = document.getElementById('promoScope');
const promoItemsBlock = document.getElementById('promoItemsBlock');
const promoItemsList = document.getElementById('promoItemsList');

promoScope.addEventListener('change', () => {
  promoItemsBlock.hidden = promoScope.value !== 'specific';
});

function loadPromoItemsList() {
  promoItemsList.innerHTML = items().map(it => `
    <label class="promo-item-check">
      <input type="checkbox" value="${it.id}" /> ${it.name}
    </label>`).join('');
}

function renderPromos() {
  const list = promos();
  if (!list.length) { promosTable.innerHTML = '<p class="hint">Нет акций</p>'; return; }
  const rows = list.map(p => {
    const expired = p.until && p.until < Date.now();
    const status = expired ? '⌛ истекла' : (p.active === false ? '⏸ выкл' : '✅ активна');
    return `<tr>
      <td>${p.name}</td>
      <td>-${p.discount}%</td>
      <td>${p.allItems ? 'все' : (p.itemIds || []).length + ' шт'}</td>
      <td>${p.until ? new Date(p.until).toLocaleString('ru') : '∞'}</td>
      <td>${status}</td>
      <td>
        <button class="btn-mini toggle" data-id="${p.id}">${p.active === false ? '▶️' : '⏸'}</button>
        <button class="btn-mini del" data-id="${p.id}">🗑</button>
      </td>
    </tr>`;
  }).join('');
  promosTable.innerHTML = `<table class="admin-table">
    <thead><tr><th>Название</th><th>Скидка</th><th>Товары</th><th>До</th><th>Статус</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table>`;

  promosTable.querySelectorAll('.toggle').forEach(b => b.addEventListener('click', () => {
    const list = promos();
    const p = list.find(x => x.id === b.dataset.id);
    if (p) p.active = p.active === false ? true : false;
    _w(LS.PROMOS, list); renderPromos();
  }));
  promosTable.querySelectorAll('.del').forEach(b => b.addEventListener('click', () => {
    if (!confirm('Удалить акцию?')) return;
    _w(LS.PROMOS, promos().filter(x => x.id !== b.dataset.id));
    renderPromos();
  }));
}

promoForm.addEventListener('submit', e => {
  e.preventDefault();
  const scope = promoScope.value;
  const itemIds = scope === 'specific'
    ? [...promoItemsList.querySelectorAll('input:checked')].map(c => c.value)
    : [];
  if (scope === 'specific' && !itemIds.length) {
    alert('Выбери хотя бы один товар'); return;
  }
  const untilStr = document.getElementById('promoUntil').value;
  const promo = {
    id: 'promo-' + Date.now(),
    name: document.getElementById('promoName').value.trim(),
    discount: Number(document.getElementById('promoDiscount').value),
    until: untilStr ? new Date(untilStr).getTime() : null,
    allItems: scope === 'all',
    itemIds,
    active: true
  };
  const list = promos(); list.push(promo); _w(LS.PROMOS, list);
  promoForm.reset(); promoScope.value = 'all'; promoItemsBlock.hidden = true;
  renderPromos();
});

// ==================== ЗАКАЗЫ ====================
const ordersTable = document.getElementById('ordersTable');
function renderOrders() {
  const list = orders().slice().reverse();
  if (!list.length) { ordersTable.innerHTML = '<p class="hint">Заказов пока нет</p>'; return; }
  const rows = list.map(o => `<tr>
    <td>${new Date(o.createdAt).toLocaleString('ru')}</td>
    <td>${o.nick}</td>
    <td>${o.item}</td>
    <td>${o.contact}</td>
    <td>${o.payment || '—'}</td>
    <td>${o.comment || '—'}</td>
  </tr>`).join('');
  ordersTable.innerHTML = `<table class="admin-table">
    <thead><tr><th>Дата</th><th>Ник</th><th>Товар</th><th>Связь</th><th>Оплата</th><th>Комментарий</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}
document.getElementById('exportOrdersBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(orders(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `orders-${Date.now()}.json`; a.click();
});
document.getElementById('clearOrdersBtn').addEventListener('click', () => {
  if (!confirm('Удалить ВСЕ заказы?')) return;
  _w(LS.ORDERS, []); renderOrders();
});

// ==================== БАННЕР ====================
const bannerForm = document.getElementById('bannerForm');
const bannerText = document.getElementById('bannerText');
const bannerActive = document.getElementById('bannerActive');

function loadBanner() {
  const b = _r(LS.BANNER, { text: '', active: false });
  bannerText.value = b.text || '';
  bannerActive.checked = !!b.active;
}
bannerForm.addEventListener('submit', e => {
  e.preventDefault();
  _w(LS.BANNER, { text: bannerText.value.trim(), active: bannerActive.checked });
  alert('Баннер сохранён');
});

// ==================== НАСТРОЙКИ ====================
document.getElementById('passwordForm').addEventListener('submit', e => {
  e.preventDefault();
  const p = document.getElementById('newPassword').value;
  if (p.length < 6) return;
  const s = settings(); s.adminPassword = p; _w(LS.SETTINGS, s);
  document.getElementById('passwordMsg').textContent = '✅ Пароль обновлён';
  document.getElementById('passwordMsg').hidden = false;
  document.getElementById('newPassword').value = '';
});

document.getElementById('exportAllBtn').addEventListener('click', () => {
  const dump = {
    items: items(), promos: promos(), orders: orders(),
    banner: _r(LS.BANNER, null), settings: settings(), exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `shopliveworlds-backup-${Date.now()}.json`; a.click();
});

document.getElementById('importFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (data.items) _w(LS.ITEMS, data.items);
      if (data.promos) _w(LS.PROMOS, data.promos);
      if (data.orders) _w(LS.ORDERS, data.orders);
      if (data.banner) _w(LS.BANNER, data.banner);
      if (data.settings) _w(LS.SETTINGS, data.settings);
      alert('✅ Импорт успешен');
      renderItems(); renderPromos(); renderOrders(); loadBanner();
    } catch { alert('❌ Ошибка: неверный JSON'); }
  };
  r.readAsText(f);
});

document.getElementById('resetAllBtn').addEventListener('click', () => {
  if (!confirm('Сбросить ВСЁ (товары, акции, заказы, пароль)? Это необратимо!')) return;
  [LS.ITEMS, LS.PROMOS, LS.ORDERS, LS.BANNER, LS.SETTINGS, LS.AUTH].forEach(k => localStorage.removeItem(k));
  location.reload();
});
