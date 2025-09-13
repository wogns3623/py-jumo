import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  titleDescription?: string;
  children?: React.ReactNode;
  confirm?: ModalButton;
  cancel?: ModalButton;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] bg-gray-50 flex flex-col">
        <DialogHeader className="-m-6 p-6 mb-0 rounded-t-lg flex-shrink-0">
          <DialogTitle className="text-gray-900">{title}</DialogTitle>
          {titleDescription && (
            <DialogDescription className="text-gray-600">
              {titleDescription}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className=" p-4 flex-1 flex items-center justify-center">
          {children}
        </div>

        <DialogFooter className="gap-2 -m-6 p-6 mt-0 rounded-b-lg flex-shrink-0">
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
