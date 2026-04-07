import React, { useEffect, useState } from 'react';
import { UserDetails, Message, FeedbackReport } from '../types';
import { generateDetailedFeedback } from '../services/geminiService';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { CheckCircle, AlertTriangle, BookOpen, Copy, Loader2, FileText, Star, RefreshCw, Activity, TrendingUp, Award, ChevronRight } from 'lucide-react';

interface FeedbackStepProps {
  userDetails: UserDetails;
  transcript: Message[];
  onRestart: () => void;
}

// Loading Skeleton Components
const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

const ScoreCardSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
    <SkeletonBlock className="h-4 w-24" />
    <SkeletonBlock className="h-10 w-16" />
    <SkeletonBlock className="h-3 w-full" />
    <SkeletonBlock className="h-3 w-3/4" />
  </div>
);

const FeedbackStep: React.FC<FeedbackStepProps> = ({ userDetails, transcript, onRestart }) => {
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'resume' | 'roadmap'>('overview');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await generateDetailedFeedback(transcript, userDetails);
        setReport(result);
        const historyItem = { id: Date.now().toString(), date: new Date().toISOString(), role: userDetails.targetRole, score: result.overallScore };
        const existing = JSON.parse(localStorage.getItem('interview_history') || '[]');
        localStorage.setItem('interview_history', JSON.stringify([historyItem, ...existing].slice(0, 10)));
      } catch (err) {
        console.error(err);
        setError("Failed to generate report. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handleCopy = () => {
    if (!report) return;
    const text = `PrepScore AI Report\n${userDetails.targetRole}\nOverall Score: ${report.overallScore}/100\nATS Score: ${report.resumeAnalysis.atsScore}/100\n\n${report.overallSummary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreBand = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: '#057642', bg: '#E8F5EE', border: '#057642' };
    if (score >= 65) return { label: 'Good', color: '#0A66C2', bg: '#EBF3FB', border: '#0A66C2' };
    if (score >= 50) return { label: 'Fair', color: '#B37400', bg: '#FFF7E6', border: '#B37400' };
    return { label: 'Needs Work', color: '#C63B3B', bg: '#FEF2F2', border: '#C63B3B' };
  };

  const renderCustomTick = ({ payload, x, y, textAnchor }: any) => {
    const text = payload.value;
    let lines = [text];
    if (text.length > 14) {
      const mid = Math.floor(text.length / 2);
      const spacePos = text.lastIndexOf(' ', mid + 5) || text.indexOf(' ', mid - 5);
      if (spacePos > 0) lines = [text.slice(0, spacePos), text.slice(spacePos + 1)];
    }
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={lines.length > 1 ? -8 : 3} textAnchor={textAnchor} fill="#666666" fontSize={11} fontWeight={600}>
          {lines.map((line, i) => <tspan x={0} dy={i * 14} key={i}>{line}</tspan>)}
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full pb-12">
        <style>{`
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          .shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        `}</style>

        {/* Header skeleton */}
        <div className="bg-[#1B1F23] rounded-2xl p-10 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-3">
              <div className="h-3 w-32 shimmer rounded" />
              <div className="h-8 w-64 shimmer rounded" />
              <div className="h-3 w-48 shimmer rounded" />
            </div>
            <div className="w-28 h-28 shimmer rounded-full" style={{ background: '#2a2f35' }} />
          </div>
          <div className="grid grid-cols-5 gap-4 pt-6 border-t border-white/10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-2 w-full shimmer rounded" style={{ background: '#2a2f35' }} />
                <div className="h-6 w-12 shimmer rounded" style={{ background: '#2a2f35' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[...Array(3)].map((_, i) => <ScoreCardSkeleton key={i} />)}
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-gray-100 border-t-[#0A66C2] rounded-full animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-[#191919] mb-2" style={{ fontFamily: "'Georgia', serif" }}>Analyzing Your Interview</h3>
          <p className="text-sm text-[#666666] max-w-sm">AI is scoring your answers, evaluating visual presence, and analyzing your resume alignment...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="bg-red-50 p-8 rounded-2xl border border-red-100 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-[#191919] mb-2">Analysis Failed</h3>
          <p className="text-[#666666] mb-6 text-sm">{error || "Something went wrong."}</p>
          <button onClick={onRestart} className="w-full px-4 py-3 bg-[#0A66C2] text-white font-bold rounded-xl text-sm hover:opacity-90 transition">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const chartData = report.categoryFeedback.map(c => ({ subject: c.category, A: c.score, fullMark: 100 }));
  const overallBand = getScoreBand(report.overallScore);
  const atsBand = getScoreBand(report.resumeAnalysis.atsScore);

  return (
    <div className="max-w-6xl mx-auto w-full pb-12">
      <style>{`
        .feedback-fade { animation: feedbackIn 0.5s ease forwards; }
        @keyframes feedbackIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .tab-btn { transition: all 0.2s ease; }
        .tab-btn.active { color: #0A66C2; border-bottom-color: #0A66C2; }
      `}</style>

      {/* Toast */}
      {copied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#191919] text-white px-5 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2.5 text-sm font-medium feedback-fade border border-white/10">
          <CheckCircle size={16} className="text-[#057642]" />
          Report copied to clipboard
        </div>
      )}

      {/* Hero banner */}
      <div className="bg-[#1B1F23] text-white rounded-2xl overflow-hidden mb-8 feedback-fade">
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">PrepScore Report</p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1" style={{ fontFamily: "'Georgia', serif" }}>
                {userDetails.name || 'Your'} Interview Results
              </h2>
              <p className="text-sm text-white/50">{userDetails.targetRole} · {userDetails.experienceLevel}</p>
            </div>

            {/* Score circle */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div
                  className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 font-black"
                  style={{ borderColor: overallBand.color, background: `${overallBand.color}20` }}
                >
                  <span className="text-3xl leading-none">{report.overallScore}</span>
                  <span className="text-xs text-white/60 mt-0.5">/100</span>
                </div>
                <p className="text-xs font-bold mt-2 uppercase tracking-wide" style={{ color: overallBand.color }}>{overallBand.label}</p>
                <p className="text-[10px] text-white/40">Interview Score</p>
              </div>
              <div className="text-center">
                <div
                  className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 font-black"
                  style={{ borderColor: atsBand.color, background: `${atsBand.color}20` }}
                >
                  <span className="text-3xl leading-none">{report.resumeAnalysis.atsScore}</span>
                  <span className="text-xs text-white/60 mt-0.5">/100</span>
                </div>
                <p className="text-xs font-bold mt-2 uppercase tracking-wide" style={{ color: atsBand.color }}>{atsBand.label}</p>
                <p className="text-[10px] text-white/40">ATS Score</p>
              </div>
            </div>
          </div>

          {/* Category scores strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-6 border-t border-white/10">
            {report.categoryFeedback.map((cat, i) => {
              const band = getScoreBand(cat.score);
              return (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black" style={{ color: band.color }}>{cat.score}</div>
                  <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{cat.category}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="px-8 md:px-10 pb-8">
          <p className="text-sm text-white/60 leading-relaxed border-t border-white/10 pt-6">{report.overallSummary}</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-8 feedback-fade">
        {[
          { id: 'overview', label: 'Overview', icon: <Activity size={14} /> },
          { id: 'questions', label: 'Q&A Feedback', icon: <BookOpen size={14} /> },
          { id: 'resume', label: 'Resume Analysis', icon: <FileText size={14} /> },
          { id: 'roadmap', label: 'Learning Path', icon: <TrendingUp size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-btn flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-[#0A66C2] ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0A66C2] border border-[#0A66C2]/30 rounded-lg hover:bg-[#EBF3FB] transition">
            <Copy size={12} />
            Copy Report
          </button>
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8 feedback-fade">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Radar chart */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[#191919] mb-4 flex items-center gap-2">
                <Activity size={16} className="text-[#0A66C2]" />
                Skill Radar
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={renderCustomTick} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#0A66C2" fill="#0A66C2" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[#191919] mb-4 flex items-center gap-2">
                <Award size={16} className="text-[#0A66C2]" />
                Category Breakdown
              </h3>
              <div className="space-y-4">
                {report.categoryFeedback.map((cat, i) => {
                  const band = getScoreBand(cat.score);
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-[#191919]">{cat.category}</span>
                        <span className="text-xs font-bold" style={{ color: band.color }}>{cat.score}/100</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${cat.score}%`, background: band.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Skill gaps */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-[#191919] mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#0A66C2]" />
              Skill Gap Analysis
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.skillGaps.map((skill, i) => {
                const colors: Record<string, { bg: string; text: string; border: string }> = {
                  strong: { bg: '#E8F5EE', text: '#057642', border: '#057642' },
                  weak: { bg: '#FFF7E6', text: '#B37400', border: '#B37400' },
                  missing: { bg: '#FEF2F2', text: '#C63B3B', border: '#C63B3B' },
                };
                const c = colors[skill.status] || colors.weak;
                return (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                    style={{ background: c.bg, color: c.text, borderColor: `${c.border}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.text }} />
                    {skill.skill}
                    <span className="opacity-60 text-[10px] uppercase">{skill.status}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {report.categoryFeedback.map((cat, i) => {
              const band = getScoreBand(cat.score);
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-[#0A66C2]/30 transition">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-[#191919] text-sm leading-tight w-3/4">{cat.category}</h4>
                    <span className="text-sm font-black px-2 py-0.5 rounded-lg" style={{ color: band.color, background: band.bg }}>{cat.score}</span>
                  </div>
                  {cat.strengths[0] && (
                    <div className="mb-2">
                      <p className="text-[10px] font-bold text-[#057642] uppercase mb-1 flex items-center gap-1"><CheckCircle size={9} /> Strength</p>
                      <p className="text-xs text-[#666666] leading-relaxed">{cat.strengths[0]}</p>
                    </div>
                  )}
                  {cat.improvements[0] && (
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 uppercase mb-1 flex items-center gap-1"><AlertTriangle size={9} /> To Improve</p>
                      <p className="text-xs text-[#666666] leading-relaxed">{cat.improvements[0]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-5 feedback-fade">
          {report.questionFeedback.map((q, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-start gap-4 p-6 border-b border-gray-50 bg-[#F3F2EE]">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#1B1F23] text-white text-xs font-black flex items-center justify-center">
                  Q{i + 1}
                </span>
                <p className="font-bold text-[#191919] text-sm leading-relaxed">{q.question}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-[#F3F2EE] p-4 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Your Answer</p>
                  <p className="text-sm text-[#191919] italic leading-relaxed">"{q.userAnswer}"</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#E8F5EE] rounded-xl border border-[#057642]/20">
                    <p className="text-[10px] font-bold text-[#057642] uppercase mb-2 flex items-center gap-1"><CheckCircle size={9} /> What Worked</p>
                    <p className="text-xs text-[#191919] leading-relaxed">{q.goodPoints}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={9} /> Missed Opportunities</p>
                    <p className="text-xs text-[#191919] leading-relaxed">{q.missingPoints}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border" style={{ background: '#EBF3FB', borderColor: '#0A66C2' + '30' }}>
                  <p className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1" style={{ color: '#0A66C2' }}>
                    <Star size={9} fill="currentColor" /> Better Approach
                  </p>
                  <p className="text-xs text-[#191919] leading-relaxed">{q.improvedExample}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Resume */}
      {activeTab === 'resume' && (
        <div className="space-y-6 feedback-fade">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100" style={{ background: '#EBF3FB' }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-[#191919] flex items-center gap-2 text-sm"><FileText size={15} className="text-[#0A66C2]" /> ATS Score</h3>
                  <span className="text-3xl font-black" style={{ color: atsBand.color }}>{report.resumeAnalysis.atsScore}</span>
                </div>
                <p className="text-xs text-[#666666]">Keyword compatibility with {userDetails.targetRole}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-[#057642] uppercase mb-2">Matched Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.resumeAnalysis.strengths.slice(0, 5).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-[#E8F5EE] text-[#057642] border border-[#057642]/20">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">Critical Gaps</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.resumeAnalysis.weaknesses.slice(0, 4).map((w, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-100">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl border" style={{ background: '#EBF3FB', borderColor: '#0A66C2' + '30' }}>
                  <p className="text-[10px] font-bold mb-1 flex items-center gap-1" style={{ color: '#0A66C2' }}><Star size={9} fill="currentColor" /> Quick Win</p>
                  <p className="text-xs text-[#191919] leading-relaxed">{report.resumeAnalysis.suggestions[0]}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[#191919] mb-5 flex items-center gap-2 text-sm"><ChevronRight size={15} className="text-[#0A66C2]" /> All Suggestions</h3>
              <div className="space-y-3">
                {report.resumeAnalysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F3F2EE] transition">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white mt-0.5" style={{ background: '#0A66C2' }}>
                      {i + 1}
                    </span>
                    <p className="text-sm text-[#191919] leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="feedback-fade">
          <div className="bg-[#1B1F23] rounded-2xl p-8 md:p-10 text-white">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Personalized for you</p>
              <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Your Learning Roadmap</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {report.learningRoadmap.map((item, i) => (
                <div key={i} className="flex flex-col gap-3 bg-white/5 hover:bg-white/10 p-5 rounded-xl border border-white/10 transition group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white group-hover:scale-110 transition-transform" style={{ background: '#0A66C2' }}>
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white mb-2 leading-tight">{item.skill}</h4>
                    <p className="text-xs text-white/50 leading-relaxed">{item.action}</p>
                    <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white/10 text-white/60">
                      {item.resourceType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="flex justify-center gap-4 mt-10 feedback-fade">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm text-white transition hover:opacity-90 active:scale-95"
          style={{ background: '#0A66C2' }}
        >
          <RefreshCw size={15} />
          New Interview
        </button>
      </div>
    </div>
  );
};

export default FeedbackStep;
