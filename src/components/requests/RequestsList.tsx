import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Check, X, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiRequest {
  requestId: number;
  customerName: string;
  requestedByUserName: string;
  abmStatus: string;
  campaignType: string;
  discountType: string;
  discountValue: number | null;
  orderQty: number;
  skuName: string | null;
  createdAt: string;
  abmReviewedAt: string;
  customerContact: number;
  requestedByContact: string;
  eligible: number;
  eligibilityReason: string;
  customerId: number;
  ContactNumber: string;
  skuId: number | null;
  ABM_UserName: string;
  requestedBy: number;
  orderMode: number | null;
  CustomerTypeId: number;
  abmDiscountValue: number | null;
  ABM_Id: number;
  abmOrderQty: number | null;
  reason: string | null;
  abmDiscountType: string | null;
  abmRemarks: string;
}

interface Request {
  id: string;
  title: string;
  requester: string;
  department: string;
  status: "pending" | "approved" | "rejected" | "escalated";
  priority: "low" | "medium" | "high";
  createdAt: string;
  description: string;
  campaignType: string;
  discountValue: number;
  orderQty: number;
  eligible: number;
  eligibilityReason: string;
}

interface ApiResponse {
  success: boolean;
  code: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  requestId: string;
  data: ApiRequest[];
}

interface RequestsListProps {
  showActions?: boolean;
  limit?: number;
}

const transformApiRequest = (apiRequest: ApiRequest): Request => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatus = (abmStatus: string): "pending" | "approved" | "rejected" | "escalated" => {
    switch (abmStatus.toLowerCase()) {
      case "approved": return "approved";
      case "rejected": return "rejected";
      case "escalated": return "escalated";
      default: return "pending";
    }
  };

  const getPriority = (eligible: number, discountValue: number | null): "low" | "medium" | "high" => {
    if (!eligible) return "high";
    if (discountValue && discountValue > 100) return "high";
    if (discountValue && discountValue > 50) return "medium";
    return "low";
  };

  const safeDiscountValue = apiRequest.discountValue ?? 0;
  const safeSkuName = apiRequest.skuName ?? "Unknown SKU";

  return {
    id: `REQ-${apiRequest.requestId}`,
    title: `${apiRequest.campaignType} - ${safeSkuName}`,
    requester: apiRequest.customerName,
    department: `Requested by: ${apiRequest.requestedByUserName}`,
    status: getStatus(apiRequest.abmStatus),
    priority: getPriority(apiRequest.eligible, apiRequest.discountValue),
    createdAt: formatDate(apiRequest.createdAt),
    description: `${apiRequest.discountType}: ${apiRequest.discountValue ? `₹${apiRequest.discountValue}` : 'No discount'} | Order Qty: ${apiRequest.orderQty}kg | ${apiRequest.eligible ? 'Eligible' : apiRequest.eligibilityReason}`,
    campaignType: apiRequest.campaignType,
    discountValue: safeDiscountValue,
    orderQty: apiRequest.orderQty,
    eligible: apiRequest.eligible,
    eligibilityReason: apiRequest.eligibilityReason
  };
};

export function RequestsList({ 
  showActions = true, 
  limit
}: RequestsListProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5678/webhook-test/admin-fetch-requests', {
          //'https://ninjasndanalytics.app.n8n.cloud/webhook-test/admin-fetch-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.json();
        console.log('Raw API response:', rawData);
        
        // Handle the actual response format: array containing object with success/data structure
        let apiResponse: ApiResponse;
        if (Array.isArray(rawData) && rawData.length > 0) {
          // Extract the first object from the array
          const responseObj = rawData[0];
          if (responseObj && typeof responseObj === 'object' && 'success' in responseObj) {
            apiResponse = responseObj;
          } else {
            // Fallback: treat the array items as direct data
            apiResponse = {
              success: true,
              code: null,
              errorCode: null,
              errorMessage: null,
              requestId: 'direct-response',
              data: rawData
            };
          }
        } else if (rawData && typeof rawData === 'object' && 'success' in rawData) {
          apiResponse = rawData;
        } else {
          throw new Error('Invalid response format');
        }
        
        console.log('Parsed API response:', apiResponse);
        
        // Ensure we have data and it's an array
        if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
          console.log('Processing data:', apiResponse.data);
          const transformedRequests = apiResponse.data.map(transformApiRequest);
          console.log('Transformed requests:', transformedRequests);
          setRequests(transformedRequests);
        } else {
          const errorMsg = apiResponse.errorMessage || 'No valid data received from server';
          throw new Error(errorMsg);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch requests';
        setError(errorMessage);
        console.error('Failed to fetch requests:', err);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [toast]);

  const handleApprove = (requestId: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: "approved" as const } : req
      )
    );
    toast({
      title: "Request Approved",
      description: `Request ${requestId} has been approved successfully.`,
      variant: "default"
    });
  };

  const handleReject = (requestId: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: "rejected" as const } : req
      )
    );
    toast({
      title: "Request Rejected",
      description: `Request ${requestId} has been rejected.`,
      variant: "destructive"
    });
  };

  const filteredRequests = requests
    .filter(req => {
      const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || req.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .slice(0, limit);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning text-warning-foreground";
      case "approved": return "bg-success text-success-foreground";
      case "rejected": return "bg-destructive text-destructive-foreground";
      case "escalated": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "low": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Approval Requests</CardTitle>
          
          {showActions && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading requests...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
            <div key={request.id} className="border border-border rounded-lg p-4 transition-colors hover:bg-accent/50">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <h4 className="font-semibold text-foreground">{request.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">ID:</span> {request.id} • 
                    <span className="font-medium"> Requester:</span> {request.requester} • 
                    <span className="font-medium"> Department:</span> {request.department} • 
                    <span className="font-medium"> Date:</span> {request.createdAt}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                </div>
                
                {showActions && request.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      className="text-success hover:bg-success hover:text-success-foreground"
                    >
                      <Check size={16} className="mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X size={16} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No requests found matching your criteria.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}