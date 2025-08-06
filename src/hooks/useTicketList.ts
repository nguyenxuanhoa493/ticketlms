import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Organization, CurrentUser, TicketFormData } from "@/types";

export function useTicketList() {
    console.log("=== HOOK: useTicketList called ==="); // Debug log
    const { toast } = useToast();

    // State
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [organizations, setOrganizations] = useState<Organization[] | null>(
        null
    );
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedOrganization, setSelectedOrganization] = useState("all");
    const [selectedSort, setSelectedSort] = useState("status_asc");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Form data
    const [formData, setFormData] = useState<TicketFormData>({
        title: "",
        description: "",
        ticket_type: "task",
        priority: "medium",
        platform: "web",
        status: "open",
        organization_id: "",
        expected_completion_date: "",
        closed_at: "",
        jira_link: "",
        only_show_in_admin: false,
    });

    // Get current user
    const getCurrentUser = async () => {
        try {
            const response = await fetch("/api/current-user");
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data);
            }
        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    };

    // Fetch tickets
    const fetchTickets = async (page = 1, filters = {}) => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: itemsPerPage.toString(),
                ...filters,
            });

            const response = await fetch(`/api/tickets?${params}`);
            if (response.ok) {
                const data = await response.json();
                console.log("API Response:", data); // Debug log

                // Handle different response formats
                let ticketsArray = [];
                let paginationData = { page: 1, totalPages: 0, total: 0 };

                if (Array.isArray(data)) {
                    ticketsArray = data;
                } else if (data && Array.isArray(data.tickets)) {
                    ticketsArray = data.tickets;
                    if (data.pagination) {
                        paginationData = data.pagination;
                    }
                } else if (data && data.tickets) {
                    ticketsArray = [data.tickets];
                    if (data.pagination) {
                        paginationData = data.pagination;
                    }
                }

                console.log("Tickets array:", ticketsArray); // Debug log
                console.log(
                    "Setting tickets state with length:",
                    ticketsArray.length
                );
                setTickets(ticketsArray);

                // Update pagination state
                setCurrentPage(paginationData.page);
                setTotalPages(paginationData.totalPages);
                setTotalItems(paginationData.total);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            setTickets([]); // Fallback to empty array
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách tickets.",
                variant: "destructive",
            });
        }
    };

    // Fetch organizations
    const fetchOrganizations = async () => {
        console.log("Fetching organizations..."); // Debug log
        try {
            const response = await fetch("/api/organizations");
            console.log("Organizations response status:", response.status); // Debug log
            if (response.ok) {
                const data = await response.json();
                console.log("Organizations API response:", data); // Debug log
                // Handle the response format from API
                const organizationsArray = data.organizations || data || [];
                console.log("Organizations array:", organizationsArray); // Debug log
                console.log(
                    "Organizations array length:",
                    organizationsArray.length
                ); // Debug log
                setOrganizations(
                    Array.isArray(organizationsArray) ? organizationsArray : []
                );
            } else {
                console.error(
                    "Failed to fetch organizations:",
                    response.status,
                    response.statusText
                );
                setOrganizations([]);
            }
        } catch (error) {
            console.error("Error fetching organizations:", error);
            setOrganizations([]);
        }
    };

    // Search handler
    const handleSearch = () => {
        const filters: any = {};
        if (searchTerm) filters.search = searchTerm;
        if (selectedStatus && selectedStatus !== "all")
            filters.status = selectedStatus;
        if (selectedOrganization && selectedOrganization !== "all")
            filters.organization_id = selectedOrganization;
        if (selectedSort && selectedSort !== "status_asc")
            filters.sort = selectedSort;

        console.log("=== SEARCH FILTERS ===");
        console.log("Filters:", filters);
        console.log("selectedOrganization:", selectedOrganization);

        setCurrentPage(1); // Reset to first page when searching
        fetchTickets(1, filters);
    };

    // Clear filters
    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedStatus("all");
        setSelectedOrganization("all");
        setSelectedSort("status_asc");
        setCurrentPage(1); // Reset to first page when clearing filters
        fetchTickets(1, {});
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        const filters: any = {};
        if (searchTerm) filters.search = searchTerm;
        if (selectedStatus && selectedStatus !== "all")
            filters.status = selectedStatus;
        if (selectedOrganization && selectedOrganization !== "all")
            filters.organization_id = selectedOrganization;
        if (selectedSort && selectedSort !== "status_asc")
            filters.sort = selectedSort;

        fetchTickets(page, filters);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
        const filters: any = {};
        if (searchTerm) filters.search = searchTerm;
        if (selectedStatus && selectedStatus !== "all")
            filters.status = selectedStatus;
        if (selectedOrganization && selectedOrganization !== "all")
            filters.organization_id = selectedOrganization;
        if (selectedSort && selectedSort !== "status_asc")
            filters.sort = selectedSort;

        fetchTickets(1, filters);
    };

    // Open dialog
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
                expected_completion_date: ticket.expected_completion_date || "",
                closed_at: ticket.closed_at || "",
                jira_link: ticket.jira_link || "",
                only_show_in_admin: ticket.only_show_in_admin || false,
            });
        } else {
            setEditingTicket(null);
            setFormData({
                title: "",
                description: "",
                ticket_type: "task",
                priority: "medium",
                platform: "web",
                status: "open",
                organization_id: "",
                expected_completion_date: "",
                closed_at: "",
                jira_link: "",
                only_show_in_admin: false,
            });
        }
        setDialogOpen(true);
    };

    // Close dialog
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingTicket(null);
        setFormData({
            title: "",
            description: "",
            ticket_type: "task",
            priority: "medium",
            platform: "web",
            status: "open",
            organization_id: "",
            expected_completion_date: "",
            closed_at: "",
            jira_link: "",
            only_show_in_admin: false,
        });
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = editingTicket
                ? `/api/tickets/${editingTicket.id}`
                : "/api/tickets";
            const method = editingTicket ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to save ticket");
            }

            toast({
                title: "Thành công",
                description: editingTicket
                    ? "Ticket đã được cập nhật."
                    : "Ticket đã được tạo.",
            });

            handleCloseDialog();
            fetchTickets(currentPage); // Refresh current page
        } catch (error) {
            console.error("Error saving ticket:", error);
            toast({
                title: "Lỗi",
                description: "Không thể lưu ticket.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Delete ticket
    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ticket "${title}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/tickets/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete ticket");
            }

            toast({
                title: "Thành công",
                description: "Ticket đã được xóa.",
            });

            fetchTickets(currentPage); // Refresh current page
        } catch (error) {
            console.error("Error deleting ticket:", error);
            toast({
                title: "Lỗi",
                description: "Không thể xóa ticket.",
                variant: "destructive",
            });
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

    // Check if has active filters
    const hasActiveFilters = Boolean(
        searchTerm ||
            (selectedStatus && selectedStatus !== "all") ||
            (selectedOrganization && selectedOrganization !== "all") ||
            (selectedSort && selectedSort !== "status_asc")
    );

    // Initialize data
    useEffect(() => {
        const initializeData = async () => {
            console.log("=== HOOK: Initializing data... ==="); // Debug log
            setLoading(true);
            try {
                await Promise.all([
                    getCurrentUser(),
                    fetchOrganizations(),
                    fetchTickets(),
                ]);
                console.log("=== HOOK: All data fetched successfully ==="); // Debug log
            } catch (error) {
                console.error(
                    "=== HOOK: Error during initialization ===",
                    error
                );
            } finally {
                setLoading(false);
                console.log("=== HOOK: Data initialization completed ==="); // Debug log
            }
        };

        initializeData();
    }, []);

    // Debug effect for organizations
    useEffect(() => {
        console.log("Organizations state changed:", organizations);
    }, [organizations]);

    // Debug effect for tickets
    useEffect(() => {
        console.log("Tickets state changed:", tickets);
        console.log("Tickets length:", tickets?.length);
    }, [tickets]);

    return {
        // State
        tickets,
        organizations,
        currentUser,
        loading,
        submitting,
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
