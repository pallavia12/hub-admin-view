import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Check, X, Eye, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ModifyRequestDialog } from "./ModifyRequestDialog";
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
  ABMUserName?: string;
  requestedBy: number;
  orderMode: number | null;
  CustomerTypeId: number;
  abmDiscountValue: number | null;
  ABM_Id: number;
  ABMId?: number;
  ABMContactNum?: string;
  abmOrderQty: number | null;
  reason: string | null;
  abmDiscountType: string | null;
  abmRemarks: string;
  ABMContactNum?: string;
  adminReviewedAt: string | null;
  adminReviewedBy: number | null;
  adminStatus: string | null;
  adminDiscountType?: string | null;
  adminDiscountValue?: number | null;
  CustomerTypeName: string;
  ShopImage: string;
}
interface Request {
  id: string;
  title: string;
  requester: string;
  department: string;
  status: "pending" | "approved" | "rejected" | "escalated" | "accepted";
  priority: "low" | "medium" | "high";
  createdAt: string;
  createdAtISO: string; // Store original ISO string for calculations
  description: string;
  campaignType: string;
  discountValue: number;
  orderQty: number;
  eligible: number;
  eligibilityReason: string;
  customerId: number;
  contactNumber: string;
  requestedByContact: string;
  requestedBy: number;
  discountType: string;
  requestedDate: string;
  requestedTime: string;
  abmId: number;
  abmUserName: string;
  abmRemarks: string;
  abmContactNumber: string;
  escalatedAt: string;
  escalatedAtTime: string;
  skuName: string | null;
  skuId: number | null;
  orderMode: number | null;
  acceptedAt?: string;
  tat?: string;
  abmStatus: string;
  adminReviewedAt?: string | null;
  adminStatus?: string | null;
  customerTypeName: string;
  shopImage: string;
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
    // Parse IST date directly without timezone conversion in dd/mm/yyyy format
    const [datePart] = dateString.replace('.000+0000', '').split('T');
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateString: string) => {
    // Parse IST timestamp directly without timezone conversion
    const [datePart, timePart] = dateString.replace('.000+0000', '').split('T');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');
    
    const displayDate = `${day}/${month}/${year}`;
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);
    const displayTime = `${displayHour}:${minute}:${second} ${ampm}`;
    
    return {
      date: displayDate,
      time: displayTime
    };
  };

  const formatISTDateTime = (dateString: string) => {
    // Parse IST timestamp directly without timezone conversion
    // Input format: "2025-08-07T07:07:13.000+0000" (IST time in UTC format)
    const [datePart, timePart] = dateString.replace('.000+0000', '').split('T');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');
    
    // Format as IST display in dd/mm/yyyy format
    const displayDate = `${day}/${month}/${year}`;
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);
    const displayTime = `${displayHour}:${minute}:${second} ${ampm}`;
    
    return {
      date: displayDate,
      time: displayTime,
      raw: dateString
    };
  };

  // Check if admin fields are available
  const hasAdminAction = apiRequest.adminStatus !== null && apiRequest.adminStatus !== undefined;
  
  const getStatus = (abmStatus: string, adminStatus: string | null): "pending" | "approved" | "rejected" | "escalated" | "accepted" => {
    // If admin has taken action, prioritize admin status
    if (hasAdminAction && adminStatus) {
      switch (adminStatus.toLowerCase()) {
        case "accepted":
          return "accepted";
        case "rejected":
          return "rejected";
        case "modified":
          return "accepted"; // Show as accepted since it was processed
        default:
          return "pending";
      }
    }
    
    // Otherwise use ABM status
    switch (abmStatus.toLowerCase()) {
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      case "escalated":
        return "escalated";
      case "accepted":
        return "accepted";
      case "modified":
        return "approved"; // Treat MODIFIED as approved since it was processed by ABM
      default:
        return "pending";
    }
  };

  const getPriority = (eligible: number, discountValue: number | null): "low" | "medium" | "high" => {
    if (!eligible) return "high";
    if (discountValue && discountValue > 100) return "high";
    if (discountValue && discountValue > 50) return "medium";
    return "low";
  };

  // Handle MODIFIED status - prefer Admin values when admin has modified, else ABM values, else original
  const finalOrderQty = apiRequest.abmStatus === "MODIFIED" && apiRequest.abmOrderQty !== null ? apiRequest.abmOrderQty : apiRequest.orderQty;

  const finalDiscountValue =
    (apiRequest.adminStatus === "MODIFIED" && apiRequest.adminDiscountValue !== null && apiRequest.adminDiscountValue !== undefined)
      ? apiRequest.adminDiscountValue
      : (apiRequest.abmStatus === "MODIFIED" && apiRequest.abmDiscountValue !== null
          ? apiRequest.abmDiscountValue
          : (apiRequest.discountValue ?? 0));

  const finalDiscountType =
    (apiRequest.adminStatus === "MODIFIED" && apiRequest.adminDiscountType !== null && apiRequest.adminDiscountType !== undefined && apiRequest.adminDiscountType !== "")
      ? apiRequest.adminDiscountType
      : (apiRequest.abmStatus === "MODIFIED" && apiRequest.abmDiscountType !== null && apiRequest.abmDiscountType !== ""
          ? apiRequest.abmDiscountType
          : apiRequest.discountType);

  const safeSkuName = apiRequest.skuName ?? "Unknown SKU";
  const dateTime = formatISTDateTime(apiRequest.createdAt);
  
  // Always use ABM review time for escalated timestamp (IST)
  const reviewDateTime = formatISTDateTime(apiRequest.abmReviewedAt);

  return {
    id: `REQ-${apiRequest.requestId}`,
    title: `${apiRequest.campaignType} - ${safeSkuName}`,
    requester: apiRequest.customerName,
    department: `Requested by: ${apiRequest.requestedByUserName} (ID: ${apiRequest.requestedBy})`,
    status: getStatus(apiRequest.abmStatus, apiRequest.adminStatus),
    priority: getPriority(apiRequest.eligible, finalDiscountValue),
    createdAt: formatDate(apiRequest.createdAt),
    createdAtISO: apiRequest.createdAt, // Store original ISO string
    description: `${finalDiscountType}: ${finalDiscountValue ? `₹${finalDiscountValue}` : 'No discount'} | Order Qty: ${finalOrderQty}kg | ${apiRequest.eligible ? 'Eligible' : apiRequest.eligibilityReason}`,
    campaignType: apiRequest.campaignType,
    discountValue: finalDiscountValue,
    orderQty: finalOrderQty,
    eligible: apiRequest.eligible,
    eligibilityReason: apiRequest.eligibilityReason,
    // Additional fields for the new UI requirements
    customerId: apiRequest.customerId,
    contactNumber: String(apiRequest.customerContact),
    requestedByContact: apiRequest.requestedByContact,
    requestedBy: apiRequest.requestedBy,
    discountType: finalDiscountType,
    requestedDate: dateTime.date,
    requestedTime: dateTime.time,
    abmId: apiRequest.ABMId ?? apiRequest.ABM_Id,
    abmUserName: apiRequest.ABMUserName ?? apiRequest.ABM_UserName,
    abmRemarks: apiRequest.abmRemarks,
    abmContactNumber: apiRequest.ABMContactNum ?? apiRequest.ContactNumber,
    escalatedAt: reviewDateTime.date,
    escalatedAtTime: reviewDateTime.time,
    skuName: apiRequest.skuName,
    skuId: apiRequest.skuId,
    orderMode: apiRequest.orderMode,
    abmStatus: apiRequest.abmStatus,
    // Store admin fields for TAT calculation
    adminReviewedAt: apiRequest.adminReviewedAt,
    adminStatus: apiRequest.adminStatus,
    customerTypeName: apiRequest.CustomerTypeName,
    shopImage: apiRequest.ShopImage
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
  const [actedRequests, setActedRequests] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sortByCustomerId, setSortByCustomerId] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [modifiedRequests, setModifiedRequests] = useState<Map<string, { discountType: string; discountValue: number }>>(new Map());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const {
    toast
  } = useToast();
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        // Get username from localStorage for API authentication
        const username = localStorage.getItem('username') || '';
        const response = await fetch('https://ninjasndanalytics.app.n8n.cloud/webhook/admin-fetch-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
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
  const calculateTAT = (createdAtISO: string, acceptedAt: string) => {
    try {
      // Parse IST timestamps directly without timezone conversion
      const parseISTDate = (dateString: string) => {
        // Handle both API format (.000+0000) and ISO format (Z)
        const cleanDateString = dateString.replace(/\.000\+0000$|Z$/, '');
        const [datePart, timePart] = cleanDateString.split('T');
        
        if (!datePart || !timePart) {
          throw new Error('Invalid date format');
        }
        
        const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
        const [hour, minute, second = 0] = timePart.split(':').map(num => parseInt(num, 10));
        
        // Validate date components
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute) || isNaN(second)) {
          throw new Error('Invalid date components');
        }
        
        return new Date(year, month - 1, day, hour, minute, second);
      };

      const created = parseISTDate(createdAtISO);
      const accepted = parseISTDate(acceptedAt);

      // Validate parsed dates
      if (isNaN(created.getTime()) || isNaN(accepted.getTime())) {
        return "Invalid date";
      }
      
      const diffMs = accepted.getTime() - created.getTime();
      if (diffMs < 0) {
        return "Invalid time range";
      }
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${days} days, ${hours} hours, ${minutes} minutes`;
    } catch (error) {
      console.error('TAT calculation error:', error, { createdAtISO, acceptedAt });
      return "Unable to calculate";
    }
  };
  const handleApprove = async (requestId: string) => {
    const acceptedAt = new Date().toISOString();
    // Convert to IST format
    const istDate = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const adminReviewedAt = istDate.toISOString().replace('T', ' ').substring(0, 19);

    // Get username from localStorage
    const adminUsername = localStorage.getItem('username') || 'admin';

    // Send data to backend and wait for response
    try {
      const response = await fetch('https://ninjasndanalytics.app.n8n.cloud/webhook/b49d2d8b-0dec-442e-b9c1-40b5fd9801de', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          RequestId: requestId.replace('REQ-', ''),
          AdminUsername: adminUsername,
          AdminReviewedAt: adminReviewedAt,
          AdminStatus: 'ACCEPTED'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Check if response indicates failure
      if (responseData.success === false) {
        toast({
          title: "Error",
          description: responseData.message || "Failed to approve request",
          variant: "destructive"
        });
        return; // Don't update UI, keep buttons visible
      }

      // Success - update UI
      setActedRequests(prev => new Set([...prev, requestId]));
      setRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          const tat = calculateTAT(req.createdAtISO, acceptedAt);
          return {
            ...req,
            status: "accepted" as const,
            acceptedAt,
            tat
          };
        }
        return req;
      }));
      
      toast({
        title: "Request Accepted",
        description: `Request ${requestId} has been accepted successfully.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to send approval data to backend:', error);
      toast({
        title: "Network Error",
        description: `Failed to connect to backend. Please try again.`,
        variant: "destructive"
      });
    }
  };
  const handleReject = async (requestId: string, adminRemarks: string) => {
    const rejectedAt = new Date().toISOString();
    // Convert to IST format
    const istDate = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const adminReviewedAt = istDate.toISOString().replace('T', ' ').substring(0, 19);

    // Get username from localStorage
    const adminUsername = localStorage.getItem('username') || 'admin';

    // Send data to backend and wait for response
    try {
      const response = await fetch('https://ninjasndanalytics.app.n8n.cloud/webhook/b49d2d8b-0dec-442e-b9c1-40b5fd9801de', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          RequestId: requestId.replace('REQ-', ''),
          AdminUsername: adminUsername,
          AdminReviewedAt: adminReviewedAt,
          AdminStatus: 'REJECTED',
          adminRemarks: adminRemarks
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Check if response indicates failure
      if (responseData.success === false) {
        toast({
          title: "Error",
          description: responseData.message || "Failed to reject request",
          variant: "destructive"
        });
        return; // Don't update UI, keep buttons visible
      }

      // Success - update UI
      setActedRequests(prev => new Set([...prev, requestId]));
      setRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          const tat = calculateTAT(req.createdAtISO, rejectedAt);
          return {
            ...req,
            status: "rejected" as const,
            acceptedAt: rejectedAt,
            tat
          };
        }
        return req;
      }));
      
      toast({
        title: "Request Rejected",
        description: `Request ${requestId} has been rejected.`,
        variant: "destructive"
      });
      
    } catch (error) {
      console.error('Failed to send rejection data to backend:', error);
      toast({
        title: "Network Error",
        description: `Failed to connect to backend. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleModify = (request: Request) => {
    setSelectedRequest(request);
    setModifyDialogOpen(true);
  };

  const openRejectDialog = (requestId: string) => {
    setRejectingRequestId(requestId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const confirmRejectWithReason = async () => {
    if (!rejectingRequestId) return;
    const id = rejectingRequestId;
    setRejectDialogOpen(false);
    await handleReject(id, rejectReason);
    setRejectingRequestId(null);
    setRejectReason("");
  };

  const handleModifyConfirm = async (discountType: string, discountValue: number) => {
    if (!selectedRequest) return;

    const modifiedAt = new Date().toISOString();
    // Convert to IST format
    const istDate = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const adminReviewedAt = istDate.toISOString().replace('T', ' ').substring(0, 19);

    // Get username from localStorage
    const adminUsername = localStorage.getItem('username') || 'admin';

    try {
      const response = await fetch('https://ninjasndanalytics.app.n8n.cloud/webhook/b49d2d8b-0dec-442e-b9c1-40b5fd9801de', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          RequestId: selectedRequest.id.replace('REQ-', ''),
          AdminUsername: adminUsername,
          AdminReviewedAt: adminReviewedAt,
          AdminStatus: 'MODIFIED',
          adminDiscountType: discountType,
          adminDiscountValue: discountType === 'Custom' ? discountValue : null
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Check if response indicates failure
      if (responseData.success === false) {
        toast({
          title: "Error",
          description: responseData.message || "Failed to modify request",
          variant: "destructive"
        });
        return;
      }

      // Success - update UI
      setActedRequests(prev => new Set([...prev, selectedRequest.id]));
      setModifiedRequests(prev => new Map([...prev, [selectedRequest.id, { discountType, discountValue }]]));
      
      setRequests(prev => prev.map(req => {
        if (req.id === selectedRequest.id) {
          const tat = calculateTAT(req.createdAtISO, modifiedAt);
          return {
            ...req,
            status: "accepted" as const,
            acceptedAt: modifiedAt,
            tat,
            discountType,
            discountValue,
            adminStatus: 'MODIFIED'
          };
        }
        return req;
      }));
      
      // Close the dialog on success
      setModifyDialogOpen(false);
      setSelectedRequest(null);
      
      toast({
        title: "Request Modified",
        description: `Request ${selectedRequest.id} has been modified successfully.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to send modification data to backend:', error);
      toast({
        title: "Network Error",
        description: `Failed to connect to backend. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setSelectedRequest(null);
    }
  };
  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let filtered = requests.filter(req => {
      const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        req.requester.toLowerCase().includes(searchTerm.toLowerCase()) || 
        req.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    if (sortByCustomerId) {
      // Sort by customer ID ascending
      filtered.sort((a, b) => String(a.customerId || '').localeCompare(String(b.customerId || '')));
    } else {
      // Default: pending actions first, then by latest request ID
      filtered.sort((a, b) => {
        // Primary sort: Unprocessed admin requests first (adminStatus === null)
        if (a.adminStatus === null && b.adminStatus !== null) return -1;
        if (a.adminStatus !== null && b.adminStatus === null) return 1;
        
        // Secondary sort: By request ID (latest first) - extract numeric part for proper sorting
        const aIdNum = parseInt((a.id || '').replace('REQ-', '')) || 0;
        const bIdNum = parseInt((b.id || '').replace('REQ-', '')) || 0;
        return bIdNum - aIdNum;
      });
    }

    return filtered.slice(0, limit);
  }, [requests, searchTerm, statusFilter, sortByCustomerId, limit]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning text-warning-foreground";
      case "approved":
        return "bg-success text-success-foreground";
      case "accepted":
        return "bg-success text-success-foreground";
      case "rejected":
        return "bg-destructive text-destructive-foreground";
      case "escalated":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Approval Requests</CardTitle>
          
          {showActions && <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search requests..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-64" />
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
              
              <Select
                value={sortByCustomerId ? "customerId" : "default"}
                onValueChange={(value) => setSortByCustomerId(value === "customerId")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="customerId">Customer ID</SelectItem>
                </SelectContent>
              </Select>
            </div>}
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
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => (
              <div key={request.id} className="border border-border rounded-lg py-2 px-3 transition-colors hover:bg-accent/50">
                {/* Header with checkbox, ID and eligible badge */}
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded border border-border flex-shrink-0 mt-0.5" />
                    <span className="text-xl font-bold text-foreground">{request.id.replace('REQ-', '')}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    {request.eligible === 1 ? (
                      <Badge className="bg-green-500 text-white px-2 py-0.5 text-xs font-medium rounded-full">
                        Eligible
                      </Badge>
                    ) : (
                      <>
                        <Badge className="bg-red-500 text-white px-2 py-0.5 text-xs font-medium rounded-full">
                          Not Eligible
                        </Badge>
                        <span className="text-gray-500 text-xs text-right max-w-[160px] leading-tight">
                          {request.eligibilityReason}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* ABM Status - Clean and prominent display */}
                {(request.abmStatus === "ACCEPTED" || request.abmStatus === "MODIFIED" || request.abmStatus === "ESCALATED") && (
                  <div className="mb-2 p-2 rounded-lg border-l-3 border-l-primary bg-primary/5">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium text-gray-600">ABM Decision</div>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${request.abmStatus === "ACCEPTED" ? "bg-green-500 text-white" : request.abmStatus === "ESCALATED" ? "bg-orange-500 text-white" : "bg-yellow-500 text-white"}`}>
                        {request.abmStatus}
                      </div>
                      {request.abmRemarks && request.abmRemarks.trim() !== "" && request.abmRemarks !== "null" && (
                        <div className="text-xs text-gray-600 ml-1">
                          <span className="font-medium">Remarks:</span> {request.abmRemarks}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Section */}
                <div className="mb-2">
                  <div className="text-gray-500 text-xs font-medium mb-0.5">Customer</div>
                  <div className="flex items-center gap-3">
                    {request.shopImage && (
                       <img 
                         src={request.shopImage} 
                         alt="Shop" 
                         className="w-12 h-12 rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                         }}
                         onClick={() => setSelectedImage(request.shopImage)}
                       />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground font-semibold text-base">
                        {request.requester} ({request.customerId})
                      </div>
                      <div className="text-gray-500 text-sm">
                        {request.contactNumber} • {request.customerTypeName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign and Order Grid */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <div className="text-gray-500 text-xs font-medium mb-0.5">Campaign</div>
                    <div className="text-foreground text-sm font-medium">{request.campaignType.toLowerCase().replace('_', ' ')}</div>
                    {request.campaignType.toLowerCase() === 'sku promotion' && request.skuName && (
                      <div className="text-gray-500 text-xs mt-0.5">
                        SKU: {request.skuName} {request.skuId && `(ID: ${request.skuId})`}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs font-medium mb-0.5">Order</div>
                    <div className="text-foreground text-sm font-medium">{request.orderQty} kg</div>
                    <div className="text-gray-500 text-xs">
                      {request.orderMode === 1 ? 'Delivery' : request.orderMode === 2 ? 'Pickup' : 'Delivery'}
                    </div>
                  </div>
                </div>

                {/* Discount Section */}
                <div className="mb-2">
                  <div className="text-gray-500 text-xs font-medium mb-0.5">Discount</div>
                  <div className="text-foreground text-sm font-medium">
                    {(() => {
                      // Check if this request has been modified
                      const modifiedData = modifiedRequests.get(request.id);
                      if (modifiedData) {
                        let calculatedDiscountValue = modifiedData.discountValue;
                        
                        // Calculate discount value based on type
                        if (modifiedData.discountType === "Re 1 per kg") {
                          calculatedDiscountValue = request.orderQty;
                        } else if (modifiedData.discountType === "Rs 0.75 per kg") {
                          calculatedDiscountValue = request.orderQty * 0.75;
                        }
                        
                        return `₹${calculatedDiscountValue} (${modifiedData.discountType})`;
                      }
                      
                      // Use original display logic for non-modified requests
                      return request.discountValue > 0 
                        ? `₹${request.discountValue} (${request.discountType === 'Per kg' ? '1 per kg' : request.discountType})` 
                        : 'No discount specified';
                    })()}
                  </div>
                </div>

                {/* Requested By and Date Grid */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <div className="text-gray-500 text-xs font-medium mb-0.5">Requested By</div>
                    <div className="text-foreground text-sm font-medium">{request.department.replace('Requested by: ', '')}</div>
                    <div className="text-gray-500 text-xs">{request.requestedByContact}</div>
                    
                    {/* Escalated By Section - Show for escalated, accepted, rejected, and modified requests */}
                    {(request.status === "escalated" || request.status === "accepted" || request.status === "rejected" || request.abmStatus === "MODIFIED") && (
                      <div className="mt-1.5">
                        <div className="text-gray-500 text-xs font-medium mb-0.5">Escalated By</div>
                        <div className="text-foreground text-sm font-medium">{request.abmUserName} (ID: {request.abmId})</div>
                        <div className="text-gray-500 text-xs">{request.abmContactNumber}</div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs font-medium mb-0.5">Requested At</div>
                    <div className="text-foreground text-sm font-medium">{request.requestedDate}</div>
                    <div className="text-gray-500 text-xs">{request.requestedTime}</div>
                    
                    {/* Escalated At Section - Show for escalated, accepted, rejected, and modified requests */}
                    {(request.status === "escalated" || request.status === "accepted" || request.status === "rejected" || request.abmStatus === "MODIFIED") && (
                      <div className="mt-1.5">
                        <div className="text-gray-500 text-xs font-medium mb-0.5">Escalated At</div>
                        <div className="text-foreground text-sm font-medium">{request.escalatedAt}</div>
                        <div className="text-gray-500 text-xs">{request.escalatedAtTime}</div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Action Buttons - Show for all requests that haven't been acted upon by admin */}
                {showActions && !actedRequests.has(request.id) && !request.adminStatus && (
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Button variant="default" onClick={() => handleApprove(request.id)} className="flex py-3 text-base font-medium">
                      Accept
                    </Button>
                    <Button variant="destructive" onClick={() => openRejectDialog(request.id)} className="flex py-3 text-base font-medium">
                      Reject
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleModify(request)} 
                      className="flex items-center gap-2 py-3 text-base font-medium"
                    >
                      <Edit className="h-4 w-4" />
                      Modify
                    </Button>
                  </div>
                )}

                {/* Status badge for approved/rejected/accepted requests */}
                {(request.status === "accepted" || request.status === "rejected") && (request.acceptedAt || request.adminReviewedAt) && (
                  <div className="pt-4 border-t border-border">
                    <div className="text-foreground font-semibold">
                      {request.adminStatus === 'MODIFIED' ? 'MODIFIED' : request.status.toUpperCase()} {(() => {
                        // Use admin reviewed timestamp if available, otherwise use acceptedAt
                        const timestampToShow = request.adminReviewedAt || request.acceptedAt;
                        if (!timestampToShow) return 'Invalid Date';
                        
                        // Parse IST timestamp directly and format as dd-mm-yyyy hh:mm:ss AM/PM
                        const parseAndFormatIST = (dateString: string) => {
                          const [datePart, timePart] = dateString.replace('.000+0000', '').split('T');
                          const [year, month, day] = datePart.split('-');
                          const [hour, minute, second] = timePart.split(':');
                          
                          const hourNum = parseInt(hour);
                          const ampm = hourNum >= 12 ? 'PM' : 'AM';
                          const displayHour = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);
                          
                          return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year} ${displayHour}:${minute.padStart(2, '0')}:${second.padStart(2, '0')} ${ampm}`;
                        };
                        
                        return parseAndFormatIST(timestampToShow);
                      })()}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      TAT: {calculateTAT(request.createdAtISO, request.adminReviewedAt || request.acceptedAt || '')}
                    </div>
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

      {/* Image Overlay */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Shop Image"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Modify Request Dialog */}
      {selectedRequest && (
        <ModifyRequestDialog
          isOpen={modifyDialogOpen}
          onClose={() => {
            setModifyDialogOpen(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleModifyConfirm}
          requestId={selectedRequest.id}
          currentDiscountType={selectedRequest.discountType}
          currentDiscountValue={selectedRequest.discountValue}
          orderQty={selectedRequest.orderQty}
        />
      )}

      {/* Reject Reason Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter rejection reason</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Type the reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRejectDialogOpen(false); setRejectingRequestId(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRejectWithReason}>Confirm Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}