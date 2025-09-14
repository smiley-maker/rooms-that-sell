import { BillingDashboard } from "../../components/BillingDashboard";

export default function BillingPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, credits, and billing information
        </p>
      </div>
      
      <BillingDashboard />
    </div>
  );
}