import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    // Base: tokens Garrigues para focus y transición
    "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--g-brand-3308)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                // Primario: --g-brand-3308, hover --g-sec-700
                default: "bg-[var(--g-brand-3308)] text-[var(--g-text-inverse)] shadow hover:bg-[var(--g-sec-700)]",
                // Destructivo
                destructive: "bg-[var(--g-error)] text-[var(--g-text-inverse)] shadow-sm hover:bg-[var(--g-error)]/90",
                // Outline: borde sutil
                outline: "border border-[var(--g-border-default)] bg-[var(--g-surface-card)] shadow-sm hover:bg-[var(--g-sec-100)] hover:text-[var(--g-brand-3308)]",
                // Secundario
                secondary: "bg-[var(--g-sec-100)] text-[var(--g-text-primary)] shadow-sm hover:bg-[var(--g-sec-300)]",
                // Ghost
                ghost: "hover:bg-[var(--g-surface-subtle)] hover:text-[var(--g-text-primary)]",
                // Link
                link: "text-[var(--g-link)] underline-offset-4 hover:underline hover:text-[var(--g-link-hover)]",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-[var(--radius-md)] px-3 text-xs",
                lg: "h-11 rounded-[var(--radius-md)] px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
