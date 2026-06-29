import React, { useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { createProject, allorgantioninfototalbyUser_id } from "../../api";
import { showToast } from "../../utils/toast";
import { useSelector } from "react-redux";
import { useTheme } from "../../ThemeContext";// THEME!
import axios from 'axios';

function AddProjectModal({ onClose, onSave }) {
  const { theme } = useTheme();

  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const userString = localStorage.getItem("USER_DATA");
    if (userString && userString !== "undefined") {
      setUserData(JSON.parse(userString));
    }
  }, []);
  const userId = userData?.user_id;

  // Dropdown state
  const [orgOptions, setOrgOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [entityOptions, setEntityOptions] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");

  // Other form state
  const [projectName, setProjectName] = useState("");
  const [useDefaultImage, setUseDefaultImage] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [image, setImage] = useState("");

  useEffect(() => {
    const fetchUserOrgs = async () => {
      try {
        if (userId) {
          const resp =  await axios.get(
      `https://konstruct.world/organizations/user-orgnizationn-info/${userId}/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
        },}
);
          setOrgOptions(resp.data.organizations || []);
          setCompanyOptions(resp.data.companies || []);
          setEntityOptions(resp.data.entities || []);
        }
      } catch (e) {
        showToast("Failed to load organizations info.",'error');
      }
    };
    fetchUserOrgs();
  }, [userId]);

  const handleChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setIsSaved(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName) {
      showToast("Project name is required",'info');
      return;
    }
    if (!selectedOrg) {
      showToast("Please select an organization",'info');
      return;
    }
    if (!selectedCompany) {
      showToast("Please select a company",'info');
      return;
    }
    const formData = new FormData();
    formData.append("name", projectName);
    formData.append("created_by", userId);
    formData.append("organization_id", selectedOrg);
    formData.append("company_id", selectedCompany);
    if (selectedEntity) formData.append("entity_id", selectedEntity);
    if (!useDefaultImage && image) {
      formData.append("image", image);
    }
    try {
      const res = await createProject(formData);
      showToast("Project created!", "success");
      onSave(res.data.id || res.data.data?.id);
      setIsSaved(true);
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          JSON.stringify(error.response?.data) ||
          error.message ||
          "Error creating project",'error'
      );
    }
  };

  const filteredCompanies = selectedOrg
    ? companyOptions.filter((comp) => {
        return (
          String(comp.organization_id) === String(selectedOrg) ||
          String(comp.organization) === String(selectedOrg) ||
          String(comp.org_id) === String(selectedOrg)
        );
      })
    : [];

  const filteredEntities = selectedCompany
    ? entityOptions.filter((ent) => {
        return (
          String(ent.company_id) === String(selectedCompany) ||
          String(ent.company) === String(selectedCompany) ||
          String(ent.comp_id) === String(selectedCompany)
        );
      })
    : [];

  // Palette
  const palette = theme === "dark"
    ? {
        modal: "bg-[#22232a] border border-amber-400/30 text-white",
        title: "text-yellow-300",
        label: "text-yellow-200",
        input: "bg-[#2c2c34] text-yellow-50 border-yellow-300",
        inputFocus: "focus:bg-[#23232e] focus:border-yellow-400 focus:ring-yellow-300",
        select: "bg-[#2c2c34] text-yellow-50 border-yellow-300",
        selectFocus: "focus:bg-[#23232e] focus:border-yellow-400 focus:ring-yellow-300",
        fileBtn: "file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200",
        buttonMain: "bg-yellow-400 hover:bg-yellow-300 text-yellow-900",
        buttonAlt: "bg-[#23232e] text-yellow-100 hover:bg-[#191921]",
        borderColor: "border-yellow-400",
        close: "text-yellow-300 hover:text-yellow-200",
        selectPlaceholder: "text-gray-400"
      }
    : {
        modal: "bg-white border border-gray-200 text-gray-900",
        title: "text-[#ea6822]",
        label: "text-gray-700",
        input: "bg-white text-gray-900 border-gray-300",
        inputFocus: "focus:border-blue-500 focus:ring-blue-200",
        select: "bg-white text-gray-900 border-gray-300",
        selectFocus: "focus:border-blue-500 focus:ring-blue-200",
        fileBtn: "file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100",
        buttonMain: "bg-blue-600 hover:bg-blue-700 text-white",
        buttonAlt: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        borderColor: "border-gray-300",
        close: "text-gray-600 hover:text-gray-900",
        selectPlaceholder: "text-gray-400"
      };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
      <div className={`p-6 rounded-xl shadow-2xl w-11/12 max-w-2xl relative transition-all duration-200 ${palette.modal}`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${palette.close}`}
        >
          <AiOutlineClose className="text-xl" />
        </button>
        <h2 className={`text-2xl font-bold mb-6 ${palette.title}`}>
          Add New Project
        </h2>
        {/* Dropdowns stepwise */}
        <div className="space-y-4 mb-6">
          {/* Organization Dropdown */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${palette.label}`}>
              Organization <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full rounded-lg px-4 py-3 border ${palette.select} ${palette.selectFocus}`}
              value={selectedOrg}
              onChange={(e) => {
                setSelectedOrg(e.target.value);
                setSelectedCompany("");
                setSelectedEntity("");
              }}
            >
              <option value="" className={palette.selectPlaceholder}>Select Organization</option>
              {orgOptions.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.organization_name || org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Company Dropdown */}
          {selectedOrg && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${palette.label}`}>
                Company <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full rounded-lg px-4 py-3 border ${palette.select} ${palette.selectFocus}`}
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setSelectedEntity("");
                }}
              >
                <option value="" className={palette.selectPlaceholder}>Select Company</option>
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No companies found for this organization</option>
                )}
              </select>
            </div>
          )}

          {/* Entity Dropdown */}
          {selectedCompany && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${palette.label}`}>
                Entity <span className="text-gray-400">(Optional)</span>
              </label>
              <select
                className={`w-full rounded-lg px-4 py-3 border ${palette.select} ${palette.selectFocus}`}
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
              >
                <option value="" className={palette.selectPlaceholder}>Select Entity (Optional)</option>
                {filteredEntities.length > 0 ? (
                  filteredEntities.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No entities found for this company</option>
                )}
              </select>
            </div>
          )}
        </div>
        {/* Project name and image section */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${palette.label}`}>
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className={`w-full rounded-lg px-4 py-3 border ${palette.input} ${palette.inputFocus}`}
            placeholder="Enter project name"
          />
        </div>
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-3 ${palette.label}`}>
            Project Image
          </label>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={useDefaultImage}
                onChange={() => setUseDefaultImage(true)}
                className="mr-2"
              />
              <span>Use Default Image</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={!useDefaultImage}
                onChange={() => setUseDefaultImage(false)}
                className="mr-2"
              />
              <span>Upload Custom Image</span>
            </label>
          </div>
          {!useDefaultImage && (
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className={`mt-3 w-full text-sm ${palette.fileBtn}`}
            />
          )}
          {image && !useDefaultImage && (
            <img
              src={URL.createObjectURL(image)}
              alt="Custom Project"
              className="mt-4 w-full max-h-48 object-cover rounded-lg border border-gray-200"
            />
          )}
        </div>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg border ${palette.borderColor} ${palette.buttonAlt}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-6 py-3 rounded-lg ${palette.buttonMain}`}
            disabled={!projectName || !selectedOrg || !selectedCompany}
          >
            Save Project
          </button>
        </div>
        {(selectedOrg || selectedCompany || selectedEntity) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 dark:bg-[#292929] dark:text-amber-200">
            <span className="font-medium">Selected: </span>
            {selectedOrg &&
              orgOptions.find((o) => o.id === selectedOrg)?.organization_name}
            {selectedCompany &&
              ` → ${
                filteredCompanies.find((c) => c.id === selectedCompany)?.name
              }`}
            {selectedEntity &&
              ` → ${
                filteredEntities.find((e) => e.id === selectedEntity)?.name
              }`}
          </div>
        )}
      </div>
    </div>
  );
}

export default AddProjectModal;
