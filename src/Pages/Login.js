// import React, { useEffect, useState } from "react";
// import { Eye, EyeOff, Building2 } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { toast, ToastContainer } from "react-toastify";
// import { login } from "../api";
// import { setUserData } from "../store/userSlice";
// import "react-toastify/dist/ReactToastify.css";
// import Bg1 from "../Images/image.jpg";
// import Bg2 from "../Images/image1.jpg";
// import Bg3 from "../Images/image2.jpg";
// import { getUserDetailsById } from "../api";
// import { setLoggingOut } from "../api/axiosInstance";

// // Carousel Config
// const BG_IMAGES = [Bg1, Bg2, Bg3];
// const BG_INTERVAL = 7000;


// function deriveRolesFromToken(tokenData) {
//   if (!tokenData) return [];
//   let roles = Array.isArray(tokenData.roles) ? [...tokenData.roles] : [];

//   // token me aane wale watcher flags ko bhi roles me push kar do
//   if (tokenData.is_project_manager && !roles.includes("PROJECT_MANAGER")) {
//     roles.push("PROJECT_MANAGER");
//   }
//   if (tokenData.is_project_head && !roles.includes("PROJECT_HEAD")) {
//     roles.push("PROJECT_HEAD");
//   }

//   return roles;
// }

// function getDisplayRole(userData) {
//   if (!userData) return "User";

//   let allRoles = [];
//   if (Array.isArray(userData.accesses)) {
//     userData.accesses.forEach((access) => {
//       if (Array.isArray(access.roles)) {
//         access.roles.forEach((role) => {
//           const roleStr = typeof role === "string" ? role : role?.role;
//           if (roleStr) allRoles.push(roleStr);
//         });
//       }
//     });
//   }

//   // top-level priority flags
//   if (userData?.superadmin || userData?.is_staff) return "Super Admin";
//   if (userData?.is_client) return "Admin"; // Treat Client as Admin

//   // 🔴 NEW — watcher flags ko priority do
//   if (userData?.is_project_head) return "Project Head";
//   if (userData?.is_project_manager) return "Project Manager";

//   // normal manager
//   if (userData?.is_manager) return "Manager";

//   if (allRoles.length > 0) {
//     const uniqueRoles = [...new Set(allRoles)];
//     const upper = uniqueRoles.map((r) => String(r).toUpperCase());

//     // agar roles array me hi PROJECT_MANAGER/HEAD aa raha ho to bhi handle karo
//     if (upper.includes("PROJECT_HEAD")) return "Project Head";
//     if (upper.includes("PROJECT_MANAGER")) return "Project Manager";

//     return uniqueRoles.join(", ");
//   }

//   return "User";
// }




// function hasSecurityGuardRole(data) {
//    if (!data) return false;
//    const norm = (s) => String(s || "").trim().toUpperCase();
//    const roles = new Set();
//    // token top-level single role
//    if (data.role) roles.add(norm(data.role));
//    // token/user top-level roles[]
//    (data.roles || []).forEach(r => roles.add(norm(typeof r === "string" ? r : r?.role)));
//    // per-access roles
//    (data.accesses || []).forEach(a =>
//      (a.roles || []).forEach(r => roles.add(norm(typeof r === "string" ? r : r?.role)))
//    );
//    // treat these as "security guard" — include "STAFF" only if you want staff to land on guard pages
//    const guardSynonyms = new Set(["SECURITY_GUARD","SECURITY GUARD","GUARD"]);
//    return [...roles].some(r => guardSynonyms.has(r));
//  }



// const Login = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const [formData, setFormData] = useState({
//     username: "",
//     password: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [page, setPage] = useState("login");
//   const [isLoading, setIsLoading] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
//   const [bgIndex, setBgIndex] = useState(0);
//    // --- Avatar cache helpers ---
//  const BASE = "https://konstruct.world";
//  const AVATAR_URL_KEY = (id) => `USER_AVATAR_URL_${id}`;
//  const AVATAR_B64_KEY = (id) => `USER_AVATAR_DATAURL_${id}`;
//  const toAbsolute = (u) =>
//    !u ? "" : /^https?:\/\//i.test(u) ? u : `${BASE}${u.startsWith("/") ? "" : "/"}${u}`;
//   const cacheBust = (url) => (url ? `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}` : url);

// const blobToDataURL = (blob) =>
//    new Promise((res) => {
//      const fr = new FileReader();
//      fr.onload = () => res(fr.result);
//      fr.readAsDataURL(blob);
//    });
// useEffect(() => {
//   setLoggingOut(false); // we’ve arrived at /login; allow requests again
// }, []);




