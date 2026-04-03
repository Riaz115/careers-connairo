import { Bookmark, MapPin } from "lucide-react";
import { Job, useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface JobCardProps {
  job: Job;
  isApplied: boolean;
}

// ✅ Time Ago Function
const timeAgo = (dateString?: string) => {
  if (!dateString) return "Recently posted";
  
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
};

export default function JobCard({ job, isApplied }: JobCardProps) {
  const { isSaved, toggleSaveJob, isProfileComplete } = useApp();
  
  const jobId = job._id;
  const saved = isSaved(jobId);
  const navigate = useNavigate();

  const handleApply = () => {
    if (!isProfileComplete) {
      toast.warning("Complete your profile before applying");
      navigate("/profile");
      return;
    }
    navigate(`/apply/${jobId}`);
  };

  const handleViewDetails = () => {
    navigate(`/job/${jobId}`);
  };

  // ✅ Tags array
  const tags = [job.jobType, job.workMode, job.experienceLevel].filter(Boolean);

  return (
    <div className="bg-card rounded-lg p-6 card-shadow settle-transition hover:card-shadow-hover hover:-translate-y-1 group">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground leading-snug">{job.title}</h3>
          <p className="font-mono-data text-primary mt-1">
            ${job.hourlyPay}/hr • {timeAgo(job.updatedAt || job.createdAt)}
          </p>
        </div>

        <button
          onClick={() => toggleSaveJob(jobId)}
          className={`p-2 rounded-lg settle-transition ${
            saved
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Bookmark
            className="w-4 h-4"
            fill={saved ? "currentColor" : "none"}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* Company Name */}
      {job.companyName && (
        <p className="text-sm font-medium text-foreground/80 mb-2">
          {job.companyName}
        </p>
      )}

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
        {job.description}
      </p>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <MapPin className="w-3.5 h-3.5" strokeWidth={1.8} />
        {job.location}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium"
            >
              {tag}
            </span>
          ))}
          {job.requiredSkills && (
            <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
              {job.requiredSkills.split(',').slice(0, 2).join(', ')}
              {job.requiredSkills.split(',').length > 2 ? '...' : ''}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleViewDetails}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted settle-transition active:scale-[0.97]"
        >
          View Details
        </button>

        {isApplied ? (
          <span className="text-sm font-medium px-4 py-2 rounded-lg bg-accent/10 text-accent cursor-default flex items-center gap-1">
            ✓ Applied
          </span>
        ) : (
          <button
            onClick={handleApply}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover settle-transition active:scale-[0.97]"
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
}