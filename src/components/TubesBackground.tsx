import { useEffect, useRef } from "react";

type TubesInstance = { dispose?: () => void } | void;
type TubesFactory = (canvas: HTMLCanvasElement, options: Record<string, unknown>) => TubesInstance;

export function TubesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let instance: TubesInstance;

    const start = async () => {
      try {
        const module = (await import("@/lib/vendor/tubes1.min.js")) as { default: TubesFactory };
        if (disposed) return;
        instance = module.default(canvas, {
          bloom: { threshold: 0.08, strength: 1.05, radius: 0.28 },
          tubes: {
            count: 12,
            minRadius: 0.004,
            maxRadius: 0.032,
            colors: ["#0A74FF", "#0C9BFF", "#69C3FF"],
            lights: {
              intensity: 180,
              colors: ["#4FC3FF", "#A8E4FF", "#0A74FF", "#0047FF"],
            },
          },
        });
      } catch (error) {
        console.warn("Efeito visual indisponível", error);
      }
    };

    const idleId = window.setTimeout(start, 160);

    const forwardTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      document.body.dispatchEvent(new PointerEvent("pointermove", {
        bubbles: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        pointerType: "touch",
        isPrimary: true,
      }));
    };

    canvas.addEventListener("touchstart", forwardTouch, { passive: true });
    canvas.addEventListener("touchmove", forwardTouch, { passive: true });

    return () => {
      disposed = true;
      window.clearTimeout(idleId);
      canvas.removeEventListener("touchstart", forwardTouch);
      canvas.removeEventListener("touchmove", forwardTouch);
      if (instance && typeof instance === "object") instance.dispose?.();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 size-full brightness-110" aria-hidden="true" />;
}