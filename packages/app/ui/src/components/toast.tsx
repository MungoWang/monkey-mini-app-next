
import * as React from 'react'
import { Toast as ToastPrimitive } from '@base-ui/react/toast'

import { cn } from '@mohou/ui/lib/utils'
import { Button } from '@mohou/ui/components/button'
import { XIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from 'lucide-react'

const toast = ToastPrimitive.createToastManager()

/** Where the toast stack sits on the screen. */
type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

const toastViewportPositionClass: Record<ToastPosition, string> = {
  'top-left': 'fixed top-4 left-4 right-auto bottom-auto z-50 w-auto max-w-sm outline-none sm:w-full',
  'top-center': 'fixed top-4 inset-x-4 bottom-auto z-50 mx-auto w-auto max-w-sm outline-none sm:w-full',
  'top-right': 'fixed top-4 right-4 left-auto bottom-auto z-50 w-auto max-w-sm outline-none sm:w-full',
  'bottom-left': 'fixed bottom-4 left-4 right-auto top-auto z-50 w-auto max-w-sm outline-none sm:w-full',
  'bottom-center': 'fixed bottom-4 inset-x-4 top-auto z-50 mx-auto w-auto max-w-sm outline-none sm:w-full',
  'bottom-right': 'fixed bottom-4 right-4 left-auto top-auto z-50 w-auto max-w-sm outline-none sm:w-full',
}

function isTopPosition(position: ToastPosition): boolean {
  return position === 'top-left' || position === 'top-center' || position === 'top-right'
}

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({
  className,
  position = 'bottom-right',
  ...props
}: ToastPrimitive.Viewport.Props & { position?: ToastPosition }) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      data-position={position}
      className={cn('pointer-events-none', toastViewportPositionClass[position], className)}
      {...props}
    />
  )
}

/**
 * Transient notification. Mount `<Toaster />` once at the app root (Host does not mount it).
 * Then call `toast.add({ title, description?, type?, timeout? })` — not `toast()` as a function.
 * @when Confirm/save feedback. Put `<Toaster position="bottom-right" timeout={4000} limit={3} />` in the root, then `toast.add(...)`.
 * @example
 * import { Toaster, toast } from "@mohou/ui"
 * // root: <Toaster position="top-right" timeout={4000} />
 * toast.add({ title: "已保存", description: "2 条更新", type: "success", timeout: 5000 })
 * @family Feedback & status
 */
function Toast({ className, position = 'bottom-right', ...props }: ToastPrimitive.Root.Props & { position?: ToastPosition }) {
  const top = isTopPosition(position)
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      data-position={position}
      className={cn(
        'group/toast pointer-events-auto absolute z-[calc(1000-var(--toast-index))] w-full rounded-2xl border bg-card text-card-foreground shadow-lg will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        top ? 'top-0 right-0 origin-top' : 'right-0 bottom-0 origin-bottom',
        '[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]',
        'h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]',
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        'data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]',
        top
          ? 'data-limited:opacity-0 data-starting-style:[transform:translateY(-150%)] [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(-150%)]'
          : 'data-limited:opacity-0 data-starting-style:[transform:translateY(150%)] [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]',
        'data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
        'data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]',
        'data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]',
        'data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
        'data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
        'data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]',
        'data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]',
        'data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
        className,
      )}
      {...props}
    />
  )
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        'flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100',
        className,
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn('shrink-0', className)}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children ?? (
        <XIcon aria-hidden="true" />
      )}
    </ToastPrimitive.Close>
  )
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null

  if (type === 'success') {
    icon = (
      <CircleCheckIcon aria-hidden="true" />
    )
  }

  if (type === 'info') {
    icon = (
      <InfoIcon aria-hidden="true" />
    )
  }

  if (type === 'warning') {
    icon = (
      <TriangleAlertIcon aria-hidden="true" />
    )
  }

  if (type === 'error') {
    icon = (
      <OctagonXIcon className="text-destructive" aria-hidden="true" />
    )
  }

  if (type === 'loading') {
    icon = (
      <Loader2Icon className="animate-spin" aria-hidden="true" />
    )
  }

  if (!icon) {
    return null
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  )
}

function ToastList({ position = 'bottom-right' }: { position?: ToastPosition }) {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map(toastItem => (
    <Toast key={toastItem.id} toast={toastItem} position={position}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ))
}

function Toaster({
  children,
  toastManager = toast,
  position = 'bottom-right',
  ...props
}: ToastPrimitive.Provider.Props & { position?: ToastPosition }) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport position={position}>
          <ToastList position={position} />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
  type ToastPosition,
}
