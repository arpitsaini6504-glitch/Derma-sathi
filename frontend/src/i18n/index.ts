import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './translations/en.json';
import hi from './translations/hi.json';
import { SupportedLanguage } from '../types';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  script: string;
  isRtl?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali-Assamese' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia' }
];

/**
 * Creates localized resource bundle for Indian regional languages.
 * 
 * CLINICAL SAFETY DIRECTIVE:
 * In accordance with medical device translation safety rules, clinical advice,
 * disease names, and medication warnings are NOT automatically machine-translated.
 * Instead, UI navigation, buttons, and accessibility strings use native terms,
 * while unverified clinical content uses placeholder entries with verified fallback.
 */
function buildRegionalResource(
  nativeTitle: string,
  nativeTagline: string,
  navOverrides: Record<string, string>,
  commonOverrides: Record<string, string>,
  emergencyCallout: string
) {
  return {
    ...en,
    common: {
      ...en.common,
      app_name: nativeTitle,
      tagline: nativeTagline,
      emergency_callout: emergencyCallout,
      ...commonOverrides
    },
    navigation: {
      ...en.navigation,
      ...navOverrides
    },
    home: {
      ...en.home,
      emergency_callout: emergencyCallout
    },
    // Aliases for backwards compatibility with existing component calls
    app: {
      ...en.app,
      name: nativeTitle,
      tagline: nativeTagline,
      emergency_callout: emergencyCallout
    },
    nav: {
      ...en.nav,
      ...navOverrides
    }
  };
}

