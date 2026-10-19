import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { Button } from "../basic/button";
import { Slider } from "../basic/slider";

export type CropShape = "rectangle" | "rounded" | "circle";
export type CropResult = { blob: Blob; width: number; height: number };
export type ImageCropperProps = {
  src: string;
  onCrop: (result: CropResult) => void | Promise<void>;
  onCancel?: () => void;
  initialShape?: CropShape;
  /** Output width in pixels, height follows the crop aspect ratio. 64–4096. */
  outputWidth?: number;
};
type Point = { x: number; y: number };
type Frame = Point & { width: number; height: number };
type Transform = Point & { zoom: number; rotation: number };
const W = 640,
  H = 420;
const initialFrame: Frame = { x: 160, y: 50, width: 320, height: 320 };
const initialTransform: Transform = {
  x: W / 2,
  y: H / 2,
  zoom: 1,
  rotation: 0,
};
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const shapes: { value: CropShape; label: string }[] = [
  { value: "rectangle", label: "직사각형" },
  { value: "rounded", label: "라운드" },
  { value: "circle", label: "원형" },
];
function pathFor(frame: Frame, shape: CropShape) {
  const path = new Path2D();
  if (shape === "circle")
    path.ellipse(
      frame.x + frame.width / 2,
      frame.y + frame.height / 2,
      frame.width / 2,
      frame.height / 2,
      0,
      0,
      Math.PI * 2,
    );
  else
    path.roundRect(
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      shape === "rounded" ? Math.min(frame.width, frame.height) * 0.1 : 0,
    );
  return path;
}
function paintImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  transform: Transform,
) {
  const scale =
    Math.min(W / image.naturalWidth, H / image.naturalHeight) * transform.zoom;
  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  ctx.restore();
}

