import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Tag,
    User,
    Zap,
    Bug,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

export const metadata: Metadata = {
    title: "Lịch sử cập nhật - TicketLMS",
    description: "Lịch sử các thay đổi và cập nhật của hệ thống",
};

interface ChangelogEntry {
    version: string;
    date: string;
    type: "feature" | "improvement" | "bugfix" | "security";
    title: string;
    description: string;
    author?: string;
    breaking?: boolean;
}

const changelogData: ChangelogEntry[] = [
    {
        version: "1.2.2",
        date: "2025-08-02",
        type: "improvement",
        title: "Tách component Dashboard",
        description:
            "Tối ưu hóa cấu trúc code bằng cách tách trang dashboard thành các component nhỏ hơn: DashboardStats, RecentTickets, RecentNotifications, DashboardHeader và dashboard-utils",
        author: "Development Team",
    },
    {
        version: "1.2.2",
        date: "2025-08-02",
        type: "improvement",
        title: "Tách component Tickets",
        description:
            "Tối ưu hóa cấu trúc code bằng cách tách trang tickets thành các component: TicketTable, TicketFilters, TicketDialog, TicketDetailView, TicketComments, TicketEditForm và các hooks tương ứng",
        author: "Development Team",
    },
    {
        version: "1.2.2",
        date: "2025-08-02",
        type: "improvement",
        title: "Cải thiện khả năng bảo trì",
        description:
            "Code được tổ chức rõ ràng hơn, dễ test và tái sử dụng, giảm kích thước file chính từ 647 dòng xuống còn 80 dòng",
        author: "Development Team",
    },
    {
        version: "1.2.2",
        date: "2025-08-02",
        type: "improvement",
        title: "Tối ưu performance",
        description:
            "Các component có thể được lazy load khi cần thiết, cải thiện hiệu suất tải trang",
        author: "Development Team",
    },
    {
        version: "1.2.1",
        date: "2025-08-01",
        type: "feature",
        title: "Tích hợp JIRA",
        description:
            "Thêm chức năng liên kết ticket với JIRA, hiển thị thông tin JIRA trong chi tiết ticket và danh sách tickets",
        author: "Development Team",
    },
    {
        version: "1.2.1",
        date: "2025-08-01",
        type: "improvement",
        title: "Cải thiện hiển thị JIRA",
        description:
            "Cột JIRA chỉ hiển thị số (bỏ prefix CLD-), thu gọn độ rộng cột và chỉ hiển thị cho admin",
        author: "Development Team",
    },
    {
        version: "1.2.1",
        date: "2025-08-01",
        type: "improvement",
        title: "Chuyển sắp xếp từ Frontend sang Backend",
        description:
            "Tối ưu hiệu suất bằng cách sắp xếp tickets ở database level thay vì JavaScript, thêm dropdown sắp xếp với 6 tùy chọn",
        author: "Development Team",
    },
    {
        version: "1.2.1",
        date: "2025-08-01",
        type: "improvement",
        title: "Cải thiện bộ lọc trạng thái",
        description:
            "Thêm tùy chọn lọc 'Chưa đóng' để hiển thị tickets có trạng thái Mở hoặc Đang làm",
        author: "Development Team",
    },
    {
        version: "1.2.1",
        date: "2025-08-01",
        type: "improvement",
        title: "Cải thiện cột Thời hạn",
        description:
            "Thêm đếm ngược thời hạn với màu sắc theo mức độ khẩn cấp, chỉ hiển thị trong 10 ngày gần deadline",
        author: "Development Team",
    },
    {
        version: "1.2.1",
        date: "2025-08-01",
        type: "improvement",
        title: "Cải thiện UI phân trang",
        description:
            "Đồng bộ độ rộng phân trang với danh sách tickets để giao diện nhất quán",
        author: "Development Team",
    },
    {
        version: "1.2.1",
        date: "2025-08-01",
        type: "improvement",
        title: "Đồng bộ màu sắc trạng thái ticket",
        description:
            "Cập nhật màu sắc trạng thái 'Đang làm' và 'Đã đóng' trong dashboard để đồng bộ với danh sách tickets",
        author: "Development Team",
    },
    {
        version: "1.2.0",
        date: "2025-07-30",
        type: "feature",
        title: "Cải thiện Rich Text Editor và HTML Content",
        description:
            "Thêm hỗ trợ bullet list, auto-link, paste ảnh từ clipboard, và đồng bộ UI giữa editor và preview",
        author: "Development Team",
    },
    {
        version: "1.2.0",
        date: "2025-07-30",
        type: "improvement",
        title: "Cải thiện bộ lọc tìm kiếm",
        description:
            "Tìm kiếm chỉ hoạt động khi bấm Enter hoặc icon tìm kiếm, không tự động search khi gõ",
        author: "Development Team",
    },
    {
        version: "1.2.0",
        date: "2025-07-30",
        type: "improvement",
        title: "Đổi tên Dashboard thành Tổng quan",
        description:
            "Cập nhật tất cả label từ 'Dashboard' thành 'Tổng quan' để phù hợp với tiếng Việt",
        author: "Development Team",
    },
    {
        version: "1.2.0",
        date: "2025-07-30",
        type: "improvement",
        title: "Cải thiện UI Tasks Gần Đây",
        description:
            "Đồng bộ màu sắc trạng thái và thêm icon cho loại task giống màn danh sách",
        author: "Development Team",
    },
    {
        version: "1.1.0",
        date: "2025-07-29",
        type: "feature",
        title: "Hệ thống thông báo",
        description:
            "Thêm hệ thống thông báo real-time cho các thay đổi ticket và comment",
        author: "Development Team",
    },
    {
        version: "1.1.0",
        date: "2025-07-29",
        type: "feature",
        title: "Quản lý profile người dùng",
        description:
            "Cho phép người dùng cập nhật thông tin cá nhân và đổi mật khẩu",
        author: "Development Team",
    },
    {
        version: "1.0.0",
        date: "2025-07-25",
        type: "feature",
        title: "Phát hành phiên bản đầu tiên",
        description:
            "Hệ thống quản lý ticket với đầy đủ tính năng cơ bản: tạo, chỉnh sửa, xóa ticket, phân quyền theo role",
        author: "Development Team",
    },
    {
        version: "1.0.0",
        date: "2025-07-25",
        type: "feature",
        title: "Hệ thống phân quyền",
        description:
            "Phân quyền admin, manager, user với các chức năng khác nhau",
        author: "Development Team",
    },
    {
        version: "1.0.0",
        date: "2025-07-25",
        type: "feature",
        title: "Quản lý tổ chức",
        description:
            "Admin có thể tạo và quản lý các tổ chức, phân chia người dùng theo tổ chức",
        author: "Development Team",
    },
];

