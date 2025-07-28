import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Bold,
    Italic,
    Underline,
    List,
    Link,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Image,
    Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import LinkModal from "./LinkModal";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    maxHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Nhập nội dung...",
    className = "",
    minHeight = "min-h-32",
    maxHeight,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const [savedSelection, setSavedSelection] = useState<Range | null>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const formatText = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
        handleInput();
    };

    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            return selection.getRangeAt(0).cloneRange();
        }
        return null;
    };

    const restoreSelection = (range: Range) => {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    };

    const openLinkModal = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const text = range.toString().trim();

            // Save the current selection
            setSavedSelection(range.cloneRange());
            setSelectedText(text);
        } else {
            setSavedSelection(null);
            setSelectedText("");
        }

        setShowLinkModal(true);
    };

    const insertLink = (url: string, text: string) => {
        editorRef.current?.focus();

        if (savedSelection) {
            // Restore the saved selection
            restoreSelection(savedSelection);

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                // Create link element
                const link = document.createElement("a");
                link.href = url;
                link.textContent = text;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.style.color = "#2563eb";
                link.style.textDecoration = "underline";

                // Replace selected content with link
                range.deleteContents();
                range.insertNode(link);

                // Move cursor after link
                range.setStartAfter(link);
                range.setEndAfter(link);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            // No selection, insert at cursor position
            const link = document.createElement("a");
            link.href = url;
            link.textContent = text;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.style.color = "#2563eb";
            link.style.textDecoration = "underline";

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.insertNode(link);

                // Move cursor after link
                range.setStartAfter(link);
                range.setEndAfter(link);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // Fallback: append to editor
                editorRef.current?.appendChild(link);
            }
        }

        handleInput();
    };

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        try {
            // Get current user session
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                alert("Bạn cần đăng nhập để upload ảnh");
                return;
            }

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload/image", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                // Insert image into editor
                insertImage(result.url, file.name);
            } else {
                alert(result.error || "Lỗi upload ảnh");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Lỗi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    const insertImage = (url: string, alt: string = "") => {
        const img = document.createElement("img");
        img.src = url;
        img.alt = alt;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.margin = "8px 0";
        img.style.borderRadius = "4px";

        // Insert image at cursor position
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);

            // Move cursor after image
            range.setStartAfter(img);
            range.setEndAfter(img);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Fallback: append to editor
            editorRef.current?.appendChild(img);
        }

        editorRef.current?.focus();
        handleInput();
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
            ];
            if (!allowedTypes.includes(file.type)) {
                alert("Chỉ hỗ trợ file ảnh: JPEG, PNG, GIF, WebP");
                return;
            }

            // Validate file size (5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                alert("File quá lớn. Tối đa 5MB");
                return;
            }

            handleImageUpload(file);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const openImageUpload = () => {
        fileInputRef.current?.click();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case "b":
                    e.preventDefault();
                    formatText("bold");
                    break;
                case "i":
                    e.preventDefault();
                    formatText("italic");
                    break;
                case "u":
                    e.preventDefault();
                    formatText("underline");
                    break;
            }
        }
    };

    return (
        <div className={`border rounded-md ${className}`}>
            {/* Toolbar */}
            <div className="border-b p-2 flex flex-wrap gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("bold")}
                    className="h-8 w-8 p-0"
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("italic")}
                    className="h-8 w-8 p-0"
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("underline")}
                    className="h-8 w-8 p-0"
                    title="Underline (Ctrl+U)"
                >
                    <Underline className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("justifyLeft")}
                    className="h-8 w-8 p-0"
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("justifyCenter")}
                    className="h-8 w-8 p-0"
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("justifyRight")}
                    className="h-8 w-8 p-0"
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("insertUnorderedList")}
                    className="h-8 w-8 p-0"
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={openLinkModal}
                    className="h-8 w-8 p-0"
                    title="Insert Link"
                >
                    <Link className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={openImageUpload}
                    disabled={uploading}
                    className="h-8 w-8 p-0"
                    title="Upload Image"
                >
                    {uploading ? (
                        <Upload className="w-4 h-4 animate-spin" />
                    ) : (
                        <Image className="w-4 h-4" />
                    )}
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("removeFormat")}
                    className="h-8 px-2 text-xs"
                    title="Clear Formatting"
                >
                    Clear
                </Button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className={`p-3 focus:outline-none ${minHeight} ${
                    maxHeight || ""
                } overflow-y-auto`}
                style={{
                    minHeight: "80px",
                    lineHeight: "1.5",
                }}
                suppressContentEditableWarning={true}
                data-placeholder={placeholder}
            />

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
            />

            {/* Link Modal */}
            <LinkModal
                isOpen={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                onConfirm={insertLink}
                selectedText={selectedText}
            />

            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
                [contenteditable] a {
                    color: #2563eb;
                    text-decoration: underline;
                }
                [contenteditable] ul {
                    margin: 8px 0;
                    padding-left: 20px;
                }
                [contenteditable] li {
                    margin: 4px 0;
                }
                [contenteditable] img {
                    max-width: 100%;
                    height: auto;
                    margin: 8px 0;
                    border-radius: 4px;
                    border: 1px solid #e5e7eb;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
