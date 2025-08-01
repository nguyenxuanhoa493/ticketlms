"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Plus } from "lucide-react";

import { TicketTable } from "@/components/tickets/TicketTable";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { TicketDialog } from "@/components/tickets/TicketDialog";
import { useTicketList } from "@/hooks/useTicketList";

console.log("=== PAGE: useTicketList imported ==="); // Debug log

export default function TicketsPage() {
    const {
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
    } = useTicketList();

    // Debug logging
    console.log("TicketsPage - tickets:", tickets);
    console.log("TicketsPage - tickets.length:", tickets?.length);
    console.log("TicketsPage - loading:", loading);
    console.log("TicketsPage - organizations:", organizations);
    console.log("TicketsPage - currentUser:", currentUser);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <Toaster />

            <div className="w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Quản lý Tickets
                    </h1>
                </div>

                <div className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Bộ lọc và tìm kiếm</CardTitle>
                        </CardHeader>
                        <CardContent className="w-full">
                            <TicketFilters
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                selectedStatus={selectedStatus}
                                setSelectedStatus={setSelectedStatus}
                                selectedOrganization={selectedOrganization}
                                setSelectedOrganization={
                                    setSelectedOrganization
                                }
                                selectedSort={selectedSort}
                                setSelectedSort={setSelectedSort}
                                organizations={organizations || []}
                                currentUser={currentUser}
                                onSearch={handleSearch}
                                onClearFilters={handleClearFilters}
                                hasActiveFilters={hasActiveFilters}
                            />
                        </CardContent>
                    </Card>

                    {/* Table */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Danh sách Tickets</CardTitle>
                            <Button
                                onClick={() => handleOpenDialog()}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo ticket mới
                            </Button>
                        </CardHeader>
                        <CardContent className="w-full">
                            {tickets?.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4">
                                        <svg
                                            className="mx-auto h-12 w-12"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Không có tickets nào
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        {hasActiveFilters
                                            ? "Thử thay đổi bộ lọc hoặc tìm kiếm"
                                            : "Bắt đầu bằng cách tạo ticket đầu tiên"}
                                    </p>
                                    {!hasActiveFilters && (
                                        <Button
                                            onClick={() =>
                                                handleOpenDialog(undefined)
                                            }
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Tạo ticket đầu tiên
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <TicketTable
                                    tickets={tickets}
                                    currentUser={currentUser}
                                    onDelete={handleDelete}
                                    getDeadlineCountdown={getDeadlineCountdown}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                    onItemsPerPageChange={
                                        handleItemsPerPageChange
                                    }
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Ticket Dialog */}
            <TicketDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                formData={formData}
                setFormData={setFormData}
                organizations={organizations || []}
                onSubmit={handleSubmit}
                submitting={submitting}
                editingTicket={editingTicket}
            />
        </div>
    );
}
