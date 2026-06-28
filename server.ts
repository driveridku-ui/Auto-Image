import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enforce body parsing limits for large base64 reference images
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // Helper to get active Gemini client
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
      throw new Error('API_KEY_MISSING');
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API Route: Health Check
  app.get('/api/health', (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' && process.env.GEMINI_API_KEY !== '';
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      apiKeyConfigured: hasKey 
    });
  });

  // API Route: Generate Image from Reference + Prompt + Copywriting
  app.post('/api/generate-image', async (req, res) => {
    const { referenceImage, prompt, copywriting, aspectRatio = '1:1', quality = 'hd', modelName = 'gemini-2.5-flash-image' } = req.body;

    if (!referenceImage) {
      return res.status(400).json({ success: false, error: 'Missing reference image' });
    }

    try {
      const ai = getGeminiClient();

      // Clean up base64 prefix
      const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, '');
      const mimeTypeMatch = referenceImage.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

      const promptText = `Anda adalah desainer grafis AI ahli. Tugas Anda adalah menghasilkan GAMBAR BARU kualitas tinggi yang secara visual terinspirasi dari gambar referensi yang dilampirkan.
Gambar baru harus mempertahankan komposisi dasar, gaya artistik, skema warna, atau objek utama dari gambar referensi.
Namun, Anda harus memadukan deskripsi visual berikut secara kreatif: "${prompt}".
Gabungkan pesan copywriting/teks berikut secara indah sebagai elemen tipografi/overlay grafis dalam gambar tersebut: "${copywriting}".
Format keluaran wajib disesuaikan dengan rasio aspek ${aspectRatio} dengan kualitas visual premium ${quality}.
Hasilkan hanya gambar yang sudah selesai diproses.`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      let generatedImageBase64 = '';
      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImageBase64 = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!generatedImageBase64) {
        const textResponse = response.text || '';
        return res.json({
          success: false,
          error: 'NO_IMAGE_RETURNED',
          message: textResponse || 'Model tidak mengembalikan gambar. Pastikan instruksi aman dan coba lagi.',
        });
      }

      return res.json({
        success: true,
        data: {
          imageUrl: generatedImageBase64,
        },
      });

    } catch (err: any) {
      console.error('Error in generate-image:', err);
      if (err.message === 'API_KEY_MISSING') {
        return res.json({
          success: false,
          error: 'API_KEY_MISSING',
          message: 'API Key Gemini belum disetup. Silakan isi di menu Settings > Secrets.',
        });
      }
      
      const isPaidRequired = err.status === 403 || err.message?.toLowerCase().includes('paid') || err.message?.toLowerCase().includes('billing');
      return res.json({
        success: false,
        error: isPaidRequired ? 'PAID_KEY_REQUIRED' : 'API_ERROR',
        message: err.message || 'Gagal menghasilkan gambar dari API Gemini.',
      });
    }
  });

  // API Route: Trigger Video Generation (veo-3.1-lite-generate-preview)
  app.post('/api/generate-video', async (req, res) => {
    const { imageUrl, prompt, copywriting } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'Missing image URL' });
    }

    try {
      const ai = getGeminiClient();

      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const mimeTypeMatch = imageUrl.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

      const fullPrompt = `Buat video sinematik dinamis berdurasi 5 detik dari gambar awal ini. Pergerakan: ${prompt}. Padukan teks copywriting ini secara mulus ke dalam atmosfer video: ${copywriting || ''}`;

      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: fullPrompt,
        image: {
          imageBytes: base64Data,
          mimeType: mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9',
        },
      });

      return res.json({
        success: true,
        data: {
          operationName: operation.name,
        },
      });

    } catch (err: any) {
      console.error('Error starting video generation:', err);
      if (err.message === 'API_KEY_MISSING') {
        return res.json({
          success: false,
          error: 'API_KEY_MISSING',
          message: 'API Key Gemini belum disetup.',
        });
      }

      const isPaidRequired = err.status === 403 || err.message?.toLowerCase().includes('paid') || err.message?.toLowerCase().includes('billing');
      return res.json({
        success: false,
        error: isPaidRequired ? 'PAID_KEY_REQUIRED' : 'API_ERROR',
        message: err.message || 'Gagal memulai proses pembuatan video.',
      });
    }
  });

  // API Route: Poll Video Status
  app.post('/api/video-status', async (req, res) => {
    const { operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ success: false, error: 'Missing operation name' });
    }

    try {
      const ai = getGeminiClient();

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      return res.json({
        success: true,
        data: {
          done: updated.done,
          error: updated.error,
        },
      });

    } catch (err: any) {
      console.error('Error polling video operation:', err);
      return res.json({
        success: false,
        error: 'API_ERROR',
        message: err.message || 'Gagal memeriksa status video.',
      });
    }
  });

  // API Route: Download Finished Video and Stream Back
  app.post('/api/video-download', async (req, res) => {
    const { operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ success: false, error: 'Missing operation name' });
    }

    try {
      const ai = getGeminiClient();

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(400).json({ success: false, error: 'URI video tidak ditemukan pada operasi ini.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const videoRes = await fetch(uri, {
        headers: {
          'x-goog-api-key': apiKey || '',
        },
      });

      if (!videoRes.ok) {
        throw new Error(`Gagal mengunduh video dari Google Storage: ${videoRes.statusText}`);
      }

      res.setHeader('Content-Type', 'video/mp4');
      const arrayBuffer = await videoRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);

    } catch (err: any) {
      console.error('Error downloading video:', err);
      return res.json({
        success: false,
        error: 'DOWNLOAD_ERROR',
        message: err.message || 'Gagal mengunduh video yang dihasilkan.',
      });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
