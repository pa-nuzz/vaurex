"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-dismiss
    const dismissDuration = duration || (type === "error" ? 5000 : 3000);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, dismissDuration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toast = {
    success: (message: string, duration?: number) => addToast("success", message, duration),
    error: (message: string, duration?: number) => addToast("error", message, duration),
    info: (message: string, duration?: number) => addToast("info", message, duration),
    warning: (message: string, duration?: number) => addToast("warning", message, duration),
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success": return <CheckCircle size={16} />;
      case "error": return <AlertCircle size={16} />;
      case "warning": return <AlertTriangle size={16} />;
      case "info": return <Info size={16} />;
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case "success": return {
        bg: "rgba(16, 185, 129, 0.1)",
        border: "rgba(16, 185, 129, 0.3)",
        text: "#10b981",
        iconBg: "rgba(16, 185, 129, 0.2)"
      };
      case "error": return {
        bg: "rgba(239, 68, 68, 0.1)",
        border: "rgba(239, 68, 68, 0.3)",
        text: "#ef4444",
        iconBg: "rgba(239, 68, 68, 0.2)"
      };
      case "warning": return {
        bg: "rgba(245, 158, 11, 0.1)",
        border: "rgba(245, 158, 11, 0.3)",
        text: "#f59e0b",
        iconBg: "rgba(245, 158, 11, 0.2)"
      };
      case "info": return {
        bg: "rgba(59, 130, 246, 0.1)",
        border: "rgba(59, 130, 246, 0.3)",
        text: "#3b82f6",
        iconBg: "rgba(59, 130, 246, 0.2)"
      };
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => {
            const colors = getColors(toast.type);
            return (
              <motion.div
                key={toast.id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-md"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                  minWidth: "300px",
                  maxWidth: "400px"
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full p-1"
                  style={{ backgroundColor: colors.iconBg }}
                >
                  {getIcon(toast.type)}
                </div>
                <p className="flex-1 text-sm font-medium">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded hover:bg-black/10 transition-colors"
                  style={{ color: colors.text }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
