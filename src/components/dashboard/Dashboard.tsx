import { useState, useEffect } from "react";
import { StatsCard } from "./StatsCard";
import { RequestsList } from "../requests/RequestsList";
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiRequest {
  requestId: number;
  customerName: string;
  requestedByUserName: string;
  abmStatus: string;
  campaignType: string;
  discountType: string;
  discountValue: number;
  orderQty: number;
  skuName: string;
  createdAt: string;
  abmReviewedAt: string;
  customerContact: number;
  requestedByContact: string;
  eligible: number;
  eligibilityReason: string;
  customerId: number;
  ContactNumber: string;
  skuId: number;
  ABM_UserName: string;
  requestedBy: number;
  orderMode: number;
  CustomerTypeId: number;
  abmDiscountValue: number | null;
  ABM_Id: number;
  abmOrderQty: number | null;
  reason: string | null;
  abmDiscountType: string | null;
  abmRemarks: string;
}

interface ApiResponse {
  success: boolean;
  code: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  requestId: string;
  data: ApiRequest[];
}

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
  const [apiData, setApiData] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5678/webhook-test/admin-fetch-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.success && data.data) {
          setApiData(data.data);
        } else {
          throw new Error(data.errorMessage || 'Failed to fetch requests');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch requests');
        console.error('Failed to fetch requests:', err);
        toast({
          title: "Error",
          description: "Failed to fetch requests from the server.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [toast]);

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
        <RequestsList 
          showActions={false} 
          limit={5} 
          apiData={apiData}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}