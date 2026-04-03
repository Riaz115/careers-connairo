import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Demo in-memory dataset (replace with DB later).
const jobs = [
  { id: "1", title: "Technical Support Specialist", salary: "$20–25/hr", description: "Provide technical assistance and troubleshooting support to clients via phone and email.", location: "Lahore, Pakistan", tags: ["Part-time", "Remote"], company: "TechCorp" },
  { id: "2", title: "Frontend Developer", salary: "$30–40/hr", description: "Build and maintain responsive web applications using React and TypeScript.", location: "Karachi, Pakistan", tags: ["Full-time", "Remote"], company: "DevStudio" },
  { id: "3", title: "UI/UX Designer", salary: "$25–35/hr", description: "Design intuitive user interfaces and create wireframes for mobile and web applications.", location: "Islamabad, Pakistan", tags: ["Full-time", "Onsite"], company: "DesignLab" },
  { id: "4", title: "Data Analyst", salary: "$22–30/hr", description: "Analyze large datasets and create comprehensive reports for business decision making.", location: "Lahore, Pakistan", tags: ["Part-time", "Hybrid"], company: "DataFlow" },
  { id: "5", title: "Project Manager", salary: "$35–45/hr", description: "Lead cross-functional teams and manage project timelines, budgets, and deliverables.", location: "Karachi, Pakistan", tags: ["Full-time", "Onsite"], company: "BuildRight" },
  { id: "6", title: "Content Writer", salary: "$15–20/hr", description: "Create engaging content for blogs, social media, and marketing campaigns.", location: "Remote", tags: ["Part-time", "Remote"], company: "ContentHub" },
  { id: "7", title: "DevOps Engineer", salary: "$40–50/hr", description: "Manage CI/CD pipelines, cloud infrastructure, and deployment automation.", location: "Islamabad, Pakistan", tags: ["Full-time", "Remote"], company: "CloudOps" },
  { id: "8", title: "Marketing Coordinator", salary: "$18–25/hr", description: "Coordinate marketing campaigns and manage social media channels.", location: "Lahore, Pakistan", tags: ["Full-time", "Hybrid"], company: "MarketPro" },
];

function toInt(v) {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return undefined;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// GET /api/career/public/jobs
// Pagination behavior:
// - Default: page=1, perPage=50
// - perPage can be provided via: perPage, limit, value
// - Response: { status, message, data: { jobs, page, perPage, totalJobs, totalPages } }
app.get("/api/career/public/jobs", (req, res) => {
  const pageRaw = toInt(req.query.page);
  const perPageRaw =
    toInt(req.query.perPage) ??
    toInt(req.query.limit) ??
    toInt(req.query.value);

  const page = clamp(pageRaw ?? 1, 1, Number.MAX_SAFE_INTEGER);
  const perPage = clamp(perPageRaw ?? 50, 1, 500);

  const totalJobs = jobs.length;
  const totalPages = Math.max(1, Math.ceil(totalJobs / perPage));

  const start = (page - 1) * perPage;
  const pagedJobs = jobs.slice(start, start + perPage);

  return res.json({
    status: 200,
    message: "Career jobs retrieved successfully.",
    data: {
      jobs: pagedJobs,
      page,
      perPage,
      totalJobs,
      totalPages,
    },
  });
});

const applications = [];

// PUT /api/career/public/jobs/apply (Legacy: keep for old clients, forwards to PATCH route)
app.put("/api/career/public/jobs/apply", (req, res) => {
  const jobId = req.body?.jobId;
  if (!jobId) {
    return res.status(400).json({ status: 400, message: "jobId is required.", data: null });
  }
  return res.redirect(307, `/api/career/public/jobs/apply/${encodeURIComponent(jobId)}`);
});

// PATCH /api/career/public/jobs/apply/:jobId
// Public endpoint: accepts JSON application payload with job ID in URL.
// Body expected (frontend sends):
// { fullName, phone, email, city, jobTitle, skills[], experience, availability, expectedRate, workType, ownTools, multipleCities, description, resumeFileName, resumeMimeType, resumeBase64 }
app.patch("/api/career/public/jobs/apply/:jobId", (req, res) => {
  const body = req.body ?? {};
  const jobId = req.params.jobId;
  if (!jobId) {
    return res.status(400).json({ status: 400, message: "jobId is required in URL.", data: null });
  }

  const application = {
    id: String(Date.now()) + "_" + Math.random().toString(16).slice(2),
    jobId: String(jobId),
    fullName: body.fullName,
    phone: body.phone,
    email: body.email,
    city: body.city,
    jobTitle: body.jobTitle,
    skills: Array.isArray(body.skills) ? body.skills : [],
    experience: body.experience,
    availability: body.availability,
    expectedRate: body.expectedRate,
    workType: body.workType,
    ownTools: Boolean(body.ownTools),
    multipleCities: Boolean(body.multipleCities),
    description: body.description,
    resumeFileName: body.resumeFileName || null,
    resumeMimeType: body.resumeMimeType || null,
    resumeBase64: body.resumeBase64 || null,
    createdAt: new Date().toISOString(),
  };

  applications.push(application);

  return res.json({ status: 200, message: "Application submitted successfully.", data: { applicationId: application.id } });
});

// In-memory applicant profiles (replace with DB later)
const applicantProfiles = {};

// GET /api/applicant/profile
// Returns applicant profile data
app.get("/api/applicant/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: 401, message: "Unauthorized: No token provided", data: null });
  }

  const token = authHeader.substring(7);
  
  // For demo purposes, extract applicant ID from token or use a default
  // In production, you'd verify the JWT token and extract the applicant ID
  const applicantId = token.split("_")[1] || "demo_applicant";
  
  // Get profile from in-memory storage or create a default one
  let profile = applicantProfiles[applicantId];
  
  if (!profile) {
    // Create a default profile for demo purposes
    profile = {
      _id: applicantId,
      name: "Demo User",
      email: "demo@example.com",
      phone_no: "+92 300 1234567",
      profile_picture: null,
      address: {
        street: "123 Main Street",
        city: "Karachi",
        state: "Sindh",
        postal_code: "75000",
        country: "Pakistan",
      },
      experience: "3 years",
      job_title: "Software Developer",
      availability: "Immediate",
      cnic_image: null,
      resume_document: null,
      cover_letter: "I am a passionate developer with experience in React and Node.js.",
      skills: ["React", "TypeScript", "Node.js", "MongoDB"],
      education: "Bachelor's in Computer Science",
      linkedin_profile: "https://linkedin.com/in/demouser",
      portfolio_url: "https://demouser.com",
      is_verified: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    applicantProfiles[applicantId] = profile;
  }

  return res.json({
    status: 200,
    message: "Profile retrieved successfully.",
    data: profile,
  });
});

