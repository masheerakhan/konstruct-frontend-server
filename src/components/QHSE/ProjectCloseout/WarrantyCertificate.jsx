import React, { useState } from "react";
import { FileText, Calendar, Building, User, Hash, Tag, Settings } from "lucide-react";

const WarrantyCertificate = () => {
    const [formData, setFormData] = useState({
        customerName: "",
        address: "",
        modelNo: "",
        serialNo: "",
        manufacturer: "",
        startDate: "",
        endDate: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const PreviewField = ({ label, value, width = "w-64" }) => (
        <div className="flex items-end mb-3">
            <span className="text-black font-medium whitespace-nowrap text-[13px]">{label}</span>
            <div className={`border-b border-gray-800 mx-2 text-center text-[14px] font-semibold text-black pb-0.5 ${width}`}>
                {value || "\u00A0"}
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 overflow-auto p-8 gap-8">

            {/* Page Header */}
            <div className="max-w-4xl w-full mx-auto">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                                Warranty Certificate
                            </h1>
                            <p className="text-sm text-gray-500">
                                Generate and issue warranty certificates for handed-over projects.
                            </p>
                        </div>
                    </div>
                </header>
            </div>

            {/* Input Form Section */}
            <div className="max-w-4xl w-full mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">Certificate Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <User size={16} className="text-gray-400" /> Customer Name
                        </label>
                        <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleChange}
                            placeholder="e.g. Acme Corp"
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Building size={16} className="text-gray-400" /> Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="e.g. 123 Industrial Ave"
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Settings size={16} className="text-gray-400" /> Manufacturer
                        </label>
                        <input
                            type="text"
                            name="manufacturer"
                            value={formData.manufacturer}
                            onChange={handleChange}
                            placeholder="e.g. Horizon Industrial"
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Tag size={16} className="text-gray-400" /> Model No
                        </label>
                        <input
                            type="text"
                            name="modelNo"
                            value={formData.modelNo}
                            onChange={handleChange}
                            placeholder="e.g. MD-1000"
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Hash size={16} className="text-gray-400" /> Serial No
                        </label>
                        <input
                            type="text"
                            name="serialNo"
                            value={formData.serialNo}
                            onChange={handleChange}
                            placeholder="e.g. SN-89423984"
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" /> Start Date
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" /> End Date
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>

                </div>
            </div>

            {/* Live Preview Section */}
            <div className="max-w-4xl w-full mx-auto pb-12">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Live Preview</h2>
                    <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md shadow hover:bg-primary/90 transition-colors">
                        Download PDF
                    </button>
                </div>

                {/* Certificate Container */}
                <div className="w-full bg-[#f8f9fa] shadow-xl rounded-sm overflow-hidden relative flex flex-col" style={{ aspectRatio: "1.414 / 1", minHeight: "600px" }}>

                    {/* Top Wave */}
                    <svg className="absolute top-0 left-0 w-full z-0 h-[120px] pointer-events-none" viewBox="0 0 1000 120" preserveAspectRatio="none">
                        <path d="M0,0 L1000,0 L1000,30 Q400,120 0,70 Z" fill="#e5e7eb" />
                        <path d="M0,0 L1000,0 L1000,10 Q400,90 0,50 Z" fill="#1c1c1c" />
                    </svg>

                    {/* Bottom Wave */}
                    <svg className="absolute bottom-0 left-0 w-full z-0 h-[120px] pointer-events-none" viewBox="0 0 1000 120" preserveAspectRatio="none">
                        <path d="M0,120 L1000,120 L1000,50 Q600,-10 0,100 Z" fill="#e5e7eb" />
                        <path d="M0,120 L1000,120 L1000,70 Q600,30 0,120 Z" fill="#1c1c1c" />
                    </svg>

                    {/* Content Wrapper */}
                    <div className="relative z-10 flex-1 flex flex-col pt-24 pb-48 px-16">

                        {/* Header Area */}
                        <div className="flex justify-center items-center w-full mt-4">
                            <h1 className="text-[32px] font-serif font-bold text-black border-b-[3px] border-black inline-block pb-1 px-4">
                                Warranty Certificate
                            </h1>
                        </div>

                        {/* Form Fields Area */}
                        <div className="flex flex-col mt-4 w-full max-w-3xl ml-8">
                            <PreviewField label="Customer Name" value={formData.customerName} width="w-[280px]" />
                            <PreviewField label="Address" value={formData.address} width="w-[360px]" />

                            <div className="flex gap-6">
                                <PreviewField label="Model No." value={formData.modelNo} width="w-[160px]" />
                                <PreviewField label="Serial No." value={formData.serialNo} width="w-[180px]" />
                            </div>

                            <PreviewField label="Manufacturer" value={formData.manufacturer} width="w-[260px]" />

                            <div className="flex gap-6 mt-6">
                                <PreviewField label="Warranty Start Date" value={formData.startDate} width="w-[140px]" />
                                <PreviewField label="Warranty End Date" value={formData.endDate} width="w-[140px]" />
                            </div>
                        </div>

                        {/* Standard Paragraph */}
                        <div className="mt-8 px-12">
                            <p className="text-[13px] text-center text-black leading-relaxed font-medium">
                                We hereby guarantee and warrant all products owned. for the period time
                                the product in possession of the owner XYZ Limited will repair and replace
                                defective component which will be no additional charge to the product
                                owner.
                            </p>
                        </div>

                        {/* Footer Area */}
                        <div className="mt-auto flex justify-between items-end relative ml-8 mb-24 z-20">
                            <div className="flex flex-col gap-4 w-64">
                                <PreviewField label="Date" value="" width="w-full" />
                                <PreviewField label="Signature" value="" width="w-full" />
                            </div>

                            {/* Warranty Stamp */}
                            <div className="absolute right-4 -bottom-6 opacity-90 select-none pointer-events-none" style={{ transform: 'rotate(-20deg)' }}>
                                <div className="w-36 h-36 rounded-full border-[4px] border-double border-blue-800 flex items-center justify-center relative shadow-sm">
                                    <div className="w-32 h-32 rounded-full border-2 border-blue-800 flex items-center justify-center bg-blue-50/10">
                                        <div className="text-blue-800 font-black text-2xl tracking-widest uppercase flex flex-col items-center justify-center gap-1" style={{ transform: 'rotate(-5deg)' }}>
                                            <span className="text-[10px] tracking-[0.2em]">★★★★★</span>
                                            <span className="bg-[#f8f9fa] px-2 shadow-sm rounded">WARRANTY</span>
                                            <span className="text-[10px] tracking-[0.2em]">★★★★★</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarrantyCertificate;