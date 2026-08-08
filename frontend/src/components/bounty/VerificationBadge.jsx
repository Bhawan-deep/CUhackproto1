import React from 'react';
import { CheckCircle2, AlertCircle, FileText, XCircle } from 'lucide-react';

export default function VerificationBadge({ status, size = 'normal' }) {
  const normalizedStatus = (status || 'NEEDS_REVIEW').toUpperCase();

  const styles = {
    VERIFIED: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: CheckCircle2,
      label: 'VERIFIED'
    },
    NEEDS_REVIEW: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: AlertCircle,
      label: 'NEEDS REVIEW'
    },
    DRAFT: {
      bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      icon: FileText,
      label: 'DRAFT'
    },
    REJECTED: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      icon: XCircle,
      label: 'REJECTED'
    }
  };

  const config = styles[normalizedStatus] || styles.NEEDS_REVIEW;
  const IconComponent = config.icon;

  const sizeClasses = size === 'small' 
    ? 'px-2 py-0.5 text-[10px] gap-1' 
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span className={`inline-flex items-center font-mono font-bold tracking-wider rounded border ${config.bg} ${sizeClasses}`}>
      <IconComponent className={size === 'small' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}
