import { useState, useMemo, useCallback, useEffect, useRef, useReducer } from "react";
import {
    useTickets,
    useCurrentUser,
    useOrganizations,
    useCreateTicket,
    useUpdateTicket,
    useDeleteTicket,
} from "./useTicketsQuery";
import { Ticket, TicketFormData } from "@/types";

export function useTicketListOptimized() {
    // Track component lifecycle and instance ID
    const mountedRef = useRef(true);
    const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9));
    
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            console.log(`[Lifecycle] useTicketListOptimized MOUNTED (ID: ${instanceIdRef.current})`);
            mountedRef.current = true;
            return () => {
                console.log(`[Lifecycle] useTicketListOptimized UNMOUNTED (ID: ${instanceIdRef.current})`);
                mountedRef.current = false;
            };
        }, []);
    }
    
    // State cho UI
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | undefined>(undefined);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState<{
        id: string;
        title: string;
    } | null | undefined>(null);
    const [formData, setFormData] = useState<TicketFormData>({
        title: "",
        description: "",
        ticket_type: "task",
        priority: "medium",
        platform: "web",
        status: "open",
        organization_id: "",
        expected_completion_date: null,
        closed_at: null,
        jira_link: "",
        only_show_in_admin: false,
    });

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [appliedSearchTerm, setAppliedSearchTerm] = useState(""); // Actually applied search term
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedOrganization, setSelectedOrganization] = useState("all");
    const [selectedSort, setSelectedSort] = useState("status_asc"); // Mặc định sắp xếp theo trạng thái: Mở > Đang làm > Đóng

    // Pagination - Use reducer to have more control over state updates
    const [paginationState, setPaginationState] = useState(() => {
        // Only run on client side
        if (typeof window === 'undefined') {
            return { currentPage: 1, itemsPerPage: 20 };
        }
        
        // Load from sessionStorage
        const savedPage = sessionStorage.getItem('tickets_current_page');
        const savedLimit = sessionStorage.getItem('tickets_items_per_page');
        
        const initialState = {
            currentPage: savedPage ? parseInt(savedPage, 10) : 1,
            itemsPerPage: savedLimit ? parseInt(savedLimit, 10) : 20,
        };
        
        console.log("[DEBUG] Initial pagination state:", initialState);
        return initialState;
    });
    
    const currentPage = paginationState.currentPage;
    const itemsPerPage = paginationState.itemsPerPage;
    
    // Save to sessionStorage when changed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('tickets_current_page', currentPage.toString());
            sessionStorage.setItem('tickets_items_per_page', itemsPerPage.toString());
            console.log("[DEBUG] Pagination state changed:", { currentPage, itemsPerPage });
        }
    }, [currentPage, itemsPerPage]);

    // Build query params
    const queryParams = useMemo(() => {
        const params: Record<string, string | number> = {
            page: currentPage,
            limit: itemsPerPage,
            sort: selectedSort, // Luôn gửi sort parameter
        };

        if (appliedSearchTerm) params.search = appliedSearchTerm;
        if (selectedStatus && selectedStatus !== "all")
            params.status = selectedStatus;
        if (selectedOrganization && selectedOrganization !== "all")
            params.organization_id = selectedOrganization;

        console.log("[DEBUG] queryParams computed:", params, "from currentPage:", currentPage);
        return params;
    }, [
        currentPage,
        itemsPerPage,
        appliedSearchTerm,
        selectedStatus,
        selectedOrganization,
        selectedSort,
    ]);

    // React Query hooks
    const {
        data: ticketsData,
        isLoading: ticketsLoading,
        isFetching: ticketsFetching,
        error: ticketsError,
    } = useTickets(queryParams);
    const {
        data: currentUser,
        isLoading: userLoading,
        error: userError,
    } = useCurrentUser();
    const {
        data: organizationsData,
        isLoading: organizationsLoading,
        error: organizationsError,
    } = useOrganizations();

    const createTicketMutation = useCreateTicket();
    const updateTicketMutation = useUpdateTicket();
    const deleteTicketMutation = useDeleteTicket();

    // Extract data - đảm bảo luôn có dữ liệu hợp lệ
    const tickets = Array.isArray(ticketsData?.tickets)
        ? ticketsData.tickets
        : [];
    const organizations = Array.isArray(organizationsData?.organizations)
        ? organizationsData.organizations
        : Array.isArray(organizationsData)
        ? organizationsData
        : [];

    // Pagination data - memoized để tránh re-calculate
    const { totalItems, totalPages } = useMemo(() => {
        const pagination = ticketsData?.pagination || { page: 1, totalPages: 0, total: 0 };
        const total = pagination.total || 0;
        const pages = total === 0 ? 0 : pagination.totalPages || 0;
        return { totalItems: total, totalPages: pages };
    }, [ticketsData?.pagination]);

    // Loading state
    const loading = ticketsLoading || userLoading || organizationsLoading;

    // Error handling
    const hasError = ticketsError || userError || organizationsError;
    const errorMessage =
        ticketsError?.message ||
        userError?.message ||
        organizationsError?.message;

    // Check if has active filters
    const hasActiveFilters = Boolean(
        appliedSearchTerm ||
            (selectedStatus && selectedStatus !== "all") ||
            (selectedOrganization && selectedOrganization !== "all") ||
            (selectedSort && selectedSort !== "status_asc")
    );

    // Handlers
    const handleSearch = useCallback(() => {
        setAppliedSearchTerm(searchTerm); // Apply the search term
        setPaginationState(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1
    }, [searchTerm]);

    const handleClearFilters = useCallback(() => {
        setSearchTerm("");
        setAppliedSearchTerm(""); // Clear applied search term
        setSelectedStatus("all");
        setSelectedOrganization("all");
        setSelectedSort("status_asc");
        setPaginationState({ currentPage: 1, itemsPerPage: 20 }); // Reset to defaults
    }, []);

    const handlePageChange = useCallback((page: number) => {
        console.log("[DEBUG] handlePageChange called with page:", page, "Instance:", instanceIdRef.current);
        setPaginationState(prev => {
            console.log("[DEBUG] setPaginationState: prev =", prev, "new page =", page);
            return { ...prev, currentPage: page };
        });
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
        setPaginationState({ currentPage: 1, itemsPerPage: newItemsPerPage }); // Reset to page 1 when changing items per page
    }, []);

    const handleOpenDialog = (ticket?: Ticket) => {
        if (ticket) {
            setEditingTicket(ticket);
            // For editing, use ticket's organization_id or user's organization_id for non-admin
            const orgId =
                currentUser?.role !== "admin" && currentUser?.organization_id
                    ? currentUser.organization_id
                    : ticket.organization_id || "";

            setFormData({
                title: ticket.title || "",
                description: ticket.description || "",
                ticket_type: ticket.ticket_type || "task",
                priority: ticket.priority || "medium",
                platform: ticket.platform || "web",
                status: ticket.status || "open",
                organization_id: orgId,
                expected_completion_date:
                    ticket.expected_completion_date || null,
                closed_at: ticket.closed_at || null,
                jira_link: ticket.jira_link || "",
                only_show_in_admin: ticket.only_show_in_admin || false,
            });
        } else {
            setEditingTicket(undefined);
            // Auto-set organization_id for non-admin users
            const defaultOrgId =
                currentUser?.role !== "admin" && currentUser?.organization_id
                    ? currentUser.organization_id
                    : "";

            setFormData({
                title: "",
                description: "",
                ticket_type: "task",
                priority: "medium",
                platform: "web",
                status: "open",
                organization_id: defaultOrgId,
                expected_completion_date: "",
                closed_at: "",
                jira_link: "",
                only_show_in_admin: false,
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingTicket(undefined);
        // Reset organization_id based on user role
        const defaultOrgId =
            currentUser?.role !== "admin" && currentUser?.organization_id
                ? currentUser.organization_id
                : "";

        setFormData({
            title: "",
            description: "",
            ticket_type: "task",
            priority: "medium",
            platform: "web",
            status: "open",
            organization_id: defaultOrgId,
            expected_completion_date: null,
            closed_at: null,
            jira_link: "",
            only_show_in_admin: false,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTicket) {
            // Update existing ticket
            await updateTicketMutation.mutateAsync({
                id: editingTicket.id,
                data: formData,
            });
        } else {
            // Create new ticket
            await createTicketMutation.mutateAsync(formData);
        }

        handleCloseDialog();
    };

    const handleDelete = async (id: string, title: string) => {
        setTicketToDelete({ id, title });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (ticketToDelete) {
            try {
                await deleteTicketMutation.mutateAsync(ticketToDelete.id);
                setDeleteDialogOpen(false);
                setTicketToDelete(null);
            } catch (error) {
                // Error handling is done in the mutation
            }
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setTicketToDelete(null);
    };

    // Get deadline countdown
    const getDeadlineCountdown = (
        expectedDate: string | null,
        status: string
    ): { text: string; color: string; isOverdue: boolean } | null => {
        if (!expectedDate || status === "closed") return null;

        const now = new Date();
        const expected = new Date(expectedDate);
        const diffMs = expected.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const isOverdue = diffDays < 0;
        const absDays = Math.abs(diffDays);
        
        let text: string;
        let color: string;
        
        if (isOverdue) {
            text = `Quá hạn ${absDays} ngày`;
            color = "text-red-600";
        } else if (diffDays === 0) {
            text = "Hôm nay";
            color = "text-orange-600";
        } else if (diffDays === 1) {
            text = "Ngày mai";
            color = "text-yellow-600";
        } else if (diffDays <= 3) {
            text = `Còn ${diffDays} ngày`;
            color = "text-yellow-600";
        } else if (diffDays <= 7) {
            text = `Còn ${diffDays} ngày`;
            color = "text-blue-600";
        } else {
            text = `Còn ${diffDays} ngày`;
            color = "text-gray-600";
        }

        return { text, color, isOverdue };
    };

    return {
        // State
        tickets,
        organizations,
        currentUser,
        loading,
        submitting:
            createTicketMutation.isPending ||
            updateTicketMutation.isPending ||
            deleteTicketMutation.isPending,
        dialogOpen,
        editingTicket,
        deleteDialogOpen,
        ticketToDelete,
        formData,
        searchTerm,
        selectedStatus,
        selectedOrganization,
        selectedSort,
        hasActiveFilters,
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasError,
        errorMessage,

        // Actions
        setFormData,
        setSearchTerm,
        setSelectedStatus,
        setSelectedOrganization,
        setSelectedSort,
        setDialogOpen,
        setDeleteDialogOpen,
        handleSearch,
        handleClearFilters,
        handleOpenDialog,
        handleCloseDialog,
        handleSubmit,
        handleDelete,
        handleConfirmDelete,
        handleCancelDelete,
        getDeadlineCountdown,
        handlePageChange,
        handleItemsPerPageChange,
    };
}
