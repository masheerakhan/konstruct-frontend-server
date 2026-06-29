import React, { useEffect, useState } from "react";
import {
  X,
  Clock,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  ShieldCheck,
  Wrench,
  MessageSquare,
  Camera,
  RotateCcw,
  Eye,
  Signature,
} from "lucide-react";
import { getSafetyChecklistHistory } from "../../../api";
import { showToast } from "../../../utils/toast";

// ─── Helpers ─────────────────────────────────────────────────

const resolveMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
      ? "http://127.0.0.1:8001"
      : "https://konstruct.world/checklists";

  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
};

/**
 * Builds a deduplicated, chronological thread for a single item_id.
 *
 * Problem: carried_forward questions repeat the same maker/checker objects
 * across multiple attempts (same `id`). We deduplicate by entry `id` so each
 * actual log record appears exactly once.
 *
 * Output: array of thread entries sorted by created_at ascending.
 * Each entry: { role, id, attemptNo, actorName, action, answer, comment, photoUrl, date }
 */
const buildThread = (attempts, itemId) => {
  const seenIds = new Set();
  const entries = [];

  (attempts || []).forEach((attempt, attemptIndex) => {
    const row = (attempt.questions || []).find((q) => q.item_id === itemId);
    if (!row) return;

    const maker = row.maker;
    const checker = row.checker;
    const attemptNo = attemptIndex + 1;

    if (maker && !seenIds.has(`maker-${maker.id}`)) {
      seenIds.add(`maker-${maker.id}`);
      entries.push({
        role: "maker",
        id: maker.id,
        attemptNo,
        actorName: maker.actor_name || "",
        action: maker.action || "",
        answer: maker.answer || "",
        comment: maker.remarks || "",
        photoUrl: maker.photo_url || "",
        date: maker.created_at || "",
      });
    }

    if (checker && !seenIds.has(`checker-${checker.id}`)) {
      seenIds.add(`checker-${checker.id}`);
      entries.push({
        role: "checker",
        id: checker.id,
        attemptNo,
        actorName: checker.actor_name || "",
        action: checker.action || "",
        answer: checker.action || "", // checkers use action as their "answer"
        comment: checker.remarks || "",
        photoUrl: checker.photo_url || "",
        date: checker.created_at || "",
      });
    }
  });

  // Sort by date ascending (they should already be, but enforce it)
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  return entries;
};

/**
 * Gets the final status of a question from the last attempt that mentions it.
 * Returns: "approved" | "rejected" | "pending" | null
 */
const getQuestionFinalStatus = (attempts, itemId) => {
  for (let i = attempts.length - 1; i >= 0; i--) {
    const row = (attempts[i].questions || []).find((q) => q.item_id === itemId);
    if (!row) continue;

    const status = String(row.status || "").toLowerCase();
    const checkerAction = String(row.checker?.action || "").toUpperCase();

    if (
      status === "completed" ||
      status === "approved" ||
      checkerAction === "APPROVED"
    ) {
      return "approved";
    }

    if (status.includes("reject") || checkerAction === "REJECTED") {
      return "rejected";
    }

    if (
      status === "pending_checker" ||
      status === "pending_supervisor" ||
      status === "pending_for_maker" ||
      status === "created"
    ) {
      return "pending";
    }

    return null;
  }

  return null;
};

// ─── Small UI pieces ──────────────────────────────────────────

