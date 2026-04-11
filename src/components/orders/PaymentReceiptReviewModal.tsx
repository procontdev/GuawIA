import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Move, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

type PaymentReceiptReviewModalProps = {
  open: boolean;
  title?: string;
  orderCode?: string;
  receiptUrl: string | null;
  fileName?: string | null;
  loading?: boolean;
  submitting?: boolean;
  onClose: () => void;
  onDownload: () => void;
  onConfirm: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const DOUBLE_CLICK_ZOOM = 2;

function isPdfFile(url?: string | null, fileName?: string | null) {
  const source = `${url ?? ""} ${fileName ?? ""}`.toLowerCase();
  return source.includes(".pdf");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function PaymentReceiptReviewModal({
  open,
  title = "Revisión de comprobante",
  orderCode,
  receiptUrl,
  fileName,
  loading = false,
  submitting = false,
  onClose,
  onDownload,
  onConfirm,
  onReject,
}: PaymentReceiptReviewModalProps) {
  const pdf = useMemo(() => isPdfFile(receiptUrl, fileName), [receiptUrl, fileName]);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOriginRef = useRef({ x: 0, y: 0 });

  const clampOffset = (nextOffset: { x: number; y: number }, nextScale: number) => {
    const viewport = viewportRef.current;
    const image = imageRef.current;

    if (!viewport || !image || nextScale <= 1) {
      return { x: 0, y: 0 };
    }

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;

    const renderedWidth = image.clientWidth;
    const renderedHeight = image.clientHeight;

    const scaledWidth = renderedWidth * nextScale;
    const scaledHeight = renderedHeight * nextScale;

    const maxX = Math.max(0, (scaledWidth - viewportWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - viewportHeight) / 2);

    return {
      x: clamp(nextOffset.x, -maxX, maxX),
      y: clamp(nextOffset.y, -maxY, maxY),
    };
  };

  const applyScale = (nextScale: number) => {
    const safeScale = clamp(Number(nextScale.toFixed(2)), MIN_ZOOM, MAX_ZOOM);
    setScale(safeScale);
    setOffset((prev) => clampOffset(prev, safeScale));
    if (safeScale === 1) {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [open, receiptUrl, fileName]);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => window.removeEventListener("mouseup", handleWindowMouseUp);
  }, []);

  const zoomIn = () => {
    applyScale(scale + ZOOM_STEP);
  };

  const zoomOut = () => {
    const next = clamp(scale - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
    if (next === 1) {
      setOffset({ x: 0, y: 0 });
      setScale(1);
      setIsDragging(false);
      return;
    }
    applyScale(next);
  };

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOriginRef.current = { ...offset };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const nextOffset = clampOffset(
      {
        x: dragOriginRef.current.x + dx,
        y: dragOriginRef.current.y + dy,
      },
      scale,
    );

    setOffset(nextOffset);
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (pdf || !receiptUrl) return;

    e.preventDefault();

    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    const next = clamp(scale + delta, MIN_ZOOM, MAX_ZOOM);

    if (next === 1) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setIsDragging(false);
      return;
    }

    applyScale(next);
  };

  const handleDoubleClick = () => {
    if (pdf || !receiptUrl) return;

    if (scale === 1) {
      setScale(DOUBLE_CLICK_ZOOM);
      setOffset(clampOffset({ x: 0, y: 0 }, DOUBLE_CLICK_ZOOM));
      return;
    }

    resetZoom();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-6xl">
        <Card className="max-h-[92vh] overflow-hidden rounded-3xl border-slate-200 shadow-2xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-200">
            <div>
              <CardTitle>{title}</CardTitle>
              {orderCode ? (
                <p className="mt-1 text-sm text-slate-500">{orderCode}</p>
              ) : null}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-2xl"
              onClick={onClose}
              disabled={submitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4 p-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {loading ? (
                <div className="flex h-[62vh] items-center justify-center text-sm text-slate-500">
                  Cargando comprobante...
                </div>
              ) : receiptUrl ? (
                pdf ? (
                  <div className="h-[62vh] bg-white">
                    <iframe
                      src={receiptUrl}
                      title="Comprobante de pago"
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="flex h-[62vh] flex-col overflow-hidden bg-slate-50">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Move className="h-4 w-4" />
                        <span>Zoom: {Math.round(scale * 100)}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          onClick={zoomOut}
                          disabled={scale <= MIN_ZOOM}
                          title="Reducir zoom"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={resetZoom}
                          disabled={scale === 1 && offset.x === 0 && offset.y === 0}
                          title="Restablecer"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          onClick={zoomIn}
                          disabled={scale >= MAX_ZOOM}
                          title="Ampliar zoom"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div
                      ref={viewportRef}
                      className="relative flex-1 overflow-hidden bg-slate-100"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={stopDragging}
                      onMouseLeave={stopDragging}
                      onWheel={handleWheel}
                      onDoubleClick={handleDoubleClick}
                    >
                      <div className="flex h-full items-center justify-center overflow-hidden p-4">
                        <img
                          ref={imageRef}
                          src={receiptUrl}
                          alt="Comprobante de pago"
                          draggable={false}
                          className="max-h-full max-w-full select-none rounded-xl object-contain shadow transition-transform duration-150 ease-out"
                          style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            transformOrigin: "center center",
                            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                          }}
                        />
                      </div>

                      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/75 px-3 py-1 text-xs text-white shadow">
                        Doble click: {scale === 1 ? "zoom 2x" : "restablecer"}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex h-[62vh] items-center justify-center text-sm text-slate-500">
                  No se pudo cargar el comprobante.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={onDownload}
                disabled={!receiptUrl || submitting}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50"
                onClick={onReject}
                disabled={submitting}
              >
                {submitting ? "Procesando..." : "Rechazar"}
              </Button>

              <Button
                type="button"
                className="rounded-2xl"
                onClick={onConfirm}
                disabled={submitting}
              >
                {submitting ? "Procesando..." : "Confirmar pago"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={onClose}
                disabled={submitting}
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}