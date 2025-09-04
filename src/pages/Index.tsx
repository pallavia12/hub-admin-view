import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { RequestsList } from "@/components/requests/RequestsList";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "requests":
        return <RequestsList />;
      case "users":
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Users</h2>
            <p className="text-muted-foreground">User management functionality coming soon.</p>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Settings</h2>
            <p className="text-muted-foreground">System settings and configuration options.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
