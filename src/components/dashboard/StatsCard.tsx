import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: LucideIcon;
}

export function StatsCard({ title, value, change, changeType, icon: Icon }: StatsCardProps) {
  const changeColor = {
    increase: "text-success",
    decrease: "text-destructive",
    neutral: "text-muted-foreground"
  }[changeType];

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className={`text-xs ${changeColor}`}>{change}</p>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
            <Icon className="h-6 w-6 text-accent-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}