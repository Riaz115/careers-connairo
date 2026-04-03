import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_URL } from "@/lib/env";

interface Application {
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  hourlyPay: string;
  jobType: string;
  location: string;
  experienceLevel: string;
  workMode: string;
  perks: string;
  requiredSkills: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  applicantStatus: "pending" | "shortlist" | "reject";
  applicationDate: string;
}

interface ApplicationsResponse {
  status: number;
  message: string;
  data: Application[];
  totalApplications: number;
}

export default function AppliedJobsPage() {
  const { token } = useApp();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "shortlist" | "reject">("all");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/career/applicant/applications`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch applications");
        }

        const data: ApplicationsResponse = await response.json();
        console.log("Applications data:", data); // Debug log
        setApplications(data.data || []);
      } catch (error) {
        console.error("Error fetching applications:", error);
        toast({
          title: "Failed to load applications",
          description: error instanceof Error ? error.message : "Please try again later",
          variant: "destructive",
        });
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [token, toast]);

  // Filter applications based on selected tab
  const filteredApplications = applications.filter((app) => {
    if (tab === "all") return true;
    return app.applicantStatus === tab;
  });

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "shortlist":
        return "bg-accent/10 text-accent";
      case "reject":
        return "bg-destructive/10 text-destructive";
      case "pending":
        return "bg-warning/20 text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "shortlist":
        return "Shortlisted";
      case "reject":
        return "Rejected";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (!token) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl">
          <h1 className="text-2xl font-semibold text-foreground mb-6">Applied Jobs</h1>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Please login to view your applications</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Applied Jobs</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "shortlist", "reject"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize settle-transition ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              }`}
            >
              {t === "all" ? "All" : t === "shortlist" ? "Shortlisted" : t === "reject" ? "Rejected" : "Pending"}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* No Applications State */}
        {!loading && filteredApplications.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {tab === "all"
                ? "No applications found. Start applying for jobs!"
                : `No ${tab === "shortlist" ? "shortlisted" : tab} applications found.`}
            </p>
          </div>
        )}

        {/* Applications Grid */}
        {!loading && filteredApplications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredApplications.map((app, index) => (
              <div key={`${app.jobId}-${index}`} className="bg-card rounded-lg p-6 card-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-foreground flex-1 mr-2">
                    {app.jobTitle}
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize whitespace-nowrap ${getStatusBadgeStyles(
                      app.applicantStatus
                    )}`}
                  >
                    {getStatusText(app.applicantStatus)}
                  </span>
                </div>

                <p className="font-mono-data text-primary mb-2">
                  {app.hourlyPay ? `$${app.hourlyPay}/hr` : "Salary not specified"}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.8} />
                  {app.location || "Location not specified"}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {app.workMode && (
                    <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                      {app.workMode}
                    </span>
                  )}
                  {app.jobType && (
                    <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                      {app.jobType}
                    </span>
                  )}
                  {app.experienceLevel && (
                    <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                      {app.experienceLevel}
                    </span>
                  )}
                </div>

                {/* Company Info */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-foreground">{app.companyName}</p>
                  {app.companyEmail && (
                    <p className="text-xs text-muted-foreground mt-1">{app.companyEmail}</p>
                  )}
                </div>

                {/* Application Date */}
                {app.applicationDate && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Applied on: {formatDate(app.applicationDate)}
                  </p>
                )}

                <span className="text-sm font-medium px-4 py-2 rounded-lg bg-muted text-muted-foreground inline-block">
                  Applied
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Total Applications Count */}
        {!loading && applications.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Total applications: {applications.length}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}