import React, { useState } from 'react';
import { AppStep, UserDetails, Message } from './types';
import SetupStep from './components/SetupStep';
import InterviewStep from './components/InterviewStep';
import FeedbackStep from './components/FeedbackStep';
import HomePage from './components/HomePage';
import HistorySidebar from './components/HistorySidebar';
import { History as HistoryIcon, User, Monitor, Home, Linkedin, Github, Mail, ChevronRight, BarChart2 } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.HOME);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleStart = () => setCurrentStep(AppStep.SETUP);
  const handleSetupComplete = (details: UserDetails) => { setUserDetails(details); setCurrentStep(AppStep.INTERVIEW); };
  const handleInterviewFinish = (msgs: Message[]) => { setTranscript(msgs); setCurrentStep(AppStep.FEEDBACK); };
  const handleRestart = () => { setCurrentStep(AppStep.HOME); setUserDetails(null); setTranscript([]); };

  const stepLabels = [
    { step: AppStep.SETUP, label: '1. Setup' },
    { step: AppStep.INTERVIEW, label: '2. Interview' },
    { step: AppStep.FEEDBACK, label: '3. Feedback' },
  ];

  return (
    <>
      <Analytics />

      {/* ── MOBILE BLOCKER ─────────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen bg-[#F3F2EE] flex flex-col font-sans">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ background: '#0A66C2' }}>
            <Monitor size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#191919] mb-3 tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            Desktop Only
          </h1>
          <p className="text-[#666666] max-w-sm text-sm leading-relaxed mb-8">
            PrepScore AI requires a laptop or desktop for accurate video analysis and speech recognition.
          </p>
          <div className="bg-white p-5 rounded-xl border border-gray-200 w-full max-w-xs text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">Best browsers</p>
            {['Google Chrome (Recommended)', 'Microsoft Edge', 'Brave Browser'].map((b, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="w-6 h-6 rounded bg-[#EBF3FB] flex items-center justify-center text-xs font-bold text-[#0A66C2]">{b[0]}</div>
                <span className="text-sm text-[#191919] font-medium">{b}</span>
                {i === 0 && <span className="ml-auto text-[10px] bg-[#E8F5EE] text-[#057642] px-1.5 py-0.5 rounded font-bold">Best</span>}
              </div>
            ))}
          </div>
        </div>

        <footer className="bg-white border-t border-gray-200 py-6 px-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            {[
              { href: '', icon: <Linkedin size={16} />, hover: '#0077b5' },
              { href: '', icon: <Github size={16} />, hover: '#1B1F23' },
              { href: '', icon: <Mail size={16} />, hover: '#C63B3B' },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:text-white transition-all duration-200 border border-gray-200"
                style={{ '--hover-bg': s.hover } as any}
                onMouseEnter={e => (e.currentTarget.style.background = s.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                {s.icon}
              </a>
            ))}
          </div>
          <p className="text-xs text-[#666666]">© PrepScore AI · Built by <span className="text-[#0A66C2] font-semibold">Spider-man</span></p>
        </footer>
      </div>

      {/* ── DESKTOP APP ────────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen flex-col font-sans" style={{ background: '#F3F2EE' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&display=swap');
          * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          h1, h2, h3, [style*="Georgia"] { font-family: 'Merriweather', Georgia, serif; }
          .nav-step.active { color: #0A66C2; }
          .nav-step.done { color: #057642; }
          .page-enter { animation: pageEnter 0.4s ease forwards; }
          @keyframes pageEnter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        {/* Navbar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={handleRestart}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:opacity-90 transition" style={{ background: '#0A66C2' }}>
                <BarChart2 size={16} className="text-white" />
              </div>
              <span className="font-black text-lg text-[#191919] group-hover:text-[#0A66C2] transition tracking-tight">PrepScore AI</span>
            </div>

            {/* Progress stepper */}
            {currentStep !== AppStep.HOME && (
              <div className="flex items-center gap-1 text-xs font-semibold">
                {stepLabels.map((s, i) => {
                  const isDone = stepLabels.findIndex(x => x.step === currentStep) > i;
                  const isActive = s.step === currentStep;
                  return (
                    <React.Fragment key={s.step}>
                      <span className={`px-3 py-1.5 rounded-full transition-all ${isActive ? 'bg-[#EBF3FB] text-[#0A66C2]' : isDone ? 'text-[#057642]' : 'text-gray-400'}`}>
                        {isDone && <span className="mr-1">✓</span>}
                        {s.label}
                      </span>
                      {i < stepLabels.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {currentStep !== AppStep.HOME && (
                <button onClick={handleRestart} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#666666] hover:text-[#0A66C2] hover:bg-[#EBF3FB] rounded-lg transition">
                  <Home size={14} /> Home
                </button>
              )}
              <button onClick={() => setIsHistoryOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#666666] hover:text-[#0A66C2] hover:bg-[#EBF3FB] rounded-lg transition">
                <HistoryIcon size={14} /> History
              </button>
              {userDetails && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F2EE] border border-gray-200 rounded-full text-xs font-semibold text-[#191919]">
                  <User size={12} className="text-gray-400" />
                  <span className="truncate max-w-[120px]">{userDetails.name || 'Guest'}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-8 page-enter">
          {currentStep === AppStep.HOME && <HomePage onStart={handleStart} />}
          {currentStep === AppStep.SETUP && <SetupStep onComplete={handleSetupComplete} />}
          {currentStep === AppStep.INTERVIEW && userDetails && (
            <InterviewStep userDetails={userDetails} onFinish={handleInterviewFinish} />
          )}
          {currentStep === AppStep.FEEDBACK && userDetails && (
            <FeedbackStep userDetails={userDetails} transcript={transcript} onRestart={handleRestart} />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: '#0A66C2' }}>
                <BarChart2 size={12} className="text-white" />
              </div>
              <span className="text-sm font-black text-[#191919]">PrepScore AI</span>
            </div>
            <p className="text-xs text-[#666666]">
              Designed & developed by{' '}
              <a href="" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] font-semibold hover:underline">
                Spider-man
              </a>
              {' '}· © All rights reserved
            </p>
            <div className="flex items-center gap-2">
              {[
                { href: '', icon: <Linkedin size={14} />, hover: '#0077b5' },
                { href: '', icon: <Github size={14} />, hover: '#1B1F23' },
                { href: '', icon: <Mail size={14} />, hover: '#C63B3B' },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-200 transition-all duration-200"
                  onMouseEnter={e => { e.currentTarget.style.background = s.hover; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = s.hover; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </footer>

        {/* History sidebar */}
        <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      </div>
    </>
  );
}

export default App;