const AnswerPill = ({ answer }) => {
  if (!answer) return null;
  const norm = String(answer).trim().toLowerCase();
  const cls =
    norm === "yes"
      ? "bg-green-100 text-green-700"
      : norm === "no"
        ? "bg-red-100 text-red-700"
        : norm === "n/a" || norm === "na"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-orange-100 text-orange-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold ${cls}`}
    >
      {answer}
    </span>
  );
};

const ActionBadge = ({ action }) => {
  const norm = String(action || "").toUpperCase();
  if (norm === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
        <AlertTriangle className="h-3 w-3" />
        Rejected
      </span>
    );
  }
  if (norm === "REWORK_SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
        <RotateCcw className="h-3 w-3" />
        Rework
      </span>
    );
  }
  if (norm === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
        <CheckCircle className="h-3 w-3" />
        Approved
      </span>
    );
  }
  // SUBMITTED or anything else
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700">
      Submitted
    </span>
  );
};

const PhotoChip = ({ url, label }) => {
  const finalUrl = resolveMediaUrl(url);
  if (!finalUrl) return null;
  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
    >
      <Camera className="h-3.5 w-3.5" />
      {label}
    </a>
  );
};

const StatusPill = ({ status }) => {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle className="h-3.5 w-3.5" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5" />
        Pending
      </span>
    );
  }
  return null;
};

// ─── Thread Entry ─────────────────────────────────────────────

/**
 * One bubble in the conversation thread.
 * Maker → left-aligned (orange), Checker → right-aligned (blue).
 *
 * Always rendered for maker entries (we need to show the answer even if no
 * comment/photo). For checker entries, only rendered if there's a comment,
 * photo, or a non-trivial action.
 */
export const ThreadEntry = ({ entry }) => {
  const {
    role,
    attemptNo,
    actorName,
    action,
    answer,
    comment,
    photoUrl,
    date,
  } = entry;

  const isMaker = role === "maker";
  const hasComment = Boolean(comment?.trim());
  const hasPhoto = Boolean(photoUrl);
  const hasAnswer = Boolean(answer?.trim());

  // For checker: skip if truly nothing to show
  if (!isMaker && !hasComment && !hasPhoto) return null;

  return (
    <div
      className={`flex gap-2.5 ${isMaker ? "flex-row" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div
        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
          isMaker
            ? "bg-gradient-to-br from-orange-400 to-orange-600"
            : "bg-gradient-to-br from-blue-500 to-blue-700"
        }`}
      >
        {isMaker ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div
        className={`flex min-w-0 max-w-[80%] flex-col ${isMaker ? "items-start" : "items-end"}`}
      >
        {/* Meta row */}
        <div
          className={`mb-1.5 flex flex-wrap items-center gap-1.5 ${isMaker ? "" : "flex-row-reverse"}`}
        >
          <span
            className={`text-xs font-semibold ${isMaker ? "text-orange-700" : "text-blue-700"}`}
          >
            {isMaker ? "Maker" : "Checker"}
            {actorName ? ` · ${actorName}` : ""}
          </span>
          {attemptNo && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Attempt {attemptNo}
            </span>
          )}
          <ActionBadge action={action} />
        </div>

        {/* Bubble */}
        <div
          className={`w-full rounded-2xl border px-4 py-3 shadow-sm ${
            isMaker
              ? "rounded-tl-sm border-orange-100 bg-orange-50/70"
              : "rounded-tr-sm border-blue-100 bg-blue-50/70"
          }`}
        >
          {/* Answer pill — always show for maker, show checker's action if meaningful */}
          {isMaker && hasAnswer && (
            <div className="mb-2">
              <AnswerPill answer={answer} />
            </div>
          )}

          {/* Comment */}
          {hasComment && (
            <p className="text-sm leading-relaxed text-foreground">{comment}</p>
          )}

          {/* Photo */}
          {hasPhoto && (
            <div className={hasComment ? "mt-2.5" : ""}>
              <PhotoChip
                url={photoUrl}
                label={isMaker ? "View Maker Photo" : "View Checker Photo"}
              />
            </div>
          )}
        </div>

        {/* Date — below bubble */}
        {date && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {formatDate(date)}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Question Card ────────────────────────────────────────────

const QuestionCard = ({ index, itemId, question, attempts, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const thread = buildThread(attempts, itemId);
  const finalStatus = getQuestionFinalStatus(attempts, itemId);

  // Count visible entries (maker always counts, checker only if has content)
  const visibleCount = thread.filter((e) => {
    if (e.role === "maker") return true; // always show maker (has at least answer)
    return Boolean(e.comment?.trim()) || Boolean(e.photoUrl);
  }).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* ── Card header (always visible) ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        {/* Number badge */}
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
          {index}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
            {question}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {finalStatus && <StatusPill status={finalStatus} />}

            {visibleCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {visibleCount} response{visibleCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <span className="mt-1 shrink-0 text-muted-foreground">
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>

      {/* ── Thread (expanded) ── */}
      {open && (
        <div className="border-t border-border/50 bg-muted/10 px-5 py-4">
          {visibleCount === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No responses recorded yet.
            </p>
          ) : (
            <div className="space-y-5">
              {thread.map((entry, i) => (
                <ThreadEntry
                  key={`${entry.role}-${entry.id}-${i}`}
                  entry={entry}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LEGACY_HISTORY_HEADER_FIELDS = [
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

const sortHistoryHeaderFields = (fields = []) =>
  [...fields].sort(
    (a, b) =>
      Number(a.row_index || 0) - Number(b.row_index || 0) ||
      Number(a.column_index || 0) - Number(b.column_index || 0) ||
      Number(a.order_index || 0) - Number(b.order_index || 0),
  );

const getHistoryHeaderFields = (checklist) => {
  /*
        New dynamic history response.
        Values are already resolved by backend from the checklist snapshot
        and the Maker-entered report metadata.
    */
  const dynamicFields = Array.isArray(checklist?.report_header_fields)
    ? checklist.report_header_fields
    : [];

  if (dynamicFields.length > 0) {
    return sortHistoryHeaderFields(
      dynamicFields.filter((field) => field.visible_in_preview !== false),
    );
  }

  /*
        Backward compatibility for history payloads created before
        dynamic report header fields were implemented.
    */
  const legacyMeta =
    checklist?.report_header_meta ||
    checklist?.safety_report_meta ||
    checklist?.report_meta ||
    {};

  return LEGACY_HISTORY_HEADER_FIELDS.map((field) => ({
    ...field,
    value: legacyMeta[field.key] || "",
    visible_in_preview: true,
  }));
};

const HistoryHeaderValue = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>

    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
      {String(value ?? "").trim() || "—"}
    </p>
  </div>
);

const ReportHeaderInfoCard = ({ checklist }) => {
  const fields = getHistoryHeaderFields(checklist);

  if (!fields.length) {
    return null;
  }

  return (
    <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-900">
          Checklist Information
        </h3>

        {/* <p className="mt-1 text-xs text-gray-500">
                    Header details captured for this checklist.
                </p> */}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <HistoryHeaderValue
            key={field.key}
            label={field.label}
            value={field.value ?? field.default_value ?? ""}
          />
        ))}
      </div>
    </div>
  );
};

const getLatestNameFromAttempts = (attempts, role) => {
  for (let i = (attempts || []).length - 1; i >= 0; i -= 1) {
    const questions = attempts[i]?.questions || [];

    for (const row of questions) {
      const source = role === "maker" ? row?.maker : row?.checker;
      const name = String(source?.actor_name || "").trim();

      if (name) {
        return name;
      }
    }
  }

  return "";
};

const getLatestSignatureFromAttempts = (attempts, role) => {
  for (let i = (attempts || []).length - 1; i >= 0; i -= 1) {
    const questions = attempts[i]?.questions || [];

    for (const row of questions) {
      const source = role === "maker" ? row?.maker : row?.checker;

      const signature =
        source?.signature_url ||
        source?.signature ||
        source?.signature_file ||
        "";

      if (signature) {
        return signature;
      }
    }
  }

  return "";
};

const getHistorySignOffUsers = (checklist, attempts) => {
  const makerName =
    checklist?.maker_name ||
    getLatestNameFromAttempts(attempts, "maker") ||
    "Maker";

  const checkerName =
    checklist?.checker_name ||
    getLatestNameFromAttempts(attempts, "checker") ||
    "Checker";

  const makerSignature =
    checklist?.maker_signature ||
    checklist?.maker_signature_url ||
    getLatestSignatureFromAttempts(attempts, "maker") ||
    "";

  const checkerSignature =
    checklist?.checker_signature ||
    checklist?.checker_signature_url ||
    getLatestSignatureFromAttempts(attempts, "checker") ||
    "";

  return {
    maker: {
      role: "maker",
      label: "Checked by",
      name: makerName,
      designation: "",
      signature: makerSignature,
    },
    checker: {
      role: "checker",
      label: "Verified by",
      name: checkerName,
      designation: "",
      signature: checkerSignature,
    },
  };
};

const SignatureViewModal = ({ open, user, onClose }) => {
  if (!open || !user) return null;

  const signatureUrl = resolveMediaUrl(user.signature);

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">{user.label}</h3>

            <p className="mt-1 text-sm text-gray-500">
              {user.name}{" "}
              <span className="font-medium">({user.designation})</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {signatureUrl ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <img
                src={signatureUrl}
                alt={`${user.designation} signature`}
                className="mx-auto max-h-72 w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
              <Signature className="mb-2 h-8 w-8 text-gray-400" />

              <p className="text-sm font-semibold text-gray-900">
                No signature available
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Latest signature was not found for this user.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HistorySignOffRow = ({ user, onView }) => {
  const hasSignature = Boolean(String(user?.signature || "").trim());

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            user.role === "maker"
              ? "bg-orange-100 text-orange-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {user.role === "maker" ? (
            <User className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {user.label}
          </p>

          <p className="text-sm font-bold text-gray-900">{user.name} </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onView(user)}
        disabled={!hasSignature}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
          hasSignature
            ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
        View
      </button>
    </div>
  );
};

const HistorySignOffSection = ({ checklist, attempts, onViewSignature }) => {
  const users = getHistorySignOffUsers(checklist, attempts);

  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-900">Sign Off</h3>

        <p className="mt-1 text-xs text-gray-500">
          Latest checklist signatures from Maker and Checker.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <HistorySignOffRow user={users.maker} onView={onViewSignature} />

        <HistorySignOffRow user={users.checker} onView={onViewSignature} />
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────

function SafetyChecklistHistoryModal({ open, onClose, checklistId, title }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(null);
  const [expandKey, setExpandKey] = useState(0);
  const [defaultOpenAll, setDefaultOpenAll] = useState(false);
  const [signatureUser, setSignatureUser] = useState(null);

  useEffect(() => {
    if (!open || !checklistId) return;
    let alive = true;

    const loadHistory = async () => {
      setLoading(true);
      setHistory(null);
      setSignatureUser(null);
      try {
        const res = await getSafetyChecklistHistory(checklistId);
        if (!alive) return;
        setHistory(res?.data || null);
      } catch (err) {
        showToast(
          err?.response?.data?.detail || "Failed to load checklist history.",
          "error",
        );
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      alive = false;
    };
  }, [open, checklistId]);

  if (!open) return null;

  const attempts = history?.attempts || [];
  const checklist = history?.checklist || {};

  // Collect unique questions in order (first occurrence wins)
  const questionMap = new Map();
  attempts.forEach((attempt) => {
    (attempt.questions || []).forEach((row) => {
      if (!questionMap.has(row.item_id)) {
        questionMap.set(row.item_id, row.question);
      }
    });
  });
  const questions = Array.from(questionMap.entries()); // [[item_id, questionText]]

  const approvedQuestionsCount = questions.filter(
    ([itemId]) => getQuestionFinalStatus(attempts, itemId) === "approved",
  ).length;

  const rejectedQuestionsCount = questions.filter(
    ([itemId]) => getQuestionFinalStatus(attempts, itemId) === "rejected",
  ).length;

  // Overall checklist status
  const overallStatus = String(checklist.status || "").toLowerCase();
  const overallStatusLabel =
    overallStatus === "completed"
      ? "approved"
      : overallStatus === "closed_rejected"
        ? "rejected"
        : overallStatus === "in_progress"
          ? "pending"
          : null;

  const handleExpandAll = () => {
    setDefaultOpenAll(true);
    setExpandKey((k) => k + 1);
  };

  const handleCollapseAll = () => {
    setDefaultOpenAll(false);
    setExpandKey((k) => k + 1);
  };

  const handleClose = () => {
    setHistory(null);
    setDefaultOpenAll(false);
    setExpandKey(0);
    setSignatureUser(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[201] flex items-center justify-center bg-black/50 p-3">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 border-b px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                Checklist History
              </h2>
              {overallStatusLabel && <StatusPill status={overallStatusLabel} />}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {title || checklist.name || "Safety Checklist"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="mt-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-2.5">
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {!loading && questions.length > 0 ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                  {questions.length} Total question
                  {questions.length !== 1 ? "s" : ""}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {approvedQuestionsCount} Approved question
                  {approvedQuestionsCount !== 1 ? "s" : ""}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {rejectedQuestionsCount} Rejected question
                  {rejectedQuestionsCount !== 1 ? "s" : ""}
                </span>
              </>
            ) : !loading ? (
              "No history found"
            ) : (
              "Loading…"
            )}
          </p>
          {questions.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="mb-3 h-7 w-7 animate-spin opacity-40" />
              <p className="text-sm">Loading history…</p>
            </div>
          )}

          {!loading && history?.checklist && (
            <ReportHeaderInfoCard checklist={history.checklist} />
          )}

          {!loading && !history?.summary?.history_available && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {history?.summary?.message ||
                "No history found for this checklist."}
            </div>
          )}

          {!loading && questions.length > 0 && (
            // key forces re-mount of all cards when expand/collapse all is triggered
            <div key={expandKey} className="space-y-3">
              {questions.map(([itemId, questionText], idx) => (
                <QuestionCard
                  key={itemId}
                  index={idx + 1}
                  itemId={itemId}
                  question={questionText}
                  attempts={attempts}
                  defaultOpen={defaultOpenAll || idx === 0}
                />
              ))}
            </div>
          )}

          {!loading && history?.checklist && (
            <HistorySignOffSection
              checklist={history.checklist}
              attempts={attempts}
              onViewSignature={setSignatureUser}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end border-t bg-muted/20 px-6 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Close
          </button>
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

export default SafetyChecklistHistoryModal;
