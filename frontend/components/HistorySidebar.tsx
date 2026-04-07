import React from 'react';
import { SessionRecord } from '../types';
import { Clock, X, TrendingUp, Award } from 'lucide-react';
import { formatDate } from '../utils';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose }) => {
  const history: SessionRecord[] = JSON.parse(localStorage.getItem('interview_history') || '[]');

  const getScoreBand = (score: number) => {
    if (score >= 80) return { color: '#057642', bg: '#E8F5EE', label: 'Excellent' };
    if (score >= 65) return { color: '#0A66C2', bg: '#EBF3FB', label: 'Good' };
    if (score >= 50) return { color: '#B37400', bg: '#FFF7E6', label: 'Fair' };
    return { color: '#C63B3B', bg: '#FEF2F2', label: 'Needs Work' };
  };

  const avgScore = history.length > 0
    ? Math.round(history.reduce((sum, s) => sum + s.score, 0) / history.length)
    : null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <style>{`
          .history-item { animation: historyIn 0.3s ease forwards; }
          @keyframes historyIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-[#F3F2EE]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-[#191919] text-base" style={{ fontFamily: "'Georgia', serif" }}>Session History</h3>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition text-gray-400">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-[#666666]">{history.length} session{history.length !== 1 ? 's' : ''} recorded</p>
        </div>

        {/* Stats bar */}
        {avgScore !== null && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[#0A66C2]" />
              <span className="text-xs text-[#666666]">Avg score</span>
              <span className="text-sm font-black" style={{ color: getScoreBand(avgScore).color }}>{avgScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={14} className="text-[#057642]" />
              <span className="text-xs text-[#666666]">Best</span>
              <span className="text-sm font-black text-[#057642]">{Math.max(...history.map(s => s.score))}</span>
            </div>
          </div>
        )}

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-12 h-12 rounded-full bg-[#F3F2EE] flex items-center justify-center mb-3">
                <Clock size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-[#191919] mb-1">No sessions yet</p>
              <p className="text-xs text-[#666666]">Complete an interview to see your history here.</p>
            </div>
          ) : (
            history.map((session, i) => {
              const band = getScoreBand(session.score);
              return (
                <div
                  key={session.id}
                  className="history-item p-4 rounded-xl border border-gray-100 hover:border-[#0A66C2]/30 hover:bg-[#F3F2EE] transition cursor-default"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#191919] truncate">{session.role}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[#666666]">
                        <Clock size={11} />
                        <span className="text-xs">{formatDate(new Date(session.date))}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-lg font-black leading-none" style={{ color: band.color }}>{session.score}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: band.bg, color: band.color }}>
                        {band.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => { localStorage.removeItem('interview_history'); window.location.reload(); }}
              className="w-full py-2.5 text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default HistorySidebar;
