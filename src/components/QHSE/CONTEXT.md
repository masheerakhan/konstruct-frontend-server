# QHSE Frontend Context

## Purpose

This folder contains the main frontend modules for the QHSE area of the Kounstruct app.

Path:
- `frontendservice/kounstruct-frontend/src/components/QHSE`

The QHSE area is not a single feature. It is a group of related modules covering:
- DMS and Transmittal workflows
- project resources and registers
- construction program MOM flows
- inspection and request forms
- quality and HSE issue tracking
- safety operations

This file is meant to give fast working context before making changes in QHSE.

---

## Top-Level Structure

Main QHSE subfolders:
- `BoxFile`
- `ConstructionPrograms`
- `ContactDirectory`
- `DMS`
- `MIR`
- `NCR`
- `OrganizationChart`
- `PeriodicVendorEvaluation`
- `RejectionRegisterAndRepairCost`
- `RequestForInformation`
- `Resources`
- `Safety`
- `SOR`
- `Transmittal`
- `WIR`

High-level interpretation:
- `Transmittal` is the most complex and central document-submission workflow.
- `Documents.jsx` inside `Transmittal` acts as the DMS-style folder browser and special-folder renderer.
- Several other QHSE folders are rendered from special folder matches inside `Transmittal/Documents.jsx`.

---

## Key Modules

### 1. Transmittal

Important files:
- `Transmittal/Documents.jsx`
- `Transmittal/CreateDocument.jsx`
- `Transmittal/DocumentPreview.jsx`
- `Transmittal/TransmittalHeader.jsx`
- `Transmittal/DocTypeSelector.jsx`
- `Transmittal/ProductBrandSelector.jsx`
- `Transmittal/stringCase.js`
- `Transmittal/transmittalStorage.js`
- `Transmittal/useIsMobile.js`
- `Transmittal/approvedVendors.js`

Purpose:
- Handles creation and submission of transmittal documents.
- Contains the DMS-style folder explorer.
- Routes special folders to custom screens instead of the generic folder table.
- Hosts document-type-specific form components and generated checklist data.

Main doc-type groups under `Transmittal/DocTypes`:
- `MaterialSubmission`
- `MethodStatement`
- `PrequalificationSubmission`
- `ProjectPlan`
- `TestReports`
- legacy/shared files such as `DMP.jsx`

Current register work already present:
- `DocTypes/ProjectPlan/PQPRegister.jsx`
- `DocTypes/MaterialSubmission/MASRegister.jsx`
- placeholders / future register targets:
  - `DocTypes/MethodStatement/WMSRegister.jsx`
  - `DocTypes/PrequalificationSubmission/PQDRegister.jsx`

Notes:
- `CreateDocument.jsx` currently writes lightweight DMS document records through the DMS API flow.
- The DMS document model is still fairly thin from the frontend point of view, so register UIs currently use folder documents plus safe fallbacks/sample rows where richer metadata is not yet persisted.
- Folder display and many special screens are controlled by name matching and some `folder_kind` values inside `Documents.jsx`.

### 2. Resources

Important files:
- `Resources/MMR/MinimumManpowerRegisterTable.jsx`
- `Resources/MMR/MinimumManpowerRequirementForm.jsx`
- `Resources/QcAssets/QCAssetsRegisterTable.jsx`
- `Resources/QcAssets/QcAssetsCreateForm.jsx`

Purpose:
- Resource-oriented register UIs.
- Used by DMS special folder rendering for:
  - Minimum Manpower
  - QC Assets

These are not generic tables. They are connected to backend register APIs through `Documents.jsx`.

### 3. OrganizationChart

Important files:
- `OrganizationChart/CommunicationMatrix.jsx`
- `OrganizationChart/CommunicationMatrixRegisterTable.jsx`
- `OrganizationChart/EscalationMatrix.jsx`

Purpose:
- Communication Matrix and Escalation Matrix views.
- These are also rendered from DMS special folders.

### 4. ConstructionPrograms

Important files:
- `ConstructionPrograms/ConstructionProgramsHub.jsx`
- `ConstructionPrograms/MomFolderView.jsx`
- `ConstructionPrograms/MomListPanel.jsx`
- `ConstructionPrograms/MomForm.jsx`

Purpose:
- Construction program-specific UI.
- MOM folder handling is routed from DMS folder matching in `Transmittal/Documents.jsx`.

### 5. BoxFile

Important file:
- `BoxFile/BoxFileRegister.jsx`

Purpose:
- Registers & Box Files UI.
- Rendered when a folder is identified as a box file register folder in `Documents.jsx`.

### 6. MIR / WIR / RFI / NCR / SOR / PVE / Contact Directory / DRR

Important files:
- `MIR/MaterialInspectionRequest/MIR.jsx`
- `MIR/MaterialInspectionRequest/EquipmentInspectionReport.jsx`
- `WIR/WorkInspectionRequest.jsx`
- `WIR/AreaClearanceForm.jsx`
- `RequestForInformation/RFI.jsx`
- `NCR/InternalNCR.jsx`
- `NCR/ExternalNCR/HSE.jsx`
- `NCR/ExternalNCR/Quality.jsx`
- `SOR/ExternalSOR.jsx`
- `PeriodicVendorEvaluation/PVE.jsx`
- `ContactDirectory/ContactDirectory.jsx`
- `RejectionRegisterAndRepairCost/DRR.jsx`

Purpose:
- These are dedicated form or register screens opened from matching DMS folders.

### 7. DMS

Important files:
- `DMS/AllDocumentTracker.jsx`
- `DMS/DCP.jsx`

