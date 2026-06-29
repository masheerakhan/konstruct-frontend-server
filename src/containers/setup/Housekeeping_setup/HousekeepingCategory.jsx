// frontendservice/kounstruct-frontend/src/containers/setup/Housekeeping_setup/HousekeepingCategory.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { listHousekeepingCategories, createHousekeepingCategory } from "../../../api";

function HousekeepingCategory({
    categories,
    setCategories,
    selectedCategoryId,
    onSelectCategory,
    projects,
    selectedProjectId,
    onSelectProject,
    orgId,
    projectId,
    projectsLoading,
}) {
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [addLoading, setAddLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    const safeProjects = Array.isArray(projects) ? projects : [];
    const safeCategories = Array.isArray(categories) ? categories : [];

    // Fetch categories when org and project are selected
    useEffect(() => {
        if (!orgId || !projectId) {
            if (setCategories) setCategories([]);
            return;
        }
        let cancelled = false;
        setCategoriesLoading(true);
        const load = async () => {
            try {
                const res = await listHousekeepingCategories({
                    org_id: orgId,
                    project_id: projectId,
                    active: true,
                    template_type: "OBSERVATION",
                });
                const data = res?.data ?? res;
                const list = Array.isArray(data) ? data : data?.results ?? [];
                if (!cancelled && setCategories) setCategories(list);
            } catch (e) {
                console.error(e);
                if (!cancelled) toast.error("Failed to load categories");
                if (!cancelled && setCategories) setCategories([]);
            } finally {
                if (!cancelled) setCategoriesLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [orgId, projectId, setCategories]);

    const handleAdd = async () => {
        if (!newName.trim()) {
            toast.error("Category name is required.");
            return;
        }
        if (!orgId || !projectId) {
            toast.error("Please select a project first.");
            return;
        }
        setAddLoading(true);
        try {
            const res = await createHousekeepingCategory({
                org_id: Number(orgId),
                project_id: Number(projectId),
                name: newName.trim(),
                description: "",
                active: true,
                template_type: "OBSERVATION",
            });
            const created = res?.data ?? res;
            if (created?.id) {
                onSelectCategory(created.id);
                const listRes = await listHousekeepingCategories({
                    org_id: orgId,
                    project_id: projectId,
                    active: true,
                    template_type: "OBSERVATION",
                });
                const data = listRes?.data ?? listRes;
                const next = Array.isArray(data) ? data : data?.results ?? [];
                if (setCategories) setCategories(next);
                setShowModal(false);
                setNewName("");
                toast.success("Category created.");
            }
        } catch (e) {
            console.error(e);
            const msg = e?.response?.data?.name?.[0]
                || e?.response?.data?.detail
                || "Failed to create category";
            toast.error(msg);
        } finally {
            setAddLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
                Select / Create Category
            </h2>

            {projectsLoading ? (
                <p className="text-sm text-gray-500">Loading projects...</p>
            ) : (
                <>
                    <div className="flex flex-col gap-4 mb-4">
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Project</label>
                            <select
                                value={selectedProjectId || ""}
                                onChange={(e) => onSelectProject?.(e.target.value)}
                                className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
                            >
                                <option value="">Select Project</option>
                                {safeProjects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-700 block mb-1">Category</label>
                                <select
                                    value={selectedCategoryId || ""}
                                    onChange={(e) => onSelectCategory?.(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
                                    disabled={categoriesLoading}
                                >
                                    <option value="">
                                        {categoriesLoading ? "Loading categories..." : "Select Category"}
                                    </option>
                                    {safeCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                disabled={!orgId || !projectId}
                                className="inline-flex items-center px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                + Add
                            </button>
                        </div>
                    </div>
                </>
            )}

            {showModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">
                            Add New Category
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-700">Category Name</label>
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                    placeholder="Category name"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                disabled={addLoading}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={addLoading || !newName.trim()}
                                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
                            >
                                {addLoading ? "Adding..." : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HousekeepingCategory;
