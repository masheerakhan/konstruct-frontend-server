import { Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import { getProjectsForCurrentUser } from "../../../api";
import FileUploadControl from "../../FileUploadControl";

const OBSERVATION_OPTIONS = ["Yes", "No", "NA"];

function todayInputDate() {
    return new Date().toISOString().slice(0, 10);
}

function newId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const AUDIT_SECTIONS = [
    {
        // title: "1. RESOURCE MANAGEMENT",
        groups: [
            {
                title: "1.1.A. Materials - A. Cement",
                rows: [
                    "Are silos/bins and the cement feeding area weatherproof?",
                    "When cement is supplied in bags, is the storage facility weatherproof, damp-proof, well ventilated and reasonably free from dust?",
                    "When cement is supplied in bulk, is there reasonably dust-free flow of cement into silo and further from silo to the mixer, indicating thereby that the loading and handling system permits free flow and efficient discharge of Cement?",
                    "When cement is supplied in bags, does the bag splitting unit and pneumatic pump/vertical screw conveyor permit reasonably dust-free flow of cement into silos and further from silo to the mixer?",
                    "Where storage is provided for different types of cement, is the storage sufficiently isolated to prevent intermingling or contamination?",
                    "Are there sign boards to indicate storage of different types of cement?",
                ],
            },
            {
                title:
                    "1.1.A. Materials - B. Supplementary Cementitious Materials (SCMs)",
                rows: [
                    "Is there a separate storage system for different types of SCMs?",
                    "Are silo/bag storage system for SCMs weatherproof?",
                    "Is the SCM loading and handling system permitting reasonably dust-free flow of the material into silos and then further from silos to the weighter? Are adequate precautions taken to ensure that correct quantity is introduced in the mixer without any loss?",
                    "Are there sign boards to indicate storage of different types of cementitious materials?",
                    "Is there a proper system to identify, storage and disposal of the rejected materials?",
                ],
            },
            {
                title: "1.1.A. Materials - C. Aggregates",
                rows: [
                    "Are there adequate provisions for separate storage for each size and type of aggregates so as to prevent mixing of different sizes and types?",
                    "Are there sign boards to indicate different sizes of aggregates?",
                    "Are adequate precautions taken during unloading and building of stockpiles of aggregates so as to prevent harmful segregation and breakage?",
                    "Are adequate precautions taken to prevent intermixing of aggregates with dust, soil and other deleterious materials?",
                    "Are adequate precautions taken to prevent contamination of different sizes and types of aggregates with each other?",
                    "Are the conveyance systems designed in such a way that the materials being conveyed is adequately protected against contamination, which may adversely affect the properties of the material within the concrete produced?",
                    "If temperature controlled concrete is being produced are provisions in place to control the temperature of the aggregates?",
                    "Is there a proper system to identify, storage and disposal of the rejected materials?",
                ],
            },
            {
                title: "1.1.A. Materials - D. Water",
                rows: [
                    "Is there adequate storage of water to satisfy the day-to-day needs?",
                    "Has the water storage facility been protected to minimize the risk of contamination of deleterious substances?",
                    "Are records available providing evidence that control on the temperature of water is exercised when producing temperature controlled concrete?",
                    "Whether recycled water is being used? If yes, are systems in place and in operation to accurately measure the use of water and to ensure the performance of the produced concrete mainly strength and workability is not adversely affected by its use?",
                ],
            },
            {
                title: "1.1.A. Materials - E. Chemical Admixtures",
                rows: [
                    "Are chemical admixtures stored properly to avoid contamination and degradation on exposure to direct sunlight?",
                    "Is there a provision for providing manually or automatically agitation to liquid admixtures that are not stable solutions?",
                    "Is the storage and handling system adequately protected to prevent freezing of admixtures during winter season?",
                    "Are adequate precautions taken to use admixtures before expiry date?",
                    "Does each container of admixture legibly marked with supplier's information Clause 10.1 of IS 9103?",
                    "Does additional printed information provided by supplier Clause 10.2 of IS 9103 available with the RMC facility?",
                    "Is there a proper system to identify, storage and disposal of the rejected materials established?",
                ],
            },
        ],
    },
    {
        title: "1.1.B. Batching and Mixing Control Equipment",
        groups: [
            {
                title: "A. Scales",
                rows: [
                    "For all types of batching systems, is the batch operator able to read the load indicating devices from his normal position?",
                    "Have the weigh scales preset in increments not exceeding 5 kg or less each for cement and mineral admixtures, 10 kg or less for aggregates and 2 kg or less for water? Clause E-1 (c) of Annex E of IS 4926",
                    "For continuous mixer plants, has the calibration been done in increments not exceeding 10 kg/m3 each for cement and mineral admixtures, 25 kg/m3 for aggregates and 10 lit/m3 for water? Clause E-1 (d) of Annex IS 4926",
                    "Do the digital read-outs have a scale increment not exceeding 2 kg each for cement and mineral admixtures, 10 kg for aggregate and 1 kg for water? Clause E-1 (e) of Annex E of IS 4926",
                    "Does a systematic recheck of scales carried out frequently at least once every 3 months for electrical/load cell system? Clause E-1 (j) of Annex E of IS 4926",
                    "Are adequate permanent facilities provided for the application of test weights to the weighing hopper or system? Clause E-1 (j) of Annex E of IS 4926",
                    "Have the load cells been protected to avoid ingress of moisture?",
                    "Are the personnel involved in the work of calibration of weighing equipment competent and adequately trained? Clause E-1 (p) of Annex E of IS 4926",
                ],
            },
            {
                title: "B. Weigh Batchers",
                rows: [
                    "Do the hoppers for weighing cement, aggregates, and also water and admixtures if measured by weight consist of suitable containers freely suspended from a load cell(s) or other weigh mechanism, and are they equipped with necessary charging and discharging mechanisms?",
                    "Are the scales and weigh hoppers used for cement and other cementitious materials independent of scales and weigh hoppers used for non-cementitious ingredients?",
                    "In cumulative weighing of cementitious materials, is the Portland cement weighed before the supplementary cementitious materials?",
                    "Are the hoppers capable of receiving maximum rated load without contact of the weighed material with the charging mechanism?",
                    "Are cement batchers provided with dust seal between charging mechanism and hopper, installed in such a way as not to affect weighing accuracy?",
                    "Are weigh hoppers adequately vented to permit escape of air without emission of cement dust?",
                    "Are hoppers self-cleaning and fitted with means to assure complete discharge?",
                    "Is the hopper charging mechanism capable of stopping flow of material within batching tolerances specified and preventing loss of material when closed?",
                    "Are vibrators or other equipment installed in such a way as not to affect accuracy of weighing?",
                    "Is wind/weather protection sufficient to prevent interference with weighing accuracy?",
                    "Does the process of weighing and discharge into the mixer happen without loss of materials?",
                ],
            },
            {
                title: "C. Batching Devices for Water",
                rows: [
                    "Are water meters/weigh batchers equipped with a cut-off device capable of stopping the flow within the tolerances specified?",
                    "If measured volumetrically, is water meter equipped with a volume-setting device capable of being set to increments at least as small as 1 liter or a register capable of being read to 1 liter or both?",
                    "Is the system capable of providing an indication, visible to the batch operator, of the volume/weight batched at any point in the metering/weighing operation?",
                ],
            },
            {
                title: "D. Accuracy for Plant Batcher Clause E-1 of Annex E IS 4926",
                rows: [
                    "The accuracy, sensitivity and arrangement of weighing devices shall be such as to enable the materials to be batched within the following tolerances Refer Table 9: Cement and mineral admixtures: Within ± 2 percent of the quantity of constituents being measured. Aggregate, chemical admixture and water: Within ± 3 percent of the quantity of constituent being measured.",
                    "Is there an appropriate system of finding aggregate moisture either manually or automatically to provide aggregate of fairly consistent moisture content to the batcher and to detect changes in the moisture content of aggregate?",
                    "Are appropriate procedures followed for adjustment of aggregate batch weights for changes in their moisture content?",
                ],
            },
            {
                title: "E. Central Mixer",
                rows: [
                    "Is the mixer capable of producing uniform concrete within the time specified in the operational manual of manufacturer Clause 9.1.4.2 of IS 4926?",
                    "In automated plants, is the mixer equipped with a timing device that will not permit the batch to be discharged before the pre-determined mixing time has elapsed?",
                    "Is the central mixer maintained in an efficient and clean condition?",
                    "Are the mixer drum and the mixer blades clean from appreciable accumulation of hardened concrete?",
                ],
            },
            {
                title: "F. Truck Mixer",
                rows: [
                    "Are the truck mixers maintained in an efficient and clean condition?",
                    "Are the mixer drum and the mixer blades free from appreciable accumulation of concrete?",
                    "Is the agitating mixer capable of operating at a maximum speed of 14 RPM?",
                ],
            },
        ],
    },
    {
        title: "1.1.C. Maintenance of RMC Plant",
        groups: [
            {
                title: "Maintenance",
                rows: [
                    "Does the organization establish and implement procedures for maintenance of plants equipment and facilities?",
                    "Does the organization replace the mixer blades and arms immediately if it is found that there is excessive wear of the same?",
                    "Are the blades of central mixer free of excessive wear? The wear of mixer blade shall be checked at the point of maximum drum diameter nearest to the drum head. The blade is considered excessively worn if height of the blade at this point, measured from the drum shell, is less than 2/3rd of the original radial height Clause 9.1.4.4 of IS 4926.",
                    "Does the organization ensure that proper upkeep and cleanliness are maintained in the plant?",
                    "Does the company take correction and corrective actions in case of detected anomalies?",
                    "Does the company follows HSE requirements?",
                    "Records of shut down / maintenance break down etc., are maintained by company?",
                ],
            },
        ],
    },
    {
        title: "1.2. Key Personnel",
        groups: [
            {
                title: "Key Personnel",
                rows: [
                    "Are the production and quality control functions handled by separate and responsible persons / teams of employees on the permanent roll of the Company/organization?",
                    "Does the Organization establish the competence map for key roles in the organizational chart affecting the product quality related with the following aspects: education, operational skills, specific knowledge?",
                    "Does the organization establish and implement systematic approach to evaluate people and identify gaps with the competence map?",
                    "Does the organization provides internal/external training or does it take any other actions to meet the competence requirement for each key role?",
                    "Does the Organization establish and deploy an approach for measuring the training activities effectiveness?",
                    "Does the organization ensure that personnel are aware and clearly understand the relevance of their activities to achieve the quality objectives?",
                    "Does the organization keep appropriate records on the level of education, training, skills and experience of its personnel, including personnel dedicated to outsourced processes?",
                    "Is the field technician duly trained in the taking samples and testing for slump and preparation of the test cubes?",
                    "Are the truck drivers adequately trained to administer admixture in concrete during transit?",
                ],
            },
        ],
    },
    {
        title: "2.0. Laboratory",
        groups: [
            {
                title: "Laboratory",
                rows: [
                    "Whether minimum testing facilities are available at RMC plant, as prescribed in tender conditions, if any?",
                    "If CTM facility is shared between more than one lab, mention the location of CTM.",
                    "Are the minimum testing equipment mentioned available in the lab attached to RMC facility as per tender condition?",
                    "Are testing equipment duly identified and labeled?",
                    "Are the equipment used for different tests in conformity with the requirements specified in different codes?",
                    "Are the tools and equipment used for carrying various tests maintained in neat and clean condition?",
                    "If the compressive strength test done on CTM located in its central lab at the nearby location, are the cube samples transferred with proper precautions and identification for standard curing in the central lab?",
                    "Does the curing tank have the facility of maintaining temperature of curing water at 27 ± 2 °C as per IS 1199?",
                    "Is the laboratory mixer kept in clean condition?",
                    "Are the testing equipment calibrated at the frequencies specified in relevant BIS?",
                    "Are documented testing procedures available in the laboratory?",
                    "Are the documented testing procedures displayed in laboratory for the guidance of operators/supervisors?",
                    "Are the testing procedures given in relevant codes or equipment Manufacturer's manual followed meticulously in day-to-day practice?",
                    "Are original or certified copies of relevant codes hard/soft format available in the laboratory in the current revision status?",
                ],
            },
        ],
    },
    {
        title: "3.0. Quality Control",
        groups: [
            {
                title: "3.1. Quality of Incoming Materials",
                rows: [
                    "Does the company/organization keep a dated record of sources of all materials?",
                    "Does the company/organization obtain and properly achieve test certificates on the key physical and chemical properties of cement, supplementary cementitious materials and chemical admixtures from the manufacturers for each consignment?",
                    "Does the Company/organization get the tests on key physical and chemical properties of the first consignment of cement done in NABL-accredited lab?",
                    "Does the organization control the compatibility between the chemical/physical properties of all constituent raw materials in particular admixture and cementitious materials and provide evidence of record regarding such control.",
                    "Does the company/organization analyze and make use of the various test data to ensure that all incoming materials conform to the BIS-specified threshold limits?",
                    "Does the Company/Organization have established and deployed procedures to identify all the products from reception raw materials throughout the production until the delivery fresh concrete and return phases, correlating them with the documents describing their characteristics?",
                    "Does the company/organization get the tests on key physical and chemical properties of the following ingredients done in NABL-accredited labs at least once in six month and maintain the records?",
                ],
            },
            {
                title: "3.2. Quality of Final Product i.e. Manufactured Concrete",
                rows: [
                    "Does the company/organization keep a dated record of grade-wise quantity of concrete produced?",
                    "Does the company performs tests on final products as per frequency specified in relevant BIS i.e. IS 456: 2000 & IS 4926?",
                    "Whether are tests records are maintained regularly and are traceable?",
                    "Whether acceptance criteria records are maintained like Standard deviation of concrete for compressive strength?",
                    "Whether the company has got the Mix Designs approved from competent authority?",
                    "Whether the concrete is produced as per approved Mix Design?",
                    "Does the Company/organization have the capability of converting the prescribed and designed mixes into batches for production?",
                    "Does the Company/organization keep records of prescribed and designed mixes in the specified format?",
                ],
            },
            {
                title: "3.3. Control of Non-Conforming Products",
                rows: [
                    "Does the organization ensure that the materials which do not conform to BIS requirements are identified and controlled to prevent their unintended use or delivery?",
                    "Are non-conforming materials rejected and not allowed to enter the plant?",
                    "In case non-conformity is observed after materials have been accepted, are these materials kept separate and entries made in the register?",
                    "Has the Company/organization authorized a person to take decisions on non-conforming materials and take corrective actions including making entries in the register?",
                    "Does the company/organization follow the practice of analyzing and reviewing the reasons leading to non-conformities and whether correct follow up actions taken?",
                ],
            },
            {
                title: "3.4. Control on Equipment and Measurements",
                rows: [
                    "Does the organization plan and conduct the calibration of all equipment and testing facilities as per requirement?",
                    "Are the measuring and testing equipment weighing balance, standard weights, sieves, proving ring of compression testing machine, etc. regularly calibrated?",
                    "Does the organization keep proper records of the calibration?",
                ],
            },
        ],
    },
];

function buildInitialRows() {
    const rows = [];

    AUDIT_SECTIONS.forEach((section, sectionIndex) => {
        section.groups.forEach((group, groupIndex) => {
            group.rows.forEach((particular, rowIndex) => {
                rows.push({
                    id: newId("rmc-audit"),
                    sectionTitle: section.title,
                    groupTitle: group.title,
                    srNo: rowIndex + 1,
                    sectionIndex,
                    groupIndex,
                    particular,
                    observation: "",
                    evidenceFiles: [],
                });
            });
        });
    });

    return rows;
}

export default function AuditChecklistRmcPlant({
    folderId,
    folderName = "Audit Checklist - RMC Plant",
}) {
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    const [header, setHeader] = useState({
        projectId: "",
        projectName: "",
        location: "Fetching location…",
        auditDate: todayInputDate(),
    });

    const [rows, setRows] = useState(() => buildInitialRows());
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadProjects() {
            setLoadingProjects(true);

            try {
                const res = await getProjectsForCurrentUser();
                const raw = Array.isArray(res?.data)
                    ? res.data
                    : res?.data?.results || [];

                const options = raw
                    .filter((project) => project?.id != null)
                    .map((project) => ({
                        id: String(project.id),
                        name:
                            project.name ||
                            project.project_name ||
                            project.project?.name ||
                            `Project ${project.id}`,
                    }));

                if (!active) return;

                setProjects(options);

                if (options.length > 0) {
                    setHeader((prev) => ({
                        ...prev,
                        projectId: prev.projectId || options[0].id,
                        projectName: prev.projectName || options[0].name,
                    }));
                }
            } catch (err) {
                if (active) {
                    setProjects([]);
                    toast.error("Failed to load projects.");
                }
            } finally {
                if (active) setLoadingProjects(false);
            }
        }

        loadProjects();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setHeader((prev) => ({ ...prev, location: "" }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    const data = await res.json();
                    const addr = data.address || {};

                    const locationText = [
                        addr.road || addr.pedestrian || addr.footway || "",
                        addr.suburb || addr.neighbourhood || addr.village || addr.town || "",
                        addr.city || addr.state_district || "",
                        addr.state || "",
                    ]
                        .filter(Boolean)
                        .join(", ");

                    setHeader((prev) => ({
                        ...prev,
                        location:
                            locationText ||
                            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                    }));
                } catch {
                    setHeader((prev) => ({
                        ...prev,
                        location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                    }));
                }
            },
            () => {
                setHeader((prev) => ({ ...prev, location: "Location unavailable" }));
            }
        );
    }, []);

    const groupedRows = useMemo(() => {
        const map = new Map();

        rows.forEach((row) => {
            const key = `${row.sectionTitle}__${row.groupTitle}`;

            if (!map.has(key)) {
                map.set(key, {
                    sectionTitle: row.sectionTitle,
                    groupTitle: row.groupTitle,
                    rows: [],
                });
            }

            map.get(key).rows.push(row);
        });

        return Array.from(map.values());
    }, [rows]);

    const updateRow = (rowId, patch) => {
        setRows((prev) =>
            prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
        );
    };

    const handleProjectChange = (projectId) => {
        const selectedProject = projects.find(
            (project) => project.id === projectId
        );

        setHeader((prev) => ({
            ...prev,
            projectId,
            projectName: selectedProject?.name || "",
        }));
    };

    const handleFilesChange = (rowId, files) => {
        const normalizedFiles = Array.isArray(files)
            ? files
            : Array.from(files || []);

        updateRow(rowId, {
            evidenceFiles: normalizedFiles,
        });
    };

    const handleDeleteFile = (rowId, indexToRemove) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;

                return {
                    ...row,
                    evidenceFiles: (row.evidenceFiles || []).filter(
                        (_, index) => index !== indexToRemove
                    ),
                };
            })
        );
    };

    const handleSubmit = async () => {
        if (!header.projectName) {
            toast.error("Please select project.");
            return;
        }

        if (!header.auditDate) {
            toast.error("Please select audit date.");
            return;
        }

        const unansweredCount = rows.filter((row) => !row.observation).length;

        if (unansweredCount > 0) {
            const proceed = window.confirm(
                `${unansweredCount} checklist points are still unanswered. Do you still want to submit?`
            );

            if (!proceed) return;
        }

        setSubmitting(true);

        try {
            const payload = {
                folderId,
                folderName,
                header,
                checklist: rows.map((row) => ({
                    sectionTitle: row.sectionTitle,
                    groupTitle: row.groupTitle,
                    srNo: row.srNo,
                    particular: row.particular,
                    observation: row.observation,
                    evidenceFiles: row.evidenceFiles || [],
                })),
            };

            console.log("RMC Plant Audit Checklist Payload:", payload);

            toast.success("RMC Plant audit checklist submitted.");
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit audit checklist.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 border-b border-gray-200 pb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Checklist for Audit of RMC Plant
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Fill project details and complete the audit checklist below.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Project
                        </label>
                        <select
                            value={header.projectId}
                            onChange={(event) => handleProjectChange(event.target.value)}
                            disabled={loadingProjects}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">
                                {loadingProjects ? "Loading projects..." : "Select project"}
                            </option>

                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Location
                        </label>
                        <input
                            type="text"
                            value={header.location}
                            onChange={(event) =>
                                setHeader((prev) => ({
                                    ...prev,
                                    location: event.target.value,
                                }))
                            }
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter RMC plant location"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Date
                        </label>
                        <input
                            type="date"
                            value={header.auditDate}
                            onChange={(event) =>
                                setHeader((prev) => ({
                                    ...prev,
                                    auditDate: event.target.value,
                                }))
                            }
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-900">
                        Audit Checklist
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="w-[8%] px-4 py-3 text-left font-semibold text-gray-600">
                                    Sr. No.
                                </th>
                                <th className="w-[52%] px-4 py-3 text-left font-semibold text-gray-600">
                                    Particulars
                                </th>
                                <th className="w-[16%] px-4 py-3 text-left font-semibold text-gray-600">
                                    Observations
                                </th>
                                <th className="w-[24%] px-4 py-3 text-left font-semibold text-gray-600">
                                    Evidence, if any
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {groupedRows.map((group, groupIndex) => (
                                <Fragment key={`${group.sectionTitle}-${group.groupTitle}-${groupIndex}`}>
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="border-y border-orange-200 bg-orange-100 px-4 py-3"
                                        >
                                            {group.sectionTitle && (
                                                <div className="mb-1 inline-flex rounded bg-orange-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                                                    {group.sectionTitle}
                                                </div>
                                            )}

                                            <div className="rounded-md border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm">
                                                {group.groupTitle}
                                            </div>
                                        </td>
                                    </tr>

                                    {group.rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-gray-100 align-top odd:bg-white even:bg-slate-50"
                                        >
                                            <td className="px-4 py-3 text-gray-600">
                                                {row.srNo}
                                            </td>

                                            <td className="px-4 py-3 text-gray-800">
                                                {row.particular}
                                            </td>

                                            <td className="px-4 py-3">
                                                <select
                                                    value={row.observation}
                                                    onChange={(event) =>
                                                        updateRow(row.id, {
                                                            observation: event.target.value,
                                                        })
                                                    }
                                                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    <option value="">Select</option>
                                                    {OBSERVATION_OPTIONS.map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="px-4 py-3">
                                                <FileUploadControl
                                                    files={row.evidenceFiles || []}
                                                    multiple
                                                    append
                                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                                    uploadLabel="Upload Evidence"
                                                    addMoreLabel="Add More"
                                                    onFilesChange={(files) =>
                                                        handleFilesChange(row.id, files)
                                                    }
                                                    onDelete={(index) => handleDeleteFile(row.id, index)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end border-t border-gray-200 px-5 py-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {submitting ? "Submitting..." : "Submit"}
                    </button>
                </div>
            </div>
        </div >
    );
}