// PUT /api/applicant/profile
// Updates applicant profile with file uploads
app.put(
  "/api/applicant/profile",
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "cnic_image", maxCount: 1 },
    { name: "resume_document", maxCount: 1 },
    { name: "experience_letter", maxCount: 1 },
  ]),
  (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ status: 401, message: "Unauthorized: No token provided", data: null });
    }

    const token = authHeader.substring(7);
    const applicantId = token.split("_")[1] || "demo_applicant";

    // Get existing profile or create new one
    let profile = applicantProfiles[applicantId] || {
      _id: applicantId,
      name: "",
      email: "",
      phone_no: "",
      profile_picture: null,
      address: {},
      experience: "",
      job_title: "",
      availability: "",
      cnic_image: null,
      resume_document: null,
      cover_letter: "",
      skills: [],
      education: "",
      linkedin_profile: "",
      portfolio_url: "",
      is_verified: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update text fields
    if (req.body.name) profile.name = req.body.name;
    if (req.body.phone_no) profile.phone_no = req.body.phone_no;
    if (req.body.experience) profile.experience = req.body.experience;
    if (req.body.job_title) profile.job_title = req.body.job_title;
    if (req.body.availability) profile.availability = req.body.availability;
    if (req.body.cover_letter) profile.cover_letter = req.body.cover_letter;
    if (req.body.skills) {
      profile.skills = typeof req.body.skills === "string" 
        ? req.body.skills.split(",").map(s => s.trim()).filter(Boolean)
        : req.body.skills;
    }
    if (req.body.education) profile.education = req.body.education;
    if (req.body.linkedin_profile) profile.linkedin_profile = req.body.linkedin_profile;
    if (req.body.portfolio_url) profile.portfolio_url = req.body.portfolio_url;

    // Update address fields
    if (req.body["address.street"]) {
      if (!profile.address) profile.address = {};
      profile.address.street = req.body["address.street"];
    }
    if (req.body["address.city"]) {
      if (!profile.address) profile.address = {};
      profile.address.city = req.body["address.city"];
    }
    if (req.body["address.state"]) {
      if (!profile.address) profile.address = {};
      profile.address.state = req.body["address.state"];
    }
    if (req.body["address.postal_code"]) {
      if (!profile.address) profile.address = {};
      profile.address.postal_code = req.body["address.postal_code"];
    }
    if (req.body["address.country"]) {
      if (!profile.address) profile.address = {};
      profile.address.country = req.body["address.country"];
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.profile_picture) {
        profile.profile_picture = `/uploads/${req.files.profile_picture[0].filename}`;
      }
      if (req.files.cnic_image) {
        profile.cnic_image = `/uploads/${req.files.cnic_image[0].filename}`;
      }
      if (req.files.resume_document) {
        profile.resume_document = `/uploads/${req.files.resume_document[0].filename}`;
      }
      if (req.files.experience_letter) {
        // Experience letter is uploaded but not stored in profile response
        // You can store it if needed
        console.log(`Experience letter uploaded: ${req.files.experience_letter[0].filename}`);
      }
    }

    profile.updatedAt = new Date().toISOString();
    applicantProfiles[applicantId] = profile;

    return res.json({
      status: 200,
      message: "Profile updated successfully.",
      data: profile,
    });
  }
);

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT ? Number(process.env.PORT) : 8000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
