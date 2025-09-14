"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CreditTransaction } from "@/types/convex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Import shared plan configuration
const PLAN_FEATURES = {
  trial: {
    name: "Free Trial",
    credits: 10,
    price: 0,
    features: ["10 staging credits", "Basic support", "Standard quality"],
  },
  agent: {
    name: "Agent Plan",
    credits: 100,
    price: 29,
    features: ["100 monthly credits", "Priority support", "High quality", "Batch processing"],
  },
  pro: {
    name: "Pro Plan", 
    credits: 300,
    price: 79,
    features: ["300 monthly credits", "Premium support", "Highest quality", "Advanced features", "Custom styles"],
  },
  business: {
    name: "Business Plan",
    credits: 1000,
    price: 199,
    features: ["1000 monthly credits", "Dedicated support", "Enterprise features", "API access", "White-label options"],
  },
};

export function BillingDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  
  const user = useQuery(api.users.getCurrentUser);
  const subscription = useQuery(api.stripe.getUserSubscription, 
    user ? { userId: user._id } : "skip"
  );
  const creditHistory = useQuery(api.users.getCreditHistory,
    user ? { userId: user._id } : "skip"
  );
  
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);
  const createPortalSession = useAction(api.stripe.createPortalSession);
  const cancelSubscription = useAction(api.stripe.cancelSubscription);

  const handleUpgrade = async (plan: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await createCheckoutSession({
        userId: user._id,
        plan,
        successUrl: `${window.location.origin}/projects?success=true`,
        cancelUrl: `${window.location.origin}/projects?canceled=true`,
      });
      
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error("Failed to create checkout session");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await createPortalSession({
        userId: user._id,
        returnUrl: window.location.href,
      });
      
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error(error);
      
      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("Customer must have billing history")) {
        toast.error("No billing history found", {
          description: "You need to have made at least one payment to access the billing portal. Try upgrading your plan first.",
          action: {
            label: "Upgrade Plan",
            onClick: () => handleUpgrade("agent"),
          },
        });
      } else if (errorMessage.includes("Customer") && errorMessage.includes("not found")) {
        toast.error("Billing account not found", {
          description: "Your billing account could not be found. Please try upgrading your plan to set up billing.",
          action: {
            label: "Upgrade Plan",
            onClick: () => handleUpgrade("agent"),
          },
        });
      } else {
        toast.error("Failed to open billing portal", {
          description: "Please try again or contact support if the issue persists.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;
    
    if (!confirm("Are you sure you want to cancel your subscription? You'll continue to have access until the end of your billing period.")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await cancelSubscription({ userId: user._id });
      toast.success("Subscription canceled successfully");
    } catch (error) {
      toast.error("Failed to cancel subscription");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const currentPlan = PLAN_FEATURES[user.plan as keyof typeof PLAN_FEATURES];
  const isTrialUser = user.plan === "trial";
  const hasActiveSubscription = subscription && subscription.status === "active";

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{currentPlan.name}</h3>
              <p className="text-sm text-muted-foreground">
                {isTrialUser ? "Free trial" : `$${currentPlan.price}/month`}
              </p>
            </div>
            <Badge variant={isTrialUser ? "secondary" : "default"}>
              {user.plan.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{user.credits}</p>
              <p className="text-sm text-muted-foreground">Credits remaining</p>
            </div>
            {user.credits <= 5 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Low balance</span>
              </div>
            )}
          </div>

          {subscription && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Status:</span>
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                  {subscription.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Next billing:</span>
                <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Subscription will cancel at period end</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {hasActiveSubscription ? (
              <>
                <Button onClick={handleManageBilling} disabled={isLoading}>
                  Manage Billing
                </Button>
                {!subscription?.cancelAtPeriodEnd && (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    disabled={isLoading}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={() => handleUpgrade("agent")} disabled={isLoading}>
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      {isTrialUser && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Choose a plan that fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(PLAN_FEATURES).map(([planKey, plan]) => {
                if (planKey === "trial") return null;
                
                return (
                  <Card key={planKey} className="relative">
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="text-2xl font-bold">
                        ${plan.price}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        onClick={() => handleUpgrade(planKey)}
                        disabled={isLoading}
                      >
                        Choose {plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Usage History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Credit Usage History
          </CardTitle>
          <CardDescription>
            Track your recent credit transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {creditHistory && creditHistory.length > 0 ? (
            <div className="space-y-2">
              {creditHistory.slice(0, 10).map((transaction: CreditTransaction) => (
                <div key={transaction._id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${
                    transaction.amount > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No credit transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}