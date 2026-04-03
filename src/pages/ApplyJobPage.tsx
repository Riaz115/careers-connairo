// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Upload, ArrowLeft } from "lucide-react";
// import DashboardLayout from "@/components/DashboardLayout";
// import { sampleJobs, useApp } from "@/context/AppContext";
// import { applyToPublicJob } from "@/lib/careerApi";
// import { toast } from "sonner";

// const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"];
// const experienceOptions = ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"];
// const availabilityOptions = [
//   "Immediately available",
//   "Available within 1 week",
//   "Available within 2 weeks",
//   "Available within 1 month",
//   "Available after current project",
//   "Available part-time",
//   "Not available"
// ];

// const defaultSkillsOptions = ["React", "TypeScript", "Node.js", "Python", "UI/UX", "Data Analysis", "Project Management", "Marketing"];

// export default function ApplyJobPage() {
//   const { jobId } = useParams();
//   const navigate = useNavigate();
//   const { applyToJob, jobs, token } = useApp();
//   const effectiveJobs = jobs.length > 0 ? jobs : sampleJobs;
//   const job = jobId ? effectiveJobs.find((j) => j._id === jobId) : undefined;
//   const jobTitles = [...new Set(effectiveJobs.map((j) => j.title))];
//   const initialWorkType =
//     job?.tags.find((t) => t === "Remote" || t === "Onsite" || t === "Hybrid") ??
//     (job?.tags.find((t) => typeof t === "string" && t.toLowerCase() === "remote") ? "Remote" : undefined) ??
//     (job?.tags.find((t) => typeof t === "string" && t.toLowerCase() === "onsite") ? "Onsite" : undefined) ??
//     (job?.tags.find((t) => typeof t === "string" && t.toLowerCase() === "hybrid") ? "Hybrid" : undefined) ??
//     "Remote";

//   // Get skills options from job's required skills or use default
//   const skillsOptions = job?.requiredSkills 
//     ? job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
//     : defaultSkillsOptions;

//   const [form, setForm] = useState({
//     fullName: "", phone: "", email: "", city: "", jobTitle: job?.title || "",
//     skills: [] as string[], experience: "", availability: "", expectedRate: "",
//     workType: initialWorkType, ownTools: false, multipleCities: false, description: "",
//   });
//   const [resumeFile, setResumeFile] = useState<File | null>(null);
//   const [submitted, setSubmitted] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     // If user navigated to a new jobId and jobTitle is blank/invalid, keep the form consistent.
//     if (!job) return;
//     setForm((p) => {
//       const isValid = jobTitles.includes(p.jobTitle);
//       const next: typeof p = { ...p };
//       if (!p.jobTitle || !isValid) next.jobTitle = job.title;
//       if (!["Remote", "Onsite", "Hybrid"].includes(p.workType)) next.workType = initialWorkType;
//       return next;
//     });
//   }, [job?._id, jobTitles.join("|"), initialWorkType]);

//   type ApplyJobField = keyof typeof form;
//   const update = (field: ApplyJobField, value: string | boolean | string[]) => setForm((p) => ({ ...p, [field]: value }));

//   const validateFile = (file: File) => {
//     const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/rtf"];
//     const maxSizeBytes = 5 * 1024 * 1024; // 5MB
//     if (!validTypes.includes(file.type)) {
//       return "Only PDF/DOC/DOCX/TXT/RTF files are accepted";
//     }
//     if (file.size > maxSizeBytes) {
//       return "File size must be 5MB or less";
//     }
//     return "";
//   };

//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const validate = () => {
//     const errs: Record<string, string> = {};
//     if (!form.fullName.trim()) errs.fullName = "Full name is required";
//     if (!form.phone.trim()) errs.phone = "Phone number is required";
//     if (!form.email.trim()) errs.email = "Email is required";
//     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
//     if (!form.city) errs.city = "City is required";
//     if (!form.jobTitle) errs.jobTitle = "Job title is required";
//     if (!form.experience) errs.experience = "Experience is required";
//     if (!form.availability) errs.availability = "Availability is required";
//     if (!resumeFile) errs.resumeFile = "Resume / CV is required (PDF, DOC, DOCX, TXT, RTF)";
//     return errs;
//   };

//   const handleResume = (file?: File | null) => {
//     if (!file) {
//       setResumeFile(null);
//       setErrors((prev) => ({ ...prev, resumeFile: "" }));
//       return;
//     }
//     const err = validateFile(file);
//     if (err) {
//       setResumeFile(null);
//       setErrors((prev) => ({ ...prev, resumeFile: err }));
//     } else {
//       setResumeFile(file);
//       setErrors((prev) => ({ ...prev, resumeFile: "" }));
//     }
//   };

