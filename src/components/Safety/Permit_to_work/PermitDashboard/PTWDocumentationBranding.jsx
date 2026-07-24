import React, { useEffect, useState } from "react";
import { ArrowLeft, Save, Upload } from "lucide-react";

import {
    getPTWRegisterBranding,
    savePTWRegisterBranding,
    updatePTWRegisterBranding,
    getProjectsByOrganization,
    resolveOrgId,
} from "../../../../api";

import { resolveMediaUrl } from "../../../../lib/utils"


import { showToast } from "../../../../utils/toast";

const EMPTY_BRANDING = {
    id: null,
    title: "PERMIT REGISTER",
    format_no: "ADL-OH&S- F036",
    issued_date_text: "1st September 25",
    revision_no: "",
    revision_date_text: "",
    left_logo: null,
    right_logo: null,
    left_logo_url: "",
    right_logo_url: "",
};

const isFile = (value) => {
    return typeof File !== "undefined" && value instanceof File;
};

const getPreviewUrl = (fileOrUrl) => {
    if (!fileOrUrl) return "";

    if (isFile(fileOrUrl)) {
        return URL.createObjectURL(fileOrUrl);
    }

    return resolveMediaUrl(fileOrUrl);
};

const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    return data?.results || [];
};

const LogoUploadBox = ({
    title,
    logoKey,
    file,
    url,
    onUpload,
    onClearSelected,
}) => {
    const previewSource = file || url;
    const previewUrl = previewSource ? getPreviewUrl(previewSource) : "";

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Used in Permit Register PDF header.
                    </p>
                </div>

                {file && (
                    <button
                        type="button"
                        onClick={() => onClearSelected(logoKey)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                        Clear Selected
                    </button>
                )}
            </div>

            <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={title}
                        className="max-h-full max-w-full object-contain"
                    />
                ) : (
                    <span className="text-xs text-slate-400">No logo selected</span>
                )}
            </div>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100">
                <Upload size={16} />
                Upload Logo
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onUpload(logoKey, e.target.files?.[0])}
                />
            </label>
        </div>
    );
};

