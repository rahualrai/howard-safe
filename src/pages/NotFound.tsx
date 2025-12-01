import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-mint-50 p-4">
      <div className="text-center max-w-md w-full bg-white p-8 rounded-[32px] shadow-soft border-none">
        <div className="bg-mint-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-12 w-12 text-mint-600" />
        </div>
        <h1 className="text-5xl font-bold mb-2 text-ui-charcoal font-friendly">404</h1>
        <p className="text-xl text-gray-500 mb-8 font-medium">Oops! Page not found</p>
        <Link to="/">
          <Button className="w-full h-14 rounded-full bg-mint-500 hover:bg-mint-600 text-white text-lg font-bold shadow-lg shadow-mint-200 transition-all">
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
