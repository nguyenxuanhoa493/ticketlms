import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ReportTableProps {
    organizationStats: Array<{
        name: string;
        total: number;
        open: number;
        inProgress: number;
        closed: number;
    }>;
}

export function ReportTable({ organizationStats }: ReportTableProps) {
    const calculateCompletionRate = (closed: number, total: number) => {
        return total > 0 ? (closed / total) * 100 : 0;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Thống kê theo tổ chức</CardTitle>
                <p className="text-sm text-gray-600">
                    Chi tiết số lượng tickets theo trạng thái cho từng tổ chức
                </p>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tổ chức</TableHead>
                            <TableHead className="text-center">Tổng</TableHead>
                            <TableHead className="text-center">
                                Đang mở
                            </TableHead>
                            <TableHead className="text-center">
                                Đang xử lý
                            </TableHead>
                            <TableHead className="text-center">
                                Đã đóng
                            </TableHead>
                            <TableHead className="text-center">
                                Tỷ lệ hoàn thành
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {organizationStats.map((org) => (
                            <TableRow key={org.name}>
                                <TableCell className="font-medium">
                                    {org.name}
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                    {org.total}
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        {org.open}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {org.inProgress}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {org.closed}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            calculateCompletionRate(
                                                org.closed,
                                                org.total
                                            ) >= 80
                                                ? "bg-green-100 text-green-800"
                                                : calculateCompletionRate(
                                                      org.closed,
                                                      org.total
                                                  ) >= 60
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {calculateCompletionRate(
                                            org.closed,
                                            org.total
                                        ).toFixed(1)}
                                        %
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Summary */}
                {organizationStats.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-medium text-gray-700">
                                    Tổng tickets
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {organizationStats.reduce(
                                        (sum, org) => sum + org.total,
                                        0
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-gray-700">
                                    Tổng đang mở
                                </div>
                                <div className="text-2xl font-bold text-red-600">
                                    {organizationStats.reduce(
                                        (sum, org) => sum + org.open,
                                        0
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-gray-700">
                                    Tổng đang xử lý
                                </div>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {organizationStats.reduce(
                                        (sum, org) => sum + org.inProgress,
                                        0
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-gray-700">
                                    Tổng đã đóng
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    {organizationStats.reduce(
                                        (sum, org) => sum + org.closed,
                                        0
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
