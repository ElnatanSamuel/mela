"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  MessageSquareWarning,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Complaint {
  id: string;
  hotelId: string;
  userId: string;
  message: string;
  status: "new" | "acknowledged" | "resolved";
  response: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
  createdAt: string;
}

type StatusFilter = "all" | "new" | "acknowledged" | "resolved";

const statusConfig: Record<
  Complaint["status"],
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  acknowledged: {
    label: "Acknowledged",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
};

const tabs: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
];

export default function ComplaintsContent({ hotelId }: { hotelId: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [modalComplaint, setModalComplaint] = useState<Complaint | null>(null);
  const [modalResponseText, setModalResponseText] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const fetchComplaints = useCallback(async (status?: StatusFilter) => {
    setIsLoading(true);
    try {
      const url =
        status && status !== "all"
          ? `/api/complaints?status=${status}`
          : "/api/complaints";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(activeTab);
  }, [activeTab, fetchComplaints]);

  const handleRespond = async (complaintId: string, response: string) => {
    if (!response.trim()) return;
    setSubmittingId(complaintId);
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, status: "acknowledged" }),
      });
      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? { ...c, response, status: "acknowledged" as const }
              : c,
          ),
        );
        setResponseText("");
        setExpandedId(null);
      }
    } catch {
    } finally {
      setSubmittingId(null);
    }
  };

  const handleResolve = async (complaintId: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? { ...c, status: "resolved" as const }
              : c,
          ),
        );
      }
    } catch {
    }
  };

  const handleModalSubmit = async () => {
    if (!modalComplaint || !modalResponseText.trim()) return;
    setModalSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${modalComplaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: modalResponseText,
          status: "acknowledged",
        }),
      });
      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === modalComplaint.id
              ? { ...c, response: modalResponseText, status: "acknowledged" as const }
              : c,
          ),
        );
        setModalComplaint(null);
        setModalResponseText("");
      }
    } catch {
    } finally {
      setModalSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight uppercase">
          Complaints
        </h2>
        <p className="text-sm text-muted-foreground">
          Review and respond to guest feedback.
        </p>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-2 rounded-[6px] text-xs font-black uppercase tracking-widest transition-all",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {complaints.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-[6px]">
          <MessageSquareWarning className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">
            No complaints
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-widest">
            All clear — guests are happy
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {complaints.map((complaint) => {
              const isExpanded = expandedId === complaint.id;
              const statusInfo = statusConfig[complaint.status];

              return (
                <motion.div
                  key={complaint.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="bg-card border border-border rounded-[6px] shadow-sm dark:shadow-black/10 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : complaint.id)
                    }
                    className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">
                          {complaint.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={cn(
                              "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                              statusInfo.className,
                            )}
                          >
                            {statusInfo.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 font-medium">
                            {formatDistanceToNow(new Date(complaint.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {complaint.response && (
                          <div className="mt-3 pl-3 border-l-2 border-primary/30">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                              Response
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {complaint.response}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-border">
                          <div className="pt-3 space-y-3">
                            {complaint.status === "new" && (
                              <>
                                <textarea
                                  value={responseText}
                                  onChange={(e) =>
                                    setResponseText(e.target.value)
                                  }
                                  placeholder="Type your response..."
                                  rows={3}
                                  className="w-full bg-muted border border-border rounded-[4px] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleRespond(complaint.id, responseText)
                                    }
                                    disabled={
                                      submittingId === complaint.id ||
                                      !responseText.trim()
                                    }
                                    className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                  >
                                    {submittingId === complaint.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Send className="w-3 h-3" />
                                    )}
                                    Respond
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleResolve(complaint.id)
                                    }
                                    className="bg-green-600 text-white py-2.5 px-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                                  >
                                    Resolve
                                  </button>
                                </div>
                              </>
                            )}

                            {complaint.status === "acknowledged" && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setModalComplaint(complaint);
                                    setModalResponseText(complaint.response || "");
                                  }}
                                  className="bg-card border border-border py-2.5 px-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                                >
                                  Edit Response
                                </button>
                                <button
                                  onClick={() =>
                                    handleResolve(complaint.id)
                                  }
                                  className="bg-green-600 text-white py-2.5 px-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                                >
                                  Mark Resolved
                                </button>
                              </div>
                            )}

                            {complaint.status === "resolved" && (
                              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest text-right">
                                Resolved{" "}
                                {complaint.respondedAt
                                  ? formatDistanceToNow(
                                      new Date(complaint.respondedAt),
                                      { addSuffix: true },
                                    )
                                  : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={!!modalComplaint}
        onClose={() => {
          setModalComplaint(null);
          setModalResponseText("");
        }}
        title="Respond to Complaint"
        description="Provide a response to the guest"
      >
        {modalComplaint && (
          <div className="space-y-4">
            <p className="text-sm text-foreground leading-relaxed">
              {modalComplaint.message}
            </p>
            <textarea
              value={modalResponseText}
              onChange={(e) => setModalResponseText(e.target.value)}
              placeholder="Type your response..."
              rows={4}
              className="w-full bg-muted border border-border rounded-[4px] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleModalSubmit}
                disabled={modalSubmitting || !modalResponseText.trim()}
                className="flex-1 bg-primary text-primary-foreground py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {modalSubmitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Submit
              </button>
              <button
                onClick={() => {
                  setModalComplaint(null);
                  setModalResponseText("");
                }}
                className="py-3 px-6 text-xs font-black uppercase tracking-widest border border-border rounded-[6px] hover:bg-muted transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
