import { BACKEND_URL } from "@/lib/env";
import type { Job } from "@/context/AppContext";

export type PublicJobsResponse = {
  jobs: Job[];
  page: number;
  perPage: number;
  totalJobs: number;
  totalPages: number;
};

function toInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return undefined;
}

function normalizeJob(raw: unknown): Job | null {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? row._id ?? row.jobId ?? "");
  const title = String(row.title ?? row.name ?? "");
  if (!id || !title) return null;

  const salary = (() => {
    const direct = row.salary ?? row.pay ?? row.compensation;
    if (direct != null && String(direct).trim() !== "") return String(direct);
    const hourly = row.hourlyPay ?? row.hourly_pay;
    if (hourly == null) return "";
    const hp = String(hourly).trim();
    if (!hp) return "";
    if (/[\\$£€]/.test(hp)) return hp;
    return `$${hp}/hr`;
  })();
  const description = String(row.description ?? row.summary ?? "");
  const location = String(row.location ?? row.city ?? row.address ?? "Remote");
  const company = String(row.company ?? row.companyName ?? row.employer ?? row.company_name ?? "Company");

  const tagsRaw = row.tags ?? row.tag ?? row.type;
  const tags = (() => {
    if (Array.isArray(tagsRaw)) return tagsRaw.map((t) => String(t)).filter(Boolean);
    if (typeof tagsRaw === "string") {
      // Sometimes backend returns a comma-separated tag string.
      return tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // Your backend uses separate fields (workMode/jobType/experienceLevel), so convert them to tags.
    const out: string[] = [];
    if (row.workMode) out.push(String(row.workMode));
    if (row.jobType) out.push(String(row.jobType));
    if (row.experienceLevel) out.push(String(row.experienceLevel));
    return out.filter(Boolean);
  })();

  return {
   _id: id, 
    title,
    salary: String(salary),
    description,
    location,
    tags,
    company,
    hourlyPay: row.hourlyPay ? String(row.hourlyPay) : undefined,
    jobType: row.jobType ? String(row.jobType) : undefined,
    experienceLevel: row.experienceLevel ? String(row.experienceLevel) : undefined,
    workMode: row.workMode ? String(row.workMode) : undefined,
    perks: row.perks ? String(row.perks) : undefined,
    requiredSkills: row.requiredSkills ? String(row.requiredSkills) : undefined,
    companyEmail: row.companyEmail ? String(row.companyEmail) : undefined,
    companyName: row.companyName ? String(row.companyName) : company,
    companyPhone: row.companyPhone ? String(row.companyPhone) : undefined,
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    active: row.active == null ? undefined : Boolean(row.active),
    deleted: row.deleted == null ? undefined : Boolean(row.deleted),
  };
}

