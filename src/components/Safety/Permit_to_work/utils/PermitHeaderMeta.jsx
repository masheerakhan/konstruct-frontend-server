import React, { useEffect, useState } from "react";
import { getProjectDetailsById } from "../../../../api";

const HEADER_FIELD_CONFIG = [
  { flag: "show_format_no", label: "Format No." },
  { flag: "show_revision", label: "Revision No." },
  { flag: "show_issued_date", label: "Issued Date" },
  { flag: "show_ref_no", label: "Ref No." },
  { flag: "show_project", label: "Project" },
  { flag: "show_ptw_no", label: "PTW No." },
];

export default function PermitHeaderMeta({
  headerConfig = {},
  formatNo = "",
  refNo = "",
  issuedDateText = "",
  revisionNo = "",
  projectId = null,
  permitId = null,
  ptwNo = "",
  title = "Permit Details",
  description = "Review the permit header details below. These details will be included in the permit report.",
}) {
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (headerConfig?.show_project && projectId) {
      getProjectDetailsById(projectId)
        .then((res) => {
          if (cancelled) return;

          const data = res?.data;

          const name =
            data?.name ||
            data?.project_name ||
            data?.projectName ||
            data?.title ||
            data?.data?.name ||
            data?.data?.project_name ||
            data?.results?.find?.((p) => String(p.id) === String(projectId))?.name ||
            data?.results?.find?.((p) => String(p.id) === String(projectId))?.project_name ||
            `Project ${projectId}`;

          setProjectName(name);
        })
        .catch(() => {
          if (!cancelled) setProjectName(`Project ${projectId}`);
        });
    } else {
      setProjectName("");
    }

    return () => {
      cancelled = true;
    };
  }, [headerConfig?.show_project, projectId]);

  const hasAnyFlag = HEADER_FIELD_CONFIG.some((f) => headerConfig?.[f.flag]);
  if (!hasAnyFlag) return null;

  const valueFor = (flag) => {
    switch (flag) {
      case "show_project":
        return projectId ? projectName || "Loading..." : "—";

      case "show_ptw_no":
        return ptwNo || (permitId ? `PTW-${permitId}` : "To be generated after template selection");

      case "show_format_no":
        return formatNo || "—";

      case "show_ref_no":
        return refNo || "—";

      case "show_revision":
        return revisionNo || "—";

      case "show_issued_date":
        return issuedDateText || "—";

      default:
        return "—";
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        {description && (
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HEADER_FIELD_CONFIG.filter((f) => headerConfig?.[f.flag]).map((f) => {
          const value = valueFor(f.flag);
          const isEmpty = value === "—";

          return (
            <div
              key={f.flag}
              className="min-h-[60px] rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 overflow-hidden"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {f.label}
              </p>

              <p
                className={`mt-1.5 text-xs sm:text-sm font-semibold break-words ${isEmpty ? "text-slate-400" : "text-slate-900"
                  }`}
              >
                {value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}