"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";

const MAX_IMAGE_FILE_SIZE_BYTES = 400 * 1024;
const OUTPUT_WIDTH = 1600;
const OUTPUT_HEIGHT = 1200;
const CROP_RATIO = OUTPUT_WIDTH / OUTPUT_HEIGHT;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type ImageEditorFieldProps = {
  initialImageUrl?: string | null;
  disabled?: boolean;
  /** Chamado com o File processado quando o corte é aplicado, ou null quando o campo é limpo. */
  onFileReady?: (file: File | null) => void;
};

type LoadedImage = {
  element: HTMLImageElement;
  width: number;
  height: number;
  sourceUrl: string;
};

type CropState = {
  x: number;
  y: number;
  zoom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getBaseScale(
  imageWidth: number,
  imageHeight: number,
  cropWidth: number,
  cropHeight: number,
) {
  return Math.max(cropWidth / imageWidth, cropHeight / imageHeight);
}

function constrainPosition(
  nextX: number,
  nextY: number,
  image: LoadedImage,
  cropWidth: number,
  cropHeight: number,
  zoom: number,
) {
  const baseScale = getBaseScale(
    image.width,
    image.height,
    cropWidth,
    cropHeight,
  );
  const scaledWidth = image.width * baseScale * zoom;
  const scaledHeight = image.height * baseScale * zoom;
  const minX = cropWidth - scaledWidth;
  const minY = cropHeight - scaledHeight;

  return {
    x: clamp(nextX, minX, 0),
    y: clamp(nextY, minY, 0),
  };
}

function getCenteredCropState(
  image: LoadedImage,
  cropWidth: number,
  cropHeight: number,
): CropState {
  const baseScale = getBaseScale(
    image.width,
    image.height,
    cropWidth,
    cropHeight,
  );
  const scaledWidth = image.width * baseScale;
  const scaledHeight = image.height * baseScale;

  return {
    x: (cropWidth - scaledWidth) / 2,
    y: (cropHeight - scaledHeight) / 2,
    zoom: 1,
  };
}

function loadImage(file: File) {
  return new Promise<LoadedImage>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        element: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        sourceUrl: objectUrl,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível carregar a imagem selecionada."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Falha ao gerar a imagem editada."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function drawCropToCanvas(
  image: LoadedImage,
  cropState: CropState,
  cropWidth: number,
  cropHeight: number,
  outWidth: number,
  outHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível preparar o editor de imagem.");
  }

  const baseScale = getBaseScale(
    image.width,
    image.height,
    cropWidth,
    cropHeight,
  );
  const displayScale = baseScale * cropState.zoom;
  const sourceX = Math.max(0, -cropState.x / displayScale);
  const sourceY = Math.max(0, -cropState.y / displayScale);
  const sourceWidth = cropWidth / displayScale;
  const sourceHeight = cropHeight / displayScale;

  context.drawImage(
    image.element,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outWidth,
    outHeight,
  );

  return canvas;
}

async function compressToLimit(
  canvas: HTMLCanvasElement,
  startQuality: number,
): Promise<Blob | null> {
  let quality = startQuality;
  let blob = await canvasToBlob(canvas, "image/webp", quality);

  while (blob.size > MAX_IMAGE_FILE_SIZE_BYTES && quality > 0.15) {
    quality -= 0.07;
    blob = await canvasToBlob(canvas, "image/webp", Math.max(quality, 0.15));
  }

  return blob.size <= MAX_IMAGE_FILE_SIZE_BYTES ? blob : null;
}

async function exportEditedFile(
  image: LoadedImage,
  cropState: CropState,
  cropWidth: number,
  cropHeight: number,
  originalName: string,
) {
  // Tentativas progressivas: qualidade decrescente na resolução máxima,
  // depois redução de dimensões se ainda estiver acima do limite.
  const dimensionSteps = [
    { w: OUTPUT_WIDTH, h: OUTPUT_HEIGHT }, // 1600 × 1200
    { w: Math.round(OUTPUT_WIDTH * 0.75), h: Math.round(OUTPUT_HEIGHT * 0.75) }, // 1200 × 900
    { w: Math.round(OUTPUT_WIDTH * 0.5), h: Math.round(OUTPUT_HEIGHT * 0.5) }, // 800 × 600
    { w: Math.round(OUTPUT_WIDTH * 0.35), h: Math.round(OUTPUT_HEIGHT * 0.35) }, // ~560 × 420
  ];

  let finalBlob: Blob | null = null;

  for (const { w, h } of dimensionSteps) {
    const canvas = drawCropToCanvas(
      image,
      cropState,
      cropWidth,
      cropHeight,
      w,
      h,
    );
    finalBlob = await compressToLimit(canvas, 0.92);
    if (finalBlob) break;
  }

  if (!finalBlob) {
    throw new Error(
      "Não foi possível reduzir a imagem para menos de 400 KB. Tente usar uma imagem com menos detalhes.",
    );
  }

  const fileStem = originalName.replace(/\.[^.]+$/, "") || "card-image";

  return new File([finalBlob], `${fileStem}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export function ImageEditorField({
  initialImageUrl,
  disabled = false,
  onFileReady,
}: ImageEditorFieldProps) {
  const filePickerRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<{
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
  const [cropState, setCropState] = useState<CropState>({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const cropDimensions = useMemo(() => {
    const width = 360;
    return { width, height: width / CROP_RATIO };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (loadedImage?.sourceUrl) {
        URL.revokeObjectURL(loadedImage.sourceUrl);
      }
    };
  }, [loadedImage]);

  const renderedImageStyle = useMemo(() => {
    if (!loadedImage) return null;

    const baseScale = getBaseScale(
      loadedImage.width,
      loadedImage.height,
      cropDimensions.width,
      cropDimensions.height,
    );
    const scale = baseScale * cropState.zoom;

    return {
      width: loadedImage.width * scale,
      height: loadedImage.height * scale,
      transform: `translate(${cropState.x}px, ${cropState.y}px)`,
    };
  }, [cropDimensions.height, cropDimensions.width, cropState, loadedImage]);

  async function handleRawFileSelection(file: File) {
    setEditorError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setEditorError("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }

    try {
      const image = await loadImage(file);

      if (loadedImage?.sourceUrl) {
        URL.revokeObjectURL(loadedImage.sourceUrl);
      }

      setLoadedImage(image);
      setSourceFileName(file.name);
      setCropState(
        getCenteredCropState(
          image,
          cropDimensions.width,
          cropDimensions.height,
        ),
      );
      setIsEditorOpen(true);
    } catch (error) {
      setEditorError(
        error instanceof Error ? error.message : "Falha ao abrir a imagem.",
      );
    }
  }

  async function applyEdition() {
    if (!loadedImage) return;

    setIsPreparing(true);
    setEditorError("");

    try {
      const editedFile = await exportEditedFile(
        loadedImage,
        cropState,
        cropDimensions.width,
        cropDimensions.height,
        sourceFileName,
      );

      // Notifica o pai com o File processado — ele injeta direto no FormData no submit.
      // Isso é muito mais confiável do que atribuir via DataTransfer a um input oculto.
      onFileReady?.(editedFile);

      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      if (loadedImage.sourceUrl) {
        URL.revokeObjectURL(loadedImage.sourceUrl);
      }

      setPreviewUrl(URL.createObjectURL(editedFile));
      setHasEditedFile(true);
      setLoadedImage(null);
      setIsEditorOpen(false);
    } catch (error) {
      setEditorError(
        error instanceof Error ? error.message : "Falha ao aplicar a edição.",
      );
    } finally {
      setIsPreparing(false);
    }
  }

  function clearEditedImage() {
    setEditorError("");

    if (filePickerRef.current) {
      filePickerRef.current.value = "";
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    if (loadedImage?.sourceUrl) {
      URL.revokeObjectURL(loadedImage.sourceUrl);
    }

    onFileReady?.(null);
    setPreviewUrl(initialImageUrl ?? "");
    setHasEditedFile(false);
    setLoadedImage(null);
    setSourceFileName("");
  }

  const showClearButton =
    hasEditedFile ||
    (!hasEditedFile && !!initialImageUrl && previewUrl === initialImageUrl);

  return (
    <div className="grid gap-3">
      <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-sand)] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">
              Imagem do card
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
              Recorte fixo 4:3 com zoom e reposicionamento. Exportação final em
              1600 × 1200, preferencialmente WebP, com limite de 400 KB.
            </p>
          </div>
          {showClearButton ? (
            <button
              type="button"
              onClick={clearEditedImage}
              disabled={disabled}
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-white disabled:opacity-60"
            >
              Limpar
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid items-start gap-4 md:grid-cols-[220px_1fr]">
          {/* Preview */}
          <div className="overflow-hidden rounded-[1.25rem] border border-[var(--color-line)]">
            <div
              className="relative aspect-[4/3] bg-cover bg-center"
              style={{
                backgroundImage: previewUrl
                  ? `url(${previewUrl})`
                  : "linear-gradient(135deg, #d9b298, #f4e2d1)",
              }}
            >
              {hasEditedFile ? (
                <div className="absolute bottom-2 right-2 rounded-full bg-green-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  Pronta para upload
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
              Use uma imagem horizontal e mantenha o assunto principal mais ao
              centro. O editor serve para acertar enquadramento, zoom e corte.
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="cursor-pointer rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                {hasEditedFile ? "Trocar imagem" : "Selecionar imagem"}
                <input
                  ref={filePickerRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={disabled}
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    await handleRawFileSelection(file);
                    // Limpa o valor para que o onChange dispare novamente
                    // se o usuário selecionar o mesmo arquivo depois
                    event.target.value = "";
                  }}
                />
              </label>

              {loadedImage ? (
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  disabled={disabled}
                  className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white disabled:opacity-60"
                >
                  Reabrir editor
                </button>
              ) : null}
            </div>

            {editorError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {editorError}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {isEditorOpen && loadedImage ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(36,23,16,0.65)] p-4">
          <div className="w-full max-w-5xl rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Editor de imagem
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                  Ajuste o enquadramento do card
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  Arraste para reposicionar e use o zoom para aproximar ou
                  afastar. O corte final é fixo em 4:3.
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

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-sand)] p-5">
                <div
                  className="relative mx-auto overflow-hidden rounded-[1.25rem] border border-white/70 bg-white shadow-inner"
                  style={{
                    width: cropDimensions.width,
                    height: cropDimensions.height,
                    touchAction: "none",
                  }}
                  onPointerDown={(event) => {
                    dragStateRef.current = {
                      pointerId: event.pointerId,
                      startX: event.clientX,
                      startY: event.clientY,
                      originX: cropState.x,
                      originY: cropState.y,
                    };
                    (event.currentTarget as HTMLDivElement).setPointerCapture(
                      event.pointerId,
                    );
                  }}
                  onPointerMove={(event) => {
                    if (
                      !dragStateRef.current ||
                      dragStateRef.current.pointerId !== event.pointerId
                    ) {
                      return;
                    }

                    const next = constrainPosition(
                      dragStateRef.current.originX +
                        (event.clientX - dragStateRef.current.startX),
                      dragStateRef.current.originY +
                        (event.clientY - dragStateRef.current.startY),
                      loadedImage,
                      cropDimensions.width,
                      cropDimensions.height,
                      cropState.zoom,
                    );

                    setCropState((current) => ({
                      ...current,
                      x: next.x,
                      y: next.y,
                    }));
                  }}
                  onPointerUp={(event) => {
                    if (dragStateRef.current?.pointerId === event.pointerId) {
                      dragStateRef.current = null;
                    }
                  }}
                  onPointerCancel={(event) => {
                    if (dragStateRef.current?.pointerId === event.pointerId) {
                      dragStateRef.current = null;
                    }
                  }}
                >
                  <img
                    src={loadedImage.sourceUrl}
                    alt="Preview da imagem em edição"
                    className="absolute left-0 top-0 max-w-none select-none"
                    style={renderedImageStyle ?? undefined}
                    draggable={false}
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-sand)] p-5">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-[var(--color-ink)]">
                    Zoom
                  </span>
                  <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={cropState.zoom}
                    onChange={(event) => {
                      const nextZoom = Number(event.target.value);
                      const next = constrainPosition(
                        cropState.x,
                        cropState.y,
                        loadedImage,
                        cropDimensions.width,
                        cropDimensions.height,
                        nextZoom,
                      );

                      setCropState((current) => ({
                        ...current,
                        zoom: nextZoom,
                        x: next.x,
                        y: next.y,
                      }));
                    }}
                  />
                </label>

                <div className="mt-6 rounded-2xl border border-white/80 bg-white px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
                  <p>
                    Saída final: <strong>1600 × 1200</strong>
                  </p>
                  <p>
                    Formato final: <strong>WebP</strong>
                  </p>
                  <p>
                    Limite de arquivo: <strong>400 KB</strong>
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={applyEdition}
                    disabled={isPreparing}
                    className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {isPreparing ? "Processando..." : "Aplicar corte"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCropState(
                        getCenteredCropState(
                          loadedImage,
                          cropDimensions.width,
                          cropDimensions.height,
                        ),
                      )
                    }
                    className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
                  >
                    Centralizar novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
