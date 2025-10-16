"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Edit, X, Plus } from "lucide-react";
import { useTicketDetailQuery } from "@/hooks/useTicketDetailQuery";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketDetailView } from "./TicketDetailView";
import { TicketEditForm } from "./TicketEditForm";
import { TicketComments } from "./TicketComments";
import { Toaster } from "@/components/ui/toaster";

interface TicketDetailSheetProps {
    ticketId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jiraStatuses?: Record<string, { status: string; statusCategory: string }>;
}

export function TicketDetailSheet({
    ticketId,
    open,
    onOpenChange,
    jiraStatuses = {},
}: TicketDetailSheetProps) {
    const ticketData = useTicketDetailQuery(ticketId || "");
    
    // Don't render if no ticketId or data not ready
    if (!ticketId || !ticketData) {
        return null;
    }

    const {
        ticket,
        currentUser,
        organizations,
        comments,
        isEditing,
        saving,
        creatingJira,
        loading,
        formData,
        hasError,
        setFormData,
        handleSave,
        handleEditToggle,
        handleCancel,
        handleCreateJiraIssue,
        handleAddComment,
        handleEditComment,
        handleDeleteComment,
    } = ticketData;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[95vw] lg:max-w-[1400px] overflow-y-auto p-0">
                <Toaster />
                
                {loading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : hasError ? (
                    <div className="p-6 text-center py-8">
                        <p className="text-red-600 mb-4">Không thể tải ticket</p>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Đóng
                        </Button>
                    </div>
                ) : ticket ? (
                    <div className="p-6">
                        <SheetHeader className="mb-6">
                            <SheetTitle className="text-2xl font-bold">
                                {ticket.title}
                            </SheetTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                #{ticket.id.slice(0, 8)}
                            </p>
                        </SheetHeader>

                        {/* Grid Layout - 2 columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Left Side - Ticket Form */}
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold">Thông tin ticket</h3>
                                            <div className="flex gap-2">
                                                {!isEditing ? (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={handleEditToggle}
                                                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
                                                        >
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Chỉnh sửa
                                                        </Button>
                                                        {currentUser?.role === "admin" && !ticket?.jira_link && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={handleCreateJiraIssue}
                                                                disabled={creatingJira}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                            >
                                                                <Plus className="w-4 h-4 mr-2" />
                                                                {creatingJira ? "Đang tạo..." : "Tạo JIRA"}
                                                            </Button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleCancel}
                                                        >
                                                            <X className="w-4 h-4 mr-2" />
                                                            Hủy
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                            onClick={handleSave}
                                                            disabled={saving}
                                                        >
                                                            <Save className="w-4 h-4 mr-2" />
                                                            {saving ? "Đang lưu..." : "Lưu"}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {!isEditing ? (
                                            <TicketDetailView
                                                ticket={ticket}
                                                currentUser={currentUser}
                                            />
                                        ) : (
                                            <TicketEditForm
                                                formData={formData}
                                                setFormData={setFormData}
                                                organizations={organizations}
                                                currentUser={currentUser}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Side - Comments */}
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardContent className="p-4">
                                        <TicketComments
                                            comments={comments}
                                            ticketId={ticketId}
                                            currentUserId={currentUser?.id || ""}
                                            onAddComment={handleAddComment}
                                            onEditComment={handleEditComment}
                                            onDeleteComment={handleDeleteComment}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