//   const fileToBase64 = (file: File): Promise<string> =>
//     new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => {
//         if (typeof reader.result === "string") {
//           resolve(reader.result.split(",")[1] || "");
//         } else {
//           reject(new Error("Failed to read file"));
//         }
//       };
//       reader.onerror = () => reject(new Error("Failed to read file"));
//       reader.readAsDataURL(file);
//     });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const errs = validate();
//     setErrors(errs);
//     if (Object.keys(errs).length > 0) return;
//     if (!jobId) return;

//     const resumeBase64 = resumeFile ? await fileToBase64(resumeFile) : undefined;
//     setIsSubmitting(true);
//     applyToPublicJob({
//       jobId,
//       fullName: form.fullName,
//       phone: form.phone,
//       email: form.email,
//       city: form.city,
//       jobTitle: form.jobTitle,
//       skills: form.skills,
//       experience: form.experience,
//       availability: form.availability,
//       expectedRate: form.expectedRate,
//       workType: form.workType,
//       ownTools: form.ownTools,
//       multipleCities: form.multipleCities,
//       description: form.description,
//       resumeFileName: resumeFile?.name,
//       resumeMimeType: resumeFile?.type,
//       resumeBase64: resumeBase64,
//       token: token || undefined,
//     })
//       .then(() => {
//         applyToJob(jobId);
//         setSubmitted(true);
//         setTimeout(() => navigate("/applied"), 1500);
//       })
//       .catch((err) => {
//         toast.error(err instanceof Error ? err.message : "Failed to apply");
//       })
//       .finally(() => setIsSubmitting(false));
//   };

//   if (submitted) {
//     return (
//       <DashboardLayout>
//         <div className="max-w-lg mx-auto text-center py-20 animate-scale-in">
//           <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
//             <span className="text-2xl">✓</span>
//           </div>
//           <h2 className="text-xl font-semibold text-foreground mb-2">Application Submitted!</h2>
//           <p className="text-muted-foreground text-sm">Redirecting to your applied jobs...</p>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout>
//       <div className="max-w-2xl mx-auto">
//         <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 settle-transition">
//           <ArrowLeft className="w-4 h-4" /> Back
//         </button>

//         <div className="bg-card rounded-lg p-6 lg:p-8 card-shadow">
//           <h1 className="text-xl font-semibold text-foreground mb-1">Apply for a Job</h1>
//           {job && (
//             <div className="mb-6">
//               <div className="flex items-center gap-2 mb-2">
//                 <p className="text-sm text-muted-foreground">{job.title} — {job.location}</p>
//                 {/* {jobId && (
//                   <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full font-mono">
//                     ID: {jobId}
//                   </span>
//                 )} */}
//               </div>
//               <div className="flex flex-wrap gap-2 mb-3">
//                 {job.jobType && (
//                   <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
//                     {job.jobType}
//                   </span>
//                 )}
//                 {job.experienceLevel && (
//                   <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full">
//                     {job.experienceLevel}
//                   </span>
//                 )}
//                 {job.tags && job.tags
//                   .filter((tag) => ["Remote", "Onsite", "Hybrid"].includes(tag))
//                   .map((tag, index) => (
//                     <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
//                       {tag}
//                     </span>
//                   ))}
//               </div>
//               {job.requiredSkills && (
//                 <div className="mt-3">
//                   <p className="text-xs font-medium text-foreground mb-1">Required Skills:</p>
//                   <p className="text-xs text-muted-foreground">{job.requiredSkills}</p>
//                 </div>
//               )}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-5">
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <Field label="Full Name" required error={errors.fullName}>
//                 <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="form-input" placeholder="John Doe" />
//               </Field>
//               <Field label="Phone (WhatsApp)" required error={errors.phone}>
//                 <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="form-input" placeholder="+92 300 1234567" />
//               </Field>
//               <Field label="Email" required error={errors.email}>
//                 <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="form-input" placeholder="john@example.com" />
//               </Field>
//               <Field label="Address" required error={errors.city}>
//                 <select value={form.city} onChange={(e) => update("city", e.target.value)} className="form-input">
//                   <option value="">Select city</option>
//                   {cities.map((c) => <option key={c}>{c}</option>)}
//                 </select>
//               </Field>
//               {/* <Field label="Job Title" required error={errors.jobTitle}>
//                 <select value={form.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} className="form-input">
//                   <option value="">Select title</option>
//                   {jobTitles.map((t) => <option key={t}>{t}</option>)}
//                 </select>
//               </Field> */}
//               <Field label="Experience (Year)" required error={errors.experience}>
//                 <select value={form.experience} onChange={(e) => update("experience", e.target.value)} className="form-input">
//                   <option value="">Select</option>
//                   {experienceOptions.map((e) => <option key={e}>{e}</option>)}
//                 </select>
//               </Field>
//               <Field label="Availability" required error={errors.availability}>
//                 <select value={form.availability} onChange={(e) => update("availability", e.target.value)} className="form-input">
//                   <option value="">Select</option>
//                   {availabilityOptions.map((a) => <option key={a}>{a}</option>)}
//                 </select>
//               </Field>
//               <Field label="Expected Rate (per day)">
//                 <input value={form.expectedRate} onChange={(e) => update("expectedRate", e.target.value)} className="form-input" placeholder="$50" />
//               </Field>
//             </div>

