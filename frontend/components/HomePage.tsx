import React, { useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle, BarChart2, Video, Mic, FileText, Users, TrendingUp, Award, ChevronRight } from 'lucide-react';

interface HomePageProps {
  onStart: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col">
      <style>{`
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.animate-in { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        .stat-card:hover { transform: translateY(-2px); }
        .feature-card:hover { border-color: #0A66C2; }
        .feature-card:hover .feature-icon { background: #0A66C2; color: white; }
        .step-line { background: linear-gradient(90deg, #0A66C2, #057642); }
      `}</style>

      {/* Hero Section */}
      <div ref={heroRef} className="relative bg-[#1B1F23] text-white rounded-2xl overflow-hidden mb-12 px-8 md:px-16 py-16 md:py-24">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}/>
        {/* Blue glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10" style={{
          background: 'radial-gradient(circle, #0A66C2 0%, transparent 70%)',
          transform: 'translate(30%, -30%)'
        }}/>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-10" style={{
          background: 'radial-gradient(circle, #057642 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)'
        }}/>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold uppercase tracking-widest text-blue-300 mb-8 bg-white/5 reveal">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
            AI-Powered Interview Coaching
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-6 reveal reveal-delay-1" style={{ fontFamily: "'Georgia', serif" }}>
            Interview with
            <span className="block text-[#0A66C2]">Confidence.</span>
            <span className="block">Get Hired.</span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 max-w-xl leading-relaxed reveal reveal-delay-2">
            PrepScore AI runs realistic video interviews, analyzes your body language, coaches your speech, and gives you an ATS resume score — all before the real thing.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 reveal reveal-delay-3">
            <button
              onClick={onStart}
              className="group flex items-center gap-3 px-8 py-4 rounded-lg font-bold text-white text-base transition-all duration-200 hover:opacity-90 active:scale-95 shadow-lg"
              style={{ background: '#0A66C2' }}
            >
              Start Free Practice
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <CheckCircle size={14} className="text-[#057642]" />
              No signup required
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-6 mt-16 pt-12 border-t border-white/10 reveal reveal-delay-4">
          {[
            { value: '94%', label: 'Report improved confidence' },
            { value: '3.2×', label: 'More interview callbacks' },
            { value: '< 60s', label: 'To your first mock session' },
          ].map((stat, i) => (
            <div key={i} className="stat-card transition-transform duration-200">
              <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-16">
        <div className="text-center mb-10 reveal">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0A66C2] mb-3">What PrepScore AI Does</p>
          <h2 className="text-3xl font-black text-[#191919] tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            Everything you need to ace the interview
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <Video size={22} />,
              title: 'Visual Presence Analysis',
              desc: 'Real-time monitoring of eye contact, posture, and facial expressions. Ava coaches you live during the session.',
              color: '#0A66C2',
            },
            {
              icon: <Mic size={22} />,
              title: 'Speech & Clarity Coaching',
              desc: 'AI transcribes your answers, identifies filler words, and evaluates the depth and clarity of your responses.',
              color: '#057642',
            },
            {
              icon: <FileText size={22} />,
              title: 'Resume & ATS Scoring',
              desc: 'Upload your resume and get an ATS compatibility score, keyword gap analysis, and actionable suggestions.',
              color: '#0A66C2',
            },
            {
              icon: <BarChart2 size={22} />,
              title: 'Detailed Score Report',
              desc: 'Receive a structured report with category scores, question-by-question breakdown, and a learning roadmap.',
              color: '#057642',
            },
            {
              icon: <TrendingUp size={22} />,
              title: 'Adaptive Questioning',
              desc: "Ava adapts questions to your role, experience level, and the job description you provide.",
              color: '#0A66C2',
            },
            {
              icon: <Award size={22} />,
              title: 'Skill Gap Identification',
              desc: 'Understand exactly which skills are strong, weak, or missing for your target role.',
              color: '#057642',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="feature-card reveal bg-white border border-gray-200 rounded-xl p-6 transition-all duration-200 cursor-default"
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              <div
                className="feature-icon w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-200"
                style={{ background: `${f.color}15`, color: f.color }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-[#191919] mb-2 text-base">{f.title}</h3>
              <p className="text-sm text-[#666666] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-[#F3F2EE] rounded-2xl p-10 md:p-14 mb-12 reveal">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0A66C2] mb-3">Simple Process</p>
          <h2 className="text-3xl font-black text-[#191919] tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            From setup to offer in 3 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-6 left-[20%] right-[20%] h-px step-line opacity-30" />
          {[
            { n: '01', title: 'Configure Your Session', desc: 'Enter your target role, experience level, and optionally paste the job description or upload your resume.' },
            { n: '02', title: 'The Live Interview', desc: 'Ava conducts a real video interview. Speak naturally — she monitors your answers and body language live.' },
            { n: '03', title: 'Get Your PrepScore', desc: 'Receive a full report with an overall score, ATS analysis, question feedback, and a personalized roadmap.' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm mb-5 shadow-lg relative z-10"
                style={{ background: i === 1 ? '#0A66C2' : '#1B1F23' }}
              >
                {step.n}
              </div>
              <h3 className="font-bold text-[#191919] text-base mb-2">{step.title}</h3>
              <p className="text-sm text-[#666666] leading-relaxed max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="reveal bg-[#1B1F23] rounded-2xl p-10 md:p-14 text-center text-white mb-4">
        <h2 className="text-3xl font-black tracking-tight mb-4" style={{ fontFamily: "'Georgia', serif" }}>
          Ready to PrepScore your next interview?
        </h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
          Join thousands of candidates who practice smarter. Free, instant, and no signup required.
        </p>
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-lg font-bold text-white text-base transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ background: '#0A66C2' }}
        >
          Begin Your Session
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default HomePage;
