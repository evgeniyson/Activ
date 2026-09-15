"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Sheet } from "@/components/ui/sheet";
import { deleteAllDataAction, loadDemoPortfolioAction } from "@/features/demo/actions";

export function DangerZone() {
  const [open, setOpen] = useState(false);
  return (
    <Panel>
      <PanelHeader index="!" title="Данные" />
      <div className="flex flex-col gap-3 p-5">
        <form action={loadDemoPortfolioAction}>
          <Button type="submit" variant="outline" className="w-full">
            Загрузить демо-портфель
          </Button>
        </form>
        <Button variant="ghost" className="w-full text-orange-3 hover:bg-orange-3/10" onClick={() => setOpen(true)}>
          Удалить все мои данные
        </Button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Удалить всё?" description="Все активы, фото, расходы, история и уведомления будут удалены безвозвратно.">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <form action={deleteAllDataAction} className="flex-1">
            <Button type="submit" variant="danger" className="w-full">
              Удалить все данные
            </Button>
          </form>
        </div>
      </Sheet>
    </Panel>
  );
}
