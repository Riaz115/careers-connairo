import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, MapPin, Clock, Wifi, Briefcase, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { sampleJobs, useApp } from "@/context/AppContext";

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { isApplied, isSaved, toggleSaveJob, jobs } = useApp();

  if (!jobId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <h2 className="text-xl font-semibold text-foreground mb-2">Invalid job</h2>
          <p className="text-muted-foreground mb-6">No job ID was provided.</p>
          <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover settle-transition">
            Back to Jobs
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const effectiveJobs = jobs.length > 0 ? jobs : sampleJobs;
  const job = effectiveJobs.find((j) => j.id === jobId);
  const applied = isApplied(jobId);
  const saved = isSaved(jobId);

  if (!job) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <h2 className="text-xl font-semibold text-foreground mb-2">Job not found</h2>
          <p className="text-muted-foreground mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover settle-transition">
            Back to Jobs
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const perks = job.perks ? job.perks.split(/[,;]\s*/).filter(Boolean) : [];
  const skills = job.requiredSkills ? job.requiredSkills.split(/[,;]\s*/).filter(Boolean) : [];

  const workType = job.workMode ?? job.tags.find((t) => t === "Remote" || t === "Onsite" || t === "Hybrid") ?? "Onsite";
  const jobType = job.jobType ?? job.tags.find((t) => t === "Full-time" || t === "Full Time" || t === "FullTime") ?? "Full-time";

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground settle-transition mb-6">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
          Back
        </button>

        <div className="bg-card rounded-lg p-6 sm:p-8 card-shadow mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground leading-tight mb-1">{job.title}</h1>
              <p className="text-sm text-muted-foreground">{job.companyName ?? job.company}</p>
            </div>
            <button onClick={() => toggleSaveJob(job.id)} className={`p-2.5 rounded-lg settle-transition ${saved ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Bookmark className="w-5 h-5" fill={saved ? "currentColor" : "none"} strokeWidth={1.8} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground mb-5">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" strokeWidth={1.8} /> {job.location}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" strokeWidth={1.8} /> {jobType}</span>
            <span className="flex items-center gap-1.5"><Wifi className="w-4 h-4" strokeWidth={1.8} /> {workType}</span>
            <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" strokeWidth={1.8} /> {job.experienceLevel ?? "N/A"}</span>
          </div>

          <p className="font-mono-data text-primary text-lg mb-4">{job.hourlyPay ? `$${job.hourlyPay}/hr` : job.salary}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {job.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">{tag}</span>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            {applied ? (
              <span className="text-sm font-medium px-5 py-2.5 rounded-lg bg-accent/10 text-accent">Applied</span>
            ) : (
              <button onClick={() => navigate(`/apply/${job.id}`)} className="text-sm font-medium px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover settle-transition active:scale-[0.97]">
                Apply Now
              </button>
            )}
            <button onClick={() => toggleSaveJob(job.id)} className="text-sm font-medium px-5 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted settle-transition active:scale-[0.97]">{saved ? "Unsave" : "Save Job"}</button>
          </div>

          <Section title="Description">
            <p className="text-sm text-muted-foreground leading-relaxed">{job.description || "No description available."}</p>
          </Section>

          {perks.length > 0 && (
            <Section title="Perks">
              <ul className="space-y-2">
                {perks.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {skills.length > 0 && (
            <Section title="Required Skills">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">{skill}</span>
                ))}
              </div>
            </Section>
          )}

          <Section title="Company Details">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> {job.active ? "Active" : "Inactive"}</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {job.companyEmail ?? "N/A"}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {job.companyPhone ?? "N/A"}</p>
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "N/A"}</p>
              {job.updatedAt && <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Updated: {new Date(job.updatedAt).toLocaleDateString()}</p>}
            </div>
          </Section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg p-6 sm:p-8 card-shadow mb-4">
      <h2 className="text-base font-semibold text-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}
