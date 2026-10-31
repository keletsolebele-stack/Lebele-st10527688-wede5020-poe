document.addEventListener('DOMContentLoaded', function () {
  var main = document.querySelector('main');
  var sections = Array.from(document.querySelectorAll('.menu-section'));
  if (!main || sections.length === 0) return;

  var CURRENCY = 'R';
  var CART_KEY = 'bakeryCart';
  var ORDERS_KEY = 'bakeryOrders';

  /* ---------- Helpers ---------- */

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (kid) { e.appendChild(kid); });
    return e;
  }

  function money(n) {
    return CURRENCY + (n % 1 === 0 ? n : n.toFixed(2));
  }

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  /* ---------- Styles ---------- */

  var style = document.createElement('style');
  style.textContent =
    '.menu-toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:center;margin:1rem auto 1.5rem;padding:0 1rem}' +
    '.menu-toolbar button{padding:.4rem .9rem;border:1px solid #b88a5a;border-radius:999px;background:#fff;color:#5a3d1e;cursor:pointer;font:inherit}' +
    '.menu-toolbar button:hover{background:#f6ead9}' +
    '.menu-toolbar button.active{background:#b88a5a;color:#fff}' +
    '.menu-toolbar input{padding:.45rem .9rem;border:1px solid #b88a5a;border-radius:999px;font:inherit;min-width:200px}' +
    '.no-results{text-align:center;padding:2rem;color:#777}' +
    '.add-btn{display:block;margin:.5rem auto 0;padding:.4rem .9rem;border:0;border-radius:6px;background:#b88a5a;color:#fff;cursor:pointer;font:inherit}' +
    '.add-btn:hover{background:#9c7248}' +
    '.add-btn.added{background:#4d8a4d}' +
    '.cart-fab{position:fixed;right:1rem;bottom:1rem;z-index:1000;padding:.7rem 1.1rem;border:0;border-radius:999px;background:#5a3d1e;color:#fff;font:inherit;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
    '.cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1001;display:none}' +
    '.cart-overlay.open{display:block}' +
    '.cart-panel{position:fixed;top:0;right:0;bottom:0;width:min(400px,100%);background:#fff;color:#222;z-index:1002;display:none;flex-direction:column;box-shadow:-2px 0 12px rgba(0,0,0,.25)}' +
    '.cart-panel.open{display:flex}' +
    '.cart-head{display:flex;justify-content:space-between;align-items:center;padding:1rem;border-bottom:1px solid #eee}' +
    '.cart-head h2{margin:0;font-size:1.2rem}' +
    '.cart-close{border:0;background:none;font-size:1.5rem;cursor:pointer;line-height:1}' +
    '.cart-body{flex:1;overflow-y:auto;padding:1rem}' +
    '.cart-foot{padding:1rem;border-top:1px solid #eee}' +
    '.cart-row{display:grid;grid-template-columns:1fr auto;gap:.25rem .75rem;padding:.6rem 0;border-bottom:1px solid #f0f0f0}' +
    '.cart-row .name{font-weight:bold}' +
    '.cart-row .each{color:#777;font-size:.85rem}' +
    '.qty{display:flex;align-items:center;gap:.4rem}' +
    '.qty button{width:1.8rem;height:1.8rem;border:1px solid #b88a5a;border-radius:50%;background:#fff;cursor:pointer;font:inherit}' +
    '.cart-total{display:flex;justify-content:space-between;font-weight:bold;font-size:1.1rem;margin-bottom:.75rem}' +
    '.cart-actions{display:flex;gap:.5rem}' +
    '.cart-actions button,.cart-form button{flex:1;padding:.65rem;border:0;border-radius:6px;font:inherit;cursor:pointer}' +
    '.btn-primary{background:#b88a5a;color:#fff}' +
    '.btn-secondary{background:#eee;color:#333}' +
    '.link-btn{border:0;background:none;color:#a33;cursor:pointer;font:inherit;font-size:.85rem;padding:0}' +
    '.cart-form label{display:block;margin:.6rem 0 .2rem;font-size:.9rem}' +
    '.cart-form input,.cart-form textarea{width:100%;box-sizing:border-box;padding:.5rem;border:1px solid #ccc;border-radius:6px;font:inherit}' +
    '.summary-line{display:flex;justify-content:space-between;padding:.2rem 0}';
  document.head.appendChild(style);

  /* ---------- Filter + search toolbar ---------- */

  var activeCategory = 'All';
  var query = '';

  var toolbar = el('div', { class: 'menu-toolbar' });
  var search = el('input', { type: 'search', placeholder: 'Search the menu...', 'aria-label': 'Search the menu' });
  toolbar.appendChild(search);

  var categories = ['All'].concat(sections.map(function (s) {
    return s.querySelector('h2').textContent.trim();
  }));

  var buttons = categories.map(function (name) {
    var btn = el('button', { type: 'button', text: name });
    if (name === 'All') btn.classList.add('active');
    btn.addEventListener('click', function () {
      activeCategory = name;
      buttons.forEach(function (b) { b.classList.toggle('active', b === btn); });
      applyFilters();
    });
    toolbar.appendChild(btn);
    return btn;
  });

  var noResults = el('p', { class: 'no-results', text: 'No items match your search.' });
  noResults.style.display = 'none';

  main.insertBefore(toolbar, main.firstChild);
  main.appendChild(noResults);

  search.addEventListener('input', function () {
    query = search.value.trim().toLowerCase();
    applyFilters();
  });

  function applyFilters() {
    var anyVisible = false;
    sections.forEach(function (section) {
      var title = section.querySelector('h2').textContent.trim();
      var categoryMatch = activeCategory === 'All' || activeCategory === title;
      var visibleCount = 0;

      section.querySelectorAll('.menu-item').forEach(function (item) {
        var info = itemInfo(item);
        var text = (info.name + ' ' + info.priceText + ' ' + title).toLowerCase();
        var show = categoryMatch && (query === '' || text.indexOf(query) !== -1);
        item.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      section.style.display = visibleCount > 0 ? '' : 'none';
      if (visibleCount > 0) anyVisible = true;
    });
    noResults.style.display = anyVisible ? 'none' : '';
  }

  /* ---------- Reading item data from the page ---------- */

  function itemInfo(item) {
    var nameEl = item.querySelector('span:not(.price)');
    var priceEl = item.querySelector('.price');
    var imgEl = item.querySelector('img');
    var priceText = priceEl ? priceEl.textContent.trim() : '';
    return {
      name: nameEl ? nameEl.textContent.trim() : 'Item',
      priceText: priceText,
      price: parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0,
      img: imgEl ? imgEl.getAttribute('src') : ''
    };
  }

  /* ---------- Cart state ---------- */

  var cart = load(CART_KEY, {}); // { name: { name, price, qty } }

  function cartCount() {
    return Object.keys(cart).reduce(function (n, k) { return n + cart[k].qty; }, 0);
  }

  function cartTotal() {
    return Object.keys(cart).reduce(function (t, k) { return t + cart[k].price * cart[k].qty; }, 0);
  }

  function changeQty(name, delta) {
    if (!cart[name]) return;
    cart[name].qty += delta;
    if (cart[name].qty <= 0) delete cart[name];
    persist();
  }

  function persist() {
    save(CART_KEY, cart);
    updateFab();
    render();
  }

  /* ---------- Add-to-cart buttons on every item ---------- */

  document.querySelectorAll('.menu-item').forEach(function (item) {
    var info = itemInfo(item);
    var btn = el('button', { type: 'button', class: 'add-btn', text: 'Add to cart' });
    btn.addEventListener('click', function () {
      if (cart[info.name]) cart[info.name].qty += 1;
      else cart[info.name] = { name: info.name, price: info.price, qty: 1, img: info.img };
      persist();
      btn.textContent = 'Added \u2713';
      btn.classList.add('added');
      setTimeout(function () {
        btn.textContent = 'Add to cart';
        btn.classList.remove('added');
      }, 800);
    });
    item.appendChild(btn);
  });

  /* ---------- Cart drawer ---------- */

  var fab = el('button', { type: 'button', class: 'cart-fab', 'aria-label': 'Open cart' });
  var overlay = el('div', { class: 'cart-overlay' });
  var panel = el('aside', { class: 'cart-panel', role: 'dialog', 'aria-label': 'Shopping cart' });
  document.body.appendChild(fab);
  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  var view = 'cart'; // 'cart' | 'checkout' | 'done'
  var lastOrder = null;

  function updateFab() {
    fab.textContent = '\uD83D\uDED2 Cart (' + cartCount() + ')';
  }

  function openCart() {
    if (view === 'done') view = 'cart';
    render();
    overlay.classList.add('open');
    panel.classList.add('open');
  }

  function closeCart() {
    overlay.classList.remove('open');
    panel.classList.remove('open');
  }

  fab.addEventListener('click', openCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCart();
  });

  function panelShell(title, bodyKids, footKids) {
    panel.innerHTML = '';
    panel.appendChild(el('div', { class: 'cart-head' }, [
      el('h2', { text: title }),
      el('button', { type: 'button', class: 'cart-close', 'aria-label': 'Close cart', text: '\u00D7', onclick: closeCart })
    ]));
    panel.appendChild(el('div', { class: 'cart-body' }, bodyKids));
    if (footKids) panel.appendChild(el('div', { class: 'cart-foot' }, footKids));
  }

  function render() {
    if (view === 'checkout') return renderCheckout();
    if (view === 'done') return renderDone();
    renderCart();
  }

  function renderCart() {
    var names = Object.keys(cart);

    if (names.length === 0) {
      panelShell('Your cart', [el('p', { text: 'Your cart is empty. Add something tasty!' })]);
      return;
    }

    var rows = names.map(function (name) {
      var line = cart[name];
      return el('div', { class: 'cart-row' }, [
        el('div', {}, [
          el('div', { class: 'name', text: line.name }),
          el('div', { class: 'each', text: money(line.price) + ' each' })
        ]),
        el('div', { class: 'name', text: money(line.price * line.qty) }),
        el('div', { class: 'qty' }, [
          el('button', { type: 'button', 'aria-label': 'Remove one ' + line.name, text: '\u2212', onclick: function () { changeQty(name, -1); } }),
          el('span', { text: String(line.qty) }),
          el('button', { type: 'button', 'aria-label': 'Add one ' + line.name, text: '+', onclick: function () { changeQty(name, 1); } })
        ]),
        el('button', { type: 'button', class: 'link-btn', text: 'Remove', onclick: function () { changeQty(name, -line.qty); } })
      ]);
    });

    panelShell('Your cart', rows, [
      el('div', { class: 'cart-total' }, [
        el('span', { text: 'Total' }),
        el('span', { text: money(cartTotal()) })
      ]),
      el('div', { class: 'cart-actions' }, [
        el('button', { type: 'button', class: 'btn-secondary', text: 'Clear', onclick: function () { cart = {}; persist(); } }),
        el('button', { type: 'button', class: 'btn-primary', text: 'Checkout', onclick: function () { view = 'checkout'; render(); } })
      ]),
      el('a', { href: 'cart.html', text: 'View full cart page', style: 'display:block;text-align:center;margin-top:.7rem;color:#7a3b2e' })
    ]);
  }

  function renderCheckout() {
    var nameInput = el('input', { type: 'text', id: 'co-name', required: 'required', autocomplete: 'name' });
    var phoneInput = el('input', { type: 'tel', id: 'co-phone', required: 'required', autocomplete: 'tel' });
    var notesInput = el('textarea', { id: 'co-notes', rows: '3', placeholder: 'Allergies, pickup time, etc.' });

    var form = el('form', { class: 'cart-form' }, [
      el('label', { for: 'co-name', text: 'Your name' }), nameInput,
      el('label', { for: 'co-phone', text: 'Phone number' }), phoneInput,
      el('label', { for: 'co-notes', text: 'Notes (optional)' }), notesInput,
      el('div', { class: 'cart-total', style: 'margin-top:1rem' }, [
        el('span', { text: 'Total to pay' }),
        el('span', { text: money(cartTotal()) })
      ]),
      el('div', { class: 'cart-actions' }, [
        el('button', { type: 'button', class: 'btn-secondary', text: 'Back', onclick: function () { view = 'cart'; render(); } }),
        el('button', { type: 'submit', class: 'btn-primary', text: 'Place order' })
      ])
    ]);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var order = {
        id: 'BK' + Date.now().toString().slice(-6),
        customer: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        notes: notesInput.value.trim(),
        items: Object.keys(cart).map(function (k) { return cart[k]; }),
        total: cartTotal(),
        placedAt: new Date().toISOString()
      };
      placeOrder(order);
      lastOrder = order;
      cart = {};
      save(CART_KEY, cart);
      updateFab();
      view = 'done';
      render();
    });

    panelShell('Checkout', [form]);
  }

  function renderDone() {
    var o = lastOrder;
    var lines = o.items.map(function (i) {
      return el('div', { class: 'summary-line' }, [
        el('span', { text: i.qty + ' \u00D7 ' + i.name }),
        el('span', { text: money(i.price * i.qty) })
      ]);
    });

    panelShell('Order placed!', [
      el('p', { text: 'Thank you, ' + o.customer + '! Your order number is ' + o.id + '.' })
    ].concat(lines, [
      el('div', { class: 'cart-total', style: 'margin-top:1rem' }, [
        el('span', { text: 'Total' }),
        el('span', { text: money(o.total) })
      ])
    ]), [
      el('button', { type: 'button', class: 'btn-primary', style: 'width:100%;padding:.65rem;border:0;border-radius:6px;font:inherit;cursor:pointer', text: 'Close', onclick: function () { view = 'cart'; closeCart(); } })
    ]);
  }

  /* ---------- Where the order goes ----------
     Right now the order is only saved in this browser (localStorage) so you
     can test the flow. To take real orders and payments, replace the body of
     this function with a call to your server or a payment provider, e.g.:

       fetch('/api/orders', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(order)
       });
  ---------------------------------------------- */
  function placeOrder(order) {
    var orders = load(ORDERS_KEY, []);
    orders.push(order);
    save(ORDERS_KEY, orders);
    console.log('Order placed:', order);
  }

  updateFab();
  render();
});