const getTypeIcon = (type: string) => {
    switch (type) {
        case "feature":
            return <Zap className="w-4 h-4" />;
        case "improvement":
            return <CheckCircle className="w-4 h-4" />;
        case "bugfix":
            return <Bug className="w-4 h-4" />;
        case "security":
            return <AlertCircle className="w-4 h-4" />;
        default:
            return <Tag className="w-4 h-4" />;
    }
};

const getTypeBadgeVariant = (type: string) => {
    switch (type) {
        case "feature":
            return "default";
        case "improvement":
            return "secondary";
        case "bugfix":
            return "destructive";
        case "security":
            return "outline";
        default:
            return "default";
    }
};

const getTypeLabel = (type: string) => {
    switch (type) {
        case "feature":
            return "Tính năng mới";
        case "improvement":
            return "Cải thiện";
        case "bugfix":
            return "Sửa lỗi";
        case "security":
            return "Bảo mật";
        default:
            return type;
    }
};

export default function ChangelogPage() {
    // Group changelog entries by version
    const groupedChangelog = changelogData.reduce(
        (acc, entry) => {
            if (!acc[entry.version]) {
                acc[entry.version] = [];
            }
            acc[entry.version].push(entry);
            return acc;
        },
        {} as Record<string, ChangelogEntry[]>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Lịch sử cập nhật
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Theo dõi lịch sử các thay đổi, tính năng mới và cải thiện
                    của hệ thống TicketLMS
                </p>
            </div>

            {/* Changelog entries */}
            <div className="space-y-8">
                {Object.entries(groupedChangelog)
                    .sort(([a], [b]) => b.localeCompare(a)) // Sort versions descending
                    .map(([version, entries]) => (
                        <Card
                            key={version}
                            className="border-l-4 border-l-blue-500"
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-xl">
                                            v{version}
                                        </CardTitle>
                                        <Badge
                                            variant="outline"
                                            className="text-sm"
                                        >
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(
                                                entries[0].date
                                            ).toLocaleDateString("vi-VN", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {entries.map((entry, index) => (
                                        <div
                                            key={index}
                                            className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    {getTypeIcon(entry.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge
                                                        variant={getTypeBadgeVariant(
                                                            entry.type
                                                        )}
                                                        className="text-xs"
                                                    >
                                                        {getTypeLabel(
                                                            entry.type
                                                        )}
                                                    </Badge>
                                                    {entry.breaking && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="text-xs"
                                                        >
                                                            Thay đổi lớn
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="font-medium text-gray-900 mb-1">
                                                    {entry.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {entry.description}
                                                </p>
                                                {entry.author && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <User className="w-3 h-3" />
                                                        {entry.author}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            {/* Footer */}
            <div className="text-center py-8 border-t">
                <p className="text-sm text-gray-500">
                    Để báo cáo lỗi hoặc đề xuất tính năng mới, vui lòng liên hệ
                    với đội phát triển.
                </p>
            </div>
        </div>
    );
}
