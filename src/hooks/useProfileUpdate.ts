import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useProfileUpdate() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleProfileUpdate = () => {
            // Invalidate và refetch current user data và organizations
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        };

        // Listen for profile update events
        window.addEventListener("profileUpdated", handleProfileUpdate);

        return () => {
            window.removeEventListener("profileUpdated", handleProfileUpdate);
        };
    }, [queryClient]);
}
