import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useApp, ProfileData } from "@/context/AppContext";
import { loginApplicant } from "@/lib/careerApi";
import authBg from "@/assets/auth-bg.jpg";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isProfileComplete } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await loginApplicant({ email, password });
      console.log("Login response:", response);
      console.log("Token from response:", response.data.token);
      login(response.data);
      localStorage.setItem('userData', JSON.stringify(response.data)); // Save full user data
      toast({ title: "Logged in successfully", description: "Welcome back!" });
      navigate("/profile", { replace: true });
    } catch (error: unknown) {
      const message = error && typeof error === "object" && "message" in error ? (error as { message?: string }).message : undefined;
      toast({ title: "Login failed", description: message || "Invalid credentials" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <img
        src={authBg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-[hsl(252,60%,18%)/0.75] backdrop-blur-[2px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl p-8 sm:p-10 animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">LOGIN</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Welcome back! Let's get you signed in
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              <span className="text-sm text-muted-foreground select-none">Remember me</span>
            </label>
            <button type="button" className="text-sm text-primary hover:underline">
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold active:scale-[0.97] transition-transform"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
