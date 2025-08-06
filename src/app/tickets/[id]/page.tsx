"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { ArrowLeft, Save, Edit, X, Plus } from "lucide-react";

import { TicketDetailView } from "@/components/tickets/TicketDetailView";
import { TicketEditForm } from "@/components/tickets/TicketEditForm";
import { TicketComments } from "@/components/tickets/TicketComments";
import { useTicketDetailQuery } from "@/hooks/useTicketDetailQuery";

export default function TicketDetailPage() {
    const params = useParams();
    const ticketId = params?.id as string;

    const ticketData = useTicketDetailQuery(ticketId);

    // Early return if hook returns null (error case)
    if (!ticketData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h1>
                    <p className="text-gray-600 mb-4">Không thể tải thông tin ticket</p>
                    <Button onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                </div>
            </div>
        );
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

    if (hasError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h1>
                    <p className="text-gray-600 mb-4">Không thể tải thông tin ticket</p>
                    <Button onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Ticket không tồn tại
                    </h1>
                    <Button onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <Toaster />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                    {/* Left Side - Ticket Form */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.history.back()}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Quay lại
                                    </Button>
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
                                                {currentUser?.role ===
                                                    "admin" &&
                                                    !ticket?.jira_link && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={
                                                                handleCreateJiraIssue
                                                            }
                                                            disabled={
                                                                creatingJira
                                                            }
                                                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                                        >
                                                            <Plus className="w-4 h-4 mr-2" />
                                                            {creatingJira
                                                                ? "Đang tạo..."
                                                                : "Tạo JIRA"}
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
                                                    {saving
                                                        ? "Đang lưu..."
                                                        : "Lưu"}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
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
                            <CardContent className="p-6">
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
        </div>
    );
}
