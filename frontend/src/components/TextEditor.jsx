import { useState, useRef, useEffect, useLayoutEffect, useCallback, useContext } from 'react';
import {
    Bold, Italic, Underline, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Undo2, Redo2, RemoveFormatting, Type, Link,
    Palette, Quote, Code, Indent, Outdent,
    Minus, FileCode2, Image, Upload, Trash2, ChevronDown, Table, Play
} from 'lucide-react';
import { Maximize2, Minimize2 } from 'lucide-react';
import CustomColorPicker from './CustomColorPicker';
import HTMLEditor from './HTMLEditor';
import { ThemeContext } from '../context/ThemeContext';
import './TextEditor.css';

export default function TextEditor({ value = '', onChange, placeholder = 'Tulis konten di sini...', id }) {
    const editorRef = useRef(null);
    const htmlEditorRef = useRef(null);
    const imageFileRef = useRef(null);
    const { theme } = useContext(ThemeContext);
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const [isFocused, setIsFocused] = useState(false);
    const [activeFormats, setActiveFormats] = useState({});
    const [foreColor, _setForeColor] = useState('');
    const [hiliteColor, _setHiliteColor] = useState('');
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [showImageForm, setShowImageForm] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [imageWidth, setImageWidth] = useState('');
    const [imageCaption, setImageCaption] = useState('');
    const [imageUploadMode, setImageUploadMode] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageUploadError, setImageUploadError] = useState('');
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const [imageDeletePos, setImageDeletePos] = useState({ top: 0, left: 0 });
    const [imageDeleteLoading, setImageDeleteLoading] = useState(false);
    const [showTableForm, setShowTableForm] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [showTableToolbar, setShowTableToolbar] = useState(false);
    const [tableToolbarPos, setTableToolbarPos] = useState({ top: 0, left: 0 });
    const [selectedTableCell, setSelectedTableCell] = useState(null);
    const [sourceMode, setSourceMode] = useState(false);
    const [sourceValue, setSourceValue] = useState('');
    const [fullscreen, setFullscreen] = useState(false);
    const [showColorPopup, setShowColorPopup] = useState(false);
    const [colorPopupCommand, setColorPopupCommand] = useState('foreColor');
    const [showEmbedForm, setShowEmbedForm] = useState(false);
    const [embedUrl, setEmbedUrl] = useState('');
    const [embedWidth, setEmbedWidth] = useState('');
    const [embedHeight, setEmbedHeight] = useState('');
    const [editingEmbed, setEditingEmbed] = useState(false);
    const [selectedEmbedUrl, setSelectedEmbedUrl] = useState('');
    const [embedDeletePos, setEmbedDeletePos] = useState({ top: 0, left: 0 });
    const selectedEmbedRef = useRef(null);
    const savedRangeRef = useRef(null);
    const lastRangeRef = useRef(null);
    const [fontSize, setFontSize] = useState('');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [canUndoSource, setCanUndoSource] = useState(false);
    const [canRedoSource, setCanRedoSource] = useState(false);
    const sourceHistoryRef = useRef({ stack: [], index: -1 });
    const ignoreValueChangeRef = useRef(false);
    const pendingSourceHtmlRef = useRef('');
    const visualHistoryRef = useRef({ stack: [], index: -1 });
    const visualInitialHtmlRef = useRef('');
    const visualRedoAvailableRef = useRef(false);

    const escapeHtml = useCallback((text) => {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }, []);

    const countWords = useCallback((html) => {
        if (!html) return { words: 0, chars: 0 };
        const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        const chars = text.length;
        return { words, chars };
    }, []);

    const [stats, setStats] = useState(() => countWords(value));

    const saveSelection = useCallback(() => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            savedRangeRef.current = selection.getRangeAt(0).cloneRange();
        }
    }, []);

    const restoreSelection = useCallback(() => {
        if (savedRangeRef.current) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedRangeRef.current);
        }
    }, []);

    useEffect(() => {
        if (ignoreValueChangeRef.current) {
            ignoreValueChangeRef.current = false;
            return;
        }
        if (!sourceMode && editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
            setStats(countWords(value));
        }
        if (value && sourceHistoryRef.current.stack.length === 0) {
            sourceHistoryRef.current = { stack: [value], index: 0 };
            setCanUndoSource(false);
            setCanRedoSource(false);
        }
        if (!sourceMode && value) {
            visualInitialHtmlRef.current = value;
            visualHistoryRef.current = { stack: [value], index: 0 };
            visualRedoAvailableRef.current = false;
            setCanUndo(false);
            setCanRedo(false);
        }
    }, [value, sourceMode, countWords]);

    useEffect(() => {
        if (sourceMode && value !== sourceValue) {
            setSourceValue(value);
        }
    }, [value, sourceMode, sourceValue]);

    useEffect(() => {
        if (!editorRef.current || sourceMode) return;
        const editor = editorRef.current;

        const updateEmptyClass = () => {
            const text = editor.textContent?.trim() || '';
            if (!text) {
                editor.classList.add('is-empty');
            } else {
                editor.classList.remove('is-empty');
            }
        };

        updateEmptyClass();

        const observer = new MutationObserver(updateEmptyClass);
        observer.observe(editor, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => observer.disconnect();
    }, [sourceMode]);

    useEffect(() => {
        try {
            document.execCommand('styleWithCSS', false, true);
        } catch {}
    }, []);

    useLayoutEffect(() => {
        if (!selectedImageUrl || !editorRef.current) return;
        const img = editorRef.current.querySelector(`img[src="${selectedImageUrl.replace(/["']/g, '')}"]`);
        if (img) {
            const rect = img.getBoundingClientRect();
            setImageDeletePos({
                top: rect.top - 40,
                left: rect.right - 120,
            });
        }
    }, [selectedImageUrl]);

    useLayoutEffect(() => {
        if (!selectedEmbedUrl || !editorRef.current) return;
        const wrapper = editorRef.current.querySelector('.embed-wrapper');
        if (wrapper) {
            const rect = wrapper.getBoundingClientRect();
            setEmbedDeletePos({
                top: rect.top - 40,
                left: rect.right - 120,
            });
        }
    }, [selectedEmbedUrl]);

    const rafIdRef = useRef(null);
    const pendingUpdatesRef = useRef([]);

    const scheduleUpdate = useCallback((fn) => {
        pendingUpdatesRef.current.push(fn);
        if (rafIdRef.current) {
            return;
        }
        rafIdRef.current = requestAnimationFrame(() => {
            const updates = pendingUpdatesRef.current;
            pendingUpdatesRef.current = [];
            updates.forEach((fn) => fn());
            rafIdRef.current = null;
        });
    }, []);

    const refreshUndoRedoState = useCallback(() => {
        if (sourceMode) {
            const history = sourceHistoryRef.current;
            setCanUndoSource(history.index > 0);
            setCanRedoSource(history.index < history.stack.length - 1);
        } else {
            const history = visualHistoryRef.current;
            setCanUndo(history.index > 0);
            setCanRedo(history.index < history.stack.length - 1);
        }
    }, [sourceMode]);

    useEffect(() => () => {
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }
    }, []);

    const refreshStats = useCallback(() => {
        if (!sourceMode && editorRef.current) {
            setStats(countWords(editorRef.current.innerHTML));
        }
    }, [sourceMode, countWords]);

    const updateActiveFormats = useCallback(() => {
        if (!editorRef.current) return;
        const selection = window.getSelection();
        let anchorNode = null;
        let anchorElement = null;
        if (selection.rangeCount > 0) {
            lastRangeRef.current = selection.getRangeAt(0).cloneRange();
            anchorNode = selection.getRangeAt(0).commonAncestorContainer;
        } else if (lastRangeRef.current) {
            anchorNode = lastRangeRef.current.commonAncestorContainer;
        }
        if (anchorNode) {
            anchorElement = anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
        }

        const computedCache = new Map();
        const ancestorChain = [];
        {
            let current = anchorElement;
            while (current && current !== editorRef.current && current !== editorRef.current.parentElement) {
                ancestorChain.push(current);
                current = current.parentElement;
            }
        }
        let detectedBlock = '';
        for (const node of ancestorChain) {
            const tag = node.tagName;
            if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV', 'BLOCKQUOTE', 'PRE'].includes(tag)) {
                detectedBlock = tag;
                if (tag !== 'DIV' && tag !== 'P') break;
            }
        }
        const blockLower = detectedBlock.toLowerCase();
        let bold = false, italic = false, underline = false, ul = false, ol = false;
        let alignLeft = false, alignCenter = false, alignRight = false, justifyFull = false;
        let blockquote = false, pre = false;

        for (const node of ancestorChain) {
            const tag = node.tagName;
            let computed = computedCache.get(node);
            if (!computed) {
                computed = window.getComputedStyle(node);
                computedCache.set(node, computed);
            }
            if (!bold && (tag === 'B' || tag === 'STRONG' || computed.fontWeight === 'bold' || computed.fontWeight === '700' || computed.fontWeight === '800' || computed.fontWeight === '900')) bold = true;
            if (!italic && (tag === 'I' || tag === 'EM' || computed.fontStyle === 'italic')) italic = true;
            if (!underline && (tag === 'U' || computed.textDecoration?.includes('underline'))) underline = true;
            if (!ul && tag === 'UL') ul = true;
            if (!ol && tag === 'OL') ol = true;
            if (!alignLeft && (computed.textAlign === 'left' || computed.textAlign === 'start' || computed.textAlign === '')) alignLeft = true;
            if (!alignCenter && computed.textAlign === 'center') alignCenter = true;
            if (!alignRight && (computed.textAlign === 'right' || computed.textAlign === 'end')) alignRight = true;
            if (!justifyFull && computed.textAlign === 'justify') justifyFull = true;
            if (!blockquote && tag === 'BLOCKQUOTE') blockquote = true;
            if (!pre && tag === 'PRE') pre = true;
        }

        setActiveFormats({
            bold,
            italic,
            underline,
            h1: blockLower === 'h1',
            h2: blockLower === 'h2',
            h3: blockLower === 'h3',
            h4: blockLower === 'h4',
            h5: blockLower === 'h5',
            h6: blockLower === 'h6',
            paragraph: blockLower === 'p' || blockLower === 'div' || blockLower === '',
            ul,
            ol,
            alignLeft,
            alignCenter,
            alignRight,
            justifyFull,
            blockquote,
            pre,
        });

        let detectedFontSize = '';
        if (anchorElement) {
            let node = anchorElement;
            while (node && node !== editorRef.current && node !== editorRef.current.parentElement) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    let computed = computedCache.get(node);
                    if (!computed) {
                        computed = window.getComputedStyle(node);
                        computedCache.set(node, computed);
                    }
                    if (computed.fontSize) {
                        detectedFontSize = computed.fontSize.replace('px', '');
                        break;
                    }
                }
                node = node.parentElement;
            }
        }
        setFontSize(detectedFontSize);
    }, []);

    const applyFontSize = useCallback((size) => {
        if (!editorRef.current || sourceMode) return;
        editorRef.current.focus();

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            const span = document.createElement('span');
            span.style.fontSize = size;
            span.innerHTML = '<br>';

            const html = span.outerHTML;
            document.execCommand('insertHTML', false, html);
        } else {
            const fragment = range.extractContents();
            const wrapper = document.createElement('div');
            wrapper.appendChild(fragment);
            const content = wrapper.innerHTML;

            const html = `<span style="font-size: ${size}">${content}</span>`;
            document.execCommand('insertHTML', false, html);
        }

        setFontSize(size);
        refreshStats();
        updateActiveFormats();
        refreshUndoRedoState();
    }, [sourceMode, refreshStats, updateActiveFormats, refreshUndoRedoState]);

    useEffect(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;

        const handleEditorKeyUp = () => {
            scheduleUpdate(updateActiveFormats);
            scheduleUpdate(refreshStats);
        };

        const handleEditorMouseUp = () => {
            scheduleUpdate(updateActiveFormats);
        };

        editor.addEventListener('keyup', handleEditorKeyUp);
        editor.addEventListener('mouseup', handleEditorMouseUp);

        return () => {
            editor.removeEventListener('keyup', handleEditorKeyUp);
            editor.removeEventListener('mouseup', handleEditorMouseUp);
        };
    }, [updateActiveFormats, refreshStats, scheduleUpdate]);

    useEffect(() => {
        if (!showColorPopup) return;
        const handleClickOutside = (e) => {
            if (!e.target.closest('.toolbar-color-wrapper')) {
                setShowColorPopup(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColorPopup]);

    const valueRef = useRef(value);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const handleInput = useCallback(() => {
        if (!editorRef.current || sourceMode) return;
        const html = editorRef.current.innerHTML;
        if (onChangeRef.current && html !== valueRef.current) {
            ignoreValueChangeRef.current = true;
            onChangeRef.current(html);
        }
        const history = visualHistoryRef.current;
        if (!visualInitialHtmlRef.current && history.stack.length === 0) {
            visualInitialHtmlRef.current = html;
            history.stack = [html];
            history.index = 0;
        } else if (history.index < history.stack.length - 1) {
            history.stack = history.stack.slice(0, history.index + 1);
            history.stack.push(html);
            history.index = history.stack.length - 1;
        } else if (history.stack[history.index] !== html) {
            history.stack.push(html);
            history.index = history.stack.length - 1;
        }
        if (history.stack.length > 100) {
            history.stack.shift();
            history.index -= 1;
        }
        visualRedoAvailableRef.current = false;
        scheduleUpdate(() => {
            setCanUndo(history.index > 0);
            setCanRedo(false);
            refreshStats();
            updateActiveFormats();
        });
    }, [sourceMode, refreshStats, updateActiveFormats, scheduleUpdate]);

    const exec = useCallback((command, arg = null) => {
        if (command === 'undo' || command === 'redo') {
            if (sourceMode) {
                const history = sourceHistoryRef.current;
                if (command === 'undo' && history.index > 0) {
                    history.index -= 1;
                    ignoreValueChangeRef.current = true;
                    onChange?.(history.stack[history.index]);
                } else if (command === 'redo' && history.index < history.stack.length - 1) {
                    history.index += 1;
                    ignoreValueChangeRef.current = true;
                    onChange?.(history.stack[history.index]);
                }
                setCanUndoSource(history.index > 0);
                setCanRedoSource(history.index < history.stack.length - 1);
            } else {
                const history = visualHistoryRef.current;
                if (history.stack.length === 0) {
                    scheduleUpdate(refreshStats);
                    scheduleUpdate(updateActiveFormats);
                    return;
                }
                if (command === 'undo' && history.index > 0) {
                    history.index -= 1;
                } else if (command === 'redo' && history.index < history.stack.length - 1) {
                    history.index += 1;
                } else {
                    scheduleUpdate(refreshStats);
                    scheduleUpdate(updateActiveFormats);
                    return;
                }
                const html = history.stack[history.index];
                if (editorRef.current) {
                    const iframes = editorRef.current.querySelectorAll('iframe');
                    const srcs = Array.from(iframes).map(iframe => iframe.getAttribute('src')).filter(Boolean);
                    editorRef.current.innerHTML = html;
                    const newIframes = editorRef.current.querySelectorAll('iframe');
                    newIframes.forEach((iframe, i) => {
                        if (srcs[i]) {
                            iframe.setAttribute('src', srcs[i]);
                        }
                    });
                }
                if (onChange) {
                    ignoreValueChangeRef.current = true;
                    onChange(html);
                }
                setCanUndo(history.index > 0);
                setCanRedo(history.index < history.stack.length - 1);
            }
            scheduleUpdate(refreshStats);
            scheduleUpdate(updateActiveFormats);
            return;
        }

        if (sourceMode) return;
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (!editorRef.current.contains(range.commonAncestorContainer)) return;

        editorRef.current.focus();
        document.execCommand(command, false, arg);
        scheduleUpdate(refreshStats);
        scheduleUpdate(updateActiveFormats);
    }, [sourceMode, refreshStats, updateActiveFormats, scheduleUpdate, onChange]);

    const handlePaste = useCallback((e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let node = selection.anchorNode;
                if (node && node.nodeType === Node.TEXT_NODE) {
                    node = node.parentElement;
                }
                const embedWrapper = node?.closest?.('.embed-wrapper');
                if (embedWrapper) {
                    e.preventDefault();
                    editorRef.current?.focus();
                    const newBlock = document.createElement('p');
                    newBlock.innerHTML = '<br>';
                    if (embedWrapper.nextSibling) {
                        embedWrapper.parentElement.insertBefore(newBlock, embedWrapper.nextSibling);
                    } else {
                        embedWrapper.parentElement.appendChild(newBlock);
                    }
                    const range = document.createRange();
                    range.setStart(newBlock, 0);
                    range.collapse(true);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    return;
                }
                if (node && (node.nodeName === 'IFRAME' || node.closest?.('iframe'))) {
                    e.preventDefault();
                    editorRef.current?.focus();
                    const iframeEl = node.nodeName === 'IFRAME' ? node : node.closest('iframe');
                    const wrapper = iframeEl?.closest?.('.embed-wrapper');
                    const newBlock = document.createElement('p');
                    newBlock.innerHTML = '<br>';
                    if (wrapper?.nextSibling) {
                        wrapper.parentElement.insertBefore(newBlock, wrapper.nextSibling);
                    } else if (iframeEl?.parentElement) {
                        iframeEl.parentElement.appendChild(newBlock);
                    }
                    const range = document.createRange();
                    range.setStart(newBlock, 0);
                    range.collapse(true);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    return;
                }
            }
        }

        const isModifier = e.ctrlKey || e.metaKey;
        if (!isModifier) return;

        const key = e.key.toLowerCase();
        const isUndo = key === 'z' && !e.shiftKey;
        const isRedo = key === 'y' || (key === 'z' && e.shiftKey);

        if (isUndo) {
            e.preventDefault();
            exec('undo');
            return;
        }
        if (isRedo) {
            e.preventDefault();
            exec('redo');
            return;
        }
    }, [exec]);

    const parseYouTubeUrl = useCallback((url) => {
        if (!url) return null;
        url = url.trim();

        if (url.includes('/embed/')) return url;

        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/watch\?v=)([^&\s]+)/);
        if (match) {
            const videoId = match[1];
            if (url.includes('youtube-nocookie.com')) {
                return `https://www.youtube-nocookie.com/embed/${videoId}`;
            }
            return `https://www.youtube.com/embed/${videoId}`;
        }

        return null;
    }, []);

    const extractYouTubeVideoId = useCallback((embedUrl) => {
        if (!embedUrl) return null;
        const match = embedUrl.match(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([^/?&\s]+)/);
        return match ? match[1] : null;
    }, []);

    const handleEmbedClick = useCallback(() => {
        saveSelection();
        setShowEmbedForm(true);
        setEmbedUrl('');
        setEmbedWidth('');
        setEmbedHeight('');
        setEditingEmbed(false);
        setSelectedEmbedUrl('');
        selectedEmbedRef.current = null;
    }, [saveSelection]);

    const handleEmbedSubmit = useCallback(() => {
        if (!embedUrl || !editorRef.current) return;

        saveSelection();
        editorRef.current.focus();
        restoreSelection();

        let finalUrl = embedUrl.trim();

        const ytUrl = parseYouTubeUrl(finalUrl);
        if (ytUrl) {
            finalUrl = ytUrl;
        }

        try {
            new URL(finalUrl);
        } catch {
            return;
        }

        const widthStyle = embedWidth ? `width: ${embedWidth}; max-width: 100%;` : 'width: 100%;';
        const heightStyle = embedHeight ? `height: ${embedHeight};` : 'height: 315px;';

        if (editingEmbed && selectedEmbedRef.current) {
            const iframe = selectedEmbedRef.current.querySelector('iframe');
            const isYouTubeThumb = selectedEmbedRef.current.querySelector('.youtube-thumb');
            const videoId = extractYouTubeVideoId(iframe?.src || finalUrl);
            
            if (iframe) {
                iframe.src = finalUrl;
            }
            if (isYouTubeThumb && videoId) {
                const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                isYouTubeThumb.src = thumbUrl;
                isYouTubeThumb.dataset.videoId = videoId;
            }
            
            selectedEmbedRef.current.style.width = embedWidth ? `${embedWidth}` : '100%';
            selectedEmbedRef.current.style.maxWidth = '100%';
            selectedEmbedRef.current.style.height = embedHeight ? `${embedHeight}` : '315px';
            if (iframe) {
                iframe.style.width = embedWidth ? `${embedWidth}` : '100%';
                iframe.style.height = embedHeight ? `${embedHeight}` : '315px';
            }
            setShowEmbedForm(false);
            setEmbedUrl('');
            setEmbedWidth('');
            setEmbedHeight('');
            setEditingEmbed(false);
            setSelectedEmbedUrl('');
            selectedEmbedRef.current = null;
            if (onChange && editorRef.current) {
                ignoreValueChangeRef.current = true;
                onChange(editorRef.current.innerHTML);
            }
            refreshStats();
            updateActiveFormats();
            return;
        }

        const videoId = extractYouTubeVideoId(finalUrl);
        const isYouTube = !!videoId;
        let html;

        if (isYouTube) {
            const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            html = `<div class="embed-wrapper youtube-embed" contenteditable="false" data-video-id="${videoId}">
                <div class="youtube-thumb-wrapper" onclick="
                    var wrapper=this.parentNode;
                    var videoId=wrapper.dataset.videoId;
                    if(!wrapper.querySelector('iframe')) {
                        var iframe=document.createElement('iframe');
                        iframe.src='https://www.youtube-nocookie.com/embed/'+videoId+'?autoplay=1';
                        iframe.style='${widthStyle} ${heightStyle}';
                        iframe.frameBorder='0';
                        iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                        iframe.allowFullscreen='';
                        wrapper.innerHTML='';
                        wrapper.appendChild(iframe);
                    }
                ">
                    <img src="${thumbUrl}" class="youtube-thumb" alt="YouTube thumbnail" loading="lazy" />
                    <div class="youtube-play-overlay">
                        <div class="youtube-play-button"></div>
                    </div>
                </div>
            </div>`;
        } else {
            html = `<div class="embed-wrapper" contenteditable="false">
                <iframe src="${escapeHtml(finalUrl)}" style="${widthStyle} ${heightStyle}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>`;
        }

        document.execCommand('insertHTML', false, html);

        const insertedWrapper = editorRef.current?.querySelector('.embed-wrapper:last-of-type');
        const insertedIframe = insertedWrapper?.querySelector('iframe');
        if (insertedIframe) {
            insertedIframe.style.width = embedWidth ? `${embedWidth}` : '100%';
            insertedIframe.style.maxWidth = '100%';
            insertedIframe.style.height = embedHeight ? `${embedHeight}` : '315px';
        }

        setShowEmbedForm(false);
        setEmbedUrl('');
        setEmbedWidth('');
        setEmbedHeight('');
        setEditingEmbed(false);
        setSelectedEmbedUrl('');
        selectedEmbedRef.current = null;
        refreshStats();
        updateActiveFormats();
    }, [embedUrl, embedWidth, embedHeight, editingEmbed, saveSelection, restoreSelection, refreshStats, updateActiveFormats, parseYouTubeUrl, extractYouTubeVideoId, onChange, escapeHtml]);

    const handleDeleteEmbed = useCallback(() => {
        if (!selectedEmbedRef.current || !editorRef.current) return;

        selectedEmbedRef.current.remove();
        selectedEmbedRef.current = null;
        setSelectedEmbedUrl('');
        setShowEmbedForm(false);
        setEditingEmbed(false);
        setEmbedUrl('');
        setEmbedWidth('');
        setEmbedHeight('');

        if (onChange && editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
        refreshStats();
    }, [onChange, refreshStats]);

    const handleSourceToggle = useCallback(() => {
        if (sourceMode) {
            const html = sourceValue;
            pendingSourceHtmlRef.current = html;
            setSourceMode(false);
        } else {
            const html = editorRef.current?.innerHTML || value || '';
            setSourceMode(true);
            setSourceValue(html);
            sourceHistoryRef.current = { stack: [html], index: 0 };
            setCanUndoSource(false);
            setCanRedoSource(false);
        }
    }, [sourceMode, sourceValue, value]);

    useLayoutEffect(() => {
        if (!sourceMode && editorRef.current && pendingSourceHtmlRef.current) {
            const html = pendingSourceHtmlRef.current;
            editorRef.current.innerHTML = html;
            visualInitialHtmlRef.current = html;
            visualHistoryRef.current = { stack: [html], index: 0 };
            visualRedoAvailableRef.current = false;
            setCanUndo(false);
            setCanRedo(false);
            setStats(countWords(html));
            ignoreValueChangeRef.current = true;
            onChange?.(html);
            pendingSourceHtmlRef.current = '';
        }
    }, [sourceMode, onChange, countWords]);

    const toggleFullscreen = useCallback(() => {
        setFullscreen(prev => !prev);
    }, []);

    const handleHtmlIndent = useCallback(() => {
        htmlEditorRef.current?.indent();
    }, []);

    const handleHtmlOutdent = useCallback(() => {
        htmlEditorRef.current?.outdent();
    }, []);

    const handleHtmlFormat = useCallback(() => {
        htmlEditorRef.current?.formatDocument();
    }, []);

    useEffect(() => {
        if (!fullscreen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [fullscreen]);

    const handleSourceChange = useCallback((html) => {
        setSourceValue(html);
        setStats(countWords(html));
        ignoreValueChangeRef.current = true;
        onChange?.(html);
        const history = sourceHistoryRef.current;
        history.stack = history.stack.slice(0, history.index + 1);
        history.stack.push(html);
        if (history.stack.length > 100) history.stack.shift();
        history.index = history.stack.length - 1;
        setCanUndoSource(history.index > 0);
        setCanRedoSource(false);
    }, [onChange, countWords]);

    const handleLinkClick = useCallback(() => {
        saveSelection();
        setShowLinkForm(true);
        setLinkUrl('');
        setLinkText('');
    }, [saveSelection]);

    const handleLinkSubmit = useCallback(() => {
        if (!linkUrl || !editorRef.current) return;

        editorRef.current.focus();
        restoreSelection();

        const selection = window.getSelection();
        const selectedText = selection.toString();

        if (selectedText && !linkText) {
            document.execCommand('createLink', false, linkUrl);
        } else {
            const text = escapeHtml(linkText || selectedText || linkUrl);
            const safeUrl = escapeHtml(linkUrl);
            const html = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            document.execCommand('insertHTML', false, html);
        }

        setShowLinkForm(false);
        setLinkUrl('');
        setLinkText('');
        refreshStats();
        updateActiveFormats();
    }, [linkUrl, linkText, restoreSelection, refreshStats, updateActiveFormats, escapeHtml]);

    const handleImageClick = useCallback(() => {
        saveSelection();
        setShowImageForm(true);
        setImageUrl('');
        setImageAlt('');
        setImageWidth('');
        setImageCaption('');
    }, [saveSelection]);

    const handleImageSubmit = useCallback(() => {
        if (!imageUrl || !editorRef.current) return;

        saveSelection();
        editorRef.current.focus();
        restoreSelection();

        const widthStyle = imageWidth ? `width: ${imageWidth}; max-width: 100%;` : 'max-width: 100%;';
        const alt = escapeHtml(imageAlt || 'Gambar');
        const safeUrl = escapeHtml(imageUrl);
        const imgHtml = `<img src="${safeUrl}" alt="${alt}" style="${widthStyle}" />`;

        let html = imgHtml;
        if (imageCaption) {
            html = `<figure class="image-figure">${imgHtml}<figcaption>${escapeHtml(imageCaption)}</figcaption></figure>`;
        }

        document.execCommand('insertHTML', false, html);

        setShowImageForm(false);
        setImageUrl('');
        setImageAlt('');
        setImageWidth('');
        setImageCaption('');
        refreshStats();
        updateActiveFormats();
    }, [imageUrl, imageAlt, imageWidth, imageCaption, saveSelection, restoreSelection, refreshStats, updateActiveFormats, escapeHtml]);

    const handleImageFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageUploadError('');
        }
    }, []);

    const handleImageFileUpload = useCallback(() => {
        const file = imageFileRef.current?.files?.[0];
        if (!file || !editorRef.current) return;

        setImageUploading(true);
        setImageUploadError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('custom_filename', '');
        formData.append('resize_width', '');
        formData.append('resize_height', '');
        formData.append('quality', 80);
        formData.append('format', 'jpeg');

        const token = localStorage.getItem('admin_token');

        fetch(`${API_BASE_URL}/upload/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw { status: res.status, data };
                }
                return data;
            })
            .then((data) => {
                if (data.url) {
                    setImageUrl(data.url);
                    setImageUploadMode(false);
                    setImageUploadError('');
                } else if (data.error) {
                    setImageUploadError(data.error);
                } else {
                    setImageUploadError('Gagal upload gambar');
                }
                setImageUploading(false);
            })
            .catch((err) => {
                console.error('Upload error:', err);
                setImageUploadError('Gagal upload gambar: ' + (err.data?.error || err.message || 'Network error'));
                setImageUploading(false);
            });
    }, [API_BASE_URL]);

    const handleImageModeToggle = useCallback((mode) => {
        setImageUploadMode(mode === 'upload');
        setImageUploadError('');
    }, []);

    const handleTableClick = useCallback(() => {
        saveSelection();
        setShowTableForm(true);
    }, [saveSelection]);

    const handleTableSubmit = useCallback(() => {
        if (!editorRef.current) return;

        const rows = Math.max(1, Math.min(20, parseInt(tableRows) || 3));
        const cols = Math.max(1, Math.min(20, parseInt(tableCols) || 3));

        editorRef.current.focus();
        saveSelection();
        restoreSelection();

        const tableEl = document.createElement('table');
        tableEl.className = 'editor-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
            const th = document.createElement('th');
            th.textContent = `Kolom ${c + 1}`;
            headRow.appendChild(th);
        }
        thead.appendChild(headRow);
        tableEl.appendChild(thead);

        const tbody = document.createElement('tbody');
        for (let r = 0; r < rows - 1; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < cols; c++) {
                const td = document.createElement('td');
                td.innerHTML = '<br>';
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        tableEl.appendChild(tbody);

        const wrapper = document.createElement('p');
        wrapper.appendChild(document.createElement('br'));

        const fragment = document.createDocumentFragment();
        fragment.appendChild(tableEl);
        fragment.appendChild(wrapper);

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(fragment);
            range.collapse(false);
        } else if (editorRef.current.lastChild) {
            editorRef.current.lastChild.after(fragment);
        } else {
            editorRef.current.appendChild(fragment);
        }

        setShowTableForm(false);
        setTableRows(3);
        setTableCols(3);
        refreshStats();
        updateActiveFormats();
    }, [tableRows, tableCols, saveSelection, restoreSelection, refreshStats, updateActiveFormats]);

    const getClosestCell = (target) => {
        if (!target) return null;
        const el = target.nodeType === 3 ? target.parentElement : target;
        return el?.closest?.('td, th') || null;
    };

    const hideTableToolbar = useCallback(() => {
        setShowTableToolbar(false);
        setSelectedTableCell(null);
    }, []);

    const handleTableCellClick = useCallback((e) => {
        const cell = getClosestCell(e.target);
        if (!cell) {
            hideTableToolbar();
            return;
        }

        setSelectedTableCell(cell);

        const cellRect = cell.getBoundingClientRect();
        const toolbarWidth = 340;
        const toolbarHeight = 40;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let top = cellRect.top + cellRect.height + 8;
        let left = cellRect.left + cellRect.width / 2 - toolbarWidth / 2;

        if (top + toolbarHeight > viewportHeight - 8) {
            top = cellRect.top - toolbarHeight - 8;
        }
        if (left < 8) {
            left = 8;
        }
        if (left + toolbarWidth > viewportWidth - 8) {
            left = viewportWidth - toolbarWidth - 8;
        }
        if (top < 8) {
            top = 8;
        }

        setTableToolbarPos({
            top,
            left: Math.max(8, left),
        });

        setShowTableToolbar(true);
    }, [hideTableToolbar]);

    const insertTableRow = useCallback(() => {
        if (!selectedTableCell || !editorRef.current) return;

        const row = selectedTableCell.parentElement;
        if (!row || row.tagName !== 'TR') return;

        const table = row.closest('table');
        if (!table) return;

        const colCount = row.querySelectorAll('td, th').length;
        const newRow = document.createElement('tr');

        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.innerHTML = '<br>';
            newRow.appendChild(td);
        }

        row.after(newRow);

        if (onChange && editorRef.current) {
            ignoreValueChangeRef.current = true;
            onChange(editorRef.current.innerHTML);
        }
        refreshStats();
    }, [selectedTableCell, onChange, refreshStats]);

    const deleteTableRow = useCallback(() => {
        if (!selectedTableCell || !editorRef.current) return;

        const row = selectedTableCell.parentElement;
        if (!row || row.tagName !== 'TR') return;

        const table = row.closest('table');
        if (!table) return;

        const rows = table.querySelectorAll('tr');
        if (rows.length <= 1) {
            table.remove();
            hideTableToolbar();
            if (onChange && editorRef.current) {
                ignoreValueChangeRef.current = true;
                onChange(editorRef.current.innerHTML);
            }
            refreshStats();
            return;
        }

        row.remove();

        if (onChange && editorRef.current) {
            ignoreValueChangeRef.current = true;
            onChange(editorRef.current.innerHTML);
        }
        refreshStats();
    }, [selectedTableCell, onChange, refreshStats, hideTableToolbar]);

    const insertTableCol = useCallback(() => {
        if (!selectedTableCell || !editorRef.current) return;

        const row = selectedTableCell.parentElement;
        if (!row || row.tagName !== 'TR') return;

        const table = row.closest('table');
        if (!table) return;

        const cellIndex = Array.from(row.querySelectorAll('th, td')).indexOf(selectedTableCell);
        const rows = table.querySelectorAll('tr');

        rows.forEach((tr) => {
            const cells = tr.querySelectorAll('th, td');
            const refCell = cells[cellIndex];
            if (!refCell) return;

            const newCell = document.createElement(refCell.tagName.toLowerCase());
            newCell.innerHTML = '<br>';
            refCell.after(newCell);
        });

        if (onChange && editorRef.current) {
            ignoreValueChangeRef.current = true;
            onChange(editorRef.current.innerHTML);
        }
        refreshStats();
    }, [selectedTableCell, onChange, refreshStats]);

    const deleteTableCol = useCallback(() => {
        if (!selectedTableCell || !editorRef.current) return;

        const row = selectedTableCell.parentElement;
        if (!row || row.tagName !== 'TR') return;

        const table = row.closest('table');
        if (!table) return;

        const cellIndex = Array.from(row.querySelectorAll('th, td')).indexOf(selectedTableCell);
        const rows = table.querySelectorAll('tr');

        if (rows[0].querySelectorAll('th, td').length <= 1) {
            table.remove();
            hideTableToolbar();
            if (onChange && editorRef.current) {
                onChange(editorRef.current.innerHTML);
            }
            refreshStats();
            return;
        }

        rows.forEach((tr) => {
            const cells = tr.querySelectorAll('th, td');
            const target = cells[cellIndex];
            if (target) {
                target.remove();
            }
        });

        if (onChange && editorRef.current) {
            ignoreValueChangeRef.current = true;
            onChange(editorRef.current.innerHTML);
        }
        refreshStats();
    }, [selectedTableCell, onChange, refreshStats, hideTableToolbar]);

    const handleEditorClick = useCallback((e) => {
        const target = e.target;

        if (target.tagName === 'IMG' && target.src) {
            setSelectedImageUrl(target.src);
            setSelectedEmbedUrl('');
            selectedEmbedRef.current = null;
            hideTableToolbar();
            return;
        }

        if (target.closest('figure.image-figure')) {
            const img = target.closest('figure.image-figure').querySelector('img');
            if (img && img.src) {
                setSelectedImageUrl(img.src);
            }
            setSelectedEmbedUrl('');
            selectedEmbedRef.current = null;
            hideTableToolbar();
            return;
        }

        const iframe = target.closest('iframe');
        const embedWrapper = target.closest('.embed-wrapper');
        if (iframe && embedWrapper) {
            const videoId = extractYouTubeVideoId(iframe.src);
            
            if (videoId) {
                const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                embedWrapper.classList.add('youtube-embed');
                embedWrapper.setAttribute('data-video-id', videoId);
                embedWrapper.innerHTML = `<div class="youtube-thumb-wrapper" onclick="
                    var wrapper=this.parentNode;
                    var videoId=wrapper.dataset.videoId;
                    if(!wrapper.querySelector('iframe')) {
                        var iframe=document.createElement('iframe');
                        iframe.src='https://www.youtube-nocookie.com/embed/'+videoId+'?autoplay=1';
                        iframe.style='width: 100%; max-width: 100%; height: 315px;';
                        iframe.frameBorder='0';
                        iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                        iframe.allowFullscreen='';
                        wrapper.innerHTML='';
                        wrapper.appendChild(iframe);
                    }
                ">
                    <img src="${thumbUrl}" class="youtube-thumb" alt="YouTube thumbnail" loading="lazy" data-video-id="${videoId}" />
                    <div class="youtube-play-overlay">
                        <div class="youtube-play-button"></div>
                    </div>
                </div>`;
                if (onChange) {
                    ignoreValueChangeRef.current = true;
                    onChange(editorRef.current.innerHTML);
                }
                refreshStats();
                return;
            }
            
            selectedEmbedRef.current = embedWrapper;
            setSelectedEmbedUrl(iframe.src);
            setEmbedUrl(iframe.src);
            setEmbedWidth(iframe.style.width || '');
            setEmbedHeight(iframe.style.height || '');
            setShowEmbedForm(true);
            setEditingEmbed(true);
            setSelectedImageUrl('');
            hideTableToolbar();
            return;
        }

        setSelectedImageUrl('');
        setSelectedEmbedUrl('');
        selectedEmbedRef.current = null;

        const cell = getClosestCell(target);
        if (cell) {
            handleTableCellClick(e);
        } else {
            hideTableToolbar();
        }
    }, [handleTableCellClick, hideTableToolbar, onChange, refreshStats, extractYouTubeVideoId]);

    const handleDeleteImage = useCallback(async () => {
        if (!selectedImageUrl || !editorRef.current) return;

        setImageDeleteLoading(true);

        try {
            const token = localStorage.getItem('admin_token');

            const response = await fetch(`${API_BASE_URL}/upload/delete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: selectedImageUrl }),
            });

            let data = null;
            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                console.warn('Delete image failed:', response.status, data);
            }
        } catch (err) {
            console.warn('Delete image network error:', err);
        } finally {
            if (editorRef.current) {
                const imgs = editorRef.current.querySelectorAll('img');
                let targetImg = null;
                imgs.forEach(img => {
                    if (img.src === selectedImageUrl) {
                        targetImg = img;
                    }
                });

                if (targetImg) {
                    const figure = targetImg.closest('figure.image-figure');
                    if (figure) {
                        figure.remove();
                    } else {
                        targetImg.remove();
                    }
                }
            }

            setSelectedImageUrl('');

            if (onChange && editorRef.current) {
                ignoreValueChangeRef.current = true;
                onChange(editorRef.current.innerHTML);
            }
            refreshStats();
            setImageDeleteLoading(false);
        }
    }, [selectedImageUrl, API_BASE_URL, onChange, refreshStats]);

    const ToolbarButton = ({ icon: Icon, onClick, title, active = false, color, disabled = false }) => (
        <button
            type="button"
            className={`toolbar-btn ${active ? 'active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
            title={title}
            style={color ? { color } : undefined}
            disabled={disabled}
        >
            <Icon size={16} />
        </button>
    );

    const openColorPopup = useCallback((command) => () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            lastRangeRef.current = selection.getRangeAt(0).cloneRange();
        }
        setColorPopupCommand(command);
        setShowColorPopup(true);
    }, []);

    const handleColorSelect = useCallback((color) => {
        if (lastRangeRef.current) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(lastRangeRef.current);
        }
        editorRef.current?.focus();
        document.execCommand(colorPopupCommand, false, color);
        refreshStats();
        setShowColorPopup(false);
    }, [colorPopupCommand, refreshStats]);

    const handleColorReset = useCallback(() => {
        editorRef.current?.focus();
        if (lastRangeRef.current) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(lastRangeRef.current);
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const contents = range.extractContents();
            const temp = document.createElement('div');
            temp.appendChild(contents);

            const allElements = temp.querySelectorAll('*');
            allElements.forEach((el) => {
                if (el.style.color) {
                    el.style.color = '';
                    if (!el.style.cssText) el.removeAttribute('style');
                }
                if (el.hasAttribute('color')) {
                    el.removeAttribute('color');
                }
                if (el.style.backgroundColor) {
                    el.style.backgroundColor = '';
                    if (!el.style.cssText) el.removeAttribute('style');
                }
                if (el.hasAttribute('bgcolor')) {
                    el.removeAttribute('bgcolor');
                }
            });

            range.deleteContents();
            range.insertNode(temp);
            range.collapse(false);
        }

        if (onChange && editorRef.current) {
            ignoreValueChangeRef.current = true;
            onChange(editorRef.current.innerHTML);
        }
        refreshStats();
        setShowColorPopup(false);
    }, [onChange, refreshStats]);

    const ColorInput = ({ command, title, activeColor }) => {
        const btnRef = useRef(null);
        const isOpen = showColorPopup && colorPopupCommand === command;
        const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

        useLayoutEffect(() => {
            if (isOpen && btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                setPopupPos({
                    top: rect.bottom + 6,
                    left: rect.left,
                });
            }
        }, [isOpen]);

        return (
            <div className="toolbar-color-wrapper">
                <button
                    ref={btnRef}
                    type="button"
                    className="toolbar-color"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={openColorPopup(command)}
                    title={title}
                    style={activeColor ? { color: activeColor } : undefined}
                >
                    <Palette size={16} style={{ position: 'relative', zIndex: 2 }} />
                    <span className="toolbar-color-indicator" style={{ backgroundColor: activeColor || 'currentColor' }} />
                </button>
                {isOpen && (
                    <div
                        className="color-picker-popup"
                        style={{
                            position: 'fixed',
                            top: popupPos.top,
                            left: popupPos.left,
                        }}
                    >
                        <CustomColorPicker onSelect={handleColorSelect} onReset={handleColorReset} />
                    </div>
                )}
            </div>
        );
    };

    const HeadingSelect = () => {
        const [open, setOpen] = useState(false);
        const btnRef = useRef(null);

        useEffect(() => {
            if (!open) return;
            const handleClickOutside = (e) => {
                if (btnRef.current && !btnRef.current.contains(e.target)) {
                    setOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [open]);

        const currentHeading = (() => {
            if (activeFormats.h1) return 'Heading 1';
            if (activeFormats.h2) return 'Heading 2';
            if (activeFormats.h3) return 'Heading 3';
            if (activeFormats.h4) return 'Heading 4';
            if (activeFormats.h5) return 'Heading 5';
            if (activeFormats.h6) return 'Heading 6';
            if (activeFormats.paragraph) return 'Paragraf';
            return 'Paragraf';
        })();

        const options = [
            { label: 'Heading 1', value: 'h1', icon: Heading1 },
            { label: 'Heading 2', value: 'h2', icon: Heading2 },
            { label: 'Heading 3', value: 'h3', icon: Heading3 },
            { label: 'Heading 4', value: 'h4', icon: Heading4 },
            { label: 'Heading 5', value: 'h5', icon: Heading5 },
            { label: 'Heading 6', value: 'h6', icon: Heading6 },
            { label: 'Paragraf', value: 'p', icon: Type },
        ];

        const currentOption = options.find(o => {
            if (o.value === 'p') return activeFormats.paragraph;
            return activeFormats[o.value];
        }) || options[options.length - 1];
        const ActiveIcon = currentOption.icon;

        return (
            <div className="heading-select-wrapper" ref={btnRef}>
                <button
                    type="button"
                    className={`heading-select-btn ${open ? 'open' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setOpen(!open)}
                    title="Heading"
                >
                    <ActiveIcon size={16} />
                    <span className="heading-select-label">{currentHeading}</span>
                    <ChevronDown size={14} />
                </button>
                {open && (
                    <div className="heading-select-menu">
                        {options.map(({ label, value, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                className={`heading-select-option ${(activeFormats.h1 && value === 'h1') || (activeFormats.h2 && value === 'h2') || (activeFormats.h3 && value === 'h3') || (activeFormats.paragraph && value === 'p') ? 'active' : ''}`}
                                onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', value); setOpen(false); }}
                            >
                                <Icon size={16} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const FontSizeSelect = () => {
        const [open, setOpen] = useState(false);
        const [customSize, setCustomSize] = useState('');
        const btnRef = useRef(null);
        const menuRef = useRef(null);

        useEffect(() => {
            if (!open) return;
            const handleClickOutside = (e) => {
                if (btnRef.current && !btnRef.current.contains(e.target)) {
                    setOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [open]);

        const presets = [
            { label: '10px', value: '10px' },
            { label: '12px', value: '12px' },
            { label: '14px', value: '14px' },
            { label: '16px', value: '16px' },
            { label: '18px', value: '18px' },
            { label: '24px', value: '24px' },
            { label: '32px', value: '32px' },
            { label: '48px', value: '48px' },
            { label: '64px', value: '64px' },
            { label: '96px', value: '96px' },
            { label: '128px', value: '128px' },
        ];

        const currentLabel = fontSize ? `${fontSize}px` : 'Size';

        return (
            <div className="font-size-select-wrapper" ref={btnRef}>
                <button
                    type="button"
                    className={`heading-select-btn ${open ? 'open' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setOpen(!open)}
                    title="Font Size"
                >
                    <span className="heading-select-label">{currentLabel}</span>
                    <ChevronDown size={14} />
                </button>
                {open && (
                    <div className="heading-select-menu font-size-menu" ref={menuRef}>
                        {presets.map(({ label, value }) => (
                            <button
                                key={value}
                                type="button"
                                className={`heading-select-option ${fontSize === value.replace('px', '') ? 'active' : ''}`}
                                onMouseDown={(e) => { e.preventDefault(); applyFontSize(value); }}
                            >
                                <span>{label}</span>
                            </button>
                        ))}
                        <div className="font-size-custom" onMouseDown={e => e.preventDefault()}>
                            <input
                                type="text"
                                placeholder="Ukuran kustom (px)"
                                value={customSize}
                                onChange={e => setCustomSize(e.target.value.replace(/[^\d]/g, ''))}
                            />
                            <button type="button" className="font-size-apply-btn" onMouseDown={e => { e.preventDefault(); if (customSize) applyFontSize(`${customSize}px`); }}>Terapkan</button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const Separator = () => <span className="toolbar-separator" />;

    return (
        <div className={`text-editor ${isFocused ? 'focused' : ''} ${fullscreen ? 'fullscreen' : ''}`}>
            <div className="toolbar">
                <div className="toolbar-group">
                    <ToolbarButton icon={Undo2} onClick={() => exec('undo')} title="Undo" active={sourceMode ? canUndoSource : canUndo} disabled={sourceMode ? !canUndoSource : !canUndo} />
                    <ToolbarButton icon={Redo2} onClick={() => exec('redo')} title="Redo" active={sourceMode ? canRedoSource : canRedo} disabled={sourceMode ? !canRedoSource : !canRedo} />
                </div>

                {!sourceMode && <Separator />}

                {!sourceMode && (
                    <>
                        <div className="toolbar-group">
                            <ColorInput command="foreColor" title="Warna Teks" activeColor={foreColor} />
                            <ColorInput command="hiliteColor" title="Warna Highlight" activeColor={hiliteColor} />
                        </div>

                        <Separator />

                        <div className="toolbar-group">
                            <ToolbarButton icon={Bold} onClick={() => exec('bold')} title="Bold" active={activeFormats.bold} />
                            <ToolbarButton icon={Italic} onClick={() => exec('italic')} title="Italic" active={activeFormats.italic} />
                            <ToolbarButton icon={Underline} onClick={() => exec('underline')} title="Underline" active={activeFormats.underline} />
                        </div>

                        <Separator />

                        <div className="toolbar-group">
                            <HeadingSelect />
                            <FontSizeSelect />
                        </div>

                        <Separator />

                        <div className="toolbar-group">
                            <ToolbarButton icon={Quote} onClick={() => exec('formatBlock', 'blockquote')} title="Blockquote" active={activeFormats.blockquote} />
                            <ToolbarButton icon={Code} onClick={() => exec('formatBlock', 'pre')} title="Code Block" active={activeFormats.pre} />
                        </div>

                        <Separator />

                        <div className="toolbar-group">
                            <ToolbarButton icon={List} onClick={() => exec('insertUnorderedList')} title="Unordered List" active={activeFormats.ul} />
                            <ToolbarButton icon={ListOrdered} onClick={() => exec('insertOrderedList')} title="Ordered List" active={activeFormats.ol} />
                        </div>

                        <Separator />

                        <div className="toolbar-group">
                            <ToolbarButton icon={Indent} onClick={() => exec('indent')} title="Indent" />
                            <ToolbarButton icon={Outdent} onClick={() => exec('outdent')} title="Outdent" />
                        </div>

                        <Separator />

                        <div className="toolbar-group">
                            <ToolbarButton icon={AlignLeft} onClick={() => exec('justifyLeft')} title="Align Left" active={activeFormats.alignLeft} />
                            <ToolbarButton icon={AlignCenter} onClick={() => exec('justifyCenter')} title="Align Center" active={activeFormats.alignCenter} />
                            <ToolbarButton icon={AlignRight} onClick={() => exec('justifyRight')} title="Align Right" active={activeFormats.alignRight} />
                            <ToolbarButton icon={AlignJustify} onClick={() => exec('justifyFull')} title="Justify" active={activeFormats.justifyFull} />
                        </div>

                        <Separator />

                        <div className="toolbar-group">
                            <ToolbarButton icon={Link} onClick={handleLinkClick} title="Tautan" active={showLinkForm} />
                            <ToolbarButton icon={Image} onClick={handleImageClick} title="Sisipkan Gambar" active={showImageForm} />
                            {selectedImageUrl && (
                                <ToolbarButton
                                    icon={Trash2}
                                    onClick={handleDeleteImage}
                                    title="Hapus Gambar"
                                    active={false}
                                />
                            )}
                            <ToolbarButton icon={Table} onClick={handleTableClick} title="Sisipkan Tabel" active={showTableForm} />
                            <ToolbarButton icon={Play} onClick={handleEmbedClick} title="Sisipkan Video / Embed (YouTube)" active={showEmbedForm} />
                            <ToolbarButton icon={Minus} onClick={() => exec('insertHorizontalRule')} title="Divider" />
                        </div>

                        <Separator />
                    </>
                )}

                {sourceMode && (
                    <>
                        <div className="toolbar-group">
                            <ToolbarButton icon={Indent} onClick={handleHtmlIndent} title="Indent" />
                            <ToolbarButton icon={Outdent} onClick={handleHtmlOutdent} title="Outdent" />
                            <ToolbarButton icon={Code} onClick={handleHtmlFormat} title="Format HTML" />
                        </div>

                        <Separator />
                    </>
                )}

                <div className="toolbar-group">
                    <ToolbarButton icon={FileCode2} onClick={handleSourceToggle} title={sourceMode ? 'Edit Visual' : 'Edit HTML'} active={sourceMode} />
                    {!sourceMode && (
                        <ToolbarButton icon={RemoveFormatting} onClick={() => exec('removeFormat')} title="Clear Formatting" />
                    )}
                    <ToolbarButton icon={fullscreen ? Minimize2 : Maximize2} onClick={toggleFullscreen} title={fullscreen ? 'Keluar Fullscreen' : 'Fullscreen'} active={fullscreen} />
                </div>
            </div>

            {(showImageForm || showLinkForm || showTableForm || showEmbedForm) && (
                <div className="toolbar-forms">
                    {showLinkForm && (
                        <div className="link-form" onSubmit={e => e.preventDefault()}>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={linkUrl}
                                onChange={e => setLinkUrl(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Teks tautan (opsional)"
                                value={linkText}
                                onChange={e => setLinkText(e.target.value)}
                            />
                                <button type="button" className="link-form-submit" onMouseDown={(e) => e.preventDefault()} onClick={handleLinkSubmit}>Insert</button>
                            <button type="button" className="link-form-cancel" onClick={() => setShowLinkForm(false)}>Batal</button>
                        </div>
                    )}

                    {showImageForm && (
                        <div className="image-form" onSubmit={e => e.preventDefault()}>
                            <div className="image-form-tabs">
                                <button
                                    type="button"
                                    className={`image-tab ${!imageUploadMode ? 'active' : ''}`}
                                    onClick={() => handleImageModeToggle('url')}
                                >
                                    URL
                                </button>
                                <button
                                    type="button"
                                    className={`image-tab ${imageUploadMode ? 'active' : ''}`}
                                    onClick={() => handleImageModeToggle('upload')}
                                >
                                    <Upload size={14} /> Upload
                                </button>
                            </div>

                            {!imageUploadMode ? (
                                <>
                                    <input
                                        type="url"
                                        placeholder="URL Gambar (https://...)"
                                        value={imageUrl}
                                        onChange={e => setImageUrl(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Alt text (opsional)"
                                        value={imageAlt}
                                        onChange={e => setImageAlt(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Lebar (contoh: 100%, 300px)"
                                        value={imageWidth}
                                        onChange={e => setImageWidth(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Caption (opsional, direkomendasikan)"
                                        value={imageCaption}
                                        onChange={e => setImageCaption(e.target.value)}
                                    />
                                    <button type="button" className="link-form-submit" onMouseDown={(e) => e.preventDefault()} onClick={handleImageSubmit}>Insert</button>
                                </>
                            ) : (
                                <div className="image-upload-tab">
                                    <input
                                        ref={imageFileRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                        disabled={imageUploading}
                                        className="upload-input"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Caption (opsional, direkomendasikan)"
                                        value={imageCaption}
                                        onChange={e => setImageCaption(e.target.value)}
                                        className="caption-input"
                                    />
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleImageFileUpload}
                                        disabled={!imageFileRef.current?.files?.[0] || imageUploading}
                                        className="btn-upload"
                                    >
                                        {imageUploading ? 'Mengupload...' : 'Upload'}
                                    </button>
                                    {imageUploadError && <span className="upload-error">{imageUploadError}</span>}
                                </div>
                            )}

                            <button type="button" className="link-form-cancel" onClick={() => setShowImageForm(false)}>Batal</button>
                        </div>
                    )}

                    {showTableForm && (
                        <div className="table-form" onSubmit={e => e.preventDefault()}>
                            <div className="table-form-row">
                                <label className="table-form-label">Baris</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={tableRows}
                                    onChange={e => setTableRows(e.target.value)}
                                />
                            </div>
                            <div className="table-form-row">
                                <label className="table-form-label">Kolom</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={tableCols}
                                    onChange={e => setTableCols(e.target.value)}
                                />
                            </div>
                            <button type="button" className="link-form-submit" onMouseDown={(e) => e.preventDefault()} onClick={handleTableSubmit}>Insert</button>
                            <button type="button" className="link-form-cancel" onClick={() => setShowTableForm(false)}>Batal</button>
                        </div>
                    )}

                    {showEmbedForm && (
                        <div className="embed-form" onSubmit={e => e.preventDefault()}>
                            <input
                                type="url"
                                placeholder="URL YouTube atau Iframe (https://...)"
                                value={embedUrl}
                                onChange={e => setEmbedUrl(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Lebar (contoh: 100%, 640px)"
                                value={embedWidth}
                                onChange={e => setEmbedWidth(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Tinggi (contoh: 315px, 480px)"
                                value={embedHeight}
                                onChange={e => setEmbedHeight(e.target.value)}
                            />
                            <button type="button" className="link-form-submit" onMouseDown={(e) => e.preventDefault()} onClick={handleEmbedSubmit}>{editingEmbed ? 'Update' : 'Insert'}</button>
                            <button type="button" className="link-form-cancel" onClick={() => setShowEmbedForm(false)}>Batal</button>
                        </div>
                    )}
                </div>
            )}

            <div className={`editor-wrapper ${fullscreen ? 'fullscreen' : ''}`}>
                {!sourceMode ? (
                    <div
                        ref={editorRef}
                        className="editor-content"
                        id={id}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onPaste={handlePaste}
                        onKeyDown={handleKeyDown}
                        onClick={handleEditorClick}
                        data-placeholder={placeholder}
                        role="textbox"
                        aria-multiline="true"
                    />
                ) : (
                    <HTMLEditor
                        ref={htmlEditorRef}
                        value={sourceValue}
                        onChange={handleSourceChange}
                        placeholder={placeholder}
                        fullscreen={fullscreen}
                        theme={theme}
                    />
                )}

                {selectedImageUrl && !sourceMode && (
                    <button
                        type="button"
                        className="image-delete-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleDeleteImage}
                        disabled={imageDeleteLoading}
                        title="Hapus Gambar dari Editor & Server"
                        style={{
                            position: 'fixed',
                            top: imageDeletePos.top,
                            left: imageDeletePos.left,
                        }}
                    >
                        <Trash2 size={14} />
                        {imageDeleteLoading ? 'Menghapus...' : 'Hapus Gambar'}
                    </button>
                )}

                {selectedEmbedUrl && !sourceMode && (
                    <button
                        type="button"
                        className="embed-delete-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleDeleteEmbed}
                        title="Hapus Embed"
                        style={{
                            position: 'fixed',
                            top: embedDeletePos.top,
                            left: embedDeletePos.left,
                        }}
                    >
                        <Trash2 size={14} />
                        Hapus Embed
                    </button>
                )}

                {showTableToolbar && !sourceMode && (
                        <div
                            className="table-toolbar"
                            style={{
                                position: 'fixed',
                                top: tableToolbarPos.top,
                                left: tableToolbarPos.left,
                                zIndex: 9999,
                            }}
                        >
                            <button type="button" className="table-toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={insertTableRow} title="Tambah Baris">
                                + Baris
                            </button>
                            <button type="button" className="table-toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={deleteTableRow} title="Hapus Baris">
                                <Trash2 size={14} /> Baris
                            </button>
                            <button type="button" className="table-toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={insertTableCol} title="Tambah Kolom">
                                + Kolom
                            </button>
                            <button type="button" className="table-toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={deleteTableCol} title="Hapus Kolom">
                                <Trash2 size={14} /> Kolom
                            </button>
                        </div>
                )}

                <div className="editor-statusbar">
                    <span className="editor-stats">{stats.words} kata · {stats.chars} karakter</span>
                    <span className="editor-mode">{sourceMode ? 'Mode HTML' : 'Mode Visual'}</span>
                </div>
            </div>
        </div>
    );
}
