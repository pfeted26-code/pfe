import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Home } from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const goToDashboard = () => {
    const role = user?.role;
    switch (role) {
      case "admin":
        navigate("/admin/", { replace: true });
        break;
      case "enseignant":
        navigate("/teacher/", { replace: true });
        break;
      case "etudiant":
        navigate("/student/", { replace: true });
        break;
      default:
        navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
      {/* Animated background - matching your login page style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-red-600/30 via-orange-600/30 to-yellow-600/30 rounded-full blur-3xl animate-pulse opacity-40"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tr from-orange-600/30 via-red-600/30 to-pink-600/30 rounded-full blur-3xl animate-pulse opacity-40"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      <Card className="w-full max-w-md border border-slate-800/50 backdrop-blur-xl bg-slate-900/60 shadow-2xl shadow-red-900/20 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-orange-600/10 pointer-events-none"></div>

        <CardHeader className="text-center space-y-4 pb-6 relative">
          <div className="flex justify-center mb-2">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500 border border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                <ShieldAlert className="h-10 w-10 text-white relative z-10 drop-shadow-lg" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
              Access Denied
            </CardTitle>
            <CardDescription className="text-slate-400 text-base">
              You don't have permission to access this page
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative">
          <div className="text-center space-y-2">
            <p className="text-slate-300 text-base">
              This area is restricted to authorized users only.
            </p>
            <p className="text-slate-400 text-sm">
              {user?.role && (
                <>Your current role: <span className="font-semibold text-slate-300 capitalize">{user.role}</span></>
              )}
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <Button
              onClick={goToDashboard}
              className="relative w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 
                text-white shadow-xl shadow-purple-900/30 hover:shadow-2xl hover:shadow-purple-900/50
                transition-all duration-300 border-0 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <div className="flex items-center justify-center relative z-10">
                <Home className="mr-2 h-5 w-5" />
                <span>Go to My Dashboard</span>
              </div>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900/60 backdrop-blur-sm px-3 text-slate-500 font-semibold tracking-wider">
                EduNex Portal
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500">
            If you believe this is an error, please contact your administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
