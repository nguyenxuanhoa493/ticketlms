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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState<{
        id: string;
        title: string;
    } | null>(null);
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
    const [selectedSort, setSelectedSort] = useState("status_asc"); // Mặc định sắp xếp theo trạng thái: Mở > Đang làm > Đóng

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
        // Luôn gửi sort parameter để đảm bảo sắp xếp mặc định được áp dụng
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

    // Extract data - đảm bảo luôn có dữ liệu hợp lệ
    const tickets = Array.isArray(ticketsData?.tickets)
        ? ticketsData.tickets
        : [];
    const organizations = Array.isArray(organizationsData?.organizations)
        ? organizationsData.organizations
        : Array.isArray(organizationsData)
        ? organizationsData
        : [];

    // Pagination data - đảm bảo luôn có giá trị hợp lệ
    const pagination = ticketsData?.pagination || {
        page: 1,
        totalPages: 0,
        total: 0,
    };
    const totalItems = pagination.total || 0;
    const totalPages = totalItems === 0 ? 0 : pagination.totalPages || 0;

    // Validation: đảm bảo currentPage không vượt quá totalPages
    const validCurrentPage =
        totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

    // Nếu totalItems = 0, đảm bảo currentPage = 1
    const finalCurrentPage = totalItems === 0 ? 1 : validCurrentPage;

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
        deleteDialogOpen,
        ticketToDelete,
        formData,
        searchTerm,
        selectedStatus,
        selectedOrganization,
        selectedSort,
        hasActiveFilters,
        currentPage: finalCurrentPage,
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