// function isSameOrigin(u) {
//    try { return new URL(u, window.location.origin).origin === window.location.origin; }
//    catch { return false; }
//  }
//  async function safeFetchToDataURL(url) {
//    // 🚫 Skip converting cross-origin images in dev — prevents CORS errors in console
//    if (!isSameOrigin(url)) return null;
//    try {
//      const resp = await fetch(url, { mode: "cors", credentials: "include" });
//      if (!resp.ok) return null;
//      const blob = await resp.blob();
//      return await blobToDataURL(blob);
//    } catch {
//      return null;
//    } }
//  async function cacheAvatarForUser(user) {
//    const userId = String(user?.user_id || user?.id || "");
//    if (!userId) return user;
//    const raw = user?.profile_image || user?.photo || "";
//    const abs = toAbsolute(raw);
//    const finalUrl = abs ? cacheBust(abs) : null;
//    if (finalUrl) localStorage.setItem(AVATAR_URL_KEY(userId), finalUrl);
//    // Best effort base64 (CORS may block; that's OK)
//    const b64 = abs ? await safeFetchToDataURL(abs) : null;
//    if (b64) localStorage.setItem(AVATAR_B64_KEY(userId), b64);
//    const merged = finalUrl ? { ...user, profile_image: finalUrl, photo: finalUrl } : user;
//    localStorage.setItem("USER_DATA", JSON.stringify(merged));
//    return merged;
//  }

 


//   // Carousel logic
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setBgIndex((prev) => (prev + 1) % BG_IMAGES.length);
//     }, BG_INTERVAL);
//     return () => clearInterval(interval);
//   }, []);

//   // JWT decode helper
//   const decodeJWT = (token) => {
//     try {
//       const base64Url = token.split(".")[1];
//       const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//       const jsonPayload = decodeURIComponent(
//         atob(base64)
//           .split("")
//           .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
//           .join("")
//       );
//       return JSON.parse(jsonPayload);
//     } catch (error) {
//       console.error("Error decoding JWT:", error);
//       return null;
//     }
//   };

//   // Restore session on mount
//   // Restore session on mount (paste this whole effect)
// useEffect(() => {
//   const token =
//     localStorage.getItem("ACCESS_TOKEN") ||
//     localStorage.getItem("TOKEN") ||
//     localStorage.getItem("token");
//   if (!token) return;

//   const tokenData = decodeJWT(token);
//   if (!tokenData) return;
// const mergedRoles = deriveRolesFromToken(tokenData);

//   // Build a user object straight from JWT (includes photo/profile_image we put in the token)
//     const userFromJWT = {
//     id: tokenData.user_id,
//     user_id: tokenData.user_id,
//     username: tokenData.username,
//     email: tokenData.email,
//     phone_number: tokenData.phone_number,
//     has_access: tokenData.has_access,
//     is_client: tokenData.is_client,
//     superadmin: tokenData.superadmin,
//     is_manager: tokenData.is_manager,

//     // watcher flags + project lists
//     is_project_manager: tokenData.is_project_manager,
//     is_project_head: tokenData.is_project_head,
//     project_manager_projects: tokenData.project_manager_projects || [],
//     project_head_projects: tokenData.project_head_projects || [],

//     accesses: tokenData.accesses || [],
//     org: tokenData.org,
//     company: tokenData.company,
//     entity: tokenData.entity,
//     role: tokenData.role,
//     roles: tokenData.roles,

//     // avatar
//     profile_image: tokenData.profile_image || tokenData.photo || null,
//     photo:        tokenData.profile_image || tokenData.photo || null,

//     // 🔴 NEW — signature persisted in JWT
//     signature_url: tokenData.signature_url || null,
//     signature_width: tokenData.signature_width ?? null,
//     signature_height: tokenData.signature_height ?? null,
//   };


//   // Redux + localStorage
//   dispatch(setUserData(userFromJWT));
//   localStorage.setItem("ACCESSES", JSON.stringify(userFromJWT.accesses));
//   localStorage.setItem("ROLE", getDisplayRole(userFromJWT));

//   // Warm the avatar cache and make the URL absolute + cache-busted
//   cacheAvatarForUser(userFromJWT);

//   if (hasSecurityGuardRole(userFromJWT)) {
//     navigate("/guard/onboarding");
//   } else {
//     navigate("/config");
//   }
//   toast.success("You are already logged in!");
// }, [navigate, dispatch]);

