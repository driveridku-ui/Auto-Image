import React, { useState } from 'react';
import { Sparkles, MessageSquare, Image as ImageIcon, Zap, AlertCircle } from 'lucide-react';
import { LibraryItem } from '../types';

interface MediaGeneratorProps {
  selectedItem: LibraryItem | null;
  onGenerate: (prompt: string, copywriting: string, mode: 'real' | 'simulation', aspectRatio: string, quality: string) => void;
  isGenerating: boolean;
  apiKeyStatus: 'checking' | 'missing' | 'configured';
}

const PRESETS = [
  { id: 'studio-editorial', label: '📸 Editorial Studio', prompt: 'Professional editorial studio photography, dramatic clean lighting, high fashion photoshoot, sharp focused details, shot on Hasselblad 100mp, highly detailed skin texture' },
  { id: 'outdoor-golden', label: '☀️ Golden Hour', prompt: 'Gaya fotografi outdoor portraiture saat golden hour, cahaya hangat alami menyinari subjek dari belakang, bokeh latar belakang yang halus dan creamy, nuansa sinematik lembut' },
  { id: 'street-moody', label: '🏙️ Moody Street', prompt: 'Moody candid street photography, natural ambient city lighting, realistic reflections on pavement, cinematic color grading, rich shadows, captured on Leica M11, 35mm lens' },
  { id: 'commercial-clean', label: '📦 Commercial Clean', prompt: 'Clean professional commercial product and advertising photoshoot, extremely sharp details, perfectly balanced softbox studio lighting, minimal solid color backdrop, high-end catalog style' },
  { id: 'analog-film', label: '🎞️ Analog Film', prompt: 'Authentic 35mm film photography photoshoot, vintage film grain texture, natural warm tones, Kodak Portra 400 look, nostalgic and raw documentary aesthetic, soft realistic shadows' },
  { id: 'monochrome', label: '🖤 Black & White', prompt: 'Elegant high-contrast black and white fine art photography, professional studio portraiture style, rich grayscale tones, dramatic shadow and light interplay, timeless classic look' },
];

