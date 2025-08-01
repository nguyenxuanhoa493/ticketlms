import React from "react";
import { TicketPriorityBadge } from "@/components/ticket-badges";

export function PriorityBadgeDemo() {
    return (
        <div className="space-y-6 p-6 bg-white rounded-lg border">
            <h2 className="text-xl font-bold text-gray-900">Priority Badges với SVG Icons</h2>
            
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Các mức ưu tiên:</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <TicketPriorityBadge priority="low" size="sm" />
                            <span className="text-sm text-gray-600">Low Priority</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TicketPriorityBadge priority="medium" size="sm" />
                            <span className="text-sm text-gray-600">Medium Priority</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TicketPriorityBadge priority="high" size="sm" />
                            <span className="text-sm text-gray-600">High Priority</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Các kích thước:</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <TicketPriorityBadge priority="high" size="sm" />
                            <span className="text-sm text-gray-600">Small</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TicketPriorityBadge priority="high" size="md" />
                            <span className="text-sm text-gray-600">Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TicketPriorityBadge priority="high" size="lg" />
                            <span className="text-sm text-gray-600">Large</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Trong dropdown context:</h3>
                    <div className="border rounded-md p-4 bg-gray-50">
                        <div className="text-sm text-gray-600 mb-2">Select Priority:</div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                                <TicketPriorityBadge priority="low" size="sm" />
                                <span>Low Priority</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                                <TicketPriorityBadge priority="medium" size="sm" />
                                <span>Medium Priority</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                                <TicketPriorityBadge priority="high" size="sm" />
                                <span>High Priority</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 