//   const onChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   // --- LOGIN HANDLER ---
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     if (!formData.username || !formData.password) {
//       toast.error("Please fill in all fields");
//       return;
//     }
//     setIsLoading(true);

//     try {
//       const response = await login({
//         username: formData.username,
//         password: formData.password,
//       });

//       if (response.status === 200) {
//         localStorage.setItem("ACCESS_TOKEN", response.data.access);
//         localStorage.setItem("REFRESH_TOKEN", response.data.refresh);
//         localStorage.setItem("token", response.data.access);

//         // Set ACCESSES (for sidebars)
//         const tokenData = decodeJWT(response.data.access);
//         const accesses = tokenData && tokenData.accesses ? tokenData.accesses : [];
//         localStorage.setItem("ACCESSES", JSON.stringify(accesses));

//         // Prepare userData for redux & storage
//         let userData = null;
//         if (response.data.user) {
//           userData = response.data.user;
//           } else if (tokenData) {
//   const mergedRoles = deriveRolesFromToken(tokenData);

//   userData = {
//     id: tokenData.user_id,
//     user_id: tokenData.user_id,
//     username: tokenData.username,
//     email: tokenData.email,
//     phone_number: tokenData.phone_number,
//     has_access: tokenData.has_access,
//     is_client: tokenData.is_client,
//     superadmin: tokenData.superadmin,
//     is_manager: tokenData.is_manager,

//     // 🔴 NEW watcher flags
//     is_project_manager: tokenData.is_project_manager,
//     is_project_head: tokenData.is_project_head,
//     project_manager_projects: tokenData.project_manager_projects || [],
//     project_head_projects: tokenData.project_head_projects || [],

//     org: tokenData.org,
//     company: tokenData.company,
//     entity: tokenData.entity,
//     role: tokenData.role,
//     roles: mergedRoles,
//     accesses: tokenData.accesses || [],
//     profile_image: tokenData.profile_image || tokenData.photo || null,
//     photo:        tokenData.profile_image || tokenData.photo || null,
//     signature_url: tokenData.signature_url || null,
//     signature_width: tokenData.signature_width ?? null,
//     signature_height: tokenData.signature_height ?? null,
//   };
// }

       
//         if (!userData && tokenData?.user_id) {
//           try {
//             const res = await getUserDetailsById(tokenData.user_id);
//             userData = res?.data || null;
//          } catch {}
//         }


// if (userData) {
//   if (tokenData) {
//     // photo sync
//     const fromJWT = tokenData.profile_image || tokenData.photo || null;
//     if (fromJWT && !userData.profile_image) userData.profile_image = fromJWT;
//     if (fromJWT && !userData.photo)         userData.photo = fromJWT;

//     if (tokenData.signature_url && !userData.signature_url) {
//       userData.signature_url = tokenData.signature_url;
//     }
//     if (
//       tokenData.signature_width !== undefined &&
//       userData.signature_width == null
//     ) {
//       userData.signature_width = tokenData.signature_width;
//     }
//     if (
//       tokenData.signature_height !== undefined &&
//       userData.signature_height == null
//     ) {
//       userData.signature_height = tokenData.signature_height;
//     }

//     // 🔴 NEW: watcher flags + roles sync from token
//     if (tokenData.is_project_manager !== undefined) {
//       userData.is_project_manager = tokenData.is_project_manager;
//       userData.project_manager_projects = tokenData.project_manager_projects || [];
//     }
//     if (tokenData.is_project_head !== undefined) {
//       userData.is_project_head = tokenData.is_project_head;
//       userData.project_head_projects = tokenData.project_head_projects || [];
//     }

//     const mergedRoles = deriveRolesFromToken(tokenData);
//     if (!userData.roles || !userData.roles.length) {
//       userData.roles = mergedRoles;
//     } else {
//       userData.roles = [...new Set([...(userData.roles || []), ...mergedRoles])];
//     }
//   }

//   userData = await cacheAvatarForUser(userData);
//   dispatch(setUserData(userData));
//   localStorage.setItem("ROLE", getDisplayRole(userData));
// }


//         toast.success("Logged in successfully!");
//         if (hasSecurityGuardRole(userData || tokenData)) {
//    navigate("/guard/onboarding");
//  } else {
//    navigate("/config");
//  }


//       } else {
//         toast.error("Invalid credentials.");
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         toast.error("Invalid username or password");
//       } else if (error.response?.status === 400) {
//         toast.error("Please check your credentials");
//       } else if (error.response?.data?.detail) {
//         toast.error(error.response.data.detail);
//       } else {
//         toast.error("Login failed. Please try again.");
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const togglePassword = () => setShowPassword((prev) => !prev);

//   return (
//     <div
//       className="h-screen relative flex items-center justify-center transition-all duration-1000"
//       style={{
//         backgroundImage: `url(${BG_IMAGES[bgIndex]})`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//         backgroundRepeat: "no-repeat",
//         transition: "background-image 1s ease-in-out",
//       }}
//     >
//       <div className="absolute inset-0 bg-black/50 z-0"></div>
//       {/* Login Card */}
//       <div
//         className="relative z-10 w-full max-w-md mx-4 md:w-[420px] rounded-2xl p-8 md:p-10 shadow-2xl border border-white/20"
//         style={{
//           background: "rgba(255,255,255,0.18)",
//           boxShadow:
//             "0 8px 32px 0 rgba(31, 38, 135, 0.23), 0 1.5px 2.5px 0 rgba(234,104,34,0.04)",
//           backdropFilter: "blur(18px)",
//           WebkitBackdropFilter: "blur(18px)",
//         }}
//       >
//         {/* Logo and Title */}
//         <div className="text-center mb-8">
//           <div className="flex justify-center mb-4">
//             <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
//               <Building2 className="w-8 h-8 text-slate-800" />
//             </div>
//           </div>
//           <h1 className="text-2xl md:text-3xl font-bold text-[#ea6822] mb-1 tracking-wider">
//             KONSTRUCT.WORLD
//           </h1>
//         </div>

//         {page === "login" && (
//           <form className="space-y-6" onSubmit={handleLogin}>
//             <div>
//               <input
//                 type="text"
//                 name="username"
//                 id="username"
//                 className="w-full px-4 py-3 bg-white/70 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
//                 placeholder="Username"
//                 onChange={onChange}
//                 value={formData.username}
//                 disabled={isLoading}
//                 required
//                 style={{ backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)" }}
//               />
//             </div>
//             <div className="relative">
//               <input
//                 name="password"
//                 id="password"
//                 className="w-full px-4 py-3 bg-white/70 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all pr-12"
//                 placeholder="Password"
//                 type={showPassword ? "text" : "password"}
//                 onChange={onChange}
//                 value={formData.password}
//                 disabled={isLoading}
//                 required
//                 style={{ backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)" }}
//               />
//               <button
//                 type="button"
//                 onClick={togglePassword}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800 focus:outline-none"
//                 tabIndex={-1}
//               >
//                 {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
//               </button>
//             </div>
//             {/* Remember Me & Terms */}
//             <div className="space-y-3">
//               <label className="flex items-center space-x-2 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={rememberMe}
//                   onChange={(e) => setRememberMe(e.target.checked)}
//                   className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
//                 />
//                 <span className="text-sm text-black-700">Remember me</span>
//               </label>
//               <p className="text-xs text-black-600 text-center leading-relaxed">
//                 By clicking Log in you are accepting our{" "}
//                 <span className="text-sky-500 hover:text-sky-700 underline cursor-pointer">
//                   Privacy Policy
//                 </span>{" "}
//                 & agree to the{" "}
//                 <span className="text-sky-500 hover:text-sky-700 underline cursor-pointer">
//                   Terms & Conditions
//                 </span>
//                 .
//               </p>
//             </div>
//             <button
//               type="submit"
//               className={`w-full py-3 bg-amber-500 text-slate-800 rounded-lg font-semibold text-lg transition-all duration-300 ${
//                 isLoading
//                   ? "opacity-50 cursor-not-allowed"
//                   : "hover:bg-amber-400 hover:shadow-lg transform hover:-translate-y-0.5"
//               }`}
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <span className="flex items-center justify-center">
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Logging in...
//                 </span>
//               ) : (
//                 "LOGIN"
//               )}
//             </button>
//             <div className="text-center">
//               <span className="text-sm text-black-500 hover:text-slate-700 cursor-pointer">
//                 Forgot Password?
//               </span>
//             </div>
//           </form>
//         )}

//         {page === "sso" && (
//           <div className="space-y-6">
//             <div className="text-center text-[#ea6822] mb-6">
//               <h2 className="text-xl font-semibold">SSO Login</h2>
//               <p className="text-sm text-gray-500 mt-2">Single Sign-On authentication</p>
//             </div>
//             <button
//               onClick={() => setPage("login")}
//               className="w-full py-3 bg-amber-500 text-slate-800 rounded-lg font-semibold text-lg hover:bg-amber-400 transition-all"
//             >
//               Back to Login
//             </button>
//           </div>
//         )}

//         {page === "login" && (
//           <div className="mt-6 text-center">
//             <button
//               type="button"
//               onClick={() => setPage("sso")}
//               className="text-sm text-black-500 hover:text-[#ea6822] transition-colors"
//               disabled={isLoading}
//             >
//               Login with SSO
//             </button>
//           </div>
//         )}
//       </div>
//       <ToastContainer position="top-center" />
//     </div>
//   );
// };

// export default Login;



import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { login } from "../api";
import { setUserData } from "../store/userSlice";
import "react-toastify/dist/ReactToastify.css";
import Bg1 from "../Images/image.jpg";
import Bg2 from "../Images/image1.jpg";
import Bg3 from "../Images/image2.jpg";
import { getUserDetailsById } from "../api";
import { setLoggingOut } from "../api/axiosInstance";
import { initializeActiveProject } from "../utils/projectInitializer";

// Carousel Config
const BG_IMAGES = [Bg1, Bg2, Bg3];
const BG_INTERVAL = 7000;

/** =========================
 *  ✅ ROLE DEFAULTING LOGIC
 *  Rule: If Initializer present -> ALWAYS default to it on login / app restore.
 *  ========================= */
const normRole = (r) => String(r || "").trim().toUpperCase();
const isInitializerRole = (r) => {
  const x = normRole(r);
  return x === "INTIALIZER" || x === "INITIALIZER"; // handle both spellings
};
const CANON_INIT = "INTIALIZER"; // keep consistent with your existing app

const extractAllRolesFromUser = (userData) => {
  const roles = new Set();

  if (!userData) return roles;

  // top-level single role
  if (userData.role) roles.add(normRole(userData.role));

  // top-level roles[]
  if (Array.isArray(userData.roles)) {
    userData.roles.forEach((r) => {
      const roleStr = typeof r === "string" ? r : r?.role || r?.name;
      if (roleStr) roles.add(normRole(roleStr));
    });
  }

  // per-access roles[]
  if (Array.isArray(userData.accesses)) {
    userData.accesses.forEach((a) => {
      if (Array.isArray(a.roles)) {
        a.roles.forEach((r) => {
          const roleStr = typeof r === "string" ? r : r?.role || r?.name;
          if (roleStr) roles.add(normRole(roleStr));
        });
      } else if (a.role) {
        roles.add(normRole(a.role));
      }
    });
  }

  return roles;
};

const forceInitializerAsDefaultOnLogin = (userData) => {
  const rolesSet = extractAllRolesFromUser(userData);
  const hasInit = [...rolesSet].some((r) => isInitializerRole(r));

  if (!hasInit) return;

  // ✅ FORCE every login / restore
  localStorage.setItem("ACTIVE_ROLE", CANON_INIT);
  localStorage.setItem("FLOW_ROLE", CANON_INIT);

  // ✅ notify same tab listeners (storage event doesn't fire on same tab)
  window.dispatchEvent(
    new CustomEvent("ACTIVE_ROLE_CHANGED", { detail: { role: CANON_INIT } })
  );
};

function deriveRolesFromToken(tokenData) {
  if (!tokenData) return [];
  let roles = Array.isArray(tokenData.roles) ? [...tokenData.roles] : [];

  // token me aane wale watcher flags ko bhi roles me push kar do
  if (tokenData.is_project_manager && !roles.includes("PROJECT_MANAGER")) {
    roles.push("PROJECT_MANAGER");
  }
  if (tokenData.is_project_head && !roles.includes("PROJECT_HEAD")) {
    roles.push("PROJECT_HEAD");
  }

  return roles;
}

function getDisplayRole(userData) {
  if (!userData) return "User";

  let allRoles = [];
  if (Array.isArray(userData.accesses)) {
    userData.accesses.forEach((access) => {
      if (Array.isArray(access.roles)) {
        access.roles.forEach((role) => {
          const roleStr = typeof role === "string" ? role : role?.role;
          if (roleStr) allRoles.push(roleStr);
        });
      }
    });
  }

  // top-level priority flags
  if (userData?.superadmin || userData?.is_staff) return "Super Admin";
  if (userData?.is_client) return "Admin"; // Treat Client as Admin

  // 🔴 NEW — watcher flags ko priority do
  if (userData?.is_project_head) return "Project Head";
  if (userData?.is_project_manager) return "Project Manager";

  // normal manager
  if (userData?.is_manager) return "Manager";

  if (allRoles.length > 0) {
    const uniqueRoles = [...new Set(allRoles)];
    const upper = uniqueRoles.map((r) => String(r).toUpperCase());

    // agar roles array me hi PROJECT_MANAGER/HEAD aa raha ho to bhi handle karo
    if (upper.includes("PROJECT_HEAD")) return "Project Head";
    if (upper.includes("PROJECT_MANAGER")) return "Project Manager";

    return uniqueRoles.join(", ");
  }

  return "User";
}

function hasSecurityGuardRole(data) {
  if (!data) return false;
  const norm = (s) => String(s || "").trim().toUpperCase();
  const roles = new Set();
  // token top-level single role
  if (data.role) roles.add(norm(data.role));
  // token/user top-level roles[]
  (data.roles || []).forEach((r) =>
    roles.add(norm(typeof r === "string" ? r : r?.role))
  );
  // per-access roles
  (data.accesses || []).forEach((a) =>
    (a.roles || []).forEach((r) =>
      roles.add(norm(typeof r === "string" ? r : r?.role))
    )
  );
  // treat these as "security guard"
  const guardSynonyms = new Set(["SECURITY_GUARD", "SECURITY GUARD", "GUARD"]);
  return [...roles].some((r) => guardSynonyms.has(r));
}

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [page, setPage] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  // --- Avatar cache helpers ---
  const BASE = "https://konstruct.world";
  const AVATAR_URL_KEY = (id) => `USER_AVATAR_URL_${id}`;
  const AVATAR_B64_KEY = (id) => `USER_AVATAR_DATAURL_${id}`;
  const toAbsolute = (u) =>
    !u
      ? ""
      : /^https?:\/\//i.test(u)
      ? u
      : `${BASE}${u.startsWith("/") ? "" : "/"}${u}`;
  const cacheBust = (url) =>
    url ? `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}` : url;

  const blobToDataURL = (blob) =>
    new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(blob);
    });

  useEffect(() => {
    setLoggingOut(false); // we’ve arrived at /login; allow requests again
  }, []);

  function isSameOrigin(u) {
    try {
      return (
        new URL(u, window.location.origin).origin === window.location.origin
      );
    } catch {
      return false;
    }
  }
  async function safeFetchToDataURL(url) {
    // 🚫 Skip converting cross-origin images in dev — prevents CORS errors in console
    if (!isSameOrigin(url)) return null;
    try {
      const resp = await fetch(url, { mode: "cors", credentials: "include" });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      return await blobToDataURL(blob);
    } catch {
      return null;
    }
  }
  async function cacheAvatarForUser(user) {
    const userId = String(user?.user_id || user?.id || "");
    if (!userId) return user;
    const raw = user?.profile_image || user?.photo || "";
    const abs = toAbsolute(raw);
    const finalUrl = abs ? cacheBust(abs) : null;
    if (finalUrl) localStorage.setItem(AVATAR_URL_KEY(userId), finalUrl);
    // Best effort base64 (CORS may block; that's OK)
    const b64 = abs ? await safeFetchToDataURL(abs) : null;
    if (b64) localStorage.setItem(AVATAR_B64_KEY(userId), b64);
    const merged = finalUrl
      ? { ...user, profile_image: finalUrl, photo: finalUrl }
      : user;
    localStorage.setItem("USER_DATA", JSON.stringify(merged));
    return merged;
  }

  // Carousel logic
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BG_IMAGES.length);
    }, BG_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // JWT decode helper
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  // Restore session on mount (paste this whole effect)
  useEffect(() => {
    const token =
      localStorage.getItem("ACCESS_TOKEN") ||
      localStorage.getItem("TOKEN") ||
      localStorage.getItem("token");
    if (!token) return;

    const tokenData = decodeJWT(token);
    if (!tokenData) return;

    const mergedRoles = deriveRolesFromToken(tokenData);

    // Build a user object straight from JWT (includes photo/profile_image we put in the token)
    const userFromJWT = {
      id: tokenData.user_id,
      user_id: tokenData.user_id,
      username: tokenData.username,
      email: tokenData.email,
      phone_number: tokenData.phone_number,
      has_access: tokenData.has_access,
      is_client: tokenData.is_client,
      superadmin: tokenData.superadmin,
      is_manager: tokenData.is_manager,

      // watcher flags + project lists
      is_project_manager: tokenData.is_project_manager,
      is_project_head: tokenData.is_project_head,
      project_manager_projects: tokenData.project_manager_projects || [],
      project_head_projects: tokenData.project_head_projects || [],

      accesses: tokenData.accesses || [],
      org: tokenData.org,
      company: tokenData.company,
      entity: tokenData.entity,
      role: tokenData.role,
      roles: mergedRoles, // ✅ use merged roles

      // avatar
      profile_image: tokenData.profile_image || tokenData.photo || null,
      photo: tokenData.profile_image || tokenData.photo || null,

      // signature persisted in JWT
      signature_url: tokenData.signature_url || null,
      signature_width: tokenData.signature_width ?? null,
      signature_height: tokenData.signature_height ?? null,
    };

    // Redux + localStorage
    dispatch(setUserData(userFromJWT));
    localStorage.setItem("ACCESSES", JSON.stringify(userFromJWT.accesses));
    localStorage.setItem("ROLE", getDisplayRole(userFromJWT));

    // ✅ FORCE initializer default on restore as well
    forceInitializerAsDefaultOnLogin(userFromJWT);

    // Warm the avatar cache and make the URL absolute + cache-busted
    cacheAvatarForUser(userFromJWT);

    if (hasSecurityGuardRole(userFromJWT)) {
      navigate("/guard/onboarding");
    } else {
      navigate("/config");
    }
    toast.success("You are already logged in!");
  }, [navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // --- LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);

    try {
      const response = await login({
        username: formData.username,
        password: formData.password,
      });

      if (response.status === 200) {
        localStorage.setItem("ACCESS_TOKEN", response.data.access);
        localStorage.setItem("REFRESH_TOKEN", response.data.refresh);
        localStorage.setItem("token", response.data.access);

        // Set ACCESSES (for sidebars)
        const tokenData = decodeJWT(response.data.access);
        const accesses = tokenData && tokenData.accesses ? tokenData.accesses : [];
        localStorage.setItem("ACCESSES", JSON.stringify(accesses));

        // Prepare userData for redux & storage
        let userData = null;

        if (response.data.user) {
          userData = response.data.user;
        } else if (tokenData) {
          const mergedRoles = deriveRolesFromToken(tokenData);

          userData = {
            id: tokenData.user_id,
            user_id: tokenData.user_id,
            username: tokenData.username,
            email: tokenData.email,
            phone_number: tokenData.phone_number,
            has_access: tokenData.has_access,
            is_client: tokenData.is_client,
            superadmin: tokenData.superadmin,
            is_manager: tokenData.is_manager,

            // watcher flags
            is_project_manager: tokenData.is_project_manager,
            is_project_head: tokenData.is_project_head,
            project_manager_projects: tokenData.project_manager_projects || [],
            project_head_projects: tokenData.project_head_projects || [],

            org: tokenData.org,
            company: tokenData.company,
            entity: tokenData.entity,
            role: tokenData.role,
            roles: mergedRoles,
            accesses: tokenData.accesses || [],
            profile_image: tokenData.profile_image || tokenData.photo || null,
            photo: tokenData.profile_image || tokenData.photo || null,
            signature_url: tokenData.signature_url || null,
            signature_width: tokenData.signature_width ?? null,
            signature_height: tokenData.signature_height ?? null,
          };
        }

        if (!userData && tokenData?.user_id) {
          try {
            const res = await getUserDetailsById(tokenData.user_id);
            userData = res?.data || null;
          } catch {}
        }

        if (userData) {
          if (tokenData) {
            // photo sync
            const fromJWT = tokenData.profile_image || tokenData.photo || null;
            if (fromJWT && !userData.profile_image) userData.profile_image = fromJWT;
            if (fromJWT && !userData.photo) userData.photo = fromJWT;

            if (tokenData.signature_url && !userData.signature_url) {
              userData.signature_url = tokenData.signature_url;
            }
            if (tokenData.signature_width !== undefined && userData.signature_width == null) {
              userData.signature_width = tokenData.signature_width;
            }
            if (tokenData.signature_height !== undefined && userData.signature_height == null) {
              userData.signature_height = tokenData.signature_height;
            }

            // watcher flags sync
            if (tokenData.is_project_manager !== undefined) {
              userData.is_project_manager = tokenData.is_project_manager;
              userData.project_manager_projects = tokenData.project_manager_projects || [];
            }
            if (tokenData.is_project_head !== undefined) {
              userData.is_project_head = tokenData.is_project_head;
              userData.project_head_projects = tokenData.project_head_projects || [];
            }

            const mergedRoles = deriveRolesFromToken(tokenData);
            if (!userData.roles || !userData.roles.length) {
              userData.roles = mergedRoles;
            } else {
              userData.roles = [...new Set([...(userData.roles || []), ...mergedRoles])];
            }

            // ensure accesses present (if token has them)
            if ((!userData.accesses || !userData.accesses.length) && Array.isArray(tokenData.accesses)) {
              userData.accesses = tokenData.accesses;
            }
          }

          // ✅ FORCE initializer default on every login
          forceInitializerAsDefaultOnLogin(userData);

          userData = await cacheAvatarForUser(userData);
          dispatch(setUserData(userData));
          localStorage.setItem("ROLE", getDisplayRole(userData));

          // ✅ Initialize active project ID immediately so dashboards work right after login
          await initializeActiveProject(userData);
        }

        toast.success("Logged in successfully!");
        if (hasSecurityGuardRole(userData || tokenData)) {
          navigate("/guard/onboarding");
        } else {
          navigate("/config");
        }
      } else {
        toast.error("Invalid credentials.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Invalid username or password");
      } else if (error.response?.status === 400) {
        toast.error("Please check your credentials");
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = () => setShowPassword((prev) => !prev);

  return (
    <div
      className="h-screen relative flex items-center justify-center transition-all duration-1000"
      style={{
        backgroundImage: `url(${BG_IMAGES[bgIndex]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "background-image 1s ease-in-out",
      }}
    >
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 md:w-[420px] rounded-2xl p-8 md:p-10 shadow-2xl border border-white/20"
        style={{
          background: "rgba(255,255,255,0.18)",
          boxShadow:
            "0 8px 32px 0 rgba(31, 38, 135, 0.23), 0 1.5px 2.5px 0 rgba(234,104,34,0.04)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-slate-800" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#ea6822] mb-1 tracking-wider">
            KONSTRUCT.WORLD
          </h1>
        </div>

        {page === "login" && (
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <input
                type="text"
                name="username"
                id="username"
                className="w-full px-4 py-3 bg-white/70 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                placeholder="Username"
                onChange={onChange}
                value={formData.username}
                disabled={isLoading}
                required
                style={{
                  backdropFilter: "blur(5px)",
                  WebkitBackdropFilter: "blur(5px)",
                }}
              />
            </div>
            <div className="relative">
              <input
                name="password"
                id="password"
                className="w-full px-4 py-3 bg-white/70 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all pr-12"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                onChange={onChange}
                value={formData.password}
                disabled={isLoading}
                required
                style={{
                  backdropFilter: "blur(5px)",
                  WebkitBackdropFilter: "blur(5px)",
                }}
              />
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Remember Me & Terms */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-black-700">Remember me</span>
              </label>
              <p className="text-xs text-black-600 text-center leading-relaxed">
                By clicking Log in you are accepting our{" "}
                <span className="text-sky-500 hover:text-sky-700 underline cursor-pointer">
                  Privacy Policy
                </span>{" "}
                & agree to the{" "}
                <span className="text-sky-500 hover:text-sky-700 underline cursor-pointer">
                  Terms & Conditions
                </span>
                .
              </p>
            </div>

            <button
              type="submit"
              className={`w-full py-3 bg-amber-500 text-slate-800 rounded-lg font-semibold text-lg transition-all duration-300 ${
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-amber-400 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-800"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "LOGIN"
              )}
            </button>

            <div className="text-center">
              <span className="text-sm text-black-500 hover:text-slate-700 cursor-pointer">
                Forgot Password?
              </span>
            </div>
          </form>
        )}

        {page === "sso" && (
          <div className="space-y-6">
            <div className="text-center text-[#ea6822] mb-6">
              <h2 className="text-xl font-semibold">SSO Login</h2>
              <p className="text-sm text-gray-500 mt-2">
                Single Sign-On authentication
              </p>
            </div>
            <button
              onClick={() => setPage("login")}
              className="w-full py-3 bg-amber-500 text-slate-800 rounded-lg font-semibold text-lg hover:bg-amber-400 transition-all"
            >
              Back to Login
            </button>
          </div>
        )}

        {page === "login" && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setPage("sso")}
              className="text-sm text-black-500 hover:text-[#ea6822] transition-colors"
              disabled={isLoading}
            >
              Login with SSO
            </button>
          </div>
        )}
      </div>

      <ToastContainer position="top-center" />
    </div>
  );
};

export default Login;
