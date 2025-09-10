"use client";

import { toast } from "@/components/ui/sonner";

const useCustomToast = () => {
  const showSuccessToast = (description: string) => {
    toast.success("Success!", { description });
  };

  const showErrorToast = (description: string) => {
    toast.error("Something went wrong!", { description });
  };

  return { showSuccessToast, showErrorToast };
};

export default useCustomToast;
