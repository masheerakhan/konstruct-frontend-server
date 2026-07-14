import React, { useState } from "react";
import {
    ArrowLeft,
    Plus,
    ChevronDown,
    MapPin,
    Users,
    Trash2,
    ClipboardList,
    Camera,
    ImageOff,
} from "lucide-react";

const SEVERITY = {
    Critical: { fg: "#C1443A", bg: "#F5DCD9" },
    Major: { fg: "#B4761F", bg: "#F6E6CE" },
    Minor: { fg: "#3E5C76", bg: "#DEE6EC" },
};

const DEFAULT_PROJECTS = ["KT-3", "KT-4", "Riverside Heights"];
const DEFAULT_PHASES = ["Phase 1", "Phase 2", "Phase 3"];
const DEFAULT_STAGES = ["Structure", "Finishing", "MEP Rough-in", "Handover"];
const DEFAULT_CATEGORIES = [
    "Civil",
    "MEP",
    "Electrical",
    "Structural",
    "Safety",
    "Plumbing",
];
const DEFAULT_TOWERS = ["Tower A", "Tower B", "Tower C"];
const DEFAULT_FLOORS = [
    "3rd Floor",
    "8th Floor",
    "11th Floor",
    "14th Floor",
    "19th Floor",
    "22nd Floor",
];
const DEFAULT_TEAM = [
    { user_id: 992, user_name: "KTMaker", role_name: "maker" },
];

const inputCls =
    "w-full rounded-lg border px-3.5 py-2.5 text-[14px] bg-white outline-none transition-shadow focus:ring-2";

function FieldLabel({ children, required }) {
    return (
        <label
            className="block text-[13px] font-semibold mb-1.5"
            style={{ color: "#3A4552" }}
        >
            {children}
            {required && <span style={{ color: "#C1443A" }}> *</span>}
        </label>
    );
}

function Select({ value, onChange, options, placeholder, getLabel, getValue }) {
    return (
        <div className="relative">
            <select
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                className={`${inputCls} appearance-none pr-9 cursor-pointer`}
                style={{
                    borderColor: "#DEDAD1",
                    color: value ? "#1B2430" : "#9A968C",
                }}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => {
                    const optionValue = getValue ? getValue(option) : option;
                    const optionLabel = getLabel ? getLabel(option) : option;

                    return (
                        <option key={String(optionValue)} value={optionValue}>
                            {optionLabel}
                        </option>
                    );
                })}
            </select>

            <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#6B7480" }}
            />
        </div>
    );
}

function PhotoThumb({ file, size = 72 }) {
    const preview = file instanceof File ? URL.createObjectURL(file) : null;

    if (!preview) {
        return (
            <div
                className="flex items-center justify-center rounded-md shrink-0"
                style={{
                    width: size,
                    height: size,
                    background: "#E7E5E0",
                    color: "#9A968C",
                }}
            >
                <ImageOff size={18} />
            </div>
        );
    }

    return (
        <img
            src={preview}
            alt={file.name}
            className="rounded-md shrink-0 object-cover border"
            style={{
                width: size,
                height: size,
                borderColor: "#DEDAD1",
            }}
            onLoad={() => URL.revokeObjectURL(preview)}
        />
    );
}

function createEmptyItem() {
    return {
        key: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        repetition: "",
        gap_type: "",
        description: "",
        resolution_advised: "",
        assignees: [],
        attachments: [],
    };
}

