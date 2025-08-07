import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportTrendsProps {
    trends: Array<{
        date: string;
        created: number;
        closed: number;
    }>;
}

export function ReportTrends({ trends }: ReportTrendsProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", { 
            month: "short", 
            day: "numeric" 
        });
    };

    const maxValue = Math.max(
        ...trends.map(t => Math.max(t.created, t.closed))
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Xu hướng tickets theo thời gian</CardTitle>
                <p className="text-sm text-gray-600">
                    Biểu đồ thể hiện số lượng tickets được tạo và đóng theo ngày
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Legend */}
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span>Tickets được tạo</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Tickets được đóng</span>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="space-y-2">
                        {trends.map((trend, index) => (
                            <div key={trend.date} className="flex items-center space-x-4">
                                <div className="w-16 text-xs text-gray-500">
                                    {formatDate(trend.date)}
                                </div>
                                
                                <div className="flex-1 flex items-end space-x-1 h-8">
                                    {/* Created bar */}
                                    <div 
                                        className="bg-blue-500 rounded-t"
                                        style={{
                                            width: `${(trend.created / maxValue) * 100}%`,
                                            height: `${Math.max((trend.created / maxValue) * 100, 4)}%`,
                                            minHeight: '4px'
                                        }}
                                        title={`${trend.created} tickets được tạo`}
                                    />
                                    
                                    {/* Closed bar */}
                                    <div 
                                        className="bg-green-500 rounded-t"
                                        style={{
                                            width: `${(trend.closed / maxValue) * 100}%`,
                                            height: `${Math.max((trend.closed / maxValue) * 100, 4)}%`,
                                            minHeight: '4px'
                                        }}
                                        title={`${trend.closed} tickets được đóng`}
                                    />
                                </div>
                                
                                <div className="w-20 text-xs text-gray-600">
                                    <div className="text-blue-600">{trend.created}</div>
                                    <div className="text-green-600">{trend.closed}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="font-medium text-gray-700">Tổng tickets được tạo:</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {trends.reduce((sum, t) => sum + t.created, 0)}
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-gray-700">Tổng tickets được đóng:</div>
                                <div className="text-2xl font-bold text-green-600">
                                    {trends.reduce((sum, t) => sum + t.closed, 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
