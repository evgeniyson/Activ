"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, InputWithPrefix, Select } from "@/components/ui/field";
import { Plus, Trash2 } from "@/components/ui/icons";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { addExpenseAction, deleteExpenseAction } from "@/features/assets/actions";
import { CURRENCIES, CURRENCY_CODES, convert, type CurrencyCode } from "@/lib/currency";
import { formatDate, toISODate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { EXPENSE_LABELS, EXPENSE_TYPES, type AssetExpense, type ExpenseType } from "@/types/domain";

export function ExpensesPanel({ assetId, expenses, currency, defaultCurrency }: { assetId: string; expenses: AssetExpense[]; currency: CurrencyCode; defaultCurrency: CurrencyCode }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const total = expenses.reduce((s, e) => s + convert(e.amount, e.currency, currency), 0);

  const [type, setType] = useState<ExpenseType>("repair");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [cur, setCur] = useState<CurrencyCode>(defaultCurrency);
  const [date, setDate] = useState(toISODate(new Date()));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await addExpenseAction({ assetId, type, title, amount, currency: cur, date });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.push("Expense added — ownership cost updated.", "success");
      setOpen(false);
      setTitle("");
      setAmount("");
    });
  };

  return (
    <Panel>
      <PanelHeader
        index="E"
        title="Expenses"
        subtitle={expenses.length ? `${formatMoney(total, currency)} added to the cost of ownership` : "Repairs, accessories, maintenance — they all count."}
        action={
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> Add
          </Button>
        }
      />
      {expenses.length ? (
        <ul>
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center gap-4 border-b border-hair px-5 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="label-mono text-gray-2">
                  {EXPENSE_LABELS[e.type]} · {formatDate(e.date)}
                </p>
              </div>
              <span className="tnum text-sm font-bold">{formatMoney(e.amount, e.currency)}</span>
              <button
                type="button"
                aria-label={`Delete ${e.title}`}
                className="flex h-8 w-8 items-center justify-center text-gray-2 hover:text-orange-3"
                onClick={() =>
                  start(async () => {
                    const res = await deleteExpenseAction(assetId, e.id);
                    if (!res.ok) toast.push(res.error, "error");
                  })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-6 text-sm text-gray">No expenses yet. Add a repair or an accessory and the daily ownership cost recalculates instantly.</p>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Add expense" description="Included in the cost of ownership.">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as ExpenseType)}>
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EXPENSE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="What was it?" htmlFor="exp-title">
            <Input id="exp-title" required placeholder="Battery replacement" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Amount" htmlFor="exp-amount">
              <InputWithPrefix id="exp-amount" prefix={CURRENCIES[cur].symbol} required inputMode="decimal" placeholder="149" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Currency">
              <Select value={cur} onChange={(e) => setCur(e.target.value as CurrencyCode)} className="w-24">
                {CURRENCY_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Date" htmlFor="exp-date">
            <Input id="exp-date" type="date" required value={date} max={toISODate(new Date())} onChange={(e) => setDate(e.target.value)} />
          </Field>
          {error ? <p className="text-sm font-medium text-orange-3">{error}</p> : null}
          <Button type="submit" loading={pending} size="lg" className="mt-2">
            Add expense
          </Button>
        </form>
      </Sheet>
    </Panel>
  );
}
