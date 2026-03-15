"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, LogOut, Save, User, Shield, AlertTriangle,
  Key, Mail, Eye, EyeOff, Camera, CheckCircle, Bell, Trash2, Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

function sanitizeSettingsError(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) return fallback;
  const m = error.message.toLowerCase();
  if (m.includes("session") || m.includes("auth") || m.includes("jwt")) {
    return "Session issue detected. Please sign in again.";
  }
  if (m.includes("too many") || m.includes("rate limit")) {
    return "Too many attempts. Please wait and try again.";
  }
  if (m.includes("payload too large") || m.includes("size")) {
    return "The selected file is too large.";
  }
  return fallback;
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "danger">("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        setEmail(user?.email ?? "");
        setFullName(String(user?.user_metadata?.full_name ?? ""));
        setAvatarUrl(String(user?.user_metadata?.avatar_url ?? ""));
        const planCandidates = [
          user?.user_metadata?.plan,
          user?.user_metadata?.subscription_tier,
          user?.app_metadata?.plan,
          user?.app_metadata?.subscription_tier,
        ];
        setPlan(planCandidates.some((value) => typeof value === "string" && value.toLowerCase().includes("pro")) ? "pro" : "free");
      } catch {
        if (!active) return;
        toast.error("Session issue detected. Please sign in again.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [supabase, toast]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    setUploading(true);
    try {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB."); return; }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) { toast.error("Only JPG, PNG, GIF, or WEBP allowed."); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated."); return; }

      const fileName = `${user.id}-${Date.now()}.${ext}`;

      // Try uploading to storage bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        // If bucket doesn't exist or RLS blocks, fall back to base64 in metadata
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: dataUrl } });
          if (updateError) throw updateError;
          setAvatarUrl(dataUrl);
          toast.success("Profile picture updated!");
          setUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(publicUrl);
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (updateError) throw updateError;
      toast.success("Profile picture updated!");
    } catch (err: unknown) {
      toast.error(sanitizeSettingsError(err, "Error uploading profile picture."));
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim().slice(0, 200) } });
      if (error) throw error;
      toast.success("Profile updated successfully.");
    } catch (err: unknown) {
      toast.error(sanitizeSettingsError(err, "Unable to update your profile."));
    } finally { setSaving(false); }
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully.");
      setNewPassword(""); setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(sanitizeSettingsError(err, "Unable to update password."));
    } finally { setSaving(false); }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.assign("/"); };

  if (loading) return <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} />;

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "danger" as const, label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "24px 24px 80px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/workbench" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)", marginBottom: 28, fontSize: 14, textDecoration: "none" }}>
          <ArrowLeft size={15} /> Back to Workbench
        </Link>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 6 }}>Account Settings</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Manage your profile, security, and account preferences.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border-primary)", marginBottom: 28 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", fontSize: 14, fontWeight: 600,
              background: "none", border: "none", cursor: "pointer",
              borderBottom: `2px solid ${activeTab === t.id ? (t.id === "danger" ? "#EF4444" : "var(--accent-primary)") : "transparent"}`,
              color: activeTab === t.id ? (t.id === "danger" ? "#EF4444" : "var(--text-primary)") : "var(--text-muted)",
              transition: "all 0.2s", marginBottom: -1,
            }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Avatar */}
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>Profile Picture</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ position: "relative" }}>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={80}
                      height={80}
                      unoptimized
                      style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid var(--accent-border)" }}
                    />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-tertiary)", border: "2px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={32} color="var(--text-muted)" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%",
                      background: "var(--accent-primary)", border: "2px solid var(--bg-primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", opacity: uploading ? 0.6 : 1, transition: "opacity 0.2s",
                    }}
                  >
                    {uploading ? <div style={{ width: 12, height: 12, border: "2px solid white", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Camera size={12} color="white" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>Upload a profile picture</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>JPG, PNG, GIF or WEBP. Max 2 MB.</p>
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Plan</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Your current workspace tier and upgrade path.</p>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "8px 12px", background: plan === "pro" ? "rgba(245,158,11,0.12)" : "rgba(255,90,31,0.12)", border: `1px solid ${plan === "pro" ? "rgba(245,158,11,0.25)" : "rgba(255,90,31,0.25)"}`, color: plan === "pro" ? "#F59E0B" : "var(--accent-primary)", fontSize: 12, fontWeight: 700 }}>
                  {plan === "pro" ? <Crown size={14} /> : <Shield size={14} />} {plan === "pro" ? "Pro" : "Free"}
                </div>
              </div>
              <Link href="/pricing" className="btn-ghost" style={{ marginTop: 16, display: "inline-flex", padding: "10px 18px", borderRadius: 10, border: "1px solid var(--border-primary)" }}>
                Compare plans
              </Link>
            </div>

            {/* Info fields */}
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>Personal Information</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    <Mail size={13} style={{ display: "inline", marginRight: 6 }} />Email address
                  </label>
                  <input value={email} disabled style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-primary)", borderRadius: 10, padding: "10px 14px", color: "var(--text-muted)", fontSize: 14, opacity: 0.7 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    <User size={13} style={{ display: "inline", marginRight: 6 }} />Full name
                  </label>
                  <input
                    value={fullName} onChange={e => setFullName(e.target.value)} maxLength={200}
                    placeholder="Enter your full name"
                    style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-primary)", borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                    onFocus={e => (e.target.style.borderColor = "var(--accent-primary)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border-primary)")}
                  />
                </div>
                <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ alignSelf: "flex-start", padding: "10px 24px", fontSize: 13, borderRadius: 10 }}>
                  <Save size={14} /> {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Security Tab ── */}
        {activeTab === "security" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Change Password</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Use a strong password with at least 8 characters.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    <Key size={13} style={{ display: "inline", marginRight: 6 }} />New password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-primary)", borderRadius: 10, padding: "10px 44px 10px 14px", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
                    />
                    <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    <Key size={13} style={{ display: "inline", marginRight: 6 }} />Confirm new password
                  </label>
                  <input
                    type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    style={{ width: "100%", background: "var(--bg-primary)", border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? "rgba(239,68,68,0.5)" : "var(--border-primary)"}`, borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>Passwords do not match</p>
                  )}
                </div>
                <button onClick={updatePassword} disabled={saving || !newPassword || !confirmPassword} className="btn-primary" style={{ alignSelf: "flex-start", padding: "10px 24px", fontSize: 13, borderRadius: 10, opacity: (!newPassword || !confirmPassword) ? 0.5 : 1 }}>
                  <Shield size={14} /> {saving ? "Updating..." : "Update password"}
                </button>
              </div>
            </div>

            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Session</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Your session is managed securely by Supabase. Tokens are rotated automatically.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10 }}>
                <CheckCircle size={14} color="#10B981" />
                <span style={{ fontSize: 13, color: "#10B981" }}>Active session · encrypted</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Danger Zone Tab ── */}
        {activeTab === "danger" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <AlertTriangle size={18} color="#EF4444" />
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>Actions in this section are permanent and cannot be undone.</p>
            </div>

            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Sign out</h4>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>End your current session.</p>
              </div>
              <button onClick={handleSignOut} className="btn-ghost" style={{ padding: "8px 18px", fontSize: 13, gap: 6 }}>
                <LogOut size={14} /> Sign out
              </button>
            </div>

            <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#EF4444", marginBottom: 4 }}>Delete account</h4>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Permanently delete your account and all data. Irreversible.</p>
              </div>
              <button onClick={() => toast.error("Contact support@vaurex.com to delete your account.")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", fontSize: 13, background: "#EF4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                <Trash2 size={14} /> Delete account
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
