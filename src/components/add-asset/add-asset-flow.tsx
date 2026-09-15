"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, X } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { createAssetAction, type CreatedAssetSummary } from "@/features/assets/actions";
import type { CurrencyCode } from "@/lib/currency";
import type { IdentificationResult } from "@/services/identification/types";
import { emptyAssetForm, formToPayload, type AssetFormValues } from "@/components/assets/asset-form-fields";
import { AnalyzingStep } from "./analyzing-step";
import { BarcodeCapture } from "./barcode-capture";
import { CameraCapture } from "./camera-capture";
import { ConfirmStep } from "./confirm-step";
import { MethodPicker } from "./method-picker";
import { PurchaseStep } from "./purchase-step";
import { ResultStep } from "./result-step";
import { track } from "@/lib/analytics";

export type AddMethod = "camera" | "upload" | "manual" | "barcode";
type Step = "method" | "capture" | "analyzing" | "confirm" | "purchase" | "saving" | "done";

export interface ScanImage {
  storagePath: string;
  url: string;
  width: number | null;
  height: number | null;
}

interface IdentifyResponse {
  identification?: IdentificationResult;
  image?: ScanImage | null;
  error?: string;
  code?: string;
}

const STEP_INDEX: Record<Step, string> = { method: "01", capture: "02", analyzing: "03", confirm: "04", purchase: "05", saving: "06", done: "07" };

export function AddAssetFlow({ initialMethod, currency, aiEnabled }: { initialMethod: AddMethod | null; currency: CurrencyCode; aiEnabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const reduce = useReducedMotion();
  const [method, setMethod] = useState<AddMethod | null>(initialMethod);
  const [step, setStep] = useState<Step>(initialMethod ? (initialMethod === "manual" ? "confirm" : "capture") : "method");
  const [preview, setPreview] = useState<string | null>(null);
  const [scanImage, setScanImage] = useState<ScanImage | null>(null);
  const [identification, setIdentification] = useState<IdentificationResult | null>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [form, setForm] = useState<AssetFormValues>(() => emptyAssetForm(currency));
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedAssetSummary | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const choose = (m: AddMethod) => {
    setMethod(m);
    setStep(m === "manual" ? "confirm" : "capture");
  };

  const applyIdentification = useCallback((id: IdentificationResult) => {
    setIdentification(id);
    setCatalogId(id.catalogId);
    setSpecs(id.specs);
    setForm((f) => ({
      ...f,
      name: id.name,
      category: id.category,
      manufacturer: id.manufacturer ?? "",
      model: id.model ?? "",
      variant: id.variant ?? "",
    }));
  }, []);

  const analyze = useCallback(
    async (file: File | Blob, hint?: string) => {
      setStep("analyzing");
      setAnalysisDone(false);
      setIdentifyError(null);
      const controller = new AbortController();
      abortRef.current = controller;
      const fd = new FormData();
      fd.append("image", file, "scan.jpg");
      if (hint) fd.append("hint", hint);
      try {
        const res = await fetch("/api/identify", { method: "POST", body: fd, signal: controller.signal });
        const json = (await res.json().catch(() => ({}))) as IdentifyResponse;
        if (json.image) setScanImage(json.image);
        if (!res.ok || !json.identification) {
          setIdentifyError(json.error ?? "Не удалось распознать предмет.");
          setAnalysisDone(true);
          return;
        }
        applyIdentification(json.identification);
        setAnalysisDone(true);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setIdentifyError(navigator.onLine ? "Что-то пошло не так при анализе фото." : "Вы офлайн. Подключитесь к интернету для распознавания или добавьте предмет вручную.");
        setAnalysisDone(true);
      }
    },
    [applyIdentification],
  );

  const onCapture = (file: File | Blob) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    void analyze(file);
  };

  const onBarcode = async (code: string) => {
    setStep("analyzing");
    setAnalysisDone(false);
    setIdentifyError(null);
    try {
      const res = await fetch("/api/identify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barcode: code }) });
      const json = (await res.json().catch(() => ({}))) as IdentifyResponse;
      if (!res.ok || !json.identification) {
        setIdentifyError(json.error ?? "Штрих-код не найден.");
      } else {
        applyIdentification(json.identification);
      }
    } catch {
      setIdentifyError("Не удалось найти этот штрих-код.");
    } finally {
      setAnalysisDone(true);
    }
  };

  const save = () => {
    setStep("saving");
    setSaveError(null);
    startTransition(async () => {
      const res = await createAssetAction({
        ...formToPayload(form),
        specs,
        catalogId,
        identificationConfidence: identification?.confidence ?? null,
        scanImage,
      });
      if (!res.ok) {
        setSaveError(res.error);
        setStep("purchase");
        toast.push(res.error, "error");
        return;
      }
      setResult(res.data);
      setStep("done");
      router.refresh();
    });
  };

  const back = () => {
    if (step === "capture") setStep("method");
    else if (step === "confirm") setStep(method === "manual" ? "method" : "capture");
    else if (step === "purchase") setStep("confirm");
    else router.push("/app");
  };

  const reset = () => {
    setStep("method");
    setMethod(null);
    setPreview(null);
    setScanImage(null);
    setIdentification(null);
    setIdentifyError(null);
    setForm(emptyAssetForm(currency));
    setSpecs({});
    setCatalogId(null);
    setResult(null);
  };

  const variants = reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12 } };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        {step !== "done" && step !== "analyzing" && step !== "saving" ? (
          <button type="button" onClick={back} className="label-mono-md inline-flex items-center gap-1.5 text-gray hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Назад
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-4">
          <span className="label-mono text-gray-2">
            Шаг {STEP_INDEX[step]} <span className="text-hair-strong">/</span> 07
          </span>
          <Link href="/app" aria-label="Закрыть" className="flex h-9 w-9 items-center justify-center text-gray hover:text-ink">
            <X className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} {...variants} transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}>
          {step === "method" ? <MethodPicker onChoose={choose} aiEnabled={aiEnabled} /> : null}
          {step === "capture" && (method === "camera" || method === "upload") ? <CameraCapture mode={method} onCapture={onCapture} /> : null}
          {step === "capture" && method === "barcode" ? <BarcodeCapture onCode={onBarcode} /> : null}
          {step === "analyzing" ? (
            <AnalyzingStep
              preview={preview}
              done={analysisDone}
              error={identifyError}
              recognized={identification?.recognized ?? true}
              onContinue={() => {
                if (identification?.recognized) {
                  track("asset_identified", { confidence: identification.confidence });
                  setStep("confirm");
                }
              }}
              onRetry={() => {
                setIdentifyError(null);
                setStep("capture");
              }}
              onManual={() => {
                setIdentification(null);
                setStep("confirm");
              }}
            />
          ) : null}
          {step === "confirm" ? (
            <ConfirmStep
              preview={preview}
              identification={identification}
              form={form}
              setForm={setForm}
              specs={specs}
              setSpecs={setSpecs}
              catalogId={catalogId}
              setCatalogId={setCatalogId}
              onNext={() => setStep("purchase")}
              onRetake={() => setStep("capture")}
              manual={method === "manual"}
            />
          ) : null}
          {step === "purchase" || step === "saving" ? <PurchaseStep form={form} setForm={setForm} onSubmit={save} saving={step === "saving"} error={saveError} /> : null}
          {step === "done" && result ? <ResultStep result={result} onAddAnother={reset} preview={preview} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
