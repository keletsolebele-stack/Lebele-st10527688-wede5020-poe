document.addEventListener('DOMContentLoaded', function () {

  /* ============ EDIT THESE ============ */
  var WHATSAPP_NUMBER = '27685442421';      // international format, digits only (no + or spaces)
  var EMAIL_ADDRESS   = 'hello@AURAbakery.com';
  var TIMEZONE        = 'Africa/Johannesburg'; // the bakery's timezone, so the badge is right for every visitor

  // Opening hours by day (0 = Sunday ... 6 = Saturday). Use null for closed.
  var HOURS = {
    0: null,
    1: { open: '07:00', close: '17:00' },
    2: { open: '07:00', close: '17:00' },
    3: { open: '07:00', close: '17:00' },
    4: { open: '07:00', close: '17:00' },
    5: { open: '07:00', close: '17:00' },
    6: { open: '08:00', close: '14:00' }
  };
  /* ==================================== */

  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAY_KEYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  // Turn "07:00" into minutes after midnight
  Object.keys(HOURS).forEach(function (d) {
    if (!HOURS[d]) return;
    HOURS[d] = { open: toMinutes(HOURS[d].open), close: toMinutes(HOURS[d].close) };
  });

  function toMinutes(str) {
    var p = str.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function fmt(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var suffix = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? ':' + (m < 10 ? '0' + m : m) : '') + suffix;
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* ---------- Styles ---------- */

  var style = document.createElement('style');
  style.textContent =
    '.open-badge{display:inline-flex;align-items:center;gap:.5rem;margin-top:.75rem;padding:.35rem .9rem;border-radius:999px;font-size:.95rem;background:#eee;color:#444}' +
    '.open-badge::before{content:"";width:.6rem;height:.6rem;border-radius:50%;background:#999}' +
    '.open-badge.is-open{background:#e3f4e3;color:#2d6a2d}' +
    '.open-badge.is-open::before{background:#3c9a3c}' +
    '.open-badge.is-closed{background:#fbe6e3;color:#8a3025}' +
    '.open-badge.is-closed::before{background:#c0483a}' +
    '.hours{max-width:560px;margin:.75rem auto;padding:0 1rem}' +
    '.hours h2{text-align:center;margin:0 0 .4rem;font-size:1.2rem}' +
    '.hours ul{list-style:none;margin:0;padding:0;columns:2;column-gap:1.5rem}' +
    '.hours li{display:flex;justify-content:space-between;padding:.15rem .6rem;font-size:.9rem;border-radius:6px;break-inside:avoid}' +
    '.hours li.today{background:#f6ead9;font-weight:bold}' +
    '.field-error{display:block;min-height:0;margin:.15rem 0 .3rem;color:#b23a2e;font-size:.85rem}' +
    'input.invalid,textarea.invalid{border-color:#b23a2e !important}' +
    'input.valid,textarea.valid{border-color:#3c9a3c !important}' +
    '.form-actions{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:.5rem}' +
    '.wa-btn{background:#25a244 !important;color:#fff !important}' +
    '.form-status{margin-top:.8rem;font-size:.95rem}' +
    '.form-status.ok{color:#2d6a2d}' +
    'header{padding:1rem 1rem .5rem}' +
    'header h1{font-size:2rem;margin:0}' +
    'header .subtitle{margin:.25rem 0 0}' +
    '.contact-form .form-img img{max-height:260px;width:100%;object-fit:cover}';
  document.head.appendChild(style);

  /* ---------- Open / closed indicator ---------- */

  function nowInBakery() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    var out = {};
    parts.forEach(function (p) { out[p.type] = p.value; });
    return {
      day: DAY_KEYS[out.weekday],
      mins: (parseInt(out.hour, 10) % 24) * 60 + parseInt(out.minute, 10)
    };
  }

  function getStatus() {
    var now = nowInBakery();
    var today = HOURS[now.day];

    if (today && now.mins >= today.open && now.mins < today.close) {
      return { open: true, text: 'Open now \u00B7 closes at ' + fmt(today.close) };
    }
    if (today && now.mins < today.open) {
      return { open: false, text: 'Closed \u00B7 opens today at ' + fmt(today.open) };
    }
    for (var i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7;
      if (HOURS[d]) {
        var when = i === 1 ? 'tomorrow' : DAY_NAMES[d];
        return { open: false, text: 'Closed \u00B7 opens ' + when + ' at ' + fmt(HOURS[d].open) };
      }
    }
    return { open: false, text: 'Closed' };
  }

  var badge = el('p', 'open-badge');
  var subtitle = document.querySelector('header .subtitle');
  if (subtitle) {
    subtitle.insertAdjacentElement('afterend', badge);
  } else if (document.querySelector('header')) {
    document.querySelector('header').appendChild(badge);
  }

  var hoursBox = document.getElementById('hours');

  function renderHours(todayIndex) {
    if (!hoursBox) return;
    hoursBox.innerHTML = '';
    hoursBox.appendChild(el('h2', '', 'Opening hours'));
    var ul = el('ul');
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      var li = el('li', d === todayIndex ? 'today' : '');
      li.appendChild(el('span', '', DAY_NAMES[d]));
      li.appendChild(el('span', '', HOURS[d] ? fmt(HOURS[d].open) + ' \u2013 ' + fmt(HOURS[d].close) : 'Closed'));
      ul.appendChild(li);
    });
    hoursBox.appendChild(ul);
  }

  function refreshStatus() {
    var s = getStatus();
    badge.textContent = s.text;
    badge.classList.toggle('is-open', s.open);
    badge.classList.toggle('is-closed', !s.open);
    renderHours(nowInBakery().day);
  }

  refreshStatus();
  setInterval(refreshStatus, 60000);

  /* ---------- Live form validation ---------- */

  var form = document.querySelector('form.content');
  if (!form) return;

  var fields = {
    name: {
      input: document.getElementById('name'),
      check: function (v) {
        if (v.trim().length === 0) return 'Please tell us your name.';
        if (v.trim().length < 2) return 'That name looks too short.';
        return '';
      }
    },
    email: {
      input: document.getElementById('email'),
      check: function (v) {
        if (v.trim().length === 0) return 'Please enter your email.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'That email looks incomplete. Try name@example.com';
        return '';
      }
    },
    message: {
      input: document.getElementById('message'),
      check: function (v) {
        if (v.trim().length === 0) return 'Please write a message.';
        if (v.trim().length < 10) return 'Please add a little more detail (at least 10 characters).';
        return '';
      }
    }
  };

  Object.keys(fields).forEach(function (key) {
    var f = fields[key];
    f.touched = false;
    f.error = el('small', 'field-error');
    f.error.id = key + '-error';
    f.error.setAttribute('aria-live', 'polite');
    f.input.setAttribute('aria-describedby', f.error.id);
    f.input.insertAdjacentElement('afterend', f.error);

    f.input.addEventListener('blur', function () { f.touched = true; validate(key); });
    f.input.addEventListener('input', function () { if (f.touched) validate(key); });
  });

  function validate(key) {
    var f = fields[key];
    var msg = f.check(f.input.value);
    f.error.textContent = msg;
    f.input.classList.toggle('invalid', msg !== '');
    f.input.classList.toggle('valid', msg === '');
    f.input.setAttribute('aria-invalid', msg !== '' ? 'true' : 'false');
    return msg === '';
  }

  function validateAll() {
    var firstBad = null;
    Object.keys(fields).forEach(function (key) {
      fields[key].touched = true;
      if (!validate(key) && !firstBad) firstBad = fields[key].input;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  /* ---------- Sending (WhatsApp or email, no server needed) ---------- */

  var status = el('p', 'form-status');
  status.setAttribute('role', 'status');
  form.appendChild(status);

  function buildMessage() {
    return 'Hi! My name is ' + fields.name.input.value.trim() +
      ' (' + fields.email.input.value.trim() + ').\n\n' +
      fields.message.input.value.trim();
  }

  function showStatus(text) {
    status.textContent = text;
    status.classList.add('ok');
  }

  function sendEmail() {
    var subject = 'Message from ' + fields.name.input.value.trim();
    window.location.href = 'mailto:' + EMAIL_ADDRESS +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(buildMessage());
    showStatus('Opening your email app\u2026 If nothing opens, email us directly at ' + EMAIL_ADDRESS + '.');
  }

  function sendWhatsApp() {
    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildMessage());
    window.open(url, '_blank', 'noopener');
    showStatus('Opening WhatsApp\u2026 Just press send in the chat to deliver your message.');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (validateAll()) sendEmail();
  });

  var waBtn = document.getElementById('wa-btn');
  if (waBtn) {
    waBtn.addEventListener('click', function () {
      if (validateAll()) sendWhatsApp();
    });
  }
});
