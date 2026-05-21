"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ImageIcon,
  PackagePlus,
  RefreshCcw,
  Save,
} from "lucide-react";
import type { AdminCatalogAttributeRow } from "@/lib/admin-catalog";
import { categories, qualityStyles } from "@/lib/catalog";
import type { InventorySettings } from "@/lib/admin-inventory";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

type WizardValues = {
  brand: string;
  model: string;
  category: string;
  qualityGrade: string;
  color: string;
  compatibility: string;
  sku: string;
  slug: string;
  barcodeEan13: string;
  nameIt: string;
  nameZh: string;
  descriptionIt: string;
  descriptionZh: string;
  costPrice: string;
  retailPrice: string;
  b2bPrice: string;
  moq: string;
  stockOnHand: string;
  incomingQty: string;
  reorderPoint: string;
  safetyStock: string;
  preorderLeadTimeMinDays: string;
  preorderLeadTimeMaxDays: string;
  imageUrl: string;
};

type ManualField =
  | "sku"
  | "slug"
  | "nameIt"
  | "nameZh"
  | "descriptionIt"
  | "descriptionZh"
  | "retailPrice"
  | "b2bPrice";

type ConflictState = {
  status: "idle" | "pending" | "ready" | "error";
  message?: string;
  sku?: { exists: boolean; suggestion: string };
  slug?: { exists: boolean; suggestion: string };
};

const steps = [
  { id: 0, labelZh: "基础定位", labelIt: "Base" },
  { id: 1, labelZh: "自动编码", labelIt: "Codici" },
  { id: 2, labelZh: "名称文案", labelIt: "Testi" },
  { id: 3, labelZh: "价格规则", labelIt: "Prezzi" },
  { id: 4, labelZh: "库存规则", labelIt: "Stock" },
  { id: 5, labelZh: "图片参数", labelIt: "Media" },
];

const initialValues: WizardValues = {
  brand: "Apple",
  model: "",
  category: "screens",
  qualityGrade: "Soft OLED",
  color: "Black",
  compatibility: "",
  sku: "",
  slug: "",
  barcodeEan13: "",
  nameIt: "",
  nameZh: "",
  descriptionIt: "",
  descriptionZh: "",
  costPrice: "",
  retailPrice: "",
  b2bPrice: "",
  moq: "1",
  stockOnHand: "0",
  incomingQty: "0",
  reorderPoint: "5",
  safetyStock: "2",
  preorderLeadTimeMinDays: "7",
  preorderLeadTimeMaxDays: "14",
  imageUrl: "",
};

const initialManual: Record<ManualField, boolean> = {
  sku: false,
  slug: false,
  nameIt: false,
  nameZh: false,
  descriptionIt: false,
  descriptionZh: false,
  retailPrice: false,
  b2bPrice: false,
};

