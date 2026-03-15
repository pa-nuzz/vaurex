"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'neon' | 'gradient' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

export default function PremiumCard({
  variant = 'default',
  size = 'md',
  hover = true,
  glow = false,
  interactive = false,
  children,
  className = '',
  ...props
}: PremiumCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  const baseClasses = `
    relative overflow-hidden rounded-2xl transition-all duration-300
    ${hover ? 'cursor-pointer' : ''}
  `;

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const variantClasses = {
    default: `
      bg-white border border-gray-200 shadow-lg
      ${hover ? 'hover:bg-gray-50 hover:border-gray-300' : ''}
      ${glow ? 'shadow-glow' : 'shadow-lg'}
      ${hover ? 'hover:shadow-xl' : ''}
    `,
    glass: `
      bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg
      ${hover ? 'hover:bg-white/90 hover:border-gray-300' : ''}
      ${glow ? 'shadow-glow' : 'shadow-lg'}
      ${hover ? 'hover:shadow-xl' : ''}
    `,
    neon: `
      bg-white border border-blue-200 shadow-lg
      ${hover ? 'hover:border-blue-400' : ''}
      ${glow ? 'shadow-glow' : 'shadow-lg'}
      ${hover ? 'hover:shadow-xl' : ''}
      before:absolute before:inset-0 before:rounded-2xl
      before:bg-gradient-to-r before:from-blue-100/50 before:to-blue-200/50
      before:opacity-0 hover:before:opacity-100 before:transition-opacity
    `,
    gradient: `
      bg-gradient-to-br from-white via-gray-50 to-white
      border border-gray-200 shadow-lg
      ${hover ? 'hover:border-gray-300' : ''}
      ${glow ? 'shadow-glow' : 'shadow-lg'}
      ${hover ? 'hover:shadow-xl' : ''}
      before:absolute before:inset-0 before:rounded-2xl
      before:bg-gradient-to-br before:from-blue-50/30 before:to-blue-100/30
      before:opacity-50
    `,
    minimal: `
      bg-transparent border-none
      ${hover ? 'hover:bg-gray-50/50' : ''}
      ${glow ? '' : ''}
    `
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...(props as any)}
    >
      {/* Interactive gradient overlay */}
      {interactive && isHovered && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle 150px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 107, 53, 0.3), transparent 40%)`,
          }}
        />
      )}
      
      {/* Shimmer effect */}
      {hover && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Decorative elements for premium variants */}
      {variant === 'neon' && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        </>
      )}
    </motion.div>
  );
}