export default function PTWDocumentationBranding({ onBack }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [organizationId, setOrganizationId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [projects, setProjects] = useState([]);

    const [form, setForm] = useState(EMPTY_BRANDING);

    const loadProjects = async (orgId) => {
        if (!orgId) {
            setProjects([]);
            return;
        }

        try {
            const res = await getProjectsByOrganization(orgId);
            const list = normalizeList(res?.data);

            setProjects(
                list.map((project) => ({
                    id: project.id,
                    name:
                        project.name ||
                        project.project_name ||
                        project.title ||
                        `Project ${project.id}`,
                }))
            );
        } catch (err) {
            setProjects([]);
            showToast("Failed to load projects", "error");
        }
    };

    const loadBranding = async ({ orgId, pid }) => {
        setLoading(true);

        try {
            const res = await getPTWRegisterBranding({
                organization_id: orgId,
                project_id: pid || "",
            });

            const data = res?.data || {};

            if (data?.id) {
                setForm({
                    id: data.id,
                    title: data.title || "PERMIT REGISTER",
                    format_no: data.format_no || "",
                    issued_date_text: data.issued_date_text || "",
                    revision_no: data.revision_no || "",
                    revision_date_text: data.revision_date_text || "",
                    left_logo: null,
                    right_logo: null,
                    left_logo_url: data.left_logo_url || data.left_logo || "",
                    right_logo_url: data.right_logo_url || data.right_logo || "",
                });
            } else {
                setForm({
                    ...EMPTY_BRANDING,
                    left_logo: null,
                    right_logo: null,
                });
            }
        } catch (err) {
            setForm({
                ...EMPTY_BRANDING,
                left_logo: null,
                right_logo: null,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const orgId = resolveOrgId?.() || localStorage.getItem("ORG_ID") || "";

        setOrganizationId(orgId || "");
        loadProjects(orgId);
        loadBranding({ orgId, pid: "" });
    }, []);

    const handleProjectChange = async (value) => {
        setProjectId(value);

        await loadBranding({
            orgId: organizationId,
            pid: value,
        });
    };

    const setValue = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updateLogo = (key, file) => {
        if (!file) return;

        if (!String(file.type || "").startsWith("image/")) {
            showToast("Please upload a valid image file", "error");
            return;
        }

        setForm((prev) => ({
            ...prev,
            [key]: file,
        }));
    };

    const clearSelectedLogo = (key) => {
        setForm((prev) => ({
            ...prev,
            [key]: null,
        }));
    };

    const buildPayload = () => {
        const fd = new FormData();

        fd.append("organization_id", String(organizationId || ""));

        if (projectId) {
            fd.append("project_id", String(projectId));
        }

        fd.append("document_type", "permit_register");
        fd.append("title", form.title || "PERMIT REGISTER");
        fd.append("format_no", form.format_no || "");
        fd.append("issued_date_text", form.issued_date_text || "");
        fd.append("revision_no", form.revision_no || "");
        fd.append("revision_date_text", form.revision_date_text || "");

        // Important because your response showed is_active:false.
        // This prevents the created branding from disappearing from active list.
        fd.append("is_active", "true");

        if (isFile(form.left_logo)) {
            fd.append("left_logo", form.left_logo);
        }

        if (isFile(form.right_logo)) {
            fd.append("right_logo", form.right_logo);
        }

        return fd;
    };

    const handleSave = async () => {
        if (!organizationId) {
            showToast("Organization is required", "error");
            return;
        }

        setSaving(true);

        try {
            const payload = buildPayload();

            const params = {
                organization_id: organizationId,
                project_id: projectId || "",
            };

            if (form.id) {
                await updatePTWRegisterBranding(payload, params);
            } else {
                await savePTWRegisterBranding(payload, params);
            }

            showToast("Permit register branding saved successfully", "success");

            await loadBranding({
                orgId: organizationId,
                pid: projectId,
            });
        } catch (err) {
            const data = err?.response?.data;
            const detail =
                data?.detail ||
                data?.message ||
                err?.message ||
                "Failed to save permit register branding";

            showToast(detail, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">
                                Permit Register Branding
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Configure project-wise or organization-level logos for Permit Register PDF.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-medium text-slate-800 mb-4 border-b border-slate-100 pb-2">
                        Branding Scope
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-medium text-slate-500">
                                Organization ID
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                {organizationId || "-"}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Project
                            </label>

                            <select
                                value={projectId}
                                onChange={(e) => handleProjectChange(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">
                                    Organization Level - All Projects
                                </option>

                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>

                            <p className="mt-1 text-xs text-slate-500">
                                Select a project for project-specific branding, or keep organization level for fallback.
                            </p>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500">
                        Loading permit register branding...
                    </div>
                ) : (
                    <>
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-medium text-slate-800 mb-4 border-b border-slate-100 pb-2">
                                Register Logos
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <LogoUploadBox
                                    title="Left Logo"
                                    logoKey="left_logo"
                                    file={form.left_logo}
                                    url={form.left_logo_url}
                                    onUpload={updateLogo}
                                    onClearSelected={clearSelectedLogo}
                                />

                                <LogoUploadBox
                                    title="Right Logo"
                                    logoKey="right_logo"
                                    file={form.right_logo}
                                    url={form.right_logo_url}
                                    onUpload={updateLogo}
                                    onClearSelected={clearSelectedLogo}
                                />
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-medium text-slate-800 mb-4 border-b border-slate-100 pb-2">
                                Register Header Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Register Title
                                    </label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setValue("title", e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="PERMIT REGISTER"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Format No
                                    </label>
                                    <input
                                        type="text"
                                        value={form.format_no}
                                        onChange={(e) => setValue("format_no", e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="ADL-OH&S- F036"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Issued Date
                                    </label>
                                    <input
                                        type="text"
                                        value={form.issued_date_text}
                                        onChange={(e) => setValue("issued_date_text", e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="1st September 25"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Revision No
                                    </label>
                                    <input
                                        type="text"
                                        value={form.revision_no}
                                        onChange={(e) => setValue("revision_no", e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="R0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Revision Date
                                    </label>
                                    <input
                                        type="text"
                                        value={form.revision_date_text}
                                        onChange={(e) => setValue("revision_date_text", e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Revision Date"
                                    />
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-20">
                <div className="max-w-5xl mx-auto flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                    >
                        <Save size={18} />
                        {saving ? "Saving..." : "Save Register Branding"}
                    </button>
                </div>
            </div>
        </div>
    );
}