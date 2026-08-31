(() => {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const backTop = document.getElementById('backTop');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Hero video: loop a touch early (avoids the native loop hitch some browsers show
  // at the exact end frame) and recover automatically if playback ever stalls.
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    heroVideo.addEventListener('timeupdate', () => {
      if (heroVideo.duration && heroVideo.duration - heroVideo.currentTime < 0.2) {
        heroVideo.currentTime = 0;
      }
    });

    let stallTimer;
    heroVideo.addEventListener('waiting', () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(() => heroVideo.play().catch(() => {}), 2500);
    });
    heroVideo.addEventListener('playing', () => clearTimeout(stallTimer));

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && heroVideo.paused) heroVideo.play().catch(() => {});
    });
  }

  const onScroll = () => {
    const scrolled = window.scrollY > 40;
    navbar.classList.toggle('scrolled', scrolled);
    backTop.classList.toggle('show', window.scrollY > 600);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.toggle('menu-open');
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => document.body.classList.remove('menu-open'));
  });

  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('menu-open') && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
      document.body.classList.remove('menu-open');
    }
  });

  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Active link on scroll
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-links a');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => sectionObserver.observe(s));

  // Scroll reveal - optimized threshold for mobile & desktop
  const isMobile = window.innerWidth <= 768;
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: isMobile ? 0.08 : 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  // Mobile scroll-driven glass light sheen sweep
  if (isMobile || !window.matchMedia('(pointer: fine)').matches) {
    const sheenCards = document.querySelectorAll('.service-card, .testi-card');
    const sheenObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sheen-active');
          setTimeout(() => {
            entry.target.classList.remove('sheen-active');
          }, 1300);
        }
      });
    }, { threshold: 0.4 });
    sheenCards.forEach(c => sheenObserver.observe(c));
  }

  // Gallery filters (only present on the full gallery page)
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        galleryItems.forEach(item => {
          const match = filter === 'all' || item.dataset.category === filter;
          item.classList.toggle('hidden', !match);
        });
      });
    });
  }

  // Lightbox (only present on pages with a gallery), with prev/next through visible photos
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCounter = document.getElementById('lightboxCounter');
  if (lightbox && lightboxImg && lightboxClose) {
    let visibleImgs = [];
    let currentIndex = 0;

    const showAt = (index) => {
      if (!visibleImgs.length) return;
      currentIndex = (index + visibleImgs.length) % visibleImgs.length;
      const img = visibleImgs[currentIndex];
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      if (lightboxCounter) {
        lightboxCounter.textContent = visibleImgs.length > 1 ? `${currentIndex + 1} / ${visibleImgs.length}` : '';
      }
      const multi = visibleImgs.length > 1;
      if (lightboxPrev) lightboxPrev.style.display = multi ? '' : 'none';
      if (lightboxNext) lightboxNext.style.display = multi ? '' : 'none';
    };

    document.addEventListener('click', (e) => {
      const img = e.target.closest('.gallery-item img');
      if (!img) return;
      visibleImgs = [...document.querySelectorAll('.gallery-item:not(.hidden) img')];
      showAt(visibleImgs.indexOf(img));
      lightbox.classList.add('open');
    });

    const closeLightbox = () => lightbox.classList.remove('open');
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showAt(currentIndex - 1); });
    if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showAt(currentIndex + 1); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showAt(currentIndex + 1);
      if (e.key === 'ArrowLeft') showAt(currentIndex - 1);
    });
  }

  // Booking form -> WhatsApp handoff
  const WHATSAPP_NUMBER = '94768502198';
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    const tourSelect = document.getElementById('tour');
    const params = new URLSearchParams(window.location.search);
    const presetTour = params.get('tour');
    if (presetTour) {
      const match = [...tourSelect.options].find(o => o.value === presetTour);
      if (match) tourSelect.value = presetTour;
    }

    const statusBox = document.getElementById('formStatus');
    const statusText = document.getElementById('formStatusText');

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullName').value.trim();
      const tour = tourSelect.value;
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const date = document.getElementById('date').value;
      const guests = document.getElementById('guests').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!fullName || !tour) {
        statusText.textContent = 'Please enter your name and choose a tour.';
        statusBox.classList.add('show');
        return;
      }
      statusBox.classList.remove('show');

      const lines = [
        'Hello! I’d like to book a tour with Mirissa Snorkeling Activities Tours.',
        '',
        `Name: ${fullName}`,
        `Tour: ${tour}`,
      ];
      if (date) lines.push(`Preferred Date: ${date}`);
      if (guests) lines.push(`Guests: ${guests}`);
      if (phone) lines.push(`Phone: ${phone}`);
      if (email) lines.push(`Email: ${email}`);
      if (message) lines.push(`Message: ${message}`);

      const text = encodeURIComponent(lines.join('\n'));
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener');
    });
  }

  // ============ VIDEO SLIDER ============
  const videoTrack = document.getElementById('videoSliderTrack');
  const videoPrev = document.getElementById('videoPrev');
  const videoNext = document.getElementById('videoNext');
  const videoDotsContainer = document.getElementById('videoSliderDots');
  const videoContainer = document.querySelector('.video-slider-container');

  if (videoTrack && videoPrev && videoNext && videoDotsContainer) {
    const slides = videoTrack.querySelectorAll('.video-slide');
    let autoSlideInterval = null;
    let isUserInteracting = false;
    const AUTO_SLIDE_DELAY = 4500; // auto slide every 4.5 seconds

    const getSlideStep = () => {
      if (!slides.length) return 0;
      const gap = parseFloat(window.getComputedStyle(videoTrack).gap) || 24;
      return slides[0].getBoundingClientRect().width + gap;
    };

    // Create pagination dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = `slider-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Go to video slide ${i + 1}`);
      dot.addEventListener('click', () => {
        const step = getSlideStep();
        videoTrack.scrollTo({ left: i * step, behavior: 'smooth' });
        resetAutoSlide();
      });
      videoDotsContainer.appendChild(dot);
    });

    const dots = videoDotsContainer.querySelectorAll('.slider-dot');

    const updateSliderState = () => {
      const scrollLeft = videoTrack.scrollLeft;
      const step = getSlideStep();
      if (!step) return;

      const activeIndex = Math.min(slides.length - 1, Math.max(0, Math.round(scrollLeft / step)));

      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIndex);
      });
    };

    const nextSlide = () => {
      const step = getSlideStep();
      const maxScroll = videoTrack.scrollWidth - videoTrack.clientWidth;
      if (videoTrack.scrollLeft >= maxScroll - 15) {
        videoTrack.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        videoTrack.scrollBy({ left: step, behavior: 'smooth' });
      }
    };

    const prevSlide = () => {
      const step = getSlideStep();
      if (videoTrack.scrollLeft <= 15) {
        const maxScroll = videoTrack.scrollWidth - videoTrack.clientWidth;
        videoTrack.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        videoTrack.scrollBy({ left: -step, behavior: 'smooth' });
      }
    };

    videoPrev.addEventListener('click', () => {
      prevSlide();
      resetAutoSlide();
    });

    videoNext.addEventListener('click', () => {
      nextSlide();
      resetAutoSlide();
    });

    // Auto-slide timer management
    const startAutoSlide = () => {
      if (autoSlideInterval) clearInterval(autoSlideInterval);
      autoSlideInterval = setInterval(() => {
        const modalOpen = document.getElementById('videoModal')?.classList.contains('open');
        if (!isUserInteracting && !modalOpen) {
          nextSlide();
        }
      }, AUTO_SLIDE_DELAY);
    };

    const stopAutoSlide = () => {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
      }
    };

    const resetAutoSlide = () => {
      stopAutoSlide();
      startAutoSlide();
    };

    // Pause on hover & touch
    if (videoContainer) {
      videoContainer.addEventListener('mouseenter', () => { isUserInteracting = true; });
      videoContainer.addEventListener('mouseleave', () => { isUserInteracting = false; });
      videoContainer.addEventListener('touchstart', () => { isUserInteracting = true; }, { passive: true });
      videoContainer.addEventListener('touchend', () => { 
        isUserInteracting = false; 
        resetAutoSlide();
      }, { passive: true });
    }

    let scrollTimeout;
    videoTrack.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateSliderState, 50);
    }, { passive: true });

    // Initial start
    setTimeout(() => {
      updateSliderState();
      startAutoSlide();
    }, 200);

    window.addEventListener('resize', updateSliderState);
  }

  // ============ VIDEO MODAL PLAYER ============
  const videoModal = document.getElementById('videoModal');
  const videoModalWrapper = document.getElementById('videoModalWrapper');
  const videoModalClose = document.getElementById('videoModalClose');
  const videoModalBackdrop = document.getElementById('videoModalBackdrop');

  if (videoModal && videoModalWrapper) {
    const openVideo = (videoId, title) => {
      videoModalWrapper.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
          title="${title || 'YouTube Video'}"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowfullscreen>
        </iframe>
      `;
      videoModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeVideo = () => {
      videoModal.classList.remove('open');
      videoModalWrapper.innerHTML = '';
      document.body.style.overflow = '';
    };

    document.querySelectorAll('.video-wrapper[data-video-id]').forEach(wrap => {
      wrap.addEventListener('click', () => {
        const id = wrap.dataset.videoId;
        const title = wrap.dataset.videoTitle;
        if (id) openVideo(id, title);
      });
    });

    if (videoModalClose) videoModalClose.addEventListener('click', closeVideo);
    if (videoModalBackdrop) videoModalBackdrop.addEventListener('click', closeVideo);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && videoModal.classList.contains('open')) {
        closeVideo();
      }
    });
  }

  // ============ REVIEW AUTO-SLIDER ============
  const reviewTrack = document.getElementById('reviewSliderTrack');
  const reviewPrev = document.getElementById('reviewPrev');
  const reviewNext = document.getElementById('reviewNext');
  const reviewDotsContainer = document.getElementById('reviewSliderDots');
  const reviewContainer = document.querySelector('.review-slider-container');

  if (reviewTrack && reviewDotsContainer) {
    const slides = reviewTrack.querySelectorAll('.review-slide');
    let autoSlideInterval = null;
    let isUserInteracting = false;
    let currentIndex = 0;
    const AUTO_SLIDE_DELAY = 3500; // Auto-slides every 3.5 seconds

    const getSlideStep = () => {
      if (!slides.length) return 0;
      const gap = parseFloat(window.getComputedStyle(reviewTrack).gap) || 28;
      return slides[0].getBoundingClientRect().width + gap;
    };

    const getMaxIndex = () => {
      const step = getSlideStep();
      if (!step) return slides.length - 1;
      const visibleCount = Math.round(reviewTrack.clientWidth / step) || 1;
      return Math.max(0, slides.length - visibleCount);
    };

    // Create pagination dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = `slider-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Go to review slide ${i + 1}`);
      dot.addEventListener('click', () => {
        currentIndex = i;
        goToSlide(currentIndex);
        resetAutoSlide();
      });
      reviewDotsContainer.appendChild(dot);
    });

    const dots = reviewDotsContainer.querySelectorAll('.slider-dot');

    const updateDots = (index) => {
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === index);
      });
      if (reviewPrev) reviewPrev.disabled = index === 0;
      if (reviewNext) reviewNext.disabled = index >= getMaxIndex();
    };

    const goToSlide = (index) => {
      const step = getSlideStep();
      const maxScroll = reviewTrack.scrollWidth - reviewTrack.clientWidth;
      const targetLeft = Math.min(maxScroll, index * step);
      reviewTrack.scrollTo({ left: targetLeft, behavior: 'smooth' });
      updateDots(index);
    };

    const nextSlide = () => {
      const maxIdx = getMaxIndex();
      if (currentIndex >= maxIdx) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      goToSlide(currentIndex);
    };

    const prevSlide = () => {
      const maxIdx = getMaxIndex();
      if (currentIndex <= 0) {
        currentIndex = maxIdx;
      } else {
        currentIndex--;
      }
      goToSlide(currentIndex);
    };

    if (reviewPrev) {
      reviewPrev.addEventListener('click', () => {
        prevSlide();
        resetAutoSlide();
      });
    }

    if (reviewNext) {
      reviewNext.addEventListener('click', () => {
        nextSlide();
        resetAutoSlide();
      });
    }

    // Auto-slide timer management
    const startAutoSlide = () => {
      stopAutoSlide();
      autoSlideInterval = setInterval(() => {
        if (!isUserInteracting) {
          nextSlide();
        }
      }, AUTO_SLIDE_DELAY);
    };

    const stopAutoSlide = () => {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
      }
    };

    const resetAutoSlide = () => {
      stopAutoSlide();
      startAutoSlide();
    };

    // Pause on hover & touch
    if (reviewContainer) {
      reviewContainer.addEventListener('mouseenter', () => { isUserInteracting = true; });
      reviewContainer.addEventListener('mouseleave', () => { 
        isUserInteracting = false; 
        resetAutoSlide();
      });
      reviewContainer.addEventListener('touchstart', () => { isUserInteracting = true; }, { passive: true });
      reviewContainer.addEventListener('touchend', () => { 
        setTimeout(() => {
          isUserInteracting = false; 
          resetAutoSlide();
        }, 1500);
      }, { passive: true });
    }

    // Sync current index when user manually swipes/scrolls
    let scrollTimeout;
    reviewTrack.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const step = getSlideStep();
        if (step) {
          currentIndex = Math.min(slides.length - 1, Math.max(0, Math.round(reviewTrack.scrollLeft / step)));
          updateDots(currentIndex);
        }
      }, 60);
    }, { passive: true });

    // Initial start immediately
    setTimeout(() => {
      goToSlide(0);
      startAutoSlide();
    }, 300);

    window.addEventListener('resize', () => {
      goToSlide(currentIndex);
    });
  }

  // ============ 3D CARD TILT EFFECT ============
  const tiltElements = document.querySelectorAll('.service-card, .testi-card, .video-card, .why-item');
  if (window.matchMedia('(pointer: fine)').matches) {
    tiltElements.forEach(card => {
      let isHovered = false;
      card.addEventListener('mouseenter', () => { isHovered = true; });
      card.addEventListener('mousemove', (e) => {
        if (!isHovered) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => {
        isHovered = false;
        card.style.transform = '';
      });
    });
  }

  // ============ ANIMATED STAT COUNTERS ============
  const counters = document.querySelectorAll('[data-target]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-target'));
          const suffix = el.getAttribute('data-suffix') || '';
          const prefix = el.getAttribute('data-prefix') || '';
          const isDecimal = target % 1 !== 0;
          const duration = 1800;
          const startTime = performance.now();

          const updateCount = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            // easeOutExpo
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = ease * target;
            el.textContent = `${prefix}${isDecimal ? current.toFixed(1) : Math.floor(current)}${suffix}`;
            if (progress < 1) {
              requestAnimationFrame(updateCount);
            } else {
              el.textContent = `${prefix}${isDecimal ? target.toFixed(1) : target}${suffix}`;
            }
          };
          requestAnimationFrame(updateCount);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(c => counterObserver.observe(c));
  }
})();
