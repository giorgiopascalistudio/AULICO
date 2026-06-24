export function getProceduralNormalMap(type: string, bumpiness: number = 0.5): string {
  if (!type || type === 'none') return '';
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    // Height map array
    const height = new Float32Array(w * h);

    if (type === 'wood') {
      // Wood grain wave lines
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const wave = Math.sin(x * 0.08 + Math.sin(y * 0.08) * 3) * 0.5 + 0.5;
          const noise = Math.sin(x * 0.9) * Math.sin(y * 0.8) * 0.08;
          height[y * w + x] = wave * 0.3 + noise;
        }
      }
    } else if (type === 'plaster') {
      // Fine-grained wall noise
      for (let i = 0; i < w * h; i++) {
        height[i] = Math.sin(i * 0.5) * 0.05 + Math.cos(i * 1.2) * 0.03 + (Math.random() - 0.5) * 0.04;
      }
    } else if (type === 'stone') {
      // Dynamic stone veins and rock surface
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const ny = y / h;
          let val = Math.sin(nx * 14 + ny * 10) * 0.18;
          val += Math.sin(nx * 28 - ny * 36) * 0.08;
          val += (Math.random() - 0.5) * 0.02;
          height[y * w + x] = val;
        }
      }
    } else if (type === 'fabric') {
      // Interwoven thread grid
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const threadX = Math.sin(x * 0.5) * 0.25;
          const threadY = Math.sin(y * 0.5) * 0.25;
          height[y * w + x] = threadX + threadY;
        }
      }
    } else if (type === 'tile') {
      // Grid grout lines
      const border = 5;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const isGrout = (x < border || x > w - border || y < border || y > h - border);
          height[y * w + x] = isGrout ? -0.3 : 0.05;
        }
      }
    } else if (type === 'metal') {
      // Fine brushed horizontal metallic lines
      for (let y = 0; y < h; y++) {
        const rowVal = Math.sin(y * 1.8) * 0.12 + (Math.random() - 0.5) * 0.04;
        for (let x = 0; x < w; x++) {
          height[y * w + x] = rowVal;
        }
      }
    }

    // Convert height map to Normal Map (Sobel Filter style)
    const bumpStrength = bumpiness * 4.0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const xLeft = height[y * w + Math.max(0, x - 1)];
        const xRight = height[y * w + Math.min(w - 1, x + 1)];
        const yUp = height[Math.max(0, y - 1) * w + x];
        const yDown = height[Math.min(h - 1, y + 1) * w + x];

        const dx = (xRight - xLeft) * bumpStrength;
        const dy = (yDown - yUp) * bumpStrength;

        const len = Math.sqrt(dx * dx + dy * dy + 1.0);
        const nx = -dx / len;
        const ny = -dy / len;
        const nz = 1.0 / len;

        const idx = (y * w + x) * 4;
        data[idx] = Math.round((nx * 0.5 + 0.5) * 255);     // Red (X)
        data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255); // Green (Y)
        data[idx + 2] = Math.round(nz * 255);               // Blue (Z)
        data[idx + 3] = 255;                                // Alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  } catch (err) {
    console.error('Failed to generate procedural normal map:', err);
    return '';
  }
}
