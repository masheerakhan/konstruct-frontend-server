import re

file_path = 'c:/TY/Digielves Internship/konstruct world/frontend/FE-Konstruct/src/containers/setup/Housekeeping_setup/HousekeepingReportTemplate.jsx'
out_path = 'c:/TY/Digielves Internship/konstruct world/frontend/FE-Konstruct/src/containers/setup/Safety_setup/ObservationReportTemplate.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace HousekeepingReportTemplate with ObservationReportTemplate
content = content.replace('HousekeepingReportTemplate', 'ObservationReportTemplate')
# Replace createHousekeepingTemplate with createSafetyTemplate? Actually the function should probably be createObservationTemplate, wait, no, the imports have createHousekeepingTemplate which is used for observation right now.
# Wait, in HousekeepingReportTemplate, it imports createHousekeepingTemplate.
# In SafetyWizard, it does:
# if (isObservationFlow) { formData.append("template_type", "OBSERVATION"); await createHousekeepingTemplate(formData); }
# So HousekeepingReportTemplate is correct for API. But wait, ObservationReportTemplate is just a preview component for Admin, so the Create Template button won't even be shown.

# Add INITIAL_OBSERVATION_QUESTIONS and renderCardUI at the top
import_str = '''import {
  buildHeaderPreviewRows,
  buildHeaderFieldsFromLegacyMeta,
} from "./safetyHeaderFields";'''
inject_str = '''
const INITIAL_OBSERVATION_QUESTIONS = [
    { id: "obs-1", title: "1. WHAT UNSAFE ACT / CONDITION OBSERVED-", type: "dropdown_with_secondary", options: ["UNSAFE ACT & CONDITION OBSERVED"] },
    { id: "obs-2", title: "2. LOCATION-", type: "location_combined" },
    { id: "obs-3", title: "3. PHOTOGRAPH OF UNSAFE ACT / CONDITION-", type: "file_upload" },
    { id: "obs-4", title: "4. HAZARD/RISK-", type: "hazard_risk_combined", options: ["1. Physical Hazard", "2. Biological Hazard", "3. Chemical Hazard", "4. Mechanical Hazard", "5. Ergonomical Hazard", "6. Environmental Hazard", "7. Psychological Hazard", "8. Electrical Hazard", "9. Fire/Explosion Hazard"] },
    { id: "obs-5", title: "5. NAME OF CONTRACTOR-", type: "contractor_dropdown" },
    { id: "obs-6", title: "6. TARGET DATE-", type: "date" },
    { id: "obs-7", title: "7. CA/PA TO BE TAKEN-", type: "ca_pa_combined" },
    { id: "obs-8", title: "8. CLOSER PHOTOGRAPH-", type: "file_upload" }
];

const renderCardUI = (q) => {
    switch (q.id) {
        case "obs-1":
            return (
                <div className="space-y-3">
                    <select disabled className="w-full max-w-sm rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                        <option>UNSAFE ACT & CONDITION OBSERVED</option>
                    </select>
                    <input disabled placeholder="Short answer text" className="w-full max-w-sm rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                </div>
            );
        case "obs-2":
            return (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 max-w-xl">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Wing</label>
                            <select disabled className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                                <option>A - G</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Floor</label>
                            <select disabled className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                                <option>BASEMENT 2 - TERRACE</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Flat/Area</label>
                            <input disabled placeholder="Text input" className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Combined Location</label>
                        <input disabled placeholder="Combined textbox" className="w-full max-w-xl rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                    </div>
                </div>
            );
        case "obs-3":
        case "obs-8":
            return (
                <div className="flex max-w-xs items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Upload file here or take a picture
                </div>
            );
        case "obs-4":
            return (
                <div className="space-y-5">
                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-3 block">Hazard (Checkboxes)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                            {(q.options || []).map(opt => (
                                <div key={opt} className="flex items-center gap-3">
                                    <input type="checkbox" disabled className="h-4 w-4 shrink-0 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-not-allowed" />
                                    <span className="text-sm text-gray-700">{opt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-2">
                        <label className="text-sm font-medium text-gray-500 mb-2 block">Risk</label>
                        <input disabled placeholder="Textbox for risk" className="w-full max-w-md rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                </div>
            );
        case "obs-5":
            return (
                <select disabled className="w-full max-w-sm rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    <option>Select Contractor...</option>
                </select>
            );
        case "obs-6":
            return (
                <input disabled type="date" className="max-w-xs rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
            );
        case "obs-7":
            return (
                <div className="space-y-3 max-w-xl">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Corrective Action</label>
                        <input disabled placeholder="User input as textbox" className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Preventive Action</label>
                        <input disabled placeholder="User input as textbox" className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Final Combined</label>
                        <textarea disabled placeholder="Final textbox will show these two inputs along with these two texts" className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" rows={3} />
                    </div>
                </div>
            );
        default:
            return null;
    }
};
'''

content = content.replace(import_str, import_str + inject_str)

# Replace table with observation cards
# The table starts at {/* Checklist Table - bg-accent style (dark grey header) */}
table_start_marker = '{/* Checklist Table - bg-accent style (dark grey header) */}'
table_start_idx = content.find(table_start_marker)

# Replace everything from table_start_marker to the closing </div> of that container
replacement = '''{/* Observation Cards */}
        {INITIAL_OBSERVATION_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="relative rounded-2xl bg-white border border-orange-100 shadow-sm p-6 mb-6">
                <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow">
                    {idx + 1}
                </div>
                <div className="space-y-4">
                    <p className="text-base font-medium text-gray-900 pr-4">
                        {q.title}
                    </p>
                    <div className="py-2 pl-2">
                        {renderCardUI(q)}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}

export default ObservationReportTemplate;
'''
content = content[:table_start_idx] + replacement

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
