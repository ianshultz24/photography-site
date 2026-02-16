/* ============================================
   Ian Shultz — Bird Photography
   Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Navigation scroll effect ---
  const nav = document.getElementById('nav');
  const handleScroll = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

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

  // --- Portfolio filter ---
  const filterButtons = document.querySelectorAll('.portfolio__filter');
  const portfolioItems = document.querySelectorAll('.portfolio__item');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      portfolioItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.classList.remove('hidden');
          // Re-trigger visibility animation
          item.classList.remove('visible');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              item.classList.add('visible');
            });
          });
        } else {
          item.classList.add('hidden');
          item.classList.remove('visible');
        }
      });
    });
  });

  // --- Scroll reveal (Intersection Observer) ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  portfolioItems.forEach((item, index) => {
    item.style.transitionDelay = `${index * 0.08}s`;
    observer.observe(item);
  });

  // --- Lightbox ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  let currentIndex = 0;
  let visibleItems = [];

  function getVisibleItems() {
    return Array.from(portfolioItems).filter(item => !item.classList.contains('hidden'));
  }

  function openLightbox(index) {
    visibleItems = getVisibleItems();
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
    const item = visibleItems[currentIndex];
    const img = item.querySelector('img');
    const overlay = item.querySelector('.portfolio__overlay');
    const title = overlay.querySelector('h3').textContent;
    const location = overlay.querySelector('p').textContent;

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = `${title} — ${location}`;
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % visibleItems.length;
    updateLightbox();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    updateLightbox();
  }

  portfolioItems.forEach(item => {
    item.addEventListener('click', () => {
      const visible = getVisibleItems();
      const index = visible.indexOf(item);
      if (index !== -1) openLightbox(index);
    });
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

  // --- Contact form ---
  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    // Replace this with your actual form handler (Formspree, Netlify Forms, etc.)
    console.log('Form submitted:', data);

    const btn = contactForm.querySelector('.contact__submit');
    const originalText = btn.textContent;
    btn.textContent = 'Message Sent!';
    btn.style.background = '#2d6a4f';
    btn.style.borderColor = '#2d6a4f';
    btn.style.color = '#fff';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      contactForm.reset();
    }, 3000);
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