/** Local image editor. Uploading, persistence and dismissal belong to the caller. */
export function ImageCropper({
  src,
  onCrop,
  onCancel,
  initialShape = "rectangle",
  outputWidth = 1024,
}: ImageCropperProps) {
  const [shape, setShape] = useState<CropShape>(initialShape);
  const [frame, setFrame] = useState(initialFrame);
  const [transform, setTransform] = useState(initialTransform);
  const [mode, setMode] = useState<"image" | "mask">("image");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{
    points: Point[];
    transform: Transform;
    frame: Frame;
    action: string;
  } | null>(null);
  const helpId = useId();
  useEffect(() => {
    let isCurrent = true;
    setImage(null);
    setError("");
    setTransform(initialTransform);
    setFrame(initialFrame);
    const next = new Image();
    next.crossOrigin = "anonymous";
    next.onload = () => {
      if (isCurrent) setImage(next);
    };
    next.onerror = () => {
      if (isCurrent)
        setError(
          "이미지를 불러오지 못했습니다. 파일 또는 이미지 접근 권한을 확인하세요.",
        );
    };
    next.src = src;
    return () => {
      isCurrent = false;
      pointers.current.clear();
      gesture.current = null;
    };
  }, [src]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (!image) return;
      paintImage(ctx, image, transform);
      const crop = pathFor(frame, shape);
      ctx.save();
      ctx.clip(crop);
      // Clear outside with an even-odd path below; clipping keeps the grid within the mask.
      const styles = getComputedStyle(canvas);
      ctx.strokeStyle = styles.getPropertyValue("--gc-crop-grid").trim();
      ctx.lineWidth = 1;
      for (const fraction of [1 / 3, 2 / 3]) {
        ctx.beginPath();
        ctx.moveTo(frame.x + frame.width * fraction, frame.y);
        ctx.lineTo(frame.x + frame.width * fraction, frame.y + frame.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(frame.x, frame.y + frame.height * fraction);
        ctx.lineTo(frame.x + frame.width, frame.y + frame.height * fraction);
        ctx.stroke();
      }
      ctx.restore();
      const outside = new Path2D();
      outside.rect(0, 0, W, H);
      outside.addPath(crop);
      ctx.fillStyle = styles.getPropertyValue("--gc-crop-shade").trim();
      ctx.fill(outside, "evenodd");
      ctx.strokeStyle = styles.getPropertyValue("--gc-crop-line").trim();
      ctx.lineWidth = 2;
      ctx.stroke(crop);
    };
    draw();
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-color-mode"],
    });
    return () => observer.disconnect();
  }, [image, frame, transform, shape]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    function wheel(event: WheelEvent) {
      if (!image || isSavingRef.current || !event.deltaY) return;
      // React wheel listeners are passive; a native listener keeps editor zoom
      // from also scrolling the page or triggering browser pinch zoom.
      event.preventDefault();
      if (pointers.current.size) return;
      const rect = stage!.getBoundingClientRect();
      const point = {
        x: ((event.clientX - rect.left) * W) / rect.width,
        y: ((event.clientY - rect.top) * H) / rect.height,
      };
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
      const factor = Math.exp(-clamp(event.deltaY * unit, -500, 500) * 0.002);
      setTransform((current) => {
        const zoom = clamp(current.zoom * factor, 0.1, 8);
        const scale = zoom / current.zoom;
        return {
          ...current,
          zoom,
          x: point.x + (current.x - point.x) * scale,
          y: point.y + (current.y - point.y) * scale,
        };
      });
    }
    stage.addEventListener("wheel", wheel, { passive: false });
    return () => stage.removeEventListener("wheel", wheel);
  }, [image]);
  function localPoint(event: PointerEvent) {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * W) / rect.width,
      y: ((event.clientY - rect.top) * H) / rect.height,
    };
  }
  function rebase(action = gesture.current?.action ?? "image") {
    gesture.current = {
      points: [...pointers.current.values()],
      transform: { ...transform },
      frame: { ...frame },
      action,
    };
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!image || isSaving || event.button !== 0) return;
    event.preventDefault();
    (
      (event.target as HTMLElement).closest<HTMLElement>(
        "[data-crop-action]",
      ) ?? event.currentTarget
    ).focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, localPoint(event));
    const action =
      (event.target as HTMLElement).closest<HTMLElement>("[data-crop-action]")
        ?.dataset.cropAction ?? mode;
    rebase(action);
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (
      isSavingRef.current ||
      !pointers.current.has(event.pointerId) ||
      !gesture.current
    )
      return;
    pointers.current.set(event.pointerId, localPoint(event));
    const current = [...pointers.current.values()],
      start = gesture.current;
    if (current.length >= 2 && start.points.length >= 2) {
      const [a, b] = start.points,
        [c, d] = current;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      if (distance < 5) return;
      const zoom = clamp(
        (start.transform.zoom * Math.hypot(d.x - c.x, d.y - c.y)) / distance,
        0.1,
        8,
      );
      const delta = Math.atan2(
        Math.sin(
          Math.atan2(d.y - c.y, d.x - c.x) - Math.atan2(b.y - a.y, b.x - a.x),
        ),
        Math.cos(
          Math.atan2(d.y - c.y, d.x - c.x) - Math.atan2(b.y - a.y, b.x - a.x),
        ),
      );
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const offset = {
        x: start.transform.x - mid.x,
        y: start.transform.y - mid.y,
      };
      const scale = zoom / start.transform.zoom;
      setTransform({
        x:
          (c.x + d.x) / 2 +
          scale * (offset.x * Math.cos(delta) - offset.y * Math.sin(delta)),
        y:
          (c.y + d.y) / 2 +
          scale * (offset.x * Math.sin(delta) + offset.y * Math.cos(delta)),
        zoom,
        rotation:
          ((start.transform.rotation + (delta * 180) / Math.PI + 540) % 360) -
          180,
      });
      return;
    }
    const dx = current[0].x - start.points[0].x,
      dy = current[0].y - start.points[0].y;
    if (start.action === "resize") {
      const width = clamp(start.frame.width + dx, 64, W - start.frame.x);
      const height =
        shape === "circle"
          ? clamp(
              start.frame.width + (Math.abs(dx) > Math.abs(dy) ? dx : dy),
              64,
              Math.min(W - start.frame.x, H - start.frame.y),
            )
          : clamp(start.frame.height + dy, 64, H - start.frame.y);
      setFrame({
        ...start.frame,
        width: shape === "circle" ? height : width,
        height,
      });
    } else if (start.action === "mask")
      setFrame({
        ...start.frame,
        x: clamp(start.frame.x + dx, 0, W - start.frame.width),
        y: clamp(start.frame.y + dy, 0, H - start.frame.height),
      });
    else
      setTransform({
        ...start.transform,
        x: start.transform.x + dx,
        y: start.transform.y + dy,
      });
  }
  function endPointer(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size) rebase();
    else gesture.current = null;
  }
  async function save() {
    if (!image || isSavingRef.current) return;
    isSavingRef.current = true;
    pointers.current.clear();
    gesture.current = null;
    setIsSaving(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = clamp(
        Math.round(Number.isFinite(outputWidth) ? outputWidth : 1024),
        64,
        4096,
      );
      canvas.height = Math.max(
        1,
        Math.round((canvas.width * frame.height) / frame.width),
      );
      // Bound total allocation for extremely tall crops as well as width.
      if (canvas.height > 4096) {
        canvas.width = Math.round((canvas.width * 4096) / canvas.height);
        canvas.height = 4096;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.scale(canvas.width / frame.width, canvas.height / frame.height);
      ctx.translate(-frame.x, -frame.y);
      ctx.clip(pathFor(frame, shape));
      paintImage(ctx, image, transform);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) =>
            result ? resolve(result) : reject(new Error("PNG export failed")),
          "image/png",
        ),
      );
      await onCrop({ blob, width: canvas.width, height: canvas.height });
    } catch {
      setError(
        "PNG를 저장하지 못했습니다. 이미지 접근 권한을 확인하거나 다시 시도하세요.",
      );
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }
  return (
    <section className="gc-cropper" aria-label="사진 크롭기">
      <div className="gc-cropper-toolbar" role="group" aria-label="크롭 모양">
        {shapes.map((item) => (
          <Button
            key={item.value}
            variant="secondary"
            disabled={isSaving}
            aria-pressed={shape === item.value}
            onClick={() => {
              setShape(item.value);
              if (item.value === "circle")
                setFrame((value) => ({
                  ...value,
                  width: Math.min(value.width, value.height),
                  height: Math.min(value.width, value.height),
                }));
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {!image && <p role="status">{error || "이미지를 불러오는 중…"}</p>}
      <div
        ref={stageRef}
        className="gc-cropper-stage"
        data-mode={mode}
        tabIndex={image && !isSaving ? 0 : -1}
        role="group"
        aria-label="크롭 편집 영역"
        aria-describedby={helpId}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={endPointer}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !image || isSaving)
            return;
          const direction = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
          }[event.key];
          if (!direction) return;
          event.preventDefault();
          const step = event.shiftKey ? 10 : 1;
          if (mode === "mask")
            setFrame((f) => ({
              ...f,
              x: clamp(f.x + direction[0] * step, 0, W - f.width),
              y: clamp(f.y + direction[1] * step, 0, H - f.height),
            }));
          else
            setTransform((t) => ({
              ...t,
              x: t.x + direction[0] * step,
              y: t.y + direction[1] * step,
            }));
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} aria-hidden="true" />
        {image && mode === "mask" && (
          <Button
            className="gc-cropper-handle"
            aria-label="마스크 크기 조절"
            disabled={isSaving}
            data-crop-action="resize"
            style={{
              left: `${((frame.x + frame.width) / W) * 100}%`,
              top: `${((frame.y + frame.height) / H) * 100}%`,
            }}
            onKeyDown={(event) => {
              const delta = ["ArrowRight", "ArrowDown"].includes(event.key)
                ? 8
                : ["ArrowLeft", "ArrowUp"].includes(event.key)
                  ? -8
                  : 0;
              if (!delta) return;
              event.preventDefault();
              setFrame((f) => {
                const size = clamp(
                  f.width + delta,
                  64,
                  Math.min(W - f.x, H - f.y),
                );
                return shape === "circle"
                  ? { ...f, width: size, height: size }
                  : {
                      ...f,
                      width: clamp(f.width + delta, 64, W - f.x),
                      height: clamp(f.height + delta, 64, H - f.y),
                    };
              });
            }}
          >
            ↘
          </Button>
        )}
      </div>
      <p id={helpId} className="gc-help">
        {mode === "image"
          ? "사진을 드래그하여 이동 · 마우스 휠로 확대·축소 · 두 손가락으로 확대·축소와 회전"
          : "드래그하여 마스크 이동 · 모서리 손잡이로 크기 조절"}
        . 방향키로 이동, Shift로 크게 이동합니다.
      </p>
      <fieldset className="gc-cropper-settings" disabled={!image || isSaving}>
        <legend className="gc-sr-only">사진과 마스크 조절</legend>
        <div className="gc-cropper-toolbar" role="group" aria-label="조작 대상">
          <Button
            variant="secondary"
            aria-pressed={mode === "image"}
            onClick={() => setMode("image")}
          >
            사진 이동
          </Button>
          <Button
            variant="secondary"
            aria-pressed={mode === "mask"}
            onClick={() => setMode("mask")}
          >
            마스크 조절
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setTransform(initialTransform);
              setFrame(initialFrame);
            }}
          >
            초기화
          </Button>
        </div>
        <div className="gc-cropper-sliders">
          <Slider
            label="확대·축소"
            min={0.1}
            max={8}
            step={0.01}
            value={transform.zoom}
            valueText={`${Math.round(transform.zoom * 100)}%`}
            onValueChange={(zoom) => setTransform((t) => ({ ...t, zoom }))}
          />
          <Slider
            label="회전"
            min={-180}
            max={180}
            step={1}
            value={transform.rotation}
            valueText={`${Math.round(transform.rotation)}°`}
            onValueChange={(rotation) =>
              setTransform((t) => ({ ...t, rotation }))
            }
          />
        </div>
      </fieldset>
      <div className="gc-cropper-footer">
        <span className="gc-help">
          체크무늬 영역과 마스크 밖은 투명 PNG로 저장됩니다.
        </span>
        <div>
          {onCancel && (
            <Button variant="secondary" disabled={isSaving} onClick={onCancel}>
              취소
            </Button>
          )}
          <Button disabled={!image} isLoading={isSaving} onClick={save}>
            PNG로 크롭
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="gc-error">
          {error}
        </p>
      )}
    </section>
  );
}
