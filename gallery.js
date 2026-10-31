document.addEventListener('DOMContentLoaded', function () {
  var grid = document.querySelector('.gallery-grid');
  var items = Array.from(document.querySelectorAll('.gallery-item'));
  if (!grid || items.length === 0) return;

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* ---------- Styles ---------- */

  var style = document.createElement('style');
  style.textContent =
    '.gallery-item{cursor:zoom-in}' +
    '.gallery-item:hover img{filter:brightness(1.08)}' +
    '.gallery-item:focus-visible{outline:3px solid #b88a5a;outline-offset:2px}' +
    '.gallery-filters{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin:1rem 0 1.5rem}' +
    '.gallery-filters button{padding:.4rem .9rem;border:1px solid #b88a5a;border-radius:999px;background:#fff;color:#5a3d1e;cursor:pointer;font:inherit}' +
    '.gallery-filters button:hover{background:#f6ead9}' +
    '.gallery-filters button.active{background:#b88a5a;color:#fff}' +
    '.lb{position:fixed;inset:0;z-index:2000;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.92);padding:3.5rem 1rem 1rem}' +
    '.lb.open{display:flex}' +
    '.lb-img{max-width:92vw;max-height:76vh;object-fit:contain;border-radius:6px;opacity:0;transition:opacity .2s ease}' +
    '.lb-img.ready{opacity:1}' +
    '.lb-info{margin-top:.8rem;text-align:center;color:#fff;font-size:.95rem}' +
    '.lb-caption{min-height:1.2em;margin:0 0 .2rem}' +
    '.lb-counter{opacity:.7;font-size:.85rem;margin:0}' +
    '.lb button{position:absolute;border:0;background:rgba(255,255,255,.15);color:#fff;cursor:pointer;line-height:1;border-radius:50%;width:2.8rem;height:2.8rem;font-size:1.8rem}' +
    '.lb button:hover{background:rgba(255,255,255,.3)}' +
    '.lb-close{top:.8rem;right:.8rem}' +
    '.lb-prev{left:.8rem;top:50%;transform:translateY(-50%)}' +
    '.lb-next{right:.8rem;top:50%;transform:translateY(-50%)}';
  document.head.appendChild(style);

  /* ---------- Optional category filters ----------
     Add data-category="Cakes" (etc.) to any <li class="gallery-item">
     and filter buttons appear automatically. Without categories,
     no buttons are shown. */

  var categories = [];
  items.forEach(function (item) {
    var c = item.getAttribute('data-category');
    if (c && categories.indexOf(c) === -1) categories.push(c);
  });

  if (categories.length > 0) {
    var bar = el('div', 'gallery-filters');
    var filterButtons = ['All'].concat(categories).map(function (name) {
      var btn = el('button', name === 'All' ? 'active' : '', name);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        filterButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
        items.forEach(function (item) {
          var match = name === 'All' || item.getAttribute('data-category') === name;
          item.style.display = match ? '' : 'none';
        });
      });
      bar.appendChild(btn);
      return btn;
    });
    grid.parentNode.insertBefore(bar, grid);
  }

  /* ---------- Lightbox ---------- */

  var lb = el('div', 'lb');
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Photo viewer');

  var closeBtn = el('button', 'lb-close', '\u00D7');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');

  var prevBtn = el('button', 'lb-prev', '\u2039');
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Previous photo');

  var nextBtn = el('button', 'lb-next', '\u203A');
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Next photo');

  var lbImg = el('img', 'lb-img');
  var info = el('div', 'lb-info');
  var caption = el('p', 'lb-caption');
  var counter = el('p', 'lb-counter');
  info.appendChild(caption);
  info.appendChild(counter);

  [closeBtn, prevBtn, nextBtn, lbImg, info].forEach(function (n) { lb.appendChild(n); });
  document.body.appendChild(lb);

  var visible = [];
  var current = 0;
  var lastFocus = null;

  function getVisible() {
    return items.filter(function (i) { return i.style.display !== 'none'; });
  }

  function captionFor(item) {
    var img = item.querySelector('img');
    var text = item.getAttribute('data-caption') || (img ? img.alt : '') || '';
    // Skip placeholder alt text like "Gallery photo 3"
    return /^gallery photo \d+$/i.test(text.trim()) ? '' : text;
  }

  function srcOf(item) {
    var img = item.querySelector('img');
    return img ? (img.currentSrc || img.src) : '';
  }

  function show(index) {
    visible = getVisible();
    if (visible.length === 0) return;
    current = (index + visible.length) % visible.length;

    var item = visible[current];
    var thumb = item.querySelector('img');

    lbImg.classList.remove('ready');
    lbImg.onload = function () { lbImg.classList.add('ready'); };
    lbImg.src = srcOf(item);
    lbImg.alt = thumb ? thumb.alt : '';

    caption.textContent = captionFor(item);
    counter.textContent = (current + 1) + ' / ' + visible.length;

    var single = visible.length < 2;
    prevBtn.style.display = single ? 'none' : '';
    nextBtn.style.display = single ? 'none' : '';

    // Preload neighbours so next/previous feels instant
    [current - 1, current + 1].forEach(function (i) {
      var n = visible[(i + visible.length) % visible.length];
      if (n) { var pre = new Image(); pre.src = srcOf(n); }
    });
  }

  function open(item) {
    lastFocus = document.activeElement;
    show(getVisible().indexOf(item));
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  items.forEach(function (item, i) {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', 'Open photo ' + (i + 1) + ' larger');
    item.addEventListener('click', function () { open(item); });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(item);
      }
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function () { show(current - 1); });
  nextBtn.addEventListener('click', function () { show(current + 1); });

  // Click on the dark backdrop closes; clicks on the photo/buttons don't
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target === info) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;

    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Tab') {
      // Keep keyboard focus inside the viewer
      var focusable = [closeBtn, prevBtn, nextBtn].filter(function (b) { return b.style.display !== 'none'; });
      var idx = focusable.indexOf(document.activeElement);
      e.preventDefault();
      if (e.shiftKey) focusable[(idx - 1 + focusable.length) % focusable.length].focus();
      else focusable[(idx + 1) % focusable.length].focus();
    }
  });

  // Swipe left/right on phones
  var startX = null;
  lb.addEventListener('touchstart', function (e) {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) < 50) return;
    show(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });
});
