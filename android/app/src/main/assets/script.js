// ==================== AUTH (регистрация) ====================
(function () {
  const STORAGE_KEY = 'shopliveworlds_user';

  const authZone     = document.getElementById('authZone');
  const regModal     = document.getElementById('registerModal');
  const regClose     = document.getElementById('regClose');
  const regForm      = document.getElementById('registerForm');
  const regNick      = document.getElementById('regNick');
  const regEmail     = document.getElementById('regEmail');
  const regPassword  = document.getElementById('regPassword');
  const regError     = document.getElementById('regError');

  if (!authZone || !regModal) return; // страховка

  // ---- helpers ----
  function getUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }
  function setUser(user) { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); }
  function clearUser() { localStorage.removeItem(STORAGE_KEY); }

  function initials(nick) {
    return nick.trim().slice(0, 2).toUpperCase();
  }

  // ---- рендер верхней панели ----
  function renderAuth() {
    const user = getUser();
    authZone.innerHTML = '';

    if (user) {
      // зарегистрирован: чип с ником + выйти
      const chip = document.createElement('div');
      chip.className = 'user-chip';
      chip.innerHTML = `
        <span class="user-avatar">${initials(user.nick)}</span>
        <span class="user-name">${user.nick}</span>
      `;

      const logout = document.createElement('button');
      logout.className = 'btn-logout';
      logout.textContent = 'Выйти';
      logout.addEventListener('click', () => {
        if (confirm(`Выйти из аккаунта «${user.nick}»?`)) {
          clearUser();
          renderAuth();
        }
      });

      authZone.appendChild(chip);
      authZone.appendChild(logout);
    } else {
      // не зарегистрирован: кнопка
      const btn = document.createElement('button');
      btn.className = 'btn-register';
      btn.textContent = 'Зарегистрироваться';
      btn.addEventListener('click', openRegModal);
      authZone.appendChild(btn);
    }
  }

  // ---- модалка ----
  function openRegModal() {
    regForm.reset();
    regError.hidden = true;
    regModal.classList.add('open');
    regModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => regNick.focus(), 250);
  }
  function closeRegModal() {
    regModal.classList.remove('open');
    regModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  regClose.addEventListener('click', closeRegModal);
  regModal.addEventListener('click', (e) => {
    if (e.target === regModal) closeRegModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && regModal.classList.contains('open')) closeRegModal();
  });

  // ---- отправка формы ----
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    regError.hidden = true;

    const nick     = regNick.value.trim();
    const email    = regEmail.value.trim();
    const password = regPassword.value;

    if (nick.length < 2) {
      showError('Ник — минимум 2 символа.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Введи корректный email.');
      return;
    }
    if (password.length < 4) {
      showError('Пароль — минимум 4 символа.');
      return;
    }

    // в localStorage храним только базовое (это клиентская регистрация)
    setUser({
      nick,
      email,
      createdAt: Date.now()
    });

    closeRegModal();
    renderAuth();

    // если открыта форма заказа — подставить ник
    const orderNick = document.getElementById('fieldNick');
    if (orderNick && !orderNick.value) orderNick.value = nick;
  });

  function showError(msg) {
    regError.textContent = msg;
    regError.hidden = false;
  }

  // ---- старт ----
  renderAuth();
})();


// ==================== Модалка заказа (как раньше) ====================
(function () {
  const overlay = document.getElementById('orderModal');
  if (!overlay) return;

  const closeBtn    = document.getElementById('modalClose');
  const form        = document.getElementById('orderForm');
  const resultBox   = document.getElementById('orderResult');
  const orderTextEl = document.getElementById('orderText');
  const tgLink      = document.getElementById('sendTelegram');
  const copyBtn     = document.getElementById('copyOrder');
  const resetBtn    = document.getElementById('resetOrder');

  const fieldItem    = document.getElementById('fieldItem');
  const fieldNick    = document.getElementById('fieldNick');
  const fieldContact = document.getElementById('fieldContact');
  const fieldPayment = document.getElementById('fieldPayment');
  const fieldComment = document.getElementById('fieldComment');

  const TG_USER = 'netuimi67';

  function openModal(itemName) {
    fieldItem.value = itemName || '';

    // подставить ник зарегистрированного пользователя
    try {
      const user = JSON.parse(localStorage.getItem('shopliveworlds_user') || 'null');
      if (user && user.nick) fieldNick.value = user.nick;
    } catch {}

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    form.hidden = false;
    resultBox.hidden = true;
    setTimeout(() => fieldNick && fieldNick.focus(), 300);
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.btn-buy').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.item || ''));
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nick    = fieldNick.value.trim();
    const contact = fieldContact.value.trim();
    const item    = fieldItem.value.trim() || '—';
    const payment = fieldPayment.value.trim() || 'уточню';
    const comment = fieldComment.value.trim();

    if (nick.length < 2) { fieldNick.focus(); fieldNick.reportValidity(); return; }
    if (!contact)        { fieldContact.focus(); fieldContact.reportValidity(); return; }

    const text =
      `🛒 Заказ в ShopLiveworlds\n\n` +
      `📦 Товар: ${item}\n` +
      `👤 Ник в игре: ${nick}\n` +
      `📞 Связь: ${contact}\n` +
      `💳 Оплата: ${payment}\n` +
      (comment ? `💬 Комментарий: ${comment}\n` : '') +
      `\n— отправлено с сайта ShopLiveworlds`;

    orderTextEl.textContent = text;
    tgLink.href = `https://t.me/${TG_USER}?text=${encodeURIComponent(text)}`;

    form.hidden = true;
    resultBox.hidden = false;
    copyBtn.classList.remove('copied');
    copyBtn.textContent = '📋 Скопировать';
  });

  copyBtn.addEventListener('click', async () => {
    const text = orderTextEl.textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    copyBtn.classList.add('copied');
    copyBtn.textContent = '✓ Скопировано';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.textContent = '📋 Скопировать';
    }, 2000);
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    fieldItem.value = '';
    form.hidden = false;
    resultBox.hidden = true;
    setTimeout(() => fieldNick.focus(), 100);
  });
})();
