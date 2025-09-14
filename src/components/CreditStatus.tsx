"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AlertCircle, CreditCard, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreditStatusProps {
  className?: string;
  showUpgradePrompt?: boolean;
}

export function CreditStatus({ className, showUpgradePrompt = true }: CreditStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const user = useQuery(api.users.getCurrentUser);
  const creditStatus = useQuery(api.users.getCreditStatus, 
    user ? { userId: user._id } : "skip"
  );
  
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

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

  if (!creditStatus) {
    return null;
  }

  const { credits, plan, isLowBalance, isZeroBalance, needsUpgrade } = creditStatus;

  return (
    <div className={className}>
      {/* Credit Balance Display */}
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        <span className="text-sm font-medium">{credits} credits</span>
        <Badge variant={plan === "trial" ? "secondary" : "default"} className="text-xs">
          {plan.toUpperCase()}
        </Badge>
      </div>

      {/* Low Balance Warning */}
      {isLowBalance && showUpgradePrompt && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {isZeroBalance 
                ? "You're out of credits! Upgrade to continue staging images."
                : "You're running low on credits. Consider upgrading your plan."
              }
            </span>
            {plan === "trial" && (
              <Button 
                size="sm" 
                onClick={() => handleUpgrade("agent")}
                disabled={isLoading}
                className="ml-2"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Trial Upgrade Prompt */}
      {needsUpgrade && showUpgradePrompt && (
        <Alert className="mt-2">
          <CreditCard className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Ready to unlock unlimited staging? Upgrade to get 100+ monthly credits.
            </span>
            <Button 
              size="sm" 
              onClick={() => handleUpgrade("agent")}
              disabled={isLoading}
              className="ml-2"
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}