"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useTransition } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { completeOnboardingAction } from "@/features/profile/actions";
import { cn } from "@/lib/cn";

const SCREENS = [
  {
    eyebrow: "01 / 03",
    title: "Узнайте, сколько на самом деле стоят ваши вещи.",
    body: "Телефоны, ноутбуки, камеры, консоли — у всего, что имеет ценник, есть рыночная стоимость, и она меняется каждую неделю. АКТИВ следит за ней за вас.",
  },
  {
    eyebrow: "02 / 03",
    title: "Четыре главные цифры для каждой вещи.",
    body: "Рыночная стоимость сегодня, общее обесценивание, во сколько обходится владение в день и за сколько можно продать.",
    list: ["Рыночная стоимость", "Обесценивание", "Стоимость владения", "Цена продажи"],
  },
  {
    eyebrow: "03 / 03",
    title: "Добавьте первый актив.",
    body: "Наведите камеру на что-нибудь своё. Через несколько секунд вы увидите, сколько заплатили, сколько это стоит сейчас и во сколько вам обошлось.",
  },
];

export function Onboarding() {
  const [i, setI] = useState(0);
  const [pending, start] = useTransition();
  const reduce = useReducedMotion();
  const last = i === SCREENS.length - 1;
  const s = SCREENS[i];

  return (
    <div className="safe-top safe-bottom flex min-h-dvh flex-col bg-paper">
      <div className="flex items-center justify-between px-5 py-6 sm:px-10">
        <Wordmark height={18} priority />
        <button type="button" className="label-mono-md text-gray hover:text-ink" onClick={() => start(() => completeOnboardingAction("dashboard"))}>
          Пропустить
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 sm:px-10">
        <div className="mx-auto w-full max-w-2xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={i}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="label-mono text-orange">{s.eyebrow}</span>
              <h1 className="mt-4 text-4xl font-extrabold display-tight sm:text-6xl">{s.title}</h1>
              <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-gray">{s.body}</p>
              {s.list ? (
                <ul className="mt-8 grid grid-cols-2 gap-px border border-ink bg-ink sm:grid-cols-4">
                  {s.list.map((item, k) => (
                    <li key={item} className={cn("flex flex-col gap-3 p-4", k === 0 ? "bg-orange" : "bg-paper")}>
                      <span className="label-mono text-gray">{String(k + 1).padStart(2, "0")}</span>
                      <span className="text-sm font-bold">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {last ? (
                <div className="mt-8 grid gap-px border border-ink bg-ink sm:grid-cols-2">
                  <div className="bg-paper p-5">
                    <span className="label-mono text-gray">Вы заплатили</span>
                    <p className="tnum mt-1 text-3xl font-extrabold display-tight">139 990 ₽</p>
                  </div>
                  <div className="bg-ink p-5 text-paper">
                    <span className="label-mono text-paper/60">Сегодня стоит</span>
                    <p className="tnum mt-1 text-3xl font-extrabold display-tight">≈ 96 000 ₽</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 py-8 sm:px-10">
        <div className="flex gap-1.5" aria-label={`Шаг ${i + 1} из ${SCREENS.length}`}>
          {SCREENS.map((_, k) => (
            <span key={k} className={cn("h-1.5 w-8 transition-colors duration-300", k <= i ? "bg-ink" : "bg-hair")} />
          ))}
        </div>
        <div className="flex gap-2">
          {i > 0 ? (
            <Button variant="ghost" onClick={() => setI(i - 1)}>
              Назад
            </Button>
          ) : null}
          {last ? (
            <>
              <Button variant="outline" loading={pending} onClick={() => start(() => completeOnboardingAction("dashboard"))}>
                Позже
              </Button>
              <Button variant="accent" size="lg" loading={pending} onClick={() => start(() => completeOnboardingAction("scan"))}>
                Отсканировать предмет →
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={() => setI(i + 1)}>
              Продолжить →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
