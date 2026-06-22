const I18N_STORAGE_KEY = 'greensantara.language';
const DEFAULT_LANGUAGE = 'vi';
const LOCALE_PATH = 'locales';

const localeCache = new Map();
let activeLanguage = localStorage.getItem(I18N_STORAGE_KEY) || DEFAULT_LANGUAGE;
let activeTranslations = {};

// Each pair maps a data attribute to the DOM property/attribute it should update.
const ATTRIBUTE_MAP = [
  ['data-i18n', 'textContent'],
  ['data-i18n-placeholder', 'placeholder'],
  ['data-i18n-alt', 'alt'],
  ['data-i18n-title', 'title'],
  ['data-i18n-aria-label', 'aria-label'],
  ['data-i18n-content', 'content']
];

async function loadTranslations(language) {
  if (localeCache.has(language)) {
    return localeCache.get(language);
  }

  const response = await fetch(`${LOCALE_PATH}/${language}.json`);
  if (!response.ok) {
    throw new Error(`Unable to load locale: ${language}`);
  }

  const translations = await response.json();
  localeCache.set(language, translations);
  return translations;
}

// Preserve the original English HTML as a safe fallback for missing keys.
function getFallback(element, attributeName, valueType) {
  const fallbackName = `${attributeName}-fallback`;

  if (!element.hasAttribute(fallbackName)) {
    const fallbackValue = valueType === 'textContent'
      ? element.textContent
      : element.getAttribute(valueType);

    element.setAttribute(fallbackName, fallbackValue || '');
  }

  return element.getAttribute(fallbackName) || '';
}

function translate(key, fallback = '') {
  return activeTranslations[key] ?? fallback ?? key;
}

function applyTranslations() {
  ATTRIBUTE_MAP.forEach(([attributeName, valueType]) => {
    document.querySelectorAll(`[${attributeName}]`).forEach((element) => {
      const key = element.getAttribute(attributeName);
      const fallback = getFallback(element, attributeName, valueType);
      const translatedValue = translate(key, fallback);

      if (valueType === 'textContent') {
        element.textContent = translatedValue;
      } else {
        element.setAttribute(valueType, translatedValue);
      }
    });
  });

  document.documentElement.lang = activeLanguage;
  updateLanguageSwitchers();
}

// Keep all switchers synchronized when one language changes.
function updateLanguageSwitchers() {
  let currentLabel = activeLanguage.toUpperCase();
  let currentFlag = '';

  document.querySelectorAll('[data-language-option]').forEach((option) => {
    const isActive = option.dataset.lang === activeLanguage;
    option.classList.toggle('active', isActive);
    option.setAttribute('aria-pressed', String(isActive));

    if (isActive) {
      const labelKey = option.dataset.languageLabel;
      currentLabel = labelKey ? translate(labelKey, option.textContent.trim()) : option.textContent.trim();
      currentFlag = option.dataset.flag || '';
    }
  });

  document.querySelectorAll('[data-language-current]').forEach((element) => {
    element.textContent = currentLabel;
  });

  document.querySelectorAll('[data-language-flag]').forEach((element) => {
    element.textContent = currentFlag;
  });
}

function closeLanguageMenus() {
  document.querySelectorAll('[data-language-menu]').forEach((menu) => {
    menu.classList.add('hidden');
  });

  document.querySelectorAll('[data-language-toggle]').forEach((toggle) => {
    toggle.setAttribute('aria-expanded', 'false');
  });
}

async function setLanguage(language) {
  try {
    activeTranslations = await loadTranslations(language);
    activeLanguage = language;
    localStorage.setItem(I18N_STORAGE_KEY, language);
    applyTranslations();
    closeLanguageMenus();
    document.dispatchEvent(new CustomEvent('i18n:languageChanged', {
      detail: { language, translations: activeTranslations }
    }));
  } catch (error) {
    console.warn(error.message);

    if (language !== DEFAULT_LANGUAGE) {
      await setLanguage(DEFAULT_LANGUAGE);
    }
  }
}

// Switchers are data-driven, so adding a new language only requires a new JSON
// file and a button with data-lang="<locale>" in the HTML.
function bindLanguageSwitchers() {
  document.querySelectorAll('[data-language-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const switcher = toggle.closest('[data-language-switcher]');
      const menu = switcher?.querySelector('[data-language-menu]');
      const isOpen = menu && !menu.classList.contains('hidden');

      closeLanguageMenus();

      if (menu && !isOpen) {
        menu.classList.remove('hidden');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.querySelectorAll('[data-language-option]').forEach((option) => {
    option.addEventListener('click', () => {
      const language = option.dataset.lang;
      if (language) setLanguage(language);
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-language-switcher]')) {
      closeLanguageMenus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLanguageMenus();
    }
  });
}

async function initI18n() {
  bindLanguageSwitchers();
  await setLanguage(activeLanguage);
}

window.i18n = {
  t: translate,
  setLanguage,
  getLanguage: () => activeLanguage
};

document.addEventListener('DOMContentLoaded', initI18n);
