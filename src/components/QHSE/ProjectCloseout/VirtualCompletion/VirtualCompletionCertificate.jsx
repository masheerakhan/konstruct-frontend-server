import React, { useState } from "react";
import { FileText } from "lucide-react";

const VirtualCompletionCertificate = () => {
    const [dateOfIssue, setDateOfIssue] = useState("");
    const [projectClient, setProjectClient] = useState("");

    const formattedDate = dateOfIssue
        ? dateOfIssue.split("-").reverse().join("-")
        : "";

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 overflow-auto p-8">

            {/* Page Header */}
            <div className="max-w-4xl w-full mx-auto mb-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                                Virtual Completion Certificate
                            </h1>
                            <p className="text-sm text-gray-500">
                                Generate and view virtual completion certificates for handing over documents.
                            </p>
                        </div>
                    </div>
                </header>
            </div>

            {/* Input Form Section */}
            <div className="max-w-4xl w-full mx-auto bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Certificate Details</h2>
                <div className="flex flex-row gap-6">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Issue
                        </label>
                        <input
                            type="date"
                            value={dateOfIssue}
                            onChange={(e) => setDateOfIssue(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project / Client
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Test Project / John Doe"
                            value={projectClient}
                            onChange={(e) => setProjectClient(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Live Rendered Letter Section */}
            <div className="max-w-4xl w-full mx-auto bg-white shadow-md border border-gray-300" style={{ minHeight: "1056px", padding: "1in" }}>

                {/* Header / Logo */}
                <div className="flex items-center mb-10">
                    <div className="flex items-center px-2 py-1">
                        {/* Mock Logo */}
                        <div className="flex text-2xl font-bold tracking-tight">
                            <span className="text-orange-500 mr-2" style={{ transform: "scaleX(1.5)" }}>▶</span>
                            <span className="text-[#008f51]">HORIZON</span>
                        </div>
                        <div className="flex flex-col ml-1 text-[11px] leading-none font-bold text-gray-700 tracking-wider">
                            <span>INDUSTRIAL</span>
                            <span>PARKS</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-[17px] font-bold text-black">Notification of Virtual Completion</h1>
                </div>

                {/* Date and Client */}
                <div className="mb-6 space-y-3 text-[14px] text-black font-bold">
                    <div className="flex items-center">
                        <span className="w-[140px] inline-block">Date of Issue :</span>
                        <span className="border-b border-black min-w-[300px] inline-block px-2 py-0.5 text-black font-normal h-6">
                            {formattedDate}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-[140px] inline-block">Project / Client :</span>
                        <span className="border-b border-black min-w-[300px] inline-block px-2 py-0.5 text-black font-normal h-6">
                            {projectClient}
                        </span>
                    </div>
                </div>

                {/* Body Paragraphs */}
                <div className="space-y-5 text-[14px] text-black leading-relaxed text-justify">
                    <p>
                        This is a notice of virtual completion of works to the extent that the area(s) handed over can be
                        utilized by The Client for the purpose it is intended. We hereby declare that the area(s) handed over
                        is ready for Beneficial Occupancy and the asset list is attached in Annexure I.
                    </p>
                    <p>
                        The works or portion of works to which this Notification applies has been inspected by authorized
                        representatives of The Client, Project Manager & the Architect and is hereby declared to be virtually
                        complete in accordance with the agreed Program (i.e. pre-determined Conditions of handover as
                        agreed with the Client).
                    </p>
                    <p>
                        The CONTRACTOR accepts & agrees to complete the pending works (if any) in the area(s) handed
                        over as per the contract. This certificate does not cease his obligations of performance under the
                        contract and the <span className="font-bold">defects liability period will commence only upon satisfactory deliverables from
                            CONTRACTOR & subsequent issue of Substantial Completion Certificate by the Project Manager.</span>
                    </p>
                    <p>
                        The Client however accepts responsibility for securing, operating, maintaining, insuring (subject to
                        their solicitation) and complete protection from all risks associated with its occupancy of the area(s)
                        handed over.
                    </p>
                    <p>
                        This notification is subject to the following terms and conditions:
                    </p>
                    <ol className="list-decimal pl-12 space-y-1">
                        <li>Closure of identified Pending Works by the CONTRACTOR in the area handed over prior to substantial completion</li>
                        <li>3 days notice to CLIENT in case of power shutdown or any interruption to operations in the area handed over for integration & synchronization purposes</li>
                        <li>Maintenance & Operation by CLIENT, of assets identified in the asset list (attached)</li>
                        <li>CONTRACTOR to obtain work permits to gain access & complete the pending works in the area(s) handed over</li>
                    </ol>
                </div>

                {/* Signatures */}
                <div className="mt-16 flex justify-between text-[14px] text-black leading-snug">
                    <div className="flex flex-col">
                        <span>Authorized Representative</span>
                        <span>For CONTRACTOR</span>
                    </div>
                </div>

                <div className="mt-16 flex justify-between text-[14px] text-black leading-snug">
                    <div className="flex flex-col">
                        <span>Authorized Representative</span>
                        <span>For XXXXXXXXXXXXXXXX</span>
                    </div>
                    <div className="flex flex-col pr-24">
                        <span>Authorized Representative</span>
                        <span>For Client</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-24 flex justify-between text-[12px] text-gray-500 font-medium">
                    <span>Page 1 of 1</span>
                    <span>Classified as Business</span>
                </div>

            </div>
        </div>
    );
};

export default VirtualCompletionCertificate;