"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

interface JsonViewerProps {
    data: any;
    maxHeight?: string;
    minHeight?: string;
}

export function JsonViewer({ data, maxHeight = "200px", minHeight = "100px" }: JsonViewerProps) {
    const editorRef = useRef<any>(null);

    const jsonString = typeof data === "string" 
        ? data 
        : JSON.stringify(data, null, 2);

    useEffect(() => {
        if (editorRef.current) {
            // Auto-format on mount
            editorRef.current.getAction("editor.action.formatDocument")?.run();
        }
    }, [jsonString]);

    return (
        <div 
            className="border rounded overflow-hidden"
            style={{ 
                maxHeight, 
                minHeight,
                height: "auto"
            }}
        >
            <Editor
                height={maxHeight}
                defaultLanguage="json"
                value={jsonString}
                theme="light"
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                    lineNumbers: "on",
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: "none",
                    scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                    },
                    wordWrap: "on",
                    automaticLayout: true,
                }}
                onMount={(editor) => {
                    editorRef.current = editor;
                }}
            />
        </div>
    );
}
