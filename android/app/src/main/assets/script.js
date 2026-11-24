// ==================== ДАННЫЕ ====================
const LS = {
  ITEMS: 'slw_items',
  PROMOS: 'slw_promos',
  ORDERS: 'slw_orders',
  BANNER: 'slw_banner',
  SETTINGS: 'slw_settings',
  USER: 'shopliveworlds_user'
};

const DEFAULT_ITEMS = [
  { id:'lite', name:'Привилегия ЛАЙТ', price:null, priceLabel:'LITE', color:'blue', type:'privilege',
    list:['Доступ к командам: /rtp, /home, /ah sell, /ah, /kit, /delhome','Ключи кейса: +10','Талисман голема: +1','Сфера киллера: +1','Монеты: +2 000 000','Сет (кит) lite'] },
  { id:'creative', name:'Привилегия Креатив', price:null, priceLabel:'CREATIVE', color:'green', type:'privilege',
    list:['Всё почти как в ЛАЙТ','Талисманы: +2','Сфера: +1','Бонус монет: +100 000','Второй бонус: +100 000','Доступ к режиму креатив','Приват регионов: 4','Точки дома: 3'] },
  { id:'case-coins', name:'Кейс с монетами', price:10, priceLabel:'10 ₽', color:'cyan', type:'case',
    list:['1 ключ = 10 рублей','Внутри — случайное количество монет'] },
  { id:'case-priv', name:'Кейс с привилегиями', price:30, priceLabel:'30 ₽', color:'purple', type:'case',
    list:['1 ключ = 30 рублей','Внутри — случайная привилегия'] },
  { id:'case-donate', name:'Кейс с донатными вещами', price:50, priceLabel:'50 ₽', color:'rainbow', type:'case',
    list:['1 ключ = 50 рублей','Внутри — случайная донатная вещь'] },
  { id:'coins-100k', name:'Игровая валюта 100 000', price:10, priceLabel:'10 ₽', color:'gold', type:'coins', list:['Пакет монет: 100 000','Бонус: +100 000','Итого: 200 000'] },
  { id:'coins-200k', name:'Игровая валюта 200 000', price:20, priceLabel:'20 ₽', color:'gold', type:'coins', list:['Пакет монет: 200 000'] },
  { id:'coins-300k', name:'Игровая валюта 300 000', price:30, priceLabel:'30 ₽', color:'gold', type:'coins', list:['Пакет монет: 300 000'] },
  { id:'coins-400k', name:'Игровая валюта 400 000', price:40, priceLabel:'40 ₽', color:'gold', type:'coins', list:['Пакет монет: 400 000'] },
  { id:'coins-500k', name:'Игровая валюта 500 000', price:50, priceLabel:'50 ₽', color:'gold', type:'coins', list:['Пакет монет: 500 000'] },
  { id:'coins-600k', name:'Игровая валюта 600 000', price:60, priceLabel:'60 ₽', color:'gold', type:'coins', list:['Пакет монет: 600 000'] },
  { id:'coins-700k', name:'Игровая валюта 700 000', price:70, priceLabel:'70 ₽', color:'gold', type:'coins', list:['Пакет монет: 700 000'] },
  { id:'coins-800k', name:'Игровая валюта 800 000', price:80, priceLabel:'80 ₽', color:'gold', type:'coins', list:['Пакет монет: 800 000'] },
  { id:'coins-900k', name:'Игровая валюта 900 000', price:90, priceLabel:'90 ₽', color:'gold', type:'coins', list:['Пакет монет: 900 000'] },
  { id:'coins-100m', name:'Игровая валюта 100 000 000', price:100, priceLabel:'100 ₽', color:'yellow', type:'coins', list:['Пакет монет: 100 000 000','МЕГА-ПАКЕТ 🔥'] }
];

const DEFAULT_SETTINGS = { adminPassword: 'admin123' };

