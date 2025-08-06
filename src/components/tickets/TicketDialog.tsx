import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { TicketFormData, Organization } from "@/types";
import { TicketTypeBadge } from "@/components/TicketTypeBadge";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import { PlatformBadge } from "@/components/PlatformBadge";

interface TicketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: TicketFormData;
    setFormData: React.Dispatch<React.SetStateAction<TicketFormData>>;
    organizations: Organization[];
    onSubmit: (e: React.FormEvent) => Promise<void>;
    submitting: boolean;
    editingTicket?: any; // Ticket being edited, if any
    currentUser?: {
        role: "admin" | "manager" | "user";
    } | null;
}

export function TicketDialog({
    open,
    onOpenChange,
    formData,
    setFormData,
    organizations,
    onSubmit,
    submitting,
    editingTicket,
    currentUser,
}: TicketDialogProps) {
    const isEditing = !!editingTicket;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? "Chỉnh sửa ticket" : "Tạo ticket mới"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={onSubmit} className="space-y-6">
                        {/* Row 1 - Đơn vị và Tiêu đề */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="space-y-2 md:col-span-4">
                                <Label htmlFor="organization_id">
                                    Đơn vị *
                                </Label>
                                <Select
                                    value={formData.organization_id}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            organization_id: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn đơn vị" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations?.map((org) => (
                                            <SelectItem
                                                key={org.id}
                                                value={org.id}
                                            >
                                                {org.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-8">
                                <Label htmlFor="title">Tiêu đề *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="Nhập tiêu đề ticket"
                                    required
                                    className="text-lg font-medium"
                                />
                            </div>
                        </div>

                        {/* Row 2 - Loại, Ưu tiên, Nền tảng, Thời hạn */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="ticket_type">
                                    Loại ticket *
                                </Label>
                                <Select
                                    value={formData.ticket_type}
                                    onValueChange={(value: "bug" | "task") =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            ticket_type: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="task">
                                            <TicketTypeBadge type="task" />
                                        </SelectItem>
                                        <SelectItem value="bug">
                                            <TicketTypeBadge type="bug" />
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Ưu tiên *</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(
                                        value: "low" | "medium" | "high"
                                    ) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            priority: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            <TicketPriorityBadge
                                                priority="low"
                                                size="sm"
                                            />
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            <TicketPriorityBadge
                                                priority="medium"
                                                size="sm"
                                            />
                                        </SelectItem>
                                        <SelectItem value="high">
                                            <TicketPriorityBadge
                                                priority="high"
                                                size="sm"
                                            />
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="platform">Nền tảng *</Label>
                                <Select
                                    value={formData.platform}
                                    onValueChange={(
                                        value: "web" | "app" | "all"
                                    ) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            platform: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="web">
                                            <PlatformBadge
                                                platform="web"
                                                size="sm"
                                            />
                                        </SelectItem>
                                        <SelectItem value="app">
                                            <PlatformBadge
                                                platform="app"
                                                size="sm"
                                            />
                                        </SelectItem>
                                        <SelectItem value="all">
                                            <PlatformBadge
                                                platform="all"
                                                size="sm"
                                            />
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expected_completion_date">
                                    Thời hạn
                                </Label>
                                <Input
                                    id="expected_completion_date"
                                    type="date"
                                    value={formData.expected_completion_date}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            expected_completion_date:
                                                e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        {/* Description - Ưu tiên hiển thị to hơn */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Nội dung *</Label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: value,
                                    }))
                                }
                                placeholder="Nhập mô tả chi tiết..."
                                className="min-h-64"
                            />
                        </div>

                        {/* Admin-only field */}
                        {currentUser?.role === "admin" && (
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="only_show_in_admin"
                                        checked={formData.only_show_in_admin}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                only_show_in_admin:
                                                    e.target.checked,
                                            }))
                                        }
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <Label
                                        htmlFor="only_show_in_admin"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Chỉ hiển thị với admin
                                    </Label>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={submitting}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting
                                    ? "Đang lưu..."
                                    : isEditing
                                      ? "Cập nhật"
                                      : "Tạo ticket"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
