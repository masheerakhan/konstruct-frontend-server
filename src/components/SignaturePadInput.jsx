import React, { useRef, useEffect, useState } from "react";
import SignaturePad from "signature_pad";
import { RotateCcw } from "lucide-react";

export default function SignaturePadInput({ value, onChange, testId = "signature-pad" }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      padRef.current?.clear();
    };
    resize();
    padRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgba(0,0,0,0)",
      penColor: "#0F172A",
      onEnd: () => {
        try {
          const dataUrl = padRef.current.toDataURL("image/png");
          onChange && onChange(dataUrl);
          setEmpty(false);
        } catch (_) { /* no-op */ }
      },
    });
    // v4 API compatibility (if available)
    if (typeof padRef.current.addEventListener === "function") {
      padRef.current.addEventListener("endStroke", () => {
        try {
          const dataUrl = padRef.current.toDataURL("image/png");
          onChange && onChange(dataUrl);
          setEmpty(false);
        } catch (_) { /* no-op */ }
      });
    }
    // preload existing value
    if (value) {
      padRef.current.fromDataURL(value);
      setEmpty(false);
    }
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = () => {
    padRef.current?.clear();
    onChange && onChange("");
    setEmpty(true);
  };

  return (
    <div className="w-full" data-testid={testId}>
      <div className="border border-slate-300 rounded-md bg-white">
        <canvas ref={canvasRef} className="sig-canvas w-full h-40" />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-slate-500">{empty ? "Sign inside the box above" : "Signature captured"}</div>
        <button
          type="button"
          onClick={clear}
          data-testid={`${testId}-clear`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-8 px-3 text-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
        </button>
      </div>
    </div>
  );
}
