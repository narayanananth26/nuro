import React, { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  spinnerColor?: string;
  className?: string;
  children: React.ReactNode;
}

export default function LoadingButton({
  loading = false,
  variant = 'primary',
  size = 'md',
  spinnerColor,
  className = '',
  children,
  disabled,
  ...rest
}: LoadingButtonProps) {
  // Define variant styles
  const variantStyles = {
    primary: 'bg-[#E3CF20] text-[#121212] hover:bg-[#d4c01c]',
    secondary: 'bg-[#2D2D2D] text-white hover:bg-[#3D3D3D]',
    outline: 'bg-transparent border border-[#E3CF20] text-[#E3CF20] hover:bg-[#2D2D2D]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  // Define size styles
  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  // Define spinner size and color based on variant
  const spinnerSize = size === 'lg' ? 'md' : 'sm';
  const defaultSpinnerColor = variant === 'primary' ? '#121212' : '#E3CF20';
  const spinnerColorFinal = spinnerColor || defaultSpinnerColor;

  return (
    <button
      className={`
        ${variantStyles[variant]} 
        ${sizeStyles[size]} 
        font-medium rounded-md transition-colors
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={loading || disabled}
      {...rest}
    >
      {loading && <Spinner size={spinnerSize} color={spinnerColorFinal} />}
      {children}
    </button>
  );
} 