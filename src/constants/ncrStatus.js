import { FileEdit, Clock, PlayCircle, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ClipboardList } from "lucide-react";

export const NCR_STATUSES = [
  { key: 'draft', label: 'Draft', color: 'amber', icon: FileEdit },
  { key: 'pending_ph_approval', label: 'Pending PH Approval', color: 'orange', icon: Clock },
  { key: 'in_progress', label: 'In Progress', color: 'purple', icon: PlayCircle },
  { key: 'pending_verification', label: 'Pending Verification', color: 'teal', icon: ShieldCheck },
  { key: 'closed', label: 'Closed', color: 'green', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', color: 'red', icon: XCircle },
  { key: 'overdue', label: 'Overdue', color: 'red', icon: AlertTriangle },
];
