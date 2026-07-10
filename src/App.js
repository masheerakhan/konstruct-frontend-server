// import React from "react";
// import {
//   BrowserRouter as Router,
//   Route,
//   Routes,
//   useLocation,
// } from "react-router-dom";
// import { SidebarProvider } from "./components/SidebarContext";
// import Layout1 from "./components/Layout1";  // Your sidebar-push-content layout
// import { ThemeProvider } from "./ThemeContext";
// import { Toaster } from "react-hot-toast";

// // Import all your pages
// import Login from "./Pages/Login";
// import Configuration from "./components/Configuration";
// import AllChecklists from "./components/AllChecklists";
// import MyOngoingChecklist from "./components/MyInProgressSubmissions";
// import CheckerInbox from "./components/CheckerInbox";
// import CreatePurposePage from "./components/CreatePurposePage";
// import UserManagementSetup from "./components/UserManagementSetup";
// import ProjectDetails from "./components/Projectdetails";
// import Snagging from "./components/Snagging";
// import FlatMatrixTable from "./components/FlatMatrixTable";
// import ChecklistFloor from "./components/ChecklistFloor";
// import ChecklistPage from "./components/ChecklistPage";
// import CASetup from "./components/CASetup";
// import SiteConfig from "./SiteConfig";
// import UserHome from "./UserHome";
// import SlotConfig from "./SlotConfig";
// import RequestManagement from "./RequestManagement";
// import CoustemerHandover from "./CoustemerHandover";
// import Chif from "./Chif";
// import UserDashboard from "./components/UserDashboard";
// import PendingSupervisorItems from "./components/PendingSupervisorItems";
// import UsersManagement from "./components/UsersManagement";
// import InitializeChecklist from "./components/InitializeChecklist";
// import PendingInspectorChecklists from "./components/PendingInspectorChecklists";
// import PendingForMakerItems from "./components/PendingForMakerItems";
// import ChifSetup from "./ChifSetup";
// import Chifstep1 from "./Chifstep1";
// import Checklist from "./containers/setup/Checklist";
// import Setup from "./components/Setup";
// import UserSetup from "./containers/setup/UserSetup";
// import User from "./containers/setup/User";
// import CategoryChecklist from "./components/CategoryChecklist";
// import EditCheckList from "./containers/EditCheckList";
// import HierarchicalVerifications from "./components/HierarchicalVerifications";
// import FlatInspectionPage from "./components/FlatInspectionPage";
// // ... import any other needed components

// function AppRoutes() {
//   const location = useLocation();

//   // Show login page without sidebar/header
//   if (location.pathname === "/login") {
//     return (
//       <Routes>
//         <Route path="/login" element={<Login />} />
//       </Routes>
//     );
//   }

//   // Everything else uses the push-content Layout1
//   return (
//     <Layout1>
//       <Routes>
//         <Route path="/config" element={<Configuration />} />
//         <Route path="/all-checklists" element={<AllChecklists />} />
//         <Route path="/my-ongoing-checklist" element={<MyOngoingChecklist />} />
//         <Route path="/checker-inbox" element={<CheckerInbox />} />
//         <Route path="/create-purpose" element={<CreatePurposePage />} />
//         <Route path="/user-management-setup" element={<UserManagementSetup />} />
//         <Route path="/project/:id" element={<ProjectDetails />} />
//         <Route path="/snagging/:id" element={<Snagging />} />
//         <Route path="/Level/:id" element={<FlatMatrixTable />} />
//         <Route path="/checklistfloor/:id" element={<ChecklistFloor />} />
//         <Route path="/checklistpage/:id" element={<ChecklistPage />} />
//         <Route path="/casetup" element={<CASetup />} />
//         <Route path="/SiteConfig" element={<SiteConfig />} />
//         <Route path="/UserHome" element={<UserHome />} />
//         <Route path="/SlotConfig" element={<SlotConfig />} />
//         <Route path="/RequestManagement" element={<RequestManagement />} />
//         <Route path="/CoustemerHandover" element={<CoustemerHandover />} />
//         <Route path="/Chif" element={<Chif />} />
//         <Route path="/analytics" element={<UserDashboard />} />
//         <Route path="/PendingSupervisorItems" element={<PendingSupervisorItems />} />
//         <Route path="/UsersManagement" element={<UsersManagement />} />
//         <Route path="/Initialize-Checklist" element={<InitializeChecklist />} />
//         <Route path="/PendingInspector-Checklist" element={<PendingInspectorChecklists />} />
//         <Route path="/Pending-For-MakerItems" element={<PendingForMakerItems />} />
//         <Route path="/chif-setup" element={<ChifSetup />} />
//         <Route path="/Chifstep1" element={<Chifstep1 />} />
//         <Route path="/Checklist" element={<Checklist />} />
//         <Route path="/setup" element={<Setup />} />
//         <Route path="/user-setup" element={<UserSetup />} />
//         <Route path="/user" element={<User />} />
//         <Route path="/category-sidebar" element={<CategoryChecklist />} />
//         <Route path="/edit-checklist/:id" element={<EditCheckList />} />
//         <Route path="/hierarchical-verifications" element={<HierarchicalVerifications />} />
//         <Route
//            path="/inspection/flat/:flatId"
//              element={<FlatInspectionPage />}
//         />
//         {/* Add any additional routes as needed */}
//       </Routes>
//     </Layout1>
//   );
// }