//             {/* <Field label="Secondary Skills">
//               <div className="flex flex-wrap gap-2">
//                 {skillsOptions.map((s) => (
//                   <button key={s} type="button"
//                     onClick={() => update("skills", form.skills.includes(s) ? form.skills.filter((x) => x !== s) : [...form.skills, s])}
//                     className={`px-3 py-1.5 rounded-md text-xs font-medium settle-transition ${
//                       form.skills.includes(s) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
//                     }`}
//                   >
//                     {s}
//                   </button>
//                 ))}
//               </div>
//             </Field> */}

//             <Field label="Work Type">
//               <div className="flex gap-3">
//                 {["Remote", "Hybrid", "Onsite"].map((t) => (
//                   <button key={t} type="button"
//                     onClick={() => update("workType", t)}
//                     className={`px-4 py-2 rounded-lg text-sm font-medium settle-transition ${
//                       form.workType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
//                     }`}
//                   >
//                     {t}
//                   </button>
//                 ))}
//               </div>
//             </Field>

//             <div className="flex flex-col sm:flex-row gap-4">
//               <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
//                 <input type="checkbox" checked={form.ownTools} onChange={(e) => update("ownTools", e.target.checked)} className="rounded border-border text-primary" />
//                 Can bring own tools
//               </label>
//               <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
//                 <input type="checkbox" checked={form.multipleCities} onChange={(e) => update("multipleCities", e.target.checked)} className="rounded border-border text-primary" />
//                 Can work in multiple cities
//               </label>
//             </div>

//             <Field label="Upload Resume" required error={errors.resumeFile}>
//               <input
//                 type="file"
//                 accept=".pdf,.doc,.docx,.txt,.rtf"
//                 onChange={(e) => {
//                   const file = e.target.files?.[0] ?? null;
//                   handleResume(file);
//                 }}
//                 className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground"
//               />
//               <p className="text-xs text-muted-foreground mt-1">Supported: PDF, DOC, DOCX, TXT, RTF. Max 5MB.</p>
//               {resumeFile && (
//                 <p className="text-sm text-foreground mt-2">Selected file: <strong>{resumeFile.name}</strong> ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)</p>
//               )}
//             </Field>

//             {/* <Field label="About Me">
//               <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="form-input min-h-[100px] resize-none" placeholder="Tell us about yourself..." />
//             </Field> */}

//             <button type="submit" className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover settle-transition">
//               {isSubmitting ? "Submitting..." : "Submit Application"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }

// function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-foreground mb-1.5">
//         {label} {required && <span className="text-destructive">*</span>}
//       </label>
//       {children}
//       {error && <p className="text-xs text-destructive mt-1">{error}</p>}
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, ArrowLeft, Loader2, FileText, X, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { sampleJobs, useApp } from "@/context/AppContext";
import { applyToPublicJob, getApplicantProfile } from "@/lib/careerApi";
import { toast } from "sonner";

const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"];
const experienceOptions = ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"];
const availabilityOptions = [
  "Immediately available",
  "Available within 1 week",
  "Available within 2 weeks",
  "Available within 1 month",
  "Available after current project",
  "Available part-time",
  "Not available"
];

const defaultSkillsOptions = ["React", "TypeScript", "Node.js", "Python", "UI/UX", "Data Analysis", "Project Management", "Marketing"];

// ✅ Profile Data Interface
interface ProfileData {
  name: string;
  email: string;
  phone_no: string;
  job_title: string;
  experience: string;
  availability: string;
  resume_document?: string;
  address?: {
    location?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    latLong?: string;
  };
}

