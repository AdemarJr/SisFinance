import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "success" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", fullWidth = false, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const baseStyles = `
      inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg
      font-medium transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      active:scale-95
    `;
    
    const variantStyles = {
      default: "bg-primary text-primary-foreground shadow hover:bg-primary-hover",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      success: "bg-success text-success-foreground shadow-sm hover:bg-success/90",
      link: "text-primary underline-offset-4 hover:underline",
    };
    
    const sizeStyles = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10",
    };
    
    const widthStyle = fullWidth ? "w-full" : "";
    
    return (
      <Comp
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`.trim()}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };