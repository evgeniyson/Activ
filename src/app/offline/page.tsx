import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Нет связи", robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="safe-top safe-bottom flex min-h-dvh flex-col items-start justify-center gap-6 px-6 sm:px-12">
      <Wordmark height={18} />
      <span className="label-mono text-gray">Нет соединения</span>
      <h1 className="max-w-lg text-4xl font-extrabold display-tight sm:text-5xl">Вы офлайн.</h1>
      <p className="max-w-md text-[15px] text-gray">Для свежих оценок портфелю нужно соединение. Подключитесь и попробуйте снова — всё добавленное сохранено.</p>
      <ButtonLink href="/app" variant="primary">
        Попробовать снова
      </ButtonLink>
    </div>
  );
}
