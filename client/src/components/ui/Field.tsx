import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/format";

const baseInputClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

interface LabelWrapProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function LabelWrap({ label, error, required, children }: LabelWrapProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, required, className, ...props }, ref) => (
  <LabelWrap label={label} error={error} required={required}>
    <input ref={ref} className={cn(baseInputClasses, error && "border-red-400", className)} {...props} />
  </LabelWrap>
));
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, required, className, children, ...props }, ref) => (
  <LabelWrap label={label} error={error} required={required}>
    <select ref={ref} className={cn(baseInputClasses, error && "border-red-400", className)} {...props}>
      {children}
    </select>
  </LabelWrap>
));
Select.displayName = "Select";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, required, className, ...props }, ref) => (
  <LabelWrap label={label} error={error} required={required}>
    <textarea ref={ref} className={cn(baseInputClasses, "min-h-[80px]", error && "border-red-400", className)} {...props} />
  </LabelWrap>
));
Textarea.displayName = "Textarea";
