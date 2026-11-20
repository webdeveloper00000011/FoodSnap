import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureDataUrl: (dataUrl: string) => void;
  onFallbackFileSelect: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCaptureDataUrl,
  onFallbackFileSelect,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [status, setStatus] = useState<'initializing' | 'ready' | 'unavailable'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(
    async (preferredFacing: 'environment' | 'user') => {
      stopStream();
      setStatus('initializing');
      setErrorMessage('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('unavailable');
        setErrorMessage('Live browser camera is not supported here. Use your device camera below.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacing },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('ready');
      } catch {
        setStatus('unavailable');
        setErrorMessage(
          'Camera access was denied or no camera was detected. Use your device camera below to take a photo.'
        );
      }
    },
    [stopStream]
  );

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    startCamera(facingMode);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream, onClose]);

  if (!isOpen) return null;

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopStream();
    onCaptureDataUrl(dataUrl);
  };

  const handleToggleFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleNativeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      stopStream();
      onFallbackFileSelect(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-cream-card rounded-t-3xl sm:rounded-3xl border border-cream-border overflow-hidden shadow-xl">
        {/* Grab handle on mobile */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-cream-border" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-border">
          <h2 id="camera-modal-title" className="font-display text-lg font-bold text-ink">
            Snap Your Meal
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-ink-muted hover:text-ink hover:bg-cream-muted transition-colors focus-visible:outline-2 focus-visible:outline-apricot-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-ink aspect-[4/3] w-full overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${status === 'ready' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          />

          {status === 'ready' && (
            <div className="pointer-events-none absolute inset-6 border border-white/30 rounded-2xl">
              <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-apricot-400 rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-apricot-400 rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-apricot-400 rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-apricot-400 rounded-br-lg" />
            </div>
          )}

          {status === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-cream px-6 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-apricot-400 border-t-transparent animate-spin" />
              <p className="text-sm font-medium">Opening camera...</p>
            </div>
          )}

          {status === 'unavailable' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cream-muted text-ink px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-apricot-100 text-apricot-600 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-sm font-semibold text-ink">Camera preview unavailable</p>
                <p className="text-xs text-ink-muted leading-relaxed">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-apricot-500 text-white text-sm font-semibold hover:bg-apricot-600 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Camera className="w-4 h-4" />
                Open Device Camera
              </button>
            </div>
          )}
        </div>

        {/* Hidden fallback native camera input */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeInputChange}
          className="hidden"
        />

        {/* Controls */}
        <div className="px-5 py-4 bg-cream-card flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleToggleFacing}
            disabled={status !== 'ready'}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-cream-border text-xs font-semibold text-ink hover:bg-cream-muted disabled:opacity-40 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Flip
          </button>

          <button
            type="button"
            onClick={handleCapture}
            disabled={status !== 'ready'}
            aria-label="Capture photo"
            className="w-16 h-16 rounded-full bg-apricot-500 hover:bg-apricot-600 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center shadow-md ring-4 ring-apricot-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apricot-600"
          >
            <span className="w-12 h-12 rounded-full border-2 border-white/90" />
          </button>

          <button
            type="button"
            onClick={() => nativeCameraInputRef.current?.click()}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-cream-border text-xs font-semibold text-ink hover:bg-cream-muted transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Camera className="w-4 h-4" />
            Native
          </button>
        </div>
      </div>
    </div>
  );
};
