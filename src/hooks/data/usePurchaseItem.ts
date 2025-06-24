import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PurchaseResponse {
  success: boolean;
  message: string;
}

export function usePurchaseItem(passportCode: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<PurchaseResponse, Error, string>({
    mutationFn: (itemId: string) => 
      apiRequest('POST', `/api/island/${passportCode}/purchase`, { itemId }),
    onSuccess: () => {
      // Invalidate island data to refresh wallet and purchase requests
      queryClient.invalidateQueries({ 
        queryKey: [`/api/island-page-data/${passportCode}`] 
      });
    },
  });
}
