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
  return <div className="min-h-screen bg-background p-2 sm:p-4 lg:p-8 px-0 py-0">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div>
          
          
        </div>
        <RequestsList />
      </div>
    </div>;
};
export default Dashboard;