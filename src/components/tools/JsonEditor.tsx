"use client";

import React, { useRef } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Wand2 } from "lucide-react";

interface JsonEditorProps {
    value: string;
    onChange: (value: string) => void;
    height?: string;
    readOnly?: boolean;
}

export function JsonEditor({
    value,
    onChange,
    height = "300px",
    readOnly = false,
}: JsonEditorProps) {
    const [isValid, setIsValid] = React.useState(true);
    const [error, setError] = React.useState<string>("");

    const handleChange = (newValue: string | undefined) => {
        const val = newValue || "";
        onChange(val);
        
        // Validate JSON
        try {
            if (val.trim()) {
                JSON.parse(val);
                setIsValid(true);
                setError("");
            }
        } catch (e) {
            setIsValid(false);
            setError(e instanceof Error ? e.message : "Invalid JSON");
        }
    };

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(value);
            const formatted = JSON.stringify(parsed, null, 2);
            onChange(formatted);
            setIsValid(true);
            setError("");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Cannot format invalid JSON");
        }
    };

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isValid ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>Valid JSON</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                            <XCircle className="w-4 h-4" />
                            <span>Invalid JSON</span>
                        </div>
                    )}
                </div>
                
                {!readOnly && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFormat}
                        disabled={!value.trim()}
                    >
                        <Wand2 className="w-4 h-4 mr-1" />
                        Format
                    </Button>
                )}
            </div>

            {/* Error Message */}
            {error && !isValid && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {error}
                </div>
            )}

            {/* Editor */}
            <div className="border rounded-lg overflow-hidden">
                <Editor
                    height={height}
                    defaultLanguage="json"
                    value={value}
                    onChange={handleChange}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: "on",
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        readOnly: readOnly,
                        automaticLayout: true,
                        tabSize: 2,
                        formatOnPaste: true,
                        formatOnType: true,
                        wordWrap: "on",
                        wrappingIndent: "indent",
                        suggest: {
                            showWords: false,
                        },
                        quickSuggestions: false,
                        folding: true,
                        foldingHighlight: true,
                        bracketPairColorization: {
                            enabled: true,
                        },
                    }}
                />
            </div>
        </div>
    );
}
