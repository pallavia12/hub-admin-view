import { StatsCard } from "./StatsCard";
import { RequestsList } from "../requests/RequestsList";
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react";

const mockStats = [
  {
    title: "Pending Approvals",
    value: "24",
    change: "+3 from yesterday",
    changeType: "increase" as const,
    icon: Clock
  },
  {
    title: "Approved Today",
    value: "18",
    change: "+12% from yesterday",
    changeType: "increase" as const,
    icon: CheckCircle
  },
  {
    title: "Rejected Today",
    value: "3",
    change: "-2 from yesterday",
    changeType: "decrease" as const,
    icon: XCircle
  },
  {
    title: "Total Requests",
    value: "142",
    change: "+8 from yesterday",
    changeType: "increase" as const,
    icon: FileText
  }
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Overview of all approval requests and system activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {mockStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Recent Requests</h3>
        <RequestsList showActions={false} limit={5} />
      </div>
    </div>
  );
}