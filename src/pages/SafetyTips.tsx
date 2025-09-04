import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Shield, Moon, AlertTriangle, Users, Phone, MapIcon, ChevronRight } from "lucide-react";

export default function SafetyTips() {
  const safetyCategories = [
    {
      id: 1,
      title: "Night Safety",
      description: "Essential tips for staying safe after dark on campus",
      icon: Moon,
      tipCount: 8,
      priority: "high"
    },
    {
      id: 2,
      title: "Emergency Preparedness",
      description: "How to prepare for and respond to campus emergencies",
      icon: AlertTriangle,
      tipCount: 12,
      priority: "high"
    },
    {
      id: 3,
      title: "Reporting an Incident",
      description: "Step-by-step guide to reporting safety concerns",
      icon: Phone,
      tipCount: 6,
      priority: "medium"
    },
    {
      id: 4,
      title: "Walking Safety",
      description: "Safe routes and practices for getting around campus",
      icon: MapIcon,
      tipCount: 10,
      priority: "medium"
    },
    {
      id: 5,
      title: "Group Safety",
      description: "Safety in numbers and group activity guidelines",
      icon: Users,
      tipCount: 7,
      priority: "medium"
    },
    {
      id: 6,
      title: "Personal Security",
      description: "Protecting your belongings and personal information",
      icon: Shield,
      tipCount: 9,
      priority: "low"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-accent/10 text-accent border-accent/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="px-mobile-padding py-4">
          <h1 className="text-xl font-semibold text-foreground text-center">Safety Tips</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Stay informed and stay safe
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-mobile-padding pt-6 pb-24">
        <div className="space-y-4">
          {safetyCategories.map((category) => {
            const IconComponent = category.icon;
            
            return (
              <Card 
                key={category.id} 
                className="shadow-soft border-border hover:shadow-primary transition-all cursor-pointer group"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <IconComponent className="text-primary" size={24} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {category.title}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={getPriorityColor(category.priority)}
                          >
                            {category.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                          {category.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {category.tipCount} tips
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight 
                      size={20} 
                      className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" 
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Resources */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Resources</h2>
          
          <div className="grid grid-cols-1 gap-3">
            <Card className="shadow-soft border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campus Security:</span>
                    <span className="font-medium">(202) 806-1100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Emergency:</span>
                    <span className="font-medium">911</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}