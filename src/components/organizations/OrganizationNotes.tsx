"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/common/RichTextEditor";
import HtmlContent from "@/components/common/HtmlContent";
import { useToast } from "@/hooks/use-toast";
import { StickyNote, Pin, Trash2, Edit, X } from "lucide-react";
import { Database } from "@/types/database";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type OrganizationNote = Database["public"]["Tables"]["organization_notes"]["Row"];

interface NoteWithUser extends OrganizationNote {
    user?: {
        full_name: string | null;
    } | null;
}

interface Props {
    organizationId: string;
}

export default function OrganizationNotes({ organizationId }: Props) {
    const { toast } = useToast();
    const [notes, setNotes] = useState<NoteWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [newNote, setNewNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [organizationId]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/organizations/${organizationId}/notes`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch notes");
            }

            setNotes(data.notes || []);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to load notes";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            toast({
                title: "Lỗi",
                description: "Nội dung ghi chú không được để trống",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch(`/api/organizations/${organizationId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newNote }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to create note");
            }

            toast({
                title: "Thành công",
                description: "Đã thêm ghi chú",
            });
            setNewNote("");
            setIsAdding(false);
            fetchNotes();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể thêm ghi chú";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateNote = async (noteId: string, content: string) => {
        try {
            setSubmitting(true);
            const response = await fetch(`/api/organizations/${organizationId}/notes`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: noteId, content }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to update note");
            }

            toast({
                title: "Thành công",
                description: "Đã cập nhật ghi chú",
            });
            setEditingNoteId(null);
            fetchNotes();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật ghi chú";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePin = async (noteId: string, isPinned: boolean) => {
        try {
            const response = await fetch(`/api/organizations/${organizationId}/notes`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: noteId, is_pinned: !isPinned }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to update note");
            }

            fetchNotes();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            const response = await fetch(`/api/organizations/${organizationId}/notes?id=${noteId}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to delete note");
            }

            toast({
                title: "Thành công",
                description: "Đã xóa ghi chú",
            });
            fetchNotes();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể xóa ghi chú";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const pinnedNotes = notes.filter((n) => n.is_pinned);
    const regularNotes = notes.filter((n) => !n.is_pinned);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                        <StickyNote className="h-5 w-5" />
                        <span>Ghi chú</span>
                    </CardTitle>
                    {!isAdding && (
                        <Button onClick={() => setIsAdding(true)} size="sm">
                            Thêm ghi chú
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isAdding && (
                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                        <RichTextEditor
                            value={newNote}
                            onChange={setNewNote}
                            placeholder="Nhập nội dung ghi chú..."
                            minHeight="min-h-24"
                        />
                        <div className="flex space-x-2">
                            <Button onClick={handleAddNote} disabled={submitting} size="sm">
                                {submitting ? "Đang lưu..." : "Lưu"}
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewNote("");
                                }}
                                variant="outline"
                                size="sm"
                            >
                                Hủy
                            </Button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Chưa có ghi chú nào</p>
                    </div>
                ) : (
                    <>
                        {pinnedNotes.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                                    <Pin className="h-4 w-4" />
                                    <span>Đã ghim</span>
                                </h3>
                                {pinnedNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isEditing={editingNoteId === note.id}
                                        onEdit={() => setEditingNoteId(note.id)}
                                        onCancelEdit={() => setEditingNoteId(null)}
                                        onUpdate={handleUpdateNote}
                                        onTogglePin={handleTogglePin}
                                        onDelete={handleDeleteNote}
                                        submitting={submitting}
                                    />
                                ))}
                            </div>
                        )}

                        {regularNotes.length > 0 && (
                            <div className="space-y-3">
                                {pinnedNotes.length > 0 && (
                                    <h3 className="text-sm font-semibold text-gray-700">Ghi chú khác</h3>
                                )}
                                {regularNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isEditing={editingNoteId === note.id}
                                        onEdit={() => setEditingNoteId(note.id)}
                                        onCancelEdit={() => setEditingNoteId(null)}
                                        onUpdate={handleUpdateNote}
                                        onTogglePin={handleTogglePin}
                                        onDelete={handleDeleteNote}
                                        submitting={submitting}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

interface NoteCardProps {
    note: NoteWithUser;
    isEditing: boolean;
    onEdit: () => void;
    onCancelEdit: () => void;
    onUpdate: (noteId: string, content: string) => void;
    onTogglePin: (noteId: string, isPinned: boolean) => void;
    onDelete: (noteId: string) => void;
    submitting: boolean;
}

function NoteCard({
    note,
    isEditing,
    onEdit,
    onCancelEdit,
    onUpdate,
    onTogglePin,
    onDelete,
    submitting,
}: NoteCardProps) {
    const [editContent, setEditContent] = useState(note.content);

    return (
        <div
            className={`border rounded-lg p-4 space-y-2 ${
                note.is_pinned ? "bg-yellow-50 border-yellow-200" : "bg-white"
            }`}
        >
            {isEditing ? (
                <>
                    <RichTextEditor
                        value={editContent}
                        onChange={setEditContent}
                        placeholder="Nhập nội dung ghi chú..."
                        minHeight="min-h-24"
                    />
                    <div className="flex space-x-2">
                        <Button
                            onClick={() => onUpdate(note.id, editContent)}
                            disabled={submitting}
                            size="sm"
                        >
                            {submitting ? "Đang lưu..." : "Lưu"}
                        </Button>
                        <Button onClick={onCancelEdit} variant="outline" size="sm">
                            Hủy
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <HtmlContent content={note.content} />
                    <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                        <div>
                            <span>{note.user?.full_name || "Unknown"}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(note.created_at).toLocaleDateString("vi-VN")}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button
                                onClick={() => onTogglePin(note.id, note.is_pinned)}
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                            >
                                <Pin
                                    className={`h-4 w-4 ${
                                        note.is_pinned ? "fill-yellow-600 text-yellow-600" : ""
                                    }`}
                                />
                            </Button>
                            <Button onClick={onEdit} variant="ghost" size="sm" className="h-7 px-2">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể
                                            hoàn tác.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDelete(note.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Xóa
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
