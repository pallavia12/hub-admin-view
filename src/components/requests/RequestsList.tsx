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
  status: "pending" | "approved" | "rejected" | "escalated" | "accepted";
  priority: "low" | "medium" | "high";
  createdAt: string;
  description: string;
  campaignType: string;
  discountValue: number;
  orderQty: number;
  eligible: number;
  eligibilityReason: string;
  customerId: number;
  contactNumber: string;
  requestedByContact: string;
  discountType: string;
  requestedDate: string;
  requestedTime: string;
  abmId: number;
  abmUserName: string;
  abmRemarks: string;
  abmContactNumber: string;
  escalatedAt: string;
  acceptedAt?: string;
  tat?: string;
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getStatus = (abmStatus: string): "pending" | "approved" | "rejected" | "escalated" | "accepted" => {
    switch (abmStatus.toLowerCase()) {
      case "approved": return "approved";
      case "rejected": return "rejected";
      case "escalated": return "escalated";
      case "accepted": return "accepted";
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

  const dateTime = formatDateTime(apiRequest.createdAt);
  const escalatedDateTime = formatDateTime(apiRequest.abmReviewedAt);

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
    eligibilityReason: apiRequest.eligibilityReason,
    // Additional fields for the new UI requirements
    customerId: apiRequest.customerId,
    contactNumber: apiRequest.ContactNumber,
    requestedByContact: apiRequest.requestedByContact,
    discountType: apiRequest.discountType,
    requestedDate: dateTime.date,
    requestedTime: dateTime.time,
    abmId: apiRequest.ABM_Id,
    abmUserName: apiRequest.ABM_UserName,
    abmRemarks: apiRequest.abmRemarks,
    abmContactNumber: apiRequest.ContactNumber,
    escalatedAt: escalatedDateTime.date
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

  const calculateTAT = (createdAt: string, acceptedAt: string) => {
    const created = new Date(createdAt);
    const accepted = new Date(acceptedAt);
    const diffMs = accepted.getTime() - created.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days} days, ${hours} hours, ${minutes} minutes`;
  };

  const handleApprove = (requestId: string) => {
    const acceptedAt = new Date().toISOString();
    setRequests(prev => 
      prev.map(req => {
        if (req.id === requestId) {
          const tat = calculateTAT(req.createdAt, acceptedAt);
          return { 
            ...req, 
            status: "accepted" as const,
            acceptedAt,
            tat
          };
        }
        return req;
      })
    );
    toast({
      title: "Request Accepted",
      description: `Request ${requestId} has been accepted successfully.`,
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
      
      return matchesSearch && matchesStatus;
    })
    .slice(0, limit);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning text-warning-foreground";
      case "approved": return "bg-success text-success-foreground";
      case "accepted": return "bg-success text-success-foreground";
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
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
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
            <div key={request.id} className="border border-border rounded-lg p-6 transition-colors hover:bg-accent/50">
              {/* Header with checkbox, ID and eligible badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border border-border" />
                  <span className="text-lg font-semibold text-foreground">{request.id.replace('REQ-', '')}</span>
                </div>
                {request.eligible === 1 && (
                  <Badge className="bg-foreground text-background px-3 py-1 text-sm font-medium">
                    Eligible
                  </Badge>
                )}
              </div>

              {/* Customer Section */}
              <div className="mb-4">
                <div className="text-muted-foreground text-sm mb-1">Customer</div>
                <div className="text-foreground font-semibold text-lg">
                  {request.requester} ({request.customerId})
                </div>
                <div className="text-muted-foreground text-sm">{request.contactNumber}</div>
              </div>

              {/* Campaign and Order Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <div className="text-muted-foreground text-sm mb-1">Campaign</div>
                  <div className="text-foreground">{request.campaignType.toLowerCase().replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm mb-1">Order</div>
                  <div className="text-foreground">{request.orderQty} kg</div>
                  <div className="text-muted-foreground text-sm">Delivery</div>
                </div>
              </div>

              {/* Discount Section */}
              <div className="mb-4">
                <div className="text-muted-foreground text-sm mb-1">Discount</div>
                <div className="text-foreground">
                  {request.discountValue > 0 
                    ? `₹${request.discountValue} (${request.discountType})` 
                    : 'No discount specified'}
                </div>
              </div>

              {/* Requested By and Date Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <div className="text-muted-foreground text-sm mb-1">Requested By</div>
                  <div className="text-foreground">{request.department.replace('Requested by: ', '')}</div>
                  <div className="text-muted-foreground text-sm">{request.requestedByContact}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm mb-1">Requested Date</div>
                  <div className="text-foreground">{request.requestedDate}</div>
                  <div className="text-muted-foreground text-sm">{request.requestedTime}</div>
                </div>
              </div>

              {/* Escalated At Section - Show only for escalated requests */}
              {request.status === "escalated" && (
                <div className="mb-6">
                  <div className="text-muted-foreground text-sm mb-1">Escalated At</div>
                  <div className="text-foreground">{request.escalatedAt}</div>
                </div>
              )}

              {/* Escalated By Section - Show only for escalated requests */}
              {request.status === "escalated" && (
                <div className="mb-6">
                  <div className="text-muted-foreground text-sm mb-1">Escalated By</div>
                  <div className="text-foreground">{request.abmUserName} (ID: {request.abmId})</div>
                  <div className="text-muted-foreground text-sm">ABM Contact Number: {request.abmContactNumber}</div>
                  {request.abmRemarks && request.abmRemarks.trim() !== "" && (
                    <div className="text-muted-foreground text-sm mt-1">
                      Remarks: {request.abmRemarks}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {showActions && (request.status === "pending" || request.status === "escalated") && (
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={() => handleApprove(request.id)}
                    className="bg-foreground text-background hover:bg-foreground/90 px-6"
                  >
                    Accept
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(request.id)}
                    className="px-6"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6"
                  >
                    Modify
                  </Button>
                </div>
              )}

              {/* Status badge for approved/rejected/accepted requests */}
              {request.status === "accepted" && (
                <div className="pt-4 border-t border-border">
                  <div className="text-foreground font-semibold">
                    ACCEPTED {new Date(request.acceptedAt || '').toLocaleString('en-GB', {
                      year: 'numeric',
                      month: '2-digit', 
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    }).replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1 $4:$5:$6')}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    TAT: {request.tat}
                  </div>
                </div>
              )}
              {request.status !== "pending" && request.status !== "escalated" && request.status !== "accepted" && (
                <div className="pt-4 border-t border-border">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              )}
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