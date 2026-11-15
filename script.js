document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('is-locked', open);
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
  }

  var form = document.querySelector('#booking-form');
  if (form) {
    // Points at the deployed backend on Railway (site and API live on
    // different domains: majorinkstudios.netlify.app + Railway).
    var BOOKING_API_URL = 'https://major-ink-backend-production.up.railway.app/api/bookings';

    // booking.html picks the artist from ?artist=Name and runs the steps;
    // this file validates and sends. The page listens for these events.
    function notify(name) { form.dispatchEvent(new CustomEvent(name)); }

    function clearErrors() {
      form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('error'); });
      document.getElementById('form-level-error').textContent = '';
    }

    function validateClientSide() {
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (field) {
        var wrap = field.closest('.field');
        if (!field.value.trim()) {
          wrap.classList.add('error');
          valid = false;
        }
      });
      var emailField = form.querySelector('#email');
      if (emailField && emailField.value.trim()) {
        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim());
        if (!emailOk) {
          emailField.closest('.field').classList.add('error');
          emailField.closest('.field').querySelector('.field-error').textContent = 'Enter a valid email address.';
          valid = false;
        }
      }
      return valid;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      if (!validateClientSide()) { notify('booking-errors'); return; }

      var submitBtn = document.getElementById('submit-btn');
      var formLevelError = document.getElementById('form-level-error');
      var formData = Object.fromEntries(new FormData(form).entries());

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      fetch(BOOKING_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(function (res) { return res.json().then(function (data) { return { status: res.status, data: data }; }); })
        .then(function (result) {
          if (result.status === 200 && result.data.ok) {
            // Not form.style: the form has a field named "style", which shadows it.
            form.setAttribute('hidden', '');
            document.querySelector('.form-success').style.display = 'block';
            notify('booking-sent');
            return;
          }
          if (result.data.errors) {
            Object.keys(result.data.errors).forEach(function (key) {
              var field = form.querySelector('[name="' + key + '"]');
              if (field) {
                field.closest('.field').classList.add('error');
                var errEl = field.closest('.field').querySelector('.field-error');
                if (errEl) errEl.textContent = result.data.errors[key];
              } else {
                // Errors not tied to a field, e.g. _server: "Could not save your request."
                formLevelError.textContent = result.data.errors[key];
              }
            });
            notify('booking-errors');
          } else {
            formLevelError.textContent = 'Something went wrong. Try again, or call the shop directly.';
          }
        })
        .catch(function () {
          formLevelError.textContent = 'Could not reach the server. Check your connection and try again, or call the shop directly.';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit request';
        });
    });
  }
});