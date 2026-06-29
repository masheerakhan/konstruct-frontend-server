import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import { capitalCase } from "./stringCase";

GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

export function usePdfPageCount(file) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!file || (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf"))) {
      setCount(0);
      return;
    }

    const url = URL.createObjectURL(file);
    const task = getDocument({ url });

    task.promise
      .then((pdf) => {
        const n = pdf.numPages;
        pdf.destroy();
        setCount(n);
      })
      .catch(() => setCount(0));

    return () => {
      task.destroy();
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return count;
}

export function PdfPreview({ file, className = "", scale: baseScale = 1.5, pageNumber }) {
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef(null);
  const pdfRef = useRef(null);
  const urlRef = useRef(null);
  const canvasRefs = useRef([]);
  const loadingTaskRef = useRef(null);
  const renderGenerationRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => setContainerWidth(el.clientWidth);

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setError(null);
    setLoading(true);
    setNumPages(0);
    canvasRefs.current = [];
    renderGenerationRef.current += 1;

    const url = URL.createObjectURL(file);
    urlRef.current = url;

    const loadingTask = getDocument({ url });
    loadingTaskRef.current = loadingTask;

    loadingTask.promise
      .then((pdf) => {
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load PDF";
        setError(message);
        setLoading(false);
      });

    return () => {
      loadingTask.destroy();
      loadingTaskRef.current = null;
      pdfRef.current?.destroy();
      pdfRef.current = null;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file]);

  const pagesToRender = pageNumber
    ? pageNumber <= numPages
      ? [pageNumber]
      : []
    : Array.from({ length: numPages }, (_, i) => i + 1);

  useLayoutEffect(() => {
    if (!pagesToRender.length || !pdfRef.current || containerWidth <= 0) return;

    const pdf = pdfRef.current;
    const generation = ++renderGenerationRef.current;
    let cancelled = false;

    const renderPages = async () => {
      setLoading(true);
      try {
        for (let i = 0; i < pagesToRender.length; i++) {
          if (cancelled || generation !== renderGenerationRef.current) return;

          const page = await pdf.getPage(pagesToRender[i]);
          const canvas = canvasRefs.current[i];
          if (!canvas) continue;

          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) continue;

          const unscaled = page.getViewport({ scale: 1 });
          const maxW = Math.max(containerWidth - 4, 100);
          const widthScale = maxW / unscaled.width;
          const scale = Math.min(baseScale, widthScale);

          const viewport = page.getViewport({ scale });

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: ctx,
            viewport,
          };
          const renderTask = page.render(renderContext);
          await renderTask.promise;
        }

        if (!cancelled && generation === renderGenerationRef.current) {
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled && generation === renderGenerationRef.current) {
          setError(e instanceof Error ? e.message : "Failed to render PDF");
          setLoading(false);
        }
      }
    };

    void renderPages();

    return () => {
      cancelled = true;
    };
  }, [numPages, file, containerWidth, baseScale, pageNumber, pagesToRender.length]);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {loading && !error && (
        <div className="text-xs text-gray-500 py-4 text-center">{capitalCase("loading pdf")}…</div>
      )}

      {pagesToRender.length > 0 && (
        <div className="flex flex-col gap-6 mt-2">
          {pagesToRender.map((pNum, idx) => (
            <div
              key={`${file.name}-${file.lastModified}-${pNum}`}
              className="pdf-preview-canvas-page flex justify-center border border-gray-300 rounded-sm bg-white p-2"
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[idx] = el;
                }}
                className="max-w-full h-auto block"
                aria-label={`PDF page ${pNum} of ${numPages}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PdfPreview;
