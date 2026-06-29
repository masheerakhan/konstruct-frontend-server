import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Upload, X } from "lucide-react";
import { formatInputDate } from "../../../../utils/dateFormatter";

const formatDate = (d) => formatInputDate(d);
const formatTime = (d) => d.toTimeString().slice(0, 5);

const SectionHeader = ({ number, title }) => (
  <div className="bg-sky-700 text-white px-4 py-2 font-semibold text-sm rounded-t-md">
    Section {number}: {title}
  </div>
);

const CATEGORIES = ["Quality", "HSE"];

const ToolboxTalk = () => {
  const now = new Date();
  const [tbtRefNo, setTbtRefNo] = useState("HIPPL-QHSE-TBT-001");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [tbtDate, setTbtDate] = useState(formatDate(now));
  const [tbtTime, setTbtTime] = useState(formatTime(now));
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [givenBy, setGivenBy] = useState("");
  const [givenByPosition, setGivenByPosition] = useState("");
  const [givenTo, setGivenTo] = useState("");
  const [totalNos, setTotalNos] = useState("");
  const [conductedBy, setConductedBy] = useState("");

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const inputRef = useRef(null);
  const [pictureAttachments, setPictureAttachments] = useState([]);
  const pictureInputRef = useRef(null);

  const handleFiles = (selected) => {
    if (!selected) return;
    const arr = Array.from(selected);
    setFiles((prev) => [...prev, ...arr]);
    arr.forEach((f) => {
      if (f.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        setPreviews((prev) => [...prev, url]);
      } else {
        setPreviews((prev) => [...prev, ""]);
      }
    });
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      const next = [...prev];
      if (next[idx]) URL.revokeObjectURL(next[idx]);
      next.splice(idx, 1);
      return next;
    });
  };

  const handlePictureAttachments = (selected) => {
    if (!selected) return;

    const attachments = Array.from(selected)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
      }));

    if (!attachments.length) return;

    setPictureAttachments((prev) => [...prev, ...attachments]);
  };

  const removePictureAttachment = (id) => {
    setPictureAttachments((prev) => {
      const target = prev.find((attachment) => attachment.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((attachment) => attachment.id !== id);
    });
  };

  const resetForm = () => {
    const current = new Date();
    previews.forEach((preview) => {
      if (preview) URL.revokeObjectURL(preview);
    });
    pictureAttachments.forEach((attachment) => {
      if (attachment.url) URL.revokeObjectURL(attachment.url);
    });

    setTbtRefNo("HIPPL-QHSE-TBT-001");
    setCategory("");
    setTopic("");
    setTbtDate(formatDate(current));
    setTbtTime(formatTime(current));
    setDuration("");
    setLocation("");
    setGivenBy("");
    setGivenByPosition("");
    setGivenTo("");
    setTotalNos("");
    setConductedBy("");
    setFiles([]);
    setPreviews([]);
    setPictureAttachments([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Toolbox Talk Attendance Sheet submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Toolbox Talks Record & Attendance Sheet
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              HIPPL/QHSE/IMS/FMT/100, Rev:5
            </p>
          </div>
          {/* <Link to="/" className="text-sm text-sky-700 hover:underline">← Back to MIR</Link> */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Information */}
          <div className="bg-white rounded-md shadow-sm border border-slate-200">
            <SectionHeader number={1} title="Information" />
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  TBT Reference No.
                </label>
                <input
                  type="text"
                  value={tbtRefNo}
                  onChange={(e) => setTbtRefNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  TBT Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  TBT Topic Discussed
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Brief description of the topic discussed"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date of TBT
                  </label>
                  <input
                    type="date"
                    value={tbtDate}
                    onChange={(e) => setTbtDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={tbtTime}
                    onChange={(e) => setTbtTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 30 minutes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location / Venue of TBT
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  TBT Given By (Name)
                </label>
                <input
                  type="text"
                  value={givenBy}
                  onChange={(e) => setGivenBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={givenByPosition}
                  onChange={(e) => setGivenByPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Given To (Team / Dept / Contractor)
                </label>
                <input
                  type="text"
                  value={givenTo}
                  onChange={(e) => setGivenTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Total Nos.
                </label>
                <input
                  type="number"
                  min={0}
                  value={totalNos}
                  onChange={(e) => setTotalNos(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Conducted By (Name / Signature)
                </label>
                <input
                  type="text"
                  value={conductedBy}
                  onChange={(e) => setConductedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Attendance Upload */}
          <div className="bg-white rounded-md shadow-sm border border-slate-200">
            <SectionHeader number={2} title="Attendance" />
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Upload the signed attendance sheet(s). Accepted formats: images
                (JPG, PNG) or PDF. You can upload multiple files.
              </p>

              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-slate-300 rounded-md p-8 text-center cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition"
              >
                <svg
                  className="mx-auto h-10 w-10 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.9-1A5.5 5.5 0 0118 16M12 12v9m0-9l-3 3m3-3l3 3"
                  />
                </svg>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG, PDF up to 10MB each
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Uploaded Files ({files.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {files.map((f, idx) => (
                      <div
                        key={idx}
                        className="relative border border-slate-200 rounded-md p-2 bg-slate-50"
                      >
                        {previews[idx] ? (
                          <img
                            src={previews[idx]}
                            alt={f.name}
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center bg-slate-200 rounded text-slate-500 text-xs">
                            PDF Document
                          </div>
                        )}
                        <p
                          className="text-xs text-slate-700 mt-2 truncate"
                          title={f.name}
                        >
                          {f.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(f.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          aria-label="Remove file"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm border border-slate-200">
            <SectionHeader number={3} title="Picture Attachment" />
            <div className="p-5 space-y-4">
              <label
                onClick={() => pictureInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handlePictureAttachments(e.dataTransfer.files);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-slate-500 transition hover:border-sky-500 hover:bg-sky-50"
              >
                <Upload className="h-7 w-7" />
                <span className="text-sm font-medium text-slate-700">
                  Click to upload picture attachments
                </span>
                <span className="text-xs text-slate-500">
                  You can select multiple images
                </span>
                <input
                  ref={pictureInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handlePictureAttachments(e.target.files)}
                  className="hidden"
                />
              </label>

              {pictureAttachments.length === 0 ? (
                <p className="rounded-md bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                  No picture attachments uploaded yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pictureAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="group relative aspect-video overflow-hidden bg-slate-100">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removePictureAttachment(attachment.id)}
                          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-700 text-white rounded-md text-sm font-medium hover:bg-sky-800"
            >
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ToolboxTalk;
