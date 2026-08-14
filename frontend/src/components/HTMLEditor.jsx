import { useRef, useCallback, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { indentMore, indentLess } from '@codemirror/commands';
import './HTMLEditor.css';

function formatHtml(html) {
    const tab = '    ';
    let formatted = '';
    let indentLevel = 0;
    html = html.replace(/>\s+</g, '><').trim();
    const parts = html.split(/(<[^>]+>)/g);
    for (const part of parts) {
        if (!part.trim()) continue;
        const isClosingTag = part.startsWith('</');
        const isSelfClosing = part.endsWith('/>');
        const isComment = part.startsWith('<!--');
        const isDoctype = part.startsWith('<!');
        const isOpeningTag = !isClosingTag && !isSelfClosing && !isComment && !isDoctype && part.startsWith('<');
        if (isClosingTag) indentLevel = Math.max(0, indentLevel - 1);
        formatted += tab.repeat(indentLevel) + part + '\n';
        if (isOpeningTag) indentLevel++;
    }
    return formatted.trim();
}

const HTMLEditor = forwardRef(function HTMLEditor({ value = '', onChange, placeholder = '', fullscreen = false, theme = 'dark' }, ref) {
    const cmRef = useRef(null);
    const containerRef = useRef(null);
    const [editorHeight, setEditorHeight] = useState(fullscreen ? '100%' : '500px');

    useEffect(() => {
        if (!fullscreen) {
            setEditorHeight('500px');
            return;
        }
        const container = containerRef.current;
        if (!container) return;

        const updateHeight = () => {
            const height = container.clientHeight;
            if (height > 0) {
                setEditorHeight(`${height}px`);
            }
        };

        updateHeight();

        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [fullscreen]);

    const formatDocument = useCallback(() => {
        const formatted = formatHtml(value);
        onChange?.(formatted);
    }, [value, onChange]);

    const indent = useCallback(() => {
        const view = cmRef.current?.view;
        if (view) {
            indentMore({ state: view.state, dispatch: view.dispatch });
        }
    }, []);

    const outdent = useCallback(() => {
        const view = cmRef.current?.view;
        if (view) {
            indentLess({ state: view.state, dispatch: view.dispatch });
        }
    }, []);

    useImperativeHandle(ref, () => ({
        indent,
        outdent,
        formatDocument,
    }));

    return (
        <div ref={containerRef} className={`source-editor-container ${fullscreen ? 'fullscreen' : ''}`}>
            <CodeMirror
                ref={cmRef}
                value={value}
                height={editorHeight}
                theme={theme}
                extensions={[html()]}
                onChange={onChange}
                placeholder={placeholder}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    highlightSpecialChars: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLineGutter: true,
                }}
            />
        </div>
    );
});

export default HTMLEditor;
