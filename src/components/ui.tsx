import { useState, useRef, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, ArrowRight, Sparkles } from 'lucide-react';

// ─── LazyImage ────────────────────────────────────────────────────────────────
// Intersection-observer lazy loading with shimmer skeleton + fade-in

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}

export function LazyImage({ src, alt, className = '', fallback }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin: '160px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <span ref={ref} className="relative block w-full h-full">
      {!loaded && !error && (
        <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-brand-surface-2 via-white to-brand-surface-2 bg-[length:200%_100%]" />
      )}
      {inView && !error && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`${className} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {error && (fallback ?? <span className="absolute inset-0 flex items-center justify-center bg-brand-surface text-brand-muted text-xs">Image</span>)}
    </span>
  );
}

// ─── Ripple ───────────────────────────────────────────────────────────────────

export function useRipple() {
  const triggerRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute; border-radius:50%; pointer-events:none;
      width:${size}px; height:${size}px; left:${x}px; top:${y}px;
      background:rgba(255,255,255,0.35);
      animation: ripple 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
    `;
    const prev = el.style.position;
    if (!prev || prev === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }, []);

  return triggerRipple;
}

// ─── PageWrapper ──────────────────────────────────────────────────────────────

export function PageWrapper({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`page-enter ${className}`}>
      {children}
    </div>
  );
}

// ─── StaggerItem ──────────────────────────────────────────────────────────────

export function StaggerItem({ children, index = 0, className = '' }: { children: ReactNode; index?: number; className?: string }) {
  return (
    <div
      className={`animate-fade-in-up h-full ${className}`}
      style={{ animationDelay: `${Math.min(index * 55, 420)}ms` }}
    >
      {children}
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="eyebrow mb-2">
            <span className="w-5 h-px bg-brand-accent" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h2 className="section-title flex items-center gap-2.5">
          {icon}
          {title}
        </h2>
        {description && <p className="text-sm text-brand-muted mt-2 max-w-xl">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-brand-border
                     text-[13px] font-bold text-brand-ink hover:border-brand-primary hover:text-brand-primary
                     hover:shadow-soft transition-all duration-200 active:scale-95"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-16 sm:py-20 animate-fade-in-scale ${className}`}>
      <div className="relative w-20 h-20 mx-auto mb-5">
        <div className="absolute inset-0 rounded-3xl bg-brand-primary/[0.06] rotate-6" />
        <div className="absolute inset-0 rounded-3xl bg-white border border-brand-border grid place-items-center">
          {icon ?? <Sparkles className="w-8 h-8 text-brand-primary/60" />}
        </div>
      </div>
      <p className="font-display text-lg font-bold text-brand-ink">{title}</p>
      {description && <p className="text-sm text-brand-muted mt-1.5 max-w-sm mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-6">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── AnimatedCounter ─────────────────────────────────────────────────────────

export function AnimatedCounter({ value, className = '' }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (value === display) return;
    setDisplay(value);
    setKey((k) => k + 1);
  }, [value]);

  return (
    <span key={key} className={`inline-block animate-count-up ${className}`}>
      {display}
    </span>
  );
}

// ─── Toast system ─────────────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  leaving?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastItem['type']) => void;
}

const ToastCtx = createContext<ToastContextValue>({ toast: () => {} });

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => x.id === id ? { ...x, leaving: true } : x));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 300);
    }, 2800);
  }, []);

  const icons = { success: <CheckCircle2 className="w-4 h-4" />, error: <AlertCircle className="w-4 h-4" />, info: <Info className="w-4 h-4" /> };
  const colors = { success: 'bg-brand-success', error: 'bg-brand-danger', info: 'bg-brand-primary' };

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none px-4">
        {toasts.map((t) => (
          <div key={t.id}
            className={`${colors[t.type]} inline-flex items-center gap-3 pl-2.5 pr-5 py-2.5 rounded-2xl shadow-[0_20px_45px_-15px_rgba(12,23,38,0.55)] text-white text-sm font-semibold select-none max-w-[92vw] ${t.leaving ? 'animate-toast-out' : ''}`}
            style={!t.leaving ? { animation: 'toastIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both' } : {}}>
            <span className="w-8 h-8 rounded-xl bg-white/20 grid place-items-center flex-shrink-0">
              {icons[t.type]}
            </span>
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="group product-card">
      <div className="aspect-square w-full skeleton rounded-none" />
      <div className="p-3.5 space-y-2">
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-3 w-2/5" />
        <div className="skeleton h-9 w-full mt-3" />
      </div>
    </div>
  );
}

// ─── SuccessCheck ─────────────────────────────────────────────────────────────

export function SuccessCheck({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 52" className={`animate-success-pop ${className}`} fill="none">
      <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" className="opacity-20" />
      <polyline points="14,27 22,35 38,18" stroke="currentColor" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 50, strokeDashoffset: 0, animation: 'checkDraw 0.4s 0.15s ease both' }} />
    </svg>
  );
}
