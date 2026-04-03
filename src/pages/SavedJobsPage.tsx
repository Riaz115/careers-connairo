import DashboardLayout from "@/components/DashboardLayout";
import JobCard from "@/components/JobCard";
import { sampleJobs, useApp } from "@/context/AppContext";

export default function SavedJobsPage() {
  const { savedJobs, jobs } = useApp();
  const effectiveJobs = jobs.length > 0 ? jobs : sampleJobs;
  const savedJobsList = effectiveJobs.filter((j) => savedJobs.includes(j.id));

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Saved Jobs</h1>

        {savedJobsList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No saved jobs yet. Bookmark jobs you're interested in!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {savedJobsList.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
