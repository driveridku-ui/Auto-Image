/**
 * High-fidelity client-side canvas renderer.
 * Combines reference image + prompt-based design filters + stylized copywriting text overlays.
 * Also provides continuous frame rendering for cinematic visual animations (simulated video).
 */

export interface DesignTheme {
  id: string;
  name: string;
  overlayColor: string; // gradient color
  textColor: string;
  fontFamily: string;
  glowColor: string;
  filter: string;
  particles: string[];
  spotlight?: boolean;
  leafShadows?: boolean;
  waterRipples?: boolean;
  foodSteam?: boolean;
  waterSplash?: boolean;
  rusticSurface?: boolean;
  goldenSunrays?: boolean;
  bokehCircles?: boolean;
  darkChiaroscuro?: boolean;
}

export function detectTheme(prompt: string): DesignTheme {
  const p = prompt.toLowerCase();
  
  if (p.includes('produk') || p.includes('studio-produk') || p.includes('commercial-clean') || p.includes('spotlight') || p.includes('softbox') || p.includes('studio product')) {
    return {
      id: 'studio-produk',
      name: 'Studio Produk Premium',
      overlayColor: 'rgba(6, 182, 212, 0.1)',
      textColor: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      glowColor: 'rgba(6, 182, 212, 0.7)',
      filter: 'contrast(1.18) saturate(1.15) brightness(1.02)',
      particles: ['rgba(6, 182, 212, 0.4)', 'rgba(255, 255, 255, 0.6)'],
      spotlight: true,
      bokehCircles: true,
    };
  }
  
  if (p.includes('kuliner') || p.includes('makanan') || p.includes('food') || p.includes('gourmet') || p.includes('culinary')) {
    const isDark = p.includes('moody') || p.includes('dark') || p.includes('chiaroscuro') || p.includes('steam');
    if (isDark) {
      return {
        id: 'moody-food',
        name: 'Moody Food Art',
        overlayColor: 'rgba(20, 15, 10, 0.35)',
        textColor: '#ffd166',
        fontFamily: 'Georgia, serif',
        glowColor: 'rgba(239, 137, 88, 0.6)',
        filter: 'contrast(1.3) brightness(0.85) saturate(0.95)',
        particles: ['rgba(239, 137, 88, 0.25)', 'rgba(255, 255, 255, 0.2)'],
        darkChiaroscuro: true,
        foodSteam: true,
        rusticSurface: true,
      };
    }
    return {
      id: 'editorial-kuliner',
      name: 'Editorial Kuliner',
      overlayColor: 'rgba(217, 119, 6, 0.15)',
      textColor: '#fffbeb',
      fontFamily: 'Georgia, serif',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      filter: 'contrast(1.15) saturate(1.3) brightness(1.05)',
      particles: ['rgba(251, 191, 36, 0.3)'],
      rusticSurface: true,
      goldenSunrays: true,
    };
  }
  
  if (p.includes('kosmetik') || p.includes('beauty') || p.includes('pastel') || p.includes('minimalis') || p.includes('cosmetic')) {
    return {
      id: 'kosmetik-minimalis',
      name: 'Kosmetik & Minimalis Luxe',
      overlayColor: 'rgba(253, 244, 245, 0.12)',
      textColor: '#334155',
      fontFamily: 'system-ui, sans-serif',
      glowColor: 'rgba(244, 63, 94, 0.3)',
      filter: 'contrast(1.05) saturate(1.1) brightness(1.05)',
      particles: ['rgba(244, 63, 94, 0.2)', 'rgba(253, 224, 228, 0.4)'],
      leafShadows: true,
      waterRipples: true,
    };
  }

  if (p.includes('kafe') || p.includes('cafe') || p.includes('dessert') || p.includes('kopi') || p.includes('coffee') || p.includes('pastry')) {
    return {
      id: 'kafe-dessert',
      name: 'Kafe & Dessert Warm',
      overlayColor: 'rgba(120, 53, 4, 0.18)',
      textColor: '#ffedd5',
      fontFamily: 'Georgia, serif',
      glowColor: 'rgba(217, 119, 6, 0.6)',
      filter: 'sepia(0.25) contrast(1.12) saturate(1.15) brightness(0.98)',
      particles: ['rgba(251, 191, 36, 0.4)', 'rgba(120, 53, 4, 0.3)'],
      foodSteam: true,
      bokehCircles: true,
      rusticSurface: true,
    };
  }

  if (p.includes('splash') || p.includes('dinamis') || p.includes('speed') || p.includes('air') || p.includes('action')) {
    return {
      id: 'splash-creative',
      name: 'Produk Splash & Dinamis',
      overlayColor: 'rgba(6, 182, 212, 0.08)',
      textColor: '#00f3ff',
      fontFamily: 'system-ui, sans-serif',
      glowColor: 'rgba(6, 182, 212, 0.8)',
      filter: 'contrast(1.22) saturate(1.45) brightness(1.03)',
      particles: ['rgba(6, 182, 212, 0.6)', 'rgba(255, 255, 255, 0.7)'],
      waterSplash: true,
      waterRipples: true,
    };
  }

  if (p.includes('neon') || p.includes('cyber') || p.includes('futur') || p.includes('blue') || p.includes('purple')) {
    return {
      id: 'cyber',
      name: 'Cyberpunk Neon',
      overlayColor: 'rgba(238, 0, 153, 0.2)',
      textColor: '#00f3ff',
      fontFamily: 'system-ui, sans-serif',
      glowColor: 'rgba(0, 243, 255, 0.8)',
      filter: 'contrast(1.2) saturate(1.5) hue-rotate(10deg)',
      particles: ['rgba(0, 243, 255, 0.6)', 'rgba(238, 0, 153, 0.6)'],
      spotlight: true,
    };
  }
  
  if (p.includes('vintage') || p.includes('retro') || p.includes('classic') || p.includes('old') || p.includes('analog') || p.includes('film')) {
    return {
      id: 'vintage',
      name: 'Vintage Retro / Film',
      overlayColor: 'rgba(198, 137, 88, 0.25)',
      textColor: '#ffebc2',
      fontFamily: 'Georgia, serif',
      glowColor: 'rgba(198, 137, 88, 0.5)',
      filter: 'sepia(0.4) contrast(0.9) brightness(1.02)',
      particles: ['rgba(239, 195, 143, 0.3)', 'rgba(127, 85, 57, 0.2)'],
      goldenSunrays: true,
    };
  }

  // Default: Creative Vibrant
  return {
    id: 'vibrant',
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

      // --- ADVANCED PROCEDURAL PHOTOSHOOT EFFECTS ---
      
      // 1. Dark Chiaroscuro (Moody Food / Products)
      if (theme.darkChiaroscuro) {
        ctx.save();
        const maskGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.1, w * 0.5, h * 0.45, w * 0.7);
        maskGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        maskGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.3)');
        maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = maskGrad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // 2. Spotlight (Studio Produk)
      if (theme.spotlight) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const spotlightGrad = ctx.createRadialGradient(w / 2, h / 2, 40 * scale, w / 2, h / 2, w * 0.75);
        spotlightGrad.addColorStop(0, 'rgba(34, 211, 238, 0.35)'); // Glowing cyan spotlight center
        spotlightGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.12)'); // Soft purple rim
        spotlightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spotlightGrad;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Golden Sunrays (Editorial Kuliner / Golden Hour)
      if (theme.goldenSunrays) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const sunbeamGrad = ctx.createLinearGradient(0, 0, w, h);
        sunbeamGrad.addColorStop(0, 'rgba(251, 191, 36, 0.25)'); // Rich amber
        sunbeamGrad.addColorStop(0.6, 'rgba(253, 224, 71, 0.08)');
        sunbeamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunbeamGrad;

        // Diagonal beam polygons
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w * 0.35, 0);
        ctx.lineTo(w * 0.75, h);
        ctx.lineTo(w * 0.15, h);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w * 0.15, 0);
        ctx.lineTo(w * 0.28, 0);
        ctx.lineTo(w * 0.95, h);
        ctx.lineTo(w * 0.45, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 4. Creamy Bokeh Circles (Dessert / Studio)
      if (theme.bokehCircles) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const bColors = ['rgba(251, 191, 36, 0.15)', 'rgba(34, 211, 238, 0.10)', 'rgba(255, 255, 255, 0.12)'];
        // Deterministic placements to prevent flickering
        const seedVal = copywriting.length || 7;
        for (let i = 0; i < 10; i++) {
          const bx = ((seedVal * (i + 1) * 31) % (w * 0.8)) + w * 0.1;
          const by = ((seedVal * (i + 1) * 73) % (h * 0.55)) + h * 0.1;
          const br = (((seedVal * i * 19) % 35) + 20) * scale;
          const bColor = bColors[i % bColors.length];
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fillStyle = bColor;
          ctx.fill();
        }
        ctx.restore();
      }

      // 5. Wood Tabletop Surface (Editorial Kuliner / Cafe Warm)
      if (theme.rusticSurface) {
        ctx.save();
        const surfaceY = h * 0.73;
        const surfaceH = h * 0.27;

        // Draw tabletop background base
        const tabletopGrad = ctx.createLinearGradient(0, surfaceY, 0, h);
        tabletopGrad.addColorStop(0, 'rgba(115, 76, 50, 0.35)'); // Warm brown wood tone
        tabletopGrad.addColorStop(1, 'rgba(50, 25, 10, 0.8)');
        ctx.fillStyle = tabletopGrad;
        ctx.fillRect(0, surfaceY, w, surfaceH);

        // Draw horizontal wood grain lines
        ctx.strokeStyle = 'rgba(254, 215, 170, 0.12)';
        ctx.lineWidth = 1 * scale;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(0, surfaceY + (surfaceH / 5) * i);
          ctx.bezierCurveTo(
            w * 0.3, surfaceY + (surfaceH / 5) * i + 8 * scale,
            w * 0.7, surfaceY + (surfaceH / 5) * i - 8 * scale,
            w, surfaceY + (surfaceH / 5) * i
          );
          ctx.stroke();
        }

        // Add contact drop shadow at the edge of the tabletop
        const shadowGrad = ctx.createLinearGradient(0, surfaceY - 12 * scale, 0, surfaceY);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, surfaceY - 12 * scale, w, 12 * scale);
        ctx.restore();
      }

      // 6. Food Steam / Hot Wisps (Culinary / Hot Drinks)
      if (theme.foodSteam) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2.5 * scale;
        ctx.filter = 'blur(5px)';

        // Rise 3 elegant steam waves from bottom/center
        const startXCoords = [w * 0.42, w * 0.5, w * 0.58];
        startXCoords.forEach((startX, idx) => {
          ctx.beginPath();
          ctx.moveTo(startX, h * 0.78);
          ctx.bezierCurveTo(
            startX - 18 * scale * (idx + 1), h * 0.58,
            startX + 22 * scale * (idx + 1), h * 0.38,
            startX - 8 * scale, h * 0.18
          );
          ctx.stroke();
        });
        ctx.restore();
      }

      // 7. Water Splash Beads (Dynamic Splash)
      if (theme.waterSplash) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowColor = 'rgba(34, 211, 238, 0.5)';
        ctx.shadowBlur = 8 * scale;

        const dropletCount = 20;
        for (let i = 0; i < dropletCount; i++) {
          const t = i / dropletCount;
          const angle = Math.PI * (0.15 + 0.7 * t);
          const distance = (100 + 180 * Math.sin(t * Math.PI)) * scale;
          const dx = w / 2 + Math.cos(angle) * distance;
          const dy = h * 0.65 - Math.sin(angle) * distance;
          const radius = (1.5 + Math.random() * 4) * scale;

          ctx.beginPath();
          ctx.arc(dx, dy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 8. Water Ripple Ellipses (Beauty / Minimalis / Liquid)
      if (theme.waterRipples) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.shadowColor = 'rgba(34, 211, 238, 0.3)';
        ctx.shadowBlur = 6 * scale;

        const centerX = w * 0.55;
        const centerY = h * 0.55;

        for (let rWidth = 35; rWidth <= 155; rWidth += 40) {
          ctx.beginPath();
          ctx.ellipse(
            centerX, 
            centerY, 
            rWidth * scale, 
            (rWidth * 0.42) * scale, 
            Math.PI * -0.08, 
            0, 
            Math.PI * 2
          );
          ctx.lineWidth = (1.2 - (rWidth / 220)) * scale;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 9. Elegant Window/Plant Shadows (Cosmetic Minimalist)
      if (theme.leafShadows) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.18)'; // Ultra-soft leaf shadow mask
        ctx.filter = 'blur(10px)';

        ctx.beginPath();
        // Main stem
        ctx.moveTo(w, 0);
        ctx.bezierCurveTo(w * 0.75, h * 0.2, w * 0.45, h * 0.35, w * 0.25, h * 0.55);
        
        // Render 5 elegant organic leaf pairs along the stem
        for (let i = 1; i <= 5; i++) {
          const ratio = i / 6;
          const lx = w - (w * 0.75 * ratio);
          const ly = h * 0.35 * ratio;
          
          // Left leaf
          ctx.moveTo(lx, ly);
          ctx.quadraticCurveTo(lx - 40 * scale, ly - 10 * scale, lx - 70 * scale, ly + 15 * scale);
          ctx.quadraticCurveTo(lx - 30 * scale, ly + 25 * scale, lx, ly);

          // Right leaf
          ctx.moveTo(lx, ly);
          ctx.quadraticCurveTo(lx + 10 * scale, ly + 40 * scale, lx + 20 * scale, ly + 70 * scale);
          ctx.quadraticCurveTo(lx - 10 * scale, ly + 30 * scale, lx, ly);
        }
        ctx.fill();
        ctx.restore();
      }

      // -----------------------------------------------

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
