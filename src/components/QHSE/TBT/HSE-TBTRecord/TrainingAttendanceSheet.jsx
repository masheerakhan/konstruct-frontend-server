import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Upload, X } from "lucide-react";
import { formatInputDate } from "../../../../utils/dateFormatter";

const formatDate = (date) => formatInputDate(date);
const formatTime = (date) => date.toTimeString().slice(0, 5);

const CATEGORIES = ["Quality", "HSE"];

const createAttendanceRows = () =>
  Array.from({ length: 50 }, (_, index) => ({
    id: index + 1,
    name: "",
    jobTitle: "",
    signature: "",
  }));

const SectionHeader = ({ number, title }) => (
  <div className="rounded-t-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white">
    Section {number}: {title}
  </div>
);

const TrainingAttendanceSheet = () => {
  const now = new Date();
  const [trainingRefNo, setTrainingRefNo] = useState("");
  const [category, setCategory] = useState("");
  const [trainingSubject, setTrainingSubject] = useState("");
  const [trainingDate, setTrainingDate] = useState(formatDate(now));
  const [trainingTime, setTrainingTime] = useState(formatTime(now));
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [givenBy, setGivenBy] = useState("");
  const [givenByPosition, setGivenByPosition] = useState("");
  const [givenTo, setGivenTo] = useState("");
  const [totalNos, setTotalNos] = useState("");
  const [conductedBy, setConductedBy] = useState("");
  const [attendanceRows, setAttendanceRows] = useState(createAttendanceRows);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const inputRef = useRef(null);
  const [pictureAttachments, setPictureAttachments] = useState([]);
  const pictureInputRef = useRef(null);

  const updateAttendanceRow = (id, field, value) => {
    setAttendanceRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const resetForm = () => {
    const current = new Date();
    previews.forEach((preview) => {
      if (preview) URL.revokeObjectURL(preview);
    });
    setTrainingRefNo("");
    setCategory("");
    setTrainingSubject("");
    setTrainingDate(formatDate(current));
    setTrainingTime(formatTime(current));
    setDuration("");
    setLocation("");
    setGivenBy("");
    setGivenByPosition("");
    setGivenTo("");
    setTotalNos("");
    setConductedBy("");
    setAttendanceRows(createAttendanceRows());
    setFiles([]);
    setPreviews([]);
    setPictureAttachments((previous) => {
      previous.forEach((attachment) => {
        if (attachment.url) URL.revokeObjectURL(attachment.url);
      });
      return [];
    });
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();

    const attendees = attendanceRows.filter(
      (row) => row.name.trim() || row.jobTitle.trim() || row.signature.trim(),
    );

    const payload = {
      trainingRefNo,
      category,
      trainingSubject,
      trainingDate,
      trainingTime,
      duration,
      location,
      trainingGivenBy: {
        name: givenBy,
        position: givenByPosition,
      },
      givenTo,
      totalNos,
      conductedBy,
      attendees,
      pictureAttachments: pictureAttachments.map((attachment) => ({
        name: attachment.name,
      })),
    };

    console.log("Training Record & Attendance Sheet submitted:", payload);
    alert("Training Record & Attendance Sheet submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Training Record & Attendance Sheet
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              HIPPL/QHSE/IMS/FMT/105, Rev:5 &nbsp;|&nbsp; Issue Date: 01-05-25
            </p>
          </div>
          {/* <Link to="/" className="shrink-0 text-sm text-sky-700 hover:underline">
            ← Back to MIR
          </Link> */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Training Information */}
          <div className="rounded-md border border-slate-200 bg-white shadow-sm">
            <SectionHeader number={1} title="Training Information" />
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Training Reference No.
                </label>
                <input
                  type="text"
                  value={trainingRefNo}
                  onChange={(e) => setTrainingRefNo(e.target.value)}
                  placeholder="Enter training reference number"
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <p className="mb-2 block text-sm font-medium text-slate-700">
                  Training
                </p>
                <div className="max-w-sm">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Training Subject
                </label>
                <textarea
                  value={trainingSubject}
                  onChange={(e) => setTrainingSubject(e.target.value)}
                  rows={3}
                  placeholder="Describe the subject covered during training"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:col-span-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Date of Training
                  </label>
                  <input
                    type="date"
                    value={trainingDate}
                    onChange={(e) => setTrainingDate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Time
                  </label>
                  <input
                    type="time"
                    value={trainingTime}
                    onChange={(e) => setTrainingTime(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 30 minutes"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Location / Venue of Training
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Training Given By (Name)
                </label>
                <input
                  type="text"
                  value={givenBy}
                  onChange={(e) => setGivenBy(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Position
                </label>
                <input
                  type="text"
                  value={givenByPosition}
                  onChange={(e) => setGivenByPosition(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Given to Team / Department / Contractor (Name)
                </label>
                <input
                  type="text"
                  value={givenTo}
                  onChange={(e) => setGivenTo(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Total Nos.
                </label>
                <input
                  type="number"
                  min={0}
                  value={totalNos}
                  onChange={(e) => setTotalNos(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Attendance */}
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

          <div className="flex justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Reset
            </button>
            <button
              type="submit"
              className="rounded-md bg-sky-700 px-5 py-2 text-sm font-medium text-white hover:bg-sky-800"
            >
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainingAttendanceSheet;



