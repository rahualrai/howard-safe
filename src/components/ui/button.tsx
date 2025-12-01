import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary hover:shadow-hover hover:-translate-y-0.5",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20 hover:-translate-y-0.5",
                outline:
                    "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft hover:-translate-y-0.5",
                ghost: "text-foreground hover:bg-accent/50 hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                gradient: "bg-gradient-primary text-white hover:opacity-90 shadow-primary hover:shadow-hover hover:-translate-y-0.5 border-0",
                pastel: "bg-white text-foreground border-2 border-transparent hover:border-primary/20 shadow-soft hover:shadow-primary hover:-translate-y-0.5",
            },
            size: {
                default: "h-12 px-6 py-2",
                sm: "h-10 px-4 text-xs",
                lg: "h-14 px-8 text-base",
                icon: "h-12 w-12",
                touch: "min-h-[48px] px-6", // Mobile-optimized
                "icon-touch": "h-12 w-12", // Mobile icon buttons
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
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
