import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const Unauthorized = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleBackToLogin = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <ShieldAlert className="h-10 w-10 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
                    <p className="text-muted-foreground">
                        You do not have the required permissions to access the Admin Panel.
                        This area is restricted to administrators only.
                    </p>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </Button>
                    <Button
                        variant="default"
                        className="w-full gradient-primary border-0"
                        onClick={handleBackToLogin}
                    >
                        Sign in as Administrator
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
