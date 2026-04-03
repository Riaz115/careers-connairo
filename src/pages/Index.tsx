import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Briefcase, Bookmark, FileText, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import JobCard from "@/components/JobCard";
import { useApp, Job } from "@/context/AppContext";
import { fetchPublicJobs } from "@/lib/careerApi";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function HomePage() {
  const { savedJobs, token, setJobs, jobs } = useApp();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didFetch, setDidFetch] = useState(false);
  
  // ✅ State for applied job IDs
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // ✅ Fetch user's applications
  useEffect(() => {
    if (!token) return;

    const fetchUserApplications = async () => {
      try {
        setLoadingApplications(true);
        const response = await fetch(`${BACKEND_URL}/career/applicant/applications`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            const jobIds = data.data.map((app: any) => app.jobId);
            setAppliedJobIds(jobIds);
            console.log("✅ Applied job IDs:", jobIds);
          }
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchUserApplications();
  }, [token]);

  // ✅ Fetch all jobs
  useEffect(() => {
    const ac = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchPublicJobs({ page, perPage, signal: ac.signal })
      .then((resp) => {
        setJobs(resp.jobs || []);
        setPage(resp.page);
        setPerPage(resp.perPage);
        setTotalJobs(resp.totalJobs);
        setTotalPages(resp.totalPages);
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load jobs");
        setJobs([]);
        setTotalJobs(0);
        setTotalPages(1);
      })
      .finally(() => {
        if (ac.signal.aborted) return;
        setIsLoading(false);
        setDidFetch(true);
      });

    return () => ac.abort();
  }, [page, perPage, setJobs]);

  const effectiveJobs = didFetch ? jobs : [];

  // ✅ Check if a job is applied
  const isJobApplied = (jobId: string) => {
    return appliedJobIds.includes(jobId);
  };

  // ✅ Filter jobs based on search
  const filteredJobs = useMemo(() => {
    const s = search.trim().toLowerCase();
    const l = location.trim().toLowerCase();
    
    return effectiveJobs.filter((job) => {
      const matchesSearch = !s || 
        job.title?.toLowerCase().includes(s) ||
        job.description?.toLowerCase().includes(s) ||
        job.companyName?.toLowerCase().includes(s) ||
        job.requiredSkills?.toLowerCase().includes(s) ||
        job.jobType?.toLowerCase().includes(s) ||
        job.workMode?.toLowerCase().includes(s);
      
      const matchesLocation = !l || 
        job.location?.toLowerCase().includes(l);
      
      return matchesSearch && matchesLocation;
    });
  }, [effectiveJobs, search, location]);

  const canPrev = page > 1 && !isLoading;
  const canNext = page < totalPages && !isLoading;
  const appliedJobsCount = appliedJobIds.length;
  const savedJobsCount = savedJobs?.length || 0;

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-6">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5" strokeWidth={1.8} />}
            label="Jobs Applied"
            value={appliedJobsCount}
            accent="primary"
          />
          <StatCard
            icon={<Briefcase className="w-5 h-5" strokeWidth={1.8} />}
            label="New Jobs"
            value={didFetch ? totalJobs : 0}
            accent="accent"
          />
          <StatCard
            icon={<Bookmark className="w-5 h-5" strokeWidth={1.8} />}
            label="Saved Jobs"
            value={savedJobsCount}
            accent="warning"
          />
        </div>

        {/* Search Bar */}
        <div className="bg-card rounded-lg p-4 card-shadow mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-alt">
              <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
              <input
                type="text"
                placeholder="Job title, company, or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-alt sm:w-64">
              <MapPin className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
              <input
                type="text"
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            <button 
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover settle-transition"
            >
              Find Jobs
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {(isLoading || loadingApplications) && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              {loadingApplications ? "Loading your applications..." : "Loading jobs..."}
            </span>
          </div>
        )}

        {/* Job Grid */}
        {!isLoading && !loadingApplications && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredJobs.map((job, i) => (
                <div key={job._id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <JobCard 
                    job={job} 
                    isApplied={isJobApplied(job._id)}
                  />
                </div>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No jobs found matching your criteria.</p>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {!isLoading && filteredJobs.length > 0 && (
          <div className="mt-8 flex flex-col gap-3 items-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!canPrev) return;
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={!canPrev}
                    className={!canPrev ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive
                    onClick={(e) => e.preventDefault()}
                  >
                    {page} / {totalPages}
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!canNext) return;
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    aria-disabled={!canNext}
                    className={!canNext ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Per page</span>
              <select
                className="px-3 py-2 rounded-lg bg-surface-alt border border-border text-foreground"
                value={perPage}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setPage(1);
                  setPerPage(Number.isFinite(next) ? next : 50);
                }}
                disabled={isLoading}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}