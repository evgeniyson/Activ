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
      <PanelHeader index="!" title="Data" />
      <div className="flex flex-col gap-3 p-5">
        <form action={loadDemoPortfolioAction}>
          <Button type="submit" variant="outline" className="w-full">
            Load demo portfolio
          </Button>
        </form>
        <Button variant="ghost" className="w-full text-orange-3 hover:bg-orange-3/10" onClick={() => setOpen(true)}>
          Delete all my data
        </Button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Delete everything?" description="All assets, photos, expenses, history and notifications will be removed permanently.">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <form action={deleteAllDataAction} className="flex-1">
            <Button type="submit" variant="danger" className="w-full">
              Delete all data
            </Button>
          </form>
        </div>
      </Sheet>
    </Panel>
  );
}
