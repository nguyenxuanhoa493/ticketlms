import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (url: string, text: string) => void;
    selectedText?: string;
}

const LinkModal: React.FC<LinkModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    selectedText = "",
}) => {
    const [url, setUrl] = useState("");
    const [text, setText] = useState("");

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setUrl("");
            setText(selectedText || "");
        }
    }, [isOpen, selectedText]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            alert("Vui lòng nhập URL");
            return;
        }

        let finalUrl = url.trim();

        // Add protocol if missing
        if (
            !finalUrl.startsWith("http://") &&
            !finalUrl.startsWith("https://")
        ) {
            finalUrl = "https://" + finalUrl;
        }

        // Use selected text or URL as display text
        const finalText = text.trim() || finalUrl;

        onConfirm(finalUrl, finalText);
        onClose();
    };

    const handleCancel = () => {
        setUrl("");
        setText("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleCancel}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Chèn liên kết</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">URL *</Label>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="text">Văn bản hiển thị</Label>
                        <Input
                            id="text"
                            type="text"
                            placeholder="Nhập văn bản hiển thị (tùy chọn)"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        {selectedText && (
                            <p className="text-xs text-gray-500">
                                Văn bản đã chọn: "{selectedText}"
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                        >
                            Hủy
                        </Button>
                        <Button type="submit">Chèn liên kết</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default LinkModal;
