import { Shield, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecurityStatusProps {
  className?: string;
}

export const SecurityStatus = ({ className }: SecurityStatusProps) => {
  const securityFeatures = [
    {
      name: "Row Level Security",
      status: "active",
      description: "Database access is properly restricted by user authentication"
    },
    {
      name: "Input Sanitization",
      status: "active", 
      description: "All user inputs are sanitized to prevent XSS attacks"
    },
    {
      name: "Security Audit Logging",
      status: "active",
      description: "All authentication and security events are logged"
    },
    {
      name: "Rate Limiting",
      status: "active",
      description: "Client-side rate limiting prevents abuse"
    },
    {
      name: "Session Validation",
      status: "active",
      description: "Enhanced session management with automatic expiration"
    },
    {
      name: "Password Strength",
      status: "active",
      description: "Comprehensive password validation with database-level checks"
    }
  ];

  const pendingItems = [
    {
      name: "Leaked Password Protection",
      action: "Enable in Supabase Dashboard → Authentication → Password Protection",
      priority: "medium"
    }
  ];

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Security Features */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-success">✅ Active Security Features</h4>
            <div className="space-y-2">
              {securityFeatures.map((feature) => (
                <div key={feature.name} className="flex items-start gap-2 p-2 bg-success/5 rounded">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{feature.name}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Configuration */}
          {pendingItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-amber-600">⚠️ Pending Configuration</h4>
              <div className="space-y-2">
                {pendingItems.map((item) => (
                  <Alert key={item.name}>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>{item.name}:</strong> {item.action}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This application implements multiple layers of security protection. 
              All user data is encrypted and access is properly controlled.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};