Purpose:
- Separate DMS-related screens outside the main `Transmittal/Documents.jsx` browser.

### 8. Safety

Important files:
- `Safety/Safety.jsx`
- `Safety/Safety_Training/*`
- `Safety/Safety_Inspection/*`
- `Safety/Permit_to_work/*`
- `Safety/Emergency_Details/EmergencyDetails.jsx`
- `Safety/Document_pro/DocumentPro.jsx`

Purpose:
- Safety dashboard and operational modules.
- `Safety.jsx` works like a launcher/dashboard and navigates to sub-areas.

Main Safety subdomains:
- Safety Sessions / Training
- Safety Inspections
- Permit to Work
- Emergency Details
- Safety document tools

Safety inspection area includes role-specific dashboard flows such as:
- initializer
- maker
- checker
- supervisor

---

## QHSE Rendering Pattern

The most important rendering rule in this codebase:

`Transmittal/Documents.jsx` is acting as a folder-aware render hub.

This means:
- some folders render a normal folder table with children, docs, and files
- some folders render domain-specific UIs instead
- the decision is made mostly by folder name matching plus some `folder_kind` checks

Examples:
- `Minimum Manpower` -> `MinimumManpowerRegisterTable`
- `QC Assets` -> `QCAssetsRegisterTable`
- communication matrix folders -> communication matrix view
- MOM folders -> `MomFolderView`
- box file folders -> `BoxFileRegister`
- Project Plans -> `PQPRegister`
- Material Submission (MAS) -> `MASRegister`
- RFI / NCR / SOR / PVE / Contact Directory etc. -> dedicated screens

Implication:
- changes to folder names can break rendering if alias logic is not updated
- this project already uses alias-based matching in `Documents.jsx` to preserve renamed folders

---

## Current Naming / Alias Behavior

Folder rendering is intentionally tolerant to renamed folders.

Examples of renamed aliases already handled in `Documents.jsx`:
- `Request for Information (RFI)`
- `Contact Details of All Vendors, Agencies~Project Directory`
- `Internal Mechanism of Contractor (INC)`
- `External NCR Mechanism (ENC)`
- `External Observations Mechanism (SOR)`
- renamed construction program parent aliases for MOM routing

Implication:
- if a new business folder is renamed in DMS, update the corresponding alias matcher in `Documents.jsx`

---

## Current DMS / Transmittal Conventions

### Folder behavior

- DMS folder ordering is sequence-driven:
  - `sequence_no`
  - then `name`
- frontend normalizes backend `sequence_no` to `sequenceNo`
- admin-only edit actions are shown in folder tables
- folder names now render exactly as typed by the user

### Folder data used by frontend

Frontend folder nodes commonly expect:
- `id`
- `name`
- `parent`
- `sequence_no`
- `folder_kind`
- `can_upload_files`
- `created_by`
- `size`
- `created_at`
- nested `children`
- `documents`
- `files`

### DMS document data currently available

The DMS document list used by frontend registers is still lightweight.
Common usable fields:
- `id`
- `name`
- `ref_no`
- `project_name`
- `folder`
- `created_at`

Implication:
- spreadsheet-like register UIs can be built in frontend
- but richer columns often need either:
  - saved structured metadata in backend
  - derived frontend fallback fields
  - temporary sample preview rows

---

## Important Files To Read First

If you are making QHSE changes, start here:

### For DMS / folder rendering
- `Transmittal/Documents.jsx`

### For transmittal document creation
- `Transmittal/CreateDocument.jsx`
- `Transmittal/DocumentPreview.jsx`
- `Transmittal/TransmittalHeader.jsx`

### For folder-name formatting
- `Transmittal/stringCase.js`

### For transmittal helper data
- `Transmittal/approvedVendors.js`
- `Transmittal/pqdChecklists.js`
- `Transmittal/pqdChecklists.generated.json`
- `Transmittal/pqdChecklistExtracted.json`
- `Transmittal/dmpChecklists.js`
- `Transmittal/dmpChecklists.generated.json`

### For current register implementations
- `Transmittal/DocTypes/ProjectPlan/PQPRegister.jsx`
- `Transmittal/DocTypes/MaterialSubmission/MASRegister.jsx`

### For safety
- `Safety/Safety.jsx`

---

## Practical Guidance For Future Changes

### If adding a new DMS special folder

Usually update:
- `Transmittal/Documents.jsx`

Likely tasks:
- add a folder matcher
- add a render condition
- exclude the folder from generic folder-table rendering if needed
- keep `Create Transmittal` enabled or disabled intentionally

### If adding a new register screen

Recommended pattern:
- create register component under the relevant `Transmittal/DocTypes/...` folder
- keep styling visually consistent with existing registers
- support horizontal scroll for wide tables
- use sample rows only as preview fallback, never over real rows
- let real DMS documents replace preview rows automatically

### If folder names are renamed by users/admins

Usually update:
- alias matching in `Transmittal/Documents.jsx`

### If a register needs more spreadsheet-style columns

Check first whether those values actually exist in:
- DMS document records
- draft payloads
- backend document metadata

If not, frontend can only safely show:
- placeholder values
- derived values
- preview/sample values

---

## Summary

QHSE is a multi-module frontend area where:
- `Transmittal/Documents.jsx` is the main DMS render hub
- folder names and aliases are operationally important
- many QHSE screens are launched from DMS folder selection
- Safety is a separate dashboard-driven subsystem
- current register work is evolving inside `Transmittal/DocTypes/*`

If you need one single file to understand how QHSE behavior is connected, start with:
- `frontendservice/kounstruct-frontend/src/components/QHSE/Transmittal/Documents.jsx`
