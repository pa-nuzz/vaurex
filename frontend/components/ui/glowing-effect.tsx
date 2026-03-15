"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type GlowingEffectProps = {
  className?: string;
  blur?: number;
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  inactiveZone?: number;
  borderWidth?: number;
};

export function GlowingEffect({
  className,
  blur = 0,
  spread = 40,
  glow = true,
  disabled = false,
  proximity = 64,
  inactiveZone = 0.01,
  borderWidth = 1,
}: GlowingEffectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (disabled) return;

    const node = ref.current;
    if (!node) return;

    let active = 0;

    const apply = (x: number, y: number) => {
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const distance = Math.hypot(dx, dy);

      const maxDistance = Math.max(rect.width, rect.height) / 2 + proximity;
      const intensity = distance <= maxDistance ? 1 : 0;
      active = active + (intensity - active) * 0.15;

      const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

      node.style.setProperty("--start", angle.toFixed(2));
      node.style.setProperty("--active", active < inactiveZone ? "0" : active.toFixed(3));
    };

    const onPointerMove = (event: PointerEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => apply(event.clientX, event.clientY));
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        apply(rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
    };

    document.body.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.body.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [disabled, proximity, inactiveZone]);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity",
          glow && "opacity-100",
        )}
      />
      <div
        ref={ref}
        style={{
          ["--blur" as string]: `${blur}px`,
          ["--spread" as string]: `${spread}`,
          ["--start" as string]: "0",
          ["--active" as string]: "0",
          ["--glowingeffect-border-width" as string]: `${borderWidth}px`,
          ["--gradient" as string]: "radial-gradient(circle, #FF6B35 10%, #FF6B3500 20%), radial-gradient(circle at 40% 40%, #3B82F6 5%, #3B82F600 15%), repeating-conic-gradient(from 236.84deg at 50% 50%, #FF6B35 0%, #3B82F6 25%, #06b6d4 50%, #10b981 75%, #FF6B35 100%)",
        }}
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
          blur > 0 && "blur-[var(--blur)]",
          disabled && "!hidden",
          className,
        )}
      >
        <div
          className={cn(
            "glow rounded-[inherit]",
            'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
            "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
            "after:[background:var(--gradient)] after:[background-attachment:fixed]",
            "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
            "after:[mask-clip:padding-box,border-box]",
            "after:[mask-composite:intersect]",
            "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]",
          )}
        />
      </div>
    </>
  );
}

GlowingEffect.displayName = "GlowingEffect";
