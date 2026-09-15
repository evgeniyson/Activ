"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "@/components/ui/icons";

/**
 * Camera step. On devices with a live camera we show a viewfinder with a
 * shutter; everywhere else (and as a fallback) the native file picker with
 * `capture="environment"` opens the system camera.
 */
export function CameraCapture({ mode, onCapture }: { mode: "camera" | "upload"; onCapture: (file: File | Blob) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(mode === "camera");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  useEffect(() => {
    if (mode !== "camera") return;
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStarting(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setLive(true);
      } catch {
        setError("Доступ к камере заблокирован. Сделать фото всё равно можно кнопкой ниже.");
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [mode, stop]);

  const shutter = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stop();
        onCapture(blob);
      },
      "image/jpeg",
      0.9,
    );
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Выберите файл изображения.");
      return;
    }
    stop();
    onCapture(f);
  };

  return (
    <div>
      <span className="label-mono text-gray">{mode === "camera" ? "Сканирование" : "Загрузка"}</span>
      <h1 className="mt-2 text-3xl font-extrabold display-tight sm:text-4xl">{mode === "camera" ? "Поймайте предмет в кадр." : "Выберите фото."}</h1>
      <p className="mt-2 text-[15px] text-gray">Хороший свет, весь предмет в кадре, по возможности видны логотипы и разъёмы.</p>

      <div className="relative mt-6 aspect-[4/5] w-full overflow-hidden border border-ink bg-ink sm:aspect-[4/3]">
        <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${live ? "opacity-100" : "opacity-0"} transition-opacity duration-300`} />
        {!live ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-paper">
            {starting ? (
              <span className="label-mono text-paper/60">Запускаем камеру…</span>
            ) : (
              <>
                {mode === "camera" ? <Camera className="h-8 w-8 text-paper/60" strokeWidth={1.5} aria-hidden="true" /> : <Upload className="h-8 w-8 text-paper/60" strokeWidth={1.5} aria-hidden="true" />}
                <p className="max-w-xs text-sm text-paper/70">{error ?? (mode === "camera" ? "Сделайте фото камерой устройства." : "JPEG, PNG или HEIC до 15 МБ.")}</p>
              </>
            )}
          </div>
        ) : null}
        {/* viewfinder marks */}
        <div className="pointer-events-none absolute inset-6" aria-hidden="true">
          <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-orange" />
          <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-orange" />
          <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-orange" />
          <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-orange" />
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture={mode === "camera" ? "environment" : undefined} className="sr-only" onChange={onFile} aria-label={mode === "camera" ? "Сделать фото" : "Выбрать фото"} />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {live ? (
          <Button size="lg" variant="accent" className="flex-1" onClick={shutter}>
            <Camera className="h-5 w-5" aria-hidden="true" /> Сделать фото
          </Button>
        ) : (
          <Button size="lg" variant="accent" className="flex-1" onClick={() => inputRef.current?.click()}>
            {mode === "camera" ? <Camera className="h-5 w-5" aria-hidden="true" /> : <Upload className="h-5 w-5" aria-hidden="true" />}
            {mode === "camera" ? "Открыть камеру" : "Выбрать фото"}
          </Button>
        )}
        {live ? (
          <Button size="lg" variant="outline" onClick={() => inputRef.current?.click()}>
            Загрузить файл
          </Button>
        ) : null}
      </div>
    </div>
  );
}
