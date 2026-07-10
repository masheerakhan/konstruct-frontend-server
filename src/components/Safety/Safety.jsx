import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  FileCheck,
  HardHat,
  Activity,
  Siren,
  Flame,
  AlertTriangle,
  Lightbulb,
  ClipboardList,
  HeartPulse,
  Folder,
} from "lucide-react";

const safetyCards = [
  {
    title: "Safety Sessions",
    desc: "Toolbox talks & training",
    icon: ShieldCheck,
    color: "orange",
    path: "/safety/sessions",
  },
  {
    title: "Safety Checklists",
    desc: "Create checklist for safety inspection",
    icon: Eye,
    color: "blue",
    path: "/safetyInspections",
  },
  // {
  //     title: "Permit to Work",
  //     desc: "Work permits & approvals",
  //     icon: FileCheck,
  //     color: "green",
  //     path: "/safety/permit-to-work",
  // },
  {
    title: "Permit Setup",
    desc: "Configure Permit Templates",
    icon: FileCheck,
    color: "slate",
    path: "/permit/setup",
  },
  {
    title: "Tracker",
    desc: "Safety tracker",
    icon: Activity,
    color: "blue",
    path: "/safety/ppe",
  },
  {
    title: "Emergency Details",
    desc: "Details for emergency situation",
    icon: Siren,
    color: "red",
    path: "/safety/fire",
  },
  {
    title: "Document Management",
    desc: "Document management",
    icon: Folder,
    color: "yellow",
    path: "/safety/document-pro",
  },
  // {
  //     title: "Incident Report",
  //     desc: "Log & track incidents",
  //     icon: AlertTriangle,
  //     color: "rose",
  //     path: "/safety/incidents",
  // },
  // {
  //     title: "Emergency Response",
  //     desc: "Emergency action plans",
  //     icon: Lightbulb,
  //     color: "amber",
  //     path: "/safety/emergency",
  // },
  // {
  //     title: "Safety Audit",
  //     desc: "Site audit checklists",
  //     icon: ClipboardList,
  //     color: "indigo",
  //     path: "/safety/audit",
  // },
  // {
  //     title: "Health & Wellbeing",
  //     desc: "Health monitoring forms",
  //     icon: HeartPulse,
  //     color: "emerald",
  //     path: "/safety/health",
  // },
];

const colorMap = {
  orange:
    "border-orange-200 hover:border-orange-400 text-orange-500 bg-orange-50",
  blue: "border-blue-200 hover:border-blue-400 text-blue-500 bg-blue-50",
  green: "border-green-200 hover:border-green-400 text-green-500 bg-green-50",
  yellow:
    "border-yellow-200 hover:border-yellow-400 text-yellow-500 bg-yellow-50",
  red: "border-red-200 hover:border-red-400 text-red-500 bg-red-50",
  rose: "border-rose-200 hover:border-rose-400 text-rose-500 bg-rose-50",
  amber: "border-amber-200 hover:border-amber-400 text-amber-500 bg-amber-50",
  indigo:
    "border-indigo-200 hover:border-indigo-400 text-indigo-500 bg-indigo-50",
  emerald:
    "border-emerald-200 hover:border-emerald-400 text-emerald-500 bg-emerald-50",
};

function Safety() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      {/* Header */}
      <h2 className="text-xl font-semibold text-gray-800">Safety</h2>
      <p className="text-sm text-gray-500 mb-6">
        Select a safety form type to view or create entries
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {safetyCards.map((card, i) => {
          const Icon = card.icon;

          return (
            <div
              key={i}
              onClick={() => navigate(card.path)}
              className={`relative cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md hover:scale-[1.03] ${colorMap[card.color]}`}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-lg mb-4 ${colorMap[card.color]}`}
              >
                <Icon size={24} />
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-800">{card.title}</h3>

              {/* Description */}
              <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Safety;
