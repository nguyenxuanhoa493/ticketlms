import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
}: PaginationProps) {
    // Validation: đảm bảo currentPage không vượt quá totalPages
    const validCurrentPage =
        totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        // Always show first page
        rangeWithDots.push(1);

        // Calculate range around current page
        for (
            let i = Math.max(2, validCurrentPage - delta);
            i <= Math.min(totalPages - 1, validCurrentPage + delta);
            i++
        ) {
            range.push(i);
        }

        // Add dots before range if needed
        if (validCurrentPage - delta > 2) {
            rangeWithDots.push("...");
        }

        // Add range
        rangeWithDots.push(...range);

        // Add dots after range if needed
        if (validCurrentPage + delta < totalPages - 1) {
            rangeWithDots.push("...");
        }

        // Always show last page if more than 1 page
        if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Nếu không có dữ liệu hoặc chỉ có 1 trang, hiển thị simplified pagination
    if (totalItems === 0 || totalPages <= 1) {
        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t bg-gray-50/50">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                    {totalItems > 0
                        ? `Hiển thị ${totalItems} kết quả`
                        : `Không có kết quả nào`}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Hiển thị:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) =>
                            onItemsPerPageChange(parseInt(value))
                        }
                    >
                        <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-700">mục/trang</span>
                </div>
            </div>
        );
    }

    // Kiểm tra nếu totalPages = 0 hoặc không hợp lệ
    if (totalPages <= 0) {
        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t bg-gray-50/50">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                    Không có kết quả nào
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Hiển thị:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) =>
                            onItemsPerPageChange(parseInt(value))
                        }
                    >
                        <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-700">mục/trang</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t bg-gray-50/50">
            <div className="text-sm text-gray-700 text-center sm:text-left">
                {totalItems > 0
                    ? `Hiển thị ${startItem}-${endItem} trong tổng số ${totalItems} kết quả`
                    : `Không có kết quả nào`}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Hiển thị:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) =>
                            onItemsPerPageChange(parseInt(value))
                        }
                    >
                        <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-700">mục/trang</span>
                </div>

                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(validCurrentPage - 1)}
                        disabled={validCurrentPage === 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {getVisiblePages().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === "..." ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="h-8 w-8 p-0"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant={
                                        validCurrentPage === page
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => onPageChange(page as number)}
                                    className="h-8 w-8 p-0"
                                    title={`Trang ${page}`}
                                >
                                    {page}
                                </Button>
                            )}
                        </React.Fragment>
                    ))}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(validCurrentPage + 1)}
                        disabled={validCurrentPage === totalPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