// ==================== ХРАНИЛИЩЕ ====================
function _read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function _write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getItems() {
  const v = _read(LS.ITEMS, null);
  if (!v) { _write(LS.ITEMS, DEFAULT_ITEMS); return DEFAULT_ITEMS; }
  return v;
}
function getPromos() { return _read(LS.PROMOS, []); }
function getBanner() { return _read(LS.BANNER, { text: '', active: false }); }
function getSettings() {
  const v = _read(LS.SETTINGS, null);
  if (!v) { _write(LS.SETTINGS, DEFAULT_SETTINGS); return DEFAULT_SETTINGS; }
  return v;
}
function getUser() { return _read(LS.USER, null); }
function saveOrder(o) {
  const list = _read(LS.ORDERS, []);
  list.push(o);
  _write(LS.ORDERS, list);
}

// ==================== АКЦИИ ====================
function getActiveDiscount(itemId) {
  const promos = getPromos().filter(p => p.active !== false);
  let best = 0;
  const now = Date.now();
  promos.forEach(p => {
    if (p.until && p.until < now) return;
    const applies = p.allItems || (p.itemIds && p.itemIds.includes(itemId));
    if (applies && p.discount > best) best = p.discount;
  });
  return best;
}

// ==================== РЕНДЕР КАТАЛОГА ====================
function renderPrice(item, discount) {
  if (item.price == null) return item.priceLabel || 'по запросу';
  if (discount > 0) {
    const np = Math.round(item.price * (1 - discount / 100));
    return `<span class="old-price">${item.price} ₽</span> <span class="new-price">${np} ₽</span> <span class="discount-badge">-${discount}%</span>`;
  }
  return `${item.price} ₽`;
}

function buildCard(item, discount) {
  const card = document.createElement('article');
  card.className = `card card-${item.color || 'blue'} reveal`;
  card.innerHTML = `
    <div class="card-head">
      <h2>${item.name}</h2>
      <span class="price">${renderPrice(item, discount)}</span>
    </div>
    <ul>${(item.list || []).map(l => `<li>${l}</li>`).join('')}</ul>
    <button class="btn-buy" data-item="${item.name}" data-id="${item.id}">Купить</button>
  `;
  return card;
}

function renderCatalog() {
  const container = document.getElementById('cardsContainer');
  if (!container) return;
  container.innerHTML = '';
  const items = getItems();
  items.forEach(item => {
    const d = getActiveDiscount(item.id);
    container.appendChild(buildCard(item, d));
  });
  // bind buy buttons
  container.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => openOrderModal(btn.dataset.item, btn.dataset.id));
  });
}

