import React, { useState, useEffect } from 'react';
import { 
  getLibraryItems, 
  saveLibraryItem, 
  deleteLibraryItem, 
  getHistory, 
  saveHistoryEntry, 
  deleteHistoryEntry 
} from './utils/indexedDB';
import { STOCK_LIBRARY } from './utils/stockLibrary';
import { LibraryItem, GenerationEntry } from './types';
import { renderSimulatedImage } from './utils/simulationRenderer';
import ImageLibrary from './components/ImageLibrary';
import MediaGenerator from './components/MediaGenerator';
import VideoGenerator from './components/VideoGenerator';
import HistoryPanel from './components/HistoryPanel';
import { Sparkles, Library, Clapperboard, MonitorPlay, Check, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [history, setHistory] = useState<GenerationEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<GenerationEntry | null>(null);
  
  // Status states
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'missing' | 'configured'>('checking');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load configuration and data on mount
  useEffect(() => {
    checkApiKeyStatus();
    loadLibraryAndHistory();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setApiKeyStatus(data.apiKeyConfigured ? 'configured' : 'missing');
      } else {
        setApiKeyStatus('missing');
      }
    } catch (e) {
      console.error('Failed to check API status:', e);
      setApiKeyStatus('missing');
    } finally {
      setIsCheckingApiKey(false);
    }
  };

  const loadLibraryAndHistory = async () => {
    try {
      // Get custom items from IndexedDB
      const customItems = await getLibraryItems();
      // Merge with default stock assets
      const allItems = [...STOCK_LIBRARY, ...customItems];
      setLibraryItems(allItems);

      // Default select the first item
      if (allItems.length > 0 && !selectedLibraryItem) {
        setSelectedLibraryItem(allItems[0]);
      }

      // Load generation history
      const savedHistory = await getHistory();
      setHistory(savedHistory);
      
      // Load most recent active entry if present
      if (savedHistory.length > 0 && !activeEntry) {
        setActiveEntry(savedHistory[0]);
      }
    } catch (error) {
      console.error('Error loading library / history:', error);
    }
  };

  // 1. Add image to reference library
  const handleAddLibraryItem = async (title: string, category: string, base64Data: string) => {
    const newItem: LibraryItem = {
      id: `custom-${Date.now()}`,
      title,
      category,
      imageData: base64Data,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveLibraryItem(newItem);
      await loadLibraryAndHistory();
      setSelectedLibraryItem(newItem);
    } catch (error) {
      console.error('Failed to save custom item:', error);
      alert('Gagal menyimpan gambar ke library.');
    }
  };

  // 2. Delete library item
  const handleDeleteLibraryItem = async (id: string) => {
    try {
      await deleteLibraryItem(id);
      if (selectedLibraryItem?.id === id) {
        setSelectedLibraryItem(null);
      }
      await loadLibraryAndHistory();
    } catch (error) {
      console.error('Failed to delete library item:', error);
    }
  };

  // 3. Generate design image (Real Gemini API or Simulator Fallback)
  const handleGenerateImage = async (
    prompt: string,
    copywriting: string,
    mode: 'real' | 'simulation',
    aspectRatio: string = '1:1',
    quality: string = 'hd'
  ) => {
    if (!selectedLibraryItem) return;
    
    setIsGeneratingImage(true);
    setErrorMessage(null);

    const tempId = `gen-${Date.now()}`;
    const newEntry: GenerationEntry = {
      id: tempId,
      referenceId: selectedLibraryItem.id,
      referenceTitle: selectedLibraryItem.title,
      referenceImage: selectedLibraryItem.imageData,
      prompt,
      copywriting,
      aspectRatio,
      quality,
      status: 'generating-image',
      createdAt: new Date().toISOString(),
    };

    // Put placeholder in active view immediately
    setActiveEntry(newEntry);

    try {
      if (mode === 'real') {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceImage: selectedLibraryItem.imageData,
            prompt,
            copywriting,
            aspectRatio,
            quality,
          }),
        });

        const result = await response.json();

        if (result.success && result.data?.imageUrl) {
          const finalEntry: GenerationEntry = {
            ...newEntry,
            outputImage: result.data.imageUrl,
            status: 'image-ready',
            isSimulated: false,
          };
          await saveHistoryEntry(finalEntry);
          setActiveEntry(finalEntry);
        } else {
          // Real call failed - show clear error details but let them auto-fallback to simulated so their experience stays perfect!
          const errorMsg = result.message || 'Model gagal menghasilkan gambar. Silakan gunakan Mode Simulasi.';
          setErrorMessage(errorMsg);
          
          if (confirm(`Gagal menggunakan Koneksi Gemini: ${errorMsg}\n\nApakah Anda ingin menghasilkan karya ini menggunakan Mode Simulasi Kreatif (Failsafe)?`)) {
            // Auto-fallback
            await triggerSimulatedImage(newEntry, prompt, copywriting, aspectRatio, quality);
          } else {
            const failedEntry: GenerationEntry = {
              ...newEntry,
              status: 'failed',
              error: errorMsg,
            };
            setActiveEntry(failedEntry);
          }
        }
      } else {
        // Run fully client-side creative simulation
        await triggerSimulatedImage(newEntry, prompt, copywriting, aspectRatio, quality);
      }
    } catch (err: any) {
      console.error('Error in generation process:', err);
      const errorStr = err.message || 'Terjadi gangguan jaringan.';
      setErrorMessage(errorStr);
      
      if (confirm(`Koneksi terganggu: ${errorStr}\n\nIngin beralih ke Mode Simulasi offline otomatis?`)) {
        await triggerSimulatedImage(newEntry, prompt, copywriting, aspectRatio, quality);
      } else {
        const failedEntry: GenerationEntry = {
          ...newEntry,
          status: 'failed',
          error: errorStr,
        };
        setActiveEntry(failedEntry);
      }
    } finally {
      setIsGeneratingImage(false);
      await loadLibraryAndHistory();
    }
  };

  const triggerSimulatedImage = async (
    entry: GenerationEntry,
    prompt: string,
    copywriting: string,
    aspectRatio: string = '1:1',
    quality: string = 'hd'
  ) => {
    // Generate simulated artwork using client-side canvas blending
    const blendedUrl = await renderSimulatedImage(entry.referenceImage, prompt, copywriting, aspectRatio, quality);
    const simulatedEntry: GenerationEntry = {
      ...entry,
      outputImage: blendedUrl,
      status: 'image-ready',
      isSimulated: true,
    };
    await saveHistoryEntry(simulatedEntry);
    setActiveEntry(simulatedEntry);
  };

  // 4. Convert generated image to video (Real Veo API or Canvas Animation Simulator)
  const handleGenerateVideo = async (videoPrompt: string, videoCopywriting: string) => {
    if (!activeEntry || !activeEntry.outputImage) return;

    setIsGeneratingVideo(true);
    setVideoProgress('Menghubungkan ke studio render...');

    try {
      if (activeEntry.isSimulated) {
        // Simulated video setup - renders instant in 1.5s
        setVideoProgress('Menganalisis skema warna desain...');
        await sleep(500);
        setVideoProgress('Menyiapkan efek gerak kamera (Ken Burns)...');
        await sleep(500);
        setVideoProgress('Merender partikel debu sinematik...');
        await sleep(500);

        const updatedEntry: GenerationEntry = {
          ...activeEntry,
          videoPrompt,
          videoCopywriting: videoCopywriting || activeEntry.copywriting,
          status: 'video-ready',
          isSimulated: true,
        };

        await saveHistoryEntry(updatedEntry);
        setActiveEntry(updatedEntry);
      } else {
        // Real API call to Veo video generator
        setVideoProgress('Memulai antrean generator video Google Veo...');
        
        const triggerRes = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: activeEntry.outputImage,
            prompt: videoPrompt,
            copywriting: videoCopywriting || activeEntry.copywriting,
          }),
        });

        const triggerResult = await triggerRes.json();

        if (triggerResult.success && triggerResult.data?.operationName) {
          const operationName = triggerResult.data.operationName;
          
          // Poll operation status until complete
          let isDone = false;
          let pollAttempts = 0;
          const maxPolls = 40; // up to ~3.5 minutes

          while (!isDone && pollAttempts < maxPolls) {
            pollAttempts++;
            setVideoProgress(`Merender video di Google Cloud (Percobaan ${pollAttempts})...`);
            await sleep(5000); // Poll every 5s

            const statusRes = await fetch('/api/video-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName }),
            });

            const statusResult = await statusRes.json();
            if (statusResult.success && statusResult.data?.done) {
              isDone = true;
              
              if (statusResult.data.error) {
                throw new Error(`Cloud Render Error: ${statusResult.data.error.message || 'Render gagal'}`);
              }
            }
          }

          if (!isDone) {
            throw new Error('Proses render video melebihi batas waktu (timeout).');
          }

          // Video is done! Download mp4 stream
          setVideoProgress('Menyusun hasil rilis video dan mengunduh MP4...');
          
          const downloadRes = await fetch('/api/video-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });

          if (!downloadRes.ok) {
            throw new Error('Gagal mendownload hasil akhir video dari bucket.');
          }

          const blob = await downloadRes.blob();
          const localVideoUrl = URL.createObjectURL(blob);

          const completedEntry: GenerationEntry = {
            ...activeEntry,
            videoPrompt,
            videoCopywriting: videoCopywriting || activeEntry.copywriting,
            outputVideo: localVideoUrl,
            videoOperationName: operationName,
            status: 'video-ready',
            isSimulated: false,
          };

          await saveHistoryEntry(completedEntry);
          setActiveEntry(completedEntry);
        } else {
          throw new Error(triggerResult.message || 'Gagal mengirim instruksi ke model Veo.');
        }
      }
    } catch (error: any) {
      console.error('Error generating video:', error);
      const errStr = error.message || 'Rilis video terhenti.';
      alert(`Gagal merender video: ${errStr}\n\nSistem akan mengaktifkan Mode Simulator Canvas otomatis.`);
      
      // Error fallback - instantly save as simulated video so they still get the loop!
      const fallbackEntry: GenerationEntry = {
        ...activeEntry,
        videoPrompt,
        videoCopywriting: videoCopywriting || activeEntry.copywriting,
        status: 'video-ready',
        isSimulated: true,
      };

      await saveHistoryEntry(fallbackEntry);
      setActiveEntry(fallbackEntry);
    } finally {
      setIsGeneratingVideo(false);
      setVideoProgress('');
      await loadLibraryAndHistory();
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // 5. Select entry from history to place on stage
  const handleSelectEntry = (entry: GenerationEntry) => {
    setActiveEntry(entry);
    
    // Also find and select the associated library reference image if possible
    const associatedLibItem = libraryItems.find(item => item.id === entry.referenceId);
    if (associatedLibItem) {
      setSelectedLibraryItem(associatedLibItem);
    }
  };

  // 6. Delete history entry
  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteHistoryEntry(id);
      if (activeEntry?.id === id) {
        setActiveEntry(null);
      }
      await loadLibraryAndHistory();
    } catch (error) {
      console.error('Failed to delete history entry:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      
      {/* Immersive Atmospheric Background Glows */}
      <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Studio */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 backdrop-blur-md bg-black/40 sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <span className="text-white font-bold text-sm italic">GI</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight uppercase">
                GenImago <span className="text-cyan-400">v2.0</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider hidden sm:block">Creative Studio Engine</p>
            </div>
          </div>

          {/* Environment status pills */}
          <div className="flex items-center gap-4">
            {apiKeyStatus === 'configured' ? (
              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs flex items-center gap-2 text-emerald-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                Gemini API Online
              </div>
            ) : apiKeyStatus === 'missing' ? (
              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs flex items-center gap-2 text-amber-400">
                <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"></div>
                Mode Simulasi
              </div>
            ) : (
              <div className="text-xs text-slate-500 animate-pulse">Checking credentials...</div>
            )}
            
            <div className="text-xs text-slate-500 font-mono hidden md:block">
              SYS_TIME: 2026
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 z-10">
        
        {/* Error notification board if any */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in backdrop-blur-md">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-semibold text-red-200">Terminal Warning</h4>
              <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 3-Panel Creative Assembly Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Panel 1: Reference Library (4 cols) */}
          <div className="lg:col-span-4 flex flex-col h-full">
            <ImageLibrary
              items={libraryItems}
              selectedItem={selectedLibraryItem}
              onSelect={setSelectedLibraryItem}
              onAddItem={handleAddLibraryItem}
              onDeleteItem={handleDeleteLibraryItem}
            />
          </div>

          {/* Panel 2: Prompters (4 cols) */}
          <div className="lg:col-span-4 flex flex-col h-full">
            <MediaGenerator
              selectedItem={selectedLibraryItem}
              onGenerate={handleGenerateImage}
              isGenerating={isGeneratingImage}
              apiKeyStatus={apiKeyStatus}
            />
          </div>

          {/* Panel 3: Creative Theater (4 cols) */}
          <div className="lg:col-span-4 flex flex-col h-full">
            <VideoGenerator
              activeEntry={activeEntry}
              onGenerateVideo={handleGenerateVideo}
              isGeneratingVideo={isGeneratingVideo}
              videoProgress={videoProgress}
            />
          </div>

        </div>

        {/* Creative Release Archives (History Grid) */}
        <div className="pt-4">
          <HistoryPanel
            history={history}
            onSelectEntry={handleSelectEntry}
            onDeleteEntry={handleDeleteEntry}
            activeEntry={activeEntry}
          />
        </div>

      </main>

      {/* Humble Elegant Footer */}
      <footer className="h-12 bg-black/60 border-t border-white/10 px-8 flex items-center justify-between text-[10px] text-slate-500 z-10">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <span>STUDIO RENDERING</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">RESOLUTION: SQUARE 800PX</span>
          </div>
          <div className="flex gap-4 uppercase tracking-tighter">
            <span>SYSTEM READY</span>
            <span className="text-cyan-400">● AI CLOUD CONNECTED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
