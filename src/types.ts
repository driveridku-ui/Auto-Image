export interface LibraryItem {
  id: string;
  title: string;
  imageData: string; // Base64 data or stock URL
  category: string;
  createdAt: string;
}

export interface GenerationEntry {
  id: string;
  referenceId: string;
  referenceTitle: string;
  referenceImage: string; // Base64 of the selected library item
  prompt: string;
  copywriting: string;
  aspectRatio?: string;
  quality?: string;
  outputImage?: string; // Generated image base64
  videoPrompt?: string;
  videoCopywriting?: string;
  outputVideo?: string; // Downloaded video URL or blob URL, or simulation config
  videoOperationName?: string;
  status: 'idle' | 'generating-image' | 'image-ready' | 'generating-video' | 'video-ready' | 'failed';
  error?: string;
  createdAt: string;
  isSimulated?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  isSimulated?: boolean;
}
