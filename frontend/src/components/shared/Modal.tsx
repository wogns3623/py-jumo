import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalButton {
  text: string;
  onClick?: () => void;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  titleDescription,
  children,
  confirm,
  cancel,
  className,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  titleDescription?: string;
  children?: React.ReactNode;
  confirm?: ModalButton;
  cancel?: ModalButton;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[425px] w-[95vw] min-h-fit max-h-[90vh] bg-gray-50 p-2 flex flex-col",
          className
        )}
      >
        <DialogHeader className="mb-0 rounded-t-lg flex-shrink-0">
          <DialogTitle className="text-gray-900">{title}</DialogTitle>
          {titleDescription && (
            <DialogDescription className="text-gray-600">
              {titleDescription}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 flex flex-col">{children}</div>

        <DialogFooter className="gap-2 mt-0 rounded-b-lg flex-shrink-0">
          {confirm && (
            <Button
              variant="outline"
              onClick={() => {
                confirm.onClick?.();
                onOpenChange?.(false);
              }}
              className="bg-white hover:bg-gray-50"
            >
              {confirm.text}
            </Button>
          )}

          {cancel && (
            <Button
              variant="secondary"
              onClick={() => {
                cancel.onClick?.();
                onOpenChange?.(false);
              }}
              className="bg-white hover:bg-gray-50"
            >
              {cancel.text}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
