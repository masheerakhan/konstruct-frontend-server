import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  UserRound,
  Eye,
  Signature,
} from "lucide-react";

// import { getSafetyChecklist } from "../../../../../services/checklist";
import { getSafetyChecklist } from "../../../api";
import { resolveMediaUrl } from "./Safety_User_View/Checklist_Dashboard/Makerdashboard";

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} · ${timePart}`;
};

const getAnswerBadgeClass = (answer) => {
  const value = String(answer || "").toUpperCase();

  if (value === "YES") {
    return "border-green-500 bg-green-100 text-green-700";
  }

  if (value === "NO") {
    return "border-red-500 bg-red-100 text-red-700";
  }

  if (value === "NA") {
    return "border-yellow-500 bg-yellow-100 text-yellow-700";
  }

  return "border-border bg-muted text-foreground";
};

const getQuestionStatus = (sub, pendingStatusLabel) => {
  const status = String(sub?.status || "").toLowerCase();

  if (status.includes("reject") || sub?.checker_action === "REJECTED") {
    return "rejected";
  }

  if (status === "completed" || status === "approved") {
    return "approved";
  }

  return pendingStatusLabel === "Pending for Rectification"
    ? "pending_rectification"
    : "pending_review";
};

const QuestionStatusBadge = ({ sub, pendingStatusLabel }) => {
  const status = getQuestionStatus(sub, pendingStatusLabel);

  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }

  if (status === "pending_rectification") {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
        Pending for Rectification
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-500">
      Pending for Review
    </span>
  );
};

const LEGACY_READONLY_HEADER_FIELDS = [
  { key: "format_no", label: "Format No.", order_index: 1 },
  { key: "revision_no", label: "Revision No.", order_index: 2 },
  { key: "issued_date", label: "Issued Date", order_index: 3 },
  { key: "revision_date", label: "Revision Date", order_index: 4 },
  { key: "project", label: "Project", order_index: 5 },
  {
    key: "inspection_report_no",
    label: "Inspection Report No.",
    order_index: 6,
  },
  { key: "name_of_contractor", label: "Name of Contractor", order_index: 7 },
  { key: "date_of_inspection", label: "Date of Inspection", order_index: 8 },
  { key: "make_model", label: "Make / Model", order_index: 9 },
  { key: "identification_no", label: "Identification No.", order_index: 10 },
  { key: "location", label: "Location", order_index: 11 },
  { key: "name_of_operator", label: "Name of Operator", order_index: 12 },
];

const sortReadonlyHeaderFields = (fields = []) =>
  [...fields].sort(
    (a, b) =>
      Number(a.row_index || 0) - Number(b.row_index || 0) ||
      Number(a.column_index || 0) - Number(b.column_index || 0) ||
      Number(a.order_index || 0) - Number(b.order_index || 0),
  );

const getReadonlyHeaderFields = (detail) => {
  /*
        New dynamic checklist response.
        Backend already resolves:
        - fixed template values
        - Maker-entered values
        - generated report number
        - inspection date
        - project/context values
    */
  const dynamicFields = Array.isArray(detail?.report_header_fields)
    ? detail.report_header_fields
    : [];

  if (dynamicFields.length > 0) {
    return sortReadonlyHeaderFields(
      dynamicFields.filter((field) => field.visible_in_preview !== false),
    );
  }

  /*
        Backward compatibility for old checklists that were created
        before dynamic header fields were implemented.
    */
  const legacyMeta =
    detail?.report_header_meta ||
    detail?.safety_report_meta ||
    detail?.report_meta ||
    {};

  return LEGACY_READONLY_HEADER_FIELDS.map((field) => ({
    ...field,
    value: legacyMeta[field.key] || "",
    visible_in_preview: true,
  }));
};

const ReadonlyInfoValue = ({ label, value }) => (
  <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>

    <p className="mt-1 break-words text-sm font-semibold text-foreground">
      {String(value ?? "").trim() || "—"}
    </p>
  </div>
);

const ReadonlyInfoCard = ({ detail }) => {
  const fields = getReadonlyHeaderFields(detail);

  if (!fields.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">
          Checklist Information
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          Read-only checklist information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <ReadonlyInfoValue
            key={field.key}
            label={field.label}
            value={field.value ?? field.default_value ?? ""}
          />
        ))}
      </div>
    </div>
  );
};

const getLatestCheckerIdFromSubmissions = (detail) => {
  for (const item of detail?.items || []) {
    for (const sub of item?.submissions || []) {
      if (sub?.checker_id) {
        return `User ${sub.checker_id}`;
      }
    }
  }

  return "";
};

const getLatestNameFromSubmissions = (detail, keys = []) => {
  for (const item of detail?.items || []) {
    for (const sub of item?.submissions || []) {
      for (const key of keys) {
        const value = String(sub?.[key] || "").trim();

        if (value) {
          return value;
        }
      }
    }
  }

  return "";
};

const getLatestSignatureFromDetail = (detail, role) => {
  if (!detail) return "";

  if (role === "maker") {
    return (
      detail.latest_maker_signature ||
      detail.maker_signature ||
      detail.maker_signature_url ||
      detail.maker_signature_file ||
      detail.created_by_signature ||
      ""
    );
  }

  if (role === "checker") {
    return (
      detail.latest_checker_signature ||
      detail.checker_signature ||
      detail.checker_signature_url ||
      detail.checker_signature_file ||
      detail.verified_by_signature ||
      ""
    );
  }

  return "";
};

const getSignOffUsers = (detail) => {
  const makerName =
    detail?.maker_name ||
    detail?.created_by_name ||
    detail?.created_by ||
    getLatestNameFromSubmissions(detail, [
      "latest_maker_name",
      "maker_name",
      "created_by_name",
    ]) ||
    "Maker";

  const checkerName =
    detail?.checker_name ||
    detail?.verified_by_name ||
    detail?.approved_by_name ||
    getLatestNameFromSubmissions(detail, [
      "latest_checker_name",
      "checker_name",
      "approved_by_name",
    ]) ||
    getLatestCheckerIdFromSubmissions(detail) ||
    "Checker";

  return {
    maker: {
      role: "maker",
      label: "Checked by",
      name: makerName,
      designation: "",
      signature: getLatestSignatureFromDetail(detail, "maker"),
    },
    checker: {
      role: "checker",
      label: "Verified by",
      name: checkerName,
      designation: "",
      signature: getLatestSignatureFromDetail(detail, "checker"),
    },
  };
};

const SignatureViewModal = ({ open, onClose, user }) => {
  if (!open || !user) return null;

  const signatureUrl = resolveMediaUrl(user.signature);

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              {user.label}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {user.name}{" "}
              <span className="font-medium">({user.designation})</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {signatureUrl ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <img
                src={signatureUrl}
                alt={`${user.designation} signature`}
                className="mx-auto max-h-72 w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
              <Signature className="mb-2 h-8 w-8 text-muted-foreground" />

              <p className="text-sm font-semibold text-foreground">
                No signature available
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Latest signature was not found for this user.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SignOffRow = ({ user, onView }) => {
  const hasSignature = Boolean(String(user?.signature || "").trim());

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {user.label}
          </p>

          <p className="text-sm font-bold text-foreground">{user.name} </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onView(user)}
        disabled={!hasSignature}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
          hasSignature
            ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "cursor-not-allowed border border-border bg-muted text-muted-foreground"
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
        View
      </button>
    </div>
  );
};

const SignOffSection = ({ detail, onViewSignature }) => {
  const users = getSignOffUsers(detail);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">Sign Off</h3>

        <p className="mt-1 text-xs text-muted-foreground">
          Latest checklist signatures from Maker and Checker.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SignOffRow user={users.maker} onView={onViewSignature} />

        <SignOffRow user={users.checker} onView={onViewSignature} />
      </div>
    </div>
  );
};

const ReadonlyQuestionCard = ({ item, sub: passedSub, idx, pendingStatusLabel }) => {
  const sub = passedSub || item?.submissions?.[0];

  if (!sub) return null;

  const answer = sub?.latest_maker_answer || sub?.answer || "";
  const makerComment = sub?.latest_maker_remarks || sub?.maker_remarks || "";

  const checkerComment =
    sub?.latest_checker_remarks ||
    sub?.latest_checker_reject_remarks ||
    sub?.checker_remarks ||
    "";

  const makerPhoto =
    sub?.latest_maker_photo_url ||
    sub?.maker_photo_url ||
    sub?.photo_url ||
    sub?.image ||
    sub?.image_url ||
    sub?.media?.[0]?.file ||
    sub?.media?.[0]?.url ||
    "";

  const checkerPhoto =
    sub?.latest_checker_photo_url ||
    sub?.checker_photo_url ||
    sub?.checker_image ||
    sub?.review_image ||
    sub?.objection_image ||
    "";

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        sub?.is_resubmitted
          ? "border-yellow-300 bg-yellow-50/60"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
              {idx + 1}
            </span>

            <QuestionStatusBadge
              sub={sub}
              pendingStatusLabel={pendingStatusLabel}
            />

            {sub?.is_resubmitted && (
              <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                Re-submitted by {sub?.latest_maker_name || "Maker"}
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold leading-relaxed text-foreground sm:text-base">
            {item?.title}
          </h3>
        </div>

        {item?.description && (
          <p className="mt-2 text-xs text-gray-500 italic">
            {item.description}
          </p>
        )}

        {item?.reference_image_url && (
          <div className="mt-3 mb-2">
            <img
              src={item.reference_image_url}
              alt="Reference"
              className="max-h-32 object-contain rounded border shadow-sm cursor-pointer"
              onClick={() => window.open(item.reference_image_url, "_blank")}
            />
          </div>
        )}

        <div className="text-right text-xs text-muted-foreground">
          {formatDateTime(sub?.updated_at || sub?.created_at)}
        </div>
      </div>

      {/* OPTIONS */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(item?.options || ["YES", "NO", "NA"]).map((opt) => {
          const selected =
            String(answer || "").toUpperCase() === String(opt).toUpperCase();

          return (
            <div
              key={opt}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                selected
                  ? getAnswerBadgeClass(opt)
                  : "border-border bg-muted/40 text-muted-foreground"
              }`}
            >
              {opt}
            </div>
          );
        })}
      </div>

      {/* MAKER COMMENT */}
      {makerComment && (
        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Maker Comment
          </p>

          <p className="whitespace-pre-wrap text-sm text-foreground">
            {makerComment}
          </p>
        </div>
      )}

      {/* CHECKER COMMENT */}
      {checkerComment && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">
            Checker Comment
          </p>

          <p className="whitespace-pre-wrap text-sm text-red-800">
            {checkerComment}
          </p>
        </div>
      )}

      {/* IMAGES */}
      {(makerPhoto || checkerPhoto) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {makerPhoto && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />

                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Maker Image
                </p>
              </div>

              {makerPhoto ? (
                <img
                  src={resolveMediaUrl(makerPhoto)}
                  alt="Maker Upload"
                  className="h-52 w-full rounded-xl border border-border object-cover"
                />
              ) : (
                <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                  No image available
                </div>
              )}
            </div>
          )}

          {checkerPhoto && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-red-500" />

                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Checker Objection Image
                </p>
              </div>

              {checkerPhoto ? (
                <img
                  src={resolveMediaUrl(checkerPhoto)}
                  alt="Checker Upload"
                  className="h-52 w-full rounded-xl border border-red-200 object-cover"
                />
              ) : (
                <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                  No image available
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function SafetyChecklistReadonlyModal({
  open,
  onClose,
  checklistId,
  pendingStatusLabel = "Pending for Review",
}) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [signatureUser, setSignatureUser] = useState(null);

  useEffect(() => {
    if (!open || !checklistId) {
      setDetail(null);
      setSignatureUser(null);
      return;
    }

    let mounted = true;

    const loadChecklist = async () => {
      try {
        setLoading(true);
        setDetail(null);
        setSignatureUser(null);

        const res = await getSafetyChecklist(checklistId);

        if (!mounted) return;

        setDetail(res?.data || null);
      } catch (err) {
        console.error("Failed to load checklist detail", err);

        if (mounted) {
          setDetail(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadChecklist();

    return () => {
      mounted = false;
    };
  }, [open, checklistId]);

  const questionsAndSubs = useMemo(() => {
    return (detail?.items || []).flatMap((item) => {
      const subs = item.submissions || [];
      if (subs.length === 0) return [{ item, sub: null }];
      return subs.map((sub) => ({ item, sub }));
    });
  }, [detail]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[201] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Read Only View
              </span>

              {/* {detail?.status && (
                                <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                    {detail.status}
                                </span>
                            )} */}
            </div>

            <h2 className="text-xl font-bold text-foreground">
              {detail?.name || "Checklist Preview"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current checklist state preview
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-background p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-muted-foreground">
                Loading checklist...
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* INFO CARD */}
              <ReadonlyInfoCard detail={detail} />

              {/* QUESTIONS */}
              <div className="space-y-4">
                {questionsAndSubs.map(({ item, sub }, idx) => (
                  <ReadonlyQuestionCard
                    key={sub?.id || item.id || idx}
                    item={item}
                    sub={sub}
                    idx={idx}
                    pendingStatusLabel={pendingStatusLabel}
                  />
                ))}
              </div>

              {/* SIGN OFF */}
              <SignOffSection
                detail={detail}
                onViewSignature={setSignatureUser}
              />
            </div>
          )}
        </div>
      </div>

      <SignatureViewModal
        open={!!signatureUser}
        user={signatureUser}
        onClose={() => setSignatureUser(null)}
      />
    </div>
  );
}

export default SafetyChecklistReadonlyModal;
export {
  ReadonlyQuestionCard,
  SignOffSection,
  SignatureViewModal,
  getSignOffUsers,
};
