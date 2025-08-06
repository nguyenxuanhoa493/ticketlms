import { useState, useMemo } from "react";
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
    // State cho UI
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
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
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedOrganization, setSelectedOrganization] = useState("all");
    const [selectedSort, setSelectedSort] = useState("status_asc");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Build query params
    const queryParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            limit: itemsPerPage,
        };

        if (searchTerm) params.search = searchTerm;
        if (selectedStatus && selectedStatus !== "all")
            params.status = selectedStatus;
        if (selectedOrganization && selectedOrganization !== "all")
            params.organization_id = selectedOrganization;
        if (selectedSort && selectedSort !== "status_asc")
            params.sort = selectedSort;

        return params;
    }, [
        currentPage,
        itemsPerPage,
        searchTerm,
        selectedStatus,
        selectedOrganization,
        selectedSort,
    ]);

    // React Query hooks
    const {
        data: ticketsData,
        isLoading: ticketsLoading,
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

    // Extract data
    const tickets = ticketsData?.tickets || ticketsData || [];
    const organizations =
        organizationsData?.organizations || organizationsData || [];

    // Pagination data
    const pagination = ticketsData?.pagination || {
        page: 1,
        totalPages: 0,
        total: 0,
    };
    const totalPages = pagination.totalPages;
    const totalItems = pagination.total;

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
        searchTerm ||
            (selectedStatus && selectedStatus !== "all") ||
            (selectedOrganization && selectedOrganization !== "all") ||
            (selectedSort && selectedSort !== "status_asc")
    );

    // Handlers
    const handleSearch = () => {
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedStatus("all");
        setSelectedOrganization("all");
        setSelectedSort("status_asc");
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const handleOpenDialog = (ticket?: Ticket) => {
        if (ticket) {
            setEditingTicket(ticket);
            setFormData({
                title: ticket.title || "",
                description: ticket.description || "",
                ticket_type: ticket.ticket_type || "task",
                priority: ticket.priority || "medium",
                platform: ticket.platform || "web",
                status: ticket.status || "open",
                organization_id: ticket.organization_id || "",
                expected_completion_date:
                    ticket.expected_completion_date || null,
                closed_at: ticket.closed_at || null,
                jira_link: ticket.jira_link || "",
                only_show_in_admin: ticket.only_show_in_admin || false,
            });
        } else {
            setEditingTicket(null);
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
        setEditingTicket(null);
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
        if (confirm(`Bạn có chắc chắn muốn xóa ticket "${title}"?`)) {
            await deleteTicketMutation.mutateAsync(id);
        }
    };

    // Get deadline countdown
    const getDeadlineCountdown = (
        expectedDate: string | null,
        status: string
    ) => {
        if (!expectedDate || status === "closed") return null;

        const now = new Date();
        const expected = new Date(expectedDate);
        const diffMs = expected.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        return { days: diffDays };
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
        handleSearch,
        handleClearFilters,
        handleOpenDialog,
        handleCloseDialog,
        handleSubmit,
        handleDelete,
        getDeadlineCountdown,
        handlePageChange,
        handleItemsPerPageChange,
    };
}
