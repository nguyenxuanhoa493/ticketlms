import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    TicketTypeBadge,
    TicketStatusBadge,
    TicketPriorityBadge,
    PlatformBadge,
} from "@/components/badges";
import { Calendar } from "lucide-react";
import { TicketFormData, Organization } from "@/types";
import RichTextEditor from "@/components/common/RichTextEditor";

interface TicketEditFormProps {
    formData: TicketFormData;
    setFormData: React.Dispatch<React.SetStateAction<TicketFormData>>;
    organizations: Organization[];
    currentUser: any;
}

export function TicketEditForm({
    formData,
    setFormData,
    organizations,
    currentUser,
}: TicketEditFormProps) {
    return (
        <form className="space-y-6">
            {/* Row 1 - Đơn vị và Tiêu đề */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="organization_id">Đơn vị</Label>
                    <Select
                        value={formData.organization_id}
                        onValueChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                organization_id: value,
                            }))
                        }
                        disabled={!["admin", "manager"].includes(currentUser?.role || "")}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.isArray(organizations) &&
                                organizations.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                        {org.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                    {!["admin", "manager"].includes(currentUser?.role || "") && (
                        <p className="text-sm text-gray-500">
                            Chỉ admin và manager có thể thay đổi đơn vị
                        </p>
                    )}
                </div>

                <div className="space-y-2 md:col-span-9">
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
                    />
                </div>
            </div>

            {/* Row 2 - Loại ticket, Ưu tiên, Thời hạn */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="ticket_type">Loại ticket</Label>
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
                            <SelectValue>
                                <div className="flex items-center gap-2">
                                    <TicketTypeBadge
                                        type={formData.ticket_type}
                                    />
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="task">
                                <div className="flex items-center gap-2">
                                    <TicketTypeBadge type="task" />
                                </div>
                            </SelectItem>
                            <SelectItem value="bug">
                                <div className="flex items-center gap-2">
                                    <TicketTypeBadge type="bug" />
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="priority">Ưu tiên</Label>
                    <Select
                        value={formData.priority}
                        onValueChange={(value: "low" | "medium" | "high") =>
                            setFormData((prev) => ({
                                ...prev,
                                priority: value,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue>
                                <div className="flex items-center gap-2">
                                    <TicketPriorityBadge
                                        priority={formData.priority}
                                        size="sm"
                                    />
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">
                                <div className="flex items-center gap-2">
                                    <TicketPriorityBadge
                                        priority="low"
                                        size="sm"
                                    />
                                </div>
                            </SelectItem>
                            <SelectItem value="medium">
                                <div className="flex items-center gap-2">
                                    <TicketPriorityBadge
                                        priority="medium"
                                        size="sm"
                                    />
                                </div>
                            </SelectItem>
                            <SelectItem value="high">
                                <div className="flex items-center gap-2">
                                    <TicketPriorityBadge
                                        priority="high"
                                        size="sm"
                                    />
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="expected_completion_date">Thời hạn</Label>
                    <div className="relative">
                        <Input
                            id="expected_completion_date"
                            type="date"
                            value={formData.expected_completion_date ?? ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    expected_completion_date: e.target.value || null,
                                }))
                            }
                            className="pr-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:pr-0"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => {
                                const input = document.getElementById(
                                    "expected_completion_date"
                                ) as HTMLInputElement;
                                if (input) {
                                    input.showPicker();
                                }
                            }}
                        >
                            <Calendar className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Row 3 - Nền tảng, Trạng thái và Thời gian đóng */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="platform">Nền tảng</Label>
                    <Select
                        value={formData.platform}
                        onValueChange={(value: "web" | "app" | "all") =>
                            setFormData((prev) => ({
                                ...prev,
                                platform: value,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue>
                                <div className="flex items-center gap-2">
                                    <PlatformBadge
                                        platform={formData.platform}
                                        size="sm"
                                    />
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="web">
                                <div className="flex items-center gap-2">
                                    <PlatformBadge platform="web" size="sm" />
                                </div>
                            </SelectItem>
                            <SelectItem value="app">
                                <div className="flex items-center gap-2">
                                    <PlatformBadge platform="app" size="sm" />
                                </div>
                            </SelectItem>
                            <SelectItem value="all">
                                <div className="flex items-center gap-2">
                                    <PlatformBadge platform="all" size="sm" />
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Trạng thái</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(
                            value: "open" | "in_progress" | "closed"
                        ) => {
                            setFormData((prev) => ({
                                ...prev,
                                status: value,
                                // Auto-fill closed_at when status changes to closed
                                closed_at:
                                    value === "closed"
                                        ? (() => {
                                              if (
                                                  prev.closed_at &&
                                                  prev.status === "closed"
                                              ) {
                                                  return prev.closed_at;
                                              }

                                              const now = new Date();
                                              const utcNow = now.getTime();
                                              const gmt7Now = new Date(
                                                  utcNow + 7 * 60 * 60 * 1000
                                              );

                                              const year =
                                                  gmt7Now.getUTCFullYear();
                                              const month = String(
                                                  gmt7Now.getUTCMonth() + 1
                                              ).padStart(2, "0");
                                              const day = String(
                                                  gmt7Now.getUTCDate()
                                              ).padStart(2, "0");
                                              const hour = String(
                                                  gmt7Now.getUTCHours()
                                              ).padStart(2, "0");
                                              const minute = String(
                                                  gmt7Now.getUTCMinutes()
                                              ).padStart(2, "0");

                                              return `${year}-${month}-${day}T${hour}:${minute}`;
                                          })()
                                        : prev.closed_at,
                            }));
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue>
                                <div className="flex items-center gap-2">
                                    <TicketStatusBadge
                                        status={formData.status}
                                        size="sm"
                                    />
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="open">
                                <div className="flex items-center gap-2">
                                    <TicketStatusBadge
                                        status="open"
                                        size="sm"
                                    />
                                </div>
                            </SelectItem>
                            <SelectItem value="in_progress">
                                <div className="flex items-center gap-2">
                                    <TicketStatusBadge
                                        status="in_progress"
                                        size="sm"
                                    />
                                </div>
                            </SelectItem>
                            <SelectItem value="closed">
                                <div className="flex items-center gap-2">
                                    <TicketStatusBadge
                                        status="closed"
                                        size="sm"
                                    />
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="closed_at">Thời gian đóng</Label>
                    <div className="relative">
                        <Input
                            id="closed_at"
                            type="datetime-local"
                            value={formData.closed_at ?? ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    closed_at: e.target.value || null,
                                }))
                            }
                            className="pr-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:pr-0"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => {
                                const input = document.getElementById(
                                    "closed_at"
                                ) as HTMLInputElement;
                                if (input) {
                                    input.showPicker();
                                }
                            }}
                        >
                            <Calendar className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin-only fields */}
            {currentUser?.role === "admin" && (
                <div className="space-y-4">
                    {/* JIRA Link */}
                    <div className="space-y-2">
                        <Label htmlFor="jira_link">JIRA Link</Label>
                        <Input
                            id="jira_link"
                            type="url"
                            value={formData.jira_link}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    jira_link: e.target.value,
                                }))
                            }
                            placeholder="https://vieted.atlassian.net/browse/CLD-XXX"
                        />
                    </div>

                    {/* Only show in admin field */}
                    <div className="space-y-2">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        only_show_in_admin: !prev.only_show_in_admin,
                                    }))
                                }
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors mr-3 ${
                                    formData.only_show_in_admin
                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                        : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                                }`}
                            >
                                {formData.only_show_in_admin ? "Bật" : "Tắt"}
                            </button>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">
                                    Chỉ hiển thị với admin
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Nội dung</Label>
                <RichTextEditor
                    value={formData.description}
                    onChange={(value) =>
                        setFormData((prev) => ({
                            ...prev,
                            description: value,
                        }))
                    }
                    placeholder="Nhập mô tả chi tiết..."
                    minHeight="min-h-48"
                />
            </div>
        </form>
    );
}
