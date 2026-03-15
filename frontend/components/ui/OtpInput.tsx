"use client";

import { useState, useRef, useEffect } from "react";

interface OtpInputProps {
  onComplete: (code: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function OtpInput({ onComplete, disabled = false, loading = false }: OtpInputProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Auto-advance to next input
  const handleInputChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-advance to next input
    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 50);
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    const newOtp = digits.split('').concat(Array(6 - digits.length).fill(''));
    setOtp(newOtp);
    
    // Focus last filled input
    const lastFilledIndex = newOtp.findIndex((digit: string) => digit !== '');
    if (lastFilledIndex !== -1) {
      setTimeout(() => {
        inputRefs.current[lastFilledIndex]?.focus();
      }, 50);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index]) {
      e.preventDefault();
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      
      // Focus previous input
      if (index > 0) {
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 50);
      }
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    const fullCode = otp.join('');
    if (fullCode.length === 6 && !loading) {
      onComplete(fullCode);
    }
  }, [otp, loading, onComplete]);

  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
      {otp.map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={otp[index]}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          disabled={disabled || loading}
          placeholder="•"
          style={{
            width: "48px",
            height: "56px",
            textAlign: "center",
            fontSize: "24px",
            fontWeight: "700",
            borderRadius: "10px",
            border: otp[index] ? "1px solid var(--border-strong)" : "1px solid var(--border)",
            background: loading ? "var(--bg-elevated)" : "var(--bg-elevated)",
            color: loading ? "var(--text-3)" : (otp[index] ? "var(--text-1)" : "var(--text-2)"),
            outline: "none",
            transition: "all 0.15s",
            cursor: disabled || loading ? "not-allowed" : "pointer"
          }}
        />
      ))}
    </div>
  );
}

// ResendButton component
interface ResendButtonProps {
  onResend: () => void;
}

export function ResendButton({ onResend }: ResendButtonProps) {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResend = () => {
    setCountdown(60);
    setCanResend(false);
    onResend();
  };

  return (
    <button
      onClick={handleResend}
      disabled={!canResend}
      style={{
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: "600",
        borderRadius: "8px",
        border: "none",
        cursor: canResend ? "pointer" : "not-allowed",
        transition: "all 0.15s",
        color: canResend ? "var(--accent)" : "var(--text-3)"
      }}
    >
      {canResend ? "Resend code" : `Resend in ${countdown}s`}
    </button>
  );
}

// GoogleButton component
interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function GoogleButton({ onClick, loading = false }: GoogleButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid var(--border-strong)",
        background: "var(--bg-elevated)",
        color: "var(--text-1)",
        fontSize: "14px",
        fontWeight: "600",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.15s"
      }}
    >
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ 
            width: "16px", 
            height: "16px", 
            border: "2px solid var(--border)", 
            borderTop: "2px solid var(--accent)", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite" 
          }} />
          <span>Redirecting...</span>
        </div>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: "8px" }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06-.56 4.21-1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </>
      )}
    </button>
  );
}

// Shared divider component
export function AuthDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      <span style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "500" }}>
        or continue with email
      </span>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );
}
