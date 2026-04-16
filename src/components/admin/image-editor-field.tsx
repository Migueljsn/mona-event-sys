"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 400 * 1024; // 400 KB
const OUTPUT_WIDTH = 1600;
const OUTPUT_HEIGHT = 1200;
const CROP_RATIO = OUTPUT_WIDTH / OUTPUT_HEIGHT; // 4 : 3
const CROP_DISPLAY_WIDTH = 360; // largura do editor em tela (px)

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ImageEditorFieldProps = {
  initialImageUrl?: string | null;
  disabled?: boolean;
  onFileReady?: (file: File | null) => void;
};

type LoadedImage = {
  element: HTMLImageElement;
  width: number;
  height: number;
  sourceUrl: string;
};

/** Posição do canto superior-esquerdo da imagem dentro da janela de corte. */
type CropState = { x: number; y: number };

// ─── Helpers puros ────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Escala mínima para preencher a janela de corte sem deixar bordas vazias. */
function fitScale(iw: number, ih: number, cw: number, ch: number) {
  return Math.max(cw / iw, ch / ih);
}

/** Garante que a imagem não deixe espaço vazio dentro da janela de corte. */
function constrainCrop(
  x: number,
  y: number,
  image: LoadedImage,
  cw: number,
  ch: number,
): CropState {
  const scale = fitScale(image.width, image.height, cw, ch);
  return {
    x: clamp(x, cw - image.width * scale, 0),
    y: clamp(y, ch - image.height * scale, 0),
  };
}

function centerCrop(image: LoadedImage, cw: number, ch: number): CropState {
  const scale = fitScale(image.width, image.height, cw, ch);
  return {
    x: (cw - image.width * scale) / 2,
    y: (ch - image.height * scale) / 2,
  };
}

// ─── I/O de imagem ────────────────────────────────────────────────────────────

function loadImage(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({ element: img, width: img.naturalWidth, height: img.naturalHeight, sourceUrl: url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir a imagem. Verifique o arquivo."));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar blob."))),
      mime,
      quality,
    );
  });
}

/**
 * Desenha o recorte no canvas com as dimensões de saída desejadas.
 * Nunca amplia além das dimensões naturais da imagem de origem.
 */
function renderCrop(
  image: LoadedImage,
  crop: CropState,
  cw: number,
  ch: number,
  outW: number,
  outH: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não disponível neste navegador.");

  const scale = fitScale(image.width, image.height, cw, ch);
  const srcX = Math.max(0, -crop.x / scale);
  const srcY = Math.max(0, -crop.y / scale);
  ctx.drawImage(image.element, srcX, srcY, cw / scale, ch / scale, 0, 0, outW, outH);
  return canvas;
}

/**
 * Exporta o arquivo final aplicando compressão progressiva.
 *
 * Estratégia:
 * 1. Nunca amplia além das dimensões naturais da imagem.
 * 2. Tenta WebP; se não couber em 400 KB, tenta JPEG como fallback.
 * 3. Reduz dimensões progressivamente (100 % → 75 % → 50 % → 35 %).
 * 4. Nunca lança erro por tamanho — retorna o melhor resultado possível.
 */
