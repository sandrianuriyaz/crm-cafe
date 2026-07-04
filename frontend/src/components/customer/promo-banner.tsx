"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { type Promo } from "@/lib/loyalty/types";

type Slide = { id: string; title: string; imageUrl?: string; href: string };

const FALLBACK: Slide[] = [
  { id: "brand", title: "POLKS Loyalty", href: "/promos" },
];

function BrandedSlide() {
  return (
    <div
      className="relative flex size-full flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1C2B36 0%, #25343F 55%, #1A3040 100%)" }}
    >
      {/* Subtle radial accents */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 15% 85%, rgba(246,184,75,0.12) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(246,184,75,0.08) 0%, transparent 55%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-2 px-8 text-center">
        <Image
          src="/polks/icon.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-auto brightness-0 invert opacity-90"
        />
        <p className="text-[24px] font-black tracking-[-0.03em] text-white">
          POLKS Loyalty
        </p>
        <p className="text-[12px] leading-relaxed text-white/55">
          Kumpulkan poin dari setiap kunjungan.
          <br />
          Tukar jadi reward istimewa.
        </p>
        <div className="mt-1 rounded-full bg-[#F6B84B]/15 px-4 py-1.5 ring-1 ring-[#F6B84B]/25">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F6B84B]">
            Mulai Kumpulkan Poin
          </span>
        </div>
      </div>
    </div>
  );
}

export function PromoBanner() {
  const [slides,   setSlides]   = useState<Slide[]>(FALLBACK);
  const [idx,      setIdx]      = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragX,    setDragX]    = useState(0);

  const isDragging = useRef(false);
  const startX     = useRef(0);
  const dragDist   = useRef(0);

  useEffect(() => {
    api<Promo[]>("/promos")
      .then((d) => {
        const active = d.filter((p) => p.status === "ACTIVE" && p.imageUrl);
        if (active.length >= 1) {
          setSlides(
            active.slice(0, 6).map((p) => ({
              id:       p.id,
              title:    p.title,
              imageUrl: p.imageUrl!,
              href:     `/promos/${p.id}`,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4200);
    return () => clearInterval(t);
  }, [slides.length]);

  const goTo = (next: number) => {
    isDragging.current = false;
    setIdx((next + slides.length) % slides.length);
    setDragging(false);
    setDragX(0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current     = e.clientX;
    dragDist.current   = 0;
    setDragging(true);
    setDragX(0);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startX.current;
    dragDist.current = dx;
    setDragX(dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startX.current;
    if (dx < -50)      goTo(idx + 1);
    else if (dx > 50)  goTo(idx - 1);
    else               { isDragging.current = false; setDragging(false); setDragX(0); }
  };

  return (
    <div className="mb-3">
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "16/9", touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { isDragging.current = false; setDragging(false); setDragX(0); }}
      >
        {/* Sliding track — slides follow the finger in real-time */}
        <div
          className="flex h-full"
          style={{
            transform:  `translateX(calc(-${idx * 100}% + ${dragX}px))`,
            transition: dragging ? "none" : "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {slides.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className="relative h-full w-full shrink-0 select-none"
              draggable={false}
              onClick={(e) => {
                if (Math.abs(dragDist.current) > 6) e.preventDefault();
              }}
            >
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imageUrl}
                  alt={s.title}
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : (
                <BrandedSlide />
              )}
            </Link>
          ))}
        </div>

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2.5">
            <div className="pointer-events-auto flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={
                    i === idx
                      ? "h-1.5 w-4 rounded-full bg-polks-card shadow-sm"
                      : "size-1.5 rounded-full bg-white/50"
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
