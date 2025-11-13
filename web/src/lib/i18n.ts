import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

const TRANSLATIONS_API = import.meta.env.VITE_TRANSLATIONS_API_ENDPOINT?.trim() ||
  'https://vaan-wordlist.keyvez.workers.dev/api/translations';

// Fallback English translations (loaded immediately)
const resources = {
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.translate": "Translate",
      "nav.babyNames": "Baby Names",
      "nav.dailyWord": "Daily Word",
      "nav.learn": "Learn",
      "nav.aiCompanion": "AI Companion",
      "nav.donate": "Donate",

      // Hero Section
      "hero.title": "Discover the Beauty of Sanskrit",
      "hero.subtitle": "Your gateway to ancient wisdom and linguistic elegance",
      "hero.cta": "Start Learning",

      // Translation
      "translate.title": "Sanskrit Translation",
      "translate.placeholder": "Enter text to translate to Sanskrit...",
      "translate.button": "Translate",
      "translate.result": "Translation",

      // Baby Names
      "babyNames.title": "Sanskrit Baby Names",
      "babyNames.subtitle": "Find the perfect name with deep meaning for your baby",
      "babyNames.search": "Search for names...",
      "babyNames.gender": "Gender",
      "babyNames.all": "All",
      "babyNames.boy": "Boy",
      "babyNames.girl": "Girl",
      "babyNames.meaning": "Meaning",
      "babyNames.pronunciation": "Pronunciation",

      // Daily Word
      "daily.title": "Daily Sanskrit Word",
      "daily.shareOn": "Share on",
      "daily.download": "Download",
      "daily.word": "Word",
      "daily.pronunciation": "Pronunciation",
      "daily.meaning": "Meaning",
      "daily.story": "Story",

      // Learning
      "learn.title": "Learn Sanskrit",
      "learn.flashcards": "Flashcards",
      "learn.quiz": "Quiz",
      "learn.exercises": "Exercises",
      "learn.progress": "Your Progress",
      "learn.start": "Start Learning",
      "learn.continue": "Continue",
      "learn.complete": "Complete",
      "learn.flip": "Flip",
      "learn.next": "Next",
      "learn.previous": "Previous",
      "learn.checkAnswer": "Check Answer",

      // AI Companion
      "ai.title": "Sanskrit Saṃvāda",
      "ai.subtitle": "Your AI companion for learning and practicing Sanskrit",
      "ai.mode": "Mode",
      "ai.practice": "Practice",
      "ai.story": "Story",
      "ai.composition": "Composition",
      "ai.script": "Script",
      "ai.devanagari": "Devanāgarī",
      "ai.roman": "Roman",
      "ai.placeholder": "Ask me anything in Sanskrit or English...",
      "ai.send": "Send",

      // Donation
      "donate.title": "Support Sanskrit Revival",
      "donate.subtitle": "Help us preserve and promote the Sanskrit language",
      "donate.oneTime": "One-Time",
      "donate.monthly": "Monthly",
      "donate.custom": "Custom Amount",
      "donate.button": "Donate Now",
      "donate.secure": "Secure payment via Stripe",

      // Settings
      "settings.title": "Settings",
      "settings.theme": "Theme",
      "settings.light": "Light",
      "settings.dark": "Dark",
      "settings.language": "Language",
      "settings.font": "Font",

      // Common
      "common.loading": "Loading...",
      "common.error": "Error",
      "common.success": "Success",
      "common.close": "Close",
      "common.save": "Save",
      "common.cancel": "Cancel",
    }
  },
};

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: `${TRANSLATIONS_API}/{{lng}}`,
      parse: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          // API returns { translations: { key: value } }
          return parsed.translations || {};
        } catch (e) {
          console.error('Failed to parse translations:', e);
          return {};
        }
      },
      crossDomain: true,
    },
    // Load translations on language change
    load: 'currentOnly',
    // Don't load English from backend (we have it locally)
    preload: [],
  });

export default i18n;
