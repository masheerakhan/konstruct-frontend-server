import React, { useEffect, useRef, useState } from "react";
import {
    X,
    RotateCcw,
    Eraser,
    Save,
    PenLine,
} from "lucide-react";

const getAnnotatedFileName = (fileName = "annotated-image.png") => {
    const cleanName = String(fileName || "image.png");
    const dotIndex = cleanName.lastIndexOf(".");
    const baseName = dotIndex > -1 ? cleanName.slice(0, dotIndex) : cleanName;

    return `${baseName}-marked.png`;
};

function SafetyImageAnnotationModal({
    open,
    file,
    onClose,
    onSave,
}) {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef(null);
    const undoStackRef = useRef([]);

    const [lineWidth, setLineWidth] = useState(5);
    const [strokeColor, setStrokeColor] = useState("#ff0000");
    const [loading, setLoading] = useState(false);

    const [canvasSize, setCanvasSize] = useState({
        width: 20,
        height: 20,
    });

    const redrawBaseImage = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;

        if (!canvas || !image || !canvasSize.width || !canvasSize.height) return;

        const dpr = window.devicePixelRatio || 1;
        const ctx = canvas.getContext("2d");

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);
    };

    useEffect(() => {
        if (!open || !file) {
            setCanvasSize({
                width: 0,
                height: 0,
            });
            setLoading(false);
            return;
        }

        let objectUrl = "";
        let cancelled = false;

        const image = new Image();

        setLoading(true);
        setCanvasSize({
            width: 0,
            height: 0,
        });

        objectUrl = URL.createObjectURL(file);

        image.onload = () => {
            if (cancelled) return;

            const canvas = canvasRef.current;

            if (!canvas) {
                setLoading(false);
                return;
            }

            const naturalWidth = image.naturalWidth || image.width;
            const naturalHeight = image.naturalHeight || image.height;

            if (!naturalWidth || !naturalHeight) {
                setLoading(false);
                return;
            }

            const maxDisplayWidth = Math.min(window.innerWidth - 80, 900);
            const maxDisplayHeight = Math.min(window.innerHeight - 260, 620);

            const scale = Math.min(
                maxDisplayWidth / naturalWidth,
                maxDisplayHeight / naturalHeight,
                1
            );

            const displayWidth = Math.round(naturalWidth * scale);
            const displayHeight = Math.round(naturalHeight * scale);

            const dpr = window.devicePixelRatio || 1;

            canvas.width = Math.round(displayWidth * dpr);
            canvas.height = Math.round(displayHeight * dpr);

            setCanvasSize({
                width: displayWidth,
                height: displayHeight,
            });

            imageRef.current = image;
            undoStackRef.current = [];

            const ctx = canvas.getContext("2d");

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, displayWidth, displayHeight);
            ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

            setLoading(false);
        };

        image.onerror = () => {
            if (cancelled) return;

            setLoading(false);
            setCanvasSize({
                width: 0,
                height: 0,
            });

            alert("Could not load this image. Please choose another image.");
        };

        image.src = objectUrl;

        return () => {
            cancelled = true;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [open, file]);

    if (!open || !file) return null;

    const getCanvasPoint = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const clientX =
            event.touches?.[0]?.clientX ??
            event.changedTouches?.[0]?.clientX ??
            event.clientX;

        const clientY =
            event.touches?.[0]?.clientY ??
            event.changedTouches?.[0]?.clientY ??
            event.clientY;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const pushUndoState = () => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        undoStackRef.current.push(
            ctx.getImageData(0, 0, canvas.width, canvas.height)
        );

        if (undoStackRef.current.length > 20) {
            undoStackRef.current.shift();
        }
    };

    const startDrawing = (event) => {
        event.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        pushUndoState();

        isDrawingRef.current = true;
        lastPointRef.current = getCanvasPoint(event);
    };

    const draw = (event) => {
        if (!isDrawingRef.current) return;

        event.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const currentPoint = getCanvasPoint(event);
        const lastPoint = lastPointRef.current || currentPoint;

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        lastPointRef.current = currentPoint;
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
        lastPointRef.current = null;
    };

    const handleUndo = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const previousState = undoStackRef.current.pop();

        if (!previousState) return;

        const ctx = canvas.getContext("2d");
        ctx.putImageData(previousState, 0, 0);
    };

    const handleClearDrawing = () => {
        pushUndoState();
        redrawBaseImage();
    };

    const handleSave = () => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        canvas.toBlob(
            (blob) => {
                if (!blob) return;

                const annotatedFile = new File(
                    [blob],
                    getAnnotatedFileName(file.name),
                    {
                        type: "image/png",
                        lastModified: Date.now(),
                    }
                );

                onSave?.(annotatedFile);
            },
            "image/png",
            0.95
        );
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            Mark Image Before Upload
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                            Draw on the image to highlight observations before attaching it.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-b bg-gray-50 px-5 py-3">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
                        <PenLine className="h-4 w-4" />
                        Draw
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        Color
                        <input
                            type="color"
                            value={strokeColor}
                            onChange={(event) => setStrokeColor(event.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border border-gray-200 bg-white"
                        />
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        Size
                        <input
                            type="range"
                            min="2"
                            max="20"
                            value={lineWidth}
                            onChange={(event) =>
                                setLineWidth(Number(event.target.value || 5))
                            }
                        />
                        <span className="w-6 text-right">{lineWidth}</span>
                    </label>

                    <button
                        type="button"
                        onClick={handleUndo}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Undo
                    </button>

                    <button
                        type="button"
                        onClick={handleClearDrawing}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                        <Eraser className="h-4 w-4" />
                        Clear Marks
                    </button>
                </div>

                <div className="flex-1 overflow-auto bg-gray-100 p-4">
                    <div className="relative flex min-h-[380px] justify-center">
                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-100/80 text-sm text-gray-500">
                                Loading image...
                            </div>
                        )}

                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            style={{
                                width: canvasSize.width ? `${canvasSize.width}px` : "auto",
                                height: canvasSize.height ? `${canvasSize.height}px` : "auto",
                            }}
                            className={`touch-none cursor-crosshair rounded-xl border border-gray-300 bg-white shadow ${loading ? "opacity-0" : "opacity-100"
                                }`}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-t bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500">
                        Saving will attach the marked image instead of the original image.
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                        >
                            <Save className="h-4 w-4" />
                            Save & Attach
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SafetyImageAnnotationModal;