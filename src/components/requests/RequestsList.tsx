import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Check, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Request {
  id: string;
  title: string;
  requester: string;
  department: string;
  status: "pending" | "approved" | "rejected";
  priority: "low" | "medium" | "high";
  createdAt: string;
  description: string;
}

interface RequestsListProps {
  showActions?: boolean;
  limit?: number;
}

const mockRequests: Request[] = [
  {
    id: "REQ-001",
    title: "Budget Increase Request",
    requester: "John Smith",
    department: "Marketing",
    status: "pending",
    priority: "high",
    createdAt: "2024-01-10",
    description: "Request for additional budget allocation for Q1 marketing campaigns"
  },
  {
    id: "REQ-002",
    title: "New Software License",
    requester: "Sarah Johnson",
    department: "IT",
    status: "pending",
    priority: "medium",
    createdAt: "2024-01-09",
    description: "License request for development tools"
  },
  {
    id: "REQ-003",
    title: "Travel Authorization",
    requester: "Mike Davis",
    department: "Sales",
    status: "approved",
    priority: "low",
    createdAt: "2024-01-08",
    description: "Business travel request for client meetings"
  },
  {
    id: "REQ-004",
    title: "Equipment Purchase",
    requester: "Emma Wilson",
    department: "Operations",
    status: "rejected",
    priority: "medium",
    createdAt: "2024-01-07",
    description: "Request for new office equipment"
  },
  {
    id: "REQ-005",
    title: "Training Program Approval",
    requester: "David Brown",
    department: "HR",
    status: "pending",
    priority: "high",
    createdAt: "2024-01-06",
    description: "Approval for employee training program"
  }
];

export function RequestsList({ showActions = true, limit }: RequestsListProps) {
  const [requests, setRequests] = useState(mockRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const { toast } = useToast();

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
      </CardContent>
    </Card>
  );
}