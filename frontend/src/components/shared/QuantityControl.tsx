import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  disabled = false,
  size = "sm",
  className = "",
}: QuantityControlProps) {
  const sizeClasses = {
    sm: {
      button: "h-6 w-6 p-0",
      icon: "h-3 w-3",
      text: "w-8 text-sm",
    },
    md: {
      button: "h-8 w-8 p-0",
      icon: "h-4 w-4",
      text: "w-10 text-base",
    },
  };

  const { button, icon, text } = sizeClasses[size];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        className={`${button} rounded-sm bg-white hover:bg-gray-50 border-gray-400`}
        onClick={onDecrease}
        disabled={disabled || quantity <= 0}
      >
        <Minus className={icon} />
      </Button>
      <span
        className={`${text} text-center font-semibold font-inter bg-white px-1 py-0.5 rounded border border-gray-200`}
      >
        {quantity}
      </span>
      <Button
        variant="outline"
        size="sm"
        className={`${button} rounded-sm bg-white hover:bg-gray-50 border-gray-400`}
        onClick={onIncrease}
        disabled={disabled}
      >
        <Plus className={icon} />
      </Button>
    </div>
  );
}