export default function MediaGenerator({
  selectedItem,
  onGenerate,
  isGenerating,
  apiKeyStatus,
}: MediaGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [copywriting, setCopywriting] = useState('');
  const [mode, setMode] = useState<'real' | 'simulation'>('simulation');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [quality, setQuality] = useState<string>('hd');

  // Auto-switch mode depending on API status on mount
  React.useEffect(() => {
    if (apiKeyStatus === 'configured') {
      setMode('real');
    } else if (apiKeyStatus === 'missing') {
      setMode('simulation');
    }
  }, [apiKeyStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    onGenerate(prompt, copywriting, mode, aspectRatio, quality);
  };

  return (
    <div className="border border-white/10 bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl flex flex-col h-full justify-between" id="generator-panel">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/25">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-sans">Kanal Kreatif</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Padukan prompt &amp; tulisan</p>
          </div>
        </div>

        {/* Selected reference preview */}
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
            Referensi Aktif
          </span>
          {selectedItem ? (
            <div className="flex items-center gap-4 bg-black/60 p-3 rounded-xl border border-white/10">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-black shrink-0 border border-white/15">
                <img
                  src={selectedItem.imageData}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-200 truncate">{selectedItem.title}</h4>
                <p className="text-[10px] text-cyan-400/80 uppercase tracking-wider mt-0.5">Kategori: {selectedItem.category}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 bg-black/30 border border-white/10 border-dashed rounded-xl text-center text-slate-500 text-sm">
              <ImageIcon size={24} className="mb-2 opacity-50 text-cyan-400 animate-pulse" />
              <p className="text-xs text-slate-400 uppercase tracking-wide">Pilih gambar referensi terlebih dahulu</p>
            </div>
          )}
        </div>

        {/* Generator Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Prompt Field */}
          <div>
            <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
              <span>Visual Prompt / Ide Modifikasi</span>
            </label>

            {/* Presets Grid */}
            {selectedItem && !isGenerating && (
              <div className="mb-2.5">
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold block mb-1.5">Preset Gaya Cepat</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPrompt(p.prompt)}
                      className="px-2 py-1.5 bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 text-[10px] text-slate-300 rounded-lg text-left transition-all duration-200 font-medium truncate"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Deskripsikan bagaimana Anda ingin memodifikasi atau memperindah gambar referensi ini..."
                required
                disabled={!selectedItem || isGenerating}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm resize-none disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          {/* Copywriting Field */}
          <div>
            <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
              <span>Copywriting / Tulisan Overlay</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={copywriting}
                onChange={(e) => setCopywriting(e.target.value)}
                placeholder="Masukkan slogan atau teks yang ingin dicantumkan..."
                disabled={!selectedItem || isGenerating}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          {/* Format & Kualitas Gambar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
                Format Gambar (Rasio)
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
                {[
                  { value: '1:1', label: '1:1 Square', desc: 'Kotak' },
                  { value: '3:4', label: '3:4 Portrait', desc: 'Potret' },
                  { value: '9:16', label: '9:16 Story', desc: 'Tinggi' },
                  { value: '16:9', label: '16:9 Landscape', desc: 'Lebar' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setAspectRatio(item.value)}
                    disabled={!selectedItem || isGenerating}
                    className={`py-1.5 px-2 text-left rounded-lg transition-all border ${
                      aspectRatio === item.value
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <p className="text-[10px] leading-tight">{item.value}</p>
                    <p className="text-[8px] opacity-75">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
                Kualitas Gambar
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                disabled={!selectedItem || isGenerating}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50 transition-all font-sans cursor-pointer"
              >
                <option value="standard" className="bg-slate-950 text-slate-200">Standar - Rendering Cepat</option>
                <option value="hd" className="bg-slate-950 text-slate-200">HD Portrait - Lebih Tajam</option>
                <option value="ultra" className="bg-slate-950 text-slate-200">Ultra HD - Photoshoot Premium</option>
              </select>
              <p className="text-[8px] text-slate-500 mt-1.5 uppercase tracking-wide">
                Mempengaruhi resolusi & detail tekstur hasil akhir
              </p>
            </div>
          </div>

          {/* Engine Mode Selection */}
          <div className="pt-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
              Mode Generator
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/60 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setMode('simulation')}
                className={`py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'simulation'
                    ? 'bg-white/10 text-amber-400 shadow'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Zap size={14} />
                Simulasi
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (apiKeyStatus === 'missing') {
                    alert('Gemini API Key belum dikonfigurasi. Silakan pasang di Secrets atau gunakan Mode Simulasi.');
                    return;
                  }
                  setMode('real');
                }}
                className={`py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'real'
                    ? 'bg-cyan-600/90 text-white shadow shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-300'
                } ${apiKeyStatus === 'missing' ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={apiKeyStatus === 'missing' ? 'Memerlukan Gemini API Key' : ''}
              >
                <Sparkles size={14} />
                Koneksi Gemini
              </button>
            </div>

            {/* Hint message about API status */}
            {apiKeyStatus === 'missing' && (
              <div className="mt-2.5 flex items-start gap-2 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-400 leading-normal">
                  Kunci API tidak ditemukan. Mode Simulasi aktif dan dapat Anda gunakan sepuasnya tanpa batasan!
                </p>
              </div>
            )}
            
            {apiKeyStatus === 'configured' && (
              <div className="mt-2.5 flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                <AlertCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-400 leading-normal">
                  Integrasi aktif! Menggunakan model <code>gemini-2.5-flash-image</code> langsung dari Google AI.
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="pt-6 mt-6 border-t border-white/10">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedItem || isGenerating || !prompt.trim()}
          className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:brightness-110 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.25)] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-200 border-t-transparent rounded-full animate-spin"></div>
              <span>Sedang Merender Gambar...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Hasilkan Desain Gambar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