export default function ApplyJobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { applyToJob, jobs, token } = useApp();
  const effectiveJobs = jobs.length > 0 ? jobs : sampleJobs;
  const job = jobId ? effectiveJobs.find((j) => j._id === jobId) : undefined;
  
  // ✅ Profile loading state
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  const jobTitles = [...new Set(effectiveJobs.map((j) => j.title))];
  const initialWorkType =
    job?.tags?.find((t) => t === "Remote" || t === "Onsite" || t === "Hybrid") ??
    (job?.tags?.find((t) => typeof t === "string" && t.toLowerCase() === "remote") ? "Remote" : undefined) ??
    (job?.tags?.find((t) => typeof t === "string" && t.toLowerCase() === "onsite") ? "Onsite" : undefined) ??
    (job?.tags?.find((t) => typeof t === "string" && t.toLowerCase() === "hybrid") ? "Hybrid" : undefined) ??
    "Remote";

  const skillsOptions = job?.requiredSkills 
    ? job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
    : defaultSkillsOptions;

  // ✅ Form state - initially empty, will be filled from profile
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", city: "", jobTitle: job?.title || "",
    skills: [] as string[], experience: "", availability: "", expectedRate: "",
    workType: initialWorkType, ownTools: false, multipleCities: false, description: "",
  });
  
  // ✅ Resume file state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Fetch user profile on page load
  useEffect(() => {
    if (!token) {
      setProfileLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await getApplicantProfile(token);
        if (response.status === 200 && response.data) {
          const data = response.data;
          setProfileData({
            name: data.name || "",
            email: data.email || "",
            phone_no: data.phone_no || "",
            job_title: data.job_title || "",
            experience: data.experience || "",
            availability: data.availability || "",
            resume_document: data.resume_document,
            address: data.address,
          });
          
          // ✅ Auto-fill form with profile data
          setForm(prev => ({
            ...prev,
            fullName: data.name || "",
            phone: data.phone_no || "",
            email: data.email || "",
            city: data.address?.city || "",
            jobTitle: job?.title || data.job_title || "",
            experience: data.experience || "",
            availability: data.availability || "",
          }));
          
          // ✅ Set existing resume URL
          if (data.resume_document) {
            setExistingResumeUrl(data.resume_document);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [token, job?.title]);

  useEffect(() => {
    if (!job) return;
    setForm((p) => {
      const isValid = jobTitles.includes(p.jobTitle);
      const next: typeof p = { ...p };
      if (!p.jobTitle || !isValid) next.jobTitle = job.title;
      if (!["Remote", "Onsite", "Hybrid"].includes(p.workType)) next.workType = initialWorkType;
      return next;
    });
  }, [job?._id, jobTitles.join("|"), initialWorkType]);

  type ApplyJobField = keyof typeof form;
  const update = (field: ApplyJobField, value: string | boolean | string[]) => setForm((p) => ({ ...p, [field]: value }));

  const validateFile = (file: File) => {
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/rtf"];
    const maxSizeBytes = 5 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      return "Only PDF/DOC/DOCX/TXT/RTF files are accepted";
    }
    if (file.size > maxSizeBytes) {
      return "File size must be 5MB or less";
    }
    return "";
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.city) errs.city = "City is required";
    if (!form.jobTitle) errs.jobTitle = "Job title is required";
    if (!form.experience) errs.experience = "Experience is required";
    if (!form.availability) errs.availability = "Availability is required";
    if (!resumeFile && !existingResumeUrl) errs.resumeFile = "Resume / CV is required (PDF, DOC, DOCX, TXT, RTF)";
    return errs;
  };

  const handleResume = (file?: File | null) => {
    if (!file) {
      setResumeFile(null);
      setErrors((prev) => ({ ...prev, resumeFile: "" }));
      return;
    }
    const err = validateFile(file);
    if (err) {
      setResumeFile(null);
      setErrors((prev) => ({ ...prev, resumeFile: err }));
    } else {
      setResumeFile(file);
      setExistingResumeUrl(null);
      setErrors((prev) => ({ ...prev, resumeFile: "" }));
    }
  };

  const removeExistingResume = () => {
    setExistingResumeUrl(null);
    setResumeFile(null);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result.split(",")[1] || "");
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!jobId) return;

    let resumeBase64: string | undefined = undefined;
    if (resumeFile) {
      resumeBase64 = await fileToBase64(resumeFile);
    }

    setIsSubmitting(true);
    applyToPublicJob({
      jobId,
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      city: form.city,
      jobTitle: form.jobTitle,
      skills: form.skills,
      experience: form.experience,
      availability: form.availability,
      expectedRate: form.expectedRate,
      workType: form.workType,
      ownTools: form.ownTools,
      multipleCities: form.multipleCities,
      description: form.description,
      resumeFileName: resumeFile?.name,
      resumeMimeType: resumeFile?.type,
      resumeBase64: resumeBase64,
      token: token || undefined,
    })
      .then(() => {
        applyToJob(jobId);
        setSubmitted(true);
        setTimeout(() => navigate("/applied"), 1500);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to apply");
      })
      .finally(() => setIsSubmitting(false));
  };

  // ✅ Loading state
  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-20 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground text-sm">Redirecting to your applied jobs...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 settle-transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-card rounded-lg p-6 lg:p-8 card-shadow">
          <h1 className="text-xl font-semibold text-foreground mb-1">Apply for a Job</h1>
          {job && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-muted-foreground">{job.title} — {job.location}</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {job.jobType && (
                  <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                    {job.jobType}
                  </span>
                )}
                {job.experienceLevel && (
                  <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full">
                    {job.experienceLevel}
                  </span>
                )}
                {job.tags && job.tags
                  .filter((tag) => ["Remote", "Onsite", "Hybrid"].includes(tag))
                  .map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
              </div>
              {job.requiredSkills && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-foreground mb-1">Required Skills:</p>
                  <p className="text-xs text-muted-foreground">{job.requiredSkills}</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={errors.fullName}>
                <input 
                  value={form.fullName} 
                  onChange={(e) => update("fullName", e.target.value)} 
                  className="form-input w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="John Doe" 
                />
              </Field>
              
              <Field label="Phone (WhatsApp)" required error={errors.phone}>
                <input 
                  value={form.phone} 
                  onChange={(e) => update("phone", e.target.value)} 
                  className="form-input w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="+92 300 1234567" 
                />
              </Field>
              
              <Field label="Email" required error={errors.email}>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => update("email", e.target.value)} 
                  className="form-input w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="john@example.com" 
                />
              </Field>
              
              {/* ✅ Address Field - Disabled Input showing address.location */}
              <Field label="Address" required error={errors.city}>
                <input 
                  type="text"
                  value={profileData?.address?.location || form.city || ""}
                  disabled
                  className="form-input w-full px-3 py-2 rounded-lg border border-border bg-gray-100 text-gray-500 cursor-not-allowed"
                  style={{ cursor: "not-allowed" }}
                  placeholder="Your address from profile"
                />
                {/* <p className="text-xs text-muted-foreground mt-1">
                  Address is taken from your profile
                </p> */}
              </Field>
              
              <Field label="Experience (Year)" required error={errors.experience}>
                <select 
                  value={form.experience} 
                  onChange={(e) => update("experience", e.target.value)} 
                  className="form-input w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select</option>
                  {experienceOptions.map((e) => <option key={e}>{e}</option>)}
                </select>
              </Field>
              
              <Field label="Availability" required error={errors.availability}>
                <select 
                  value={form.availability} 
                  onChange={(e) => update("availability", e.target.value)} 
                  className="form-input w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select</option>
                  {availabilityOptions.map((a) => <option key={a}>{a}</option>)}
                </select>
              </Field>
              
              <Field label="Expected Rate (per day)">
                <input 
                  value={form.expectedRate} 
                  onChange={(e) => update("expectedRate", e.target.value)} 
                  className="form-input w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="$50" 
                />
              </Field>
            </div>

            {/* Work Type */}
            <Field label="Work Type">
              <div className="flex gap-3">
                {["Remote", "Hybrid", "Onsite"].map((t) => (
                  <button key={t} type="button"
                    onClick={() => update("workType", t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium settle-transition ${
                      form.workType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.ownTools} onChange={(e) => update("ownTools", e.target.checked)} className="rounded border-border text-primary" />
                Can bring own tools
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.multipleCities} onChange={(e) => update("multipleCities", e.target.checked)} className="rounded border-border text-primary" />
                Can work in multiple cities
              </label>
            </div>

            {/* ✅ Resume Upload Field - Beautiful Design */}
            <Field label="Upload Resume" required error={errors.resumeFile}>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                {existingResumeUrl ? (
                  <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Current Resume</p>
                        <a 
                          href={existingResumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View uploaded resume
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeExistingResume}
                      className="p-1 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : resumeFile ? (
                  <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{resumeFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResume(null)}
                      className="p-1 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag & drop or click to upload
                    </p>
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        handleResume(file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Supported: PDF, DOC, DOCX, TXT, RTF. Max 5MB.
              </p>
            </Field>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover settle-transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}