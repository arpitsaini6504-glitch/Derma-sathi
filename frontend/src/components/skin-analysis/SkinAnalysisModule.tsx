import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Camera, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { SkinAnalysisResponse } from '../../types';
import { VoiceAssistButton } from '../common/VoiceAssistButton';

export const SkinAnalysisModule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<SkinAnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setErrorMessage(null);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setErrorMessage('Unable to access device camera. Please upload an image file instead.');
      setIsCameraActive(false);
    }
  };

  const captureCameraFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'skin_camera_capture.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.92);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await api.analyzeSkinImage(selectedFile, i18n.language);
      setResult(response);
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis could not be completed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2>{t('skin.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('skin.subtitle')}</p>
      </div>

      <div className="glass-card" style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('skin.upload_heading')}</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
          {t('skin.upload_instruction')}
        </p>

        {isCameraActive ? (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                maxHeight: '360px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#000'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button className="btn btn-primary" onClick={captureCameraFrame}>
                <Camera size={18} />
                <span>Snap Photo</span>
              </button>
              <button className="btn btn-outline" onClick={stopCamera}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-main)',
              cursor: 'pointer',
              marginBottom: '18px',
              transition: 'border-color 0.2s'
            }}
          >
            {previewUrl ? (
              <div>
                <img
                  src={previewUrl}
                  alt="Skin Preview"
                  style={{
                    maxHeight: '260px',
                    maxWidth: '100%',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'contain',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
                <div style={{ marginTop: '12px' }}>
                  <label htmlFor="skin-upload-input" className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    <RefreshCw size={16} />
                    <span>Choose Different Photo</span>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <Upload size={28} />
                </div>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>Drag & drop or select skin photo</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Supports JPEG, PNG, or WebP up to 10MB
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <label htmlFor="skin-upload-input" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    <span>{t('skin.choose_file')}</span>
                  </label>
                  <button className="btn btn-outline" onClick={startCamera}>
                    <Camera size={16} />
                    <span>{t('skin.take_photo')}</span>
                  </button>
                </div>
              </div>
            )}
            <input
              id="skin-upload-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        )}

        {selectedFile && !isCameraActive && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              className="btn btn-primary"
              disabled={isAnalyzing}
              onClick={runAnalysis}
              style={{ minWidth: '220px', padding: '12px 24px', fontSize: '1rem' }}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{t('skin.analyzing')}</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Execute 8-Stage Analysis</span>
                </>
              )}
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'hsl(350, 100%, 96%)',
              color: 'var(--rose-600)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {result && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className={`badge ${result.status === 'SUCCESS' ? 'badge-success' : 'badge-pending'}`}>
                {result.status}
              </span>
              <h3 style={{ marginTop: '8px' }}>Pipeline Assessment Report</h3>
            </div>
            <VoiceAssistButton
              textToSpeak={`${result.clinical_disclaimer}. Referral: ${result.referral.recommended_timeframe}. Instructions: ${result.referral.actionable_instructions.join('. ')}`}
            />
          </div>

          {/* Stage 1: Quality Gate Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}
          >
            <h4 style={{ fontSize: '0.92rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ color: result.quality_gate.is_acceptable ? 'var(--emerald-500)' : 'var(--rose-500)' }} />
              {t('skin.quality_metrics')} ({result.quality_gate.resolution[0]}x{result.quality_gate.resolution[1]} px)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('skin.clarity')}</span>
                <p style={{ fontWeight: 600 }}>Score: {result.quality_gate.blur_score}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('skin.lighting')}</span>
                <p style={{ fontWeight: 600 }}>Intensity: {result.quality_gate.brightness_score}/255</p>
              </div>
            </div>
            <ul style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px' }}>
              {result.quality_gate.feedback_messages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>

          {/* Model Status / Abstention Banner */}
          {result.status === 'MODEL_PENDING_INTEGRATION' && (
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-50)',
                border: '1px solid var(--primary-100)',
                color: 'var(--primary-700)',
                marginBottom: '20px'
              }}
            >
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldAlert size={18} />
                Model Staging Notice
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                The computer vision model is currently pending deployment by the ML team in <code>backend/model_store/</code>.
                The system has abstained from generating speculative predictions and has activated safe care pathways.
              </p>
            </div>
          )}

          {/* Clinical Findings (if calibrated and available) */}
          {result.findings.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4>{t('skin.findings_heading')}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Probabilities reflect algorithmic pattern similarity and do not represent medical certainty.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.findings.map((finding, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-card)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{finding.category_name}</span>
                      <span className="badge badge-pending">
                        Calibrated Confidence: {(finding.calibrated_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {finding.general_information}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referral & Safe Guidance */}
          <div
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(210, 40%, 98%)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <h4 style={{ color: 'var(--primary-700)', marginBottom: '8px' }}>{t('skin.referral_heading')}</h4>
            <p style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '10px' }}>
              {t('skin.timeframe')}: {result.referral.recommended_timeframe}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {t('skin.specialist')}: {result.referral.recommended_specialist}
            </p>
            <h5 style={{ fontSize: '0.88rem', marginBottom: '6px' }}>{t('skin.instructions')}</h5>
            <ul style={{ fontSize: '0.86rem', color: 'var(--text-muted)', paddingLeft: '20px' }}>
              {result.referral.actionable_instructions.map((inst, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{inst}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