export async function fetchPublicJobs(args: {
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
}): Promise<PublicJobsResponse> {
  const page = Math.max(1, args.page ?? 1);
  const perPage = Math.max(1, args.perPage ?? 50);

  const url = new URL(`${BACKEND_URL}/career/public/jobs`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("perPage", String(perPage));

  const res = await fetch(url.toString(), { method: "GET", signal: args.signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to load jobs (${res.status}) ${text}`.trim());
  }

  const json = await res.json() as unknown;

  // Your backend returns: { status, message, data: { jobs, page, perPage, totalJobs, totalPages } }
  // But some implementations might return { jobs, page, perPage... } directly.
  const jsonObj = json as Record<string, unknown>;
  const payload = (jsonObj.data as Record<string, unknown> | undefined) ?? jsonObj;

  const jobs = Array.isArray(payload.jobs) ? (payload.jobs as unknown[]).map(normalizeJob).filter(Boolean) : [];
  const respPage = toInt(payload.page) ?? page;
  const respPerPage = toInt(payload.perPage) ?? perPage;
  const totalJobs = toInt(payload.totalJobs) ?? jobs.length;
  const totalPages = toInt(payload.totalPages) ?? Math.max(1, Math.ceil(totalJobs / respPerPage));

  return {
    jobs,
    page: Math.max(1, respPage),
    perPage: Math.max(1, respPerPage),
    totalJobs: Math.max(0, totalJobs),
    totalPages: Math.max(1, totalPages),
  };
}

export type ApplyJobRequest = {
  jobId: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  jobTitle: string;
  skills: string[];
  experience: string;
  availability: string;
  expectedRate: string;
  workType: string;
  ownTools: boolean;
  multipleCities: boolean;
  description: string;
  resumeFileName?: string;
  resumeMimeType?: string;
  resumeBase64?: string;
  token?: string;
};

export async function applyToPublicJob(args: ApplyJobRequest & { signal?: AbortSignal }): Promise<unknown> {
  const url = new URL(`${BACKEND_URL}/career/public/jobs/apply/${encodeURIComponent(args.jobId)}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add token to Authorization header if provided
  if (args.token) {
    headers["Authorization"] = `Bearer ${args.token}`;
  }

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      fullName: args.fullName,
      phone: args.phone,
      email: args.email,
      city: args.city,
      jobTitle: args.jobTitle,
      skills: args.skills,
      experience: args.experience,
      availability: args.availability,
      expectedRate: args.expectedRate,
      workType: args.workType,
      ownTools: args.ownTools,
      multipleCities: args.multipleCities,
      description: args.description,
      resumeFileName: args.resumeFileName,
      resumeMimeType: args.resumeMimeType,
      resumeBase64: args.resumeBase64,
    }),
    signal: args.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to apply (${res.status}) ${text}`.trim());
  }

  return res.json().catch(() => ({}));
}

// Applicant Module API
const APPLICANT_BASE_URL = `${BACKEND_URL}/applicant`;

export type SignupRequest = {
  name: string;
  email: string;
  phone_no: string;
  password: string;
  profile_picture?: File;
};

export type SignupResponse = {
  status: number;
  message: string;
  data: {
    applicant_id: string;
    email: string;
    name: string;
  };
};

export async function signupApplicant(body: SignupRequest): Promise<SignupResponse> {
  const form = new FormData();
  form.append("name", body.name);
  form.append("email", body.email);
  form.append("phone_no", body.phone_no);
  form.append("password", body.password);
  if (body.profile_picture) form.append("profile_picture", body.profile_picture);

  const res = await fetch(`${APPLICANT_BASE_URL}/signup`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: "Signup failed" }))) as { message?: string };
    throw new Error(err?.message || `Signup failed (${res.status})`);
  }

  return res.json();
}

export type VerifyEmailRequest = {
  email: string;
  otp: string;
};

export type VerifyEmailResponse = {
  status: number;
  message: string;
  data: {
    applicant_id: string;
    email: string;
    name: string;
    is_verified: boolean;
    active: boolean;
  };
};

export async function verifyEmailApplicant(body: VerifyEmailRequest): Promise<VerifyEmailResponse> {
  const res = await fetch(`${APPLICANT_BASE_URL}/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: "Verification failed" }))) as { message?: string };
    throw new Error(err?.message || `Verification failed (${res.status})`);
  }

  return res.json();
}

export type ResendOtpRequest = {
  email: string;
};

export type ResendOtpResponse = {
  status: number;
  message: string;
};

