import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
    priority: string;
    count: number;
    percentage: number;
}

interface ReportChartsProps {
    priorityStats: Array<{
        priority: string;
        count: number;
        percentage: number;
    }>;
    platformStats: Array<{
        platform: string;
        count: number;
        percentage: number;
    }>;
    typeStats: Array<{
        type: string;
        count: number;
        percentage: number;
    }>;
}

export function ReportCharts({ priorityStats, platformStats, typeStats }: ReportChartsProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "bg-red-500";
            case "medium": return "bg-yellow-500";
            case "low": return "bg-green-500";
            default: return "bg-gray-500";
        }
    };

    const getPlatformColor = (platform: string) => {
        switch (platform) {
            case "web": return "bg-blue-500";
            case "app": return "bg-purple-500";
            case "all": return "bg-indigo-500";
            default: return "bg-gray-500";
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "bug": return "bg-red-500";
            case "task": return "bg-blue-500";
            default: return "bg-gray-500";
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case "high": return "Cao";
            case "medium": return "Trung bình";
            case "low": return "Thấp";
            default: return priority;
        }
    };

    const getPlatformLabel = (platform: string) => {
        switch (platform) {
            case "web": return "Web";
            case "app": return "Mobile App";
            case "all": return "Tất cả";
            default: return platform;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "bug": return "Lỗi";
            case "task": return "Nhiệm vụ";
            default: return type;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Phân bố theo độ ưu tiên</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {priorityStats.map((stat) => (
                            <div key={stat.priority} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(stat.priority)}`} />
                                    <span className="text-sm font-medium">
                                        {getPriorityLabel(stat.priority)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold">{stat.count}</div>
                                    <div className="text-xs text-gray-500">{stat.percentage.toFixed(1)}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Platform Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Phân bố theo nền tảng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {platformStats.map((stat) => (
                            <div key={stat.platform} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${getPlatformColor(stat.platform)}`} />
                                    <span className="text-sm font-medium">
                                        {getPlatformLabel(stat.platform)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold">{stat.count}</div>
                                    <div className="text-xs text-gray-500">{stat.percentage.toFixed(1)}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Type Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Phân bố theo loại</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {typeStats.map((stat) => (
                            <div key={stat.type} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${getTypeColor(stat.type)}`} />
                                    <span className="text-sm font-medium">
                                        {getTypeLabel(stat.type)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold">{stat.count}</div>
                                    <div className="text-xs text-gray-500">{stat.percentage.toFixed(1)}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
