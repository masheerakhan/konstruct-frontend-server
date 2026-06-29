import React, { useState } from "react";
import { FileText } from "lucide-react";
import HorizonLogo from "../Transmittal/assets/Horizon-logo.png";
import ContractorLogo from "../Transmittal/assets/contrctor-logo.png";


const CompletionHandoverCertificate = () => {
    const [formData, setFormData] = useState({
        clientName: "",
        projectName: "",
        vendorName: "",
        workOrderNo: "",
        dateOfIssue: "",
        initialWorkOrderAmount: "",
        amendedAmount: "",
        finalWorkOrderAmount: "",
        finalWorkCompletionAmount: "",
        projectCommencementDate: "",
        projectCompletionDate: "",
        dlpCompletionDate: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return dateStr.split("-").reverse().join("-");
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 overflow-auto p-4 md:p-8">
            {/* Page Header */}
            <div className="max-w-5xl w-full mx-auto mb-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                                Completion & Handover Certificate
                            </h1>
                            <p className="text-sm text-gray-500">
                                Generate and view the Certificate of Final Completion & Handover.
                            </p>
                        </div>
                    </div>
                </header>
            </div>

            {/* Input Form Section */}
            <div className="max-w-5xl w-full mx-auto bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Certificate Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Client Name</label>
                        <input
                            type="text"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            placeholder="Enter Client Name"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Project Name</label>
                        <input
                            type="text"
                            name="projectName"
                            value={formData.projectName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            placeholder="Enter Project Name"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Vendor Name</label>
                        <input
                            type="text"
                            name="vendorName"
                            value={formData.vendorName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            placeholder="Enter Vendor Name"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Work Order No</label>
                        <input
                            type="text"
                            name="workOrderNo"
                            value={formData.workOrderNo}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            placeholder="Enter Work Order No"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Date of Issues</label>
                        <input
                            type="date"
                            name="dateOfIssue"
                            value={formData.dateOfIssue}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Initial Work Order Amount</label>
                        <input
                            type="text"
                            name="initialWorkOrderAmount"
                            value={formData.initialWorkOrderAmount}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            placeholder="e.g. 50000"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Amended Amount</label>
                        <input
                            type="text"
                            name="amendedAmount"
                            value={formData.amendedAmount}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            placeholder="0"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Final Work Order Amount</label>
                        <input
                            type="text"
                            name="finalWorkOrderAmount"
                            value={formData.finalWorkOrderAmount}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            placeholder="Final Work Order Amount"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Final Work Completion Amount</label>
                        <input
                            type="text"
                            name="finalWorkCompletionAmount"
                            value={formData.finalWorkCompletionAmount}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            placeholder="Final Work Completion Amount"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Project Commencement Date</label>
                        <input
                            type="date"
                            name="projectCommencementDate"
                            value={formData.projectCommencementDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Project Completion Date</label>
                        <input
                            type="date"
                            name="projectCompletionDate"
                            value={formData.projectCompletionDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">DLP Completion Date</label>
                        <input
                            type="date"
                            name="dlpCompletionDate"
                            value={formData.dlpCompletionDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Live Preview Section */}
            <div className="max-w-5xl w-full mx-auto">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Live Document Preview</h2>

                {/* A4 Container */}
                <div className="bg-white shadow-lg mx-auto overflow-hidden relative" style={{ width: "210mm", minHeight: "297mm" }}>

                    <div className="px-10 py-12 flex flex-col h-full text-[13px] leading-relaxed text-black font-sans">

                        {/* Header Table Layout */}
                        <div className="grid grid-cols-12 border-[2px] border-black mb-8 items-stretch" style={{ minHeight: "100px" }}>
                            <div className="col-span-3 border-r-[2px] border-black flex items-center justify-center p-4">
                                <img src={HorizonLogo} alt="Horizon Industrial Parks" className="max-h-16 max-w-full object-contain" />
                            </div>
                            <div className="col-span-6 border-r-[2px] border-black flex items-center justify-center p-4">
                                <h1 className="text-base font-bold text-center leading-snug">CERTIFICATE OF FINAL COMPLETION & HANDOVER</h1>
                            </div>
                            <div className="col-span-3 flex items-center justify-center p-4">
                                <img src={ContractorLogo} alt="Contractor's Logo" className="max-h-16 max-w-full object-contain" />
                            </div>
                        </div>

                        {/* Key Value Grid */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-7 mb-12 font-bold">
                            {/* Row 1 */}
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">CLIENT NAME</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formData.clientName}</span></div>
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">Date of issues</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formatDate(formData.dateOfIssue)}</span></div>

                            {/* Row 2 */}
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">PROJECT NAME :</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formData.projectName}</span></div>
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">Initial Work order amount:</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formData.initialWorkOrderAmount}</span></div>

                            {/* Row 3 */}
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">VENDOR NAME :</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formData.vendorName}</span></div>
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">Ameded amount-0</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formData.amendedAmount}</span></div>

                            {/* Row 4 */}
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">WORK ORDER NO</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formData.workOrderNo}</span></div>
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">FINAL WORK ORDER AMOUNT-</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formData.finalWorkOrderAmount}</span></div>

                            {/* Row 5 - Blank on left, Final work completion on right */}
                            <div></div>
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">Final work completion amount:</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formData.finalWorkCompletionAmount}</span></div>

                            {/* Row 6 */}
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">PROJECT COMMENCEMENT DATE:-</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formatDate(formData.projectCommencementDate)}</span></div>
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">PROJECT COMPLETION DATE:-</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formatDate(formData.projectCompletionDate)}</span></div>

                            {/* Row 7 */}
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">DEFECT LIABILITY PERIOD:-</span><span className="font-normal pb-1 flex-1 min-h-[1.5rem]">12 months</span></div>
                            <div className="flex items-end gap-2"><span className="uppercase whitespace-nowrap">DLP COMPLETION DATE:-</span><span className="font-normal border-b border-gray-300 pb-1 flex-1 min-h-[1.5rem]">{formatDate(formData.dlpCompletionDate)}</span></div>
                        </div>

                        {/* Content Body */}
                        <div className="mb-12">
                            <h2 className="text-center font-bold underline mb-6 uppercase tracking-wide">CONTRACTORS CERTIFICATION</h2>

                            <p className="mb-4 text-justify">
                                I, the undersigned, certify that all the work in this project is completed according to the good for constructions drawings, Specification,BOQ & as per contract conditions and is carried out under my/our supervision .I /we certify that all the material (type & grade) and the workmanship of the work is been generally in accordance with the tender specifications.
                            </p>

                            <p className="text-justify">
                                All the required certificate, statutory compliance & other required data is fulfilled by me/ us. I / we certify that all the charges or bills for labours, material, machineries & other charges against the subcontractor have been paid in full & in accordance to the government laws & terms of the contract. No liens have been attached against the property of the said contract & we hereby idemnify the client of any such obligations. I further certify that I will be obliged & liable to rectify defects that appear after the project completion & upto the completion of Defect Liability period apart from any specific gurantees of the works specified. Any damages to the property,subsequent losses during DLP would be our respobsibility & I /we authorize client for the recovery of such damages.
                            </p>
                        </div>

                        {/* Contractor Signature block */}
                        <div className="mb-12">
                            <h3 className="font-bold mb-12 uppercase">CONTRACTOR SIGNATURE & STAMP</h3>
                            <div className="flex justify-between items-end pr-10">
                                <div>
                                    <div className="mb-4 font-bold"><span className="uppercase mr-2">NAME:-</span> <span className="font-normal inline-block w-48 border-b border-gray-300"></span></div>
                                    <div className="font-bold"><span className="uppercase mr-2">PLACE :-</span> <span className="font-normal inline-block w-48 border-b border-gray-300"></span></div>
                                </div>
                                <div className="font-bold"><span className="uppercase mr-2">DATE</span> <span className="font-normal inline-block w-32 border-b border-gray-300"></span></div>
                            </div>
                        </div>

                        {/* Client Acceptance block */}
                        <div className="mb-16">
                            <h2 className="text-center font-bold underline mb-6 uppercase tracking-wide">CLIENT PROJECT ACCEPETANCE</h2>
                            <p className="text-justify">
                                With reference to the above mentioned Project/Work & as per contractor certification herin mentioned above, I acknowledge that the work has been completed.
                            </p>
                        </div>

                        {/* Final Signature block */}
                        <div className="mt-auto pb-4">
                            <div className="flex justify-between items-end pr-10">
                                <h3 className="font-bold uppercase">PROJECT INCHARGE SIGNATURE & STAMP</h3>
                                <div className="font-bold"><span className="uppercase mr-2">DATE</span> <span className="font-normal inline-block w-32 border-b border-gray-300"></span></div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletionHandoverCertificate;