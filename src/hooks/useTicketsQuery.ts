import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Ticket, TicketFormData } from "@/types";

// API functions
const fetchTickets = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    organization_id?: string;
    sort?: string;
}) => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);
    if (params.organization_id)
        searchParams.append("organization_id", params.organization_id);
    if (params.sort) searchParams.append("sort", params.sort);

    const response = await fetch(`/api/tickets?${searchParams}`);
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized - Please login again");
        } else if (response.status === 403) {
            throw new Error("Forbidden - Insufficient permissions");
        } else {
            throw new Error(`Failed to fetch tickets: ${response.status}`);
        }
    }
    return response.json();
};

const fetchCurrentUser = async () => {
    const response = await fetch("/api/current-user");
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized - Please login again");
        } else {
            throw new Error(`Failed to fetch current user: ${response.status}`);
        }
    }
    return response.json();
};

const fetchOrganizations = async () => {
    const response = await fetch("/api/organizations");
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized - Please login again");
        } else if (response.status === 403) {
            throw new Error("Forbidden - Insufficient permissions");
        } else {
            throw new Error(
                `Failed to fetch organizations: ${response.status}`
            );
        }
    }
    return response.json();
};

const createTicket = async (data: TicketFormData) => {
    const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error("Failed to create ticket");
    }
    return response.json();
};

const updateTicket = async ({
    id,
    data,
}: {
    id: string;
    data: Partial<TicketFormData>;
}) => {
    const response = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error("Failed to update ticket");
    }
    return response.json();
};

const deleteTicket = async (id: string) => {
    const response = await fetch(`/api/tickets/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete ticket");
    }
    return response.json();
};

// Custom hooks
export function useTickets(
    params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        organization_id?: string;
        sort?: string;
    } = {}
) {
    return useQuery({
        queryKey: ["tickets", params],
        queryFn: () => fetchTickets(params),
        staleTime: 2 * 60 * 1000, // 2 phút
        gcTime: 5 * 60 * 1000, // 5 phút
        retry: (failureCount, error) => {
            // Không retry nếu lỗi 401 (unauthorized) hoặc 403 (forbidden)
            if (
                error.message.includes("Unauthorized") ||
                error.message.includes("Forbidden")
            ) {
                return false;
            }
            return failureCount < 2; // Retry tối đa 2 lần cho các lỗi khác
        },
    });
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ["currentUser"],
        queryFn: fetchCurrentUser,
        staleTime: 10 * 60 * 1000, // 10 phút
        gcTime: 30 * 60 * 1000, // 30 phút
        retry: (failureCount, error) => {
            // Không retry nếu lỗi 401 (unauthorized)
            if (error.message.includes("Unauthorized")) {
                return false;
            }
            return failureCount < 2; // Retry tối đa 2 lần cho các lỗi khác
        },
    });
}

export function useOrganizations() {
    return useQuery({
        queryKey: ["organizations"],
        queryFn: fetchOrganizations,
        staleTime: 10 * 60 * 1000, // 10 phút
        gcTime: 30 * 60 * 1000, // 30 phút
        retry: (failureCount, error) => {
            // Không retry nếu lỗi 401 (unauthorized) hoặc 403 (forbidden)
            if (
                error.message.includes("Unauthorized") ||
                error.message.includes("Forbidden")
            ) {
                return false;
            }
            return failureCount < 2; // Retry tối đa 2 lần cho các lỗi khác
        },
    });
}

export function useCreateTicket() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: createTicket,
        onSuccess: () => {
            // Invalidate và refetch tickets
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            toast({
                title: "Thành công",
                description: "Ticket đã được tạo thành công.",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể tạo ticket.",
                variant: "destructive",
            });
        },
    });
}

export function useUpdateTicket() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: updateTicket,
        onSuccess: () => {
            // Invalidate và refetch tickets
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            toast({
                title: "Thành công",
                description: "Ticket đã được cập nhật thành công.",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể cập nhật ticket.",
                variant: "destructive",
            });
        },
    });
}

export function useDeleteTicket() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: deleteTicket,
        onSuccess: () => {
            // Invalidate và refetch tickets
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            toast({
                title: "Thành công",
                description: "Ticket đã được xóa thành công.",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể xóa ticket.",
                variant: "destructive",
            });
        },
    });
}
