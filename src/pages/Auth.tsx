import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SaathyLogo } from "@/components/SaathyLogo";
import { useAuth } from "@/contexts/AuthContext";
import { signIn, signInWithGoogle, signUp } from "@/lib/supabaseAuth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Chrome } from "lucide-react";

type Tab = "signin" | "signup";

export default function Auth() {
  const { session, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const result = await signIn(email, password);
    
    if (result.success) {
      refreshSession();
      navigate("/", { replace: true });
    } else {
      setError(result.error || "Sign in failed");
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const result = await signUp(name, email, password);
    
    if (result.success) {
      refreshSession();
      navigate("/", { replace: true });
    } else {
      setError(result.error || "Sign up failed");
    }
    setIsLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    setIsLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error || "Google sign in failed");
      setIsLoading(false);
    }
  };

  if (session) return <Navigate to="/" replace />;

  const inputClass = cn(
    "w-full px-4 py-2.5 rounded-lg border text-sm",
    "bg-[hsl(var(--input))] text-foreground",
    "border-[hsl(var(--border))]",
    "focus:outline-none focus:border-[hsl(var(--primary))]",
    "placeholder:text-muted-foreground"
  );

  const buttonClass = cn(
    "w-full px-4 py-2.5 rounded-lg text-sm font-medium",
    "bg-[hsl(var(--primary))] text-primary-foreground",
    "hover:opacity-90 transition-opacity",
    "disabled:opacity-50 disabled:cursor-not-allowed"
  );

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[hsl(var(--bg-primary))] p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <SaathyLogo size="lg" showText={true} />
        </div>

        {/* Greeting */}
        <div className="text-center mb-6">
          <h1 className="font-serif text-[26px] text-foreground mb-1">
            नमस्ते, delegate.
          </h1>
          <p className="text-sm text-muted-foreground">
            Your research companion for MUN & debate.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[hsl(var(--muted))] rounded-lg mb-6">
          <button
            onClick={() => { setActiveTab("signin"); setError(""); }}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
              activeTab === "signin"
                ? "bg-[hsl(var(--card))] text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab("signup"); setError(""); }}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
              activeTab === "signup"
                ? "bg-[hsl(var(--card))] text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Create Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[13px] text-red-500 mb-4 text-center">{error}</p>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg text-sm font-medium mb-4",
            "bg-[hsl(var(--card))] text-foreground border border-[hsl(var(--border))]",
            "hover:bg-[hsl(var(--bg-tertiary))] transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "inline-flex items-center justify-center gap-2"
          )}
          disabled={isLoading}
        >
          <Chrome className="w-4 h-4" />
          Continue with Google
        </button>

        {/* Sign In Form */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <button type="submit" className={buttonClass} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="What's your name?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <button type="submit" className={buttonClass} disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
