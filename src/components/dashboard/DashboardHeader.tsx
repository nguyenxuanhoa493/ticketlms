interface DashboardHeaderProps {
    userName?: string;
    userEmail?: string;
}

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
            <p className="text-gray-600 mt-2">
                Xin chào, {userName || userEmail}! Đây là tổng quan hệ thống của
                bạn.
            </p>
        </div>
    );
}
