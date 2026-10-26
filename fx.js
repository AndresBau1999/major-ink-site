// Interaction layer: intro loader, page wipes, custom cursor, text/scroll reveals,
// marquees, pinned artist strip, hover previews, lightbox.
// Load this last on every page. Without JS (or with reduced motion) the site
// falls back to the plain static layout.
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  // `inside` is false whenever the mouse is outside the window (or the last
  // input was touch), so cursor effects can hide instead of freezing in place.
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, inside: false, moved: false };
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') { mouse.inside = false; return; }
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.inside = true;
    mouse.moved = true;
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') mouse.inside = false; }, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse.inside = false; });
  window.addEventListener('blur', function () { mouse.inside = false; });

  // What sits under the mouse right now. Re-checked whenever the mouse or the
  // page moves, so hover states stay correct while scrolling with the wheel.
  var hovered = null;
  function updateHovered(scrolled) {
    if (!mouse.inside) { hovered = null; return; }
    if (!mouse.moved && !scrolled) return;
    hovered = document.elementFromPoint(mouse.x, mouse.y);
    mouse.moved = false;
  }

  // One shared animation loop for everything that follows the mouse or scroll.
  var scroll = { y: window.scrollY, last: window.scrollY, velocity: 0, dir: 1 };
  var tickers = [];
  var lastTime = performance.now(), frame = 1;
  function onTick(fn) { tickers.push(fn); }
  // Smoothing that feels the same at 60Hz and 144Hz, and doesn't crawl when frames drop.
  function ease(k) { return 1 - Math.pow(1 - k, frame); }
  function loop(now) {
    frame = clamp((now - lastTime) / 16.667, 0.25, 4);
    lastTime = now;
    scroll.y = window.scrollY;
    var dy = scroll.y - scroll.last;
    scroll.velocity = lerp(scroll.velocity, dy, 0.2);
    if (dy !== 0) scroll.dir = dy > 0 ? 1 : -1;
    scroll.last = scroll.y;
    updateHovered(dy !== 0 || pinnedMoving);
    for (var i = 0; i < tickers.length; i++) tickers[i]();
    requestAnimationFrame(loop);
  }
  var pinnedMoving = false;

  function onceInView(el, fn, margin) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();
        fn();
      });
    }, { rootMargin: margin || '0px 0px -10% 0px' });
    io.observe(el);
  }

  // ---------- Intro (home page only, once per visit) ----------
  var introFinished = false, introCallbacks = [];
  function whenIntroDone(fn) { introFinished ? fn() : introCallbacks.push(fn); }
  function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    introCallbacks.forEach(function (fn) { fn(); });
  }

  function initPreloader() {
    var pre = document.querySelector('.preloader');
    if (!pre || root.classList.contains('intro-seen') || reduceMotion) {
      if (pre) pre.remove();
      setTimeout(finishIntro, root.classList.contains('is-arriving') ? 350 : 60);
      return;
    }
    document.body.classList.add('is-loading');
    var count = pre.querySelector('.preloader-count');
    var bar = pre.querySelector('.preloader-bar span');
    var start = performance.now(), duration = 1300;
    requestAnimationFrame(function step(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      count.textContent = Math.round(eased * 100);
      bar.style.transform = 'scaleX(' + eased + ')';
      if (p < 1) { requestAnimationFrame(step); return; }
      pre.classList.add('is-done');
      document.body.classList.remove('is-loading');
      try { sessionStorage.setItem('mi-intro', '1'); } catch (e) {}
      setTimeout(finishIntro, 350);
      setTimeout(function () { pre.remove(); }, 1300);
    });
  }

  // ---------- Page transitions ----------
  function initPageTransitions() {
    if (reduceMotion) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;
      e.preventDefault();
      try { sessionStorage.setItem('mi-wipe', '1'); } catch (err) {}
      root.classList.remove('is-arriving');
      root.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 520);
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) root.classList.remove('is-leaving', 'is-arriving');
    });
  }

  // ---------- Header: hide on scroll down, progress line ----------
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    header.appendChild(bar);
    var nav = header.querySelector('.main-nav');
    var hidden = false;
    onTick(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? scroll.y / max : 0).toFixed(4) + ')';
      var shouldHide = scroll.y > 240 && scroll.dir > 0 && !(nav && nav.classList.contains('open'));
      if (shouldHide !== hidden) {
        hidden = shouldHide;
        header.classList.toggle('is-hidden', hidden);
      }
    });
  }

  // ---------- Split headings into letters ----------
  function splitText(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var counter = { i: 0 };
    (function walk(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
        if (node.nodeType === 1) {
          if (node.tagName !== 'BR') walk(node);
          return;
        }
        if (node.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (word) {
          if (!word) return;
          if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span');
          w.className = 'split-word';
          w.setAttribute('aria-hidden', 'true');
          word.split('').forEach(function (ch) {
            var c = document.createElement('span');
            c.className = 'split-char';
            c.textContent = ch;
            c.style.setProperty('--i', counter.i++);
            w.appendChild(c);
          });
          frag.appendChild(w);
        });
        parent.replaceChild(frag, node);
      });
    })(el);
  }

  // ---------- Scroll reveals ----------
  function initReveals() {
    if (!reduceMotion) document.querySelectorAll('[data-split]').forEach(splitText);

    // Siblings that reveal together get a small stagger.
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.style.getPropertyValue('--d')) return;
      var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.hasAttribute('data-reveal'); });
      el.style.setProperty('--d', (siblings.indexOf(el) % 6) * 90 + 'ms');
    });

    document.querySelectorAll('[data-reveal], [data-split]').forEach(function (el) {
      var show = function () { el.classList.add('is-in'); };
      if (reduceMotion) { show(); return; }
      onceInView(el, function () {
        el.hasAttribute('data-after-intro') ? whenIntroDone(show) : show();
      });
    });
  }

  // ---------- Counting numbers ----------
  function initCounters() {
    if (reduceMotion) return;
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var raw = el.getAttribute('data-count');
      var target = parseFloat(raw);
      var decimals = (raw.split('.')[1] || '').length;
      var suffix = el.getAttribute('data-suffix') || '';
      el.textContent = (0).toFixed(decimals) + suffix;
      onceInView(el, function () {
        whenIntroDone(function () {
          var start = performance.now(), duration = 1500;
          requestAnimationFrame(function step(now) {
            var p = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 4);
            el.textContent = (target * eased).toFixed(decimals) + suffix;
            if (p < 1) requestAnimationFrame(step);
          });
        });
      });
    });
  }

  // ---------- Marquees: speed up with scroll, flip with scroll direction ----------
  function initMarquees() {
    document.querySelectorAll('[data-marquee]').forEach(function (m) {
      var track = m.querySelector('.marquee-track');
      var unit = track.innerHTML;
      for (var n = 0; n < 12 && track.scrollWidth < window.innerWidth * 1.5; n++) track.insertAdjacentHTML('beforeend', unit);
      track.insertAdjacentHTML('beforeend', track.innerHTML);
      if (reduceMotion) return;
      var dir = parseFloat(m.getAttribute('data-marquee')) || 1;
      var x = 0, half = track.scrollWidth / 2;
      window.addEventListener('resize', function () { half = track.scrollWidth / 2; });
      onTick(function () {
        var boost = 1 + Math.min(Math.abs(scroll.velocity) * 0.18, 8);
        x -= 0.6 * dir * scroll.dir * boost;
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      });
    });
  }

  // ---------- Spinning badge ----------
  function initSpin() {
    var badges = document.querySelectorAll('[data-spin] svg');
    if (!badges.length || reduceMotion) return;
    var angle = 0;
    onTick(function () {
      angle += 0.25 + Math.min(Math.abs(scroll.velocity) * 0.12, 6);
      badges.forEach(function (svg) { svg.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)'; });
    });
  }

  // ---------- Hero floating photos (mouse + scroll parallax) ----------
  function initHeroFloats() {
    var floats = document.querySelectorAll('[data-depth]');
    if (!floats.length || reduceMotion) return;
    var cur = { x: 0, y: 0 };
    onTick(function () {
      if (scroll.y > window.innerHeight * 1.3) return;
      var tx = finePointer ? mouse.x / window.innerWidth - 0.5 : 0;
      var ty = finePointer ? mouse.y / window.innerHeight - 0.5 : 0;
      cur.x = lerp(cur.x, tx, 0.06);
      cur.y = lerp(cur.y, ty, 0.06);
      floats.forEach(function (el) {
        var d = parseFloat(el.getAttribute('data-depth'));
        el.style.transform = 'translate3d(' + (cur.x * d * -70).toFixed(2) + 'px,' + (cur.y * d * -70 - scroll.y * d * 0.3).toFixed(2) + 'px,0)';
      });
    });
  }

  // ---------- Image parallax inside framed tiles ----------
  function initParallax() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!items.length || reduceMotion) return;
    onTick(function () {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2) / vh - 0.5;
        el.style.setProperty('--py', (p * -14).toFixed(2) + '%');
      });
    });
  }

  // ---------- Home: pinned horizontal artist strip ----------
  function initArtistStrip() {
    var section = document.querySelector('[data-hscroll]');
    if (!section || typeof ARTISTS === 'undefined') return;
    var track = section.querySelector('.hscroll-track');
    var progress = section.querySelector('.hscroll-progress span');

    track.innerHTML = ARTISTS.map(function (a, i) {
      var role = /^PLACEHOLDER/.test(a.role) ? a.photos.length + ' pieces in the book' : a.role;
      return '<a class="artist-slide" href="artists.html#' + a.slug + '" data-cursor="View work">' +
          '<div class="artist-slide-media">' +
            '<img src="' + a.photos[0] + '" alt="Tattoo by ' + a.name + '" loading="lazy">' +
            (a.photos[1] ? '<img class="alt" src="' + a.photos[1] + '" alt="" loading="lazy">' : '') +
          '</div>' +
          '<div class="artist-slide-meta">' +
            '<span class="artist-slide-num">' + String(i + 1).padStart(2, '0') + ' / ' + String(ARTISTS.length).padStart(2, '0') + '</span>' +
            '<h3>' + a.name + '</h3>' +
            '<span class="artist-slide-role">' + role + '</span>' +
          '</div>' +
        '</a>';
    }).join('') +
      '<a class="artist-slide artist-slide-end" href="booking.html" data-cursor="Book">' +
        '<span>Found your artist?</span><strong>Book now &rarr;</strong>' +
      '</a>';

    // Pinned scroll-jacking only for mouse users on wide screens. Phones and
    // tablets get a native swipeable row instead (their toolbars resize the
    // viewport mid-scroll, which makes a pinned section jump).
    var desktop = window.matchMedia('(min-width: 861px)');
    var distance = 0, x = 0, lastW = 0, lastH = 0;
    function measure() {
      // Ignore tiny height-only changes so the page doesn't jump mid-scroll.
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120 && lastW) return;
      lastW = window.innerWidth; lastH = window.innerHeight;
      if (!desktop.matches || !finePointer || reduceMotion) {
        section.classList.remove('is-pinned');
        section.style.height = '';
        track.style.transform = '';
        distance = 0;
        return;
      }
      section.classList.add('is-pinned');
      distance = Math.max(track.scrollWidth - window.innerWidth, 0);
      section.style.height = (window.innerHeight + distance) + 'px';
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', function () { lastW = 0; measure(); });

    onTick(function () {
      pinnedMoving = false;
      if (!distance) return;
      var r = section.getBoundingClientRect();
      if (r.bottom < -50 || r.top > window.innerHeight + 50) return;
      var p = clamp(-r.top / distance, 0, 1);
      var target = -p * distance;
      x = Math.abs(target - x) < 0.1 ? target : lerp(x, target, ease(0.14));
      // The track slides under a still mouse, so hover targets must be re-checked.
      pinnedMoving = x !== target;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      if (progress) progress.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }

  // ---------- Photo that pops up beside the hovered list row ----------
  // The photo is parked in the empty space on the right of the row and only
  // leans a little toward the mouse, so it never sits on top of the pointer
  // or the heading text.
  function initHoverPreview() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('[data-hover-list]').forEach(function (list) {
      var preview = document.createElement('div');
      preview.className = 'hover-preview';
      preview.setAttribute('aria-hidden', 'true');
      var img = document.createElement('img');
      img.alt = '';
      preview.appendChild(img);
      document.body.appendChild(preview);

      list.querySelectorAll('[data-hover-img]').forEach(function (row) {
        var pre = new Image();
        pre.src = row.getAttribute('data-hover-img');
      });

      var activeRow = null, pos = null, rot = 0;
      onTick(function () {
        var row = hovered && hovered.closest ? hovered.closest('[data-hover-img]') : null;
        if (row && !list.contains(row)) row = null;
        if (row !== activeRow) {
          activeRow = row;
          if (row) img.src = row.getAttribute('data-hover-img');
          preview.classList.toggle('is-active', !!row);
        }
        if (!activeRow) return;
        var r = activeRow.getBoundingClientRect();
        var w = preview.offsetWidth;
        var tx = r.right - 110 - w / 2 + (mouse.x - (r.left + r.width / 2)) * 0.04;
        var ty = r.top + r.height / 2 + (mouse.y - (r.top + r.height / 2)) * 0.25;
        if (!pos) pos = { x: tx, y: ty };
        var dx = tx - pos.x;
        pos.x = lerp(pos.x, tx, ease(0.2));
        pos.y = lerp(pos.y, ty, ease(0.2));
        rot = lerp(rot, clamp(dx * 0.3, -8, 8), ease(0.15));
        preview.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0) translate(-50%,-50%) rotate(' + (rot - 3).toFixed(2) + 'deg)';
      });
    });
  }

  // ---------- Custom cursor ----------
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    var ring = document.createElement('div');
    ring.className = 'cursor';
    ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<span class="cursor-label"></span>';
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    var label = ring.firstChild;

    // The dot moves straight from the event so it never lags the real pointer.
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      dot.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
    }, { passive: true });
    document.addEventListener('pointerdown', function () { ring.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { ring.classList.remove('is-down'); });

    var pos = { x: mouse.x, y: mouse.y }, visible = false, state = '', lastTarget;
    function setState(next, text) {
      if (next === 'label' && label.textContent !== text) label.textContent = text;
      if (next === state) return;
      ring.classList.remove('is-link', 'is-label', 'is-text');
      if (next) ring.classList.add('is-' + next);
      dot.classList.toggle('is-hidden', next === 'label' || next === 'text');
      state = next;
    }
    onTick(function () {
      if (mouse.inside !== visible) {
        visible = mouse.inside;
        ring.classList.toggle('is-visible', visible);
        dot.classList.toggle('is-visible', visible);
        // Reappear at the pointer instead of gliding in from where it left.
        if (visible) { pos.x = mouse.x; pos.y = mouse.y; }
        // Native cursor comes back while ours is hidden (e.g. after touch input).
        root.classList.toggle('has-cursor', visible);
      }
      if (!visible) return;

      if (hovered !== lastTarget) {
        lastTarget = hovered;
        var t = hovered && hovered.closest ? hovered.closest('[data-cursor], a, button, input, select, textarea, label') : null;
        if (!t) setState('');
        else if (t.matches('input, select, textarea')) setState('text');
        else if (t.getAttribute('data-cursor')) setState('label', t.getAttribute('data-cursor'));
        else setState('link');
      }

      pos.x = lerp(pos.x, mouse.x, ease(0.35));
      pos.y = lerp(pos.y, mouse.y, ease(0.35));
      ring.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0)';
    });
  }

  // ---------- Magnetic buttons ----------
  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('.btn, .nav-cta, [data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.translate = (x * 0.25).toFixed(1) + 'px ' + (y * 0.35).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
    });
  }

  // ---------- Lightbox for any [data-lightbox] group ----------
  function initLightbox() {
    var groups = document.querySelectorAll('[data-lightbox]');
    if (!groups.length) return;

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML =
      '<button class="lightbox-close" aria-label="Close">&times;</button>' +
      '<button class="lightbox-nav lightbox-prev" aria-label="Previous image">&larr;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lightbox-nav lightbox-next" aria-label="Next image">&rarr;</button>' +
      '<div class="lightbox-count"></div>';
    document.body.appendChild(box);
    var bigImg = box.querySelector('img');
    var caption = box.querySelector('figcaption');
    var count = box.querySelector('.lightbox-count');
    var items = [], index = 0, lastFocus = null;

    function cellImage(cell) { return cell.tagName === 'IMG' ? cell : cell.querySelector('img:not(.alt)'); }
    function show(i) {
      index = (i + items.length) % items.length;
      var img = items[index];
      bigImg.src = img.currentSrc || img.src;
      bigImg.alt = img.alt;
      caption.textContent = img.alt;
      count.textContent = (index + 1) + ' / ' + items.length;
    }
    function open(group, img) {
      items = Array.prototype.slice.call(group.children)
        .filter(function (c) { return c.offsetParent !== null; })
        .map(cellImage)
        .filter(Boolean);
      lastFocus = document.activeElement;
      show(Math.max(items.indexOf(img), 0));
      box.classList.add('is-open');
      document.body.classList.add('is-locked');
      box.querySelector('.lightbox-close').focus();
    }
    function close() {
      box.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (lastFocus) lastFocus.focus();
    }

    groups.forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (cell) {
        if (!cellImage(cell)) return;
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('role', 'button');
        if (!cell.hasAttribute('data-cursor')) cell.setAttribute('data-cursor', 'View');
      });
      group.addEventListener('click', function (e) {
        var cell = e.target.closest('[data-lightbox] > *');
        if (!cell || cell.parentNode !== group) return;
        var img = cellImage(cell);
        if (img) open(group, img);
      });
      group.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var cell = e.target.closest('[data-lightbox] > *');
        if (!cell || cell.parentNode !== group) return;
        e.preventDefault();
        open(group, cellImage(cell));
      });
    });

    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.lightbox-prev').addEventListener('click', function () { show(index - 1); });
    box.querySelector('.lightbox-next').addEventListener('click', function () { show(index + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'Tab') {
        var buttons = box.querySelectorAll('button');
        var first = buttons[0], last = buttons[buttons.length - 1];
        if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var startX = null;
    box.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    box.addEventListener('pointercancel', function () { startX = null; });
    box.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });
  }

  // ---------- Giant footer wordmark ----------
  function initFooterWordmark() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;
    var mark = document.createElement('div');
    mark.className = 'footer-wordmark';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = 'MAJOR INK'.split('').map(function (ch) {
      return ch === ' ' ? '<span class="gap"> </span>' : '<span>' + ch + '</span>';
    }).join('');
    footer.appendChild(mark);
  }

  function init() {
    initFooterWordmark();
    initPreloader();
    initPageTransitions();
    initHeader();
    initReveals();
    initCounters();
    initMarquees();
    initSpin();
    initHeroFloats();
    initParallax();
    initArtistStrip();
    initHoverPreview();
    initLightbox();
    initCursor();
    initMagnetic();
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
