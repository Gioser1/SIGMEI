import React from 'react';
import './Badge.css';

/**
 * Universal Badge Component for SIGMEI
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'} props.variant
 * @param {boolean} props.showDot
 * @param {string} props.className
 */
const Badge = ({ children, variant = 'default', showDot = false, className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {showDot && <span className="badge-dot"></span>}
      {children}
    </span>
  );
};

export default Badge;
