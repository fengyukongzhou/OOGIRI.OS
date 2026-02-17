import React, { useEffect, useRef, useState } from 'react';

interface MemeCanvasProps {
  imageSrc: string;
  caption: string;
  rank?: number;
}

export const MemeCanvas: React.FC<MemeCanvasProps> = ({ imageSrc, caption, rank }) => {
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
        
        // Initial Target: 10% of image height for better mobile visibility
        let fontSize = Math.floor(canvas.height * 0.10); 
        
        try {
           await document.fonts.load(`900 ${fontSize}px "Noto Sans SC"`);
        } catch (e) {
           console.warn("Font fallback", e);
        }

        ctx.font = `900 ${fontSize}px ${fontFamily}`;
        
        // Max width is 92% of the canvas
        const maxTextWidth = canvas.width * 0.92;
        const textMetrics = ctx.measureText(caption);
        const textWidth = textMetrics.width;

        // Scale down to fit
        if (textWidth > maxTextWidth) {
          const scaleFactor = maxTextWidth / textWidth;
          fontSize = Math.floor(fontSize * scaleFactor * 0.95);
          ctx.font = `900 ${fontSize}px ${fontFamily}`;
        }
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const x = canvas.width / 2;
        const y = canvas.height - (canvas.height * 0.05);

        // Stroke
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(4, fontSize * 0.2); 
        ctx.lineJoin = 'round';
        ctx.strokeText(caption, x, y);

        // Fill
        ctx.fillStyle = 'white';
        ctx.fillText(caption, x, y);
      }

      setDownloadUrl(canvas.toDataURL('image/png'));
    };
  }, [imageSrc, caption]);

  // Cyberpunk Rank Styles
  const getRankStyles = () => {
    switch (rank) {
      case 1: return { 
        border: 'border-yellow-400', 
        shadow: 'shadow-[0_0_30px_-5px_rgba(250,204,21,0.5)]', 
        badge: 'bg-yellow-400 text-black', 
        label: '#1. RELATABLE',
        desc: '最共鸣'
      };
      case 2: return { 
        border: 'border-purple-500', 
        shadow: 'shadow-[0_0_30px_-5px_rgba(217,70,239,0.5)]', 
        badge: 'bg-purple-500 text-white', 
        label: '#2. ABSURD',
        desc: '最荒谬'
      };
      case 3: return { 
        border: 'border-cyan-500', 
        shadow: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)]', 
        badge: 'bg-cyan-500 text-black', 
        label: '#3. SNARK',
        desc: '最毒舌'
      };
      default: return { 
        border: 'border-neutral-800', 
        shadow: 'shadow-none', 
        badge: 'hidden', 
        label: '', 
        desc: ''
      };
    }
  };

  const styles = getRankStyles();

  return (
    <div className="w-full relative group">
       {/* Badge */}
       {rank && (
        <div className="absolute -top-3 left-4 z-10 flex items-center gap-2">
            <div className={`px-3 py-1 text-xs font-bold tracking-widest uppercase transform -skew-x-12 shadow-lg ${styles.badge}`}>
            {styles.label}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono hidden sm:block">
               // {styles.desc}
            </div>
        </div>
      )}

      {/* Canvas Container */}
      <div className={`relative rounded-sm overflow-hidden border-2 bg-[#111] transition-all duration-500 ${styles.border} ${styles.shadow}`}>
        <canvas 
          ref={canvasRef} 
          className="w-full h-auto object-contain block"
        />
        
        {/* Hover Overlay for PC */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none lg:pointer-events-auto">
             <div className="pointer-events-auto">
                {downloadUrl && (
                <a
                    href={downloadUrl}
                    download={`oogiri_${rank}_${Date.now()}.png`}
                    className="bg-white text-black px-6 py-2 font-bold hover:bg-yellow-400 transition-colors uppercase tracking-wider text-sm clip-path-polygon"
                >
                    Save Image
                </a>
                )}
             </div>
        </div>
      </div>

      {/* Mobile Download Button (Always visible on small screens) */}
      <div className="mt-3 flex justify-end lg:hidden">
         {downloadUrl && (
            <a
                href={downloadUrl}
                download={`oogiri_${rank}_${Date.now()}.png`}
                className="text-xs text-neutral-400 border-b border-neutral-700 pb-1 uppercase tracking-widest hover:text-white"
            >
                [ Download_Image ]
            </a>
         )}
      </div>
    </div>
  );
};