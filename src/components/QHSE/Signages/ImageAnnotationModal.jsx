import { useState, useEffect, useRef } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';

export default function ImageAnnotationModal({ open, onClose, onSave, selectedPlan, initialMarkers = [] }) {
  const [markers, setMarkers] = useState([]);
  const imageContainerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMarkers(initialMarkers);
    }
  }, [open, initialMarkers]);

  const handleImageClick = (e) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMarkers((prev) => {
      // Find highest marker number to avoid duplicates
      const maxNumber = prev.length > 0 ? Math.max(...prev.map(m => m.number)) : 0;
      return [
        ...prev,
        {
          id: Date.now(), // Generate a unique ID for the marker
          x,
          y,
          number: maxNumber + 1,
          file: null,
          previewUrl: null
        }
      ];
    });
  };

  const clearMarkers = () => setMarkers([]);

  const handleSave = () => {
    onSave(markers);
  };

  if (!open || !selectedPlan) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Annotate Key Plan
            </h3>
            <p className="text-sm text-gray-500 mt-1">Click on the image to drop numbered markers.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body (Image Canvas) */}
        <div className="p-6 bg-gray-100/50 overflow-y-auto grow flex items-center justify-center">
           <div 
             ref={imageContainerRef}
             onClick={handleImageClick}
             className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-gray-300 bg-white cursor-crosshair shadow-sm"
           >
             <img 
               src={selectedPlan.url} 
               alt={selectedPlan.name}
               className="w-full h-auto object-contain block"
               draggable={false}
             />
             
             {/* Render Markers */}
             {markers.map((marker) => (
               <div
                 key={marker.id}
                 className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-md ring-2 ring-white cursor-pointer"
                 style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                 title={`Marker ${marker.number}`}
               >
                 {marker.number}
               </div>
             ))}
           </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={clearMarkers}
            className="inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4" />
            Clear All
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition"
            >
              <Save className="h-4 w-4" />
              Save Annotations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
