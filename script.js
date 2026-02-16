/**
 * Portfolio Interactions
 * Modern micro-interactions with performance in mind
 * Uses Intersection Observer for efficient scroll-based animations
 */

(function() {
  'use strict';

  // ==================== CONSTANTS ====================
  const CURSOR_LAG_FACTOR = 0.15;
  const PIXELS_PER_PARTICLE = 18;
  const MOUSE_ATTRACTION_RADIUS = 200;
  const MAX_CONNECTION_DISTANCE = 150;
  const COUNTER_ANIMATION_MS = 1800;
  const MAX_TILT_DEGREES = 6;

  // ==================== DOM REFERENCES ====================
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  
  // Elements to animate on scroll
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-scale, .stagger-reveal');
  
  // ==================== PRELOADER ====================
  const preloader = document.getElementById('preloader');
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 1400);
  });

  // ==================== CUSTOM CURSOR ====================
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  const isTouchDevice = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;

  if (!isTouchDevice && cursorDot && cursorRing) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * CURSOR_LAG_FACTOR;
      ringY += (mouseY - ringY) * CURSOR_LAG_FACTOR;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover effect on interactive elements
    const hoverTargets = document.querySelectorAll('a, button, .btn, .skill-card, .project-card, .stat-item, .contact-link');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('hovering');
        cursorRing.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('hovering');
        cursorRing.classList.remove('hovering');
      });
    });

    // Hide cursor when leaving the window
    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
    });
  }

  // ==================== INTERACTIVE PARTICLE CANVAS ====================
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let canvasMouseX = 0, canvasMouseY = 0;
    const particleCount = Math.min(80, Math.floor(window.innerWidth / PIXELS_PER_PARTICLE));

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
      update() {
        // Slight attraction toward mouse
        const dx = canvasMouseX - this.x;
        const dy = canvasMouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_ATTRACTION_RADIUS && dist > 0) {
          this.vx += (dx / dist) * 0.02;
          this.vy += (dy / dist) * 0.02;
        }
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, ' + this.opacity + ')';
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    document.addEventListener('mousemove', (e) => {
      canvasMouseX = e.clientX;
      canvasMouseY = e.clientY;
    });

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_CONNECTION_DISTANCE) {
            const opacity = (1 - dist / MAX_CONNECTION_DISTANCE) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(99, 102, 241, ' + opacity + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    }

    let animRunning = true;
    function animateParticles() {
      if (!animRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // Pause when not visible for performance
    const heroSection = document.getElementById('hero');
    const canvasObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        animRunning = entry.isIntersecting;
        if (animRunning) animateParticles();
      });
    }, { threshold: 0.1 });
    canvasObserver.observe(heroSection);
  }

  // ==================== HEADER SCROLL EFFECT ====================
  let lastScroll = 0;
  let ticking = false;
  
  function updateHeader() {
    const scrollY = window.scrollY;
    
    // Add/remove scrolled class for glassmorphism effect
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = scrollY;
    ticking = false;
  }
  
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
  
  // ==================== MOBILE MENU ====================
  function toggleMenu() {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
  }
  
  menuToggle.addEventListener('click', toggleMenu);
  
  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('active')) {
        toggleMenu();
      }
    });
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
      toggleMenu();
    }
  });
  
  // ==================== SMOOTH SCROLL ====================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Skip if it's just "#"
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        
        const headerHeight = header.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Update URL without jumping
        history.pushState(null, null, href);
      }
    });
  });
  
  // ==================== REVEAL ON SCROLL ====================
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  };
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Stop observing once revealed
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  revealElements.forEach(el => {
    revealObserver.observe(el);
  });
  
  // ==================== ACTIVE NAV LINK ====================
  const sections = document.querySelectorAll('section[id]');
  
  const navObserverOptions = {
    root: null,
    rootMargin: '-20% 0px -80% 0px',
    threshold: 0
  };
  
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active class from all nav links
        navLinks.querySelectorAll('a').forEach(link => {
          link.classList.remove('active');
        });
        
        // Add active class to current section's nav link
        const id = entry.target.getAttribute('id');
        const activeLink = navLinks.querySelector(`a[href="#${id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, navObserverOptions);
  
  sections.forEach(section => {
    navObserver.observe(section);
  });
  
  // ==================== BUTTON RIPPLE EFFECT ====================
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      
      ripple.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        pointer-events: none;
        width: 100px;
        height: 100px;
        transform: translate(-50%, -50%) scale(0);
        animation: ripple 0.6s ease-out;
      `;
      
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
  
  // Add ripple animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: translate(-50%, -50%) scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  // ==================== PARALLAX EFFECT FOR HERO ORBS ====================
  const heroOrbs = document.querySelectorAll('.hero-orb');
  
  function handleParallax() {
    const scrollY = window.scrollY;
    
    if (scrollY < window.innerHeight) {
      heroOrbs.forEach((orb, index) => {
        const speed = 0.1 + (index * 0.05);
        orb.style.transform = `translateY(${scrollY * speed}px)`;
      });
    }
  }
  
  // Only enable parallax on devices that can handle it
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    window.addEventListener('scroll', handleParallax, { passive: true });
  }

  // ==================== ANIMATED STAT COUNTERS ====================
  function animateCounter(el, target, suffix) {
    const isFloat = String(target).includes('.');
    const duration = COUNTER_ANIMATION_MS;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      if (isFloat) {
        el.textContent = current.toFixed(2) + suffix;
      } else {
        el.textContent = Math.floor(current) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  const statNumbers = document.querySelectorAll('.stat-number');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();
        // Parse numeric value and suffix
        const match = text.match(/^([\d.]+)(.*)$/);
        if (match) {
          const num = parseFloat(match[1]);
          const suffix = match[2];
          animateCounter(el, num, suffix);
        }
        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => {
    if (/^[\d.]/.test(el.textContent.trim())) {
      statsObserver.observe(el);
    }
  });

  // ==================== 3D TILT EFFECT ON CARDS ====================
  if (!isTouchDevice && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    const tiltCards = document.querySelectorAll('.skill-card, .project-card, .stat-item');

    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -MAX_TILT_DEGREES;
        const rotateY = ((x - centerX) / centerX) * MAX_TILT_DEGREES;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
        card.style.transition = 'transform 0.5s ease';
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease';
      });
    });
  }
  
  // ==================== LAZY LOADING IMAGES ====================
  // If you add images later, this will lazy load them
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback for older browsers
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          imageObserver.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      imageObserver.observe(img);
    });
  }
  
})();
