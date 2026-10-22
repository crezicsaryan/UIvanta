"use client";

import { useEffect, useRef } from "react";

/**
 * A soft glass "bubble" that trails the pointer. Purely decorative:
 * pointer-events-none, hidden on touch devices, and it never replaces
 * the native cursor (so text/inputs stay usable).
 */
export function CursorBubble() {
  const layerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const bubble = bubbleRef.current;
    const dot = dotRef.current;
    if (!layer || !bubble || !dot) return;

    // Only run for precise pointers (mouse/trackpad), never touch.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let scale = 1;
    let targetScale = 1;
    let raf = 0;

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      layer.dataset.active = "true";

      const target = event.target as Element | null;
      const interactive =
        target &&
        typeof target.closest === "function" &&
        target.closest('a, button, input, textarea, select, label, [role="button"]');
      targetScale = interactive ? 1.25 : 1;
    };

    const onDown = () => {
      targetScale = Math.min(targetScale, 0.8);
    };
    const onUp = () => {
      targetScale = 1;
    };
    const onLeave = () => {
      layer.dataset.active = "false";
    };

    const tick = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      scale += (targetScale - scale) * 0.16;
      bubble.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={layerRef} className="cursor-layer" aria-hidden="true">
      <div ref={bubbleRef} className="cursor-bubble" />
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}
