import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Reveal } from "@/components/marketing/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ArrowDown, ArrowRight, Camera, Lock, ShieldCheck, TrendingDown, Wallet } from "@/components/ui/icons";
import { getCurrentUser } from "@/services/auth/session";

export const metadata: Metadata = {
  title: "АКТИВ — узнайте, сколько на самом деле стоят ваши вещи",
  description: "Рыночная стоимость, обесценивание и реальная цена владения всем, что у вас есть. Финансовый портфель для физических вещей.",
  alternates: { canonical: "/" },
};

const DEMO_ROWS = [
  { name: "iPhone 17 Pro", paid: "139 990 ₽", now: "96 000 ₽", pct: "−31,4%" },
  { name: "MacBook Air M4", paid: "149 990 ₽", now: "93 000 ₽", pct: "−38,0%" },
  { name: "Sony α7 IV", paid: "259 990 ₽", now: "137 000 ₽", pct: "−47,3%" },
  { name: "PlayStation 5", paid: "59 990 ₽", now: "25 000 ₽", pct: "−58,3%" },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const appHref = user ? "/app" : "/signup";

  return (
    <div className="bg-paper text-ink">
      <header className="safe-top sticky top-0 z-40 border-b border-hair bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Wordmark href="/" height={18} priority />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Разделы сайта">
            <a href="#how" className="label-mono-md text-gray hover:text-ink">
              Как это работает
            </a>
            <a href="#depreciation" className="label-mono-md text-gray hover:text-ink">
              Обесценивание
            </a>
            <a href="#privacy" className="label-mono-md text-gray hover:text-ink">
              Приватность
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <ButtonLink href="/app" size="sm">
                Открыть приложение
              </ButtonLink>
            ) : (
              <>
                <Link href="/login" className="label-mono-md hidden px-3 text-ink sm:block">
                  Войти
                </Link>
                <ButtonLink href="/signup" size="sm" variant="accent">
                  Начать
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-12 lg:gap-6 lg:pb-24 lg:pt-28">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="label-mono text-orange">001 / ОС для личных активов</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
                Узнайте, сколько <span className="text-orange">на самом деле</span> стоят ваши вещи.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray sm:text-xl">Рыночная стоимость, обесценивание и реальная цена владения всем, что у вас есть. Инвестиционный портфель — для телефона, ноутбука, камеры и консоли.</p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={appHref} size="lg" variant="accent">
                  Начать отслеживать <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="#how" size="lg" variant="outline">
                  Как это работает <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="label-mono mt-6 text-gray-2">Бесплатно на время беты · Устанавливается как приложение · Приватно</p>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="lg:col-span-5">
            <div className="crop-marks relative border border-ink bg-paper">
              <div className="absolute -right-3 -top-3 h-24 w-24 bg-orange sm:-right-6 sm:-top-6 sm:h-36 sm:w-36" aria-hidden="true" />
              <div className="relative border-b border-hair px-5 py-4">
                <span className="label-mono text-gray">Ваши активы</span>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <span className="tnum text-4xl font-extrabold display-tight">351 000 ₽</span>
                  <span className="tnum mb-1 text-sm font-semibold text-orange-3">−258 960 ₽ · −42,5%</span>
                </div>
                <span className="label-mono text-gray-2">Куплено за 609 960 ₽</span>
              </div>
              <svg viewBox="0 0 400 110" className="h-28 w-full" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#E85002" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#E85002" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 22 C 50 26, 80 40, 130 44 S 220 58, 280 70 S 360 86, 400 84 L400 110 L0 110 Z" fill="url(#lg)" />
                <path d="M0 22 C 50 26, 80 40, 130 44 S 220 58, 280 70 S 360 86, 400 84" fill="none" stroke="#E85002" strokeWidth="2" />
              </svg>
              <ul>
                {DEMO_ROWS.map((r, i) => (
                  <li key={r.name} className="flex items-center gap-3 border-t border-hair px-5 py-3">
                    <span className="label-mono w-7 text-gray-2">{String(i + 1).padStart(3, "0")}</span>
                    <span className="flex-1 text-sm font-bold">{r.name}</span>
                    <span className="tnum hidden text-[12px] text-gray sm:block">{r.paid}</span>
                    <span className="tnum text-sm font-bold">{r.now}</span>
                    <span className="tnum w-14 text-right text-[12px] font-semibold text-orange-3">{r.pct}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
        <div className="overflow-hidden border-y border-hair bg-ink py-3 text-paper">
          <div className="marquee flex w-max gap-12 whitespace-nowrap label-mono-md">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k} className="flex gap-12">
                {["Рыночная стоимость", "Обесценивание", "Стоимость владения", "Цена продажи", "Продавать или держать?", "Стоимость апгрейда", "История цены", "Гарантия", "Ежемесячный отчёт"].map((t) => (
                  <span key={t} className="flex items-center gap-12">
                    {t} <span className="text-orange">■</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <span className="label-mono text-gray">002 / Как это работает</span>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold display-tight sm:text-5xl">Фото → подтвердить → цена. Готово.</h2>
        </Reveal>
        <div className="mt-10 grid gap-px border border-ink bg-ink md:grid-cols-4">
          {[
            { n: "01", t: "Сканируйте", d: "Наведите камеру на предмет. AI определит производителя, модель и видимые характеристики." },
            { n: "02", t: "Подтвердите", d: "Ответьте на пару вопросов, которых не видно на фото — память, издание — и поправьте, что нужно." },
            { n: "03", t: "Укажите цену", d: "Цена покупки, дата и состояние. Чеки, серийные номера и гарантия — по желанию." },
            { n: "04", t: "Увидьте правду", d: "Рыночная стоимость, диапазон, обесценивание и цена владения в день. Мгновенно." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <div className={`flex h-full flex-col gap-6 p-6 ${i === 3 ? "bg-orange" : "bg-paper"}`}>
                <span className="label-mono text-gray">{s.n}</span>
                <h3 className="text-xl font-bold display-tight">{s.t}</h3>
                <p className="text-[14px] leading-relaxed text-gray">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="depreciation" className="scroll-mt-20 border-y border-hair bg-paper-2">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
          <Reveal>
            <span className="label-mono text-gray">003 / Обесценивание</span>
            <h2 className="mt-3 text-3xl font-extrabold display-tight sm:text-5xl">Каждое устройство теряет деньги. Узнайте, как быстро.</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-gray">Новый телефон теряет треть цены за первый год. Камера держится лучше. Видеокарта зависит от следующего анонса. АКТИВ ведёт историю цены каждой вещи, чтобы вы видели кривую, а не только сегодняшнюю цифру.</p>
            <ul className="mt-8 space-y-3 text-[15px]">
              {["Оценка с реалистичным диапазоном — без фальшивых копеек", "Раздельная уверенность в распознавании и в оценке", "Сегодня — детерминированная модель, завтра — данные Авито и маркетплейсов, тот же интерфейс"].map((t) => (
                <li key={t} className="flex gap-3">
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-orange" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="border border-ink bg-paper">
              <div className="flex items-center justify-between border-b border-hair px-5 py-3">
                <span className="text-sm font-bold">iPhone 17 Pro</span>
                <span className="label-mono text-gray-2">256 GB · Отличное</span>
              </div>
              <div className="grid grid-cols-3 gap-px bg-hair">
                <div className="bg-paper p-4">
                  <span className="label-mono text-gray">Покупка</span>
                  <p className="tnum mt-1 text-xl font-extrabold">139 990 ₽</p>
                </div>
                <div className="bg-ink p-4 text-paper">
                  <span className="label-mono text-paper/60">Сейчас</span>
                  <p className="tnum mt-1 text-xl font-extrabold">96 000 ₽</p>
                </div>
                <div className="bg-orange p-4">
                  <span className="label-mono text-ink/70">Потеря</span>
                  <p className="tnum mt-1 text-xl font-extrabold">−31%</p>
                </div>
              </div>
              <svg viewBox="0 0 400 140" className="h-40 w-full" preserveAspectRatio="none" aria-hidden="true">
                <line x1="0" y1="24" x2="400" y2="24" stroke="#A7A7A7" strokeDasharray="3 3" />
                <path d="M0 24 C 40 40, 70 62, 120 70 S 220 90, 290 98 S 370 106, 400 108" fill="none" stroke="#E85002" strokeWidth="2.5" />
                <path d="M0 30 C 40 48, 70 72, 120 82 S 220 104, 290 112 S 370 120, 400 122 L400 96 C 370 94, 290 86, 220 78 S 120 58, 70 50 S 30 30, 0 18 Z" fill="#000" fillOpacity="0.06" />
              </svg>
              <div className="flex justify-between border-t border-hair px-5 py-2">
                <span className="label-mono text-gray-2">Окт 2025</span>
                <span className="label-mono text-gray-2">Диапазон 90 000 — 101 000 ₽</span>
                <span className="label-mono text-gray-2">Сен 2026</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal className="order-2 lg:order-1">
            <div className="grid gap-px border border-ink bg-ink sm:grid-cols-2">
              <div className="bg-paper p-6">
                <span className="label-mono text-gray">Покупка</span>
                <p className="tnum mt-1 text-3xl font-extrabold display-tight">139 990 ₽</p>
              </div>
              <div className="bg-paper p-6">
                <span className="label-mono text-gray">Текущая стоимость</span>
                <p className="tnum mt-1 text-3xl font-extrabold display-tight">96 000 ₽</p>
              </div>
              <div className="bg-paper p-6">
                <span className="label-mono text-gray">Во владении</span>
                <p className="tnum mt-1 text-3xl font-extrabold display-tight">330 дней</p>
              </div>
              <div className="bg-orange p-6">
                <span className="label-mono text-ink/70">В день</span>
                <p className="tnum mt-1 text-3xl font-extrabold display-tight">133 ₽/день</p>
              </div>
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2" delay={0.05}>
            <span className="label-mono text-gray">004 / Стоимость владения</span>
            <h2 className="mt-3 text-3xl font-extrabold display-tight sm:text-5xl">Поймите, во сколько вам на самом деле обходятся ваши вещи.</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-gray">
              Цена покупки плюс ремонт, аксессуары и обслуживание, минус то, сколько вещь стоит сегодня, — разделить на дни владения. Одна цифра, которая делает вопрос «стоит ли держать?» простым.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-orange" aria-hidden="true" />
              <span className="text-sm font-semibold">Добавьте замену аккумулятора за 14 900 ₽ — и дневная стоимость пересчитается мгновенно.</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
          <Reveal>
            <span className="label-mono text-orange">005 / AI-сканирование</span>
            <h2 className="mt-3 text-3xl font-extrabold display-tight sm:text-5xl">Он видит модель. И спрашивает о том, чего не видно.</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-paper/70">Модель компьютерного зрения читает логотипы, разъёмы и расположение камер, чтобы определить продукт. Когда память или поколение нельзя понять по фото, она спрашивает вас, а не угадывает. Результат всегда можно поправить.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="border border-paper/30">
              <div className="flex items-center gap-3 border-b border-paper/20 px-5 py-3">
                <Camera className="h-4 w-4 text-orange" aria-hidden="true" />
                <span className="label-mono text-paper/60">Фото → результат AI</span>
                <span className="label-mono ml-auto text-orange">уверенность 94%</span>
              </div>
              <div className="px-5 py-5">
                <p className="text-[13px] text-paper/60">Apple</p>
                <p className="text-3xl font-extrabold display-tight">iPhone 17 Pro</p>
                <p className="mt-1 text-[13px] text-paper/60">Чёрный · титановая рамка</p>
                <p className="label-mono mt-6 text-paper/60">Объём памяти?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["256 GB", "512 GB", "1 TB", "Не уверен"].map((o, i) => (
                    <span key={o} className={`inline-flex h-9 items-center border px-3 text-sm font-semibold ${i === 0 ? "border-orange bg-orange text-ink" : "border-paper/30 text-paper/80"}`}>
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <span className="label-mono text-gray">006 / Продавать или держать</span>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold display-tight sm:text-5xl">Прямой ответ на вопрос «стоит ли продавать?»</h2>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-gray">Скорость обесценивания, тренд, возраст продукта, ближайший анонс, ликвидность и спрос — в одном выводе: держать, подумать о продаже или хороший момент продать. Вероятностно, с объяснением, без гарантий.</p>
        </Reveal>
        <div className="mt-10 grid gap-px border border-ink bg-ink md:grid-cols-3">
          {[
            { v: "Держать", d: "Sony α7 IV — цена стабильна, спрос высокий, преемник не давит.", tone: "bg-paper" },
            { v: "Подумать о продаже", d: "iPhone 17 Pro — потерял ~11% за 90 дней; до обновления линейки несколько недель.", tone: "bg-ink text-paper" },
            { v: "Апгрейд за 49 000 ₽", d: "iPhone 18 Pro за 145 000 ₽ минус сегодняшняя цена продажи 96 000 ₽.", tone: "bg-orange" },
          ].map((c, i) => (
            <Reveal key={c.v} delay={i * 0.06}>
              <div className={`flex h-full flex-col gap-4 p-6 ${c.tone}`}>
                <span className="label-mono opacity-60">0{i + 1}</span>
                <h3 className="text-2xl font-extrabold display-tight">{c.v}</h3>
                <p className="text-[14px] leading-relaxed opacity-75">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="privacy" className="scroll-mt-20 border-y border-hair bg-paper-2">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-3 lg:py-24">
          <Reveal className="lg:col-span-1">
            <span className="label-mono text-gray">007 / Приватность</span>
            <h2 className="mt-3 text-3xl font-extrabold display-tight sm:text-4xl">Ваши вещи — только ваше дело.</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {[
              { icon: Lock, t: "Приватно по умолчанию", d: "Ничего не публикуется. Ни лент, ни социального слоя, ни публичных коллекций, пока вы сами этого не захотите." },
              { icon: ShieldCheck, t: "Защита на уровне строк", d: "Каждый актив, фото, чек и запись о цене привязаны к вашему аккаунту на уровне базы данных." },
              { icon: Camera, t: "Фото остаются приватными", d: "Изображения и документы хранятся в закрытом хранилище и доступны только вам." },
              { icon: TrendingDown, t: "Без навязчивой аналитики", d: "Продуктовая аналитика — только события, без личных данных. Серийные номера не покидают ваш аккаунт." },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 0.05}>
                <div className="flex h-full gap-4 border border-hair bg-paper p-5">
                  <f.icon className="h-5 w-5 shrink-0 text-orange" aria-hidden="true" />
                  <div>
                    <h3 className="text-[15px] font-bold">{f.t}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-gray">{f.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <div className="crop-marks relative overflow-hidden border border-ink bg-paper px-6 py-14 sm:px-12 sm:py-20">
            <div className="grid-dots absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="absolute -bottom-10 -right-10 h-48 w-48 bg-orange sm:h-64 sm:w-64" aria-hidden="true" />
            <div className="relative max-w-2xl">
              <span className="label-mono text-gray">008 / Старт</span>
              <h2 className="mt-3 text-4xl font-extrabold display-tight sm:text-6xl">Вы заплатили 139 990 ₽. Сейчас это стоит около 96 000 ₽. Теперь вы знаете.</h2>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={appHref} size="lg" variant="accent">
                  Начать отслеживать <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/login" size="lg" variant="outline">
                  Войти
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-hair">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <Image src="/brand/mark-black.png" alt="" width={22} height={22} style={{ width: 22, height: "auto" }} />
            <Wordmark height={14} />
            <span className="label-mono text-gray-2">ОС для личных активов</span>
          </div>
          <div className="flex flex-wrap gap-6 label-mono-md text-gray">
            <a href="#how" className="hover:text-ink">
              Как это работает
            </a>
            <a href="#privacy" className="hover:text-ink">
              Приватность
            </a>
            <Link href="/login" className="hover:text-ink">
              Войти
            </Link>
          </div>
          <p className="label-mono text-gray-2">© {new Date().getFullYear()} АКТИВ · Оценки, а не экспертиза.</p>
        </div>
      </footer>
    </div>
  );
}
