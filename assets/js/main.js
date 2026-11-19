(function () {
  'use strict';

  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animate = hasGSAP && !reduceMotion;

  if (hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  var header = document.querySelector('.site-header');
  var toTop = document.querySelector('.to-top');
  var menuToggle = document.querySelector('.menu-toggle');
  var menu = document.querySelector('.nav__links');

  function updateChrome() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 40);
    toTop.classList.toggle('is-visible', y > 700);
  }

  window.addEventListener('scroll', updateChrome, { passive: true });
  updateChrome();

  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  menuToggle.addEventListener('click', function () {
    setMenu(!menu.classList.contains('is-open'));
  });

  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setMenu(false);
  });

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (section) { observer.observe(section); });
  }

  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = parseInt(el.dataset.count, 10);
    if (!animate || !hasScrollTrigger) {
      el.textContent = end;
      return;
    }
    var counter = { value: 0 };
    gsap.to(counter, {
      value: end,
      duration: 1.8,
      ease: 'power2.out',
      snap: { value: 1 },
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: function () { el.textContent = Math.round(counter.value); }
    });
  });

  if (animate) {
    var heroTitle = document.querySelector('.hero h1');

    function wrapWords(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              fragment.appendChild(document.createTextNode(part));
            } else {
              var word = document.createElement('span');
              word.className = 'word';
              word.textContent = part;
              fragment.appendChild(word);
            }
          });
          child.parentNode.replaceChild(fragment, child);
        } else if (child.nodeType === 1) {
          wrapWords(child);
        }
      });
    }

    if (heroTitle) wrapWords(heroTitle);

    gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
      .from('[data-hero]:not(h1)', { y: 34, opacity: 0, duration: 0.95, stagger: 0.13 })
      .from('.hero h1 .word', { yPercent: 115, opacity: 0, duration: 0.85, stagger: 0.035 }, '-=.65')
      .from('.brand', { y: -20, opacity: 0, duration: 0.7 }, 0)
      .from('.nav__links a, .nav__actions > *', { y: -12, opacity: 0, duration: 0.6, stagger: 0.06 }, 0.15)
      .from('.scroll-cue', { opacity: 0, y: 12, duration: 0.6 }, 0.8);

    if (hasScrollTrigger) {
      gsap.to('.scroll-progress span', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          start: 0,
          end: function () { return document.documentElement.scrollHeight - window.innerHeight; },
          scrub: 0.3
        }
      });

      if (document.querySelector('.orb__scene')) {
        var orbTweens = [
          gsap.to('.orb__rings', { rotationY: 360, duration: 24, ease: 'none', repeat: -1, transformOrigin: '50% 50%' }),
          gsap.to('.orb__ring--1', { rotationZ: 360, duration: 16, ease: 'none', repeat: -1, transformOrigin: '50% 50%' }),
          gsap.to('.orb__ring--2', { rotationX: 360, duration: 20, ease: 'none', repeat: -1, transformOrigin: '50% 50%' }),
          gsap.to('.orb__core', { rotationY: -360, duration: 30, ease: 'none', repeat: -1, transformOrigin: '50% 50%' }),
          gsap.to('.orb__drop', {
            y: -16, opacity: 0.3, duration: 2.4, ease: 'sine.inOut',
            yoyo: true, repeat: -1, stagger: { each: 0.35, from: 'random' }
          })
        ];

        var heroTrigger = ScrollTrigger.create({
          trigger: '.hero',
          start: 'top bottom',
          end: 'bottom top',
          onToggle: function (self) {
            orbTweens.forEach(function (tween) { self.isActive ? tween.play() : tween.pause(); });
          }
        });
        if (!heroTrigger.isActive) {
          orbTweens.forEach(function (tween) { tween.pause(); });
        }

        if (window.matchMedia('(hover: hover)').matches) {
          var tiltX = gsap.quickTo('.orb__scene', 'rotationX', { duration: 0.9, ease: 'power3.out' });
          var tiltY = gsap.quickTo('.orb__scene', 'rotationY', { duration: 0.9, ease: 'power3.out' });
          window.addEventListener('pointermove', function (event) {
            var nx = (event.clientX / window.innerWidth - 0.5) * 2;
            var ny = (event.clientY / window.innerHeight - 0.5) * 2;
            tiltY(nx * 14);
            tiltX(-ny * 12);
          }, { passive: true });
        }
      }

      gsap.to('.hero__bg', {
        yPercent: 16,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });

      gsap.to('.hero__content', {
        y: -70,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 45%', scrub: true }
      });

      gsap.utils.toArray('[data-reveal]').forEach(function (el) {
        gsap.fromTo(el,
          { y: 42, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.95, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true }
          }
        );
      });

      gsap.utils.toArray('[data-stagger]').forEach(function (group) {
        gsap.fromTo(Array.prototype.slice.call(group.children),
          { y: 36, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.8, stagger: 0.09, ease: 'power3.out',
            scrollTrigger: { trigger: group, start: 'top 86%', once: true }
          }
        );
      });

      var progress = document.querySelector('.journey__progress span');
      if (progress) {
        gsap.to(progress, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.journey', start: 'top 82%', end: 'bottom 55%', scrub: true }
        });
      }

      gsap.utils.toArray('.photo--tall img, .wide-photo img, .feature-photo img').forEach(function (img) {
        gsap.fromTo(img,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: 'none',
            scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
          }
        );
      });

      if (window.matchMedia('(hover: hover)').matches) {
        gsap.utils.toArray('.impact-card, .monitor-card, .species-card, .benefit-card').forEach(function (card) {
          gsap.set(card, { transformPerspective: 900, transformStyle: 'preserve-3d' });
          var cardX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
          var cardY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });

          card.addEventListener('pointermove', function (event) {
            var rect = card.getBoundingClientRect();
            cardX((0.5 - (event.clientY - rect.top) / rect.height) * 8);
            cardY(((event.clientX - rect.left) / rect.width - 0.5) * 8);
          });

          card.addEventListener('pointerenter', function () {
            gsap.to(card, { z: 18, duration: 0.4, ease: 'power2.out' });
          });

          card.addEventListener('pointerleave', function () {
            cardX(0);
            cardY(0);
            gsap.to(card, { z: 0, duration: 0.5, ease: 'power2.out' });
          });
        });
      }
    }
  }

  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
  var lightbox = document.querySelector('.lightbox');
  var lightboxImg = lightbox.querySelector('.lightbox__figure img');
  var lightboxCaption = lightbox.querySelector('.lightbox__figure figcaption');
  var closeButton = lightbox.querySelector('.lightbox__close');
  var currentIndex = 0;
  var lastFocused = null;

  function renderLightbox(index) {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    var item = galleryItems[currentIndex];
    var source = item.querySelector('button').dataset.full || item.querySelector('img').getAttribute('src');
    lightboxImg.src = source;
    lightboxImg.alt = item.querySelector('img').alt;
    lightboxCaption.textContent = item.dataset.caption || '';
  }

  function openLightbox(index, opener) {
    lastFocused = opener;
    renderLightbox(index);
    lightbox.classList.add('is-open');
    document.body.classList.add('lightbox-open');
    closeButton.focus();

    if (animate) {
      gsap.fromTo(lightbox.querySelector('.lightbox__figure'),
        { scale: 0.94, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' }
      );
    }
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    if (lastFocused) lastFocused.focus();
  }

  galleryItems.forEach(function (item, index) {
    item.querySelector('button').addEventListener('click', function (event) {
      openLightbox(index, event.currentTarget);
    });
  });

  lightbox.querySelectorAll('[data-close]').forEach(function (element) {
    element.addEventListener('click', closeLightbox);
  });

  lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', function () {
    renderLightbox(currentIndex - 1);
  });

  lightbox.querySelector('.lightbox__nav--next').addEventListener('click', function () {
    renderLightbox(currentIndex + 1);
  });

  document.addEventListener('keydown', function (event) {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') renderLightbox(currentIndex - 1);
    if (event.key === 'ArrowRight') renderLightbox(currentIndex + 1);
    if (event.key === 'Tab') {
      var focusables = Array.prototype.slice.call(lightbox.querySelectorAll('button'));
      var index = focusables.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        focusables[focusables.length - 1].focus();
      } else if (!event.shiftKey && index === focusables.length - 1) {
        event.preventDefault();
        focusables[0].focus();
      }
    }
  });
})();
