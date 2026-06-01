import React, { useEffect, useMemo, useState } from "react";

import {
  getManualChecklistById,
  respondManualChecklistQuestion,
  getQuestionTimeline,
  completeManualChecklistQuestion,
  completeManualChecklist,
} from "../api/manualChecklistApi";

import { getUsersWithRoles } from "../api/index";

export default function ManualChecklistLocationExecutionView({
  checklistId,
  role,
  onBack,
}) {
  const [checklist, setChecklist] = useState(null);

  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);

  const [selectedUsers, setSelectedUsers] = useState([]);

  const [selectedQuestions, setSelectedQuestions] = useState({});

  const [responses, setResponses] = useState({});

  const [timelineLogs, setTimelineLogs] = useState([]);

  const [showLogsModal, setShowLogsModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [completionRemarks, setCompletionRemarks] = useState({});
  const [checklistCompletionRemarks, setChecklistCompletionRemarks] =
    useState("");
  const userData = JSON.parse(localStorage.getItem("USER_DATA"));

  const currentUserId = userData?.id;

  const canComplete = role === "CHECKER" || role === "QUALITY ENGINEER";

  // =====================================================
  // FETCH CHECKLIST
  // =====================================================

  useEffect(() => {
    if (checklistId) {
      fetchChecklist();
    }
  }, [checklistId]);

  const fetchChecklist = async () => {
    try {
      setLoading(true);

      const res = await getManualChecklistById(checklistId, role);

      setChecklist(res.data);

      if (res.data?.project_id) {
        fetchUsers(res.data.project_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = async (projectId) => {
    try {
      const res = await getUsersWithRoles(projectId);

      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // =====================================================
  // UNIQUE USER ROLES
  // =====================================================

  const uniqueUserRoles = useMemo(() => {
    return Array.from(
      new Map(
        users.flatMap((user) =>
          user.roles
            .filter((userRole) => {
              return !(
                Number(user.user_id) === Number(currentUserId) &&
                String(userRole).toUpperCase() === String(role).toUpperCase()
              );
            })
            .map((userRole) => [
              `${user.user_id}-${userRole}`,
              {
                ...user,
                role: userRole,
              },
            ]),
        ),
      ).values(),
    );
  }, [users, currentUserId, role]);

  // =====================================================
  // SELECTED THREADS
  // =====================================================

  const selectedThreadIds = Object.keys(selectedQuestions).filter(
    (id) => selectedQuestions[id],
  );

  const hasSelectedQuestions = selectedThreadIds.length > 0;

  const allQuestionsCompleted = checklist?.question_threads?.every(
    (thread) => thread.is_completed,
  );

  // =====================================================
  // TOGGLE QUESTION
  // =====================================================

  const toggleQuestion = (threadId) => {
    setSelectedQuestions((prev) => ({
      ...prev,
      [threadId]: !prev[threadId],
    }));
  };

  // =====================================================
  // HANDLE RESPONSE CHANGE
  // =====================================================

  const handleResponseChange = (threadId, key, value) => {
    setResponses((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        [key]: value,
      },
    }));
  };

  // =====================================================
  // TIMELINE LOGS
  // =====================================================

  const handleOpenLogs = async (threadId) => {
    try {
      const res = await getQuestionTimeline(threadId);

      setTimelineLogs(res.data || []);

      setShowLogsModal(true);
    } catch (err) {
      console.error(err);

      alert("Failed to load logs");
    }
  };

  const handleCompleteQuestion = async (threadId) => {
    try {
      await completeManualChecklistQuestion({
        thread_id: threadId,
        remarks: completionRemarks[threadId] || "",
        role: role,
      });

      alert("Question completed successfully");

      await fetchChecklist();
    } catch (err) {
      console.error(err);

      alert(err?.response?.data?.detail || "Failed to complete question");
    }
  };

  const handleCompleteChecklist = async () => {
    try {
      const payload = new FormData();

      payload.append("checklist_id", checklist.id);

      payload.append("remarks", checklistCompletionRemarks);

      payload.append("role", role);

      await completeManualChecklist(payload);
      alert("Checklist completed successfully");

      await fetchChecklist();
    } catch (err) {
      console.error(err);

      alert(err?.response?.data?.detail || "Failed to complete checklist");
    }
  };

  const handleCompleteSelectedQuestions = async () => {
    try {
      if (!hasSelectedQuestions) {
        alert("Please select at least one question");
        return;
      }

      for (const threadId of selectedThreadIds) {
        const responseData = responses[threadId] || {};

        const payload = new FormData();

        payload.append("thread_id", threadId);

        payload.append("remarks", responseData.remarks || "");

        payload.append("role", role);

        await completeManualChecklistQuestion(payload);
      }

      alert("Selected questions completed successfully");

      await fetchChecklist();

      setSelectedQuestions({});
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.detail || "Failed to complete selected questions",
      );
    }
  };

  // =====================================================
  // SUBMIT SELECTED QUESTIONS
  // =====================================================
  const handleSubmitSelected = async () => {
    try {
      if (!hasSelectedQuestions) {
        alert("Please select at least one question");
        return;
      }

      if (selectedUsers.length === 0) {
        alert("Please select at least one user");
        return;
      }

      for (const threadId of selectedThreadIds) {
        const responseData = responses[threadId] || {};

        const thread = checklist.question_threads.find(
          (item) => Number(item.id) === Number(threadId),
        );

        const currentRouting = thread?.current_assignees?.find(
          (assignee) =>
            Number(assignee.user_id) === Number(currentUserId) &&
            assignee.role === role,
        );

        if (!currentRouting?.routing_id) {
          alert(`No active routing found for question ${threadId}`);
          continue;
        }

        const payload = new FormData();

        payload.append("thread", threadId);

        payload.append("routing", currentRouting.routing_id);

        payload.append("role", role);

        payload.append(
          "assigned_to",
          JSON.stringify(
            selectedUsers.map((selectedUser) => {
              const [userId, userRole] = selectedUser.split("-");

              const user = uniqueUserRoles.find(
                (u) =>
                  Number(u.user_id) === Number(userId) && u.role === userRole,
              );

              return {
                user_id: Number(userId),
                name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                role: userRole,
              };
            }),
          ),
        );

        if (responseData.answer) {
          payload.append("selected_option", responseData.answer);
        }

        payload.append("remarks", responseData.remarks || "");

        if (responseData.photos && responseData.photos.length > 0) {
          responseData.photos.forEach((photo) => {
            payload.append("uploaded_images", photo);
          });
        }

        await respondManualChecklistQuestion(payload);
      }

      alert("Selected questions submitted successfully");

      await fetchChecklist();

      setSelectedQuestions({});
      setResponses({});
      setSelectedUsers([]);
    } catch (err) {
      console.error(err);

      console.log(err?.response?.data);

      alert("Failed to submit selected questions");
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-10 text-center text-sm text-[#8b7765]">
        Loading checklist...
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-10 text-center text-sm text-[#8b7765]">
        Checklist not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#4b3b2a]">
              Checklist #{checklist.id}
            </h1>

            <p className="mt-2 text-sm text-[#8b7765]">
              {checklist.location_text}
            </p>
          </div>

          <button
            onClick={onBack}
            className="rounded-xl border border-[#d8c2a5] bg-[#f3e2c9] px-5 py-2 text-sm font-medium text-[#6b533d] transition hover:bg-[#ecd5b4]"
          >
            Back
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* TOP ACTION BAR */}
      {/* ===================================================== */}

      <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* ASSIGN USERS */}

          <div>
            <label className="mb-2 block text-sm font-medium text-[#6b533d]">
              Assign Users
            </label>

            <select
              multiple
              value={selectedUsers}
              onChange={(e) => {
                const values = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value,
                );

                setSelectedUsers(values);
              }}
              className="h-40 w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
            >
              {uniqueUserRoles.map((user) => (
                <option
                  key={`${user.user_id}-${user.role}`}
                  value={`${user.user_id}-${user.role}`}
                >
                  {user.first_name} {user.last_name} ({user.role})
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-[#8b7765]">
              Hold CTRL/CMD to select multiple users
            </p>
          </div>

          {/* SUBMIT */}

          <div className="flex flex-col items-end gap-3">
            {!canComplete && (
              <button
                disabled={!hasSelectedQuestions}
                onClick={handleSubmitSelected}
                className={`rounded-xl px-6 py-3 text-sm font-medium transition ${
                  hasSelectedQuestions
                    ? "bg-[#4b3b2a] text-white hover:opacity-90"
                    : "cursor-not-allowed bg-[#cbbba8] text-white"
                }`}
              >
                Submit Selected Questions
              </button>
            )}

            {canComplete && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={!hasSelectedQuestions}
                  onClick={handleSubmitSelected}
                  className={`rounded-xl px-6 py-3 text-sm font-medium transition ${
                    hasSelectedQuestions
                      ? "bg-[#4b3b2a] text-white hover:opacity-90"
                      : "cursor-not-allowed bg-[#cbbba8] text-white"
                  }`}
                >
                  Assign Selected Questions
                </button>

                <button
                  disabled={!hasSelectedQuestions}
                  onClick={handleCompleteSelectedQuestions}
                  className={`rounded-xl px-6 py-3 text-sm font-medium transition ${
                    hasSelectedQuestions
                      ? "bg-green-700 text-white hover:opacity-90"
                      : "cursor-not-allowed bg-[#cbbba8] text-white"
                  }`}
                >
                  Complete Selected Questions
                </button>
              </div>
            )}

            {canComplete &&
              allQuestionsCompleted &&
              checklist.status !== "completed" && (
                <button
                  onClick={handleCompleteChecklist}
                  className="rounded-xl bg-[#1f6f43] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Complete Checklist
                </button>
              )}
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* QUESTIONS */}
      {/* ===================================================== */}

      <div className="space-y-5">
        {checklist.question_threads?.map((thread) => (
          <div
            key={thread.id}
            className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-5"
          >
            {/* HEADER */}

            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedQuestions[thread.id] || false}
                onChange={() => toggleQuestion(thread.id)}
                className="mt-1 h-5 w-5"
                disabled={thread.is_completed}
              />

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[#4b3b2a]">
                  {thread.question?.title}
                </h2>

                <p className="mt-1 text-sm text-[#8b7765]">
                  Section: {thread.question?.section?.title}
                </p>

                {thread.is_completed && (
                  <div className="mt-3 inline-flex rounded-full bg-green-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-green-700">
                    Completed
                  </div>
                )}

                {/* CURRENT ASSIGNEES */}

                {thread.current_assignees?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {thread.current_assignees.map((assignee) => (
                      <div
                        key={assignee.routing_id}
                        className="rounded-full bg-[#ede0cf] px-3 py-1 text-xs font-medium text-[#6b533d]"
                      >
                        {assignee.role} • User #{assignee.user_id}
                      </div>
                    ))}
                  </div>
                )}

                {/* ACTION BUTTONS */}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleOpenLogs(thread.id, role)}
                    className="rounded-xl border border-[#d8c2a5] bg-[#fffaf4] px-4 py-2 text-sm font-medium text-[#6b533d] transition hover:bg-[#f3e2c9]"
                  >
                    View Logs
                  </button>
                </div>
              </div>
            </div>

            {/* OPTIONS */}

            {thread.question?.options?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {thread.question.options.map((option) => (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      responses[thread.id]?.answer === option.id
                        ? "border-[#4b3b2a] bg-[#4b3b2a] text-white"
                        : "border-[#e1d1bd] bg-[#fffaf4] text-[#6b533d]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`thread-${thread.id}`}
                      value={option.id}
                      onChange={() =>
                        handleResponseChange(thread.id, "answer", option.id)
                      }
                      className="hidden"
                      disabled={thread.is_completed}
                    />

                    {option.name}
                  </label>
                ))}
              </div>
            )}

            {/* TEXT ANSWER */}

            {thread.question?.options?.length === 0 && (
              <textarea
                rows={4}
                placeholder="Add your response..."
                value={responses[thread.id]?.remarks || ""}
                onChange={(e) =>
                  handleResponseChange(thread.id, "remarks", e.target.value)
                }
                className="mt-5 w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
              />
            )}

            {/* PHOTO */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                Upload Photo
                {thread.question?.photo_required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>

              <input
                type="file"
                multiple
                onChange={(e) =>
                  handleResponseChange(
                    thread.id,
                    "photos",
                    Array.from(e.target.files),
                  )
                }
                disabled={thread.is_completed}
                className="block w-full text-sm text-[#6b533d]"
              />

              {thread.question?.photo_required && (
                <p className="mt-1 text-xs text-red-500">
                  Photo is required for this question
                </p>
              )}

              {responses[thread.id]?.photos?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {responses[thread.id].photos.map((photo, index) => (
                    <div
                      key={`${photo.name}-${index}`}
                      className="relative rounded-xl border border-[#e1d1bd] bg-[#fffaf4] p-2"
                    >
                      {/* REMOVE BUTTON */}

                      <button
                        type="button"
                        onClick={() => {
                          const updatedPhotos = responses[
                            thread.id
                          ].photos.filter((_, i) => i !== index);

                          handleResponseChange(
                            thread.id,
                            "photos",
                            updatedPhotos,
                          );
                        }}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow"
                      >
                        ✕
                      </button>

                      {/* IMAGE */}

                      <img
                        src={URL.createObjectURL(photo)}
                        alt="preview"
                        onClick={() =>
                          setPreviewImage(URL.createObjectURL(photo))
                        }
                        className="h-24 w-24 cursor-pointer rounded-lg object-cover transition hover:scale-105"
                      />

                      {/* NAME */}

                      <div className="mt-2 max-w-[96px] truncate text-xs text-[#8b7765]">
                        {photo.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REMARKS */}
            <div className="mt-5">
              <textarea
                rows={3}
                placeholder="Add remarks..."
                value={responses[thread.id]?.remarks || ""}
                onChange={(e) =>
                  handleResponseChange(thread.id, "remarks", e.target.value)
                }
                disabled={thread.is_completed}
                className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ===================================================== */}
      {/* LOGS MODAL */}
      {/* ===================================================== */}

      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#4b3b2a]">
                Question Logs
              </h2>

              <button
                onClick={() => setShowLogsModal(false)}
                className="rounded-xl border border-[#d8c2a5] px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {timelineLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-[#eadcc8] bg-[#f7efe3] p-5"
                >
                  {/* HEADER */}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-[#4b3b2a]">
                        {log.action_label}
                      </div>

                      <div className="mt-1 text-xs uppercase tracking-wide text-[#a17b47]">
                        {log.status}
                      </div>
                    </div>

                    <div className="text-xs text-[#8b7765]">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* FROM */}

                  <div className="mt-4 rounded-xl bg-[#fffaf4] p-3">
                    <div className="text-xs font-semibold uppercase text-[#8b7765]">
                      Action By
                    </div>

                    <div className="mt-1 text-sm font-medium text-[#4b3b2a]">
                      {log.from_user_name || `User #${log.from_user_id}`}
                    </div>

                    <div className="mt-1 text-xs text-[#8b7765]">
                      Role: {log.from_role || "-"}
                    </div>
                  </div>

                  {/* ASSIGNED USERS */}

                  {log.assigned_users?.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-xs font-semibold uppercase text-[#8b7765]">
                        Assigned To
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {log.assigned_users.map((user, index) => (
                          <div
                            key={`${user.user_id}-${index}`}
                            className="rounded-full border border-[#e1d1bd] bg-[#fffaf4] px-3 py-2"
                          >
                            <div className="text-sm font-medium text-[#4b3b2a]">
                              {user.name}
                            </div>

                            <div className="mt-1 text-xs text-[#8b7765]">
                              {user.role}
                            </div>

                            <div
                              className={`mt-1 text-[11px] font-semibold uppercase ${
                                user.status === "completed"
                                  ? "text-green-600"
                                  : user.status === "responded"
                                    ? "text-blue-600"
                                    : user.status === "skipped"
                                      ? "text-red-500"
                                      : "text-[#a17b47]"
                              }`}
                            >
                              {user.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SELECTED OPTION */}

                  {log.selected_option && (
                    <div className="mt-4 rounded-xl bg-[#fffaf4] p-3">
                      <div className="text-xs font-semibold uppercase text-[#8b7765]">
                        Selected Option
                      </div>

                      <div className="mt-1 text-sm font-medium text-[#4b3b2a]">
                        {log.selected_option?.name}
                        {/* {log.selected_option?.choice}) */}
                      </div>
                    </div>
                  )}

                  {/* ACTION REMARKS */}

                  {log.remarks && (
                    <div className="mt-4 rounded-xl bg-[#fffaf4] p-3">
                      <div className="text-xs font-semibold uppercase text-[#8b7765]">
                        System Remarks
                      </div>

                      <div className="mt-1 text-sm text-[#4b3b2a]">
                        {log.remarks}
                      </div>
                    </div>
                  )}

                  {/* RESPONSE REMARKS */}

                  {log.response_remarks && (
                    <div className="mt-4 rounded-xl bg-[#fffaf4] p-3">
                      <div className="text-xs font-semibold uppercase text-[#8b7765]">
                        Response Remarks
                      </div>

                      <div className="mt-1 text-sm text-[#4b3b2a]">
                        {log.response_remarks}
                      </div>
                    </div>
                  )}

                  {/* RESPONSE IMAGES */}

                  {log.response_images?.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-xs font-semibold uppercase text-[#8b7765]">
                        Attached Photos
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {log.response_images.map((image) => (
                          <img
                            key={image.id}
                            src={`https://konstruct.world/checklists${image.image}`}
                            alt="response"
                            onClick={() =>
                              setPreviewImage(
                                `https://konstruct.world/checklists${image.image}`,
                              )
                            }
                            className="h-24 w-24 cursor-pointer rounded-xl border border-[#e1d1bd] object-cover transition hover:scale-105"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6">
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white px-3 py-1 text-sm font-medium shadow"
            >
              ✕
            </button>

            <img
              src={previewImage}
              alt="preview"
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