async function exportFile(
  image: LoadedImage,
  crop: CropState,
  cw: number,
  ch: number,
  originalName: string,
): Promise<File> {
  // Limita a saída às dimensões naturais da imagem (sem ampliar)
  const capW = Math.min(OUTPUT_WIDTH, image.width);
  const capH = Math.min(OUTPUT_HEIGHT, image.height);

  const steps = [
    { w: capW,                      h: capH                      },
    { w: Math.round(capW * 0.75),   h: Math.round(capH * 0.75)   },
    { w: Math.round(capW * 0.5),    h: Math.round(capH * 0.5)    },
    { w: Math.round(capW * 0.35),   h: Math.round(capH * 0.35)   },
  ].filter(({ w, h }) => w >= 160 && h >= 120);

  let bestBlob: Blob | null = null;

  outer: for (const { w, h } of steps) {
    const canvas = renderCrop(image, crop, cw, ch, w, h);

    for (const mime of ["image/webp", "image/jpeg"] as const) {
      let quality = 0.92;
      let blob = await toBlob(canvas, mime, quality);

      while (blob.size > MAX_FILE_BYTES && quality > 0.12) {
        quality = Math.max(quality - 0.06, 0.12);
        blob = await toBlob(canvas, mime, quality);
      }

      // Guarda o menor resultado visto até agora como "melhor esforço"
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;

      if (blob.size <= MAX_FILE_BYTES) break outer;
    }
  }

  if (!bestBlob) throw new Error("Falha inesperada ao gerar a imagem.");

  const ext = bestBlob.type === "image/webp" ? "webp" : "jpg";
  const stem = originalName.replace(/\.[^.]+$/, "") || "card-image";
  return new File([bestBlob], `${stem}.${ext}`, {
    type: bestBlob.type,
    lastModified: Date.now(),
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ImageEditorField({
  initialImageUrl,
  disabled = false,
  onFileReady,
}: ImageEditorFieldProps) {
  const filePickerRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl ?? "");
  const [hasEditedFile, setHasEditedFile] = useState(false);
  const [sourceFileName, setSourceFileName] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [cropState, setCropState] = useState<CropState>({ x: 0, y: 0 });

  const cropH = CROP_DISPLAY_WIDTH / CROP_RATIO;

  // Limpa object URLs ao desmontar / trocar
  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (loadedImage?.sourceUrl) URL.revokeObjectURL(loadedImage.sourceUrl);
    };
  }, [loadedImage]);

  /** Estilo CSS da imagem dentro da janela de corte */
  const imageStyle = useMemo(() => {
    if (!loadedImage) return null;
    const scale = fitScale(loadedImage.width, loadedImage.height, CROP_DISPLAY_WIDTH, cropH);
    return {
      width: loadedImage.width * scale,
      height: loadedImage.height * scale,
      transform: `translate(${cropState.x}px, ${cropState.y}px)`,
    };
  }, [cropH, cropState, loadedImage]);

  async function handleFileChange(file: File) {
    setEditorError("");

    // Aceita qualquer imagem que o browser consiga decodificar
    if (!file.type.startsWith("image/")) {
      setEditorError("Selecione um arquivo de imagem (JPG, PNG, WebP, etc.).");
      return;
    }

    try {
      const image = await loadImage(file);
      if (loadedImage?.sourceUrl) URL.revokeObjectURL(loadedImage.sourceUrl);
      setLoadedImage(image);
      setSourceFileName(file.name);
      setCropState(centerCrop(image, CROP_DISPLAY_WIDTH, cropH));
      setIsEditorOpen(true);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Falha ao abrir a imagem.");
    }
  }

  async function applyEdit() {
    if (!loadedImage) return;
    setIsPreparing(true);
    setEditorError("");

    try {
      const file = await exportFile(loadedImage, cropState, CROP_DISPLAY_WIDTH, cropH, sourceFileName);
      onFileReady?.(file);
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      if (loadedImage.sourceUrl) URL.revokeObjectURL(loadedImage.sourceUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setHasEditedFile(true);
      setLoadedImage(null);
      setIsEditorOpen(false);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Falha ao aplicar o corte.");
    } finally {
      setIsPreparing(false);
    }
  }

  function clearImage() {
    setEditorError("");
    if (filePickerRef.current) filePickerRef.current.value = "";
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    if (loadedImage?.sourceUrl) URL.revokeObjectURL(loadedImage.sourceUrl);
    onFileReady?.(null);
    setPreviewUrl(initialImageUrl ?? "");
    setHasEditedFile(false);
    setLoadedImage(null);
    setSourceFileName("");
  }

  const showClear = hasEditedFile || (!!initialImageUrl && previewUrl === initialImageUrl);

  return (
    <div className="grid gap-3">
      {/* ── Painel principal ───────────────────────────────────────────── */}
      <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-sand)] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">Imagem do card</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
              Recorte 4:3. Arraste para reposicionar. Exportação WebP/JPG até 400 KB.
            </p>
          </div>
          {showClear && (
            <button
              type="button"
              onClick={clearImage}
              disabled={disabled}
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-white disabled:opacity-60"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="mt-4 grid items-start gap-4 md:grid-cols-[220px_1fr]">
          {/* Preview */}
          <div className="overflow-hidden rounded-[1.25rem] border border-[var(--color-line)]">
            <div
              className="relative aspect-[4/3] bg-cover bg-center"
              style={{
                backgroundImage: previewUrl
                  ? `url(${previewUrl})`
                  : "linear-gradient(135deg,#d9b298,#f4e2d1)",
              }}
            >
              {hasEditedFile && (
                <div className="absolute bottom-2 right-2 rounded-full bg-green-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  Pronta para upload
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-3">
            <p className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white px-4 py-3 text-xs leading-5 text-[var(--color-muted)]">
              Use uma imagem horizontal e mantenha o assunto principal mais ao centro.
              O editor serve para acertar enquadramento e corte.
            </p>

            <div className="flex flex-wrap gap-3">
              <label className="cursor-pointer rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                {hasEditedFile ? "Trocar imagem" : "Selecionar imagem"}
                <input
                  ref={filePickerRef}
                  type="file"
                  accept="image/*"
                  disabled={disabled}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await handleFileChange(file);
                    e.target.value = "";
                  }}
                />
              </label>

              {loadedImage && (
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  disabled={disabled}
                  className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white disabled:opacity-60"
                >
                  Reabrir editor
                </button>
              )}
            </div>

            {editorError && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {editorError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal do editor ────────────────────────────────────────────── */}
      {isEditorOpen && loadedImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(36,23,16,0.65)] p-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Editor de imagem
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-[var(--color-ink)]">
                  Ajuste o enquadramento
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Arraste a imagem para reposicionar dentro do quadro 4:3.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-sand)]"
              >
                Fechar
              </button>
            </div>

            {/* Janela de corte */}
            <div className="mt-5 flex flex-col items-center gap-5">
              <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-sand)] p-4">
                <div
                  className="relative mx-auto cursor-grab overflow-hidden rounded-[1rem] border border-white/70 shadow-inner active:cursor-grabbing"
                  style={{ width: CROP_DISPLAY_WIDTH, height: cropH, touchAction: "none" }}
                  onPointerDown={(e) => {
                    dragRef.current = {
                      pointerId: e.pointerId,
                      startX: e.clientX,
                      startY: e.clientY,
                      originX: cropState.x,
                      originY: cropState.y,
                    };
                    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
                    const next = constrainCrop(
                      dragRef.current.originX + (e.clientX - dragRef.current.startX),
                      dragRef.current.originY + (e.clientY - dragRef.current.startY),
                      loadedImage,
                      CROP_DISPLAY_WIDTH,
                      cropH,
                    );
                    setCropState(next);
                  }}
                  onPointerUp={(e) => {
                    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
                  }}
                  onPointerCancel={(e) => {
                    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
                  }}
                >
                  <img
                    src={loadedImage.sourceUrl}
                    alt="Pré-visualização"
                    className="absolute left-0 top-0 max-w-none select-none"
                    style={imageStyle ?? undefined}
                    draggable={false}
                  />
                </div>
              </div>

              {/* Ações do editor */}
              <div className="flex w-full flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={applyEdit}
                  disabled={isPreparing}
                  className="rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {isPreparing ? "Processando..." : "Aplicar corte"}
                </button>
                <button
                  type="button"
                  onClick={() => setCropState(centerCrop(loadedImage, CROP_DISPLAY_WIDTH, cropH))}
                  className="rounded-full border border-[var(--color-line)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-sand)]"
                >
                  Centralizar
                </button>
              </div>

              {editorError && (
                <p className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {editorError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
