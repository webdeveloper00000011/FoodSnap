import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Clock,
  Loader2,
  RotateCcw,
  ScanLine,
} from 'lucide-react';
import { CameraModal } from './components/CameraModal';
import { FoodSnapLogo } from './components/FoodSnapLogo';
import { HistoryView } from './components/HistoryView';
import { NutritionPanel } from './components/NutritionPanel';
import type { FoodAnalysisResult, FoodScanRecord } from './types/food';
import {
  clearAllHistory,
  deleteScanFromHistory,
  loadScanHistory,
  saveScanToHistory,
} from './utils/historyStorage';
import { prepareImageFromDataUrl, prepareImageFromFile, type PreparedImage } from './utils/image';

type ActivePage = 'home' | 'history';
type ScanStage = 'idle' | 'analyzing' | 'result' | 'error';

const WELCOME_IMAGE_URL = '/src/assets/images/foodsnap_welcome_bowl_1795188974543.jpg';

export default function App() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [scanStage, setScanStage] = useState<ScanStage>('idle');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string>('');
  const [welcomeImgFailed, setWelcomeImgFailed] = useState(false);

  const [history, setHistory] = useState<FoodScanRecord[]>(() => loadScanHistory());
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<FoodScanRecord | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const runFoodAnalysis = useCallback(async (prepared: PreparedImage) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPreparedImage(prepared);
    setAnalysisResult(null);
    setAnalysisError('');
    setScanStage('analyzing');
    setActivePage('home');
    setSelectedHistoryRecord(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: prepared.analysisBase64,
          mimeType: prepared.mimeType,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data && typeof data.error === 'string'
            ? data.error
            : `Analysis failed (HTTP ${response.status}). Please try again.`;
        throw new Error(message);
      }

      const result = data as FoodAnalysisResult;
      setAnalysisResult(result);
      setScanStage('result');

      if (result.isFood) {
        const record: FoodScanRecord = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          scannedAt: new Date().toISOString(),
          thumbnailDataUrl: prepared.thumbnailDataUrl,
          analysis: result,
        };
        const updatedHistory = saveScanToHistory(record);
        setHistory(updatedHistory);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Unable to analyze this image. Please try again.';
      setAnalysisError(message);
      setScanStage('error');
    }
  }, []);

  const handleFileSelected = useCallback(
    async (file: File) => {
      try {
        const prepared = await prepareImageFromFile(file);
        await runFoodAnalysis(prepared);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not read the selected image file.';
        setAnalysisError(message);
        setScanStage('error');
      }
    },
    [runFoodAnalysis]
  );

  const handleCameraDataUrl = useCallback(
    async (dataUrl: string) => {
      setIsCameraOpen(false);
      try {
        const prepared = await prepareImageFromDataUrl(dataUrl);
        await runFoodAnalysis(prepared);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not process the captured photo.';
        setAnalysisError(message);
        setScanStage('error');
      }
    },
    [runFoodAnalysis]
  );

  const handleClearScan = useCallback(() => {
    abortControllerRef.current?.abort();
    setPreparedImage(null);
    setAnalysisResult(null);
    setAnalysisError('');
    setSelectedHistoryRecord(null);
    setScanStage('idle');
    setActivePage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteScanFromHistory(id);
    setHistory(updated);
    if (selectedHistoryRecord?.id === id) {
      setSelectedHistoryRecord(null);
    }
  };

  const handleClearAllHistory = () => {
    const updated = clearAllHistory();
    setHistory(updated);
    setSelectedHistoryRecord(null);
  };

  const scrollToHowItWorks = () => {
    setActivePage('home');
    setSelectedHistoryRecord(null);
    if (scanStage !== 'idle') {
      handleClearScan();
    }
    requestAnimationFrame(() => {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  return (
    <div className="min-h-dvh flex flex-col text-ink pb-20 md:pb-0">
      {/* Top Navigation Bar (3-zone contract on desktop, compact bar on mobile) */}
      <header className="sticky top-0 z-30 h-14 bg-cream/85 backdrop-blur-md border-b border-cream-border">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setActivePage('home');
              setSelectedHistoryRecord(null);
            }}
            className="flex items-center whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-apricot-500 rounded-xl"
            aria-label="FoodSnap Home"
          >
            <FoodSnapLogo size="sm" />
          </button>

          {/* Zone 2: Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => {
                setActivePage('home');
                setSelectedHistoryRecord(null);
              }}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                activePage === 'home'
                  ? 'text-ink border-apricot-500 font-semibold'
                  : 'text-ink-muted border-transparent hover:text-ink'
              }`}
            >
              Scanner
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePage('history');
                setSelectedHistoryRecord(null);
              }}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 tabular-nums ${
                activePage === 'history'
                  ? 'text-ink border-apricot-500 font-semibold'
                  : 'text-ink-muted border-transparent hover:text-ink'
              }`}
            >
              History ({history.length})
            </button>
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="py-1 whitespace-nowrap shrink-0 text-ink-muted border-b-2 border-transparent hover:text-ink transition-colors"
            >
              How It Works
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleClearScan}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-apricot-500 hover:bg-apricot-600 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              New Scan
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-12">
        {activePage === 'history' ? (
          selectedHistoryRecord ? (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setSelectedHistoryRecord(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-cream-card border border-cream-border text-sm font-semibold text-ink hover:bg-cream-muted transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to History
              </button>

              <NutritionPanel
                analysis={selectedHistoryRecord.analysis}
                imageUrl={selectedHistoryRecord.thumbnailDataUrl}
                scannedAt={selectedHistoryRecord.scannedAt}
                onClear={handleClearScan}
                clearLabel="Scan Another Food"
              />
            </div>
          ) : (
            <HistoryView
              records={history}
              onSelectRecord={(record) => {
                setSelectedHistoryRecord(record);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDeleteRecord={handleDeleteHistoryItem}
              onClearAllHistory={handleClearAllHistory}
              onGoToScanner={handleClearScan}
            />
          )
        ) : (
          /* Home & Scanner Flow */
          <div className="space-y-14 sm:space-y-20">
            {scanStage === 'idle' && (
              <>
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch"
                >
                  {/* Welcome & Camera Action */}
                  <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-3">
                        <FoodSnapLogo size="lg" showWordmark={false} />
                        <span className="text-sm font-semibold text-sage-800">
                          Welcome to FoodSnap
                        </span>
                      </div>

                      <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-ink tracking-tight leading-[1.08] text-balance">
                        Snap your meal.{' '}
                        <span className="italic font-semibold text-apricot-600">
                          Know what&apos;s on your plate.
                        </span>
                      </h1>

                      <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-xl">
                        Point your camera at any dish, snack, or bowl. FoodSnap uses Gemini AI to recognize the meal, reveal possible ingredients, and estimate nutrition in seconds.
                      </p>
                    </div>

                    {/* Primary Camera Action + Quiet Secondary Shortcut */}
                    <div className="flex flex-wrap items-center gap-3.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="min-h-[54px] w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-apricot-500 hover:bg-apricot-600 active:scale-[0.99] text-white font-semibold text-base transition-all inline-flex items-center justify-center gap-2.5 card-soft-shadow whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apricot-600"
                      >
                        <Camera className="w-5 h-5" aria-hidden="true" />
                        Take Photo
                      </button>

                      {history.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActivePage('history')}
                          className="min-h-[54px] w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-sage-100 hover:bg-sage-200 active:scale-[0.99] text-sage-800 border border-sage-200 font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                        >
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          View History ({history.length})
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-cream-border flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                      <span>Dish Identification</span>
                      <span aria-hidden="true">·</span>
                      <span>Possible Ingredients</span>
                      <span aria-hidden="true">·</span>
                      <span>Estimated Calories &amp; Macros</span>
                    </div>
                  </div>

                  {/* Editorial Food Photography Frame */}
                  <div className="lg:col-span-6 flex flex-col">
                    <div className="flex-1 bg-cream-card border border-cream-border rounded-3xl overflow-hidden card-soft-shadow relative aspect-[4/3] lg:aspect-auto lg:min-h-[420px]">
                      {!welcomeImgFailed ? (
                        <img
                          src={WELCOME_IMAGE_URL}
                          alt="Fresh Mediterranean grain bowl with avocado, roasted sweet potato, cherry tomatoes, and greens"
                          referrerPolicy="no-referrer"
                          onError={() => setWelcomeImgFailed(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-apricot-50 via-cream to-sage-100">
                          <FoodSnapLogo size="lg" />
                          <p className="text-sm text-ink-muted mt-3">
                            Ready to recognize your next meal
                          </p>
                        </div>
                      )}

                      {/* Measured Contrast Scrim with Sample Visual Preview */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent p-6 sm:p-7 text-cream">
                        <p className="text-xs font-medium text-sage-200">
                          Mediterranean Grain Bowl · Sample Breakdown
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-display text-lg sm:text-xl font-bold text-white">
                            Avocado, Sweet Potato &amp; Farro
                          </p>
                          <p className="font-mono text-xs sm:text-sm text-apricot-200 tabular-nums">
                            490 kcal · 18g protein · 11g fiber
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Recent Scans Preview (if any exist) */}
                {history.length > 0 && (
                  <section className="space-y-5 pt-4 border-t border-cream-border">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                        Recent Scans
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActivePage('history')}
                        className="min-h-[44px] px-3 text-sm font-semibold text-apricot-600 hover:text-apricot-900 transition-colors whitespace-nowrap shrink-0"
                      >
                        See All ({history.length})
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {history.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActivePage('history');
                            setSelectedHistoryRecord(item);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-left bg-cream-card border border-cream-border hover:border-apricot-200 rounded-2xl p-3.5 flex items-center gap-3.5 card-soft-shadow transition-colors focus-visible:outline-2 focus-visible:outline-apricot-500"
                        >
                          <img
                            src={item.thumbnailDataUrl}
                            alt={item.analysis.foodName}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-cover shrink-0 bg-cream-muted"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="font-display font-bold text-sm text-ink truncate">
                              {item.analysis.foodName}
                            </p>
                            <p className="text-xs text-ink-muted truncate">
                              {item.analysis.cuisineOrCategory}
                            </p>
                            <p className="font-mono text-xs font-semibold text-sage-800 tabular-nums">
                              {item.analysis.nutrition.calories} kcal ·{' '}
                              {item.analysis.nutrition.proteinGrams}g protein
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Airy 3-Column Editorial "How FoodSnap Works" */}
                <section
                  id="how-it-works"
                  className="pt-8 border-t border-cream-border space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                      How FoodSnap Works
                    </h2>
                    <p className="text-sm text-ink-muted">
                      From camera shutter to full nutritional clarity.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-cream-border bg-cream-card border border-cream-border rounded-3xl card-soft-shadow">
                    <div className="p-6 sm:p-8 space-y-2.5">
                      <p className="font-display italic text-2xl font-semibold text-apricot-500">
                        01
                      </p>
                      <h3 className="font-display text-lg font-bold text-ink">
                        Snap your plate
                      </h3>
                      <p className="text-sm text-ink-muted leading-relaxed">
                        Open the camera right at the table and capture a clear photo of your meal or drink.
                      </p>
                    </div>

                    <div className="p-6 sm:p-8 space-y-2.5">
                      <p className="font-display italic text-2xl font-semibold text-sage-600">
                        02
                      </p>
                      <h3 className="font-display text-lg font-bold text-ink">
                        Gemini visual breakdown
                      </h3>
                      <p className="text-sm text-ink-muted leading-relaxed">
                        AI identifies the dish name, describes its preparation, lists probable ingredients, and estimates macros.
                      </p>
                    </div>

                    <div className="p-6 sm:p-8 space-y-2.5">
                      <p className="font-display italic text-2xl font-semibold text-apricot-500">
                        03
                      </p>
                      <h3 className="font-display text-lg font-bold text-ink">
                        Review &amp; scan again
                      </h3>
                      <p className="text-sm text-ink-muted leading-relaxed">
                        Every scan is stored in your History tab, and one tap clears the screen to scan another food.
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {scanStage === 'analyzing' && preparedImage && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-3xl mx-auto bg-cream-card border border-cream-border rounded-3xl overflow-hidden card-soft-shadow"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 items-center">
                  <div className="sm:col-span-5 relative aspect-[4/3] sm:aspect-square bg-cream-muted">
                    <img
                      src={preparedImage.analysisDataUrl}
                      alt="Food photo being analyzed"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-ink/20 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-cream-card/95 flex items-center justify-center shadow-md">
                        <Loader2 className="w-6 h-6 text-apricot-500 animate-spin" />
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-7 p-6 sm:p-8 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-sage-800">
                      <ScanLine className="w-4 h-4 text-sage-600" />
                      <span>Analyzing photo with Gemini AI</span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-balance">
                      Identifying dish, ingredients, and nutrition...
                    </h2>

                    <p className="text-sm text-ink-muted leading-relaxed">
                      Examining visible ingredients, cooking style, and portion size to prepare your breakdown.
                    </p>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleClearScan}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl border border-cream-border text-sm font-semibold text-ink hover:bg-cream-muted transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Cancel &amp; Clear
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {scanStage === 'error' && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-3xl mx-auto bg-cream-card border border-cream-border rounded-3xl p-6 sm:p-8 card-soft-shadow"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {preparedImage && (
                    <div className="sm:col-span-5 rounded-2xl overflow-hidden border border-cream-border aspect-[4/3]">
                      <img
                        src={preparedImage.analysisDataUrl}
                        alt="Captured food photo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className={`${preparedImage ? 'sm:col-span-7' : 'sm:col-span-12'} space-y-4`}>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-apricot-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Could not complete analysis</span>
                    </div>

                    <h2 className="font-display text-2xl font-bold text-ink">
                      Something went wrong
                    </h2>

                    <p className="text-sm text-ink-muted leading-relaxed">{analysisError}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {preparedImage && (
                        <button
                          type="button"
                          onClick={() => void runFoodAnalysis(preparedImage)}
                          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-apricot-500 hover:bg-apricot-600 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                        >
                          Try Again
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleClearScan}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-sage-100 hover:bg-sage-200 text-sage-800 text-sm font-semibold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Clear &amp; Scan Another Food
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {scanStage === 'result' && analysisResult && preparedImage && (
              <NutritionPanel
                analysis={analysisResult}
                imageUrl={preparedImage.analysisDataUrl}
                onClear={handleClearScan}
                clearLabel="Clear & Scan Another Food"
              />
            )}
          </div>
        )}
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t border-cream-border bg-cream/70 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-ink-muted">
          <span>FoodSnap · AI Food Recognition &amp; Nutrition</span>
          <span>Nutrition values are visual estimates for informational use.</span>
        </div>
      </footer>

      {/* Mobile Fixed Thumb-Zone Bottom Tab Bar (56px height) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-cream-card/95 backdrop-blur-md border-t border-cream-border grid grid-cols-2 items-center"
      >
        <button
          type="button"
          onClick={() => {
            setActivePage('home');
            setSelectedHistoryRecord(null);
          }}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activePage === 'home' ? 'text-apricot-600 font-semibold' : 'text-ink-muted'
          }`}
        >
          <Camera className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] tracking-tight">Scan</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActivePage('history');
            setSelectedHistoryRecord(null);
          }}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activePage === 'history' ? 'text-apricot-600 font-semibold' : 'text-ink-muted'
          }`}
        >
          <Clock className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] tracking-tight tabular-nums">
            History ({history.length})
          </span>
        </button>
      </nav>

      {/* Live Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureDataUrl={(dataUrl) => void handleCameraDataUrl(dataUrl)}
        onFallbackFileSelect={(file) => {
          setIsCameraOpen(false);
          void handleFileSelected(file);
        }}
      />
    </div>
  );
}
