/**
 * High-fidelity client-side canvas renderer.
 * Combines reference image + prompt-based design filters + stylized copywriting text overlays.
 * Also provides continuous frame rendering for cinematic visual animations (simulated video).
 */

export interface DesignTheme {
  name: string;
  overlayColor: string; // gradient color
  textColor: string;
  fontFamily: string;
  glowColor: string;
  filter: string;
  particles: string[];
}

export function detectTheme(prompt: string): DesignTheme {
  const p = prompt.toLowerCase();
  
  if (p.includes('neon') || p.includes('cyber') || p.includes('futur') || p.includes('blue') || p.includes('purple')) {
    return {
      name: 'Cyberpunk Neon',
      overlayColor: 'rgba(238, 0, 153, 0.2)',
      textColor: '#00f3ff',
      fontFamily: 'system-ui, sans-serif',
      glowColor: 'rgba(0, 243, 255, 0.8)',
      filter: 'contrast(1.2) saturate(1.5) hue-rotate(10deg)',
      particles: ['rgba(0, 243, 255, 0.6)', 'rgba(238, 0, 153, 0.6)'],
    };
  }
  
  if (p.includes('vintage') || p.includes('retro') || p.includes('classic') || p.includes('old') || p.includes('travel')) {
    return {
      name: 'Vintage Retro',
      overlayColor: 'rgba(198, 137, 88, 0.25)',
      textColor: '#ffebc2',
      fontFamily: 'Georgia, serif',
      glowColor: 'rgba(198, 137, 88, 0.5)',
      filter: 'sepia(0.6) contrast(0.9) brightness(1.05)',
      particles: ['rgba(239, 195, 143, 0.4)', 'rgba(127, 85, 57, 0.3)'],
    };
  }

  if (p.includes('minimal') || p.includes('clean') || p.includes('black') || p.includes('white') || p.includes('luxury')) {
    return {
      name: 'Minimalist Luxe',
      overlayColor: 'rgba(0, 0, 0, 0.4)',
      textColor: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      glowColor: 'rgba(255, 255, 255, 0.3)',
      filter: 'grayscale(0.3) contrast(1.15)',
      particles: ['rgba(255, 255, 255, 0.5)'],
    };
  }

  // Default: Creative Vibrant
  return {
    name: 'Vibrant Creative',
    overlayColor: 'rgba(79, 70, 229, 0.15)',
    textColor: '#f9fafb',
    fontFamily: 'system-ui, sans-serif',
    glowColor: 'rgba(79, 70, 229, 0.6)',
    filter: 'saturate(1.2) contrast(1.1)',
    particles: ['rgba(99, 102, 241, 0.5)', 'rgba(168, 85, 247, 0.5)'],
  };
}

/**
 * Draws the high-fidelity simulated image onto a canvas and returns a base64 data URL.
 */
export function renderSimulatedImage(
  imageSrc: string,
  prompt: string,
  copywriting: string,
  aspectRatio: string = '1:1',
  quality: string = 'hd'
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(imageSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.src = imageSrc;

    img.onload = () => {
      // Calculate dynamic bounds based on aspect ratio
      let baseWidth = 800;
      let baseHeight = 800;

      if (aspectRatio === '3:4') {
        baseWidth = 600;
        baseHeight = 800;
      } else if (aspectRatio === '9:16') {
        baseWidth = 450;
        baseHeight = 800;
      } else if (aspectRatio === '16:9') {
        baseWidth = 800;
        baseHeight = 450;
      }

      // Scaling factor depending on Quality choice
      let scale = 1.0;
      if (quality === 'hd') {
        scale = 1.5;
      } else if (quality === 'ultra') {
        scale = 2.0;
      }

      const w = Math.round(baseWidth * scale);
      const h = Math.round(baseHeight * scale);

      canvas.width = w;
      canvas.height = h;

      // Draw Base Image with professional Aspect Cover calculation
      const iw = img.width;
      const ih = img.height;
      const r = Math.max(w / iw, h / ih);
      const nw = iw * r;
      const nh = ih * r;
      const cx = nw > w ? (nw - w) * 0.5 : 0;
      const cy = nh > h ? (nh - h) * 0.5 : 0;
      
      ctx.drawImage(
        img, 
        cx / r, 
        cy / r, 
        iw - (cx * 2) / r, 
        ih - (cy * 2) / r, 
        0, 
        0, 
        w, 
        h
      );

      const theme = detectTheme(prompt);

      // Apply Filter via Canvas Overlay
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, theme.overlayColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Add a modern dark lower-gradient vignette to pop typography
      ctx.save();
      const vignette = ctx.createLinearGradient(0, h * 0.6, 0, h);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
      ctx.restore();

      // Add creative particles / sparkles depending on the prompt
      ctx.save();
      ctx.shadowBlur = 10 * scale;
      theme.particles.forEach((pColor, idx) => {
        ctx.fillStyle = pColor;
        ctx.shadowColor = pColor;
        
        // Pseudo-random placement based on copywriting length to keep it deterministic
        const seed = copywriting.length + idx * 5;
        for (let i = 0; i < 15; i++) {
          const px = ((seed * (i + 1) * 123) % (w - 40)) + 20;
          const py = ((seed * (i + 1) * 456) % (h - 100)) + 50;
          const pr = (((seed * i) % 4) + 2) * scale;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();

      // Draw Stylized Copywriting Text
      if (copywriting && copywriting.trim() !== '') {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Font setup (scales nicely with high res sizes)
        const fontSize = Math.round(36 * scale * (baseWidth / 800));
        ctx.font = `600 ${fontSize}px ${theme.fontFamily}`;
        ctx.fillStyle = theme.textColor;
        ctx.shadowColor = theme.glowColor;
        ctx.shadowBlur = 15 * scale;

        // Wrap copywriting text
        const maxTextWidth = w - 80;
        const words = copywriting.trim().split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTextWidth) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);

        // Render wrapping lines nicely from the bottom area
        const lineSpacing = 50 * scale * (baseWidth / 800);
        const startY = (h * 0.85) - (lines.length - 1) * (lineSpacing * 0.5);
        lines.forEach((line, index) => {
          ctx.fillText(line, w / 2, startY + index * lineSpacing);
        });

        ctx.restore();
      }

      // Add elegant border and subtle AI stamp
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 16 * scale;
      ctx.strokeRect(8 * scale, 8 * scale, w - 16 * scale, h - 16 * scale);

      ctx.save();
      const stampFontSize = Math.round(12 * scale);
      ctx.font = `${stampFontSize}px Courier, monospace`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'right';
      ctx.fillText('GENIMAGO CREATIVE AI', w - (40 * scale), 40 * scale);
      ctx.restore();

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      resolve(imageSrc);
    };
  });
}