export default function CreateObservation({
    onCancel,
    onSubmit,
    projects = DEFAULT_PROJECTS,
    phases = DEFAULT_PHASES,
    stages = DEFAULT_STAGES,
    categories = DEFAULT_CATEGORIES,
    towers = DEFAULT_TOWERS,
    floors = DEFAULT_FLOORS,
    team = DEFAULT_TEAM,
    currentUser = {
        user_id: 990,
        username: "KTChecker",
        role_name: "checker",
    },
    defaultProject = "KT-3",
    defaultProjectId = 146,
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [meta, setMeta] = useState({
        checklist_name: `QC Observation on ${new Date().toISOString().slice(0, 10)}`,
        project: defaultProjectId,
        project_name: defaultProject,
        phase: "",
        phase_name: "",
        stage: "",
        stage_name: "",
        category: "",
        category_name: "",
        sub_category: "",
        sub_category_name: "",
        tower: "",
        tower_name: "",
        floor: "",
        floor_name: "",
        custom_location: "",
        attendees: [],
    });
    const [items, setItems] = useState([createEmptyItem()]);

    const updateMeta = (key, value) => {
        setMeta((current) => ({ ...current, [key]: value }));
    };

    const updateItem = (key, patch) => {
        setItems((current) =>
            current.map((item) => (item.key === key ? { ...item, ...patch } : item))
        );
    };

    const removeItem = (key) => {
        setItems((current) =>
            current.length > 1
                ? current.filter((item) => item.key !== key)
                : current
        );
    };

    const toggleAssignee = (itemKey, user) => {
        setItems((current) =>
            current.map((item) => {
                if (item.key !== itemKey) return item;

                const exists = item.assignees.some(
                    (assignee) => Number(assignee.user_id) === Number(user.user_id)
                );

                return {
                    ...item,
                    assignees: exists
                        ? item.assignees.filter(
                            (assignee) =>
                                Number(assignee.user_id) !== Number(user.user_id)
                        )
                        : [
                            ...item.assignees,
                            {
                                user_id: user.user_id,
                                user_name: user.user_name || user.username,
                                role_name: (user.role_name || "maker").toLowerCase(),
                            },
                        ],
                };
            })
        );
    };

    const addPhotos = (itemKey, files) => {
        const newAttachments = Array.from(files).map((file) => ({
            file,
            type: "observation",
        }));

        setItems((current) =>
            current.map((item) =>
                item.key === itemKey
                    ? {
                        ...item,
                        attachments: [...item.attachments, ...newAttachments],
                    }
                    : item
            )
        );
    };

    const removePhoto = (itemKey, photoIndex) => {
        setItems((current) =>
            current.map((item) =>
                item.key === itemKey
                    ? {
                        ...item,
                        attachments: item.attachments.filter(
                            (_, index) => index !== photoIndex
                        ),
                    }
                    : item
            )
        );
    };

    const selectNamedEntity = (
        idKey,
        nameKey,
        rawValue,
        options,
        idField,
        nameField
    ) => {
        const selected = options.find(
            (option) => String(option[idField]) === String(rawValue)
        );

        setMeta((current) => ({
            ...current,
            [idKey]: rawValue,
            [nameKey]: selected?.[nameField] || rawValue,
        }));
    };

    const canSubmit =
        meta.project &&
        meta.phase &&
        meta.stage &&
        meta.category &&
        (meta.tower || meta.custom_location.trim()) &&
        items.every(
            (item) =>
                item.gap_type.trim() &&
                item.description.trim() &&
                item.assignees.length > 0
        );

    const buildFormData = () => {
        const formData = new FormData();

        Object.entries({
            ...meta,
            attendees: JSON.stringify(meta.attendees),
            created_by_id: currentUser.user_id,
            created_by_name: currentUser.username,
            created_by_role_name: currentUser.role_name.toLowerCase(),
        }).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== "") {
                formData.append(key, value);
            }
        });

        items.forEach((item, itemIndex) => {
            if (item.repetition) {
                formData.append(
                    `items[${itemIndex}][repetition]`,
                    item.repetition
                );
            }

            formData.append(
                `items[${itemIndex}][gap_type]`,
                item.gap_type
            );
            formData.append(
                `items[${itemIndex}][description]`,
                item.description
            );

            if (item.resolution_advised) {
                formData.append(
                    `items[${itemIndex}][resolution_advised]`,
                    item.resolution_advised
                );
            }

            item.assignees.forEach((assignee, assigneeIndex) => {
                formData.append(
                    `items[${itemIndex}][assignments][${assigneeIndex}][user_id]`,
                    assignee.user_id
                );
                formData.append(
                    `items[${itemIndex}][assignments][${assigneeIndex}][user_name]`,
                    assignee.user_name
                );
                formData.append(
                    `items[${itemIndex}][assignments][${assigneeIndex}][role_name]`,
                    assignee.role_name
                );
            });

            item.attachments.forEach((attachment, attachmentIndex) => {
                formData.append(
                    `items[${itemIndex}][attachments][${attachmentIndex}][type]`,
                    attachment.type
                );
                formData.append(
                    `items[${itemIndex}][attachments][${attachmentIndex}][file]`,
                    attachment.file
                );
            });
        });

        return formData;
    };

    const handleSubmit = async () => {
        if (!canSubmit || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const formData = buildFormData();

            if (onSubmit) {
                await onSubmit(formData, { meta, items });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const crumbs = [
        meta.project_name,
        meta.phase_name,
        meta.stage_name,
        meta.tower_name,
        meta.floor_name || meta.custom_location,
    ].filter(Boolean);

    return (
        <div
            className="min-h-screen p-8 font-sans"
            style={{ background: "#F6F5F1" }}
        >
            <style>{`
        .tag-corner {
          clip-path: polygon(
            0 0,
            calc(100% - 18px) 0,
            100% 18px,
            100% 100%,
            0 100%
          );
          border-radius: 4px;
        }

        input:focus,
        textarea:focus,
        select:focus {
          box-shadow: 0 0 0 3px rgba(224, 122, 31, 0.18);
          border-color: #E07A1F;
        }
      `}</style>

            <div className="max-w-[1100px] mx-auto">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center gap-1.5 text-[13.5px] font-semibold mb-4"
                        style={{ color: "#6B7480" }}
                    >
                        <ArrowLeft size={16} />
                        Back to dashboard
                    </button>
                )}

                <div
                    className="mb-2 text-[12px] font-semibold tracking-widest uppercase"
                    style={{ color: "#E07A1F" }}
                >
                    New Report
                </div>

                <h1
                    className="text-[32px] font-bold mb-1"
                    style={{ color: "#1B2430" }}
                >
                    Raise Observation
                </h1>

                <p className="text-[14px] mb-6" style={{ color: "#6B7480" }}>
                    Log a site observation and assign it to the responsible maker.
                </p>

                {crumbs.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-6 text-[12.5px]">
                        {crumbs.map((crumb, index) => (
                            <React.Fragment key={`${crumb}-${index}`}>
                                <span
                                    className="px-2.5 py-1 rounded-full font-medium"
                                    style={{ background: "#EFEDE7", color: "#3A4552" }}
                                >
                                    {crumb}
                                </span>
                                {index < crumbs.length - 1 && (
                                    <span style={{ color: "#B7BEC9" }}>/</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                <div
                    className="bg-white rounded-xl border p-6 mb-6"
                    style={{ borderColor: "#DEDAD1" }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <MapPin size={16} style={{ color: "#E07A1F" }} />
                        <div
                            className="text-[17px] font-bold"
                            style={{ color: "#1B2430" }}
                        >
                            Observation location
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div>
                            <FieldLabel required>Project</FieldLabel>
                            <Select
                                value={meta.project}
                                onChange={(value) => {
                                    if (
                                        projects.length > 0 &&
                                        typeof projects[0] === "object"
                                    ) {
                                        selectNamedEntity(
                                            "project",
                                            "project_name",
                                            value,
                                            projects,
                                            "project_id",
                                            "project_name"
                                        );
                                    } else {
                                        updateMeta("project", value);
                                        updateMeta("project_name", value);
                                    }
                                }}
                                options={projects}
                                placeholder="Select Project"
                                getValue={
                                    projects.length > 0 && typeof projects[0] === "object"
                                        ? (project) => project.project_id
                                        : undefined
                                }
                                getLabel={
                                    projects.length > 0 && typeof projects[0] === "object"
                                        ? (project) => project.project_name
                                        : undefined
                                }
                            />
                        </div>

                        <div>
                            <FieldLabel required>Checklist Name</FieldLabel>
                            <input
                                value={meta.checklist_name}
                                onChange={(event) =>
                                    updateMeta("checklist_name", event.target.value)
                                }
                                className={inputCls}
                                style={{ borderColor: "#DEDAD1" }}
                            />
                        </div>

                        <div>
                            <FieldLabel required>Phase</FieldLabel>
                            <Select
                                value={meta.phase}
                                onChange={(value) => {
                                    updateMeta("phase", value);
                                    updateMeta("phase_name", value);
                                }}
                                options={phases}
                                placeholder="Select Phase"
                            />
                        </div>

                        <div>
                            <FieldLabel required>Stage</FieldLabel>
                            <Select
                                value={meta.stage}
                                onChange={(value) => {
                                    updateMeta("stage", value);
                                    updateMeta("stage_name", value);
                                }}
                                options={stages}
                                placeholder="Select Stage"
                            />
                        </div>

                        <div>
                            <FieldLabel required>Category</FieldLabel>
                            <Select
                                value={meta.category}
                                onChange={(value) => {
                                    updateMeta("category", value);
                                    updateMeta("category_name", value);
                                }}
                                options={categories}
                                placeholder="Select Category"
                            />
                        </div>

                        <div>
                            <FieldLabel>Tower</FieldLabel>
                            <Select
                                value={meta.tower}
                                onChange={(value) => {
                                    updateMeta("tower", value);
                                    updateMeta("tower_name", value);
                                }}
                                options={towers}
                                placeholder="Select Tower"
                            />
                        </div>

                        <div>
                            <FieldLabel>Floor</FieldLabel>
                            <Select
                                value={meta.floor}
                                onChange={(value) => {
                                    updateMeta("floor", value);
                                    updateMeta("floor_name", value);
                                }}
                                options={floors}
                                placeholder="Select Floor"
                            />
                        </div>

                        <div>
                            <FieldLabel>Custom Location</FieldLabel>
                            <input
                                value={meta.custom_location}
                                onChange={(event) =>
                                    updateMeta("custom_location", event.target.value)
                                }
                                placeholder="Example: Basement ramp near gate 2"
                                className={inputCls}
                                style={{ borderColor: "#DEDAD1" }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ClipboardList size={16} style={{ color: "#E07A1F" }} />
                        <div
                            className="text-[17px] font-bold"
                            style={{ color: "#1B2430" }}
                        >
                            Observation Items
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setItems((current) => [...current, createEmptyItem()])
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-[13px] text-white"
                        style={{ background: "#1B2430" }}
                    >
                        <Plus size={15} />
                        Add Item
                    </button>
                </div>

                <div className="space-y-5 mb-8">
                    {items.map((item, itemIndex) => (
                        <div
                            key={item.key}
                            className="tag-corner bg-white border p-6"
                            style={{ borderColor: "#DEDAD1" }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className="text-[15px] font-bold"
                                    style={{ color: "#1B2430" }}
                                >
                                    Observation #{itemIndex + 1}
                                </div>

                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.key)}
                                        className="text-[12.5px] font-semibold flex items-center gap-1"
                                        style={{ color: "#C1443A" }}
                                    >
                                        <Trash2 size={14} />
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-5">
                                <div>
                                    <FieldLabel>Repetition</FieldLabel>
                                    <input
                                        value={item.repetition}
                                        onChange={(event) =>
                                            updateItem(item.key, {
                                                repetition: event.target.value,
                                            })
                                        }
                                        placeholder="Example: First occurrence"
                                        className={inputCls}
                                        style={{ borderColor: "#DEDAD1" }}
                                    />
                                </div>

                                <div>
                                    <FieldLabel required>Gap Type</FieldLabel>
                                    <input
                                        value={item.gap_type}
                                        onChange={(event) =>
                                            updateItem(item.key, {
                                                gap_type: event.target.value,
                                            })
                                        }
                                        placeholder="Example: Unsafe Condition"
                                        className={inputCls}
                                        style={{ borderColor: "#DEDAD1" }}
                                    />
                                </div>
                            </div>

                            <div className="mb-5">
                                <FieldLabel required>Description</FieldLabel>
                                <textarea
                                    value={item.description}
                                    onChange={(event) =>
                                        updateItem(item.key, {
                                            description: event.target.value,
                                        })
                                    }
                                    placeholder="Describe the observation in detail."
                                    rows={3}
                                    className={`${inputCls} resize-none`}
                                    style={{ borderColor: "#DEDAD1" }}
                                />
                            </div>

                            <div className="mb-5">
                                <FieldLabel>Resolution Advised</FieldLabel>
                                <textarea
                                    value={item.resolution_advised}
                                    onChange={(event) =>
                                        updateItem(item.key, {
                                            resolution_advised: event.target.value,
                                        })
                                    }
                                    placeholder="Describe the recommended corrective action."
                                    rows={3}
                                    className={`${inputCls} resize-none`}
                                    style={{ borderColor: "#DEDAD1" }}
                                />
                            </div>

                            <div className="mb-5">
                                <FieldLabel required>Assignees</FieldLabel>

                                {item.assignees.length === 0 && (
                                    <div
                                        className="text-[13px] italic mb-2"
                                        style={{ color: "#9A968C" }}
                                    >
                                        Select at least one maker.
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {team.map((user) => {
                                        const userId = user.user_id ?? user.id;
                                        const userName =
                                            user.user_name ?? user.username ?? user.name;
                                        const normalizedUser = {
                                            ...user,
                                            user_id: userId,
                                            user_name: userName,
                                        };

                                        const active = item.assignees.some(
                                            (assignee) =>
                                                Number(assignee.user_id) === Number(userId)
                                        );

                                        return (
                                            <button
                                                type="button"
                                                key={userId}
                                                onClick={() =>
                                                    toggleAssignee(item.key, normalizedUser)
                                                }
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium border transition-colors"
                                                style={
                                                    active
                                                        ? {
                                                            background: "#1B2430",
                                                            color: "white",
                                                            borderColor: "#1B2430",
                                                        }
                                                        : {
                                                            background: "white",
                                                            color: "#3A4552",
                                                            borderColor: "#DEDAD1",
                                                        }
                                                }
                                            >
                                                <Users size={12} />
                                                {userName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <FieldLabel>Observation Photos</FieldLabel>

                                <div className="flex gap-3 flex-wrap">
                                    {item.attachments.map((attachment, photoIndex) => (
                                        <div key={`${attachment.file.name}-${photoIndex}`}>
                                            <PhotoThumb file={attachment.file} />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removePhoto(item.key, photoIndex)
                                                }
                                                className="mt-1 text-[11px] font-semibold"
                                                style={{ color: "#C1443A" }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}

                                    <label
                                        className="w-[72px] h-[72px] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors hover:bg-[#FBF8F3]"
                                        style={{
                                            borderColor: "#DEDAD1",
                                            color: "#9A968C",
                                        }}
                                    >
                                        <Camera size={20} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(event) => {
                                                addPhotos(item.key, event.target.files);
                                                event.target.value = "";
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        type="button"
                        disabled={!canSubmit || isSubmitting}
                        onClick={handleSubmit}
                        className="px-5 py-3 rounded-lg font-semibold text-[14.5px] text-white shadow-sm transition-opacity"
                        style={{
                            background:
                                canSubmit && !isSubmitting ? "#E07A1F" : "#E7C6A5",
                            cursor:
                                canSubmit && !isSubmitting ? "pointer" : "not-allowed",
                        }}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Observation"}
                    </button>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-3 rounded-lg font-semibold text-[14.5px]"
                            style={{ color: "#6B7480" }}
                        >
                            Cancel
                        </button>
                    )}

                    {!canSubmit && (
                        <span
                            className="text-[12.5px]"
                            style={{ color: "#9A968C" }}
                        >
                            Complete the required location, item, and assignee fields.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
