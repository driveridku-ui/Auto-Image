import React, { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, Trash2, Library, CheckCircle, Tag, Images } from 'lucide-react';
import { LibraryItem } from '../types';

interface ImageLibraryProps {
  items: LibraryItem[];
  selectedItem: LibraryItem | null;
  onSelect: (item: LibraryItem) => void;
  onAddItem: (title: string, category: string, base64Data: string) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export default function ImageLibrary({
  items,
  selectedItem,
  onSelect,
  onAddItem,
  onDeleteItem,
}: ImageLibraryProps) {
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read file as base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang didukung!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setTempImage(base64);
        setNewTitle(file.name.split('.')[0]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAdd = async () => {
    if (!tempImage) return;
    const title = newTitle.trim() || 'Gambar Referensi';
    setIsUploading(true);
    try {
      await onAddItem(title, newCategory, tempImage);
      setTempImage(null);
      setNewTitle('');
      setNewCategory('Personal');
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelAdd = () => {
    setTempImage(null);
    setNewTitle('');
    setNewCategory('Personal');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="border border-white/10 bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl flex flex-col h-full" id="library-panel">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/25">
            <Library size={22} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-sans">Library Referensi</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Pilih atau tambah asset</p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 mb-6 transition-all duration-300 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-white/10 hover:border-white/20 bg-white/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        
        {tempImage ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-black/40 p-2 rounded-lg border border-white/10">
              <div className="w-14 h-14 rounded overflow-hidden bg-black shrink-0 relative border border-white/10">
                <img src={tempImage} alt="Pratinjau upload" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Pratinjau File</p>
                <p className="text-xs text-slate-300 font-medium truncate mt-0.5">Siap diunggah ke studio</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col text-left">
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider mb-1">Nama Aset</span>
                <input
                  type="text"
                  placeholder="Nama gambar..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-md bg-black border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider mb-1">Kategori</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-md bg-black border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                >
                  <option value="Personal">Personal</option>
                  <option value="Futuristik">Futuristik</option>
                  <option value="Branding">Branding</option>
                  <option value="Vintage">Vintage</option>
                  <option value="Arsitektur">Arsitektur</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelAdd}
                className="py-1.5 px-3 text-[10px] uppercase tracking-wider font-semibold rounded bg-white/5 hover:bg-white/10 text-slate-400 transition-all"
                disabled={isUploading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="py-1.5 px-3 text-[10px] uppercase tracking-wider font-bold rounded bg-gradient-to-r from-cyan-600 to-purple-600 hover:brightness-110 text-white transition-all flex items-center justify-center gap-1"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Simpan</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <ImageIcon className="text-slate-500" size={32} />
              <p className="text-xs text-slate-300 font-medium">
                Seret gambar di sini atau <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()} 
                  className="text-cyan-400 hover:text-cyan-300 font-semibold focus:outline-none"
                >
                  Pilih File
                </button>
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Mendukung PNG, JPG, WEBP</p>
            </div>
          </div>
        )}
      </div>

      {/* Library Grid */}
      <div className="flex-1 overflow-y-auto max-h-[420px] pr-1 space-y-3 custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
            <Images size={32} className="mb-2 opacity-30 text-cyan-400" />
            <p className="text-xs uppercase tracking-wider">Library masih kosong.</p>
            <p className="text-[10px] text-slate-600 mt-1 uppercase">Unggah gambar di atas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer bg-black/40 border-2 transition-all ${
                    isSelected
                      ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.35)] shadow-lg'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  id={`library-item-${item.id}`}
                >
                  <div className="aspect-square relative overflow-hidden bg-[#09090e]">
                    <img
                      src={item.imageData}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Category Tag */}
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                      <Tag size={10} className="text-cyan-400" />
                      <span className="text-[9px] text-slate-200 font-semibold">{item.category}</span>
                    </div>

                    {/* Selection Active Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-[1px] flex items-center justify-center">
                        <CheckCircle size={28} className="text-cyan-400 fill-black/60" />
                      </div>
                    )}
                  </div>

                  {/* Title & Actions */}
                  <div className="p-2.5 bg-black/40 flex items-center justify-between border-t border-white/5">
                    <span className="text-xs font-medium text-slate-200 truncate pr-1">
                      {item.title}
                    </span>
                    
                    {/* Deletion - Stock images can't be deleted */}
                    {!item.id.startsWith('stock-') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus "${item.title}" dari library?`)) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="text-slate-600 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Hapus gambar"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