export async function resendOtpApplicant(body: ResendOtpRequest): Promise<ResendOtpResponse> {
  const res = await fetch(`${APPLICANT_BASE_URL}/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: "Resend OTP failed" }))) as { message?: string };
    throw new Error(err?.message || `Resend OTP failed (${res.status})`);
  }

  return res.json();
}

export type LoginRequest = {
  email: string;
  password: string;
  device_token?: string;
  device_type?: string;
};

export type LoginResponse = {
  status: number;
  message: string;
  data: {
    token: string;
    expirationTime: string;
    applicant_id: string;
    name: string;
    email: string;
    profile_picture?: string;
    is_verified: boolean;
    active: boolean;
  };
};

export async function loginApplicant(body: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${APPLICANT_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: "Login failed" }))) as { message?: string };
    throw new Error(err?.message || `Login failed (${res.status})`);
  }

  return res.json();
}

export type ProfileResponse = {
  status: number;
  message: string;
  data: {
    _id: string;
    name: string;
    email: string;
    phone_no: string;
    profile_picture?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
    experience?: string;
    job_title?: string;
    availability?: string;
    cnic_image?: string;
    resume_document?: string;
    cover_letter?: string;
    skills?: string[];
    education?: string;
    linkedin_profile?: string;
    portfolio_url?: string;
    is_verified: boolean;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
};

export async function getApplicantProfile(token: string): Promise<ProfileResponse> {
  const res = await fetch(`${APPLICANT_BASE_URL}/profile`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: "Get profile failed" }))) as { message?: string };
    throw new Error(err?.message || `Get profile failed (${res.status})`);
  }

  return res.json();
}

export type UpdateProfileRequest = {
  name?: string;
  phone_no?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  experience?: string;
  job_title?: string;
  availability?: string;
  cover_letter?: string;
  skills?: string;
  education?: string;
  linkedin_profile?: string;
  portfolio_url?: string;
  profile_picture?: File;
  cnic_image?: File;
  resume_document?: File;
  experience_letter?: File;
};

// export async function updateApplicantProfile(token: string, body: UpdateProfileRequest): Promise<ProfileResponse> {
//   const form = new FormData();
//   if (body.name) form.append("name", body.name);
//   if (body.phone_no) form.append("phone_no", body.phone_no);
//   if (body.experience) form.append("experience", body.experience);
//   if (body.job_title) form.append("job_title", body.job_title);
//   if (body.availability) form.append("availability", body.availability);
//   if (body.cover_letter) form.append("cover_letter", body.cover_letter);
//   if (body.skills) form.append("skills", body.skills);
//   if (body.education) form.append("education", body.education);
//   if (body.linkedin_profile) form.append("linkedin_profile", body.linkedin_profile);
//   if (body.portfolio_url) form.append("portfolio_url", body.portfolio_url);
//   if (body.address) {
//     if (body.address.street) form.append("address.street", body.address.street);
//     if (body.address.city) form.append("address.city", body.address.city);
//     if (body.address.state) form.append("address.state", body.address.state);
//     if (body.address.postal_code) form.append("address.postal_code", body.address.postal_code);
//     if (body.address.country) form.append("address.country", body.address.country);
//   }
//   if (body.profile_picture) form.append("profile_picture", body.profile_picture);
//   if (body.cnic_image) form.append("cnic_image", body.cnic_image);
//   if (body.resume_document) form.append("resume_document", body.resume_document);
//   if (body.experience_letter) form.append("experience_letter", body.experience_letter);

//   const res = await fetch(`${APPLICANT_BASE_URL}/profile`, {
//     method: "PUT",
//     headers: { Authorization: `Bearer ${token}` },
//     body: form,
//   });

//   if (!res.ok) {
//     const err = (await res.json().catch(() => ({ message: "Update profile failed" }))) as { message?: string };
//     throw new Error(err?.message || `Update profile failed (${res.status})`);
//   }

//   return res.json();
// }


export const updateApplicantProfile = async (token: string, data: any) => {
  const formData = new FormData();

  // ✅ Simple fields
  if (data.name) formData.append('name', data.name);
  if (data.phone_no) formData.append('phone_no', data.phone_no);
  if (data.job_title) formData.append('job_title', data.job_title);
  if (data.experience) formData.append('experience', data.experience);
  if (data.availability) formData.append('availability', data.availability);
  if (data.cover_letter) formData.append('cover_letter', data.cover_letter);
  if (data.skills) formData.append('skills', data.skills);
  if (data.linkedin_profile) formData.append('linkedin_profile', data.linkedin_profile);

  // ✅ Address
  if (data.address) {
    if (data.address.location) formData.append('address[location]', data.address.location);
    if (data.address.city) formData.append('address[city]', data.address.city);
    if (data.address.state) formData.append('address[state]', data.address.state);
    if (data.address.postal_code) formData.append('address[postal_code]', data.address.postal_code);
    if (data.address.latLong) formData.append('address[latLong]', data.address.latLong);
  }

  // ✅ Files
  if (data.cnic_image) formData.append('cnic_image', data.cnic_image);
  if (data.resume_document) formData.append('resume_document', data.resume_document);
  if (data.experience_letter) formData.append('experience_letter', data.experience_letter);

  const response = await fetch(`${APPLICANT_BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token ?? ''}`,
    },
    body: formData,
  });

  // ✅ Error handling
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update profile' }));
    throw new Error(err?.message || 'Failed to update profile');
  }

  // ✅ IMPORTANT (axios jaisa data return)
  const result = await response.json();
  return result;
};
