"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

/** Uses the BarcodeDetector API where available, with a manual fallback. */
export function BarcodeCapture({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const supported = useSyncExternalStore(
    () => () => {},
    () => Boolean(window.BarcodeDetector && navigator.mediaDevices?.getUserMedia),
    () => false,
  );
  const [live, setLive] = useState(false);
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!supported || !window.BarcodeDetector) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setLive(true);
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const hit = codes.find((c) => /^\d{8,14}$/.test(c.rawValue));
            if (hit) {
              stopped = true;
              stream?.getTracks().forEach((t) => t.stop());
              onCode(hit.rawValue);
              return;
            }
          } catch {
            /* keep scanning */
          }
          raf = window.setTimeout(tick, 250);
        };
        tick();
      } catch {
        setLive(false);
      }
    })();
    return () => {
      stopped = true;
      clearTimeout(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCode, supported]);

  return (
    <div>
      <span className="label-mono text-gray">Штрих-код</span>
      <h1 className="mt-2 text-3xl font-extrabold display-tight sm:text-4xl">Отсканируйте коробку.</h1>
      <p className="mt-2 text-[15px] text-gray">Коды EAN или UPC на упаковке. Лучше всего работает с оригинальной коробкой.</p>
      {supported ? (
        <div className="relative mt-6 aspect-[4/3] w-full overflow-hidden border border-ink bg-ink">
          <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${live ? "opacity-100" : "opacity-0"}`} />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-orange" aria-hidden="true" />
          {!live ? <p className="absolute inset-0 flex items-center justify-center text-sm text-paper/70">Запускаем камеру…</p> : null}
        </div>
      ) : (
        <p className="mt-6 border border-dashed border-hair-strong p-4 text-sm text-gray">В этом браузере нет сканирования штрих-кодов с камеры. Введите цифры, напечатанные под штрих-кодом.</p>
      )}
      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.replace(/\D/g, "").length >= 8) onCode(manual);
        }}
      >
        <Field label="Номер штрих-кода" htmlFor="barcode-input" className="flex-1">
          <Input id="barcode-input" inputMode="numeric" placeholder="1959498368930" value={manual} onChange={(e) => setManual(e.target.value)} className="font-mono" />
        </Field>
        <Button type="submit" size="lg" variant="primary" className="h-12">
          Найти
        </Button>
      </form>
    </div>
  );
}
