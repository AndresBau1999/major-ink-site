document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  var form = document.querySelector('#booking-form');
  if (form) {
    // Points at the deployed backend on Railway (site and API live on
    // different domains: majorinkstudios.netlify.app + Railway).
    var BOOKING_API_URL = 'https://major-ink-backend-production.up.railway.app/api/bookings';

    // "Book with <artist>" links pass ?artist=Name to preselect the dropdown.
    var requestedArtist = new URLSearchParams(location.search).get('artist');
    var artistSelect = form.querySelector('#artist');
    if (requestedArtist && artistSelect) {
      Array.prototype.forEach.call(artistSelect.options, function (opt) {
        if (opt.value.toLowerCase() === requestedArtist.toLowerCase()) artistSelect.value = opt.value;
      });
    }

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

      if (!validateClientSide()) return;

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
            form.style.display = 'none';
            document.querySelector('.form-success').style.display = 'block';
            window.scrollTo({ top: form.offsetTop - 120, behavior: 'smooth' });
            return;
          }
          if (result.data.errors) {
            Object.keys(result.data.errors).forEach(function (key) {
              var field = form.querySelector('[name="' + key + '"]');
              if (field) {
                field.closest('.field').classList.add('error');
                var errEl = field.closest('.field').querySelector('.field-error');
                if (errEl) errEl.textContent = result.data.errors[key];
              }
            });
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