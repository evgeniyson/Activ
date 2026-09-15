"use client";

import { Barcode, Camera, PenLine, Upload } from "@/components/ui/icons";
import type { AddMethod } from "./add-asset-flow";

export function MethodPicker({ onChoose, aiEnabled }: { onChoose: (m: AddMethod) => void; aiEnabled: boolean }) {
  return (
    <div>
      <span className="label-mono text-gray">Добавить актив</span>
      <h1 className="mt-2 text-3xl font-extrabold display-tight sm:text-4xl">Что добавляем?</h1>
      <p className="mt-2 text-[15px] text-gray">Наведите камеру. Мы распознаем модель и оценим, сколько она стоит сегодня.</p>

      <button
        type="button"
        onClick={() => onChoose("camera")}
        className="crop-marks group relative mt-6 flex w-full flex-col items-start gap-6 bg-orange p-6 text-left text-ink transition-colors hover:bg-orange-2 sm:p-8"
      >
        <span className="flex h-12 w-12 items-center justify-center bg-ink text-paper">
          <Camera className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-2xl font-extrabold display-tight sm:text-3xl">Сканировать камерой</span>
          <span className="mt-1 block text-[14px] text-ink/75">{aiEnabled ? "AI-распознавание · около 5 секунд" : "Демо-распознавание · подключите AI-ключ для реального распознавания"}</span>
        </span>
        <span className="label-mono absolute right-6 top-6 text-ink/60 group-hover:text-ink">→</span>
      </button>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <MethodCard icon={Upload} title="Загрузить фото" desc="Из галереи" onClick={() => onChoose("upload")} />
        <MethodCard icon={PenLine} title="Добавить вручную" desc="Ввести модель" onClick={() => onChoose("manual")} />
        <MethodCard icon={Barcode} title="Штрих-код" desc="EAN / UPC на коробке" onClick={() => onChoose("barcode")} />
      </div>
    </div>
  );
}

function MethodCard({ icon: Icon, title, desc, onClick }: { icon: typeof Camera; title: string; desc: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-4 border border-hair bg-paper p-4 text-left transition-colors hover:border-ink sm:flex-col sm:items-start sm:gap-5 sm:p-5">
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <span>
        <span className="block text-[15px] font-bold">{title}</span>
        <span className="block text-[12px] text-gray">{desc}</span>
      </span>
    </button>
  );
}