// 12 Regional Language Bundles
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: {
    translation: buildRegionalResource(
      'डर्मा साथी AI',
      'बहुभाषिक AI आरोग्य आणि त्वचा साथीदार',
      {
        home: 'मुख्य पृष्ठ',
        symptoms: 'लक्षणे तपासणी',
        skin: 'त्वचा विश्लेषण',
        reports: 'वैद्यकीय अहवाल',
        prescription: 'औषधोपचार पत्रक',
        medicines: 'औषध सुरक्षा',
        lifestyle: 'दिनचर्या व काळजी',
        ayurveda: 'आयुर्वेद',
        emergency: 'आपत्कालीन',
        profile: 'माझी प्रोफाइल',
        settings: 'सेटिंग्ज',
        facilities: 'रुग्णालये व केंद्रे'
      },
      { loading: 'लोड होत आहे...', retry: 'पुन्हा प्रयत्न करा', submit: 'सबमिट करा' },
      'वैद्यकीय आणीबाणी? त्वरित 112 / 108 डायल करा.'
    )
  },
  bn: {
    translation: buildRegionalResource(
      'ডার্মা সাথী AI',
      'বহুভাষিক AI স্বাস্থ্য ও ত্বকের সাথী',
      {
        home: 'মূল পাতা',
        symptoms: 'লক্ষণ পরীক্ষা',
        skin: 'ত্বকের বিশ্লেষণ',
        reports: 'মেডিকেল রিপোর্ট',
        prescription: 'প্রেসক্রিপশন',
        medicines: 'ঔষধ নিরাপত্তা',
        lifestyle: 'লাইফস্টাইল',
        ayurveda: 'আয়ুর্বেদ',
        emergency: 'জরুরি সেবা',
        profile: 'প্রোফাইল',
        settings: 'সেটিংস',
        facilities: 'হাসপাতাল ও কেন্দ্র'
      },
      { loading: 'লোড হচ্ছে...', retry: 'আবার চেষ্টা করুন', submit: 'জমা দিন' },
      'জরুরি চিকিৎসা প্রয়োজন? অবিলম্বে 112 / 108 নম্বরে কল করুন।'
    )
  },
  ta: {
    translation: buildRegionalResource(
      'டெர்மா சாதி AI',
      'பன்மொழி AI தோல் நல்வாழ்வு துணை',
      {
        home: 'முகப்பு',
        symptoms: 'அறிகுறி பரிசோதனை',
        skin: 'தோல் பகுப்பாய்வு',
        reports: 'மருத்துவ அறிக்கைகள்',
        prescription: 'மருந்துச் சீட்டு',
        medicines: 'மருந்து பாதுகாப்பு',
        lifestyle: 'வாழ்வியல் வழிகாட்டி',
        ayurveda: 'ஆயுர்வேதம்',
        emergency: 'அவசர சிகிச்சை',
        profile: 'சுயவிவரம்',
        settings: 'அமைப்புகள்',
        facilities: 'மருத்துவமனைகள்'
      },
      { loading: 'ஏற்றுகிறது...', retry: 'மீண்டும் முயற்சிக்கவும்', submit: 'சமர்ப்பிக்கவும்' },
      'மருத்துவ அவசரநிலையா? உடனடியாக 112 / 108 ஐ அழைக்கவும்.'
    )
  },
  te: {
    translation: buildRegionalResource(
      'డెర్మా సాథీ AI',
      'బహుభాషా AI చర్మ ఆరోగ్య సహచరి',
      {
        home: 'హోమ్',
        symptoms: 'లక్షణాల తనిఖీ',
        skin: 'చర్మ విశ్లేషణ',
        reports: 'వైద్య నివేదికలు',
        prescription: 'ప్రిస్క్రిప్షన్',
        medicines: 'మందుల భద్రత',
        lifestyle: 'జీవనశైలి',
        ayurveda: 'ఆయుర్వేదం',
        emergency: 'అత్యవసర',
        profile: 'ప్రొఫైల్',
        settings: 'సెట్టింగ్‌లు',
        facilities: 'ఆసుపత్రులు'
      },
      { loading: 'లోడ్ అవుతోంది...', retry: 'మళ్లీ ప్రయత్నించండి', submit: 'సమర్పించండి' },
      'వైద్య అత్యవసర పరిస్థితియా? వెంటనే 112 / 108 కు కాల్ చేయండి.'
    )
  },
  ml: {
    translation: buildRegionalResource(
      'ഡെർമ സാഥി AI',
      'ബഹുഭാഷാ AI ത്വക്ക് ആരോഗ്യ കൂട്ടുകാരൻ',
      {
        home: 'ഹോം',
        symptoms: 'ലക്ഷണ പരിശോധന',
        skin: 'ത്വക്ക് പരിശോധന',
        reports: 'മെഡിക്കൽ റിപ്പോർട്ടുകൾ',
        prescription: 'കുറിപ്പടി',
        medicines: 'മരുന്ന് സുരക്ഷ',
        lifestyle: 'ജീവിതശൈലി',
        ayurveda: 'ആയുർവേദം',
        emergency: 'അടിയന്തരാവസ്ഥ',
        profile: 'പ്രൊഫൈൽ',
        settings: 'ക്രമീകരണങ്ങൾ',
        facilities: 'ആശുപത്രികൾ'
      },
      { loading: 'ലോഡുചെയ്യുന്നു...', retry: 'വീണ്ടും ശ്രമിക്കുക', submit: 'സമർപ്പിക്കുക' },
      'മെഡിക്കൽ അടിയന്തരാവസ്ഥയോ? ഉടൻ 112 / 108 ഡയൽ ചെയ്യുക.'
    )
  },
  kn: {
    translation: buildRegionalResource(
      'ಡರ್ಮಾ ಸಾಥಿ AI',
      'ಬಹುಭಾಷಾ AI ಚರ್ಮ ಆರೋಗ್ಯ ಒಡನಾಡಿ',
      {
        home: 'ಮುಖಪುಟ',
        symptoms: 'ರೋಗಲಕ್ಷಣ ತಪಾಸಣೆ',
        skin: 'ಚರ್ಮ ವಿಶ್ಲೇಷಣೆ',
        reports: 'ವೈದ್ಯಕೀಯ ವರದಿಗಳು',
        prescription: 'ವೈದ್ಯರ ಚೀಟಿ',
        medicines: 'ಔಷಧ ಸುರಕ್ಷತೆ',
        lifestyle: 'ಜೀವನಶೈಲಿ',
        ayurveda: 'ಆಯುರ್ವೇದ',
        emergency: 'ತುರ್ತು ಸೇವೆ',
        profile: 'ಪ್ರೊಫೈಲ್',
        settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
        facilities: 'ಆಸ್ಪತ್ರೆಗಳು'
      },
      { loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', submit: 'ಸಲ್ಲಿಸಿ' },
      'ತುರ್ತು ವೈದ್ಯಕೀಯ ಪರಿಸ್ಥಿತಿಯೇ? ತಕ್ಷಣ 112 / 108 ಗೆ ಕರೆ ಮಾಡಿ.'
    )
  },
  gu: {
    translation: buildRegionalResource(
      'ડર્મા સાથી AI',
      'બહુભાષી AI ત્વચા કલ્યાણ સાથી',
      {
        home: 'હોમ',
        symptoms: 'લક્ષણોની તપાસ',
        skin: 'ત્વચા વિશ્લેષણ',
        reports: 'તબીબી અહેવાલો',
        prescription: 'પ્રિસ્ક્રિપ્શન',
        medicines: 'દવા સુરક્ષા',
        lifestyle: 'જીવનશૈલી',
        ayurveda: 'આયુર્વેદ',
        emergency: 'કટોકટી સેવા',
        profile: 'પ્રોફાઇલ',
        settings: 'સેટિંગ્સ',
        facilities: 'હોસ્પિટલો'
      },
      { loading: 'લોડ થઈ રહ્યું છે...', retry: 'ફરી પ્રયાસ કરો', submit: 'સબમિટ કરો' },
      'તબીબી કટોકટી? તરત જ 112 / 108 ડાયલ કરો.'
    )
  },
  pa: {
    translation: buildRegionalResource(
      'ਡਰਮਾ ਸਾਥੀ AI',
      'ਬਹੁਭਾਸ਼ਾਈ AI ਚਮੜੀ ਸਿਹਤ ਸਾਥੀ',
      {
        home: 'ਮੁੱਖ ਪੰਨਾ',
        symptoms: 'ਲੱਛਣ ਜਾਂਚ',
        skin: 'ਚਮੜੀ ਵਿਸ਼ਲੇਸ਼ਣ',
        reports: 'ਮੈਡੀਕਲ ਰਿਪੋਰਟਾਂ',
        prescription: 'ਦਵਾਈ ਦਾ ਪਰਚਾ',
        medicines: 'ਦਵਾਈ ਸੁਰੱਖਿਆ',
        lifestyle: 'ਜੀਵਨ ਸ਼ੈਲੀ',
        ayurveda: 'ਆਯੁਰਵੇਦ',
        emergency: 'ਐਮਰਜੈਂਸੀ',
        profile: 'ਪ੍ਰੋਫਾਈਲ',
        settings: 'ਸੈਟਿੰਗਾਂ',
        facilities: 'ਹਸਪਤਾਲ'
      },
      { loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...', retry: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ', submit: 'ਜਮ੍ਹਾਂ ਕਰੋ' },
      'ਮੈਡੀਕਲ ਐਮਰਜੈਂਸੀ? ਤੁਰੰਤ 112 / 108 ਡਾਇਲ ਕਰੋ।'
    )
  },
  as: {
    translation: buildRegionalResource(
      'ডাৰ্মা সাথী AI',
      'বহুভাষিক AI ছালৰ স্বাস্থ্য সহযোগী',
      {
        home: 'মূল পৃষ্ঠা',
        symptoms: 'লক্ষণ পৰীক্ষা',
        skin: 'ছালৰ বিশ্লেষণ',
        reports: 'চিকিৎসা প্ৰতিবেদন',
        prescription: 'প্ৰেছক্ৰিপশ্বন',
        medicines: 'ঔষধ সুৰক্ষা',
        lifestyle: 'জীৱনশৈলী',
        ayurveda: 'আয়ুৰ্বেদ',
        emergency: 'জৰুৰীকালীন',
        profile: 'প্ৰফাইল',
        settings: 'ছেটিংছ',
        facilities: 'চিকিৎসালয়'
      },
      { loading: 'লোড হৈ আছে...', retry: 'পুনৰ চেষ্টা কৰক', submit: 'দাখিল কৰক' },
      'জৰুৰীকালীন চিকিৎসাৰ প্ৰয়োজন? তৎকালীনভাৱে 112 / 108 নম্বৰত যোগাযোগ কৰক।'
    )
  },
  or: {
    translation: buildRegionalResource(
      'ଡର୍ମା ସାଥୀ AI',
      'ବହୁଭାଷୀ AI ଚର୍ମ ସ୍ୱାସ୍ଥ୍ୟ ସାଥୀ',
      {
        home: 'ମୂଳ ପୃଷ୍ଠା',
        symptoms: 'ଲକ୍ଷଣ ପରୀକ୍ଷା',
        skin: 'ଚର୍ମ ବିଶ୍ଳେଷଣ',
        reports: 'ଡାକ୍ତରୀ ରିପୋର୍ଟ',
        prescription: 'ପ୍ରେସକ୍ରିପସନ୍',
        medicines: 'ଔଷଧ ସୁରକ୍ଷା',
        lifestyle: 'ଜୀବନଶୈଳୀ',
        ayurveda: 'ଆୟୁର୍ବେଦ',
        emergency: 'ଜରୁରୀକାଳୀନ',
        profile: 'ପ୍ରୋଫାଇଲ୍',
        settings: 'ସେଟିଙ୍ଗସ୍',
        facilities: 'ଡାକ୍ତରଖାନା'
      },
      { loading: 'ଲୋଡ୍ ହେଉଛି...', retry: 'ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ', submit: 'ଦାଖଲ କରନ୍ତୁ' },
      'ଡାକ୍ତରୀ ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି? ତୁରନ୍ତ 112 / 108 ଡାଏଲ୍ କରନ୍ତୁ।'
    )
  }
};

const savedLang = (localStorage.getItem('dermasathi_preferred_language') as SupportedLanguage) || 'en';

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

// Apply document language attribute on initialization
if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLang;
}

/**
 * Changes language globally, syncs with document DOM attributes,
 * and persists the preference to localStorage.
 */
export const changeAppLanguage = (lang: SupportedLanguage) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('dermasathi_preferred_language', lang);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    if (langInfo) {
      document.documentElement.setAttribute('data-script', langInfo.script);
    }
  }
};

/**
 * Returns standard localization headers to send with backend requests,
 * allowing the FastAPI backend to return localized AI triage responses.
 */
export const getLocalizedBackendHeaders = (): Record<string, string> => ({
  'Accept-Language': i18n.language || 'en'
});

export default i18n;
