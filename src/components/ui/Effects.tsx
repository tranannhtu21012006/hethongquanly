import { useEffect, useState } from 'react';

export const Effects = () => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Background Blobs (Reduced Intensity) */}
      <div className="fixed inset-0 z-[-2] overflow-hidden bg-background pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-200/10 blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#f5e6d3]/30 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-green-100/10 blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Trailing Cursor Soft Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-[50] overflow-hidden transition-opacity duration-300"
      >
        <div
          className="absolute rounded-full blur-[80px] bg-primary/30 transition-transform duration-75 ease-out"
          style={{
            width: '300px',
            height: '300px',
            transform: `translate(${cursorPos.x - 150}px, ${cursorPos.y - 150}px)`,
          }}
        />
      </div>
    </>
  );
};
