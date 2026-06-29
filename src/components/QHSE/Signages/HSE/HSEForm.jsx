import { useState } from "react";
import { Plus, Save, RotateCcw, Image as ImageIcon, FileText, MapPin, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import KeyPlanSelectionModal from "../KeyPlanSelectionModal";
import ImageAnnotationModal from "../ImageAnnotationModal";
import FileUploadControl from "../../../FileUploadControl";

const sectionTitleCls = "text-base font-semibold text-gray-900";
const cardCls = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";

export default function HSEForm({ onCancel, onSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Array of { id, x, y, number, file, previewUrl }
  const [markers, setMarkers] = useState([]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setMarkers([]); // reset markers when a new plan is selected
    setShowModal(false);
    // Auto-open annotation modal
    setShowAnnotationModal(true);
  };

  const handleFileUpload = (markerId, files) => {
    const file = files?.[0] || null;

    setMarkers((prev) => prev.map((marker) => {
      if (marker.id === markerId) {
        // Clean up old preview URL if exists
        if (marker.previewUrl) URL.revokeObjectURL(marker.previewUrl);
        const previewUrl = file ? URL.createObjectURL(file) : null;
        return { ...marker, file, previewUrl };
      }
      return marker;
    }));
  };

  const handleDeleteMarker = (markerId) => {
    setMarkers((prev) => {
      // 1. Clean up previewUrl for the deleted marker
      const markerToDelete = prev.find(m => m.id === markerId);
      if (markerToDelete?.previewUrl) {
        URL.revokeObjectURL(markerToDelete.previewUrl);
      }
      
      // 2. Filter out the deleted marker
      const filtered = prev.filter(m => m.id !== markerId);
      
      // 3. Re-sequence the remaining markers so there are no numerical gaps
      return filtered.map((m, index) => ({
        ...m,
        number: index + 1
      }));
    });
  };

  const handleReset = () => {
    setSelectedPlan(null);
    markers.forEach(m => {
        if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
    });
    setMarkers([]);
    toast.success("Form reset");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error("Please select a Key Plan first!");
      return;
    }
    
    const uploadedCount = markers.filter(m => m.file !== null).length;

    toast.success("HSE Signage successfully saved!");
    onSuccess?.({
      keyPlan: selectedPlan.name,
      createdBy: "Admin User",
      uploadedFilesCount: uploadedCount,
      dateOfSubmission: new Date().toISOString().split('T')[0],
      projectName: "Project Alpha",
      markers
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                HSE Signage Form
              </h1>
              <p className="text-sm text-gray-500">
                Select a key plan, mark specific locations, and attach evidence.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Register
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Key Plan Selection */}
          <section className={cardCls}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={sectionTitleCls}>1. Key Plan Selection</h2>
                <p className="text-xs text-gray-500 mt-1">Select a key plan from the References folder.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-white border border-primary px-4 text-sm font-medium text-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                Select Document
              </button>
            </div>

            {selectedPlan && (
              <div className="rounded-xl border border-blue-100 bg-white p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedPlan.name}</p>
                  <p className="text-xs text-gray-500">{selectedPlan.type}</p>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2: Image Annotation */}
          <section className={cardCls}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={sectionTitleCls}>2. Image Annotation</h2>
                <p className="text-xs text-gray-500 mt-1">Review your annotated key plan below.</p>
              </div>
              {markers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAnnotationModal(true)}
                  className="inline-flex h-8 items-center gap-2 rounded-md bg-white border border-emerald-200 px-3 text-xs font-medium text-emerald-600 hover:bg-emerald-50 shadow-sm transition"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Edit Annotations
                </button>
              )}
            </div>

            {!selectedPlan ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900">No Image Selected</p>
                <p className="text-xs text-gray-500 mt-1">Please select a document from Section 1 first.</p>
              </div>
            ) : markers.length === 0 ? (
              <div className="rounded-xl border border-emerald-100 bg-white p-6 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Ready to Annotate</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  Click the button below to open the key plan image and safely place your markers.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAnnotationModal(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-500 px-6 text-sm font-medium text-white hover:bg-emerald-600 shadow-sm transition"
                >
                  <MapPin className="h-4 w-4" />
                  Annotate Image
                </button>
              </div>
            ) : (
              <div className="relative mx-auto max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-inner">
                <img 
                  src={selectedPlan.url} 
                  alt={selectedPlan.name}
                  className="w-full h-auto object-contain block opacity-90"
                  draggable={false}
                />
                
                {/* Render Read-Only Markers */}
                {markers.map((marker) => (
                  <div
                    key={marker.id}
                    className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-md ring-2 ring-white"
                    style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    title={`Marker ${marker.number}`}
                  >
                    {marker.number}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 3: Evidence Upload */}
          <section className={cardCls}>
            <div>
              <h2 className={sectionTitleCls}>3. Evidence Upload</h2>
              <p className="text-xs text-gray-500 mt-1">Upload an evidence photo corresponding to each numbered marker on the Key Plan.</p>
            </div>

            {markers.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 py-8 text-center">
                <p className="text-sm text-gray-500">No markers placed. Click on the Key Plan image to add markers.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700 w-36 whitespace-nowrap">Reference No</th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700">Upload</th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700 w-56 whitespace-nowrap">Preview of the image</th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700 w-28 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {markers.map((marker) => (
                      <tr key={marker.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm">
                            {marker.number}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex justify-center">
                            <FileUploadControl 
                              files={marker.file ? [marker.file] : []}
                              onFilesChange={(files) => handleFileUpload(marker.id, files)}
                              accept="image/*"
                              uploadLabel="Upload Photo"
                              className="!items-center w-full max-w-xs"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex justify-center">
                            {marker.previewUrl ? (
                              <div className="h-24 w-36 overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm">
                                <img src={marker.previewUrl} alt={`Evidence for ${marker.number}`} className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="flex h-24 w-36 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                                <ImageIcon className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleDeleteMarker(marker.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete Row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-primary bg-primary px-5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              Save Signage
            </button>
          </div>
        </form>

        <KeyPlanSelectionModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSelect={handleSelectPlan}
        />

        <ImageAnnotationModal
          open={showAnnotationModal}
          onClose={() => setShowAnnotationModal(false)}
          onSave={(newMarkers) => {
            const updated = newMarkers.map(nm => {
                const existing = markers.find(m => m.id === nm.id);
                if (existing) {
                    return { ...nm, file: existing.file, previewUrl: existing.previewUrl };
                }
                return nm;
            });
            setMarkers(updated);
            setShowAnnotationModal(false);
          }}
          selectedPlan={selectedPlan}
          initialMarkers={markers}
        />
      </div>
    </div>
  );
}
