import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  downloadSafetyReport,
  getSafetyReportMeta,
  updateSafetyReportMeta,
} from "../../../api"; // or downloadSafetyReport
import { showToast } from "../../../utils/toast";

const ViewReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [rawPdfUrl, setRawPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let alive = true;
        const loadPdf = async () => {
            try {
                setLoading(true);
                const res = await downloadSafetyReport(id, { mode: "view" }); // or downloadSafetyReport(id)
                if (!alive) return;

                const blob = res?.data;
                if (!blob) {
                    showToast("Empty PDF response", "error");
                    setLoading(false);
                    return;
                }

                const rawUrl = window.URL.createObjectURL(blob);
                const url = `${rawUrl}#zoom=page-width&view=FitH`;

                setRawPdfUrl((prev) => {
                    if (prev) window.URL.revokeObjectURL(prev);
                    return rawUrl;
                });
                setPdfUrl(url);
            } catch (err) {
                const msg =
                    err?.response?.data?.detail ||
                    err?.message ||
                    "Failed to load report.";
                showToast(msg, "error");
            } finally {
                if (alive) setLoading(false);
            }
        };

        const loadMeta = async () => {
            try {
                const res = await getSafetyReportMeta(id);
                setMeta(res?.data || null);
            } catch (err) {
                const msg =
                    err?.response?.data?.detail ||
                    err?.message ||
                    "Failed to load report details.";
                showToast(msg, "error");
            }
        };

        loadMeta();
        loadPdf();
        return () => {
            alive = false;
            if (rawPdfUrl) {
                window.URL.revokeObjectURL(rawPdfUrl);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);


    const saveMetaField = async (key, value) => {
        try {
            setSaving(true);
            const next = { ...(meta || {}), [key]: value };
            setMeta(next);

            await updateSafetyReportMeta(id, { [key]: value });

            // reload pdf so latest values appear in iframe
            const res = await downloadSafetyReport(id, { mode: "view" });
            const blob = res?.data;
            if (blob) {
                const rawUrl = window.URL.createObjectURL(blob);
                const url = `${rawUrl}#zoom=page-width&view=FitH`;

                setRawPdfUrl((prev) => {
                    if (prev) window.URL.revokeObjectURL(prev);
                    return rawUrl;
                });
                setPdfUrl(url);
            }
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.message ||
                "Auto-save failed.";
            showToast(msg, "error");
        } finally {
            setSaving(false);
        }
    };


    const handleBack = () => {
        // go back to list; use exact path you use for list view
        navigate("/safetyInspections");
    };

    return (
        <div className="min-h-screen bg-content-bg p-2 sm:p-3">
            <div className="mx-auto flex h-[calc(100vh-1rem)] w-full max-w-[98vw] flex-col rounded-2xl bg-card p-2 shadow-sm sm:p-4">
                {/* Header with Back */}
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <h1 className="text-sm font-semibold text-foreground sm:text-base">
                        Safety Inspection Report #{id}
                    </h1>
                    <div className="hidden sm:block" />
                </div>


                {/* {meta && (
                    <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Name of Contractor
                            </label>
                            <input
                                value={meta.name_of_contractor || ""}
                                onChange={(e) =>
                                    setMeta((prev) => ({ ...prev, name_of_contractor: e.target.value }))
                                }
                                onBlur={(e) => saveMetaField("name_of_contractor", e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Date of Inspection
                            </label>
                            <input
                                type="date"
                                value={meta.date_of_inspection || ""}
                                onChange={(e) =>
                                    setMeta((prev) => ({ ...prev, date_of_inspection: e.target.value }))
                                }
                                onBlur={(e) => saveMetaField("date_of_inspection", e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Make / Model
                            </label>
                            <input
                                value={meta.make_model || ""}
                                onChange={(e) =>
                                    setMeta((prev) => ({ ...prev, make_model: e.target.value }))
                                }
                                onBlur={(e) => saveMetaField("make_model", e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Identification No.
                            </label>
                            <input
                                value={meta.identification_no || ""}
                                onChange={(e) =>
                                    setMeta((prev) => ({ ...prev, identification_no: e.target.value }))
                                }
                                onBlur={(e) => saveMetaField("identification_no", e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Location
                            </label>
                            <input
                                value={meta.location || ""}
                                onChange={(e) =>
                                    setMeta((prev) => ({ ...prev, location: e.target.value }))
                                }
                                onBlur={(e) => saveMetaField("location", e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Name of Operator
                            </label>
                            <input
                                value={meta.name_of_operator || ""}
                                onChange={(e) =>
                                    setMeta((prev) => ({ ...prev, name_of_operator: e.target.value }))
                                }
                                onBlur={(e) => saveMetaField("name_of_operator", e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="sm:col-span-2 text-xs text-muted-foreground">
                            {saving ? "Saving..." : "Changes auto-save when you leave a field."}
                        </div>
                    </div>
                )} */}


                {/* Content */}
                <div className="flex-1 rounded-lg border border-border bg-background overflow-hidden">
                    {loading && (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Loading report…
                        </div>
                    )}
                    {!loading && !pdfUrl && (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Report not available.
                        </div>
                    )}
                    {!loading && pdfUrl && (
                        <iframe
                            title={`Safety report ${id}`}
                            src={pdfUrl}
                            className="w-full h-full"
                            style={{ border: "none" }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewReport;