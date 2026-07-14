import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import FileUpload from "../FileUpload";
import PermitSignatureModal from "../Safety/Permit_to_work/utils/PermitSignatureModal";
import { ArrowLeft, Save, Send, ShieldAlert } from "lucide-react";
import { createNCR } from "../../services/ncrService";
import {
  getProjectsForCurrentUser,
  fetchTowersByProject,
  getProjectMakersForNCR,
} from "../../api";

export default function NCRCreatePage() {
  const navigate = useNavigate();

  let roleStr = localStorage.getItem("ROLE") || "";
  if (!roleStr) {
    try {
      const raw = localStorage.getItem("USER_DATA");
      if (raw) {
        const data = JSON.parse(raw);
        roleStr = data?.role || data?.roles?.[0] || "";
      }
    } catch (e) {}
  }
  const isMaker = (roleStr || "").toLowerCase().includes("maker");

  // Mock user and data
  const user = { name: "Current User" };

  const [projects, setProjects] = useState([]);
  const [towers, setTowers] = useState([]);

  const [projectsLoading, setProjectsLoading] = useState(false);
  const [towersLoading, setTowersLoading] = useState(false);

  const [makers, setMakers] = useState([]);
  const [makersLoading, setMakersLoading] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [signature, setSignature] = useState("");
  const [showSigModal, setShowSigModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState({
    doc_no: "",
    date: new Date().toISOString().slice(0, 10),
    related_to: "",
    classification: "major",
    identification: "",
    tower_id: "",
    project_id: "",
    root_cause: "",
    correction: "",
    corrective_action: "",
    preventive_action: "",
    follow_up_responsibility: "",
    verification_responsibility: "",
    assigned_to: "",
    target_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setProjectsLoading(true);

      try {
        const res = await getProjectsForCurrentUser();
        const list = unwrapList(res).map(normalizeProject);

        if (isMounted) {
          setProjects(list);
        }
      } catch (error) {
        console.error("Failed to load projects", error);
        toast.error("Failed to load projects");
      } finally {
        if (isMounted) {
          setProjectsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTowers = async () => {
      if (!values.project_id) {
        setTowers([]);
        return;
      }

      setTowersLoading(true);

      try {
        const res = await fetchTowersByProject(values.project_id);
        const list = unwrapList(res).map(normalizeTower);

        if (isMounted) {
          setTowers(list);
        }
      } catch (error) {
        console.error("Failed to load towers", error);
        toast.error("Failed to load towers");
        if (isMounted) {
          setTowers([]);
        }
      } finally {
        if (isMounted) {
          setTowersLoading(false);
        }
      }
    };

    loadTowers();

    return () => {
      isMounted = false;
    };
  }, [values.project_id]);

  useEffect(() => {
    let isMounted = true;

    const loadMakers = async () => {
      if (!values.project_id) {
        setMakers([]);
        return;
      }

      setMakersLoading(true);

      try {
        const res = await getProjectMakersForNCR(values.project_id);

        const list = unwrapList(res)
          .filter(isMakerAccess)
          .map(normalizeMaker)
          .filter((maker) => maker.id);

        const uniqueMakers = Array.from(
          new Map(list.map((maker) => [String(maker.id), maker])).values(),
        );

        if (isMounted) {
          setMakers(uniqueMakers);
        }
      } catch (error) {
        console.error("Failed to load makers", error);
        toast.error("Failed to load makers for selected project");

        if (isMounted) {
          setMakers([]);
        }
      } finally {
        if (isMounted) {
          setMakersLoading(false);
        }
      }
    };

    loadMakers();

    return () => {
      isMounted = false;
    };
  }, [values.project_id]);

  if (isMaker) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 text-center py-24">
        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-display font-semibold text-slate-900">
          Access Denied
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Makers cannot create new Non-Conformity Reports.
        </p>
        <button
          className="mt-4 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setValues((prev) => {
      if (name === "project_id") {
        return {
          ...prev,
          project_id: value,
          tower_id: "",
          assigned_to: "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const formatDateForApi = (dateValue) => {
    if (!dateValue) return "";

    // input type="date" gives YYYY-MM-DD
    const [year, month, day] = dateValue.split("-");

    if (!year || !month || !day) return dateValue;

    return `${day}-${month}-${year}`;
  };

  const submitNCR = async (draft, signatureOverride = null) => {
    const finalSignature = signatureOverride || signature;

    if (!draft && !finalSignature) {
      setShowSigModal(true);
      return;
    }

    // Basic manual validation matching standard HTML required attributes
    if (!draft) {
      const requiredFields = [
        "related_to",
        "identification",
        "tower_id",
        "root_cause",
        "correction",
        "corrective_action",
        "follow_up_responsibility",
        "verification_responsibility",
        "assigned_to",
        "target_date",
      ];
      const missing = requiredFields.filter(
        (f) => !values[f] || values[f].trim() === "",
      );
      if (missing.length > 0) {
        toast.error("Please fill in all required fields.");
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();

      // Send current date as requested
      fd.append("date", new Date().toISOString().slice(0, 10));

      fd.append("project_id", values.project_id);
      const selectedProject = projects.find(
        (p) => String(p.id) === String(values.project_id),
      );

      fd.append("project_name", selectedProject?.name || "Unknown Project");

      const selectedTower = towers.find(
        (t) => String(t.id) === String(values.tower_id),
      );

      if (values.tower_id) {
        fd.append("tower_id", values.tower_id);
        fd.append("tower_name", selectedTower?.name || "Unknown Tower");
      }

      const selectedMaker = makers.find(
        (m) => String(m.id) === String(values.assigned_to),
      );

      const assignedMakers = [
        {
          maker_id: Number(values.assigned_to),
          maker_name: selectedMaker?.name || "Unknown Maker",
          maker_role: "maker",
        },
      ];

      fd.append("assigned_makers", JSON.stringify(assignedMakers));

      fd.append("non_conformity_related_to", values.related_to);
      fd.append("identification_of_non_conformance", values.identification);
      fd.append("classification", values.classification);
      fd.append("root_cause_analysis", values.root_cause);
      fd.append("correction", values.correction);
      fd.append("corrective_action", values.corrective_action);
      if (values.preventive_action)
        fd.append("preventive_action", values.preventive_action);
      fd.append("follow_up_responsibility", values.follow_up_responsibility);
      fd.append(
        "verification_responsibility",
        values.verification_responsibility,
      );
      fd.append(
        "target_date_of_compliance",
        formatDateForApi(values.target_date),
      );

      const dataUrlToFile = (dataUrl, filename) => {
        const arr = dataUrl.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      };

      if (finalSignature) {
        fd.append(
          "checker_signature",
          dataUrlToFile(finalSignature, "checker_signature.png"),
        );
      }

      if (!draft) {
        const mName =
          makers.find((m) => String(m.id) === String(values.assigned_to))
            ?.name || "Unknown";
        const assignedMakers = [
          {
            maker_id: parseInt(values.assigned_to, 10) || 0,
            maker_name: mName,
            maker_role: "maker",
          },
        ];
        fd.append("assigned_makers", JSON.stringify(assignedMakers));
      }

      attachments.forEach((att) => {
        if (att.file) {
          fd.append("identification_images", att.file);
        }
      });

      const res = await createNCR(fd);

      toast.success(draft ? "Draft saved" : "NCR submitted for approval");
      navigate(`/ncr/${res?.data?.id || res?.id || ""}`);
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during submission");
    } finally {
      setSaving(false);
    }
  };

  const onSaveDraft = () => submitNCR(true);

  const onSubmitForm = (e) => {
    e.preventDefault(); // Prevent standard form submission
    if (!signature) {
      setShowSigModal(true);
      return;
    }
    submitNCR(false);
  };

  const handleSignatureSuccess = async (dataUrl) => {
    setSignature(dataUrl);
    setShowSigModal(false);
    submitNCR(false, dataUrl);
  };

  const unwrapList = (res) => {
    const data = res?.data ?? res;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.projects)) return data.projects;
    if (Array.isArray(data?.buildings)) return data.buildings;

    return [];
  };

  const normalizeProject = (project) => ({
    id: project.id ?? project.project_id,
    name:
      project.name ??
      project.project_name ??
      project.title ??
      `Project ${project.id ?? project.project_id}`,
  });

  const normalizeTower = (tower) => ({
    id: tower.id ?? tower.building_id ?? tower.tower_id,
    name:
      tower.name ??
      tower.building_name ??
      tower.tower_name ??
      `Tower ${tower.id ?? tower.building_id ?? tower.tower_id}`,
  });

  const normalizeRole = (role) =>
    String(role || "")
      .trim()
      .toLowerCase()
      .replaceAll("-", "_")
      .replaceAll(" ", "_");

  const extractRoles = (item) => {
    const roles = [];

    [
      item?.role,
      item?.role_name,
      item?.user_role,
      item?.active_role,
      item?.code,
      item?.name,
    ].forEach((role) => {
      if (role) roles.push(normalizeRole(role));
    });

    const nestedRoles =
      item?.roles ||
      item?.user_roles ||
      item?.access_roles ||
      item?.user_access_roles ||
      [];

    if (Array.isArray(nestedRoles)) {
      nestedRoles.forEach((roleObj) => {
        if (typeof roleObj === "string") {
          roles.push(normalizeRole(roleObj));
        } else if (roleObj && typeof roleObj === "object") {
          [
            roleObj?.role,
            roleObj?.role_name,
            roleObj?.name,
            roleObj?.code,
          ].forEach((role) => {
            if (role) roles.push(normalizeRole(role));
          });
        }
      });
    }

    return roles;
  };

  const isMakerAccess = (item) => {
    const roles = extractRoles(item);

    if (roles.includes("maker")) return true;

    const roleText = String(
      item?.role ||
        item?.role_name ||
        item?.user_role ||
        item?.active_role ||
        item?.designation ||
        "",
    )
      .toLowerCase()
      .replaceAll("-", "_")
      .replaceAll(" ", "_");

    return roleText.includes("maker");
  };

  const normalizeMaker = (item) => {
    const userObj = item?.user || item?.user_details || item?.employee || item;

    const id =
      item?.user_id ??
      item?.maker_id ??
      userObj?.id ??
      userObj?.user_id ??
      item?.id;

    const firstName = userObj?.first_name ?? item?.first_name ?? "";

    const lastName = userObj?.last_name ?? item?.last_name ?? "";

    const fullName = `${firstName} ${lastName}`.trim();

    const name =
      userObj?.full_name ||
      userObj?.name ||
      item?.user_name ||
      item?.maker_name ||
      item?.name ||
      fullName ||
      userObj?.username ||
      item?.username ||
      `User ${id}`;

    const designation =
      item?.designation || item?.role_name || item?.role || "Maker";

    return {
      id,
      name,
      designation,
      role: "maker",
    };
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-2"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1
            className="text-3xl font-display font-bold tracking-tight text-slate-900"
            data-testid="ncr-create-title"
          >
            Create Non-Conformity Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete all sections and submit for Project Head approval
          </p>
        </div>
      </div>

      <form id="ncr-form" className="space-y-6" onSubmit={onSubmitForm}>
        {/* Section A */}
        <Section title="A. Basic Information" step="A">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Non-Conformity Related To"
              required
              testId="field-related-to"
            >
              <input
                type="text"
                name="related_to"
                value={values.related_to}
                onChange={handleChange}
                placeholder="e.g. Concrete Work, Safety, Material Inspection"
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                required
                data-testid="input-related-to"
              />
            </Field>
            <Field
              label="Classification"
              required
              testId="field-classification"
            >
              <div className="flex gap-6 pt-2">
                <label
                  className="flex items-center gap-2 cursor-pointer group"
                  data-testid="radio-major"
                >
                  <input
                    type="radio"
                    name="classification"
                    value="major"
                    checked={values.classification === "major"}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-red-600 font-medium">Major</span>
                </label>
                <label
                  className="flex items-center gap-2 cursor-pointer group"
                  data-testid="radio-minor"
                >
                  <input
                    type="radio"
                    name="classification"
                    value="minor"
                    checked={values.classification === "minor"}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-green-600 font-medium">Minor</span>
                </label>
              </div>
            </Field>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Project" required testId="field-project">
                <select
                  name="project_id"
                  value={values.project_id}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={projectsLoading}
                  data-testid="select-project"
                >
                  <option value="">
                    {projectsLoading ? "Loading projects..." : "Select project"}
                  </option>

                  {(projects || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tower" required testId="field-tower">
                <select
                  name="tower_id"
                  value={values.tower_id}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={!values.project_id || towersLoading}
                  data-testid="select-tower"
                >
                  <option value="">
                    {!values.project_id
                      ? "Select project first"
                      : towersLoading
                        ? "Loading towers..."
                        : "Select tower"}
                  </option>

                  {(towers || []).map((tower) => (
                    <option key={tower.id} value={tower.id}>
                      {tower.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              label="Identification of Non-Conformance"
              required
              testId="field-identification"
              className="md:col-span-2"
            >
              <textarea
                rows={3}
                name="identification"
                value={values.identification}
                onChange={handleChange}
                placeholder="Describe the non-conformance in detail"
                className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                required
                data-testid="input-identification"
              />
            </Field>
          </div>
        </Section>

        {/* Section B */}
        <Section title="B. Root Cause Analysis" step="B">
          <Field label="Root Cause Analysis" required testId="field-root-cause">
            <NumberedTextArea
              rows={4}
              name="root_cause"
              value={values.root_cause}
              onChange={handleChange}
              placeholder="Explain the root cause"
              required
              testId="input-root-cause"
            />
          </Field>
          <div className="mt-6">
            <Field
              label="Attachments (Photos / PDF)"
              testId="field-attachments"
            >
              <FileUpload
                value={attachments}
                onChange={setAttachments}
                testId="attach-upload"
              />
            </Field>
          </div>
        </Section>

        {/* Section C */}
        <Section title="C. Correction Details" step="C">
          <div className="grid grid-cols-1 gap-6">
            <Field label="Correction" required testId="field-correction">
              <textarea
                rows={3}
                name="correction"
                value={values.correction}
                onChange={handleChange}
                placeholder="Immediate correction taken"
                className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                required
                data-testid="input-correction"
              />
            </Field>
            <Field
              label="Corrective Action"
              required
              testId="field-corrective-action"
            >
              <NumberedTextArea
                rows={3}
                name="corrective_action"
                value={values.corrective_action}
                onChange={handleChange}
                required
                testId="input-corrective-action"
              />
            </Field>
            <Field label="Preventive Action" testId="field-preventive-action">
              <NumberedTextArea
                rows={3}
                name="preventive_action"
                value={values.preventive_action}
                onChange={handleChange}
                testId="input-preventive-action"
              />
            </Field>
          </div>
        </Section>

        {/* Section D */}
        <Section title="D. Responsibility & Assignment" step="D">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Follow-up Responsibility"
              required
              testId="field-followup"
            >
              <input
                type="text"
                name="follow_up_responsibility"
                value={values.follow_up_responsibility}
                onChange={handleChange}
                placeholder="e.g. Site Engineer"
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                required
                data-testid="input-followup"
              />
            </Field>
            <Field
              label="Verification Responsibility"
              required
              testId="field-verification"
            >
              <input
                type="text"
                name="verification_responsibility"
                value={values.verification_responsibility}
                onChange={handleChange}
                placeholder="e.g. QA/QC Engineer"
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                required
                data-testid="input-verification"
              />
            </Field>
            <Field label="Assign to (Maker)" required testId="field-assignee">
              <select
                name="assigned_to"
                value={values.assigned_to}
                onChange={handleChange}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={!values.project_id || makersLoading}
                data-testid="select-assignee"
              >
                <option value="">
                  {!values.project_id
                    ? "Select project first"
                    : makersLoading
                      ? "Loading makers..."
                      : makers.length === 0
                        ? "No makers found for this project"
                        : "Select Maker"}
                </option>

                {(makers || []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.designation || "Maker"}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Target Date of Compliance"
              required
              testId="field-target-date"
            >
              <input
                type="date"
                name="target_date"
                value={values.target_date}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 10)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                required
                data-testid="input-target-date"
              />
            </Field>
          </div>
        </Section>

        {/* Section E */}
        {/* <Section title="E. Submission" step="E">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Submitted By" testId="field-submitted-by">
                                <input type="text" disabled value={user?.name || ""} className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-slate-500" />
                            </Field>
                            <Field label="Submitted Date" testId="field-submitted-date">
                                <input type="text" disabled value={new Date().toLocaleString("en-GB")} className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-slate-500" />
                            </Field>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 mb-2">
                                    Digital Signature <span className="text-red-500">*</span>
                                </label>
                                <SignaturePadInput value={signature} onChange={setSignature} testId="creator-signature" />
                            </div>
                        </div>
                    </Section> */}
        <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-10 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="save-draft-btn"
          >
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="submit-ncr-btn"
          >
            <Send className="w-4 h-4 mr-2" /> Submit
          </button>
        </div>
      </form>

      <PermitSignatureModal
        isOpen={showSigModal}
        onClose={() => setShowSigModal(false)}
        onSignatureSuccess={handleSignatureSuccess}
        actionTitle="Submit NCR"
      />
    </div>
  );
}

function Section({ title, step, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="w-8 h-8 rounded-md bg-blue-600 text-white font-display font-bold text-sm flex items-center justify-center">
          {step}
        </div>
        <div className="text-sm font-semibold text-slate-900 font-display">
          {title}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, required, testId, children, className = "" }) {
  return (
    <div className={className} data-testid={testId}>
      <label
        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2 ${required ? "flex items-center gap-1" : ""}`}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function NumberedTextArea({
  name,
  value,
  onChange,
  placeholder,
  required,
  rows = 3,
  className = "",
  testId,
}) {
  const textareaRef = React.useRef(null);

  const onValChange = (e) => {
    let val = e.target.value;
    if (val.length === 1 && value === "") {
      val = "1. " + val;
    }
    onChange({ target: { name, value: val } });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value;

      const textBefore = val.substring(0, start);
      const textAfter = val.substring(end);

      const lines = textBefore.split("\n");
      const nextNum = lines.length + 1;
      const insertText = `\n${nextNum}. `;

      const newValue = textBefore + insertText + textAfter;

      onChange({ target: { name, value: newValue } });

      setTimeout(() => {
        if (el) {
          el.selectionStart = el.selectionEnd = start + insertText.length;
        }
      }, 0);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      name={name}
      value={value}
      onChange={onValChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      required={required}
      data-testid={testId}
    />
  );
}
