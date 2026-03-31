export type LanguageCode = 'az' | 'en' | 'ru';

export interface Translation {
  common: {
    brandName: string;
    tagline: string;
    ok: string;
    cancel: string;
    error: string;
  };
  theme: {
    light: string;
    dark: string;
    system: string;
  };
  login: {
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    loginButton: string;
    signingInButton: string;
    footerText: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    logout: string;
  };
  resident: {
    title: string;
    subtitle: string;
    logout: string;
  };
}

// Import translations from JSON files
import enJSON from './locales/en.json';
import azJSON from './locales/az.json';
import ruJSON from './locales/ru.json';

const translations: Record<LanguageCode, Translation> = {
  en: enJSON as Translation,
  az: azJSON as Translation,
  ru: ruJSON as Translation,
};

export function getTranslation(lang: LanguageCode): Translation {
  return translations[lang] || translations.en;
}

export default translations;
