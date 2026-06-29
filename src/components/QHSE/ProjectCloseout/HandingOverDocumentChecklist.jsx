import { Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { getProjectsForCurrentUser } from "../../../api";
import FileUploadControl from "../../FileUploadControl";

const PROVIDED_OPTIONS = ["Yes", "No"];

const DOCUMENT_OPTIONS = [
  "Contract/PO Copy",
  "BOQ",
  "Scope of Supply/Work",
  "Design Details/Specification",
  "Quality Assurance Plan",
  "Design Basis Report",
  "Technical Specifications",
  "Guarantee/Warrantee Certificates",
  "Manufacturer Test Certificate",
  "Factory Acceptance Test Report",
  "Commissioning Report",
  "Site Test Reports",
  "Govt. Certificates if Applicable",
  "3rd Party Certificate if required",
  "Cable Schedule",
  "Drawings (As Applicable)",
  "Automation and Logic Details",
  "Interlock Details",
  "O&M Manual",
  "List of Recommended Spares",
  "List of Critical Spares",
  "Service Escalation Matrix",
  "Site Training Records",
  "Recommended Maintainance check sheet",
  "Copy of check sheet will be followed during warranty.",
  "Soft Copy of entire Handover documents",
  "Do and Don'ts",
  "Snag list Closure - Signed and Vetted by Site PMC / Project Team",
  "Installation Qualification (IQ) - Is everything installed correctly?",
  "Operational Qualification (OQ) - Is everything operating correctly? and, What are the operating limits of this device?",
  "Performance Qualification (PQ) - Does this process produce the right result? and, Is this process safe and consistent?",
  "Dossier",
  "Archive of all Records, Documents, Inspections and QHSE full System compliance in HIP's Common Server",
  "Training for System Handling and Operation to MST / Blue Badge / Site Project Team",
];

const DRAWING_OPTIONS = [
  "Layout Drawing",
  "Single Line Diagram",
  "Electrical Schematic Diagram",
  "Electrical Control Drawings",
  "Wiring and TB Diagram",
  "Civil Drawings",
  "Mechanical Drawings",
  "P&ID Diagrams",
  "Instrumentation Drawings",
  "As Built Drawings as per DCI",
];

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDrawingItem(overrides = {}) {
  return {
    id: newId("drawing-item"),
    drawingType: "",
    provided: "",
    attachments: [],
    annexureNo: "",
    remark: "",
    ...overrides,
  };
}

function createChecklistRow(overrides = {}) {
  return {
    id: newId("hod-row"),
    descriptionOfDocument: "",
    provided: "",
    attachments: [],
    annexureNo: "",
    remark: "",
    drawingItems: [],
    ...overrides,
  };
}

function createDefaultRows() {
  return [createChecklistRow({ srNo: 1 })];
}

export default function HandingOverDocumentChecklist({
  folderId,
  folderName = "Handing Over Document Checklist",
}) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [header, setHeader] = useState({
    projectId: "",
    projectName: "",
    date: todayInputDate(),
    contractorName: "",
    scopeOfWork: "",
    subSystemAssociatedEquipment: "",
  });

  const [rows, setRows] = useState(() => createDefaultRows());
  const [submitting, setSubmitting] = useState(false);

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
          setHeader((prev) => ({
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

  const updateRow = (rowId, patch) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  };

  const handleProjectChange = (projectId) => {
    const selectedProject = projects.find(
      (project) => project.id === projectId,
    );

    setHeader((prev) => ({
      ...prev,
      projectId,
      projectName: selectedProject?.name || "",
    }));
  };

  const handleDescriptionChange = (rowId, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const isDrawing = value === "Drawings (As Applicable)";

        return {
          ...row,
          descriptionOfDocument: value,

          // normal row fields should be cleared when Drawings is selected
          provided: isDrawing ? "" : row.provided,
          attachments: isDrawing ? [] : row.attachments,
          annexureNo: isDrawing ? "" : row.annexureNo,
          remark: isDrawing ? "" : row.remark,

          // Drawings row can have multiple child drawing points
          drawingItems: isDrawing
            ? row.drawingItems?.length
              ? row.drawingItems
              : [createDrawingItem()]
            : [],
        };
      }),
    );
  };

  const handleProvidedChange = (rowId, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          provided: value,
          attachments: value === "Yes" ? row.attachments : [],
        };
      }),
    );
  };

  const handleAttachmentChange = (rowId, files) => {
    const normalizedFiles = Array.isArray(files)
      ? files
      : Array.from(files || []);

    updateRow(rowId, {
      attachments: normalizedFiles,
    });
  };

  const handleAttachmentDelete = (rowId, indexToRemove) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          attachments: (row.attachments || []).filter(
            (_, index) => index !== indexToRemove,
          ),
        };
      }),
    );
  };

  const addDrawingItem = (rowId) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          drawingItems: [...(row.drawingItems || []), createDrawingItem()],
        };
      }),
    );
  };

  const deleteDrawingItem = (rowId, drawingItemId) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const nextItems = (row.drawingItems || []).filter(
          (item) => item.id !== drawingItemId,
        );

        return {
          ...row,
          drawingItems: nextItems.length ? nextItems : [createDrawingItem()],
        };
      }),
    );
  };

  const updateDrawingItem = (rowId, drawingItemId, patch) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          drawingItems: (row.drawingItems || []).map((item) =>
            item.id === drawingItemId ? { ...item, ...patch } : item,
          ),
        };
      }),
    );
  };

  const handleDrawingProvidedChange = (rowId, drawingItemId, value) => {
    updateDrawingItem(rowId, drawingItemId, {
      provided: value,
      attachments:
        value === "Yes"
          ? rows
              .find((row) => row.id === rowId)
              ?.drawingItems?.find((item) => item.id === drawingItemId)
              ?.attachments || []
          : [],
    });
  };

  const handleDrawingAttachmentChange = (rowId, drawingItemId, files) => {
    const normalizedFiles = Array.isArray(files)
      ? files
      : Array.from(files || []);

    updateDrawingItem(rowId, drawingItemId, {
      attachments: normalizedFiles,
    });
  };

  const handleDrawingAttachmentDelete = (
    rowId,
    drawingItemId,
    indexToRemove,
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          drawingItems: (row.drawingItems || []).map((item) => {
            if (item.id !== drawingItemId) return item;

            return {
              ...item,
              attachments: (item.attachments || []).filter(
                (_, index) => index !== indexToRemove,
              ),
            };
          }),
        };
      }),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createChecklistRow({ srNo: prev.length + 1 })]);
  };

  const deleteRow = (rowId) => {
    setRows((prev) => {
      if (prev.length === 1) {
        toast.error("At least one checklist row is required.");
        return prev;
      }

      return prev
        .filter((row) => row.id !== rowId)
        .map((row, index) => ({
          ...row,
          srNo: index + 1,
        }));
    });
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const providedYes = rows.filter((row) => row.provided === "Yes").length;
    const providedNo = rows.filter((row) => row.provided === "No").length;
    const pending = rows.filter((row) => !row.provided).length;

    return {
      total,
      providedYes,
      providedNo,
      pending,
    };
  }, [rows]);

  const handleSubmit = async () => {
    if (!header.projectName) {
      toast.error("Please select project.");
      return;
    }

    if (!header.date) {
      toast.error("Please select date.");
      return;
    }

    if (!header.contractorName.trim()) {
      toast.error("Please enter contractor name.");
      return;
    }

    if (!header.scopeOfWork.trim()) {
      toast.error("Please enter scope of work.");
      return;
    }

    if (!header.subSystemAssociatedEquipment.trim()) {
      toast.error("Please enter sub system / associated equipment.");
      return;
    }

    const incompleteNormalRow = rows.find((row) => {
      const isDrawing =
        row.descriptionOfDocument === "Drawings (As Applicable)";

      if (!row.descriptionOfDocument) return true;

      if (isDrawing) return false;

      return !row.provided;
    });

    if (incompleteNormalRow) {
      toast.error("Please fill Description of Document and Provided status.");
      return;
    }

    const incompleteDrawingRow = rows.find((row) => {
      if (row.descriptionOfDocument !== "Drawings (As Applicable)")
        return false;

      const drawingItems = row.drawingItems || [];

      if (drawingItems.length === 0) return true;

      return drawingItems.some((item) => !item.drawingType || !item.provided);
    });

    if (incompleteDrawingRow) {
      toast.error(
        "Please fill Drawing Type and Provided status for all drawing points.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        folderId,
        folderName,
        header,
        checklist: rows.map((row, index) => {
          const isDrawing =
            row.descriptionOfDocument === "Drawings (As Applicable)";

          return {
            srNo: index + 1,
            descriptionOfDocument: row.descriptionOfDocument,

            provided: isDrawing ? "" : row.provided,
            attachments: isDrawing ? [] : row.attachments || [],
            annexureNo: isDrawing ? "" : row.annexureNo,
            remark: isDrawing ? "" : row.remark,

            drawingItems: isDrawing
              ? (row.drawingItems || []).map((item, drawingIndex) => ({
                  srNo: drawingIndex + 1,
                  drawingType: item.drawingType,
                  provided: item.provided,
                  attachments: item.attachments || [],
                  annexureNo: item.annexureNo,
                  remark: item.remark,
                }))
              : [],
          };
        }),
      };

      console.log("Handing Over Document Checklist Payload:", payload);

      toast.success("Handing over document checklist submitted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit handing over document checklist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-gray-200 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Handing Over Document Checklist
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Fill package details and verify all handover documents before final
            submission.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Project
            </label>

            <select
              value={header.projectId}
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
              Date
            </label>

            <input
              type="date"
              value={header.date}
              onChange={(event) =>
                setHeader((prev) => ({
                  ...prev,
                  date: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Contractor Name
            </label>

            <input
              type="text"
              value={header.contractorName}
              onChange={(event) =>
                setHeader((prev) => ({
                  ...prev,
                  contractorName: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter contractor name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Scope of Work / Contract
            </label>

            <input
              type="text"
              value={header.scopeOfWork}
              onChange={(event) =>
                setHeader((prev) => ({
                  ...prev,
                  scopeOfWork: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter scope of work / contract"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sub System / Associated Equipment
            </label>

            <input
              type="text"
              value={header.subSystemAssociatedEquipment}
              onChange={(event) =>
                setHeader((prev) => ({
                  ...prev,
                  subSystemAssociatedEquipment: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter sub system / associated equipment"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Total Documents
            </div>
            <div className="mt-1 text-xl font-semibold text-gray-900">
              {stats.total}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Provided
            </div>
            <div className="mt-1 text-xl font-semibold text-green-600">
              {stats.providedYes}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Not Provided
            </div>
            <div className="mt-1 text-xl font-semibold text-red-600">
              {stats.providedNo}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pending
            </div>
            <div className="mt-1 text-xl font-semibold text-orange-600">
              {stats.pending}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Checklist</h3>

            <p className="mt-1 text-xs text-gray-500">
              Select document description, mark provided status and upload
              attachment only when Provided is Yes.
            </p>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-[7%] px-4 py-3 text-left font-semibold text-gray-600">
                  Sr. No.
                </th>

                <th className="w-[28%] px-4 py-3 text-left font-semibold text-gray-600">
                  Description of Document
                </th>

                <th className="w-[12%] px-4 py-3 text-left font-semibold text-gray-600">
                  Provided
                </th>

                <th className="w-[20%] px-4 py-3 text-left font-semibold text-gray-600">
                  Attachments
                </th>

                <th className="w-[12%] px-4 py-3 text-left font-semibold text-gray-600">
                  Annexure No.
                </th>

                <th className="w-[16%] px-4 py-3 text-left font-semibold text-gray-600">
                  Remark
                </th>

                <th className="w-[5%] px-4 py-3 text-left font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const isDrawing =
                  row.descriptionOfDocument === "Drawings (As Applicable)";
                const uploadEnabled = row.provided === "Yes";

                return (
                  <Fragment key={row.id}>
                    <tr className="border-b border-gray-100 align-top odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 text-gray-600">{index + 1}</td>

                      <td className="px-4 py-3">
                        <select
                          value={row.descriptionOfDocument}
                          onChange={(event) =>
                            handleDescriptionChange(row.id, event.target.value)
                          }
                          className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Select document</option>

                          {DOCUMENT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        {isDrawing ? (
                          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                            Managed in drawing points below
                          </div>
                        ) : (
                          <select
                            value={row.provided}
                            onChange={(event) =>
                              handleProvidedChange(row.id, event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">Select</option>

                            {PROVIDED_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isDrawing ? (
                          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                            Uploads added per drawing point
                          </div>
                        ) : uploadEnabled ? (
                          <FileUploadControl
                            files={row.attachments || []}
                            multiple
                            append
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            uploadLabel="Upload Attachment"
                            addMoreLabel="Add More"
                            onFilesChange={(files) =>
                              handleAttachmentChange(row.id, files)
                            }
                            onDelete={(indexToRemove) =>
                              handleAttachmentDelete(row.id, indexToRemove)
                            }
                          />
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
                            Select <span className="font-semibold">Yes</span> to
                            enable upload.
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isDrawing ? (
                          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                            Added per drawing point
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={row.annexureNo}
                            onChange={(event) =>
                              updateRow(row.id, {
                                annexureNo: event.target.value,
                              })
                            }
                            className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Annexure no."
                          />
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isDrawing ? (
                          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                            Remarks added per drawing point
                          </div>
                        ) : (
                          <textarea
                            value={row.remark}
                            onChange={(event) =>
                              updateRow(row.id, {
                                remark: event.target.value,
                              })
                            }
                            rows={2}
                            className="min-h-[70px] w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter remark"
                          />
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => deleteRow(row.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          title="Delete row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>

                    {isDrawing && (
                      <tr className="border-b border-orange-100 bg-orange-50/40">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex flex-col gap-2 border-b border-orange-100 pb-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">
                                  Drawing Points
                                </h4>
                                <p className="mt-1 text-xs text-gray-500">
                                  Add one or more drawing points under Drawings.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => addDrawingItem(row.id)}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                              >
                                <Plus className="h-4 w-4" />
                                Add Drawing Point
                              </button>
                            </div>

                            <div className="space-y-3">
                              {(row.drawingItems || []).map(
                                (item, drawingIndex) => {
                                  const drawingUploadEnabled =
                                    item.provided === "Yes";

                                  return (
                                    <div
                                      key={item.id}
                                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                                    >
                                      <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className="text-sm font-semibold text-gray-800">
                                          Drawing Point {drawingIndex + 1}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            deleteDrawingItem(row.id, item.id)
                                          }
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                          title="Delete drawing point"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                                        <div>
                                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Drawing Type
                                          </label>

                                          <select
                                            value={item.drawingType}
                                            onChange={(event) =>
                                              updateDrawingItem(
                                                row.id,
                                                item.id,
                                                {
                                                  drawingType:
                                                    event.target.value,
                                                },
                                              )
                                            }
                                            className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                          >
                                            <option value="">
                                              Select drawing type
                                            </option>

                                            {DRAWING_OPTIONS.map((option) => (
                                              <option
                                                key={option}
                                                value={option}
                                              >
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        <div>
                                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Provided
                                          </label>

                                          <select
                                            value={item.provided}
                                            onChange={(event) =>
                                              handleDrawingProvidedChange(
                                                row.id,
                                                item.id,
                                                event.target.value,
                                              )
                                            }
                                            className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                          >
                                            <option value="">Select</option>

                                            {PROVIDED_OPTIONS.map((option) => (
                                              <option
                                                key={option}
                                                value={option}
                                              >
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        <div>
                                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Attachments
                                          </label>

                                          {drawingUploadEnabled ? (
                                            <FileUploadControl
                                              files={item.attachments || []}
                                              multiple
                                              append
                                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                              uploadLabel="Upload"
                                              addMoreLabel="Add More"
                                              onFilesChange={(files) =>
                                                handleDrawingAttachmentChange(
                                                  row.id,
                                                  item.id,
                                                  files,
                                                )
                                              }
                                              onDelete={(indexToRemove) =>
                                                handleDrawingAttachmentDelete(
                                                  row.id,
                                                  item.id,
                                                  indexToRemove,
                                                )
                                              }
                                            />
                                          ) : (
                                            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-center text-xs text-gray-500">
                                              Select Yes to upload.
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Annexure No.
                                          </label>

                                          <input
                                            type="text"
                                            value={item.annexureNo}
                                            onChange={(event) =>
                                              updateDrawingItem(
                                                row.id,
                                                item.id,
                                                {
                                                  annexureNo:
                                                    event.target.value,
                                                },
                                              )
                                            }
                                            className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Annexure no."
                                          />
                                        </div>

                                        <div>
                                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Remark
                                          </label>

                                          <textarea
                                            value={item.remark}
                                            onChange={(event) =>
                                              updateDrawingItem(
                                                row.id,
                                                item.id,
                                                {
                                                  remark: event.target.value,
                                                },
                                              )
                                            }
                                            rows={2}
                                            className="min-h-[70px] w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Remark"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
