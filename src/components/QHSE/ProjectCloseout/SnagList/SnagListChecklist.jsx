import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
    Plus,
    Eye,
    Pencil,
    Trash2,
    Search,
    ArrowUpDown,
    ChevronLeft,
    CheckCircle2,
    ImagePlus,
    X,
    MapPin,
    FileText,
} from "lucide-react";
import { getProjectsForCurrentUser } from "../../../../api";
import FileUploadControl from "../../../FileUploadControl";

function todayInputDate() {
    return new Date().toISOString().slice(0, 10);
}

function createObservationCard() {
    return {
        id: `observation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        snagPoint: "",
        areaLocation: "",
        evidenceFiles: [],
    };
}

function createSnagListNo(count) {
    return `SNAG-${String(count + 1).padStart(3, "0")}`;
}

const INITIAL_SNAG_LISTS = [];

function getFileName(file, fallback = "Evidence file") {
    return file?.name || file?.file_name || file?.filename || fallback;
}

function isImageFile(file) {
    const fileName = getFileName(file, "").toLowerCase();
    const fileType = String(file?.type || "").toLowerCase();

    return (
        fileType.startsWith("image/") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".webp")
    );
}

function EvidencePreviewItem({ file, index }) {
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        if (file instanceof File) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            return () => URL.revokeObjectURL(url);
        }

        setPreviewUrl(file?.url || file?.file || file?.preview || "");
    }, [file]);

    const handleOpen = () => {
        if (!previewUrl) return;
        window.open(previewUrl, "_blank", "noopener,noreferrer");
    };

    const fileName = getFileName(file, `Evidence ${index + 1}`);
    const image = isImageFile(file);

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
            {image && previewUrl ? (
                <button
                    type="button"
                    onClick={handleOpen}
                    className="block w-full overflow-hidden rounded-md border border-gray-200 bg-white"
                    title="Open image"
                >
                    <img
                        src={previewUrl}
                        alt={fileName}
                        className="h-28 w-full object-cover"
                    />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleOpen}
                    disabled={!previewUrl}
                    className="flex h-28 w-full items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Open file"
                >
                    <FileText className="h-8 w-8" />
                </button>
            )}

            <div className="mt-2 truncate text-xs font-medium text-gray-700">
                {fileName}
            </div>
        </div>
    );
}

function ViewSnagListModal({ snagList, onClose }) {
    if (!snagList) return null;

    const observations = Array.isArray(snagList.observations)
        ? snagList.observations
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            View Snag List
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            {snagList.snagListNo || "-"} • {snagList.date || "-"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Project
                            </div>
                            <div className="mt-1 font-medium text-gray-900">
                                {snagList.projectName || "-"}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Location
                            </div>
                            <div className="mt-1 font-medium text-gray-900">
                                {snagList.location || "-"}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Total Observations
                            </div>
                            <div className="mt-1 font-medium text-gray-900">
                                {observations.length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {observations.length > 0 ? (
                        <div className="space-y-4">
                            {observations.map((observation, index) => (
                                <div
                                    key={observation.id || index}
                                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">
                                                Observation {index + 1}
                                            </h4>

                                            <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {observation.areaLocation || "No area/location"}
                                            </div>
                                        </div>

                                        <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                                            Read Only
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Snag Point / Observation
                                            </div>

                                            <div className="min-h-[72px] whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                                                {observation.snagPoint || "-"}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Area / Location
                                            </div>

                                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                                                {observation.areaLocation || "-"}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Uploaded Photographs / Evidence
                                            </div>

                                            {observation.evidenceFiles?.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                    {observation.evidenceFiles.map((file, fileIndex) => (
                                                        <EvidencePreviewItem
                                                            key={`${getFileName(file)}-${fileIndex}`}
                                                            file={file}
                                                            index={fileIndex}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
                                                    No evidence uploaded.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                            No observations found in this snag list.
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-200 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SnagListChecklist({
    folderId,
    folderName = "Snag List",
}) {
    const [screenMode, setScreenMode] = useState("register"); // register | create
    const [selectedViewSnagList, setSelectedViewSnagList] = useState(null);

    const [snagLists, setSnagLists] = useState(INITIAL_SNAG_LISTS);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    const [createHeader, setCreateHeader] = useState({
        projectId: "",
        projectName: "",
        location: "Fetching location…",
        date: todayInputDate(),
    });

    const [observations, setObservations] = useState([]);

    useEffect(() => {
        let active = true;

        async function loadProjects() {
            setLoadingProjects(true);

            try {
                const res = await getProjectsForCurrentUser();
                const raw = Array.isArray(res?.data)
                    ? res.data
                    : res?.data?.results || [];

                const options = raw
                    .filter((project) => project?.id != null)
                    .map((project) => ({
                        id: String(project.id),
                        name:
                            project.name ||
                            project.project_name ||
                            project.project?.name ||
                            `Project ${project.id}`,
                    }));

                if (!active) return;

                setProjects(options);

                if (options.length > 0) {
                    setCreateHeader((prev) => ({
                        ...prev,
                        projectId: prev.projectId || options[0].id,
                        projectName: prev.projectName || options[0].name,
                    }));
                }
            } catch (err) {
                if (active) {
                    setProjects([]);
                    toast.error("Failed to load projects.");
                }
            } finally {
                if (active) setLoadingProjects(false);
            }
        }

        loadProjects();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setCreateHeader((prev) => ({ ...prev, location: "" }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );

                    const data = await res.json();
                    const addr = data.address || {};

                    const locationText = [
                        addr.road || addr.pedestrian || addr.footway || "",
                        addr.suburb ||
                        addr.neighbourhood ||
                        addr.village ||
                        addr.town ||
                        "",
                        addr.city || addr.state_district || "",
                        addr.state || "",
                    ]
                        .filter(Boolean)
                        .join(", ");

                    setCreateHeader((prev) => ({
                        ...prev,
                        location:
                            locationText ||
                            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                    }));
                } catch {
                    setCreateHeader((prev) => ({
                        ...prev,
                        location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                    }));
                }
            },
            () => {
                setCreateHeader((prev) => ({
                    ...prev,
                    location: "Location unavailable",
                }));
            }
        );
    }, []);

    const resetCreateForm = () => {
        setCreateHeader((prev) => ({
            ...prev,
            date: todayInputDate(),
        }));

        setObservations([]);
    };

    const handleCreateSnagList = () => {
        resetCreateForm();
        setScreenMode("create");
    };

    const handleBackToRegister = () => {
        const hasUnsavedData =
            observations.length > 0 ||
            createHeader.projectName ||
            createHeader.location ||
            createHeader.date;

        if (hasUnsavedData && observations.length > 0) {
            const confirmed = window.confirm(
                "You have unsaved snag observations. Do you want to go back?"
            );

            if (!confirmed) return;
        }

        setScreenMode("register");
    };

    const handleProjectChange = (projectId) => {
        const selectedProject = projects.find(
            (project) => project.id === projectId
        );

        setCreateHeader((prev) => ({
            ...prev,
            projectId,
            projectName: selectedProject?.name || "",
        }));
    };

    const handleCreateObservation = () => {
        setObservations([createObservationCard()]);
    };

    const handleAddObservation = () => {
        setObservations((prev) => [...prev, createObservationCard()]);
    };

    const handleDeleteObservation = (observationId) => {
        setObservations((prev) =>
            prev.filter((observation) => observation.id !== observationId)
        );
    };

    const updateObservation = (observationId, patch) => {
        setObservations((prev) =>
            prev.map((observation) =>
                observation.id === observationId
                    ? { ...observation, ...patch }
                    : observation
            )
        );
    };

    const handleEvidenceFilesChange = (observationId, files) => {
        const normalizedFiles = Array.isArray(files)
            ? files
            : Array.from(files || []);

        updateObservation(observationId, {
            evidenceFiles: normalizedFiles,
        });
    };

    const handleEvidenceDelete = (observationId, indexToRemove) => {
        setObservations((prev) =>
            prev.map((observation) => {
                if (observation.id !== observationId) return observation;

                return {
                    ...observation,
                    evidenceFiles: (observation.evidenceFiles || []).filter(
                        (_, index) => index !== indexToRemove
                    ),
                };
            })
        );
    };

    const handleSaveSnagList = () => {
        if (!createHeader.projectName) {
            toast.error("Please select project.");
            return;
        }

        if (!createHeader.location || !createHeader.location.trim()) {
            toast.error("Please enter location.");
            return;
        }

        if (!createHeader.date) {
            toast.error("Please select date.");
            return;
        }

        if (observations.length === 0) {
            toast.error("Please create at least one observation.");
            return;
        }

        const invalidObservation = observations.find(
            (observation) =>
                !observation.snagPoint.trim() || !observation.areaLocation.trim()
        );

        if (invalidObservation) {
            toast.error("Please fill Snag Point / Observation and Area / Location.");
            return;
        }

        const newSnagList = {
            id: `snag-list-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            snagListNo: createSnagListNo(snagLists.length),
            date: createHeader.date,
            projectName: createHeader.projectName,
            location: createHeader.location,
            areaLocation:
                observations.length === 1
                    ? observations[0].areaLocation
                    : "Multiple Areas",
            totalSnags: observations.length,
            pendingSnags: observations.length,
            closedSnags: 0,
            status: "Open",
            createdBy: "PMC",
            observations,
        };

        const payload = {
            folderId,
            folderName,
            header: createHeader,
            observations,
        };

        console.log("Create Snag List Payload:", payload);

        setSnagLists((prev) => [newSnagList, ...prev]);
        toast.success("Snag list created.");
        resetCreateForm();
        setScreenMode("register");
    };

    const handleView = (row) => {
        setSelectedViewSnagList(row);
    };

    // const handleEdit = (row) => {
    //     toast(`Edit flow pending for ${row.snagListNo}`);
    // };

    const handleDelete = (row) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${row.snagListNo}?`
        );

        if (!confirmed) return;

        setSnagLists((prev) => prev.filter((item) => item.id !== row.id));
        toast.success("Snag list deleted.");
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        let rows = [...snagLists];

        if (query) {
            rows = rows.filter((row) => {
                return (
                    String(row.snagListNo || "").toLowerCase().includes(query) ||
                    String(row.projectName || "").toLowerCase().includes(query) ||
                    String(row.areaLocation || "").toLowerCase().includes(query) ||
                    String(row.status || "").toLowerCase().includes(query) ||
                    String(row.createdBy || "").toLowerCase().includes(query)
                );
            });
        }

        if (sortConfig.key) {
            rows.sort((a, b) => {
                const aVal = a?.[sortConfig.key] ?? "";
                const bVal = b?.[sortConfig.key] ?? "";

                if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return rows;
    }, [snagLists, searchQuery, sortConfig]);

    const SortHeader = ({ label, sortKey, className = "" }) => (
        <th
            className={`cursor-pointer px-4 py-3 text-left font-semibold text-gray-600 hover:bg-gray-100 ${className}`}
            onClick={() => handleSort(sortKey)}
        >
            <div className="flex items-center gap-1 whitespace-nowrap">
                <ArrowUpDown
                    className={`h-3.5 w-3.5 ${sortConfig.key === sortKey ? "text-primary" : "text-gray-400"
                        }`}
                />
                {label}
            </div>
        </th>
    );

    if (screenMode === "create") {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleBackToRegister}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Snag List Register
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveSnagList}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Save Snag List
                    </button>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 border-b border-gray-200 pb-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Create Snag List
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Fill header details and add snag observations with photographs /
                            evidence.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Project
                            </label>

                            <select
                                value={createHeader.projectId}
                                onChange={(event) => handleProjectChange(event.target.value)}
                                disabled={loadingProjects}
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">
                                    {loadingProjects ? "Loading projects..." : "Select project"}
                                </option>

                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Location
                            </label>

                            <input
                                type="text"
                                value={createHeader.location}
                                onChange={(event) =>
                                    setCreateHeader((prev) => ({
                                        ...prev,
                                        location: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Enter location"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Date
                            </label>

                            <input
                                type="date"
                                value={createHeader.date}
                                onChange={(event) =>
                                    setCreateHeader((prev) => ({
                                        ...prev,
                                        date: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                Observations
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                Add one or more snag observations with area/location and image
                                evidence.
                            </p>
                        </div>

                        {observations.length > 0 ? (
                            <button
                                type="button"
                                onClick={handleAddObservation}
                                className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                            >
                                <Plus className="h-4 w-4" />
                                Add Observation
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCreateObservation}
                                className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                            >
                                <Plus className="h-4 w-4" />
                                Create Observation
                            </button>
                        )}
                    </div>

                    {observations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-primary">
                                <ImagePlus className="h-7 w-7" />
                            </div>

                            <h4 className="mt-4 text-base font-semibold text-gray-900">
                                No observation added yet
                            </h4>

                            <p className="mt-1 max-w-md text-sm text-gray-500">
                                Click Create Observation to add snag point, area/location and
                                photographs/evidence.
                            </p>

                            <button
                                type="button"
                                onClick={handleCreateObservation}
                                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                            >
                                <Plus className="h-4 w-4" />
                                Create Observation
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 p-5">
                            {observations.map((observation, index) => (
                                <div
                                    key={observation.id}
                                    className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteObservation(observation.id)}
                                        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                        title="Delete observation"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="mb-4 border-b border-gray-100 pb-3 pr-10">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                            Observation {index + 1}
                                        </h4>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Enter snag details raised by PMC / Maker.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <div className="lg:col-span-2">
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Snag Point / Observation
                                            </label>

                                            <textarea
                                                value={observation.snagPoint}
                                                onChange={(event) =>
                                                    updateObservation(observation.id, {
                                                        snagPoint: event.target.value,
                                                    })
                                                }
                                                rows={4}
                                                className="min-h-[100px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                placeholder="Enter snag point / observation"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Area / Location
                                            </label>

                                            <input
                                                type="text"
                                                value={observation.areaLocation}
                                                onChange={(event) =>
                                                    updateObservation(observation.id, {
                                                        areaLocation: event.target.value,
                                                    })
                                                }
                                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                placeholder="Enter area / location"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Photographs / Evidence
                                            </label>

                                            <FileUploadControl
                                                files={observation.evidenceFiles || []}
                                                multiple
                                                append
                                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                                uploadLabel="Upload Evidence"
                                                addMoreLabel="Add More"
                                                onFilesChange={(files) =>
                                                    handleEvidenceFilesChange(observation.id, files)
                                                }
                                                onDelete={(indexToRemove) =>
                                                    handleEvidenceDelete(observation.id, indexToRemove)
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end border-t border-gray-200 px-5 py-4">
                        <button
                            type="button"
                            onClick={handleSaveSnagList}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Save Snag List
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Snag List Register
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Created snag lists will appear here. Use Create Snag List to raise
                            new snag points.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateSnagList}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Create Snag List
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Total Lists
                        </div>
                        <div className="mt-1 text-xl font-semibold text-gray-900">
                            {snagLists.length}
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Total Snags
                        </div>
                        <div className="mt-1 text-xl font-semibold text-gray-900">
                            {snagLists.reduce(
                                (total, row) => total + Number(row.totalSnags || 0),
                                0
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Pending
                        </div>
                        <div className="mt-1 text-xl font-semibold text-orange-600">
                            {snagLists.reduce(
                                (total, row) => total + Number(row.pendingSnags || 0),
                                0
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Closed
                        </div>
                        <div className="mt-1 text-xl font-semibold text-green-600">
                            {snagLists.reduce(
                                (total, row) => total + Number(row.closedSnags || 0),
                                0
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-base font-semibold text-gray-900">
                        Created Snag Lists
                    </h3>

                    <div className="relative w-full md:w-[320px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search snag list..."
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1150px] text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="w-[7%] px-4 py-3 text-left font-semibold text-gray-600">
                                    S. No.
                                </th>

                                <SortHeader
                                    label="Snag List No."
                                    sortKey="snagListNo"
                                    className="w-[15%]"
                                />

                                <SortHeader label="Date" sortKey="date" className="w-[12%]" />

                                <SortHeader
                                    label="Project"
                                    sortKey="projectName"
                                    className="w-[16%]"
                                />

                                <SortHeader
                                    label="Area Location"
                                    sortKey="areaLocation"
                                    className="w-[18%]"
                                />

                                <SortHeader
                                    label="Total Snags"
                                    sortKey="totalSnags"
                                    className="w-[10%]"
                                />

                                <SortHeader
                                    label="Pending"
                                    sortKey="pendingSnags"
                                    className="w-[8%]"
                                />

                                <SortHeader
                                    label="Closed"
                                    sortKey="closedSnags"
                                    className="w-[8%]"
                                />

                                <SortHeader
                                    label="Status"
                                    sortKey="status"
                                    className="w-[8%]"
                                />

                                <th className="w-[12%] px-4 py-3 text-left font-semibold text-gray-600">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRows.length > 0 ? (
                                filteredRows.map((row, index) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-gray-100 odd:bg-white even:bg-slate-50 hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 text-gray-600">{index + 1}</td>

                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {row.snagListNo || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-700">
                                            {row.date || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-700">
                                            {row.projectName || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-700">
                                            {row.areaLocation || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-700">
                                            {row.totalSnags ?? 0}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                                                {row.pendingSnags ?? 0}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                                {row.closedSnags ?? 0}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${row.status === "Closed"
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-blue-50 text-blue-700"
                                                    }`}
                                            >
                                                {row.status || "Open"}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleView(row)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {/* 
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(row)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-primary hover:bg-orange-100"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button> */}

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(row)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={10}
                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                    >
                                        No snag list created yet. Click{" "}
                                        <span className="font-semibold text-primary">
                                            Create Snag List
                                        </span>{" "}
                                        to add one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedViewSnagList && (
                <ViewSnagListModal
                    snagList={selectedViewSnagList}
                    onClose={() => setSelectedViewSnagList(null)}
                />
            )}
        </div>
    );
}