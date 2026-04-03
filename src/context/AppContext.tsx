import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react";

export interface Job {
  _id: string;
  title: string;
  salary: string;
  description: string;
  location: string;
  tags: string[];
  company: string;
  hourlyPay?: string;
  jobType?: string;
  experienceLevel?: string;
  workMode?: string;
  perks?: string;
  requiredSkills?: string;
  companyEmail?: string;
  companyName?: string;
  companyPhone?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
  deleted?: boolean;
}

export interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  jobTitle: string;
  location: string;
  experience: string;
  availability: string;
  resumeUploaded: boolean;
  cnicUploaded: boolean;
  profile_picture?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  cover_letter?: string;
  skills?: string[];
  education?: string;
  linkedin_profile?: string;
  portfolio_url?: string;
  is_verified?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  cnic_image?: File;
  resume_document?: File;
  experience_letter?: File;
}

const REQUIRED_PROFILE_FIELDS: (keyof ProfileData)[] = [
  "fullName", "phone", "location", "jobTitle", "experience", "availability",
];
const REQUIRED_UPLOADS: (keyof ProfileData)[] = ["resumeUploaded", "cnicUploaded"];

export function getProfileCompletion(profile: ProfileData) {
  const totalFields = REQUIRED_PROFILE_FIELDS.length + REQUIRED_UPLOADS.length;
  let filled = 0;
  const missing: string[] = [];

  const labels: { [key: string]: string } = {
    fullName: "Full Name", phone: "Phone Number", location: "City",
    jobTitle: "Job Title / Trade", experience: "Experience",
    availability: "Availability", resumeUploaded: "Resume", cnicUploaded: "CNIC",
  };

  for (const key of REQUIRED_PROFILE_FIELDS) {
    if (typeof profile[key] === "string" && (profile[key] as string).trim()) {
      filled++;
    } else {
      missing.push(labels[key] || key);
    }
  }
  for (const key of REQUIRED_UPLOADS) {
    if (profile[key]) {
      filled++;
    } else {
      missing.push(labels[key] || key);
    }
  }

  const percent = Math.round((filled / totalFields) * 100);
  return { percent, isComplete: percent === 100, missing };
}

