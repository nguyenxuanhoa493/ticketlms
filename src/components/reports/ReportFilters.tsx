import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ReportFiltersProps {
    period: string;
    organizationId?: string;
    organizations: Array<{ id: string; name: string }>;
    userRole?: string;
    onPeriodChange: (period: string) => void;
    onOrganizationChange: (organizationId: string) => void;
    onRefresh: () => void;
    isLoading?: boolean;
}

export function ReportFilters({
    period,
    organizationId,
    organizations,
    userRole,
    onPeriodChange,
    onOrganizationChange,
    onRefresh,
    isLoading = false,
}: ReportFiltersProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Bộ lọc báo cáo</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${
                                isLoading ? "animate-spin" : ""
                            }`}
                        />
                        Làm mới
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Period Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Khoảng thời gian
                        </label>
                        <Select value={period} onValueChange={onPeriodChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn khoảng thời gian" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">
                                    7 ngày gần nhất
                                </SelectItem>
                                <SelectItem value="14">
                                    14 ngày gần nhất
                                </SelectItem>
                                <SelectItem value="30">
                                    30 ngày gần nhất
                                </SelectItem>
                                <SelectItem value="60">
                                    60 ngày gần nhất
                                </SelectItem>
                                <SelectItem value="90">
                                    90 ngày gần nhất
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Organization Filter (chỉ hiển thị cho admin) */}
                    {userRole === "admin" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Tổ chức
                            </label>
                            <Select
                                value={organizationId || "all"}
                                onValueChange={onOrganizationChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả tổ chức" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tất cả tổ chức
                                    </SelectItem>
                                    {organizations.map((org) => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
