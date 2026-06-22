const header = document.getElementById('site-header');
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const fallbackMessages = {
  menu_open: 'Open navigation menu',
  menu_close: 'Close navigation menu',
  form_error_name: 'Please enter your name.',
  form_error_email: 'Please enter a valid email address.',
  form_error_company: 'Please enter your company name.',
  form_error_message: 'Please include a short message.',
  form_error_review: 'Please review the highlighted fields.',
  form_success: 'Thank you. Your message has been prepared for Green Santara JSC.'
};

const getTranslation = (key) => window.i18n?.t(key, fallbackMessages[key]) || fallbackMessages[key] || key;

const setMenuToggleLabel = (isOpen) => {
  const key = isOpen ? 'menu_close' : 'menu_open';
  menuToggle.setAttribute('data-i18n-aria-label', key);
  menuToggle.setAttribute('aria-label', getTranslation(key));
};

const setHeaderState = () => {
  header.classList.toggle('header-scrolled', window.scrollY > 24);
};

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

menuToggle.addEventListener('click', () => {
  const isOpen = !mobileMenu.classList.contains('hidden');
  mobileMenu.classList.toggle('hidden', isOpen);
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  setMenuToggleLabel(!isOpen);
});

document.querySelectorAll('#mobile-menu a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuToggle.setAttribute('aria-expanded', 'false');
    setMenuToggleLabel(false);
  });
});

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const active = `#${entry.target.id}`;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === active);
      });
    });
  },
  { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
);

sections.forEach((section) => navObserver.observe(section));

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});

const counterObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll('[data-counter]').forEach((counter) => {
  counterObserver.observe(counter);
});

function animateCounter(element) {
  const target = Number(element.dataset.counter);
  const duration = target > 500 ? 1500 : 1000;
  const startTime = performance.now();

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    const language = window.i18n?.getLanguage() === 'vi' ? 'vi-VN' : 'en-US';
    element.textContent = value.toLocaleString(language);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const validators = {
  name: (value) => value.trim().length >= 2 || 'form_error_name',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'form_error_email',
  company: (value) => value.trim().length >= 2 || 'form_error_company',
  message: (value) => value.trim().length >= 12 || 'form_error_message'
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  let isValid = true;

  Object.entries(validators).forEach(([name, validate]) => {
    const field = form.elements[name];
    const result = validate(field.value);
    const error = form.querySelector(`[data-error-for="${name}"]`);
    const hasError = result !== true;

    field.classList.toggle('invalid', hasError);
    field.setAttribute('aria-invalid', String(hasError));
    error.textContent = hasError ? getTranslation(result) : '';
    if (hasError) isValid = false;
  });

  if (!isValid) {
    status.textContent = getTranslation('form_error_review');
    status.style.color = '#b42318';
    return;
  }

  form.reset();
  form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
  status.textContent = getTranslation('form_success');
  status.style.color = '#174c33';
});

form.querySelectorAll('input, textarea').forEach((field) => {
  field.addEventListener('input', () => {
    field.classList.remove('invalid');
    field.removeAttribute('aria-invalid');
    const error = form.querySelector(`[data-error-for="${field.name}"]`);
    if (error) error.textContent = '';
    status.textContent = '';
  });
});

document.addEventListener('i18n:languageChanged', () => {
  const isOpen = !mobileMenu.classList.contains('hidden');
  setMenuToggleLabel(isOpen);
  status.textContent = '';
  form.querySelectorAll('.field-error').forEach((error) => {
    error.textContent = '';
  });
});
