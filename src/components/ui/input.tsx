"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Interface étendant les attributs HTML natifs pour les inputs.
 * Cette interface peut être étendue dans le futur avec des propriétés spécifiques à l'application.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 
   * Exemple: propriété pour identifier les champs obligatoires visuellement
   * @example <Input isRequired />
   */
  isRequired?: boolean;
  
  /**
   * Exemple: propriété pour ajouter une validation personnalisée
   * @example <Input validationState="error" />
   */
  validationState?: "valid" | "error" | "warning";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isRequired, validationState, ...props }, ref) => {
    // Utilisation de isRequired pour ajouter une classe ou un attribut aria
    const ariaRequired = isRequired ? { "aria-required": true } : {};
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          validationState === "error" && "border-destructive",
          isRequired && "required-field", // Classe CSS pour champs obligatoires
          className
        )}
        ref={ref}
        {...ariaRequired}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input } 