export function AdminProductCreateWizard({
  locale,
  csrfToken,
  returnTo,
  attributes,
  inventorySettings,
}: Readonly<{
  locale: Locale;
  csrfToken: string;
  returnTo: string;
  attributes: AdminCatalogAttributeRow[];
  inventorySettings: InventorySettings;
}>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<WizardValues>(() =>
    applyGeneratedValues(initialValues, initialManual, inventorySettings),
  );
  const [manual, setManual] = useState<Record<ManualField, boolean>>(initialManual);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [extraAttributes, setExtraAttributes] = useState("");
  const [stepError, setStepError] = useState("");
  const [conflict, setConflict] = useState<ConflictState>({ status: "idle" });
  const [imagePreview, setImagePreview] = useState("");

  const generated = buildGeneratedValues(values, inventorySettings);

  useEffect(() => {
    const sku = values.sku.trim();
    const slug = values.slug.trim();
    if (!sku && !slug) {
      const idleTimer = window.setTimeout(() => setConflict({ status: "idle" }), 0);
      return () => window.clearTimeout(idleTimer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setConflict({ status: "pending" });
      const params = new URLSearchParams({ sku, slug, locale });
      fetch(`/api/admin/products/check-conflict?${params.toString()}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error(await response.text());
          return response.json();
        })
        .then((data) => setConflict({ status: "ready", ...data }))
        .catch((error: Error) => {
          if (controller.signal.aborted) return;
          setConflict({
            status: "error",
            message: error.message || "Conflict check failed",
          });
        });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [values.sku, values.slug, locale]);

  const attributesText = useMemo(
    () => buildAttributesText(attributes, attributeValues, extraAttributes),
    [attributes, attributeValues, extraAttributes],
  );

  const hasConflict = Boolean(conflict.sku?.exists || conflict.slug?.exists);

  function updateValue(field: keyof WizardValues, value: string) {
    const nextManual = isManualField(field) ? { ...manual, [field]: true } : manual;
    if (isManualField(field)) setManual(nextManual);
    setValues((current) =>
      applyGeneratedValues({ ...current, [field]: value }, nextManual, inventorySettings),
    );
  }

  function applySuggestion(field: "sku" | "slug", suggestion: string) {
    updateValue(field, suggestion);
    setConflict((current) => ({
      ...current,
      [field]: { exists: false, suggestion },
    }));
  }

  function resetGenerated(fields: ManualField[]) {
    const nextManual = { ...manual };
    fields.forEach((field) => {
      nextManual[field] = false;
    });
    setManual(nextManual);
    setValues((current) => applyGeneratedValues(current, nextManual, inventorySettings));
  }

  function goNext() {
    const errors = validateStep(currentStep, values, hasConflict);
    if (errors.length) {
      setStepError(errors[0]);
      return;
    }
    setStepError("");
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const firstInvalidStep = steps.find((step) =>
      validateStep(step.id, values, hasConflict).length > 0,
    );

    if (firstInvalidStep) {
      event.preventDefault();
      setCurrentStep(firstInvalidStep.id);
      setStepError(validateStep(firstInvalidStep.id, values, hasConflict)[0]);
      return;
    }

    if (conflict.status === "pending") {
      event.preventDefault();
      setStepError(locale === "it" ? "Attendi il controllo SKU." : "请等待 SKU/slug 查重完成。");
    }
  }

  return (
    <form
      action="/api/admin/products"
      encType="multipart/form-data"
      method="post"
      onSubmit={handleSubmit}
      className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)]"
    >
      <HiddenProductFields
        attributesText={attributesText}
        csrfToken={csrfToken}
        locale={locale}
        returnTo={returnTo}
        values={values}
      />

      <aside className="space-y-3">
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <PackagePlus className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-stone-950">
                {locale === "it" ? "Nuovo SKU" : "新增 SKU"}
              </p>
              <p className="text-xs font-semibold text-stone-500">
                {locale === "it" ? "Singolo prodotto, default offline" : "单个商品，默认下架"}
              </p>
            </div>
          </div>
          <ol className="mt-4 space-y-1.5">
            {steps.map((step) => {
              const isDone = step.id < currentStep;
              const isActive = step.id === currentStep;
              const Icon = isDone ? CheckCircle2 : Circle;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={[
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-black transition",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-stone-500 hover:bg-slate-50 hover:text-stone-950",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{locale === "it" ? step.labelIt : step.labelZh}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <ProductPreview
          imagePreview={imagePreview || values.imageUrl}
          locale={locale}
          values={values}
        />
      </aside>

      <section className="min-w-0 space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-stone-400">
                {locale === "it" ? "Step" : "步骤"} {currentStep + 1} / {steps.length}
              </p>
              <h3 className="text-lg font-black text-stone-950">
                {locale === "it" ? steps[currentStep].labelIt : steps[currentStep].labelZh}
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                resetGenerated([
                  "sku",
                  "slug",
                  "nameIt",
                  "nameZh",
                  "descriptionIt",
                  "descriptionZh",
                  "retailPrice",
                  "b2bPrice",
                ])
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-blue-200 hover:text-blue-700"
            >
              <RefreshCcw className="h-4 w-4" />
              {locale === "it" ? "Rigenera" : "重新生成"}
            </button>
          </div>

          <div className="p-4">
            {stepError ? (
              <div className="mb-3 flex gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{stepError}</span>
              </div>
            ) : null}

            {currentStep === 0 ? (
              <StepBasics locale={locale} updateValue={updateValue} values={values} />
            ) : null}
            {currentStep === 1 ? (
              <StepCodes
                conflict={conflict}
                locale={locale}
                onApplySuggestion={applySuggestion}
                updateValue={updateValue}
                values={values}
              />
            ) : null}
            {currentStep === 2 ? (
              <StepCopy locale={locale} updateValue={updateValue} values={values} />
            ) : null}
            {currentStep === 3 ? (
              <StepPricing
                generated={generated}
                inventorySettings={inventorySettings}
                locale={locale}
                updateValue={updateValue}
                values={values}
              />
            ) : null}
            {currentStep === 4 ? (
              <StepInventory locale={locale} updateValue={updateValue} values={values} />
            ) : null}
            {currentStep === 5 ? (
              <StepMedia
                attributes={attributes}
                attributeValues={attributeValues}
                extraAttributes={extraAttributes}
                imagePreview={imagePreview}
                locale={locale}
                setAttributeValues={setAttributeValues}
                setExtraAttributes={setExtraAttributes}
                setImagePreview={setImagePreview}
                updateValue={updateValue}
                values={values}
              />
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-200/70 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-stone-500">
            {locale === "it"
              ? "Il prodotto verra creato offline. Pubblica dalla scheda SKU."
              : "创建后默认下架，可在 SKU 详情页检查后发布。"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => {
                setStepError("");
                setCurrentStep((step) => Math.max(step - 1, 0));
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === "it" ? "Indietro" : "上一步"}
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700"
              >
                {locale === "it" ? "Avanti" : "下一步"}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={conflict.status === "pending" || hasConflict}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save className="h-4 w-4" />
                {locale === "it" ? "Crea prodotto" : "创建商品"}
              </button>
            )}
          </div>
        </div>
      </section>
    </form>
  );
}

function HiddenProductFields({
  attributesText,
  csrfToken,
  locale,
  returnTo,
  values,
}: Readonly<{
  attributesText: string;
  csrfToken: string;
  locale: Locale;
  returnTo: string;
  values: WizardValues;
}>) {
  return (
    <>
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="isActive" value="false" />
      {Object.entries(values).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input type="hidden" name="attributes" value={attributesText} />
    </>
  );
}

function ProductPreview({
  imagePreview,
  locale,
  values,
}: Readonly<{
  imagePreview: string;
  locale: Locale;
  values: WizardValues;
}>) {
  const retail = Number(values.retailPrice || 0);
  const b2b = Number(values.b2bPrice || 0);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-stone-950">
          {locale === "it" ? "Anteprima" : "实时预览"}
        </p>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
          {locale === "it" ? "Offline" : "下架"}
        </span>
      </div>
      <div className="mt-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        {imagePreview ? (
          <img src={imagePreview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center text-slate-400">
            <ImageIcon className="mx-auto h-8 w-8" />
            <p className="mt-2 text-xs font-black">
              {locale === "it" ? "Carica immagine" : "上传图片"}
            </p>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-2">
        <p className="break-all font-mono text-xs font-black text-blue-700">
          {values.sku || "SKU"}
        </p>
        <p className="line-clamp-2 text-sm font-black text-stone-950">
          {(locale === "it" ? values.nameIt : values.nameZh) ||
            (locale === "it" ? "Nome prodotto" : "商品名称")}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <PreviewMetric label="Retail" value={formatMoney(retail, locale)} />
          <PreviewMetric label={locale === "it" ? "Wholesale" : "批发"} value={formatMoney(b2b, locale)} />
          <PreviewMetric label="Stock" value={values.stockOnHand || "0"} />
          <PreviewMetric label="Incoming" value={values.incomingQty || "0"} />
        </div>
      </div>
    </section>
  );
}

function PreviewMetric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-xs font-black text-stone-950">{value}</p>
    </div>
  );
}

function StepBasics({
  locale,
  updateValue,
  values,
}: StepProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label={locale === "it" ? "Brand" : "品牌"} value={values.brand} onChange={(value) => updateValue("brand", value)} />
      <Field label={locale === "it" ? "Modello" : "型号"} value={values.model} onChange={(value) => updateValue("model", value)} placeholder="iPhone 15 Pro" />
      <SelectField label={locale === "it" ? "Categoria" : "分类"} value={values.category} onChange={(value) => updateValue("category", value)}>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label[locale]}
          </option>
        ))}
      </SelectField>
      <SelectField label={locale === "it" ? "Qualita" : "品质"} value={values.qualityGrade} onChange={(value) => updateValue("qualityGrade", value)}>
        {Object.keys(qualityStyles).map((quality) => (
          <option key={quality} value={quality}>
            {quality}
          </option>
        ))}
      </SelectField>
      <Field label={locale === "it" ? "Colore" : "颜色"} value={values.color} onChange={(value) => updateValue("color", value)} placeholder="Black" />
      <Field label={locale === "it" ? "Compatibile" : "兼容型号"} value={values.compatibility} onChange={(value) => updateValue("compatibility", value)} placeholder="iPhone 15 Pro, A2848" />
    </div>
  );
}

function StepCodes({
  conflict,
  locale,
  onApplySuggestion,
  updateValue,
  values,
}: StepProps & {
  conflict: ConflictState;
  onApplySuggestion: (field: "sku" | "slug", suggestion: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="SKU" value={values.sku} onChange={(value) => updateValue("sku", value.toUpperCase())} />
        <Field label="Slug" value={values.slug} onChange={(value) => updateValue("slug", slugify(value))} />
        <Field label="EAN-13" value={values.barcodeEan13} onChange={(value) => updateValue("barcodeEan13", value)} required={false} />
      </div>
      <ConflictNotice
        conflict={conflict}
        locale={locale}
        onApplySuggestion={onApplySuggestion}
      />
    </div>
  );
}

function StepCopy({ locale, updateValue, values }: StepProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Nome IT" value={values.nameIt} onChange={(value) => updateValue("nameIt", value)} />
      <Field label="中文名" value={values.nameZh} onChange={(value) => updateValue("nameZh", value)} />
      <TextareaField label="Description IT" value={values.descriptionIt} onChange={(value) => updateValue("descriptionIt", value)} />
      <TextareaField label="中文描述" value={values.descriptionZh} onChange={(value) => updateValue("descriptionZh", value)} />
      <p className="md:col-span-2 text-xs font-semibold leading-5 text-slate-500">
        {locale === "it"
          ? "I testi sono generati da template locali e possono essere modificati."
          : "文案由本地模板生成，可以手动改，不调用 AI。"}
      </p>
    </div>
  );
}

function StepPricing({
  generated,
  inventorySettings,
  locale,
  updateValue,
  values,
}: StepProps & {
  generated: Pick<WizardValues, "retailPrice" | "b2bPrice">;
  inventorySettings: InventorySettings;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Cost EUR" value={values.costPrice} onChange={(value) => updateValue("costPrice", value)} type="number" step="0.01" />
        <Field label="Retail EUR" value={values.retailPrice} onChange={(value) => updateValue("retailPrice", value)} type="number" step="0.01" />
        <Field label={locale === "it" ? "Wholesale EUR" : "批发 EUR"} value={values.b2bPrice} onChange={(value) => updateValue("b2bPrice", value)} type="number" step="0.01" />
        <Field label="MOQ" value={values.moq} onChange={(value) => updateValue("moq", value)} type="number" step="1" />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <SuggestionCard
          label={locale === "it" ? "Retail suggerito" : "建议零售价"}
          value={`${generated.retailPrice || "0.00"} EUR`}
          note={`x${inventorySettings.retailMarkup}`}
        />
        <SuggestionCard
          label={locale === "it" ? "Wholesale suggerito" : "建议批发价"}
          value={`${generated.b2bPrice || "0.00"} EUR`}
          note={`x${inventorySettings.b2bMarkup}`}
        />
      </div>
    </div>
  );
}

function StepInventory({ locale, updateValue, values }: StepProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label={locale === "it" ? "Stock fisico" : "现货"} value={values.stockOnHand} onChange={(value) => updateValue("stockOnHand", value)} type="number" />
      <Field label={locale === "it" ? "In arrivo" : "在途"} value={values.incomingQty} onChange={(value) => updateValue("incomingQty", value)} type="number" />
      <Field label={locale === "it" ? "Punto riordino" : "低库存阈值"} value={values.reorderPoint} onChange={(value) => updateValue("reorderPoint", value)} type="number" />
      <Field label={locale === "it" ? "Stock sicurezza" : "安全库存"} value={values.safetyStock} onChange={(value) => updateValue("safetyStock", value)} type="number" />
      <Field label={locale === "it" ? "Arrivo min giorni" : "预计到货最小天数"} value={values.preorderLeadTimeMinDays} onChange={(value) => updateValue("preorderLeadTimeMinDays", value)} type="number" />
      <Field label={locale === "it" ? "Arrivo max giorni" : "预计到货最大天数"} value={values.preorderLeadTimeMaxDays} onChange={(value) => updateValue("preorderLeadTimeMaxDays", value)} type="number" />
    </div>
  );
}

function StepMedia({
  attributes,
  attributeValues,
  extraAttributes,
  imagePreview,
  locale,
  setAttributeValues,
  setExtraAttributes,
  setImagePreview,
  updateValue,
  values,
}: StepProps & {
  attributes: AdminCatalogAttributeRow[];
  attributeValues: Record<string, string>;
  extraAttributes: string;
  imagePreview: string;
  setAttributeValues: Dispatch<SetStateAction<Record<string, string>>>;
  setExtraAttributes: (value: string) => void;
  setImagePreview: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-stone-500">
            {locale === "it" ? "Immagine prodotto" : "商品图片"}
          </span>
          <input
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="mt-1.5 block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm font-semibold text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
            name="imageFile"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setImagePreview("");
                return;
              }
              setImagePreview(URL.createObjectURL(file));
            }}
            type="file"
          />
        </label>
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          {imagePreview || values.imageUrl ? (
            <img src={imagePreview || values.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-slate-400" />
          )}
        </div>
        <Field
          className="md:col-span-2"
          label={locale === "it" ? "URL immagine fallback" : "备用图片 URL"}
          value={values.imageUrl}
          onChange={(value) => updateValue("imageUrl", value)}
          required={false}
        />
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-wide text-stone-500">
          {locale === "it" ? "Parametri guidati" : "引导参数"}
        </p>
        {attributes.length ? (
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {attributes.map((attribute) => (
              <AttributeControl
                key={attribute.id}
                attribute={attribute}
                locale={locale}
                value={attributeValues[attribute.key] ?? ""}
                onChange={(value) =>
                  setAttributeValues((current) => ({
                    ...current,
                    [attribute.key]: value,
                  }))
                }
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            {locale === "it" ? "Nessun parametro configurato." : "暂无已配置参数，可在高级参数里补充。"}
          </p>
        )}
      </div>

      <TextareaField
        label={locale === "it" ? "Parametri avanzati key=value" : "高级参数 key=value"}
        value={extraAttributes}
        onChange={setExtraAttributes}
        placeholder={"screen_technology=soft-oled\nwith_frame=yes"}
      />
    </div>
  );
}

function ConflictNotice({
  conflict,
  locale,
  onApplySuggestion,
}: Readonly<{
  conflict: ConflictState;
  locale: Locale;
  onApplySuggestion: (field: "sku" | "slug", suggestion: string) => void;
}>) {
  if (conflict.status === "pending") {
    return (
      <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
        {locale === "it" ? "Controllo duplicati..." : "正在检查 SKU / slug 是否重复..."}
      </div>
    );
  }

  if (conflict.status === "error") {
    return (
      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
        {locale === "it" ? "Controllo duplicati non riuscito." : "查重失败，请稍后重试。"}
      </div>
    );
  }

  const conflicts = [
    conflict.sku?.exists ? { field: "sku" as const, label: "SKU", suggestion: conflict.sku.suggestion } : null,
    conflict.slug?.exists ? { field: "slug" as const, label: "Slug", suggestion: conflict.slug.suggestion } : null,
  ].filter(Boolean) as Array<{ field: "sku" | "slug"; label: string; suggestion: string }>;

  if (!conflicts.length) {
    return (
      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
        {locale === "it" ? "SKU e slug disponibili." : "SKU 和 slug 可用。"}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50 p-3">
      {conflicts.map((item) => (
        <div key={item.field} className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-900">
          <span>
            {item.label} {locale === "it" ? "gia esistente" : "已存在"}
          </span>
          <button
            type="button"
            onClick={() => onApplySuggestion(item.field, item.suggestion)}
            className="rounded-md bg-white px-2 py-1 font-black text-blue-700 ring-1 ring-amber-200"
          >
            {locale === "it" ? "Usa" : "使用"} {item.suggestion}
          </button>
        </div>
      ))}
    </div>
  );
}

function AttributeControl({
  attribute,
  locale,
  onChange,
  value,
}: Readonly<{
  attribute: AdminCatalogAttributeRow;
  locale: Locale;
  onChange: (value: string) => void;
  value: string;
}>) {
  const label = locale === "it" ? attribute.labelIt : attribute.labelZh;
  if (attribute.inputType === "select" && attribute.options.length) {
    return (
      <SelectField label={label} value={value} onChange={onChange}>
        <option value="">{locale === "it" ? "Non impostato" : "未设置"}</option>
        {attribute.options.map((option) => (
          <option key={option.value} value={option.value}>
            {locale === "it" ? option.labelIt : option.labelZh}
          </option>
        ))}
      </SelectField>
    );
  }

  if (attribute.inputType === "boolean") {
    return (
      <SelectField label={label} value={value} onChange={onChange}>
        <option value="">{locale === "it" ? "Non impostato" : "未设置"}</option>
        <option value="yes">{locale === "it" ? "Si" : "是"}</option>
        <option value="no">{locale === "it" ? "No" : "否"}</option>
      </SelectField>
    );
  }

  return (
    <Field
      label={attribute.unit ? `${label} (${attribute.unit})` : label}
      onChange={onChange}
      required={false}
      type={attribute.inputType === "number" ? "number" : "text"}
      value={value}
    />
  );
}

type StepProps = {
  locale: Locale;
  updateValue: (field: keyof WizardValues, value: string) => void;
  values: WizardValues;
};

function Field({
  className = "",
  label,
  onChange,
  placeholder,
  required = true,
  step,
  type = "text",
  value,
}: Readonly<{
  className?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
  type?: string;
  value: string;
}>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-black uppercase tracking-wide text-stone-500">
        {label}
        {!required ? <span className="ml-1 text-stone-300">optional</span> : null}
      </span>
      <input
        className="mt-1.5 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: Readonly<{
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <select
        className="mt-1.5 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-stone-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  onChange,
  placeholder,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}>) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <textarea
        className="mt-1.5 min-h-28 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SuggestionCard({
  label,
  note,
  value,
}: Readonly<{ label: string; note: string; value: string }>) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
      <p className="text-xs font-black uppercase text-blue-500">{label}</p>
      <p className="mt-1 text-lg font-black text-blue-950">{value}</p>
      <p className="text-xs font-semibold text-blue-600">{note}</p>
    </div>
  );
}

function validateStep(step: number, values: WizardValues, hasConflict: boolean) {
  const errors: string[] = [];
  if (step === 0) {
    if (!values.brand.trim()) errors.push("请输入品牌。");
    if (!values.model.trim()) errors.push("请输入型号。");
    if (!values.category.trim()) errors.push("请选择分类。");
    if (!values.qualityGrade.trim()) errors.push("请选择品质。");
  }
  if (step === 1) {
    if (!values.sku.trim()) errors.push("请输入 SKU。");
    if (!values.slug.trim()) errors.push("请输入 slug。");
    if (hasConflict) errors.push("SKU 或 slug 已存在，请使用建议后缀或手动修改。");
  }
  if (step === 2) {
    if (!values.nameIt.trim()) errors.push("请填写意文名。");
    if (!values.nameZh.trim()) errors.push("请填写中文名。");
  }
  if (step === 3) {
    if (Number(values.costPrice) <= 0) errors.push("请输入大于 0 的成本价。");
    if (Number(values.retailPrice) < 0) errors.push("零售价不能小于 0。");
    if (Number(values.b2bPrice) < 0) errors.push("批发价不能小于 0。");
    if (Number(values.moq) <= 0) errors.push("MOQ 必须大于 0。");
  }
  if (step === 4) {
    const numericFields = [
      values.stockOnHand,
      values.incomingQty,
      values.reorderPoint,
      values.safetyStock,
      values.preorderLeadTimeMinDays,
      values.preorderLeadTimeMaxDays,
    ];
    if (numericFields.some((value) => Number(value) < 0 || !Number.isFinite(Number(value)))) {
      errors.push("库存字段必须是大于等于 0 的数字。");
    }
    if (Number(values.preorderLeadTimeMaxDays) < Number(values.preorderLeadTimeMinDays)) {
      errors.push("预计到货最大天数不能小于最小天数。");
    }
  }
  return errors;
}

function applyGeneratedValues(
  values: WizardValues,
  manual: Record<ManualField, boolean>,
  settings: InventorySettings,
) {
  const generated = buildGeneratedValues(values, settings);
  const next = { ...values };
  if (!manual.sku) next.sku = generated.sku;
  if (!manual.slug) next.slug = generated.slug;
  if (!manual.nameIt) next.nameIt = generated.nameIt;
  if (!manual.nameZh) next.nameZh = generated.nameZh;
  if (!manual.descriptionIt) next.descriptionIt = generated.descriptionIt;
  if (!manual.descriptionZh) next.descriptionZh = generated.descriptionZh;
  if (!manual.retailPrice) next.retailPrice = generated.retailPrice;
  if (!manual.b2bPrice) next.b2bPrice = generated.b2bPrice;
  return shallowEqual(values, next) ? values : next;
}

function buildGeneratedValues(values: WizardValues, settings: InventorySettings): WizardValues {
  const category = categories.find((item) => item.id === values.category);
  const categoryIt = category?.label.it ?? values.category;
  const categoryZh = category?.label.zh ?? values.category;
  const model = values.model.trim();
  const color = values.color.trim();
  const colorZh = translateColor(color, "zh");
  const colorIt = translateColor(color, "it");
  const quality = values.qualityGrade.trim();
  const nameIt = [categoryIt, model, quality, colorIt].filter(Boolean).join(" ");
  const nameZh = [model, quality, colorZh, categoryZh].filter(Boolean).join(" ");
  const cost = Number(values.costPrice || 0);
  const retailPrice = cost > 0 ? roundMoney(cost * settings.retailMarkup) : "";
  const b2bPrice = cost > 0 ? roundMoney(cost * settings.b2bMarkup) : "";
  const compatibility = values.compatibility.trim() || model;
  const moq = values.moq || "1";

  return {
    ...values,
    sku: buildSku(values),
    slug: slugify([values.brand, model, values.category, quality, color].filter(Boolean).join(" ")),
    nameIt,
    nameZh,
    descriptionIt: nameIt
      ? `${nameIt} per riparazioni professionali. Compatibile con ${compatibility}. MOQ ${moq}.`
      : "",
    descriptionZh: nameZh
      ? `${nameZh}，适合维修店和批发客户采购。兼容 ${compatibility}，MOQ ${moq}。`
      : "",
    retailPrice,
    b2bPrice,
  };
}

function buildSku(values: Pick<WizardValues, "brand" | "model" | "category" | "qualityGrade" | "color">) {
  return [
    codeFor(values.brand, brandCodes),
    modelCode(values.brand, values.model),
    codeFor(values.category, categoryCodes),
    codeFor(values.qualityGrade, qualityCodes),
    codeFor(values.color, colorCodes),
  ]
    .filter(Boolean)
    .join("-");
}

const brandCodes: Record<string, string> = {
  apple: "APL",
  samsung: "SAM",
  xiaomi: "XIA",
  huawei: "HUA",
  oppo: "OPO",
  vivo: "VIV",
};

const categoryCodes: Record<string, string> = {
  screens: "SCR",
  batteries: "BAT",
  "charging-ports": "CHP",
  "dock-connectors": "DCK",
  "back-covers": "BCK",
  cameras: "CAM",
  tools: "TOL",
};

const qualityCodes: Record<string, string> = {
  "original pull": "OP",
  "refurbished original": "RO",
  "service pack": "SP",
  "soft oled": "SO",
  "hard oled": "HO",
  "tft / incell": "TFT",
  "high quality compatible": "HQ",
  clearance: "CLR",
};

const colorCodes: Record<string, string> = {
  black: "BLK",
  white: "WHT",
  blue: "BLU",
  gold: "GLD",
  silver: "SLV",
  green: "GRN",
  purple: "PRP",
  red: "RED",
};

const colorTranslations: Record<string, { it: string; zh: string }> = {
  black: { it: "nero", zh: "黑色" },
  white: { it: "bianco", zh: "白色" },
  blue: { it: "blu", zh: "蓝色" },
  gold: { it: "oro", zh: "金色" },
  silver: { it: "argento", zh: "银色" },
  green: { it: "verde", zh: "绿色" },
  purple: { it: "viola", zh: "紫色" },
  red: { it: "rosso", zh: "红色" },
};

function codeFor(value: string, map: Record<string, string>) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return map[normalized] ?? normalized.replace(/[^a-z0-9]+/g, "").slice(0, 3).toUpperCase();
}

function modelCode(brand: string, model: string) {
  const normalizedBrand = brand.trim().toLowerCase();
  let value = model.trim();
  if (normalizedBrand && value.toLowerCase().startsWith(normalizedBrand)) {
    value = value.slice(brand.length).trim();
  }
  value = value
    .replace(/iphone/gi, "IP")
    .replace(/galaxy/gi, "")
    .replace(/pro max/gi, "PM")
    .replace(/pro/gi, "P")
    .replace(/plus/gi, "PL")
    .replace(/ultra/gi, "U")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
  return value.slice(0, 10);
}

function translateColor(value: string, locale: Locale) {
  const normalized = value.trim().toLowerCase();
  return colorTranslations[normalized]?.[locale] ?? value;
}

function roundMoney(value: number) {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

function buildAttributesText(
  attributes: AdminCatalogAttributeRow[],
  attributeValues: Record<string, string>,
  extraAttributes: string,
) {
  const guided = attributes
    .map((attribute) => {
      const value = attributeValues[attribute.key]?.trim();
      return value ? `${attribute.key}=${value}` : "";
    })
    .filter(Boolean);
  const extra = extraAttributes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return [...guided, ...extra].join("\n");
}

function isManualField(field: keyof WizardValues): field is ManualField {
  return [
    "sku",
    "slug",
    "nameIt",
    "nameZh",
    "descriptionIt",
    "descriptionZh",
    "retailPrice",
    "b2bPrice",
  ].includes(field);
}

function shallowEqual(left: WizardValues, right: WizardValues) {
  return (Object.keys(left) as Array<keyof WizardValues>).every(
    (key) => left[key] === right[key],
  );
}
