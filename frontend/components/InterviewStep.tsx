import React, { useState, useEffect, useRef } from 'react';
import { UserDetails, Message } from '../types';
import { sendInitialMessageWithResume, sendMessageWithVideo } from '../services/geminiService';
import { useSpeech } from '../hooks/useSpeech';
import { Mic, Send, Video, VideoOff, PhoneOff, Volume2, VolumeX, RefreshCw, AlertTriangle, Wifi } from 'lucide-react';

interface InterviewStepProps {
  userDetails: UserDetails;
  onFinish: (transcript: Message[]) => void;
}

const InterviewStep: React.FC<InterviewStepProps> = ({ userDetails, onFinish }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [questionCount, setQuestionCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef('');

  const { isListening, transcript, setTranscript, startListening, stopListening, speak, isSpeaking, cancelSpeech } = useSpeech();

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  const initializeInterview = async () => {
    setIsLoading(true);
    setInitError(null);
    try {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!isMountedRef.current) { mediaStream.getTracks().forEach(t => t.stop()); return; }
        setStream(mediaStream);
        streamRef.current = mediaStream;
      } catch (e) {
        console.warn("Camera access denied", e);
        if (isMountedRef.current) setIsVideoEnabled(false);
      }

      const { sessionId: newSessionId, reply } = await sendInitialMessageWithResume(userDetails);
      if (!isMountedRef.current) return;
      if (!newSessionId) throw new Error("No session ID returned. Please try again.");
      if (reply.startsWith("Error:")) throw new Error(reply);

      setSessionId(newSessionId);
      setMessages([{ role: 'model', text: reply, timestamp: Date.now() }]);
      setQuestionCount(1);
      setIsLoading(false);
      if (isAudioEnabled && isMountedRef.current) speak(reply);
    } catch (error: any) {
      console.error("Failed to start interview", error);
      if (isMountedRef.current) { setInitError(error.message || "Unable to connect. Please check your network."); setIsLoading(false); }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    initializeInterview();
    return () => {
      isMountedRef.current = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      cancelSpeech();
    };
  }, []);

  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach(t => { t.enabled = isVideoEnabled; });
      if (isVideoEnabled && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Video play error:", e));
      }
    }
  }, [isVideoEnabled, stream]);

  useEffect(() => { if (isListening) setInputValue(transcript); }, [transcript, isListening]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current || !isVideoEnabled) return null;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      return canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
    }
    return null;
  };

  const handleSendMessage = async () => {
    const currentTranscript = transcriptRef.current;
    const currentInput = inputValue;
    if ((!currentInput.trim() && !currentTranscript.trim()) || !sessionId) return;

    const userText = currentInput.trim() || currentTranscript.trim();
    stopListening();
    cancelSpeech();

    setMessages(prev => [...prev, { role: 'user', text: userText, timestamp: Date.now() }]);
    setInputValue('');
    setTranscript('');
    transcriptRef.current = '';
    setIsLoading(true);

    try {
      const imageFrame = captureFrame();
      const { reply: responseText } = await sendMessageWithVideo(sessionId, userText, imageFrame);
      if (!isMountedRef.current) return;

      if (responseText.startsWith("Error:")) {
        setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
      } else {
        const modelText = responseText || "Could you please elaborate?";
        setMessages(prev => [...prev, { role: 'model', text: modelText, timestamp: Date.now() }]);
        setQuestionCount(prev => prev + 1);
        if (isAudioEnabled && isMountedRef.current) speak(modelText);
      }
    } catch (error) {
      console.error("Chat error", error);
      if (isMountedRef.current) setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please try again.", timestamp: Date.now() }]);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
      setTimeout(() => handleSendMessage(), 150);
    } else {
      cancelSpeech();
      setInputValue('');
      startListening();
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    if (!newState) { stopListening(); cancelSpeech(); }
  };

  const getRollingCaption = (text: string) => {
    if (!text) return "";
    const max = 220;
    return text.length <= max ? text : "..." + text.slice(-max);
  };

  const currentCaption = getRollingCaption(transcript || inputValue);

  if (initError) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] bg-[#1B1F23] text-white rounded-2xl items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "'Georgia', serif" }}>Connection Failed</h2>
        <p className="text-gray-400 max-w-sm mb-3 text-sm leading-relaxed">
          We couldn't connect to the AI Interviewer. This usually happens if the API key is limited or the server is down.
        </p>
        <p className="text-xs text-gray-600 mb-8 font-mono bg-black/40 px-3 py-2 rounded-lg border border-white/5">
          {initError}
        </p>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-sm transition">
            Go Back
          </button>
          <button
            onClick={initializeInterview}
            className="px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition"
            style={{ background: '#0A66C2' }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#1B1F23] text-white rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      <style>{`
        .msg-bubble { animation: msgIn 0.3s ease forwards; }
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .pulse-ring { animation: pulseRing 2s ease infinite; }
        @keyframes pulseRing { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #ffffff20; border-radius: 2px; }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">PrepScore AI · Live Session</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <Wifi size={12} className="text-[#057642]" />
          <span>Q{questionCount}</span>
          <span>·</span>
          <span>{userDetails.targetRole}</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Left: Ava + chat */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/5">

          {/* Ava visualization */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            {/* Background glow */}
            {isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full bg-[#0A66C2]/10 pulse-ring" />
              </div>
            )}

            <div className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-110' : 'scale-100'}`}
              style={{ background: 'linear-gradient(135deg, #0A66C2, #004182)' }}
            >
              <span className="text-4xl md:text-5xl">🤖</span>
              {isSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-[#0A66C2]/40 animate-ping" />
                  <div className="absolute inset-[-8px] rounded-full border border-[#0A66C2]/20 animate-ping" style={{ animationDelay: '0.3s' }} />
                </>
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Ava · AI Interviewer</p>
              {isLoading ? (
                <div className="flex items-center gap-1.5 justify-center text-[#0A66C2]">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0A66C2] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/50 max-w-xs text-center leading-relaxed px-4">
                  {messages.length > 0 && messages[messages.length - 1].role === 'model'
                    ? `"${messages[messages.length - 1].text.substring(0, 90)}${messages[messages.length - 1].text.length > 90 ? '...' : ''}"`
                    : 'Listening...'}
                </p>
              )}
            </div>
          </div>

          {/* Chat transcript */}
          <div className="h-44 bg-black/30 border-t border-white/5 p-4 overflow-y-auto custom-scroll">
            {/* Loading skeleton for init */}
            {isLoading && messages.length === 0 && (
              <div className="space-y-3 animate-pulse">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            )}
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`msg-bubble flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0A66C2] text-white rounded-br-sm'
                      : 'bg-white/10 text-white/80 rounded-bl-sm'
                  }`}>
                    <span className="block text-[10px] font-bold uppercase tracking-wide opacity-60 mb-1">
                      {msg.role === 'user' ? 'You' : 'Ava'}
                    </span>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Right: User video */}
        <div className="h-48 md:h-auto md:w-80 bg-black relative shrink-0 flex flex-col">
          {isVideoEnabled ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 bg-[#0d1117]">
              <VideoOff size={28} />
              <p className="text-xs mt-2">Camera off</p>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold text-white/80 border border-white/10">
              You
            </div>
            {isListening && (
              <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-md text-xs font-bold animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                REC
              </div>
            )}
          </div>

          {currentCaption && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg border border-white/10 leading-relaxed">
                {currentCaption}
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Control bar */}
      <div className="shrink-0 bg-black/40 border-t border-white/5 px-5 py-3 flex items-center justify-between gap-4">

        {/* Left controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-2.5 rounded-lg transition-all text-sm ${isAudioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400'}`}
            title={isAudioEnabled ? "Mute Ava" : "Unmute Ava"}
          >
            {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className={`p-2.5 rounded-lg transition-all ${isVideoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400'}`}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
          </button>
        </div>

        {/* Center: Speak/Send button */}
        <button
          onClick={toggleRecording}
          disabled={isLoading && messages.length === 0}
          className={`flex items-center gap-2.5 px-7 py-3 rounded-full font-bold text-sm transition-all duration-200 shadow-lg ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 ring-4 ring-red-900/40 scale-105'
              : 'hover:opacity-90 active:scale-95 disabled:opacity-40'
          }`}
          style={{ background: isListening ? undefined : '#0A66C2' }}
        >
          {isListening ? (
            <><Send size={15} fill="currentColor" /> Tap to Send</>
          ) : (
            <><Mic size={15} /> Tap to Speak</>
          )}
        </button>

        {/* Right: End button */}
        <button
          onClick={() => { cancelSpeech(); isMountedRef.current = false; onFinish(messages); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition"
        >
          <PhoneOff size={15} />
          End
        </button>
      </div>
    </div>
  );
};

export default InterviewStep;
