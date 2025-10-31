import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { authAPI } from "../services/api";

export default function VerifyOtp() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email") || "";
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  // Auto-send disabled to prevent multiple emails; use the Resend button instead.
  // useEffect(() => {
  //   if (email) {
  //     handleSend();
  //   }
  // }, [email]);

  const handleSend = async () => {
    if (!email) return;
    setSending(true);
    setStatus("");
    try {
      const res = await authAPI.sendOtp(email);
      if (res.success) setStatus("OTP sent to your email");
      else setStatus(res.message || "Failed to send OTP");
    } catch (e) {
      setStatus(e?.response?.data?.message || e.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!email || value.length !== 6) return;
    setStatus("");
    try {
      const res = await authAPI.verifyOtp(email, value);
      if (res.success) {
        // store tokens and user
        localStorage.setItem("formula_token", res.token);
        localStorage.setItem("formula_refresh_token", res.refreshToken);
        localStorage.setItem("formula_user", JSON.stringify(res.user));
        // Hard reload so AuthProvider initializes tokens before ProtectedRoute
        window.location.href = "/dashboard";
      } else {
        setStatus(res.message || "Invalid/Expired OTP");
      }
    } catch (e) {
      setStatus(e?.response?.data?.message || e.message || "Invalid/Expired OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Verify your email</h1>
        <p className="text-sm text-gray-600 mb-4">We sent a 6-digit code to: <b>{email || "(no email)"}</b></p>
        <div className="space-y-2 mb-4">
          <InputOTP maxLength={6} value={value} onChange={setValue}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {status && <div className="text-sm text-gray-700 mb-3">{status}</div>}
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerify}
            disabled={value.length !== 6}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Verify
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-3 py-2 text-gray-700 border rounded-lg"
          >
            {sending ? "Sending..." : "Resend"}
          </button>
        </div>
      </div>
    </div>
  );
}
