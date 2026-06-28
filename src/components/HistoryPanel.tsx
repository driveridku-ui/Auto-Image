import React from 'react';
import { History, Trash2, Calendar, Sparkles, Film } from 'lucide-react';
import { GenerationEntry } from '../types';

interface HistoryPanelProps {
  history: GenerationEntry[];
  onSelectEntry: (entry: GenerationEntry) => void;
  onDeleteEntry: (id: string) => Promise<void>;
  activeEntry: GenerationEntry | null;
}

export default function HistoryPanel({
  history,
  onSelectEntry,
  onDeleteEntry,
  activeEntry,
}: HistoryPanelProps) {
  return (
    <div className="border border-white/10 bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl" id="history-panel">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/25">
            <History size={22} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-sans">Riwayat Kreasi</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Koleksi hasil rilis desain Anda</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 bg-black/60 text-cyan-400 rounded-full border border-white/10 uppercase tracking-wider">
          Total: {history.length}
        </span>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-center text-sm">
          <History size={32} className="mb-2 opacity-30 text-cyan-400" />
          <p className="text-xs text-slate-400 uppercase tracking-wider">Belum ada riwayat pembuatan.</p>
          <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-tight">Selesaikan rilis gambar di atas untuk menyimpannya.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
          {history.map((entry) => {
            const isActive = activeEntry?.id === entry.id;
            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`group relative rounded-xl overflow-hidden cursor-pointer bg-black/40 border transition-all duration-300 ${
                  isActive
                    ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.35)] shadow-lg'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Visual Cards Grid */}
                <div className="flex h-24">
                  {/* Reference Image */}
                  <div className="w-1/2 relative bg-black border-r border-white/10">
                    <img
                      src={entry.referenceImage}
                      alt="Ref"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-1 left-1 bg-black/80 px-1 rounded text-[8px] text-slate-400">
                      Ref
                    </div>
                  </div>

                  {/* Generated Image */}
                  <div className="w-1/2 relative bg-black">
                    {entry.outputImage ? (
                      <img
                        src={entry.outputImage}
                        alt="Out"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black text-[10px] text-slate-600">
                        Pending
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-cyan-950/80 px-1 rounded text-[8px] text-cyan-400 flex items-center gap-0.5">
                      Hasil
                    </div>
                  </div>
                </div>

                {/* Details info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar size={10} />
                      {new Date(entry.createdAt).toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {/* Status badges */}
                    <div className="flex gap-1">
                      {entry.outputImage && (
                        <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1 rounded border border-cyan-500/20" title="Image Generated">
                          <Sparkles size={9} />
                        </span>
                      )}
                      {entry.status === 'video-ready' && (
                        <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1 rounded border border-purple-500/20" title="Video Ready">
                          <Film size={9} />
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-medium line-clamp-1">
                    "{entry.prompt}"
                  </p>
                  
                  {entry.copywriting && (
                    <p className="text-[10px] text-cyan-400 italic truncate">
                      Teks: "{entry.copywriting}"
                    </p>
                  )}
                </div>

                {/* Hover overlay deletion */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Hapus riwayat kreasi ini?')) {
                      onDeleteEntry(entry.id);
                    }
                  }}
                  className="absolute top-2 right-2 bg-black/85 hover:bg-red-500 hover:text-white text-slate-400 p-1.5 rounded-lg border border-white/10 transition-all opacity-0 group-hover:opacity-100 shadow"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