interface AppState {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  appliedJobs: string[];
  savedJobs: string[];
  applyToJob: (jobId: string) => void;
  toggleSaveJob: (jobId: string) => void;
  isApplied: (jobId: string) => boolean;
  isSaved: (jobId: string) => boolean;
  applicationStatus: { [key: string]: "pending" | "shortlisted" };
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
  updateProfile: (field: keyof ProfileData, value: string | boolean | string[] | object) => void;
  isProfileComplete: boolean;
  profileCompletion: { percent: number; missing: string[] };
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => void;
  login: (userData: any) => void;
  pendingEmail: string | null;
  setPendingEmail: (email: string) => void;
  verifyEmail: () => void;
  isEmailVerified: boolean;
  token: string | null;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const sampleJobs: Job[] = [
    {
    _id: "1",
    title: "Senior Electrician",
    salary: "$35-45/hr",
    description: "Looking for experienced electrician for commercial projects.",
    location: "Toronto, ON",
    tags: ["Full Time", "Onsite", "Senior Level"],
    company: "Wick Industries",
    hourlyPay: "35",
    jobType: "Full Time",
    experienceLevel: "Senior Level",
    workMode: "Onsite",
    perks: "Health benefits, Tool allowance",
    requiredSkills: "Wiring, Circuit breakers, Panel installation",
    companyEmail: "careers@wickindustries.com",
    companyName: "Wick Industries",
    companyPhone: "+1234567890",
  },
  {
    _id: "2",
    title: "Plumber",
    salary: "$30-40/hr",
    description: "Residential and commercial plumbing work.",
    location: "Mississauga, ON",
    tags: ["Full Time", "Onsite", "Mid Level"],
    company: "Plumbing Pros",
    hourlyPay: "30",
    jobType: "Full Time",
    experienceLevel: "Mid Level",
    workMode: "Onsite",
    perks: "Company vehicle, Tools provided",
    requiredSkills: "Pipe fitting, Drain cleaning, Fixture installation",
    companyEmail: "jobs@plumbingpros.com",
    companyName: "Plumbing Pros",
    companyPhone: "+1987654321",
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<{ [key: string]: "pending" | "shortlisted" }>({
    "1": "pending", "2": "shortlisted", "3": "pending",
  });
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "", email: "", phone: "", password: "",
    jobTitle: "", location: "", experience: "", availability: "",
    resumeUploaded: false, cnicUploaded: false,
    profile_picture: undefined,
    address: undefined,
    cover_letter: undefined,
    skills: undefined,
    education: undefined,
    linkedin_profile: undefined,
    portfolio_url: undefined,
    is_verified: undefined,
    active: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    cnic_image: undefined,
    resume_document: undefined,
    experience_letter: undefined,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEmail, setPendingEmailState] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Restore login state from localStorage on app load
  useEffect(() => {
    console.log("AppContext: Checking localStorage for saved token...");
    const savedToken = localStorage.getItem('authToken');
    const savedUserData = localStorage.getItem('userData');
    
    console.log("AppContext: savedToken from localStorage:", savedToken);
    console.log("AppContext: savedUserData from localStorage:", savedUserData);
    
    if (savedToken) {
      console.log("AppContext: Found saved token, restoring login state...");
      setToken(savedToken);
      setIsLoggedIn(true);
      
      // Restore user profile from localStorage if available
      if (savedUserData) {
        try {
          const userData = JSON.parse(savedUserData);
          console.log("AppContext: Restoring user data:", userData);
          setProfile({
            fullName: userData.name || userData.fullName || "",
            email: userData.email || "",
            phone: userData.phone_no || userData.phone || "",
            password: "",
            jobTitle: userData.job_title || userData.jobTitle || "",
            location: userData.address?.city || userData.location || "",
            experience: userData.experience || "",
            availability: userData.availability || "",
            resumeUploaded: Boolean(userData.resume_document || userData.resumeUploaded),
            cnicUploaded: Boolean(userData.cnic_image || userData.cnicUploaded),
            profile_picture: userData.profile_picture,
            address: userData.address,
            cover_letter: userData.cover_letter,
            skills: userData.skills,
            education: userData.education,
            linkedin_profile: userData.linkedin_profile,
            portfolio_url: userData.portfolio_url,
            is_verified: userData.is_verified,
            active: userData.active,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
          });
        } catch (e) {
          console.error("Failed to parse saved user data:", e);
        }
      }
    } else {
      console.log("AppContext: No saved token found in localStorage");
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setIsEmailVerified(false);
    setPendingEmailState(null);
    setToken(null);
    setProfile({
      fullName: "", email: "", phone: "", password: "",
      jobTitle: "", location: "", experience: "", availability: "",
      resumeUploaded: false, cnicUploaded: false,
      profile_picture: undefined,
      address: undefined,
      cover_letter: undefined,
      skills: undefined,
      education: undefined,
      linkedin_profile: undefined,
      portfolio_url: undefined,
      is_verified: undefined,
      active: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      cnic_image: undefined,
      resume_document: undefined,
      experience_letter: undefined,
    });
    setAppliedJobs([]);
    setSavedJobs([]);
  }, []);

  const login = useCallback((userData: any) => {
    console.log("AppContext: login called with userData:", userData);
    console.log("AppContext: Saving token to localStorage:", userData.token);
    localStorage.setItem('authToken', userData.token);
    setToken(userData.token);
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userProfile', JSON.stringify({
      fullName: userData.name,
      email: userData.email,
      phone: userData.phone_no || "",
      password: "",
      jobTitle: userData.job_title || "",
      location: userData.address?.city || "",
      experience: userData.experience || "",
      availability: userData.availability || "",
      resumeUploaded: Boolean(userData.resume_document),
      cnicUploaded: Boolean(userData.cnic_image),
      profile_picture: userData.profile_picture,
      address: userData.address,
      cover_letter: userData.cover_letter,
      skills: userData.skills,
      education: userData.education,
      linkedin_profile: userData.linkedin_profile,
      portfolio_url: userData.portfolio_url,
      is_verified: userData.is_verified,
      active: userData.active,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    }));
    setProfile({
      fullName: userData.name,
      email: userData.email,
      phone: userData.phone_no || "",
      password: "",
      jobTitle: userData.job_title || "",
      location: userData.address?.city || "",
      experience: userData.experience || "",
      availability: userData.availability || "",
      resumeUploaded: Boolean(userData.resume_document),
      cnicUploaded: Boolean(userData.cnic_image),
      profile_picture: userData.profile_picture,
      address: userData.address,
      cover_letter: userData.cover_letter,
      skills: userData.skills,
      education: userData.education,
      linkedin_profile: userData.linkedin_profile,
      portfolio_url: userData.portfolio_url,
      is_verified: userData.is_verified,
      active: userData.active,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
    setIsLoggedIn(true);
    setIsEmailVerified(userData.is_verified);
  }, []);

  const setPendingEmail = useCallback((email: string) => {
    setPendingEmailState(email);
  }, []);

  const verifyEmail = useCallback(() => {
    setIsEmailVerified(true);
    setIsLoggedIn(true);
    setPendingEmailState(null);
  }, []);

  const applyToJob = useCallback((jobId: string) => {
    setAppliedJobs((prev) => prev.includes(jobId) ? prev : [...prev, jobId]);
  }, []);

  const toggleSaveJob = useCallback((jobId: string) => {
    setSavedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  }, []);

  const isApplied = useCallback((jobId: string) => appliedJobs.includes(jobId), [appliedJobs]);
  const isSaved = useCallback((jobId: string) => savedJobs.includes(jobId), [savedJobs]);

  const updateProfile = useCallback((field: keyof ProfileData, value: string | boolean | string[] | object) => {
    setProfile((p) => ({ ...p, [field]: value }));
  }, []);

  const { percent, isComplete, missing } = useMemo(() => getProfileCompletion(profile), [profile]);

  return (
    <AppContext.Provider value={{
      jobs, setJobs,
      appliedJobs, savedJobs, applyToJob, toggleSaveJob, isApplied, isSaved, applicationStatus,
      profile, setProfile, updateProfile, isProfileComplete: isComplete,
      profileCompletion: { percent, missing },
      isLoggedIn, isLoading, logout, login,
      pendingEmail, setPendingEmail, verifyEmail, isEmailVerified,
      token,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
