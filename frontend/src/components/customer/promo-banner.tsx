"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { type Promo } from "@/lib/loyalty/types";

type Slide = { id: string; title: string; imageUrl: string; href: string };

const FALLBACK: Slide[] = [
  { id: "f1", title: "Iced Coffee",    imageUrl: "/polks/coffe.png",        href: "/promos" },
  { id: "f2", title: "Matcha Latte",   imageUrl: "/polks/matcha.png",       href: "/promos" },
  { id: "f3", title: "Vanilla Latte",  imageUrl: "/polks/vanillalatte.png", href: "/promos" },
];

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.imageUrl}
                alt={s.title}
                className="size-full object-cover"
                draggable={false}
              />
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
                      ? "h-1.5 w-4 rounded-full bg-white shadow-sm"
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
