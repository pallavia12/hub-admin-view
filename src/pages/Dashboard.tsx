import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RequestsList } from "@/components/requests/RequestsList";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Approval Requests</h2>
          <p className="text-muted-foreground mt-2">
            Manage and review all approval requests
          </p>
        </div>
        <RequestsList />
      </div>
    </div>
  );
};

export default Dashboard;