function renderBanner() {
  const b = getBanner();
  const el = document.getElementById('promoBanner');
  if (!el) return;
  if (b.active && b.text) {
    el.textContent = b.text;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

// ==================== РЕГИСТРАЦИЯ ====================
(function () {
  const authZone = document.getElementById('authZone');
  const modal = document.getElementById('registerModal');
  if (!authZone || !modal) return;
  const closeBtn = document.getElementById('regClose');
  const form = document.getElementById('registerForm');
  const nickEl = document.getElementById('regNick');
  const emailEl = document.getElementById('regEmail');
  const passEl = document.getElementById('regPassword');
  const errEl = document.getElementById('regError');

  function render() {
    const u = getUser();
    authZone.innerHTML = '';
    if (u) {
      const chip = document.createElement('div');
      chip.className = 'user-chip';
      chip.innerHTML = `<span class="user-avatar">${u.nick.slice(0,2).toUpperCase()}</span><span>${u.nick}</span>`;
      const out = document.createElement('button');
      out.className = 'btn-logout';
      out.textContent = 'Выйти';
      out.addEventListener('click', () => {
        if (confirm('Выйти?')) { localStorage.removeItem(LS.USER); render(); }
      });
      authZone.append(chip, out);
    } else {
      const b = document.createElement('button');
      b.className = 'btn-register';
      b.textContent = 'Зарегистрироваться';
      b.addEventListener('click', openModal);
      authZone.appendChild(b);
    }
  }
  function openModal() {
    form.reset(); errEl.hidden = true;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => nickEl.focus(), 250);
  }
  function closeModal() {
    modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  form.addEventListener('submit', e => {
    e.preventDefault(); errEl.hidden = true;
    const nick = nickEl.value.trim();
    const email = emailEl.value.trim();
    const password = passEl.value;
    if (nick.length < 2) return showErr('Ник — минимум 2 символа');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr('Неверный email');
    if (password.length < 4) return showErr('Пароль — минимум 4 символа');
    _write(LS.USER, { nick, email, createdAt: Date.now() });
    closeModal(); render();
    const orderNick = document.getElementById('fieldNick');
    if (orderNick && !orderNick.value) orderNick.value = nick;
  });
  function showErr(m) { errEl.textContent = m; errEl.hidden = false; }
  render();
})();

// ==================== ФОРМА ЗАКАЗА ====================
let openOrderModal = function () {}; // заполняется ниже

(function () {
  const overlay = document.getElementById('orderModal');
  if (!overlay) return;
  const closeBtn = document.getElementById('modalClose');
  const form = document.getElementById('orderForm');
  const resultBox = document.getElementById('orderResult');
  const orderTextEl = document.getElementById('orderText');
  const tgLink = document.getElementById('sendTelegram');
  const copyBtn = document.getElementById('copyOrder');
  const resetBtn = document.getElementById('resetOrder');
  const fItem = document.getElementById('fieldItem');
  const fNick = document.getElementById('fieldNick');
  const fContact = document.getElementById('fieldContact');
  const fPayment = document.getElementById('fieldPayment');
  const fComment = document.getElementById('fieldComment');
  const TG_USER = 'netuimi67';
  let currentItemName = '';

  openOrderModal = function (itemName, itemId) {
    currentItemName = itemName || '';
    fItem.value = itemName || '';
    const u = getUser();
    if (u && u.nick) fNick.value = u.nick;
    const d = itemId ? getActiveDiscount(itemId) : 0;
    if (d > 0) {
      const it = getItems().find(i => i.id === itemId);
      if (it && it.price != null) {
        const np = Math.round(it.price * (1 - d/100));
        fItem.value = `${itemName} (со скидкой -${d}% → ${np} ₽)`;
      }
    }
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    form.hidden = false; resultBox.hidden = true;
    setTimeout(() => fNick.focus(), 300);
  };
  function closeModal() {
    overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nick = fNick.value.trim();
    const contact = fContact.value.trim();
    const item = fItem.value.trim() || '—';
    const payment = fPayment.value.trim() || 'уточню';
    const comment = fComment.value.trim();
    if (nick.length < 2) { fNick.focus(); fNick.reportValidity(); return; }
    if (!contact) { fContact.focus(); fContact.reportValidity(); return; }

    const text = `🛒 Заказ в ShopLiveworlds\n\n📦 Товар: ${item}\n👤 Ник: ${nick}\n📞 Связь: ${contact}\n💳 Оплата: ${payment}\n` +
      (comment ? `💬 Комментарий: ${comment}\n` : '') + `\n— с сайта ShopLiveworlds`;
    orderTextEl.textContent = text;
    tgLink.href = `https://t.me/${TG_USER}?text=${encodeURIComponent(text)}`;

    // сохраняем заказ для админки
    saveOrder({
      id: Date.now(),
      item, nick, contact, payment, comment,
      createdAt: new Date().toISOString()
    });

    form.hidden = true; resultBox.hidden = false;
    copyBtn.classList.remove('copied'); copyBtn.textContent = '📋 Скопировать';
  });

  copyBtn.addEventListener('click', async () => {
    const t = orderTextEl.textContent;
    try { await navigator.clipboard.writeText(t); }
    catch {
      const ta = document.createElement('textarea'); ta.value = t;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    }
    copyBtn.classList.add('copied'); copyBtn.textContent = '✓ Скопировано';
    setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.textContent = '📋 Скопировать'; }, 2000);
  });
  resetBtn.addEventListener('click', () => {
    form.reset(); fItem.value = ''; form.hidden = false; resultBox.hidden = true;
    setTimeout(() => fNick.focus(), 100);
  });
})();

// ==================== СТАРТ ====================
document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();
  renderBanner();
});
