import { useEffect, useState } from 'react';

export const Effects = () => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const ripple = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now(),
      };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600); // match duration
    };

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Background Blobs */}
      <div className="fixed inset-0 z-[-2] overflow-hidden bg-background pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-400/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-pink-400/20 blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Trailing Cursor Soft Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden transition-opacity duration-300"
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

      {/* Ripple Effect Container */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-[9999]">
        {ripples.map((r) => (
          <span
            key={r.id}
            className="absolute rounded-full bg-primary/40 animate-ripple"
            style={{
              left: r.x,
              top: r.y,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </>
  );
};
