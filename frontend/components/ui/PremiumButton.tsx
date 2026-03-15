"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glowEffect?: boolean;
  shimmerEffect?: boolean;
  pulseEffect?: boolean;
  href?: string;
  children: React.ReactNode;
}

export default function PremiumButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  glowEffect = false,
  shimmerEffect = false,
  pulseEffect = false,
  href,
  children,
  className = '',
  disabled,
  ...props
}: PremiumButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    if (isHovered && buttonRef.current) {
      const currentButton = buttonRef.current;
      currentButton.addEventListener('mousemove', handleMouseMove);
      return () => {
        currentButton.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isHovered]);

  const baseClasses = `
    relative inline-flex items-center justify-center
    font-semibold transition-all duration-300 ease-out
    focus:outline-none focus:ring-0
    disabled:cursor-not-allowed disabled:opacity-50
    overflow-hidden group
  `;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-2xl'
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-500 to-blue-600
      text-white shadow-lg shadow-blue-500/25
      hover:shadow-xl hover:shadow-blue-500/40
      hover:scale-[1.02] active:scale-[0.98]
      before:absolute before:inset-0 before:rounded-inherit
      before:bg-gradient-to-r before:from-blue-400 before:to-blue-600
      before:opacity-0 hover:before:opacity-100 before:transition-opacity
    `,
    secondary: `
      bg-gray-100 text-gray-900 border border-gray-300
      hover:bg-gray-200 hover:border-gray-400
      hover:scale-[1.02] active:scale-[0.98]
      shadow-lg shadow-gray-900/10
    `,
    outline: `
      bg-transparent text-blue-600 border border-blue-500
      hover:bg-blue-500 hover:text-white
      hover:shadow-lg hover:shadow-blue-500/25
      hover:scale-[1.02] active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-gray-600
      hover:bg-gray-100 hover:text-gray-900
      hover:scale-[1.02] active:scale-[0.98]
    `,
    gradient: `
      bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600
      text-white shadow-lg shadow-blue-500/25
      hover:shadow-xl hover:shadow-blue-500/40
      hover:scale-[1.02] active:scale-[0.98]
      before:absolute before:inset-0 before:rounded-inherit
      before:bg-gradient-to-r before:from-blue-600 before:via-blue-400 before:to-blue-500
      before:opacity-0 hover:before:opacity-100 before:transition-opacity
    `
  };

  const glowClasses = glowEffect ? 'shadow-glow hover:shadow-glow-lg' : '';
  const pulseClasses = pulseEffect ? 'animate-pulse-slow' : '';

  const buttonContent = (
    <>
      {/* Shimmer Effect */}
      {shimmerEffect && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}
      
      {/* Ripple Effect */}
      {isPressed && (
        <motion.div
          className="absolute pointer-events-none"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)'
          }}
        />
      )}
      
      {/* Loading State */}
      {loading ? (
        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
      ) : (
        <>
          {/* Icon */}
          {icon && iconPosition === 'left' && (
            <span className="mr-2 transition-transform group-hover:scale-110">
              {icon}
            </span>
          )}
          
          {/* Button Text */}
          <span className="relative z-10">{children}</span>
          
          {/* Icon */}
          {icon && iconPosition === 'right' && (
            <span className="ml-2 transition-transform group-hover:scale-110">
              {icon}
            </span>
          )}
          
          {/* Sparkles for premium feel */}
          {!loading && (variant === 'primary' || variant === 'gradient') && (
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity animate-float" />
          )}
        </>
      )}
    </>
  );

  const buttonElement = (
    <motion.button
      ref={buttonRef}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${glowClasses} ${pulseClasses} ${className}`}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...(props as any)}
    >
      <AnimatePresence mode="wait">
        {buttonContent}
      </AnimatePresence>
    </motion.button>
  );

  // If href is provided, render as Link
  if (href) {
    const Link = require('next/link').default;
    return (
      <Link href={href} className="inline-block">
        {buttonElement}
      </Link>
    );
  }

  return buttonElement;
}
