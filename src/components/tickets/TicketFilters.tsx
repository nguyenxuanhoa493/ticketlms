import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { Organization, CurrentUser } from "@/types";
import { Badge } from "@/components/ui/badge";

interface TicketFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    selectedOrganization: string;
    setSelectedOrganization: (org: string) => void;
    selectedSort: string;
    setSelectedSort: (sort: string) => void;
    organizations: Organization[];
    currentUser: CurrentUser | null;
    onSearch: () => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
}

export function TicketFilters({
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedOrganization,
    setSelectedOrganization,
    selectedSort,
    setSelectedSort,
    organizations,
    currentUser,
    onSearch,
    onClearFilters,
    hasActiveFilters,
}: TicketFiltersProps) {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Auto search when search term changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearch();
        }, 500); // Debounce 500ms for search

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const isAdmin = currentUser?.role === "admin";

    // Auto search when filters change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearch();
        }, 300); // Debounce 300ms

        return () => clearTimeout(timeoutId);
    }, [selectedStatus, selectedOrganization, selectedSort]);

    return (
        <div className="space-y-4">
            {/* Search and Filters Row */}
            <div className="flex flex-wrap gap-4 items-end">
                {/* Organization Filter - chỉ hiển thị cho admin */}
                {isAdmin && (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Đơn vị</Label>
                        <Select
                            value={selectedOrganization}
                            onValueChange={(value) => {
                                setSelectedOrganization(value);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tất cả đơn vị" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Tất cả
                                    {organizations &&
                                        organizations.length > 0 &&
                                        (() => {
                                            const totalOpenTickets =
                                                organizations.reduce(
                                                    (total, org) => {
                                                        return (
                                                            total +
                                                            (org.openTicketsCount ||
                                                                0)
                                                        );
                                                    },
                                                    0
                                                );
                                            return totalOpenTickets > 0 ? (
                                                <span className="ml-1 text-xs text-gray-500">
                                                    ({totalOpenTickets})
                                                </span>
                                            ) : null;
                                        })()}
                                </SelectItem>
                                {organizations &&
                                    organizations.length > 0 &&
                                    (() => {
                                        return organizations.map((org) => (
                                            <SelectItem
                                                key={org.id}
                                                value={org.id}
                                            >
                                                {org.name}
                                                {org.openTicketsCount !==
                                                    undefined &&
                                                    org.openTicketsCount !==
                                                        null &&
                                                    org.openTicketsCount >
                                                        0 && (
                                                        <span className="ml-1 text-xs text-gray-500">
                                                            (
                                                            {
                                                                org.openTicketsCount
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                            </SelectItem>
                                        ));
                                    })()}
                            </SelectContent>
                        </Select>
                        {(!organizations || organizations.length === 0) && (
                            <div className="text-xs text-gray-400 px-2 pt-1">
                                {organizations === null
                                    ? "Đang tải danh sách đơn vị..."
                                    : "Không có đơn vị nào"}
                            </div>
                        )}
                    </div>
                )}

                {/* Status Filter */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Trạng thái</Label>
                    <Select
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="not_closed">
                                Chưa đóng
                            </SelectItem>
                            <SelectItem value="open">Mở</SelectItem>
                            <SelectItem value="in_progress">
                                Đang làm
                            </SelectItem>
                            <SelectItem value="closed">Đã đóng</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Sort Filter */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Sắp xếp</Label>
                    <Select
                        value={selectedSort}
                        onValueChange={setSelectedSort}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sắp xếp theo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="status_asc">
                                Trạng thái (Mở → Đang làm → Đóng)
                            </SelectItem>
                            <SelectItem value="created_at_desc">
                                Mới nhất
                            </SelectItem>
                            <SelectItem value="created_at_asc">
                                Cũ nhất
                            </SelectItem>
                            <SelectItem value="title_asc">
                                Tiêu đề A-Z
                            </SelectItem>
                            <SelectItem value="title_desc">
                                Tiêu đề Z-A
                            </SelectItem>
                            <SelectItem value="expected_completion_date_asc">
                                Hạn hoàn thành gần nhất
                            </SelectItem>
                            <SelectItem value="expected_completion_date_desc">
                                Hạn hoàn thành xa nhất
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Search Bar */}
                <div className="flex-1 min-w-[200px] relative">
                    <Input
                        placeholder="Tìm kiếm theo tiêu đề..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary p-1"
                        onClick={onSearch}
                        tabIndex={0}
                        aria-label="Tìm kiếm"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </div>

                {/* Clear Filters - chỉ hiện khi có bộ lọc */}
                {hasActiveFilters && (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">&nbsp;</Label>
                        <Button
                            variant="outline"
                            onClick={onClearFilters}
                            className="px-4"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
