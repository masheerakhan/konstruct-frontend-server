import React from "react";
import {
  Building2,
  Building,
  MapPin,
  Search,
  Plus,
  Edit3,
  Trash2,
  Check,
  ChevronRight,
} from "lucide-react";
import {
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationDetailsById,
  createCompany,
  getCompanyDetailsById,
  createEntity,
  updateCompany,
  updateEntity,
} from "../../api";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { setOrganization as setOrganizationAction } from "../../store/userSlice";
import { useTheme } from "../../ThemeContext";

// --- PINCODE LOOKUP FUNCTION ---
async function getDetailsByPincode(pincode) {
  if (!pincode || pincode.length !== 6) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (
      data[0]?.Status === "Success" &&
      data[0].PostOffice &&
      data[0].PostOffice.length > 0
    ) {
      const office = data[0].PostOffice[0];
      return {
        country: office.Country || "",
        state: office.State || "",
        region: office.District || "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

const UserSetup = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.user.user.id);
  const { theme, toggleTheme } = useTheme();

  // --- Get userData from localStorage (adjust if from Redux) ---
  let userData = null;
  try {
    userData = JSON.parse(localStorage.getItem("USER_DATA"));
  } catch {
    userData = null;
  }
  const isSuperadmin = userData?.superadmin;
  const isAdminOrClient = userData?.is_staff || userData?.is_client;
  const canEditOrg = !!isSuperadmin; // ONLY superadmin can add/edit/delete

  // State
  const [setup, setSetup] = React.useState("organization");
  const [organizationDetails, setOrganizationDetails] = React.useState([]);
  const [orgForm, setOrgForm] = React.useState({ organization_name: "" });
  const [editingOrg, setEditingOrg] = React.useState(null);
  const [editingName, setEditingName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [selectedOrgId, setSelectedOrgId] = React.useState(null);
  const [orgSearch, setOrgSearch] = React.useState("");
  const [companySearch, setCompanySearch] = React.useState(""); //Company search state
  const [entitySearch, setEntitySearch] = React.useState("");
  const [companyDetails, setCompanyDetails] = React.useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(null);
  const [isCompanyEditMode, setIsCompanyEditMode] = React.useState(false);
  const [originalCompanyForm, setOriginalCompanyForm] = React.useState(null);
  const [companyForm, setCompanyForm] = React.useState({
    name: "",
    entity_name: "",
    country: "",
    state_name: "",
    region: "",
    zone_name: "",
    sub_domain: "",
    pincode: "",
  });
  const [selectedEntityOrgId, setSelectedEntityOrgId] = React.useState(null);
  const [selectedEntityCompanyId, setSelectedEntityCompanyId] =
    React.useState(null);
  const [selectedEntityOrg, setSelectedEntityOrg] = React.useState(null);
  const [selectedEntityCompany, setSelectedEntityCompany] =
    React.useState(null);
  const [entityForm, setEntityForm] = React.useState({
    name: "",
    state: "",
    region: "",
    zone: "",
  });
const [companiesLoading, setCompaniesLoading] = React.useState(false);
const [companyEntities, setCompanyEntities] = React.useState([]);
const [entityOrganizations, setEntityOrganizations] = React.useState([]);
const [entityCompanies, setEntityCompanies] = React.useState([]);

const [selectedEntityId, setSelectedEntityId] = React.useState(null);
const [isEntityEditMode, setIsEntityEditMode] = React.useState(false);
const [originalEntityForm, setOriginalEntityForm] = React.useState(null);
  // API handlers
  // const fetchOrganizations = async () => {
  //   try {
  //     const response = await getOrganizationDetailsById(userId);
  //     setOrganizationDetails(Array.isArray(response.data) ? response.data : []);
  //   } catch {
  //     setOrganizationDetails([]);
  //   }
  // };

  const fetchOrganizations = async () => {
    try {
      const response = await getOrganization();
      setOrganizationDetails(Array.isArray(response.data) ? response.data : []);
    } catch {
      setOrganizationDetails([]);
    }
  };

  const fetchCompanies = async (orgId) => {
    if (!orgId) {
      setCompanyDetails([]);
      return;
    }

    setCompaniesLoading(true);

    try {
      const response = await getCompanyDetailsById(orgId);

      if (response.data && response.data.data && response.data.data.company) {
        setCompanyDetails(response.data.data.company);
      } else {
        setCompanyDetails([]);
      }
    } catch {
      setCompanyDetails([]);
    } finally {
      setCompaniesLoading(false);
    }
  };
  // const local = "192.168.29.79:8002/api";
  const local = "192.168.29.79:8002/api";

  // const fetchEntityStepInfo = async () => {
  //   try {
  //     const response = await axios.get(
  //       `https://konstruct.world/organizations/user-orgnizationn-info/${userId}/`,
  //       // `http://${local}/user-orgnizationn-info/${userId}/`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
  //         },
  //       },
  //     );
  //     setEntityStepOrgs(
  //       Array.isArray(response.data.organizations)
  //         ? response.data.organizations
  //         : [],
  //     );
  //     setEntityStepCompanies(
  //       Array.isArray(response.data.companies) ? response.data.companies : [],
  //     );
  //   } catch {
  //     setEntityStepOrgs([]);
  //     setEntityStepCompanies([]);
  //   }
  // };

  const fetchCompanyEntities = async (companyId) => {
    if (!companyId) {
      setCompanyEntities([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://konstruct.world/organizations/entities/by-company/${companyId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
          },
        },
      );

      setCompanyEntities(Array.isArray(response.data) ? response.data : []);
    } catch {
      setCompanyEntities([]);
    }
  };

  React.useEffect(() => {
    if (setup === "organization" || setup === "company") fetchOrganizations();
  }, [setup, userId]);
  React.useEffect(() => {
    if (setup === "company" && selectedOrgId) fetchCompanies(selectedOrgId);
  }, [setup, selectedOrgId]);

  React.useEffect(() => {
    setEntityOrganizations(organizationDetails);
  }, [organizationDetails]);

  // React.useEffect(() => {
  //   if (selectedEntityOrgId) {
  //     const filtered = companyDetails.filter(
  //       (c) => Number(c.organization) === Number(selectedEntityOrgId),
  //     );

  //     setEntityCompanies(filtered);
  //   } else {
  //     setEntityCompanies([]);
  //   }
  // }, [selectedEntityOrgId, companyDetails]);

  React.useEffect(() => {
    setEntityCompanies(companyDetails || []);
  }, [companyDetails]);

  // Organization handlers
  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createOrganization({
        ...orgForm,
        created_by: userId,
        active: true,
      });
      toast.success("Organization added!");
      setOrganizationDetails((prev) => [
        { id: response.data.id, organization_name: orgForm.organization_name },
        ...prev,
      ]);
      setOrgForm({ organization_name: "" });
      setEditingOrg(null);
    } catch (error) {
      if (
        error?.response?.data?.non_field_errors &&
        error.response.data.non_field_errors[0]?.includes(
          "must make a unique set",
        )
      ) {
        toast.error(
          "This organization already exists for this user. Please select it.",
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create organization.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = (org) => {
    // Reset company lists/entities
    setCompanyDetails([]);
    setCompanyEntities([]);

    // Reset selected company states
    setSelectedCompanyId(null);

    setSelectedEntityOrgId(null);
    setSelectedEntityCompanyId(null);

    setSelectedEntityOrg(null);
    setSelectedEntityCompany(null);

    // Reset entity companies
    setEntityCompanies([]);

    // Reset company form completely
    setCompanyForm({
      name: "",
      entity_name: "",
      country: "",
      state_name: "",
      region: "",
      zone_name: "",
      sub_domain: "",
      pincode: "",
    });

    // Reset edit mode
    setOriginalCompanyForm(null);
    setIsCompanyEditMode(false);

    // Reset entity form
    setEntityForm({
      name: "",
      state: "",
      region: "",
      zone: "",
    });

    // Set new org
    setSelectedOrgId(org.id);

    dispatch(setOrganizationAction(org.id));
  };

  const handleEditOrg = (org) => {
    setEditingOrg(org.id);
    setEditingName(org.organization_name);
  };
  const handleUpdateOrg = async (org) => {
    if (!editingName.trim()) {
      toast.error("Organization name cannot be empty.");
      return;
    }
    try {
      await updateOrganization(org.id, { organization_name: editingName });
      toast.success("Organization updated!");
      setEditingOrg(null);
      setEditingName("");
      setOrganizationDetails((prev) =>
        prev.map((item) =>
          item.id === org.id
            ? { ...item, organization_name: editingName }
            : item,
        ),
      );
      fetchOrganizations();
    } catch (error) {
      toast.error("Error updating organization");
    }
  };
  const handleDeleteOrg = async (org) => {
    if (
      !window.confirm(
        `Delete organization "${org.organization_name}"? This cannot be undone!`,
      )
    )
      return;
    try {
      await deleteOrganization(org.id);
      toast.success("Organization deleted!");
      setOrganizationDetails((prev) =>
        prev.filter((item) => item.id !== org.id),
      );
      fetchOrganizations();
    } catch (error) {
      toast.error("Error deleting organization");
    }
  };

  // --- PINCODE LOGIC for COMPANY FORM ---
  const handleCompanyPincodeChange = async (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCompanyForm((prev) => ({ ...prev, pincode: val }));
    if (val.length === 6) {
      const details = await getDetailsByPincode(val);
      if (details) {
        setCompanyForm((form) => ({
          ...form,
          country: details.country,
          state_name: details.state,
          region: details.region,
          pincode: val,
        }));
      }
    }
  };

  const hasCompanyChanges = () => {
  if (!originalCompanyForm) return false;

  return JSON.stringify(companyForm) !==
    JSON.stringify(originalCompanyForm);
};

const hasEntityChanges = () => {
  if (!originalEntityForm) return false;

  return JSON.stringify(entityForm) !== JSON.stringify(originalEntityForm);
};
  // Company handlers
  // const handleCompanySubmit = async (e) => {
  //   e.preventDefault();
  //   if (!selectedOrgId) {
  //     toast.error("Select organization first.");
  //     return;
  //   }
  //   if (companyForm.pincode && !/^\d{6}$/.test(companyForm.pincode)) {
  //     toast.error("Please enter a valid 6-digit pincode.");
  //     return;
  //   }
  //   try {
  //     const response = await createCompany({
  //       ...companyForm,
  //       organization: selectedOrgId,
  //       created_by: userId,
  //     });
  //     // if (response.status === 200 && response.data.data) {
  //     //   toast.success(response.data.message || "Company created!");
  //     //   setCompanyForm({
  //     //     name: "",
  //     //     entity_name: "",
  //     //     country: "",
  //     //     state_name: "",
  //     //     region: "",
  //     //     zone_name: "",
  //     //     sub_domain: "",
  //     //     pincode: "",
  //     //   });
  //     //   setSetup("entity");
  //     //   setSelectedEntityOrgId(selectedOrgId);
  //     //   setSelectedEntityCompanyId(response.data.data.id);
  //     //   // fetchEntityStepInfo();
  //     // }
  //   } catch (error) {
  //     if (
  //       error?.response?.data?.non_field_errors &&
  //       error.response.data.non_field_errors[0]?.includes(
  //         "must make a unique set",
  //       )
  //     ) {
  //       toast.error(
  //         "A company with this name already exists for the selected organization. Please use a different name or select the existing company.",
  //       );
  //     } else {
  //       toast.error(error.response?.data?.message || "Error creating company.");
  //     }
  //   }
  // };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrgId) {
      toast.error("Select organization first.");
      return;
    }

    if (companyForm.pincode && !/^\d{6}$/.test(companyForm.pincode)) {
      toast.error("Please enter a valid 6-digit pincode.");
      return;
    }

    try {
      const response = await createCompany({
        ...companyForm,
        organization: selectedOrgId,
        created_by: userId,
      });

      const createdCompany = response?.data?.data || response?.data;

      toast.success("Company created successfully!");

      setCompanyForm({
        name: "",
        entity_name: "",
        country: "",
        state_name: "",
        region: "",
        zone_name: "",
        sub_domain: "",
        pincode: "",
      });

      await fetchCompanies(selectedOrgId);

      const org = organizationDetails.find(
        (o) => Number(o.id) === Number(selectedOrgId),
      );

      setSelectedCompanyId(createdCompany.id);

      setSelectedEntityOrgId(selectedOrgId);
      setSelectedEntityCompanyId(createdCompany.id);

      setSelectedEntityOrg(org || null);
      setSelectedEntityCompany(createdCompany);
      setIsCompanyEditMode(false);
      setOriginalCompanyForm(null);

      setSetup("entity");
    } catch (error) {
      if (
        error?.response?.data?.non_field_errors &&
        error.response.data.non_field_errors[0]?.includes(
          "must make a unique set",
        )
      ) {
        toast.error("Company already exists for this organization.");
      } else {
        toast.error(error.response?.data?.message || "Error creating company.");
      }
    }
  };

  const handleContinueToEntity = async () => {
  if (!selectedCompanyId) {
    toast.error("Please select a company.");
    return;
  }

  try {
    if (hasCompanyChanges()) {
      await updateCompany(selectedCompanyId, companyForm);

      toast.success("Company updated successfully!");

      await fetchCompanies(selectedOrgId);
    }

    setSetup("entity");
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to update company.",
    );
  }
};

  const [setupCompleted, setSetupCompleted] = React.useState(false);
  // Entity handlers
  const handleEntitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedEntityCompanyId) {
      toast.error("Please select a company first.");
      return;
    }
    const payload = {
      ...entityForm,
      company: selectedEntityCompanyId,
      created_by: userId,
    };

    try {
      // UPDATE MODE
      if (isEntityEditMode && selectedEntityId) {
        await updateEntity(selectedEntityId, entityForm);

        toast.success("Entity updated successfully!");

        fetchCompanyEntities(selectedEntityCompanyId);

        setIsEntityEditMode(false);
        setSelectedEntityId(null);

        setEntityForm({
          name: "",
          state: "",
          region: "",
          zone: "",
        });

        return;
      }

      // CREATE MODE
      const response = await createEntity(payload);

      if (response.status === 200 && response.data.success) {
        toast.success(
          `Setup successful! Organization: ${
            selectedEntityOrg?.organization_name || ""
          }`,
        );

        fetchCompanyEntities(selectedEntityCompanyId);

        setEntityForm({
          name: "",
          state: "",
          region: "",
          zone: "",
        });

        setSetupCompleted(true);
      } else {
        toast.error(response.data.message || "Error creating entity.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unexpected error creating entity.",
      );
    }
  };

  // Filtering
