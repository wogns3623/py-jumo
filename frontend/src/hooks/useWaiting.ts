import { WaitingsService } from "@/client";
import { useMutation } from "@tanstack/react-query";

export function useCreateWaiting() {
  return useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const response = await WaitingsService.enqueueWaitings({
        requestBody: data,
      });
      return response;
    },
  });
}
