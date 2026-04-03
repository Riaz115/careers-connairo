import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  accent?: "primary" | "accent" | "warning";
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning-foreground",
};

export default function StatCard({ icon, label, value, accent = "primary" }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg p-5 card-shadow flex items-center gap-4 animate-scale-in">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
