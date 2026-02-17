/* ============================================
   Ian Shultz — Bird Photography
   Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Image protection: block right-click site-wide ---
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  const nav = document.getElementById('nav');
  const hero = document.getElementById('hero');
  const heroBg = document.getElementById('heroBg');

  // --- Dark mode toggle ---
  const themeToggle = document.getElementById('themeToggle');

  function getStoredTheme() {
    try { return localStorage.getItem('theme'); } catch { return null; }
  }

  function storeTheme(theme) {
    try { localStorage.setItem('theme', theme); } catch { /* storage unavailable */ }
  }

  const savedTheme = getStoredTheme();
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    storeTheme(next);
  });

  // --- Navigation: scroll effect + hero transparency ---
  // Cache hero height to avoid layout thrashing on every scroll frame
  let cachedHeroHeight = hero.offsetHeight;
  window.addEventListener('resize', () => { cachedHeroHeight = hero.offsetHeight; }, { passive: true });

  function updateNav() {
    const scrollY = window.scrollY;
    nav.classList.toggle('nav--scrolled', scrollY > 50);
    nav.classList.toggle('nav--hero-visible', scrollY < cachedHeroHeight - 100);
  }
  updateNav();

  // --- Parallax hero background ---
  function updateParallax() {
    if (window.scrollY < cachedHeroHeight) {
      heroBg.style.transform = `translate3d(0, ${window.scrollY * 0.4}px, 0)`;
    }
  }

  // Combined scroll handler with rAF throttle
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateNav();
        updateParallax();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // --- Mobile menu toggle ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // --- Scroll reveal (Intersection Observer) ---
  const portfolioItems = document.querySelectorAll('.portfolio__item');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  // Use CSS transition-delay via custom property instead of inline style.transition
  // (avoids per-element style recalculation)
  portfolioItems.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${index * 0.08}s`);
    revealObserver.observe(item);
  });

  // Section headers, about blocks, contact
  document.querySelectorAll('.section__header, .about__content, .about__image, .contact__inner').forEach(el => {
    revealObserver.observe(el);
  });

  // --- Lightbox ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const items = Array.from(portfolioItems);
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    const item = items[currentIndex];
    const img = item.querySelector('img');
    const overlay = item.querySelector('.portfolio__overlay');

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = `${overlay.querySelector('h3').textContent} — ${overlay.querySelector('p').textContent}`;
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % items.length;
    updateLightbox();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateLightbox();
  }

  items.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  document.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  document.querySelector('.lightbox__next').addEventListener('click', nextImage);
  document.querySelector('.lightbox__prev').addEventListener('click', prevImage);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });

  // --- Smooth anchor offset for fixed nav ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = nav.offsetHeight + 20;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

});
