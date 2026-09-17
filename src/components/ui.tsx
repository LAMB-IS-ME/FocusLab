import { useEffect, useId, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Inbox, X } from 'lucide-react'
import { useApp } from '../hooks/useApp'

let openDialogs = 0
let previousOverflow = ''

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" className="icon-button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const dialog = ref.current
    if (openDialogs++ === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    dialog?.showModal()
    // React xử lý autoFocus trước showModal, nên đặt lại tiêu điểm sau khi hộp thoại mở.
    dialog
      ?.querySelector<HTMLElement>('[data-autofocus], input:not([type="hidden"]), textarea, select')
      ?.focus()
    return () => {
      dialog?.close()
      if (--openDialogs === 0) document.body.style.overflow = previousOverflow
    }
  }, [])
  return (
    <motion.dialog
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
      className={`dialog ${wide ? 'wide' : ''}`}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="dialog-content"
      >
        <div className="dialog-header">
          <h2 id={id}>{title}</h2>
          <IconButton label="Đóng" onClick={onClose}>
            <X size={19} />
          </IconButton>
        </div>
        {children}
      </motion.div>
    </motion.dialog>
  )
}
export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onClose,
  label = 'Xóa',
}: {
  title: string
  message: string
  onConfirm: () => void
  onClose: () => void
  label?: string
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted leading-relaxed">{message}</p>
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose} autoFocus data-autofocus>
          Hủy
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {label}
        </Button>
      </div>
    </Modal>
  )
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={25} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
export function Progress({ value, color }: { value: number; color?: string }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label="Tiến độ"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.65 }}
        style={{ background: color }}
      />
    </div>
  )
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  )
}
function ToastItem({ id, text }: { id: string; text: string }) {
  const { dismissToast } = useApp()
  useEffect(() => {
    const timer = setTimeout(() => dismissToast(id), 5000)
    return () => clearTimeout(timer)
  }, [id, dismissToast])
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="toast"
    >
      <span className="toast-check">
        <Check size={16} />
      </span>
      <span>{text}</span>
      <IconButton label="Ẩn thông báo" onClick={() => dismissToast(id)}>
        <X size={15} />
      </IconButton>
    </motion.div>
  )
}
export function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="toast-region" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
