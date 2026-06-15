import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_CONFIG } from '../data/catalog';
import PergolaViewer from '../components/PergolaViewer';
import Stepper from '../components/Stepper';
import LayoutStep from '../components/steps/LayoutStep';
import StyleStep from '../components/steps/StyleStep';
import DimensionsStep from '../components/steps/DimensionsStep';
import FrameStep from '../components/steps/FrameStep';
import LightsStep from '../components/steps/LightsStep';
import ScreensStep from '../components/steps/ScreensStep';
import WallsStep from '../components/steps/WallsStep';
import AddOnsStep from '../components/steps/AddOnsStep';
import ReviewStep from '../components/steps/ReviewStep';
import QuoteStep from '../components/steps/QuoteStep';
import ThankYouStep from '../components/steps/ThankYouStep';
import { getSteps } from '../utils/steps';

export default function PergolaBuilder() {
  const [cfg, setCfg] = useState(() => {
    // Try to restore config from URL ?config= param
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('config');
      if (encoded) {
        const json = atob(decodeURIComponent(encoded));
        const parsed = JSON.parse(json);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {
      // ignore invalid share URLs
    }
    return DEFAULT_CONFIG;
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [maxVisitedStep, setMaxVisitedStep] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const [viewerOpenMobile, setViewerOpenMobile] = useState(true);
  
  // Compare mode state
  const [compareState, setCompareState] = useState({
    isComparing: false,
    firstConfig: null,
    secondConfig: null,
    showCompareView: false,
    activeConfigTab: 'A', // 'A' | 'B' | 'compare'
  });

  // Notify when a shared design is loaded from URL and jump to specified step
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('config');
    const stepParam = params.get('step');
    if (encoded) {
      try {
        const json = atob(decodeURIComponent(encoded));
        const parsed = JSON.parse(json);
        console.log('[ShareLink] Loaded config from URL:', parsed);
        toast.success('Shared design loaded', {
          description: `Layout: ${parsed.layout || 'unknown'}. Reviewing all details.`,
        });
      } catch (e) {
        console.error('[ShareLink] Failed to parse URL config:', e);
      }
    }
    // Navigate to requested step (default to review for shared links)
    const targetStep = stepParam || (encoded ? 'review' : null);
    if (targetStep) {
      const targetIdx = STEPS.findIndex((s) => s.id === targetStep);
      if (targetIdx >= 0) {
        setStepIdx(targetIdx);
        setMaxVisitedStep((m) => Math.max(m, targetIdx));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isKit = cfg.layout === '10x12-kit';
  const STEPS = useMemo(() => getSteps(cfg), [isKit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clamp in case the step list shrinks (e.g. switching to the 10x12 kit)
  useEffect(() => {
    if (stepIdx > STEPS.length - 1) setStepIdx(STEPS.length - 1);
    if (maxVisitedStep > STEPS.length - 1) setMaxVisitedStep(STEPS.length - 1);
  }, [STEPS.length, stepIdx, maxVisitedStep]);

  const step = submitted ? null : STEPS[Math.min(stepIdx, STEPS.length - 1)];
  const allowEdit = step && (step.id === 'screens' || step.id === 'walls' || step.id === 'dimensions');
  
  // When showing comparison on Review step, hide left viewer and expand step panel
  const isCompareView = step?.id === 'review' && compareState?.showCompareView && compareState?.firstConfig && compareState?.secondConfig;

  const next = () => {
    setStepIdx((i) => {
      const nextI = Math.min(STEPS.length - 1, i + 1);
      setMaxVisitedStep((m) => Math.max(m, nextI));
      return nextI;
    });
  };
  const back = () => setStepIdx((i) => Math.max(0, i - 1));

  const restart = () => {
    setCfg(DEFAULT_CONFIG);
    setStepIdx(0);
    setMaxVisitedStep(0);
    setSubmitted(null);
    setCompareState({ isComparing: false, firstConfig: null, secondConfig: null, showCompareView: false, activeConfigTab: 'A' });
  };

  const startCompare = () => {
    // Deep clone current config so edits to B don't mutate A
    const savedA = JSON.parse(JSON.stringify(cfg));
    setCompareState({
      isComparing: true,
      firstConfig: savedA,
      secondConfig: null,
      showCompareView: false,
      activeConfigTab: 'B',
    });
    setCfg(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    setStepIdx(0);
    setMaxVisitedStep(0);
  };

  const finishSecondConfig = (opts = {}) => {
    if (opts?.toggleOff) {
      // Hide comparison view and return to normal review
      setCompareState((prev) => ({
        ...prev,
        showCompareView: false,
      }));
      return;
    }
    // Second config is complete, save current cfg as B and show comparison inline
    setCompareState((prev) => ({
      ...prev,
      secondConfig: cfg,
      showCompareView: true,
    }));
    // Stay on Review step - CompareConfigsView will be shown inline
  };

  const goBackToFirstConfig = () => {
    // Return to first config to edit it
    if (compareState.firstConfig) {
      setCfg(compareState.firstConfig);
      setCompareState((prev) => ({
        ...prev,
        activeConfigTab: 'A',
        showCompareView: false,
      }));
    }
  };

  const resumeSecondConfig = () => {
    // Return to building second config
    if (compareState.secondConfig) {
      setCfg(compareState.secondConfig);
      setCompareState((prev) => ({
        ...prev,
        activeConfigTab: 'B',
        showCompareView: false,
      }));
    }
  };

  const switchConfig = (tab) => {
    // Save current config before switching (so latest edits are preserved)
    const currentConfig = cfg;
    
    if (tab === 'A' && compareState.firstConfig) {
      // Save B if we were editing B
      if (compareState.activeConfigTab === 'B') {
        setCompareState((prev) => ({ ...prev, secondConfig: currentConfig }));
      }
      setCfg(compareState.firstConfig);
      setCompareState((prev) => ({ ...prev, activeConfigTab: 'A', showCompareView: false }));
    } else if (tab === 'B' && compareState.secondConfig) {
      // Save A if we were editing A
      if (compareState.activeConfigTab === 'A') {
        setCompareState((prev) => ({ ...prev, firstConfig: currentConfig }));
      }
      setCfg(compareState.secondConfig);
      setCompareState((prev) => ({ ...prev, activeConfigTab: 'B', showCompareView: false }));
    } else if (tab === 'compare') {
      // Save whichever config was being edited before showing comparison
      if (compareState.activeConfigTab === 'A') {
        setCompareState((prev) => ({ ...prev, firstConfig: currentConfig, activeConfigTab: 'compare', showCompareView: true }));
      } else if (compareState.activeConfigTab === 'B') {
        setCompareState((prev) => ({ ...prev, secondConfig: currentConfig, activeConfigTab: 'compare', showCompareView: true }));
      } else {
        setCompareState((prev) => ({ ...prev, activeConfigTab: 'compare', showCompareView: true }));
      }
      const reviewIdx = STEPS.findIndex((s) => s.id === 'review');
      if (reviewIdx >= 0) {
        setStepIdx(reviewIdx);
        setMaxVisitedStep((m) => Math.max(m, reviewIdx));
      }
    }
  };

  // Scroll the step content to top on step change (mobile)
  useEffect(() => {
    const el = document.getElementById('pb-step-content');
    if (el) el.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepIdx, submitted]);

  // On 3D-edit steps the canvas is the main UI — make sure it's visible on phones
  useEffect(() => {
    if (allowEdit) setViewerOpenMobile(true);
  }, [allowEdit]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#fafaf7]" data-testid="pergola-builder">
      <Header />

      {/* Marketing Hero - Saskatchewan Weather Durability */}
      <MarketingHero />

      {/* Stepper bar */}
      {!submitted && (
        <div className="border-b border-[#ececea] bg-white sticky top-[58px] z-10">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-3">
            <Stepper steps={STEPS} current={stepIdx} onJump={setStepIdx} compareState={compareState} onSwitchConfig={switchConfig} onStartCompare={startCompare} />
          </div>
        </div>
      )}

      <main className={`flex-1 max-w-[1600px] mx-auto w-full px-4 lg:px-8 py-4 lg:py-6 grid grid-cols-1 ${isCompareView ? 'lg:grid-cols-1' : 'lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_500px]'} gap-4 lg:gap-6`}>
        {/* Viewer - hidden when in compare view */}
        <section className={`min-h-[42vh] lg:min-h-[600px] ${submitted ? 'lg:col-span-2' : ''} ${isCompareView ? 'hidden lg:hidden' : ''}`}>
          <div className="lg:hidden mb-3 flex items-center justify-between">
            <button
              data-testid="toggle-viewer-mobile"
              onClick={() => setViewerOpenMobile((v) => !v)}
              className="pb-btn pb-btn-ghost py-2 px-4 text-xs"
            >
              <Eye size={14} /> {viewerOpenMobile ? 'Hide preview' : 'Show preview'}
              <ChevronDown size={14} className={`transition-transform ${viewerOpenMobile ? 'rotate-180' : ''}`} />
            </button>
            <span className="pb-pill">
              {cfg.sections.map((s) => `${s.length}′ × ${s.width}′`).join(' + ')}
            </span>
          </div>
          <div
            className={`${
              viewerOpenMobile ? 'h-[44vh]' : 'h-0'
            } lg:h-[calc(100vh-180px)] transition-[height] duration-300 overflow-hidden`}
          >
            <PergolaViewer cfg={cfg} setCfg={setCfg} allowEdit={!!allowEdit && !submitted} stepId={step?.id} />
          </div>

          {submitted && (
            <div className="hidden lg:block mt-6 pb-card p-6">
              <ThankYouStep quote={submitted} onRestart={restart} />
            </div>
          )}
        </section>

        {/* Step panel - full width when in compare view */}
        {!submitted ? (
          <section className={`pb-card p-5 lg:p-7 flex flex-col lg:h-[calc(100vh-180px)] min-h-0 ${isCompareView ? 'lg:col-span-full' : ''}`}>
            <div id="pb-step-content" className="flex-1 overflow-y-auto pb-scroll pr-1">
              <StepBody stepId={step.id} cfg={cfg} setCfg={setCfg} stepNum={stepIdx + 1} total={STEPS.length} onSubmitted={setSubmitted} onJump={setStepIdx} compareState={compareState} startCompare={startCompare} finishSecondConfig={finishSecondConfig} restartCompare={restart} goBackToFirstConfig={goBackToFirstConfig} resumeSecondConfig={resumeSecondConfig} />
            </div>
            <div className="pb-mobile-nav">
              <NavBar
                stepIdx={stepIdx}
                total={STEPS.length}
                onBack={back}
                onNext={next}
                isQuote={step.id === 'quote'}
              />
            </div>
          </section>
        ) : (
          <section className="pb-card p-5 lg:p-7 lg:hidden">
            <ThankYouStep quote={submitted} onRestart={restart} />
          </section>
        )}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-[#ececea] bg-white/90 backdrop-blur sticky top-0 z-20" data-testid="app-header">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 h-[58px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Add your logo to public/logo.png and uncomment: */}
          {/* <img src="/logo.png" alt="Allan's Landscaping & Disposal" className="h-9 w-auto object-contain" /> */}
          <div className="flex flex-col leading-tight">
            <span className="pb-display text-[16px] font-semibold">Allan's Landscaping &amp; Disposal</span>
            <span className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368]">Premium Pergola Builder</span>
          </div>
        </div>
        <span className="pb-pill hidden sm:inline-flex" style={{ background: '#1a7a4b', color: 'white', borderColor: '#1a7a4b' }}>
          Design · Quote · Build
        </span>
      </div>
    </header>
  );
}

function StepBody({ stepId, cfg, setCfg, stepNum, total, onSubmitted, onJump, compareState, startCompare, finishSecondConfig, restartCompare, goBackToFirstConfig, resumeSecondConfig }) {
  switch (stepId) {
    case 'layout': return <LayoutStep cfg={cfg} setCfg={setCfg} stepNum={stepNum} total={total} />;
    case 'style': return <StyleStep cfg={cfg} setCfg={setCfg} stepNum={stepNum} total={total} />;
    case 'dimensions': return <DimensionsStep cfg={cfg} setCfg={setCfg} stepNum={stepNum} total={total} />;
    case 'frame': return <FrameStep cfg={cfg} setCfg={setCfg} stepNum={stepNum} total={total} />;
    case 'lights': return <LightsStep cfg={cfg} setCfg={setCfg} stepNum={stepNum} total={total} />;
    case 'screens': return <ScreensStep cfg={cfg} setCfg={setCfg} stepNum={stepNum} total={total} />;
    case 'walls': return <WallsStep cfg={cfg} setCfg={setCfg} stepNum={stepNum} total={total} />;
    case 'add-ons': return <AddOnsStep cfg={cfg} setCfg={setCfg} stepNum={stepNum} total={total} />;
    case 'review': return <ReviewStep cfg={cfg} setCfg={setCfg} stepNum={stepNum} total={total} onJump={onJump} compareState={compareState} onStartCompare={startCompare} onFinishSecond={finishSecondConfig} onRestartCompare={restartCompare} onBackToFirst={goBackToFirstConfig} onResumeSecond={resumeSecondConfig} />;
    case 'quote': return <QuoteStep cfg={cfg} stepNum={stepNum} total={total} onSubmitted={onSubmitted} compareState={compareState} />;
    default: return null;
  }
}

function NavBar({ stepIdx, total, onBack, onNext, isQuote }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-[#ececea]">
      <button
        data-testid="nav-back"
        onClick={onBack}
        disabled={stepIdx === 0}
        className="pb-btn pb-btn-ghost"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <span className="text-[11px] pb-mono uppercase tracking-widest text-[#5b6368]">
        {String(stepIdx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      {!isQuote ? (
        <button data-testid="nav-next" onClick={onNext} className="pb-btn pb-btn-primary">
          Next <ArrowRight size={15} />
        </button>
      ) : (
        <span className="text-[11px] text-[#5b6368]">Submit form to finish</span>
      )}
    </div>
  );
}

function MarketingHero() {
  return (
    <section className="bg-gradient-to-br from-[#1a3a2f] via-[#1a4d3a] to-[#1a7a4b] text-white relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6 lg:py-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded text-[10px] font-semibold uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Premium Quality
              </span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 leading-tight">
              Premium Aluminum Pergolas Built for Saskatchewan Weather
            </h1>
            <p className="hidden sm:block text-sm text-white/85 max-w-2xl leading-relaxed">
              We sell and install premium aluminum pergolas engineered to withstand heavy snow loads,
              high winds, and extreme temperature swings. Transform your outdoor space with a
              maintenance-free structure that lasts decades.
            </p>
          </div>

          <div className="hidden sm:flex flex-wrap gap-3 lg:justify-end">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div>
                <div className="text-[10px] text-white/70 uppercase tracking-wide">Snow Load</div>
                <div className="text-xs font-semibold">Heavy Duty</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-[10px] text-white/70 uppercase tracking-wide">Wind Rated</div>
                <div className="text-xs font-semibold">High Speed</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <div className="text-[10px] text-white/70 uppercase tracking-wide">Warranty</div>
                <div className="text-xs font-semibold">15+ Years</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
