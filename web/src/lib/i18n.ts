import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
  hi: {
    translation: {
      "nav.home": "होम",
      "nav.translate": "अनुवाद",
      "nav.babyNames": "बच्चों के नाम",
      "nav.dailyWord": "दैनिक शब्द",
      "nav.learn": "सीखें",
      "nav.aiCompanion": "एआई साथी",
      "nav.donate": "दान करें",
      
      "hero.title": "संस्कृत की सुंदरता की खोज करें",
      "hero.subtitle": "प्राचीन ज्ञान और भाषाई सुंदरता का आपका प्रवेश द्वार",
      "hero.cta": "सीखना शुरू करें",
      
      "translate.title": "संस्कृत अनुवाद",
      "translate.placeholder": "संस्कृत में अनुवाद के लिए पाठ दर्ज करें...",
      "translate.button": "अनुवाद करें",
      "translate.result": "अनुवाद",
    }
  },
  es: {
    translation: {
      "nav.home": "Inicio",
      "nav.translate": "Traducir",
      "nav.babyNames": "Nombres de Bebé",
      "nav.dailyWord": "Palabra Diaria",
      "nav.learn": "Aprender",
      "nav.aiCompanion": "Compañero IA",
      "nav.donate": "Donar",
      
      "hero.title": "Descubre la Belleza del Sánscrito",
      "hero.subtitle": "Tu puerta de entrada a la sabiduría antigua y la elegancia lingüística",
      "hero.cta": "Comenzar a Aprender",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
