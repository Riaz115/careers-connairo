import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import { resendOtpApplicant, verifyEmailApplicant, loginApplicant } from "@/lib/careerApi";
import authBg from "@/assets/auth-bg.jpg";

const RESEND_DELAY = 30;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pendingEmail, setPendingEmail, verifyEmail, login } = useApp();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (pendingEmail) return;
    const email = localStorage.getItem('pendingEmail');
    if (email) {
      setPendingEmail(email);
    } else {
      navigate("/signup", { replace: true });
    }
  }, [pendingEmail, setPendingEmail, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleResend = useCallback(async () => {
    if (!canResend || !pendingEmail) return;

    setCanResend(false);
    setResendTimer(RESEND_DELAY);
    setError("");

    try {
      await resendOtpApplicant({ email: pendingEmail });
      toast({ title: "Code resent", description: `A new code has been sent to ${pendingEmail}` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to resend OTP";
      toast({ title: "Resend OTP failed", description: message });
    }
  }, [canResend, pendingEmail, toast]);

  async function handleSubmit() {
    if (!pendingEmail) return;
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await verifyEmailApplicant({ email: pendingEmail, otp: code });
      verifyEmail();
      localStorage.removeItem('pendingEmail'); // Clean up

      // Auto-login after verification
      const password = localStorage.getItem('pendingPassword');
      if (password) {
        try {
          const response = await loginApplicant({ email: pendingEmail, password });
          login(response.data);
          localStorage.removeItem('pendingPassword');
          toast({ title: "Email verified and logged in!", description: "Welcome!" });
        } catch (err) {
          toast({ title: "Email verified!", description: "Auto-login failed, please login manually." });
        }
      } else {
        toast({ title: "Email verified!", description: "Please login to continue." });
      }
      navigate("/profile", { replace: true });
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? (err as { message?: string }).message : undefined;
      setError(message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!pendingEmail) return null;

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

      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl p-8 sm:p-10 animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Verify your email Address.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit code sent to this email
          </p>
          <p className="mt-1 text-sm font-medium text-primary">{pendingEmail}</p>
        </div>

        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-12 h-14 text-lg font-semibold" />
              <InputOTPSlot index={1} className="w-12 h-14 text-lg font-semibold" />
              <InputOTPSlot index={2} className="w-12 h-14 text-lg font-semibold" />
              <InputOTPSlot index={3} className="w-12 h-14 text-lg font-semibold" />
              <InputOTPSlot index={4} className="w-12 h-14 text-lg font-semibold" />
              <InputOTPSlot index={5} className="w-12 h-14 text-lg font-semibold" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => navigate("/signup", { replace: true })}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 font-semibold active:scale-[0.97] transition-transform"
            onClick={handleSubmit}
            disabled={loading || code.length !== 6}
          >
            {loading ? "Verifying…" : "Submit"}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-primary font-medium hover:underline"
            >
              Resend Code?
            </button>
          ) : (
            <>Resend code in {resendTimer}s</>
          )}
        </p>

        <p className="mt-2 text-center text-xs text-muted-foreground/60">
          Demo code: 123456
        </p>
      </div>
    </div>
  );
}
