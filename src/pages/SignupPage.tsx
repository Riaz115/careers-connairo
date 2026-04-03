import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import { signupApplicant } from "@/lib/careerApi";
import authBg from "@/assets/auth-bg.jpg";

export default function SignupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateProfile, setPendingEmail } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    if (!agreed) e.terms = "You must agree to the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAvatar(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signupApplicant({
        name: form.fullName,
        email: form.email,
        phone_no: form.phone,
        password: form.password,
        profile_picture: avatarFile ?? undefined,
      });
      setPendingEmail(form.email);
      localStorage.setItem('pendingEmail', form.email); // Persist for page refresh
      localStorage.setItem('pendingPassword', form.password); // Store password for auto-login after verify
      toast({ title: "Verification code sent!", description: "Please check your email." });
      navigate("/verify-email", { replace: true });
    } catch (error: unknown) {
      const message = error && typeof error === "object" && "message" in error ? (error as { message?: string }).message : undefined;
      toast({ title: "Signup failed", description: message || "Unable to register" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <img
        src={authBg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-[hsl(252,60%,18%)/0.75] backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl p-8 sm:p-10 animate-fade-up max-h-[95vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">SIGN UP</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Join Connairo and unlock new opportunities
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar upload */}
          <div className="flex justify-center mb-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center overflow-hidden"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground -mt-2">
            Profile picture (optional)
          </p>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-name"
                placeholder="John Doe"
                className="pl-10"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </div>
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-phone"
                type="tel"
                placeholder="+92 300 1234567"
                className="pl-10"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-confirm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-muted-foreground select-none leading-tight">
              I agree to the{" "}
              <span className="text-primary hover:underline cursor-pointer">
                Terms & Conditions
              </span>
            </span>
          </label>
          {errors.terms && <p className="text-xs text-destructive -mt-2">{errors.terms}</p>}

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold active:scale-[0.97] transition-transform"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
