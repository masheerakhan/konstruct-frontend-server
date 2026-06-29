import React from "react";
import { X } from "lucide-react";

export default function RiskMatrixModal({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Risk Matrix Reference</h2>
                        <p className="text-sm text-slate-500">Guide for evaluating risk levels</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-6 flex justify-center items-center">
                    <img 
                        src={`${process.env.PUBLIC_URL}/risk_matrix.png`} 
                        alt="Risk Matrix" 
                        className="w-full h-auto object-contain rounded-lg shadow-sm border border-slate-200"
                    />
                </div>
            </div>
        </div>
    );
}