// function App() {
//   return (
//     <ThemeProvider>
//       <SidebarProvider>
//         <Router>
//           <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
//           <AppRoutes />
//         </Router>
//       </SidebarProvider>
//     </ThemeProvider>
//   );
// }

// export default App;


import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import { SidebarProvider } from "./components/SidebarContext";
import Layout1 from "./components/Layout1";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { Toaster } from "react-hot-toast";

// ... imports for all your pages as before
import Login from "./Pages/Login";
import Configuration from "./components/Configuration";
import AllChecklists from "./components/AllChecklists";
import MyOngoingChecklist from "./components/MyInProgressSubmissions";
import CheckerInbox from "./components/CheckerInbox";
import CreatePurposePage from "./components/CreatePurposePage";
import UserManagementSetup from "./components/UserManagementSetup";
import ProjectDetails from "./components/Projectdetails";
import Snagging from "./components/Snagging";
import FlatMatrixTable from "./components/FlatMatrixTable";
import ChecklistFloor from "./components/ChecklistFloor";
import ChecklistPage from "./components/ChecklistPage";
import CASetup from "./components/CASetup";
import SiteConfig from "./SiteConfig";
import UserHome from "./UserHome";
import SlotConfig from "./SlotConfig";
import RequestManagement from "./RequestManagement";
import CoustemerHandover from "./CoustemerHandover";
import Chif from "./Chif";
import UserDashboard from "./components/UserDashboard";
import PendingSupervisorItems from "./components/PendingSupervisorItems";
import UsersManagement from "./components/UsersManagement";
import InitializeChecklist from "./components/InitializeChecklist";
import PendingInspectorChecklists from "./components/PendingInspectorChecklists";
import PendingForMakerItems from "./components/PendingForMakerItems";
import ChifSetup from "./ChifSetup";
import Chifstep1 from "./Chifstep1";
import Checklist from "./containers/setup/Checklist";
import Setup from "./components/Setup";
import UserSetup from "./containers/setup/UserSetup";
import User from "./containers/setup/User";
import CategoryChecklist from "./components/CategoryChecklist";
import EditCheckList from "./containers/EditCheckList";
import HierarchicalVerifications from "./components/HierarchicalVerifications";
import FlatInspectionPage from "./components/FlatInspectionPage";
import PrivacyPage from "./components/PrivacyPage";
import Scheduling from "./components/Scheduling";
import GuardOnboarding from "./components/GuardOnboarding";
import GuardAttendance from "./components/GuardAttendance";
import AttendanceProjectPage from "./components/AttendanceProjectPage";
import ProjectOverview from "./components/ProjectOverview";
import MIRCreatePage from "./components/MIRCreatePage";
import MIRInboxPage from "./components/MIRInboxPage";
import MIRDetailPage from "./components/MIRDetailPage";
import FlatReport from "./components/FlatReport";
import FormsEnginePage from "./components/FormsEnginePage";
import FormPacksPage from "./components/FormPacksPage";
import ProjectFormsAssignedPage from "./components/ProjectFormsAssignedPage";
import ProjectFormFillPage from "./components/ProjectFormFillPage";
import MyFormResponsesPage from "./components/MyFormResponsesPage";
import MyFormResponseDetailPage from "./components/MyFormResponseDetailPage";
import WIRCreatePage from "./components/WIRCreatePage";
import WIRDetailPage from "./components/WIRDetailPage";
// import OverviewPage from "../pages/components/OverviewPage";
import SafetySessionsManagerList from "./components/Safety/Safety_Training/SafetySessionsManagerList";
import SafetySessionCreatePage from "./components/Safety/Safety_Training/SafetySessionCreatePage";
import SafetyMySessionsList from "./components/Safety/Safety_Training/SafetyMySessionsList";
import SafetyMySessionDetail from "./components/Safety/Safety_Training/SafetyMySessionDetail";
import SafetySessionManagerView from "./components/Safety/Safety_Training/SafetySessionManagerView";
import ProjectFormsManagerSetupPage from "./components/ProjectFormsManagerSetupPage";
// import SafetyObservationList from "./components/Safety/Safety_Observation/SafetyObservationList"
// import CreateSafetyObservation from "./components/Safety/Safety_Observation/CreateSafetyObservation"
import Safety from "./components/Safety/Safety";
import PermitToWork from "./components/Safety/Permit_to_work/PermitToWork";
// import SafetySetup from "./containers/setup/Safety_setup/SafetySetup";
import SafetyWizard from "./containers/setup/Safety_setup/SafetyWizard";
// import SafetyInspectionList from "./components/Safety/Safety_Observation/SafetyObservationList";
// import CreateSafetyInspection from "./components/Safety/Safety_Observation/CreateSafetyObservation";
import SafetyFormats from "./containers/setup/Safety_setup/SafetyFormats";
import SafetyInspectionList from "./components/Safety/Safety_Inspection/SafetyInspectionList";
import CreateSafetyInspection from "./components/Safety/Safety_Inspection/CreateSafetyInspection";
import CheckerView from "./components/Safety/Safety_Inspection/Safety_inspection_checker/CheckerView";
import DocumentPro from "./components/Safety/Document_pro/DocumentPro";
import ViewReport from "./components/Safety/Safety_Inspection/ViewReport";
import ChecklistManager from "./containers/setup/checklists/ChecklistManager";
import UserChecklistDashboard from "./components/Safety/Safety_Inspection/UserChecklistDashboard"
import ManualLocationChecklistPanel from "./components/ManualLocationChecklistPanel";
// import TransmittalMAS from "./components/QHSE/Transmittal/Documents";
import ObservationsDashboard from "./components/Safety/Safety_Inspection/ObservationsDashboard";
import Documents from "./components/QHSE/Transmittal/Documents";
import Vendors from "./components/Vendor/Vendor";
import VendorOnboarding from "./components/Vendor/VendorOnboarding/VendorOnboardingForm";
import QHSEChecklistDashboard from "./components/QHSEChecklistDashboard";
import QHSEChecklistInboxPage from "./components/QHSEChecklistInboxPage";
import QHSEChecklistFormPage from "./components/QHSEChecklistFormPage";
import QHSEChecklistCreatePage from "./components/QHSEChecklistCreatePage";
import Index from "./components/QHSE/MIR/MaterialInspectionRequest/MIR";
import MobileLogin from "./components/pages/MobileLogin";
import MIRChecklist from "./components/QHSE/MIR/MaterialInspectionRequest/MIRChecklist";
import PermitToWorkDashboard from "./components/Safety/Permit_to_work/PermitToWorkDashboard";
import UserPermitDashboard from "./components/Safety/Permit_to_work/PermitDashboard/UserPermitDashboard";
import PermitTemplateBuilderDashboard from "./components/Safety/Permit_to_work/PermitDashboard/PermitTemplateBuilderDashboard";
import NCRCreatePage from "./components/NCR/CreateNCR";
import NCRListPage from "./components/NCR/NCRListPage";
// For body background
function BodyBgController() {
  const { theme } = useTheme();
  useEffect(() => {
    document.body.style.backgroundColor =
      theme === "dark" ? "#191922" : "#fcfaf7"; // dark or offwhite
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [theme]);
  return null;
}
// ----------------- ROLE GUARD for Project Overview -----------------
// function ProjectOverviewGuard({ children }) {
//   // ROLE read from localStorage / USER_DATA
//   let role = localStorage.getItem("ROLE") || "";

//   if (!role) {
//     try {
//       const raw = localStorage.getItem("USER_DATA");
//       if (raw) {
//         const data = JSON.parse(raw);
//         role = data?.role || data?.roles?.[0] || "";
//       }
//     } catch (e) {
//       // ignore parse error
//     }
//   }

//   const r = (role || "").toLowerCase();

//   // ✅ Allowed: Project Manager / Project Head only
//   const isAllowed = [
//     "project manager",
//     "project_manager",
//     "project head",
//     "project_head",
//   ].some((k) => r.includes(k));

//   if (!isAllowed) {
//     // ❌ allowed nahi → config page pe bhej do
//     return <Navigate to="/config" replace />;
//   }

//   return children;
// }
function ProjectOverviewGuard({ children }) {
  let role =
    localStorage.getItem("FLOW_ROLE") ||
    localStorage.getItem("ROLE") ||
    "";

  if (!role) {
    try {
      const raw = localStorage.getItem("USER_DATA");
      if (raw) {
        const data = JSON.parse(raw);
        role = data?.role || data?.roles?.[0] || "";
      }
    } catch (e) {
      // ignore parse error
    }
  }

  const r = (role || "").toLowerCase();

  const isAllowed = [
    "project manager",
    "project_manager",
    "project head",
    "project_head",
  ].some((k) => r.includes(k));

  if (!isAllowed) {
    return <Navigate to="/config" replace />;
  }

  return children;
}

// Your main app routes
// function AppRoutes() {
//   const location = useLocation();

//   if (location.pathname === "/login") {
//     return (
//       <Routes>
//         <Route path="/login" element={<Login />} />
//       </Routes>
//     );
//   }

//   return (
//     <Layout1>
//       <Routes>
//         <Route path="/" element={<Navigate to="/login" replace />} />
//         <Route
//           path="/overview/project/:id"
//           element={
//             <ProjectOverviewGuard>
//               <ProjectOverview />
//             </ProjectOverviewGuard>
//           }
//         />
//         <Route path="/config" element={<Configuration />} />
//         <Route path="/all-checklists" element={<AllChecklists />} />
//         <Route path="/my-ongoing-checklist" element={<MyOngoingChecklist />} />
//         <Route path="/checker-inbox" element={<CheckerInbox />} />
//         <Route path="/create-purpose" element={<CreatePurposePage />} />
//         <Route
//           path="/user-management-setup"
//           element={<UserManagementSetup />}
//         />
//         <Route
//           path="/projects/:id/flat-report/:flatId"
//           element={<FlatReport />}
//         />
//         <Route
//           path="/project-forms/setup"
//           element={<ProjectFormsManagerSetupPage />}
//         />
//         <Route path="/project/:id" element={<ProjectDetails />} />
//         <Route path="/snagging/:id" element={<Snagging />} />
//         {/* <Route path="/Level/:id" element={<FlatMatrixTable />} /> */}
//         <Route
//           path="/project/:projectId/tower/:towerId"
//           element={<FlatMatrixTable />}
//         />
//         <Route path="/checklistfloor/:id" element={<ChecklistFloor />} />
//         <Route path="/checklistpage/:id" element={<ChecklistPage />} />
//         <Route path="/casetup" element={<CASetup />} />
//         <Route path="/SiteConfig" element={<SiteConfig />} />
//         <Route path="/UserHome" element={<UserHome />} />
//         <Route path="/SlotConfig" element={<SlotConfig />} />
//         <Route path="/RequestManagement" element={<RequestManagement />} />
//         <Route path="/CoustemerHandover" element={<CoustemerHandover />} />
//         <Route path="/Chif" element={<Chif />} />
//         <Route path="/analytics" element={<UserDashboard />} />
//         <Route
//           path="/PendingSupervisorItems"
//           element={<PendingSupervisorItems />}
//         />
//         <Route path="/safety" element={<Safety />} />
//         <Route
//           path="/safety/sessions"
//           element={<SafetySessionsManagerList />}
//         />
//         <Route
//           path="/safety/sessions/create"
//           element={<SafetySessionCreatePage />}
//         />
//         <Route path="/safety/permit-to-work" element={<PermitToWork />} />
//         <Route path="/safetyInspections" element={<SafetyInspectionList />} />
//         <Route
//           path="/safetyInpection/create"
//           element={<CreateSafetyInspection />}
//         />
//         <Route path="/safety/permit" element={<UserPermitDashboard />} />
//         <Route
//           path="/safety/observations/create"
//           element={<CreateSafetyInspection />}
//         />
//         <Route
//           path="/safety/observations"
//           element={<ObservationsDashboard />}
//         />
//         {/* <Route path="/safetySetup" element={<SafetySetup />} /> */}
//         <Route path="/safetySetup" element={<SafetyFormats />} />
//         <Route path="/safetySetup/create" element={<SafetyWizard />} />
//         {/* <Route path="/safety/inspection-checker" element={<CheckerView />} /> */}
//         {/*  TRANSMITAL FORMS */}
//         <Route path="/documents/*" element={<Documents />} />
//         {/* Vendor */}
//         <Route path="/Vendors" element={<Vendors />} />
//         <Route path="/mir" element={<Index />} />
//         <Route path="/mir/checklist" element={<MIRChecklist />} />
//         <Route
//           path="/safety/inspection-checker"
//           element={<UserChecklistDashboard />}
//         />
//         <Route
//           path="/safety/observations"
//           element={<ObservationsDashboard />}
//         />
//         <Route path="/safety/inspection-report/:id" element={<ViewReport />} />
//         <Route path="/safety/document-pro" element={<DocumentPro />} />
//         {/* <Route path="/overview/project/:projectId" element={<ProjectOverviewPage />} /> */}
//         <Route path="/forms" element={<FormsEnginePage />} />
//         <Route path="/form-packs" element={<FormPacksPage />} />
//         {/* <Route path="/project-forms" element={<ProjectFormsAssignedPage />} /> */}
//         <Route
//           path="/project-forms"
//           element={<ManualLocationChecklistPanel />}
//         />
//         <Route path="/project-forms/fill" element={<ProjectFormFillPage />} />
//         <Route path="/mir/create" element={<MIRCreatePage />} />
//         <Route path="/mir/:id" element={<MIRDetailPage />} />
//         <Route path="/mir/inbox" element={<MIRInboxPage />} />
//         <Route path="/wir/create" element={<WIRCreatePage />} />
//         <Route
//           path="/wir/inbox"
//           element={<Navigate to="/mir/inbox" replace />}
//         />
//         <Route path="/wir/:id" element={<WIRDetailPage />} />
//         <Route path="/safety/my-sessions" element={<SafetyMySessionsList />} />
//         {/* Checklists New Standalone Dashboard */}
//         <Route path="/checklists" element={<QHSEChecklistDashboard />} />
//         <Route
//           path="/checklists/create"
//           element={<QHSEChecklistCreatePage />}
//         />
//         <Route path="/checklists/inbox" element={<QHSEChecklistInboxPage />} />
//         <Route
//           path="/checklists/fill/:id"
//           element={<QHSEChecklistFormPage />}
//         />
//         <Route
//           path="/safety/my-sessions/:id"
//           element={<SafetyMySessionDetail />}
//         />
//         <Route
//           path="/safety/sessions/:id"
//           element={<SafetySessionManagerView />}
//         />
//         {/*  TRANSMITAL FORMS */}
//         <Route path="/documents/*" element={<Documents />} />
//         {/* Vendor */}
//         <Route path="/Vendors" element={<Vendors />} />
//         <Route path="/attendance/project" element={<AttendanceProjectPage />} />
//         <Route path="/my-forms" element={<MyFormResponsesPage />} />
//         <Route path="/my-forms/:id" element={<MyFormResponseDetailPage />} />
//         <Route path="/UsersManagement" element={<UsersManagement />} />
//         <Route path="/Initialize-Checklist" element={<InitializeChecklist />} />
//         <Route
//           path="/PendingInspector-Checklist"
//           element={<PendingInspectorChecklists />}
//         />
//         <Route
//           path="/Pending-For-MakerItems"
//           element={<PendingForMakerItems />}
//         />
//         <Route path="/guard/onboarding" element={<GuardOnboarding />} />
//         <Route path="/guard/attendance" element={<GuardAttendance />} />
//         <Route path="/chif-setup" element={<ChifSetup />} />
//         <Route path="/Chifstep1" element={<Chifstep1 />} />
//         {/* <Route path="/Checklist" element={<Checklist />} /> */}
//         <Route path="/Checklist" element={<ChecklistManager />} />
//         <Route path="/setup" element={<Setup />} />
//         <Route path="/user-setup" element={<UserSetup />} />
//         <Route path="/user" element={<User />} />
//         <Route path="/privacy" element={<PrivacyPage />} />
//         <Route path="/scheduling" element={<Scheduling />} />
//         <Route path="/category-sidebar" element={<CategoryChecklist />} />
//         <Route path="/edit-checklist/:id" element={<EditCheckList />} />
//         <Route
//           path="/hierarchical-verifications"
//           element={<HierarchicalVerifications />}
//         />
//         {/* <Route
//           path="/inspection/flat/:flatId"
//           element={<FlatInspectionPage />}
//         /> */}
//         {/* Add more as needed */}
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </Layout1>
//   );
// }

// Your main app routes
function AppRoutes() {
  const location = useLocation();

  const isVendorOnboardingRoute =
    location.pathname.startsWith("/vendor/onboarding/");

  const isMobileLoginRoute = location.pathname === "/mobile-login";
  if (location.pathname === "/login" || isVendorOnboardingRoute || isMobileLoginRoute) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/mobile-login" element={<MobileLogin />} />
        <Route
          path="/vendor/onboarding/:token"
          element={<VendorOnboarding />}
        />
      </Routes>
    );
  }

  return (
    <Layout1>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/overview/project/:id"
          element={
            <ProjectOverviewGuard>
              <ProjectOverview />
            </ProjectOverviewGuard>
          }
        />
        <Route path="/config" element={<Configuration />} />
        <Route path="/all-checklists" element={<AllChecklists />} />
        <Route path="/my-ongoing-checklist" element={<MyOngoingChecklist />} />
        <Route path="/checker-inbox" element={<CheckerInbox />} />
        <Route path="/create-purpose" element={<CreatePurposePage />} />
        <Route
          path="/user-management-setup"
          element={<UserManagementSetup />}
        />
        <Route
          path="/projects/:id/flat-report/:flatId"
          element={<FlatReport />}
        />
        <Route
          path="/project-forms/setup"
          element={<ProjectFormsManagerSetupPage />}
        />

        <Route path="/project/:id" element={<ProjectDetails />} />
        <Route path="/snagging/:id" element={<Snagging />} />
        <Route
          path="/project/:projectId/tower/:towerId"
          element={<FlatMatrixTable />}
        />
        <Route
          path="/project/:projectId/tower/:towerId/floor/:levelId/flat-inspection/:flatId"
          element={<FlatInspectionPage />}
        />
        <Route path="/checklistfloor/:id" element={<ChecklistFloor />} />
        <Route path="/checklistpage/:id" element={<ChecklistPage />} />
        <Route path="/casetup" element={<CASetup />} />
        <Route path="/SiteConfig" element={<SiteConfig />} />
        <Route path="/UserHome" element={<UserHome />} />
        <Route path="/SlotConfig" element={<SlotConfig />} />
        <Route path="/RequestManagement" element={<RequestManagement />} />
        <Route path="/CoustemerHandover" element={<CoustemerHandover />} />
        <Route path="/Chif" element={<Chif />} />
        <Route path="/analytics" element={<UserDashboard />} />
        <Route
          path="/PendingSupervisorItems"
          element={<PendingSupervisorItems />}
        />

        <Route path="/safety" element={<Safety />} />

        <Route
          path="/safety/sessions"
          element={<SafetySessionsManagerList />}
        />
        <Route
          path="/safety/sessions/create"
          element={<SafetySessionCreatePage />}
        />

        <Route
          path="/safety/permit-to-work"
          element={<PermitToWorkDashboard />}
        />
        <Route
          path="/safety/permit-to-work/create"
          element={<PermitToWork />}
        />

        <Route path="/safetyInspections" element={<SafetyInspectionList />} />
        <Route
          path="/safetyInpection/create"
          element={<CreateSafetyInspection />}
        />
        <Route
          path="/safety/observations/create"
          element={<CreateSafetyInspection />}
        />

        {/* <Route path="/safetySetup" element={<SafetySetup />} /> */}

        <Route path="/safetySetup" element={<SafetyFormats />} />
        <Route path="/safetySetup/create" element={<SafetyWizard />} />

        <Route path="/safety/permit" element={<UserPermitDashboard />} />

        <Route
          path="/permit/setup"
          element={<PermitTemplateBuilderDashboard />}
        />
        <Route
          path="/safety/inspection-checker"
          element={<UserChecklistDashboard />}
        />
        <Route
          path="/safety/observations"
          element={<ObservationsDashboard />}
        />
        <Route path="/safety/inspection-report/:id" element={<ViewReport />} />

        <Route path="/safety/document-pro" element={<DocumentPro />} />

        {/*  TRANSMITAL FORMS */}

        <Route path="/documents/*" element={<Documents />} />
        {/* NCR */}
        <Route path="/NCR" element={<NCRListPage />} />
        <Route path="/ncr/create" element={<NCRCreatePage />} />
        {/* Vendor */}
        <Route path="/Vendors" element={<Vendors />} />

        <Route path="/mir" element={<Index />} />

        <Route path="/mir/checklist" element={<MIRChecklist />} />

        {/* <Route path="/overview/project/:projectId" element={<ProjectOverviewPage />} /> */}v

        <Route path="/forms" element={<FormsEnginePage />} />
        <Route path="/form-packs" element={<FormPacksPage />} />
        {/* <Route path="/project-forms" element={<ProjectFormsAssignedPage />} /> */}
        <Route path="/project-forms/fill" element={<ProjectFormFillPage />} />

        <Route
          path="/project-forms"
          element={<ManualLocationChecklistPanel />}
        />
        <Route path="/project-forms/fill" element={<ProjectFormFillPage />} />

        <Route path="/mir/create" element={<MIRCreatePage />} />
        <Route path="/mir/:id" element={<MIRDetailPage />} />
        <Route path="/mir/inbox" element={<MIRInboxPage />} />
        <Route path="/wir/create" element={<WIRCreatePage />} />
        <Route
          path="/wir/inbox"
          element={<Navigate to="/mir/inbox" replace />}
        />

        {/* Checklists New Standalone Dashboard */}
        <Route path="/checklists" element={<QHSEChecklistDashboard />} />
        <Route
          path="/checklists/create"
          element={<QHSEChecklistCreatePage />}
        />
        <Route path="/checklists/inbox" element={<QHSEChecklistInboxPage />} />
        <Route
          path="/checklists/fill/:id"
          element={<QHSEChecklistFormPage />}
        />

        <Route path="/wir/:id" element={<WIRDetailPage />} />
        <Route path="/safety/my-sessions" element={<SafetyMySessionsList />} />
        <Route
          path="/safety/my-sessions/:id"
          element={<SafetyMySessionDetail />}
        />
        <Route
          path="/safety/sessions/:id"
          element={<SafetySessionManagerView />}
        />

        <Route path="/attendance/project" element={<AttendanceProjectPage />} />
        <Route path="/my-forms" element={<MyFormResponsesPage />} />
        <Route path="/my-forms/:id" element={<MyFormResponseDetailPage />} />

        <Route path="/UsersManagement" element={<UsersManagement />} />
        <Route path="/Initialize-Checklist" element={<InitializeChecklist />} />
        <Route
          path="/PendingInspector-Checklist"
          element={<PendingInspectorChecklists />}
        />
        <Route
          path="/Pending-For-MakerItems"
          element={<PendingForMakerItems />}
        />
        <Route path="/guard/onboarding" element={<GuardOnboarding />} />
        <Route path="/guard/attendance" element={<GuardAttendance />} />

        <Route path="/chif-setup" element={<ChifSetup />} />
        <Route path="/Chifstep1" element={<Chifstep1 />} />
        {/* <Route path="/Checklist" element={<Checklist />} /> */}
        <Route path="/Checklist" element={<ChecklistManager />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/user-setup" element={<UserSetup />} />
        <Route path="/user" element={<User />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/scheduling" element={<Scheduling />} />

        <Route path="/category-sidebar" element={<CategoryChecklist />} />
        <Route path="/edit-checklist/:id" element={<EditCheckList />} />
        <Route
          path="/hierarchical-verifications"
          element={<HierarchicalVerifications />}
        />
        {/* Add more as needed */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout1>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <BodyBgController />
          <AppRoutes />
        </Router>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
