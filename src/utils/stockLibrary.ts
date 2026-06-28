import { LibraryItem } from '../types';

export const STOCK_LIBRARY: LibraryItem[] = [
  {
    id: 'stock-cyberpunk',
    title: 'Neon Cyberpunk Alleyway',
    category: 'Futuristik',
    imageData: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'stock-logo',
    title: 'Minimalist Monogram Logo',
    category: 'Branding',
    imageData: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date('2026-01-02').toISOString(),
  },
  {
    id: 'stock-vintage',
    title: 'Retro Travel Poster',
    category: 'Vintage',
    imageData: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date('2026-01-03').toISOString(),
  },
  {
    id: 'stock-interior',
    title: 'Scandi Modern Interior',
    category: 'Desain Interior',
    imageData: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date('2026-01-04').toISOString(),
  },
];
