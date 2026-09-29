import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './translations/en.json';
import hi from './translations/hi.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' }
];

// Reusable localized templates for Indian languages with fallback to Hindi/English
const createLocalizedResource = (nativeTitle: string, nativeTagline: string) => ({
  ...en,
  app: {
    ...en.app,
    name: nativeTitle,
    tagline: nativeTagline
  },
  disclaimer: hi.disclaimer,
  skin: hi.skin,
  symptoms: hi.symptoms,
  meds: hi.meds,
  wellness: hi.wellness,
  emergency: hi.emergency,
  facilities: hi.facilities,
  voice: hi.voice
});

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: createLocalizedResource('डर्मा साथी AI', 'बहुभाषिक AI आरोग्य आणि त्वचा साथीदार') },
  bn: { translation: createLocalizedResource('ডার্মা সাথী AI', 'বহুভাষিক AI স্বাস্থ্য ও ত্বকের সাথী') },
  ta: { translation: createLocalizedResource('டெர்மா சாதி AI', 'பன்மொழி AI தோல் நல்வாழ்வு துணை') },
  te: { translation: createLocalizedResource('డెర్మా సాథీ AI', 'బహుభాషా AI చర్మ ఆరోగ్య సహచరి') },
  ml: { translation: createLocalizedResource('ഡെർമ സാഥി AI', 'ബഹുഭാഷാ AI ത്വക്ക് ആരോഗ്യ കൂട്ടുകാരൻ') },
  kn: { translation: createLocalizedResource('ಡರ್ಮಾ ಸಾಥಿ AI', 'ಬಹುಭಾಷಾ AI ಚರ್ಮ ಆರೋಗ್ಯ ಒಡನಾಡಿ') },
  gu: { translation: createLocalizedResource('ડર્મા સાથી AI', 'બહુભાષી AI ત્વચા કલ્યાણ સાથી') },
  pa: { translation: createLocalizedResource('ਡਰਮਾ ਸਾਥੀ AI', 'ਬਹੁਭਾਸ਼ਾਈ AI ਚਮੜੀ ਸਿਹਤ ਸਾਥੀ') },
  as: { translation: createLocalizedResource('ডাৰ্মা সাথী AI', 'বহুভাষিক AI ছালৰ স্বাস্থ্য সহযোগী') },
  or: { translation: createLocalizedResource('ଡର୍ମା ସାଥୀ AI', 'ବହୁଭାଷୀ AI ଚର୍ମ ସ୍ୱାସ୍ଥ୍ୟ ସାଥୀ') }
};

const savedLang = localStorage.getItem('dermasathi_preferred_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
