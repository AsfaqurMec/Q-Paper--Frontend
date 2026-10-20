import { Bell, CheckCheck, CreditCard, FileCheck2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const iconMap = {
  subscription_expiry: CreditCard,
  paper_generated: FileCheck2,
  new_feature: Sparkles
};

export default async function NotificationsPage() {
  const notifications = await api.notifications();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-primary">Notifications</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">Workspace alerts</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Subscription, payment, limit, export, and feature notices from `/api/notifications`.</p>
        </div>
        <Button variant="secondary">
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((item) => {
            const Icon = iconMap[item.type as keyof typeof iconMap] ?? Bell;
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-md border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.type.replaceAll("_", " ")}</p>
                </div>
                {!item.read && <Bell className="h-4 w-4 text-primary" />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
