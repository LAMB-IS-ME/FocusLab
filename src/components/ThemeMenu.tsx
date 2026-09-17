import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Laptop, Moon, Sun } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { IconButton } from './ui'

const themes = [
  { id: 'light', label: 'Giao diện sáng', icon: Sun },
  { id: 'dark', label: 'Giao diện tối', icon: Moon },
  { id: 'system', label: 'Theo hệ thống', icon: Laptop },
] as const

export function ThemeMenu() {
  const { data, setData, toast } = useApp()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLDivElement>(null)
  const close = () => {
    setOpen(false)
    trigger.current?.querySelector('button')?.focus()
  }
  useEffect(() => {
    if (!open) return
    container.current
      ?.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="true"]')
      ?.focus()
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  const Icon =
    data.settings.theme === 'system' ? Laptop : data.settings.theme === 'dark' ? Moon : Sun
  return (
    <div className="theme-menu-container" ref={container}>
      <div ref={trigger}>
        <IconButton
          label="Chọn giao diện"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? 'theme-menu' : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon size={18} />
        </IconButton>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            id="theme-menu"
            role="menu"
            aria-label="Giao diện"
            className="theme-menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            onKeyDown={(event) => {
              const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
              const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
              if (event.key === 'Escape') {
                event.preventDefault()
                close()
              }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                buttons[
                  (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
                ]?.focus()
              }
              if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault()
                buttons[event.key === 'Home' ? 0 : buttons.length - 1]?.focus()
              }
              if (event.key === 'Tab') setOpen(false)
            }}
          >
            {themes.map((theme) => (
              <button
                key={theme.id}
                role="menuitemradio"
                aria-checked={data.settings.theme === theme.id}
                onClick={() => {
                  setData((current) => ({
                    ...current,
                    settings: { ...current.settings, theme: theme.id },
                  }))
                  toast(`Đã chọn ${theme.label.toLowerCase()}`)
                  close()
                }}
              >
                <theme.icon size={16} />
                <span>{theme.label}</span>
                {data.settings.theme === theme.id && <Check size={14} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
