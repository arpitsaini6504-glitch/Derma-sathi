import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { speechService } from '../../services/speechService';

interface VoiceAssistProps {
  textToSpeak: string;
}

export const VoiceAssistButton: React.FC<VoiceAssistProps> = ({ textToSpeak }) => {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speechService.speak(textToSpeak, i18n.language, () => {
        setIsSpeaking(false);
      });
    }
  };

  if (!speechService.isSupported()) return null;

  return (
    <button
      className="btn btn-outline"
      onClick={toggleSpeech}
      title={isSpeaking ? t('voice.stop') : t('voice.listen')}
      style={{
        padding: '6px 12px',
        fontSize: '0.85rem',
        borderRadius: 'var(--radius-sm)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {isSpeaking ? (
        <>
          <VolumeX size={16} style={{ color: 'var(--rose-500)' }} />
          <span>{t('voice.stop')}</span>
        </>
      ) : (
        <>
          <Volume2 size={16} style={{ color: 'var(--primary-600)' }} />
          <span>{t('voice.listen')}</span>
        </>
      )}
    </button>
  );
};
