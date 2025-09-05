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
    <div className="min-h-screen bg-background p-2 sm:p-4 lg:p-8">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Approval Requests</h2>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Manage and review all approval requests
          </p>
        </div>
        <RequestsList />
      </div>
    </div>
  );
};

export default Dashboard;