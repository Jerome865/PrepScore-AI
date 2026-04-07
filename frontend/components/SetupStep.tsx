import React, { useState } from 'react';
import { UserDetails } from '../types';
import { fileToBase64 } from '../utils';
import { Upload, Briefcase, ChevronDown, Check, Play, FileText, X } from 'lucide-react';

interface SetupStepProps {
  onComplete: (details: UserDetails) => void;
}

const SetupStep: React.FC<SetupStepProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<UserDetails>({
    name: '',
    targetRole: '',
    experienceLevel: 'Fresher / Student',
    industry: '',
    language: 'English',
    jobDescription: '',
    resumeFile: null,
    resumeBase64: null,
    resumeMimeType: null,
  });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<number>(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, resumeFile: file, resumeBase64: base64, resumeMimeType: file.type }));
      } catch (err) {
        console.error("Error reading file", err);
        alert("Failed to read file.");
      }
    }
  };

  const clearResume = () => {
    setFormData(prev => ({ ...prev, resumeFile: null, resumeBase64: null, resumeMimeType: null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetRole) { alert("Please enter a target role."); return; }
    setLoading(true);
    setTimeout(() => { onComplete(formData); setLoading(false); }, 800);
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#191919] placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-150";
  const focusRing = "focus:ring-[#0A66C2]";

  return (
    <div className="max-w-2xl mx-auto w-full">
      <style>{`
        .setup-fade { animation: setupFadeIn 0.4s ease forwards; }
        @keyframes setupFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .section-tab.active { border-color: #0A66C2; color: #0A66C2; background: #EBF3FB; }
        .section-tab { transition: all 0.2s ease; }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8 setup-fade">
        <p className="text-xs font-bold uppercase tracking-widest text-[#0A66C2] mb-3">Step 1 of 3</p>
        <h2 className="text-3xl font-black text-[#191919] tracking-tight mb-2" style={{ fontFamily: "'Georgia', serif" }}>
          Configure Your Session
        </h2>
        <p className="text-sm text-[#666666]">The more context you provide, the more realistic your interview will be.</p>
      </div>

      <form onSubmit={handleSubmit} className="setup-fade">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Section tabs */}
          <div className="flex border-b border-gray-100 bg-[#F3F2EE]">
            {[
              { n: 1, label: 'Profile' },
              { n: 2, label: 'Context' },
            ].map(tab => (
              <button
                key={tab.n}
                type="button"
                onClick={() => setActiveSection(tab.n)}
                className={`section-tab flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent ${activeSection === tab.n ? 'active' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab.n}. {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">

            {/* Section 1: Profile */}
            {activeSection === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#191919] uppercase tracking-wide mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`${inputClass} ${focusRing}`}
                      placeholder="e.g. Alex Johnson"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#191919] uppercase tracking-wide mb-2">
                      Target Role <span className="text-red-500 normal-case font-normal">*required</span>
                    </label>
                    <div className="relative">
                      <Briefcase size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                      <input
                        type="text"
                        name="targetRole"
                        required
                        value={formData.targetRole}
                        onChange={handleInputChange}
                        className={`${inputClass} ${focusRing} pl-10`}
                        placeholder="e.g. Senior Product Manager"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#191919] uppercase tracking-wide mb-2">Experience Level</label>
                    <div className="relative">
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleInputChange}
                        className={`${inputClass} ${focusRing} appearance-none cursor-pointer pr-10`}
                      >
                        <option>Fresher / Student</option>
                        <option>0-1 years</option>
                        <option>1-3 years</option>
                        <option>3-5 years</option>
                        <option>5-10 years</option>
                        <option>10+ years (Executive)</option>
                      </select>
                      <ChevronDown size={15} className="absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#191919] uppercase tracking-wide mb-2">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className={`${inputClass} ${focusRing}`}
                      placeholder="e.g. Technology, Finance"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection(2)}
                    className="w-full py-3.5 rounded-lg font-bold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2"
                    style={{ background: '#0A66C2' }}
                  >
                    Continue to Context
                    <ChevronDown size={16} className="rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            )}

            {/* Section 2: Context */}
            {activeSection === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#191919] uppercase tracking-wide mb-2">
                    Job Description <span className="text-gray-400 normal-case font-normal text-xs">(optional but recommended)</span>
                  </label>
                  <textarea
                    name="jobDescription"
                    rows={5}
                    value={formData.jobDescription}
                    onChange={handleInputChange}
                    className={`${inputClass} ${focusRing} resize-none`}
                    placeholder="Paste the job description here. Ava will tailor her questions to match the role requirements."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#191919] uppercase tracking-wide mb-2">
                    Resume <span className="text-gray-400 normal-case font-normal text-xs">(PDF or image)</span>
                  </label>

                  {formData.resumeFile ? (
                    <div className="flex items-center justify-between p-4 bg-[#EBF3FB] border border-[#0A66C2]/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#0A66C2' }}>
                          <FileText size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#191919] truncate max-w-[200px]">{formData.resumeFile.name}</p>
                          <p className="text-xs text-[#0A66C2]">Ready for ATS analysis</p>
                        </div>
                      </div>
                      <button type="button" onClick={clearResume} className="p-1.5 rounded-full hover:bg-white/60 transition text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="resume-upload" className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#0A66C2] hover:bg-[#F3F2EE] transition-all duration-200 group">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#EBF3FB] transition-colors">
                        <Upload size={18} className="text-gray-400 group-hover:text-[#0A66C2] transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[#191919]">Drop your resume here</p>
                        <p className="text-xs text-gray-400 mt-0.5">or click to browse — PDF, PNG, JPG</p>
                      </div>
                      <input id="resume-upload" type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection(1)}
                    className="px-5 py-3.5 rounded-lg font-bold text-sm text-[#666666] border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-lg font-bold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: loading ? '#666' : '#0A66C2' }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Setting up your session...
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="currentColor" />
                        Start Video Interview
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trust note */}
        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
          <Check size={12} className="text-[#057642]" />
          Camera and microphone access required · Data processed securely
        </p>
      </form>
    </div>
  );
};

export default SetupStep;
