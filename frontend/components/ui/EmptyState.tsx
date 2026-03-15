"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  type: "no-documents" | "no-results" | "no-collections" | "error" | "no-history";
  title: string;
  description: string;
  action?: ReactNode;
}

const illustrations = {
  "no-documents": (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="60" height="80" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="30" y1="45" x2="70" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="30" y1="55" x2="60" y2="55" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="30" y1="65" x2="65" y2="65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="85" cy="85" r="20" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="75" y1="85" x2="95" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="85" y1="75" x2="85" y2="95" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  "no-results": (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 30L50 50L30 70L10 50L30 30Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M70 30L90 50L70 70L50 50L70 30Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M50 50L70 70L50 90L30 70L50 50Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M90 50L110 70L90 90L70 70L90 50Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  "no-collections": (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="40" width="25" height="60" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="30" y="25" width="25" height="75" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="45" y="35" width="25" height="65" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="60" y="20" width="25" height="80" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="75" y="45" width="25" height="55" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  "error": (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 15L75 40L105 40L82.5 57.5L90 87.5L60 70L30 87.5L37.5 57.5L15 40L45 40L60 15Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="50" y1="50" x2="70" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <line x1="70" y1="50" x2="50" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  "no-history": (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="60" y1="30" x2="60" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="60" y1="60" x2="80" y2="75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="25" y="15" width="30" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="65" y="85" width="30" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
};

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8">
      <div 
        className="mb-6 opacity-50"
        style={{ color: "var(--text-3)" }}
      >
        {illustrations[type]}
      </div>
      <h3 
        className="text-xl font-semibold mb-2"
        style={{ color: "var(--text-1)" }}
      >
        {title}
      </h3>
      <p 
        className="text-sm max-w-md mb-6"
        style={{ color: "var(--text-2)" }}
      >
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
