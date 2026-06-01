import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, GripVertical, ClipboardList, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    listSafetyCategories,
    listSafetyTemplates,
    getSafetyTemplate,
    createSafetyChecklist,
    getProjectsForCurrentUser,
    getUsersByProject,
    getUsersByOrganization,
    getUsersByCreator,
    resolveActiveProjectId,
} from "../../../api";
import { showToast } from "../../../utils/toast";

const QUESTION_TYPES = ["Yes / No / NA", "Text", "Number"];

const ROLE_OPTIONS = [
    { value: "INITIALIZER", label: "Initializer" },
    { value: "MAKER", label: "Maker" },
    { value: "CHECKER", label: "Checker" },
    { value: "SUPERVISOR", label: "Supervisor" },
];

const generateId = () => Math.random().toString(36).substring(2, 11);

const CreateSafetyInspection = () => {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [orgId, setOrgId] = useState("");
    const [category, setCategory] = useState("");
    const [format, setFormat] = useState("");
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formats, setFormats] = useState([]);
    const [users, setUsers] = useState([]);
    const [movementSteps, setMovementSteps] = useState([
        { order_index: 1, role: "INITIALIZER", user_id: "", user_name: "" },
        { order_index: 2, role: "MAKER", user_id: "", user_name: "" },
        { order_index: 3, role: "CHECKER", user_id: "", user_name: "" },
    ]);

    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingFormats, setLoadingFormats] = useState(false);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load projects
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingProjects(true);
                const res = await getProjectsForCurrentUser();
                const raw = res?.data;
                const list = Array.isArray(raw) ? raw : raw?.results ?? [];
                if (alive) setProjects(list);
                const active = resolveActiveProjectId?.();
                if (alive && active && !projectId) {
                    setProjectId(String(active));
                    const p = list.find((x) => Number(x.id) === Number(active));
                    const oid = p?.org ?? p?.organization_id ?? p?.organization?.id ?? p?.org_id ?? "";
                    if (oid) setOrgId(String(oid));
                }
            } catch (e) {
                if (alive) showToast("Failed to load projects", "error");
            } finally {
                if (alive) setLoadingProjects(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    // Load categories when org + project
    useEffect(() => {
        if (!orgId || !projectId) {
            setCategories([]);
            setCategory("");
            setFormats([]);
            setFormat("");
            return;
        }
        let alive = true;
        (async () => {
            try {
                setLoadingCategories(true);
                const res = await listSafetyCategories({
                    org_id: orgId,
                    project_id: projectId,
                    active: true,
                });
                const data = res?.data;
                const list = Array.isArray(data) ? data : data?.results ?? [];
                if (alive) {
                    setCategories(list);
                    setCategory("");
                    setFormats([]);
                    setFormat("");
                }
            } catch (e) {
                if (alive) showToast("Failed to load categories", "error");
            } finally {
                if (alive) setLoadingCategories(false);
            }
        })();
        return () => { alive = false; };
    }, [orgId, projectId]);

    // Load formats when category selected
    useEffect(() => {
        if (!orgId || !projectId || !category) {
            setFormats([]);
            setFormat("");
            setTitle("");
            setQuestions([]);
            return;
        }
        let alive = true;
        (async () => {
            try {
                setLoadingFormats(true);
                const res = await listSafetyTemplates({
                    org_id: orgId,
                    project_id: projectId,
                    category,
                    status: "ACTIVE",
                    is_latest: true,
                });
                const data = res?.data;
                const list = Array.isArray(data) ? data : data?.results ?? [];
                if (alive) {
                    setFormats(list);
                    setFormat("");
                    setTitle("");
                    setQuestions([]);
                }
            } catch (e) {
                if (alive) showToast("Failed to load formats", "error");
            } finally {
                if (alive) setLoadingFormats(false);
            }
        })();
        return () => { alive = false; };
    }, [orgId, projectId, category]);

    // Load template detail when format selected (title + questions with options)
    useEffect(() => {
        if (!format) {
            setTitle("");
            setQuestions([]);
            return;
        }
        let alive = true;
        (async () => {
            try {
                setLoadingTemplate(true);
                const res = await getSafetyTemplate(format);
                const t = res?.data;
                if (alive && t) {
                    setTitle(t.title || "");
                    const qs = (t.questions ?? []).map((q) => ({
                        // Keep a stable local id for React and also store the original template question id
                        id: q.id ? `q-${q.id}` : generateId(),
                        template_question_id: q.id ?? null,
                        title: q.text || "",
                        type: "Yes / No / NA",
                        options: (q.options || []).map((o, i) => ({
                            id: generateId(),
                            label: typeof o === "string" ? o : o?.label ?? `Option ${i + 1}`,
                        })),
                        photo_required: !!q.photo_required,
                    }));
                    if (qs.length === 0) {
                        qs.push({
                            id: generateId(),
                            title: "Question 1",
                            type: "Yes / No / NA",
                            options: [
                                { id: generateId(), label: "Yes" },
                                { id: generateId(), label: "No" },
                                { id: generateId(), label: "NA" },
                            ],
                            photo_required: false,
                        });
                    }
                    setQuestions(qs);
                }
            } catch (e) {
                if (alive) showToast("Failed to load template details", "error");
            } finally {
                if (alive) setLoadingTemplate(false);
            }
        })();
        return () => { alive = false; };
    }, [format]);

    // Load users - try project, then org, then creator (projectId set when project selected)
    const extractUserList = (raw) => {
        if (Array.isArray(raw)) return raw;
        if (raw?.results && Array.isArray(raw.results)) return raw.results;
        if (raw?.users && Array.isArray(raw.users)) return raw.users;
        if (raw?.data && Array.isArray(raw.data)) return raw.data;
        return [];
    };

    useEffect(() => {
        if (!projectId && !orgId) {
            setUsers([]);
            return;
        }
        let alive = true;
        (async () => {
            try {
                setLoadingUsers(true);
                let list = [];
                if (projectId) {
                    try {
                        const res = await getUsersByProject(projectId);
                        list = extractUserList(res?.data);
                    } catch (_) {}
                }
                if (list.length === 0 && orgId) {
                    try {
                        const res = await getUsersByOrganization(orgId);
                        list = extractUserList(res?.data);
                    } catch (_) {}
                }
                if (list.length === 0) {
                    try {
                        const res = await getUsersByCreator();
                        list = extractUserList(res?.data);
                    } catch (_) {}
                }
                if (alive) setUsers(Array.isArray(list) ? list : []);
            } catch (e) {
                if (alive) setUsers([]);
            } finally {
                if (alive) setLoadingUsers(false);
            }
        })();
        return () => { alive = false; };
    }, [projectId, orgId]);

    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                id: generateId(),
                template_question_id: null, // ad-hoc question, not from template
                title: `Question ${prev.length + 1}`,
                type: "Yes / No / NA",
                options: [
                    { id: generateId(), label: "Yes" },
                    { id: generateId(), label: "No" },
                    { id: generateId(), label: "NA" },
                ],
                photo_required: false,
            },
        ]);
    };

    const updateQuestion = (id, field, value) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
        );
    };

    const deleteQuestion = (id) => {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
    };

    const duplicateQuestion = (id) => {
        const original = questions.find((q) => q.id === id);
        if (!original) return;
        const newQuestion = {
            ...original,
            id: generateId(),
            options: (original.options || []).map((o) => ({ ...o, id: generateId() })),
        };
        setQuestions((prev) => [...prev, newQuestion]);
    };

    const addOption = (questionId) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId
                    ? {
                          ...q,
                          options: [
                              ...(q.options || []),
                              { id: generateId(), label: `Option ${(q.options || []).length + 1}` },
                          ],
                      }
                    : q
            )
        );
    };

    const updateOption = (questionId, optionId, label) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId
                    ? {
                          ...q,
                          options: (q.options || []).map((o) =>
                              o.id === optionId ? { ...o, label } : o
                          ),
                      }
                    : q
            )
        );
    };

    const deleteOption = (questionId, optionId) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId
                    ? { ...q, options: (q.options || []).filter((o) => o.id !== optionId) }
                    : q
            )
        );
    };

    const addMovementStep = () => {
        const nextOrder = movementSteps.length + 1;
        setMovementSteps((prev) => [
            ...prev,
            { order_index: nextOrder, role: "MAKER", user_id: "", user_name: "" },
        ]);
    };

    const updateMovementStep = (idx, field, value) => {
        setMovementSteps((prev) =>
            prev.map((u, i) => {
                if (i !== idx) return u;
                const updated = { ...u, [field]: value };
                if (field === "user_id") {
                    const usr = users.find((x) => String(x.id) === String(value));
                    updated.user_name = usr ? (usr.name || usr.first_name || usr.username || "") : "";
                }
                return updated;
            })
        );
    };

    const removeMovementStep = (idx) => {
        setMovementSteps((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            return next.map((u, i) => ({ ...u, order_index: i + 1 }));
        });
    };

    const handleSubmit = async () => {
        if (!projectId || !orgId || !format) {
            showToast("Please select Project, Category, and Format", "error");
            return;
        }
        const assignments = movementSteps
            .filter((u) => u.user_id)
            .map((u, i) => ({
                order_index: i + 1,
                role: u.role,
                user_id: Number(u.user_id),
                user_name: u.user_name || "",
            }));
        if (assignments.length === 0) {
            showToast("Please assign at least one user in Checklist Movement", "error");
            return;
        }

        // Build per-question overrides for photo_required (only for questions that came from the template).
        const question_overrides = questions
            .filter((q) => q.template_question_id != null)
            .map((q) => ({
                template_question_id: Number(q.template_question_id),
                photo_required: !!q.photo_required,
            }));

        setSubmitting(true);
        try {
            await createSafetyChecklist({
                template_id: Number(format),
                project_id: Number(projectId),
                org_id: Number(orgId),
                title: title || undefined,
                movement_assignments: assignments,
                // Optional; backend will fall back to template defaults if empty.
                question_overrides,
            });
            showToast("Safety checklist created successfully", "success");
            navigate("/safetyInspections");
        } catch (err) {
            const msg =
                err?.response?.data?.template_id?.[0] ||
                err?.response?.data?.detail ||
                err?.message ||
                "Failed to create checklist";
            showToast(msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => navigate("/safetyInspections");

    const userLabel = (u) =>
        u?.name || [u?.first_name, u?.last_name].filter(Boolean).join(" ") || u?.username || `User #${u?.id}`;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Checklist Builder</h1>
                        <p className="text-sm text-gray-500">
                            Create inspection checklist from template
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Project only - no org field */}
                <div className="bg-white border rounded-lg p-5">
                    <div>
                        <label className="text-sm font-medium">Project</label>
                        <select
                            value={projectId}
                            onChange={(e) => {
                                const pid = e.target.value;
                                setProjectId(pid);
                                const p = projects.find((x) => String(x.id) === pid);
                                const oid = p?.org ?? p?.organization_id ?? p?.organization?.id ?? p?.org_id ?? "";
                                if (oid) setOrgId(String(oid));
                            }}
                            className="w-full mt-1 h-10 border rounded-md px-3"
                        >
                            <option value="">Select Project</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name || p.label || `Project #${p.id}`}
                                </option>
                            ))}
                        </select>
                        {loadingProjects && (
                            <span className="text-xs text-gray-500">Loading...</span>
                        )}
                    </div>
                </div>

                {/* Category + Format */}
                <div className="bg-white border rounded-lg p-5 grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full mt-1 h-10 border rounded-md px-3"
                            disabled={!orgId || !projectId || loadingCategories}
                        >
                            <option value="">Select Category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Format</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full mt-1 h-10 border rounded-md px-3"
                            disabled={!category || loadingFormats}
                        >
                            <option value="">Select Format</option>
                            {formats.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.title} {f.template_code ? `(${f.template_code})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Title */}
                <div className="bg-white border-t-4 border-orange-500 rounded-lg p-5">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled Checklist"
                        className="w-full text-lg font-medium border-b pb-2 outline-none"
                        disabled={loadingTemplate}
                    />
                </div>

                {/* Questions - full card with options, add question */}
                <div className="space-y-4">
                    {loadingTemplate && (
                        <div className="bg-white border rounded-lg p-5 text-gray-500">
                            Loading questions...
                        </div>
                    )}
                    {!loadingTemplate && questions.map((q) => (
                        <div key={q.id} className="bg-white border rounded-lg p-5">
                            <div className="flex gap-2 mb-4">
                                <GripVertical className="w-5 h-5 mt-2 text-gray-400" />
                                <div className="flex-1 grid grid-cols-[1fr_180px] gap-3">
                                    <input
                                        value={q.title}
                                        onChange={(e) => updateQuestion(q.id, "title", e.target.value)}
                                        className="h-10 border rounded-md px-3"
                                        placeholder="Question"
                                    />
                                    <select
                                        value={q.type}
                                        onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
                                        className="h-10 border rounded-md px-3"
                                    >
                                        {QUESTION_TYPES.map((t) => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="ml-7 space-y-2">
                                {(q.options || []).map((option) => (
                                    <div key={option.id} className="flex items-center gap-2">
                                        <div className="w-4 h-4 border rounded-full" />
                                        <input
                                            value={option.label}
                                            onChange={(e) =>
                                                updateOption(q.id, option.id, e.target.value)
                                            }
                                            className="flex-1 h-9 border rounded-md px-3"
                                        />
                                        <button
                                            onClick={() => deleteOption(q.id, option.id)}
                                            className="text-gray-500 hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addOption(q.id)}
                                    className="text-orange-500 text-sm flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Option
                                </button>
                            </div>

                            <div className="ml-7 flex justify-between items-center border-t mt-4 pt-3">
                                <div className="flex gap-3 text-gray-500">
                                    <button onClick={() => duplicateQuestion(q.id)}>
                                        <Copy size={16} />
                                    </button>
                                    <button onClick={() => deleteQuestion(q.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                    <span className="text-sm">Description</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    Photo Required
                                    <button
                                        onClick={() =>
                                            updateQuestion(q.id, "photo_required", !q.photo_required)
                                        }
                                        className={`w-10 h-5 rounded-full transition ${
                                            q.photo_required ? "bg-orange-500" : "bg-gray-300"
                                        }`}
                                    >
                                        <div
                                            className={`h-5 w-5 bg-white rounded-full shadow transform transition ${
                                                q.photo_required ? "translate-x-5" : ""
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addQuestion}
                        className="w-full border-2 border-dashed border-orange-300 text-orange-500 py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Add Question
                    </button>
                </div>

                {/* Checklist Movement - dynamic workflow: role + user per step */}
                <div className="bg-white border rounded-lg p-5">
                    <h2 className="font-semibold mb-4">Checklist Movement</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Define the workflow. Choose role and user for each step. Manager can decide the order (e.g. Checker first, then Maker).
                    </p>
                    <div className="flex flex-col gap-4">
                        {movementSteps.map((step, idx) => (
                            <div key={idx} className="flex items-end gap-3 flex-wrap">
                                <div className="flex flex-col">
                                    <label className="text-xs mb-1">Step {idx + 1} – Role</label>
                                    <select
                                        value={step.role}
                                        onChange={(e) =>
                                            updateMovementStep(idx, "role", e.target.value)
                                        }
                                        className="h-10 border rounded-md px-3 min-w-[140px]"
                                    >
                                        {ROLE_OPTIONS.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs mb-1">Assign To</label>
                                    <select
                                        value={step.user_id}
                                        onChange={(e) =>
                                            updateMovementStep(idx, "user_id", e.target.value)
                                        }
                                        className="h-10 border rounded-md px-3 min-w-[180px]"
                                        disabled={loadingUsers}
                                    >
                                        <option value="">Select User</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {userLabel(u)}
                                            </option>
                                        ))}
                                    </select>
                                    {loadingUsers && (
                                        <span className="text-xs text-gray-500">Loading users...</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeMovementStep(idx)}
                                    className="text-gray-500 hover:text-red-600 p-1 h-10"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addMovementStep}
                            className="self-start h-10 px-4 bg-orange-500 text-white rounded-md flex items-center gap-1"
                        >
                            <Plus size={16} /> Add Step
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleCancel}
                        className="border px-6 h-10 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !format}
                        className="bg-orange-500 text-white px-6 h-10 rounded-md disabled:opacity-50"
                    >
                        {submitting ? "Creating..." : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateSafetyInspection;
