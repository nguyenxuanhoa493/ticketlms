import React from 'react';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { TicketTypeBadge } from './TicketTypeBadge';
import { AnimatedStatusBadge } from './AnimatedStatusBadge';
import { TicketStatus, TicketPriority, TicketType } from '@/lib/ticket-utils';

export function TicketBadgeUsageDemo() {
    const handleStatusClick = (status: TicketStatus) => {
        console.log(`Status clicked: ${status}`);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Cách sử dụng Badge trong màn hình Ticket</h3>
                <p className="text-gray-600 mb-4">
                    Các badge đã được cập nhật với icon và animation để hiển thị trực quan hơn
                </p>
            </div>

            {/* View Mode Demo */}
            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">View Mode - Hiển thị thông tin ticket</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Loại ticket</label>
                        <div>
                            <TicketTypeBadge type="bug" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                        <div>
                            <TicketStatusBadge status="in_progress" size="md" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Ưu tiên</label>
                        <div>
                            <TicketPriorityBadge priority="high" size="md" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Mode Demo */}
            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Table Mode - Hiển thị trong bảng</h4>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Loại</th>
                                <th className="text-left p-2">Trạng thái</th>
                                <th className="text-left p-2">Ưu tiên</th>
                                <th className="text-left p-2">Tiêu đề</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b hover:bg-gray-50">
                                <td className="p-2">
                                    <TicketTypeBadge type="bug" />
                                </td>
                                <td className="p-2">
                                    <TicketStatusBadge status="open" size="sm" />
                                </td>
                                <td className="p-2">
                                    <TicketPriorityBadge priority="high" size="sm" />
                                </td>
                                <td className="p-2">Fix login button</td>
                            </tr>
                            <tr className="border-b hover:bg-gray-50">
                                <td className="p-2">
                                    <TicketTypeBadge type="task" />
                                </td>
                                <td className="p-2">
                                    <TicketStatusBadge status="in_progress" size="sm" />
                                </td>
                                <td className="p-2">
                                    <TicketPriorityBadge priority="medium" size="sm" />
                                </td>
                                <td className="p-2">Update user profile</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="p-2">
                                    <TicketTypeBadge type="feature" />
                                </td>
                                <td className="p-2">
                                    <TicketStatusBadge status="closed" size="sm" />
                                </td>
                                <td className="p-2">
                                    <TicketPriorityBadge priority="low" size="sm" />
                                </td>
                                <td className="p-2">Add dark mode</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Interactive Demo */}
            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Interactive Demo - Clickable badges</h4>
                <div className="flex flex-wrap gap-4">
                    <div className="text-center">
                        <AnimatedStatusBadge 
                            status="open" 
                            clickable={true}
                            onClick={() => handleStatusClick('open')}
                        />
                        <p className="text-xs text-gray-500 mt-1">Click để thay đổi</p>
                    </div>
                    <div className="text-center">
                        <AnimatedStatusBadge 
                            status="in_progress" 
                            clickable={true}
                            onClick={() => handleStatusClick('in_progress')}
                        />
                        <p className="text-xs text-gray-500 mt-1">Click để thay đổi</p>
                    </div>
                    <div className="text-center">
                        <AnimatedStatusBadge 
                            status="closed" 
                            clickable={true}
                            onClick={() => handleStatusClick('closed')}
                        />
                        <p className="text-xs text-gray-500 mt-1">Click để thay đổi</p>
                    </div>
                </div>
            </div>

            {/* Variants Demo */}
            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Các variant khác nhau</h4>
                <div className="space-y-3">
                    <div>
                        <span className="text-sm font-medium text-gray-500 mr-3">Default:</span>
                        <TicketStatusBadge status="open" variant="default" />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-500 mr-3">Outline:</span>
                        <TicketStatusBadge status="in_progress" variant="outline" />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-500 mr-3">Solid:</span>
                        <TicketStatusBadge status="closed" variant="solid" />
                    </div>
                </div>
            </div>
        </div>
    );
} 