// const filteredCompaniesForEntity = selectedEntityOrgId
//   ? entityStepCompanies.filter(
//       (c) => Number(c.organization) === Number(selectedEntityOrgId),
//     )
//   : [];

  // const filteredOrgs = organizationDetails.filter((org) =>
  //   org.organization_name.toLowerCase().includes(orgSearch.toLowerCase()),
  // );
const filteredOrgs = organizationDetails
  .filter((org) =>
    org.organization_name.toLowerCase().includes(orgSearch.toLowerCase()),
  )
  .sort((a, b) => {
    if (a.id === selectedOrgId) return -1;
    if (b.id === selectedOrgId) return 1;
    return 0;
  });

  // const filteredCompanies = companyDetails.filter((comp) =>
  //   comp.name.toLowerCase().includes(companySearch.toLowerCase()),
  // );
  const filteredCompanies = companyDetails
    .filter((comp) =>
      comp.name.toLowerCase().includes(companySearch.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.id === selectedCompanyId) return -1;
      if (b.id === selectedCompanyId) return 1;
      return 0;
    });

  const filteredCompaniesForEntity = entityCompanies
    .filter((comp) =>
      comp.name.toLowerCase().includes(companySearch.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.id === selectedEntityCompanyId) return -1;
      if (b.id === selectedEntityCompanyId) return 1;
      return 0;
    });

    const filteredEntityList = companyEntities.filter((entity) =>
      entity.name.toLowerCase().includes(entitySearch.toLowerCase()),
    );
  // THEME palette
  const ORANGE = "#ffbe63";
  const BG_OFFWHITE = "#fcfaf7";
  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardColor = theme === "dark" ? "#23232c" : "#fff";
  const borderColor = ORANGE;
  const textColor = theme === "dark" ? "#fff" : "#222";
  const iconColor = ORANGE;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center py-0 px-0"
      style={{ background: bgColor, transition: "background 0.3s" }}
    >
      {/* Sticky Stepper */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: bgColor,
          borderBottom: `1px solid ${ORANGE}22`,
          width: "100%",
          marginBottom: "36px",
          paddingTop: "32px",
        }}
        className="flex flex-col items-center"
      >
        {/* Theme Toggle */}
        <div className="flex justify-end w-full max-w-5xl mb-2 pr-6"></div>
        {/* Stepper */}
        {/* <div className="flex items-center gap-6 justify-center w-full max-w-4xl mb-8">
          {[
            { key: "organization", label: "Setup Organization", icon: Building2 },
            { key: "company", label: "Setup Company", icon: Building },
            { key: "entity", label: "Setup Entity", icon: MapPin },
          ].map((step) => {
            const Icon = step.icon;
            const isActive = setup === step.key;
            const isPast = ["organization", "company", "entity"].findIndex(s => s === setup) > ["organization", "company", "entity"].findIndex(s => s === step.key);
            return (
              <button
                key={step.key}
                onClick={() => setSetup(step.key)}
                className="group flex flex-col items-center px-2 py-2 focus:outline-none"
                style={{
                  transform: isActive ? "scale(1.07)" : "scale(1)",
                  transition: "transform 0.2s",
                }}
              >
                <div
                  className="relative rounded-2xl flex items-center justify-center mb-2 transition-all duration-300"
                  style={{
                    width: 52,
                    height: 52,
                    background: isActive || isPast ? ORANGE : cardColor,
                    color: isActive || isPast ? "#fff" : iconColor,
                    boxShadow: isActive
                      ? "0 4px 24px #ffbe6333"
                      : isPast
                        ? "0 2px 12px #ffbe6322"
                        : "none",
                    border: `2px solid ${ORANGE}`,
                  }}
                >
                  {isPast && !isActive ? (
                    <Check className="w-7 h-7" style={{ color: "#fff" }} />
                  ) : (
                    <Icon className="w-7 h-7" style={{ color: isActive || isPast ? "#fff" : ORANGE }} />
                  )}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse"></div>
                  )}
                </div>
                <span
                  className="text-xs font-semibold tracking-wide"
                  style={{
                    color: ORANGE,
                    fontWeight: isActive ? "bold" : "normal",
                  }}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div> */}

        <div className="flex items-center gap-6 justify-center w-full max-w-4xl mb-8">
          {[
            {
              key: "organization",
              label: "Setup Organization",
              icon: Building2,
            },
            { key: "company", label: "Setup Company", icon: Building },
            { key: "entity", label: "Setup Entity", icon: MapPin },
          ].map((step) => {
            const Icon = step.icon;
            const isActive = setup === step.key;
            let disabled = false;
            if (!setupCompleted) {
              if (step.key === "organization") {
                disabled = false;
              } else if (step.key === "company") {
                disabled = !selectedOrgId;
              } else if (step.key === "entity") {
                // NEW LOGIC:
                // const hasCompanies =
                //   companyDetails && companyDetails.length > 0;
                // disabled = !(selectedEntityCompanyId || hasCompanies);
                disabled = !selectedOrgId;
              }
            }
            return (
              <button
                key={step.key}
                onClick={() => {
                  if (!disabled) setSetup(step.key);
                }}
                className="group flex flex-col items-center px-2 py-2 focus:outline-none"
                style={{
                  opacity: disabled ? 0.5 : 1,
                  pointerEvents: disabled ? "none" : "auto",
                  cursor: disabled ? "not-allowed" : "pointer",
                  transform: isActive ? "scale(1.07)" : "scale(1)",
                  transition: "transform 0.2s",
                }}
                disabled={disabled}
              >
                <div
                  className="relative rounded-2xl flex items-center justify-center mb-2 transition-all duration-300"
                  style={{
                    width: 52,
                    height: 52,
                    background: isActive ? ORANGE : cardColor,
                    color: isActive ? "#fff" : iconColor,
                    boxShadow: isActive ? "0 4px 24px #ffbe6333" : "none",
                    border: `2px solid ${ORANGE}`,
                  }}
                >
                  <Icon
                    className="w-7 h-7"
                    style={{ color: isActive ? "#fff" : ORANGE }}
                  />
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse"></div>
                  )}
                </div>
                <span
                  className="text-xs font-semibold tracking-wide"
                  style={{
                    color: ORANGE,
                    fontWeight: isActive ? "bold" : "normal",
                  }}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Form Content */}
      <div
        className="w-full flex flex-col items-center justify-center py-8 px-4"
        style={{ minHeight: "60vh" }}
      >
        {/* --- ORGANIZATION STEP --- */}
        {setup === "organization" && (
          <div
            className="shadow-2xl border rounded-3xl px-8 py-10 flex flex-col items-center w-full max-w-3xl relative overflow-hidden"
            style={{
              background: cardColor,
              border: `1.5px solid ${borderColor}`,
              color: textColor,
              minHeight: 400,
            }}
          >
            {/* Search bar */}
            <div className="relative w-full max-w-xl mb-8">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: iconColor }}
              />
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="w-full rounded-2xl pl-10 pr-4 py-3 border"
                style={{
                  borderColor: ORANGE,
                  background: theme === "dark" ? "#191922" : "#f8f7fa",
                  color: textColor,
                }}
                placeholder="Search organizations..."
              />
            </div>
            {/* Organization Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mb-8 min-h-[180px]">
              {filteredOrgs.length === 0 && orgSearch && (
                <div
                  className="col-span-full text-center text-lg py-12"
                  style={{ color: ORANGE }}
                >
                  No organizations found
                </div>
              )}
              {filteredOrgs.map((org) => (
                <div
                  key={org.id}
                  onClick={() => handleSelectOrg(org)}
                  className="relative p-4 rounded-2xl cursor-pointer transition-all duration-300 group"
                  style={{
                    background: selectedOrgId === org.id ? ORANGE : cardColor,
                    color: selectedOrgId === org.id ? "#fff" : textColor,
                    border: `2px solid ${ORANGE}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2
                        className="w-5 h-5"
                        style={{ color: ORANGE }}
                      />
                      <span className="font-semibold">
                        {org.organization_name}
                      </span>
                    </div>
                    {selectedOrgId === org.id && (
                      <Check className="w-5 h-5" style={{ color: "#fff" }} />
                    )}
                  </div>
                  {/* Edit/Delete visible only for Superadmin */}
                  {canEditOrg && selectedOrgId === org.id && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOrg(org);
                        }}
                        className="p-1.5 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.25)" }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrg(org);
                        }}
                        className="p-1.5 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.25)" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {/* Add New Organization Card (Only Superadmin) */}
              {canEditOrg && (
                <div
                  onClick={() => setEditingOrg("NEW")}
                  className="p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300"
                  style={{
                    borderColor: ORANGE,
                    background: editingOrg === "NEW" ? "#ffbe6330" : "inherit",
                    color: ORANGE,
                  }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Add Organization</span>
                  </div>
                </div>
              )}
            </div>
            {/* Add/Edit Organization form */}
            {canEditOrg && editingOrg === "NEW" && (
              <form
                className="w-full max-w-md flex flex-col items-center gap-4 p-6 border rounded-2xl"
                style={{ background: "#fff", borderColor: ORANGE }}
                onSubmit={handleOrgSubmit}
              >
                <input
                  name="organization_name"
                  value={orgForm.organization_name}
                  onChange={(e) =>
                    setOrgForm({
                      ...orgForm,
                      organization_name: e.target.value,
                    })
                  }
                  placeholder="Enter organization name"
                  className="w-full rounded-xl px-4 py-3 border"
                  style={{ borderColor: ORANGE }}
                  required
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-xl px-8 py-3 font-semibold"
                    style={{
                      background: ORANGE,
                      color: "#fff",
                      opacity: loading ? 0.7 : 1,
                    }}
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add Organization"}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl px-8 py-3 border font-medium"
                    style={{
                      borderColor: ORANGE,
                      color: ORANGE,
                      background: "#fff",
                    }}
                    onClick={() => setEditingOrg(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {canEditOrg && editingOrg && editingOrg !== "NEW" && (
              <form
                className="w-full max-w-md flex flex-col items-center gap-4 p-6 border rounded-2xl"
                style={{ background: "#fff", borderColor: ORANGE }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateOrg(
                    filteredOrgs.find((o) => o.id === editingOrg),
                  );
                }}
              >
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 border"
                  style={{ borderColor: ORANGE }}
                  required
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-xl px-8 py-3 font-semibold"
                    style={{ background: ORANGE, color: "#fff" }}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="rounded-xl px-8 py-3 border font-medium"
                    style={{
                      borderColor: ORANGE,
                      color: ORANGE,
                      background: "#fff",
                    }}
                    onClick={() => setEditingOrg(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {selectedOrgId && !editingOrg && (
              <button
                className="mt-6 rounded-xl px-12 py-3 font-semibold flex items-center gap-2"
                style={{ background: ORANGE, color: "#fff" }}
                onClick={() => setSetup("company")}
              >
                Continue to Company Setup
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* --- COMPANY STEP --- */}
        {setup === "company" && (
          // <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full max-w-7xl">
            {/* Left Panel */}
            <div
              // className="flex-1 rounded-3xl shadow-2xl p-8 border"

              className="rounded-3xl shadow-2xl p-8 border h-fit"
              style={{
                background: cardColor,
                border: `1.5px solid ${borderColor}`,
                color: textColor,
                minHeight: 400,
              }}
            >
              <h3
                className="mb-6 font-bold text-2xl flex items-center gap-3"
                style={{ color: ORANGE }}
              >
                <Building2 className="w-7 h-7" style={{ color: ORANGE }} />
                Organizations & Companies
              </h3>
              <div className="relative w-full mb-6">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: iconColor }}
                />

                <input
                  type="text"
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full rounded-2xl pl-10 pr-4 py-3 border"
                  style={{
                    borderColor: ORANGE,
                    background: theme === "dark" ? "#191922" : "#f8f7fa",
                    color: textColor,
                  }}
                />
              </div>
              {/* Organizations List */}
              <div className="mb-8">
                <h4
                  className="text-sm font-semibold"
                  style={{
                    color: ORANGE,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  Organizations
                </h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                  {organizationDetails.length === 0 ? (
                    <div className="text-center py-6" style={{ color: ORANGE }}>
                      No organizations available
                    </div>
                  ) : (
                    // organizationDetails.map((org, idx) => (
                    filteredOrgs.map((org, idx) => (
                      <div
                        key={org.id}
                        onClick={() => {
                          console.log("ORG CLICKED:", org);
                          handleSelectOrg(org);
                        }}
                        className="p-4 rounded-xl cursor-pointer transition-all duration-200"
                        style={{
                          background:
                            selectedOrgId === org.id ? ORANGE : cardColor,
                          color: selectedOrgId === org.id ? "#fff" : textColor,
                          border: `1.5px solid ${ORANGE}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm">
                              {idx + 1}
                            </span>
                            <Building2
                              className="w-4 h-4"
                              style={{ color: ORANGE }}
                            />
                            <span className="font-medium">
                              {org.organization_name}
                            </span>
                          </div>
                          {selectedOrgId === org.id && (
                            <Check
                              className="w-5 h-5"
                              style={{ color: "#fff" }}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {/* Companies List */}
              <div className="relative w-full mb-4">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: iconColor }}
                />

                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Search companies..."
                  className="w-full rounded-2xl pl-10 pr-4 py-3 border"
                  style={{
                    borderColor: ORANGE,
                    background: theme === "dark" ? "#191922" : "#f8f7fa",
                    color: textColor,
                  }}
                />
              </div>
              <div>
                <h4
                  className="text-sm font-semibold"
                  style={{
                    color: ORANGE,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  Companies
                </h4>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  {companiesLoading ? (
                    <div className="text-center py-6" style={{ color: ORANGE }}>
                      Loading companies...
                    </div>
                  ) : companyDetails.length === 0 ? (
                    <div className="text-center py-6" style={{ color: ORANGE }}>
                      {selectedOrgId
                        ? "No companies yet"
                        : "Select an organization first"}
                    </div>
                  ) : (
                    // companyDetails.map((comp, idx) => (
                    filteredCompanies.map((comp, idx) => (
                      // <div
                      //   key={comp.id}
                      //   className="p-4 rounded-xl"
                      <div
                        key={comp.id}
                        // onClick={() => {
                        //   setSelectedCompanyId(comp.id);
                        //   setSelectedEntityOrgId(selectedOrgId);
                        //   setSelectedEntityCompanyId(comp.id);
                        //   setSetup("entity");
                        // }}
                        onClick={() => {
                          const isSame =
                            Number(selectedCompanyId) === Number(comp.id);

                          // DESELECT COMPANY
                          if (isSame) {
                            setSelectedCompanyId(null);

                            setSelectedEntityOrgId(null);
                            setSelectedEntityCompanyId(null);

                            setSelectedEntityOrg(null);
                            setSelectedEntityCompany(null);

                            setCompanyEntities([]);

                            // Reset company form
                            setCompanyForm({
                              name: "",
                              entity_name: "",
                              country: "",
                              state_name: "",
                              region: "",
                              zone_name: "",
                              sub_domain: "",
                              pincode: "",
                            });

                            // Exit edit mode
                            setIsCompanyEditMode(false);

                            setOriginalCompanyForm(null);

                            return;
                          }

                          // SELECT COMPANY
                          const org = organizationDetails.find(
                            (o) => Number(o.id) === Number(comp.organization),
                          );

                          setSelectedCompanyId(comp.id);

                          setSelectedEntityOrgId(Number(comp.organization));
                          setSelectedEntityCompanyId(Number(comp.id));

                          setSelectedEntityOrg(org || null);
                          setSelectedEntityCompany(comp);

                          fetchCompanyEntities(comp.id);

                          // Prefill form
                          const formData = {
                            name: comp.name || "",
                            entity_name: comp.entity_name || "",
                            country: comp.country || "",
                            state_name: comp.state_name || "",
                            region: comp.region || "",
                            zone_name: comp.zone_name || "",
                            sub_domain: comp.sub_domain || "",
                            pincode: comp.pincode || "",
                          };

                          setCompanyForm(formData);

                          setOriginalCompanyForm(formData);

                          setIsCompanyEditMode(true);
                        }}
                        className="p-4 rounded-xl cursor-pointer transition-all duration-200"
                        style={{
                          // background: cardColor,
                          border: `1.5px solid ${ORANGE}`,
                          // color: textColor,
                          background:
                            selectedCompanyId === comp.id ? ORANGE : cardColor,

                          color:
                            selectedCompanyId === comp.id ? "#fff" : textColor,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="font-semibold text-sm"
                            style={{ color: ORANGE }}
                          >
                            {idx + 1}
                          </span>
                          <Building
                            className="w-4 h-4"
                            style={{ color: ORANGE }}
                          />
                          <span className="font-medium">{comp.name}</span>
                        </div>
                        {selectedCompanyId === comp.id && (
                          <Check
                            className="w-5 h-5"
                            style={{ color: "#fff" }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {/* Company Form */}
            <form
              // className="flex-1 rounded-3xl shadow-2xl p-8 border"
              className="rounded-3xl shadow-2xl p-8 border"
              style={{
                background: cardColor,
                border: `1.5px solid ${borderColor}`,
                color: textColor,
                minHeight: 400,
              }}
              onSubmit={handleCompanySubmit}
            >
              <h3
                className="font-bold text-2xl mb-6 flex items-center gap-3"
                style={{ color: ORANGE }}
              >
                <Building className="w-7 h-7" style={{ color: ORANGE }} />
                {isCompanyEditMode ? "Update Company" : "Create New Company"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: ORANGE }}
                  >
                    Company Name *
                  </label>
                  <input
                    name="name"
                    value={companyForm.name}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, name: e.target.value })
                    }
                    placeholder="Enter company name"
                    className="w-full rounded-xl px-4 py-3 border"
                    style={{
                      borderColor: ORANGE,
                      background: theme === "dark" ? "#191922" : "#f8f7fa",
                      color: textColor,
                    }}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: ORANGE }}
                    >
                      Pincode
                    </label>
                    <input
                      name="pincode"
                      value={companyForm.pincode}
                      onChange={handleCompanyPincodeChange}
                      placeholder="Pincode"
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        borderColor: ORANGE,
                        background: theme === "dark" ? "#191922" : "#f8f7fa",
                        color: textColor,
                      }}
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: ORANGE }}
                    >
                      Country
                    </label>
                    <input
                      name="country"
                      value={companyForm.country}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          country: e.target.value,
                        })
                      }
                      placeholder="Country"
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        borderColor: ORANGE,
                        background: theme === "dark" ? "#191922" : "#f8f7fa",
                        color: textColor,
                      }}
                      readOnly
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: ORANGE }}
                    >
                      State
                    </label>
                    <input
                      name="state_name"
                      value={companyForm.state_name}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          state_name: e.target.value,
                        })
                      }
                      placeholder="State"
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        borderColor: ORANGE,
                        background: theme === "dark" ? "#191922" : "#f8f7fa",
                        color: textColor,
                      }}
                      readOnly
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: ORANGE }}
                    >
                      Region
                    </label>
                    <input
                      name="region"
                      value={companyForm.region}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          region: e.target.value,
                        })
                      }
                      placeholder="Region"
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        borderColor: ORANGE,
                        background: theme === "dark" ? "#191922" : "#f8f7fa",
                        color: textColor,
                      }}
                      readOnly
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: ORANGE }}
                    >
                      Zone
                    </label>
                    <input
                      name="zone_name"
                      value={companyForm.zone_name}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          zone_name: e.target.value,
                        })
                      }
                      placeholder="Zone"
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        borderColor: ORANGE,
                        background: theme === "dark" ? "#191922" : "#f8f7fa",
                        color: textColor,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: ORANGE }}
                    >
                      Sub Domain
                    </label>
                    <input
                      name="sub_domain"
                      value={companyForm.sub_domain}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          sub_domain: e.target.value,
                        })
                      }
                      placeholder="Sub domain"
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        borderColor: ORANGE,
                        background: theme === "dark" ? "#191922" : "#f8f7fa",
                        color: textColor,
                      }}
                    />
                  </div>
                </div>
              </div>
              {isCompanyEditMode ? (
                <button
                  type="button"
                  onClick={handleContinueToEntity}
                  className="w-full mt-8 rounded-xl px-6 py-4 font-semibold flex items-center justify-center gap-2"
                  style={{ background: ORANGE, color: "#fff" }}
                >
                  {hasCompanyChanges()
                    ? "Update & Continue"
                    : "Continue to Entity"}

                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full mt-8 rounded-xl px-6 py-4 font-semibold flex items-center justify-center gap-2"
                  style={{ background: ORANGE, color: "#fff" }}
                >
                  Create Company & Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </form>
          </div>
        )}

        {/* --- ENTITY STEP --- */}
        {setup === "entity" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full max-w-7xl">
            {/* Left Panel */}
            <div
              className="flex-1 rounded-3xl shadow-2xl p-8 border"
              style={{
                background: cardColor,
                border: `1.5px solid ${borderColor}`,
                color: textColor,
                minHeight: 400,
              }}
            >
              <h3
                className="mb-6 font-bold text-2xl flex items-center gap-3"
                style={{ color: ORANGE }}
              >
                <MapPin className="w-7 h-7" style={{ color: ORANGE }} />
                Select Organization & Company
              </h3>
              {/* Organizations */}
              <div className="relative w-full mb-4">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: iconColor }}
                />

                <input
                  type="text"
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full rounded-2xl pl-10 pr-4 py-3 border"
                  style={{
                    borderColor: ORANGE,
                    background: theme === "dark" ? "#191922" : "#f8f7fa",
                    color: textColor,
                  }}
                />
              </div>
              <div className="mb-8">
                <h4
                  className="text-sm font-semibold mb-4"
                  style={{
                    color: ORANGE,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  Select Organization
                </h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                  {entityOrganizations.length === 0 ? (
                    <div className="text-center py-6" style={{ color: ORANGE }}>
                      No organizations available
                    </div>
                  ) : (
                    filteredOrgs.map((org, idx) => (
                      <div
                        key={org.id}
                        onClick={() => {
                          setSelectedEntityOrgId(org.id);
                          setSelectedEntityOrg(org);

                          fetchCompanies(org.id);

                          // Reset selected company
                          setSelectedEntityCompanyId(null);
                          setSelectedEntityCompany(null);

                          // Reset entities
                          setCompanyEntities([]);

                          // Reset entity form
                          setEntityForm({
                            name: "",
                            state: "",
                            region: "",
                            zone: "",
                          });

                          // Reset company form state
                          setSelectedCompanyId(null);

                          setCompanyForm({
                            name: "",
                            entity_name: "",
                            country: "",
                            state_name: "",
                            region: "",
                            zone_name: "",
                            sub_domain: "",
                            pincode: "",
                          });

                          setOriginalCompanyForm(null);

                          setIsCompanyEditMode(false);
                        }}
                        className="p-4 rounded-xl cursor-pointer transition-all duration-200"
                        style={{
                          background:
                            Number(selectedEntityOrg?.id) === Number(org.id)
                              ? ORANGE
                              : cardColor,

                          color:
                            Number(selectedEntityOrg?.id) === Number(org.id)
                              ? "#fff"
                              : textColor,
                          border: `1.5px solid ${ORANGE}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          {/* <div className="flex items-center gap-3"> */}
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-sm">
                                {idx + 1}
                              </span>

                              <Building2
                                className="w-4 h-4"
                                style={{
                                  color:
                                    Number(selectedEntityOrg?.id) ===
                                    Number(org.id)
                                      ? "#fff"
                                      : ORANGE,
                                }}
                              />

                              <span className="font-medium">
                                {org.organization_name}
                              </span>
                            </div>

                            {Number(selectedEntityOrg?.id) ===
                              Number(org.id) && (
                              <Check
                                className="w-5 h-5"
                                style={{ color: "#fff" }}
                              />
                            )}
                          </div>
                          {/* {Number(selectedEntityOrg?.id) === Number(org.id) && (
                            <Check
                              className="w-5 h-5"
                              style={{ color: "#fff" }}
                            />
                          )} */}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {/* Companies */}
              <div className="relative w-full mb-4">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: iconColor }}
                />

                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Search companies..."
                  className="w-full rounded-2xl pl-10 pr-4 py-3 border"
                  style={{
                    borderColor: ORANGE,
                    background: theme === "dark" ? "#191922" : "#f8f7fa",
                    color: textColor,
                  }}
                />
              </div>
              {selectedEntityOrgId && (
                <div>
                  <h4
                    className="text-sm font-semibold mb-4"
                    style={{
                      color: ORANGE,
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                    }}
                  >
                    Select Company
                  </h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                    {filteredCompaniesForEntity.length === 0 ? (
                      <div
                        className="text-center py-6"
                        style={{ color: ORANGE }}
                      >
                        No companies available
                      </div>
                    ) : (
                      filteredCompaniesForEntity.map((comp, idx) => (
                        // <div
                        //   key={comp.id}
                        //   onClick={() => setSelectedEntityCompanyId(comp.id)}
                        //   className="p-4 rounded-xl cursor-pointer transition-all duration-200"
                        <div
                          key={comp.id}
                          onClick={() => {
                            const isSame =
                              Number(selectedEntityCompany?.id) ===
                              Number(comp.id);

                            // Deselect
                            if (isSame) {
                              setSelectedEntityCompanyId(null);
                              setSelectedEntityCompany(null);

                              setCompanyEntities([]);

                              setEntityForm({
                                name: "",
                                state: "",
                                region: "",
                                zone: "",
                              });

                              return;
                            }

                            // Select
                            setSelectedEntityCompanyId(comp.id);
                            setSelectedEntityCompany(comp);

                            fetchCompanyEntities(comp.id);

                            // Reset entity form
                            setEntityForm({
                              name: "",
                              state: "",
                              region: "",
                              zone: "",
                            });
                          }}
                          className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                          style={{
                            background:
                              Number(selectedEntityCompany?.id) ===
                              Number(comp.id)
                                ? ORANGE
                                : cardColor,

                            color:
                              Number(selectedEntityCompany?.id) ===
                              Number(comp.id)
                                ? "#fff"
                                : textColor,
                            border: `1.5px solid ${ORANGE}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-sm">
                                {idx + 1}
                              </span>
                              <Building
                                className="w-4 h-4"
                                style={{ color: ORANGE }}
                              />
                              <span className="font-medium">{comp.name}</span>
                            </div>
                            {Number(selectedEntityCompany?.id) ===
                              Number(comp.id) && (
                              <Check
                                className="w-5 h-5"
                                style={{ color: "#fff" }}
                              />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {/* Existing Entities */}
              <div className="relative w-full mb-4">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: iconColor }}
                />

                <input
                  type="text"
                  value={entitySearch}
                  onChange={(e) => setEntitySearch(e.target.value)}
                  placeholder="Search entities..."
                  className="w-full rounded-2xl pl-10 pr-4 py-3 border"
                  style={{
                    borderColor: ORANGE,
                    background: theme === "dark" ? "#191922" : "#f8f7fa",
                    color: textColor,
                  }}
                />
              </div>
              {selectedEntityCompanyId && (
                <div className="mt-8">
                  <h4
                    className="text-sm font-semibold mb-4"
                    style={{
                      color: ORANGE,
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                    }}
                  >
                    Existing Entities
                  </h4>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                    {filteredEntityList.length === 0 ? (
                      <div
                        className="text-center py-6 rounded-xl"
                        style={{
                          border: `1.5px solid ${ORANGE}`,
                          color: ORANGE,
                        }}
                      >
                        No entities created yet
                      </div>
                    ) : (
                      filteredEntityList.map((entity, idx) => (
                        <div
                          key={entity.id}
                          onClick={() => {
                            const isSame =
                              Number(selectedEntityId) === Number(entity.id);

                            // DESELECT ENTITY
                            if (isSame) {
                              setSelectedEntityId(null);

                              setIsEntityEditMode(false);

                              setOriginalEntityForm(null);

                              setEntityForm({
                                name: "",
                                state: "",
                                region: "",
                                zone: "",
                              });

                              return;
                            }

                            // SELECT ENTITY
                            const formData = {
                              name: entity.name || "",
                              state: entity.state || "",
                              region: entity.region || "",
                              zone: entity.zone || "",
                            };

                            setSelectedEntityId(entity.id);

                            setEntityForm(formData);

                            setOriginalEntityForm(formData);

                            setIsEntityEditMode(true);
                          }}
                          className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                          style={{
                            background:
                              Number(selectedEntityId) === Number(entity.id)
                                ? ORANGE
                                : cardColor,

                            color:
                              Number(selectedEntityId) === Number(entity.id)
                                ? "#fff"
                                : textColor,

                            border: `1.5px solid ${ORANGE}`,
                          }}
                        >
                          {/* <div className="flex items-center justify-between"> */}
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div
                                className="font-semibold"
                                style={{
                                  color:
                                    Number(selectedEntityId) ===
                                    Number(entity.id)
                                      ? "#fff"
                                      : ORANGE,
                                }}
                              >
                                {idx + 1}. {entity.name}
                              </div>

                              <div
                                className="text-xs mt-1"
                                style={{
                                  opacity: 0.9,
                                  color:
                                    Number(selectedEntityId) ===
                                    Number(entity.id)
                                      ? "#fff"
                                      : textColor,
                                }}
                              >
                                {entity.state || "-"} • {entity.region || "-"} •{" "}
                                {entity.zone || "-"}
                              </div>
                              {Number(selectedEntityId) ===
                                Number(entity.id) && (
                                <Check
                                  className="w-5 h-5"
                                  style={{ color: "#fff" }}
                                />
                              )}
                            </div>

                            <div
                              className="px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                background: "#ffbe6330",
                                color: ORANGE,
                              }}
                            >
                              Existing
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Entity Form */}
            <form
              className="flex-1 rounded-3xl shadow-2xl p-8 border"
              style={{
                background: cardColor,
                border: `1.5px solid ${borderColor}`,
                color: textColor,
                minHeight: 400,
              }}
              onSubmit={handleEntitySubmit}
            >
              <h3
                className="font-bold text-2xl mb-6 flex items-center gap-3"
                style={{ color: ORANGE }}
              >
                <MapPin className="w-7 h-7" style={{ color: ORANGE }} />
                {isEntityEditMode ? "Update Entity" : "Create New Entity"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: ORANGE }}
                  >
                    Entity Name *
                  </label>
                  <input
                    name="name"
                    value={entityForm.name}
                    onChange={(e) =>
                      setEntityForm({ ...entityForm, name: e.target.value })
                    }
                    placeholder="Enter entity name"
                    className="w-full rounded-xl px-4 py-3 border"
                    style={{
                      borderColor: ORANGE,
                      background: theme === "dark" ? "#191922" : "#f8f7fa",
                      color: textColor,
                    }}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: ORANGE }}
                    >
                      State
                    </label>
                    <input
                      name="state"
                      value={entityForm.state}
                      onChange={(e) =>
                        setEntityForm({ ...entityForm, state: e.target.value })
                      }
                      placeholder="State"
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        borderColor: ORANGE,
                        background: theme === "dark" ? "#191922" : "#f8f7fa",
                        color: textColor,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: ORANGE }}
                    >
                      Region
                    </label>
                    <input
                      name="region"
                      value={entityForm.region}
                      onChange={(e) =>
                        setEntityForm({ ...entityForm, region: e.target.value })
                      }
                      placeholder="Region"
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        borderColor: ORANGE,
                        background: theme === "dark" ? "#191922" : "#f8f7fa",
                        color: textColor,
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: ORANGE }}
                    >
                      Zone
                    </label>
                    <input
                      name="zone"
                      value={entityForm.zone}
                      onChange={(e) =>
                        setEntityForm({ ...entityForm, zone: e.target.value })
                      }
                      placeholder="Zone"
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        borderColor: ORANGE,
                        background: theme === "dark" ? "#191922" : "#f8f7fa",
                        color: textColor,
                      }}
                    />
                  </div>
                </div>
                {selectedEntityCompanyId && (
                  <div
                    className="mt-6 p-4 rounded-xl"
                    style={{
                      background: "#ffbe6330",
                      border: `1.5px solid ${ORANGE}`,
                      color: ORANGE,
                    }}
                  >
                    <p className="text-sm">
                      <span className="font-semibold">Selected: </span>
                      {selectedEntityOrg?.organization_name}→
                      {selectedEntityCompany?.name}
                    </p>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full mt-8 rounded-xl px-6 py-4 font-semibold flex items-center justify-center gap-2"
                style={{ background: ORANGE, color: "#fff" }}
                disabled={!selectedEntityCompanyId}
              >
                <Check className="w-5 h-5" />
                {isEntityEditMode
                  ? hasEntityChanges()
                    ? "Update Entity"
                    : "No Changes"
                  : "Complete Setup"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSetup;
