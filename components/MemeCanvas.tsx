import React, { useEffect, useRef, useState } from 'react';

interface MemeCanvasProps {
  imageSrc: string;
  caption: string;
}

export const MemeCanvas: React.FC<MemeCanvasProps> = ({ imageSrc, caption }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = async () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw Image
      ctx.drawImage(img, 0, 0);

      if (caption) {
        const fontFamily = '"Noto Sans SC", "Hiragino Kaku Gothic ProN", "Noto Sans CJK SC", sans-serif';
        
        // Initial Target: 8% of image height
        let fontSize = Math.floor(canvas.height * 0.08); 
        
        // Ensure font is loaded before measuring to avoid "sans-serif" width (which is usually narrower)
        try {
           await document.fonts.load(`900 ${fontSize}px "Noto Sans SC"`);
        } catch (e) {
           console.warn("Font loading failed or timed out, proceeding with fallback", e);
        }

        ctx.font = `900 ${fontSize}px ${fontFamily}`;
        
        // Max width is 90% of the canvas (leaving 5% margin on each side for safety)
        const maxTextWidth = canvas.width * 0.90;
        const textMetrics = ctx.measureText(caption);
        const textWidth = textMetrics.width;

        // --- Improved Scale to Fit Logic ---
        // If text is too wide, scale down the font size with a safety buffer
        if (textWidth > maxTextWidth) {
          const scaleFactor = maxTextWidth / textWidth;
          // Scale down slightly more (0.95) to be absolutely sure it fits
          fontSize = Math.floor(fontSize * scaleFactor * 0.95);
          ctx.font = `900 ${fontSize}px ${fontFamily}`;
        }
        
        // Re-center logic
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const x = canvas.width / 2;
        const y = canvas.height - (canvas.height * 0.05); // 5% padding from bottom

        // 1. Text Outline (Stroke)
        // Use a thick stroke for standard meme look
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize * 0.25; // 25% of font size for a nice thick border
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(caption, x, y);

        // 2. Text Fill
        ctx.fillStyle = 'white';
        ctx.fillText(caption, x, y);
      }

      // Generate download URL
      setDownloadUrl(canvas.toDataURL('image/png'));
    };
  }, [imageSrc, caption]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl">
      {/* Visual Display */}
      <div className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-gray-800 bg-gray-900">
        <canvas 
          ref={canvasRef} 
          className="max-w-full h-auto max-h-[70vh] object-contain"
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-6">
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={`oogiri_meme_${Date.now()}.png`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-black bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            保存大喜利图片
          </a>
        )}
      </div>
    </div>
  );
};
