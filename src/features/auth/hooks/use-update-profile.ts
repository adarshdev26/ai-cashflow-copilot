import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '../api/update-profile';

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProfile,
        // The sidebar name and avatar read from ['current-user'], so they update immediately.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['current-user'] }),
    });
}
