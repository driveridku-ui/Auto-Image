import React, { useState, useRef, useEffect } from 'react';
import { Film, Play, Pause, RotateCcw, Download, Sparkles, AlertCircle, Info, Clapperboard } from 'lucide-react';
import { GenerationEntry } from '../types';
import { detectTheme } from '../utils/simulationRenderer';

interface VideoGeneratorProps {
  activeEntry: GenerationEntry | null;
  onGenerateVideo: (videoPrompt: string, videoCopywriting: string) => Promise<void>;
  isGeneratingVideo: boolean;
  videoProgress: string; // Loading step message
}

export default function VideoGenerator({
  activeEntry,
  onGenerateVideo,
  isGeneratingVideo,
  videoProgress,
}: VideoGeneratorProps) {
  const [videoPrompt, setVideoPrompt] = useState('Kamera perlahan memperbesar ke arah tengah, dengan efek cahaya sinematik berkedip lembut.');
  const [videoCopywriting, setVideoCopywriting] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 0 to 5 seconds
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Sync copywriting with parent entry on load
  useEffect(() => {
    if (activeEntry) {
      setVideoCopywriting(activeEntry.copywriting || '');
    }
  }, [activeEntry]);

  // Handle Playback Loop for Simulated Video
  useEffect(() => {
    if (activeEntry?.status === 'video-ready' && activeEntry.isSimulated && isPlaying) {
      // Start/Resume animation
      startTimeRef.current = performance.now() - (currentTime * 1000);
      animateSimulatedVideo();
    } else {
      // Pause
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, activeEntry]);

  // Load Image Obj for Canvas
  useEffect(() => {
    if (activeEntry?.outputImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.src = activeEntry.outputImage;
      img.onload = () => {
        imageObjRef.current = img;
        drawFrame(0); // draw initial frame
      };
    }
  }, [activeEntry?.outputImage]);

  const drawFrame = (time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageObjRef.current;

    if (!canvas || !ctx || !img || !activeEntry) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Calculate Zoom / Pan based on elapsed 5-sec cycle
    const progress = (time % 5) / 5; // 0 to 1
    
    // Ken Burns Zoom: zoom from 100% up to 112%
    const scale = 1 + progress * 0.12;
    const theme = detectTheme(activeEntry.prompt || '');

    // Focus Camera Shake/Slow motion pan
    const panX = Math.sin(progress * Math.PI * 2) * 8;
    const panY = Math.cos(progress * Math.PI) * 5;

    ctx.save();
    // Center-origin for scaling
    ctx.translate(w / 2 + panX, h / 2 + panY);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    // Draw Light Leaks / Ambient Glow over the video
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const lightGlow = ctx.createRadialGradient(
      w * 0.2 + Math.sin(progress * Math.PI) * 100, 
      h * 0.2, 
      50, 
      w * 0.2, 
      h * 0.2, 
      300 + Math.cos(progress * Math.PI * 2) * 80
    );
    lightGlow.addColorStop(0, 'rgba(129, 140, 248, 0.25)'); // Indigo
    lightGlow.addColorStop(0.5, 'rgba(244, 63, 94, 0.1)'); // Rose
    lightGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Continuous float particles (bokeh circles)
    ctx.save();
    ctx.shadowBlur = 10;
    theme.particles.forEach((color, idx) => {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      
      const seed = activeEntry.createdAt.length + idx * 7;
      for (let i = 0; i < 12; i++) {
        // Compute moving vertical scroll
        const speed = 0.5 + (i % 3) * 0.5;
        const initialY = ((seed * (i + 1) * 321) % (h + 100)) - 50;
        const movingY = (initialY - progress * h * speed + h) % h;
        
        const x = ((seed * (i + 1) * 654) % (w - 100)) + 50 + Math.sin(progress * Math.PI * 2 + i) * 15;
        const radius = 3 + (i % 4) + Math.abs(Math.sin(progress * Math.PI + idx)) * 3;
        
        ctx.beginPath();
        ctx.arc(x, movingY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();

    // Floating Overlay Copywriting Text
    const dispText = videoCopywriting || activeEntry.copywriting || '';
    if (dispText) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Compute animated opacity
      let textOpacity = 1;
      if (progress < 0.15) {
        textOpacity = progress / 0.15; // Fade-in
      } else if (progress > 0.85) {
        textOpacity = (1 - progress) / 0.15; // Fade-out
      }

      ctx.font = `600 24px ${theme.fontFamily}`;
      ctx.fillStyle = theme.textColor;
      ctx.shadowColor = theme.glowColor;
      ctx.shadowBlur = 15;
      ctx.globalAlpha = textOpacity;

      // Wrap lines
      const maxTextWidth = w - 100;
      const words = dispText.trim().split(' ');
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        if (ctx.measureText(testLine).width > maxTextWidth) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);

      // Render centering vertically in the bottom 30% area
      const startY = h - 120 - (lines.length - 1) * 20;
      lines.forEach((line, index) => {
        ctx.fillText(line, w / 2, startY + index * 40);
      });

      ctx.restore();
    }

    // Modern Overlay Cinema Bars
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, 40); // Top bar
    ctx.fillRect(0, h - 40, w, 40); // Bottom bar

    // Subtle metadata stamp overlay
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('VEO PREVIEW SIMULATOR', 30, 25);
    ctx.textAlign = 'right';
    ctx.fillText('00:0' + Math.floor(time) + 's / 00:05s', w - 30, 25);
  };

  const animateSimulatedVideo = () => {
    if (!startTimeRef.current) return;
    
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    
    if (elapsed >= 5) {
      // Loop completed, restart
      startTimeRef.current = performance.now();
      setCurrentTime(0);
      drawFrame(0);
    } else {
      setCurrentTime(elapsed);
      drawFrame(elapsed);
    }

    animationRef.current = requestAnimationFrame(animateSimulatedVideo);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    drawFrame(0);
  };

  const handleDownloadImage = () => {
    if (!activeEntry || !activeEntry.outputImage) return;
    const link = document.createElement('a');
    link.href = activeEntry.outputImage;
    link.download = `genimago-design-${activeEntry.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadVideo = () => {
    if (!activeEntry || !activeEntry.outputVideo) return;
    const link = document.createElement('a');
    link.href = activeEntry.outputVideo;
    link.download = `genimago-video-${activeEntry.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntry) return;
    onGenerateVideo(videoPrompt, videoCopywriting);
  };

  return (
    <div className="border border-white/10 bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl flex flex-col h-full" id="video-panel">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/25">
          <Clapperboard size={22} />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-sans">Jadikan Video</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Hidupkan gambar desain</p>
        </div>
      </div>

      {activeEntry ? (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          
          {/* Main Visual Arena */}
          <div className="bg-[#09090e] rounded-xl overflow-hidden border border-white/10 relative aspect-video flex items-center justify-center">
            
            {/* 1. Image is ready, but video is not requested yet */}
            {activeEntry.status === 'image-ready' && (
              <div className="w-full h-full relative group">
                <img
                  src={activeEntry.outputImage}
                  alt="Generated"
                  className="w-full h-full object-contain bg-black"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating top-right download */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="p-2.5 bg-black/80 hover:bg-cyan-600 border border-white/10 text-white rounded-lg transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center gap-1.5"
                    title="Unduh Gambar Desain"
                  >
                    <Download size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Unduh</span>
                  </button>
                </div>

                {/* Glassmorphic overlay guide bar at the bottom */}
                <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-md border-t border-white/10 p-3.5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Desain Gambar Selesai!</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 uppercase">Ubah poster ini menjadi video sinematik di bawah.</p>
                  </div>
                  <div className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded">
                    MP4 READY
                  </div>
                </div>
              </div>
            )}

            {/* 2. Loading state during generation */}
            {isGeneratingVideo && (
              <div className="p-6 text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                  <Film className="absolute text-cyan-400 animate-pulse" size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Sedang Memproses Animasi...</h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-2 animate-pulse uppercase tracking-tight">
                    {videoProgress || 'Menyusun frame grafis dan mengoptimasi transisi...'}
                  </p>
                </div>
              </div>
            )}

            {/* 3. Video ready (Simulated) */}
            {activeEntry.status === 'video-ready' && activeEntry.isSimulated && (
              <div className="w-full h-full relative flex items-center justify-center group">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full object-contain"
                />
                
                {/* Floating top-right download frame */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="p-2.5 bg-black/80 hover:bg-cyan-600 border border-white/10 text-white rounded-lg transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center gap-1.5"
                    title="Unduh Frame Gambar"
                  >
                    <Download size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Unduh Frame</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Video ready (Real API mp4) */}
            {activeEntry.status === 'video-ready' && !activeEntry.isSimulated && activeEntry.outputVideo && (
              <div className="w-full h-full relative group flex items-center justify-center">
                <video
                  src={activeEntry.outputVideo}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain bg-black"
                />

                {/* Floating top-right video file download */}
                <div className="absolute top-3 right-3 z-20">
                  <button
                    type="button"
                    onClick={handleDownloadVideo}
                    className="p-2.5 bg-black/80 hover:bg-cyan-600 border border-white/10 text-white rounded-lg transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center gap-1.5"
                    title="Unduh Video MP4"
                  >
                    <Download size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Unduh MP4</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controller Options & Output Status */}
          {activeEntry.status === 'image-ready' && !isGeneratingVideo && (
            <form onSubmit={handleSubmitVideo} className="space-y-4 pt-2">
              <div>
                <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                  <span>Prompt Gerakan Video</span>
                </label>
                <input
                  type="text"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Contoh: Kamera zoom-in perlahan, partikel neon mengambang lembut"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                  <span>Copywriting Tambahan / Penyesuaian</span>
                </label>
                <input
                  type="text"
                  value={videoCopywriting}
                  onChange={(e) => setVideoCopywriting(e.target.value)}
                  placeholder="Biarkan kosong untuk menyalin copywriting gambar"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={!videoPrompt.trim()}
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:brightness-110 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.25)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
              >
                <Film size={16} />
                Jadikan Video Sekarang
              </button>
            </form>
          )}

          {/* Render Controls for Simulated Video Playback */}
          {activeEntry.status === 'video-ready' && !isGeneratingVideo && (
            <div className="space-y-4">
              {activeEntry.isSimulated ? (
                <div className="flex items-center justify-between bg-black/60 px-4 py-3 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-all focus:outline-none"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-slate-200 transition-all focus:outline-none"
                      title="Reset"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>

                  {/* Progress tracker bar */}
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-white/10 rounded-full h-1.5 relative overflow-hidden">
                      <div
                        className="bg-cyan-500 h-1.5 rounded-full transition-all duration-75"
                        style={{ width: `${(currentTime / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    {currentTime.toFixed(1)}s / 5.0s
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/15 px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2">
                  <Play size={14} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">Video Generatif MP4 selesai diunduh dari model Veo!</span>
                </div>
              )}

              {/* Notice info */}
              <div className="bg-black/60 p-4 rounded-xl border border-white/10 flex items-start gap-3">
                <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-200 uppercase tracking-wide">Rincian Video Kreatif</p>
                  <p className="text-[11px] leading-relaxed"><strong>Prompt:</strong> {activeEntry.videoPrompt}</p>
                  {activeEntry.isSimulated && (
                    <p className="text-amber-400/90 italic text-[10px] mt-1 uppercase tracking-tight">
                      * Ditampilkan dalam Mode Simulator Kreatif (Cinematic Canvas render).
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/10 border border-white/5 border-dashed rounded-2xl text-center text-slate-500 h-64">
          <Film size={36} className="mb-2 text-cyan-400 opacity-40 animate-pulse" />
          <p className="text-xs text-slate-400 uppercase tracking-wider">Menunggu Hasil Desain Gambar</p>
          <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-tight max-w-[200px] mx-auto leading-relaxed">Fitur video akan terbuka otomatis setelah gambar hasil berhasil dibuat.</p>
        </div>
      )}
    </div>
  );
}
