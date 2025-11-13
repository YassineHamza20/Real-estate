'use client'

import * as React from 'react'
import * as VisuallyHiddenPrimitive from '@radix-ui/react-visually-hidden'

/**
 * Hides its children visually while keeping them accessible to screen readers.
 */
export const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof VisuallyHiddenPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root>
>(({ className, ...props }, ref) => (
  <VisuallyHiddenPrimitive.Root
    ref={ref}
    className={className}
    {...props}
  />
))

VisuallyHidden.displayName = VisuallyHiddenPrimitive.Root.displayName