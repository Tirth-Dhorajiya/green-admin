import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { secondaryButtonClass } from './TableTools';

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmationModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  const [confirming, setConfirming] = useState(false);

  if (!open) return null;

  const tones = {
    danger: {
      icon: 'bg-red-100 text-red-700',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
    },
    warning: {
      icon: 'bg-amber-100 text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
    },
    info: {
      icon: 'bg-emerald-100 text-emerald-700',
      button: 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20',
    },
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-stone-900/10 bg-white p-6 shadow-2xl shadow-emerald-950/20">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className={`rounded-lg p-3 ${tones[variant].icon}`}>
            <AlertTriangle size={26} />
          </div>
          <button type="button" className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50" onClick={onClose} disabled={confirming}>
            <X size={20} />
          </button>
        </div>

        <h2 className="mb-3 text-2xl font-black tracking-tight text-stone-900">{title}</h2>
        <p className="mb-6 text-sm font-bold leading-6 text-stone-500">{message}</p>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className={secondaryButtonClass} onClick={onClose} disabled={confirming}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${tones[variant].button}`}
            disabled={confirming}
            onClick={async () => {
              try {
                setConfirming(true);
                await onConfirm();
                onClose();
              } finally {
                setConfirming(false);
              }
            }}
          >
            {confirming ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
