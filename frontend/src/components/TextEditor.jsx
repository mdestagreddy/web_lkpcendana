import { useState, useRef, useEffect, useLayoutEffect, useCallback, useContext } from 'react';
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TUnderline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Table as TTable, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import TLink from '@tiptap/extension-link'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold, Italic, Underline, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Undo2, Redo2, RemoveFormatting, Type, Link,
    Palette, Quote, Code, Indent, Outdent,
    Minus, FileCode2, Image, Upload, Trash2, ChevronDown, Table, Play
} from 'lucide-react';
import { Maximize2, Minimize2 } from 'lucide-react';
import FlexIcon from './FlexIcon';
import CustomColorPicker from './CustomColorPicker';
import HTMLEditor from './HTMLEditor';
import { ThemeContext } from '../context/ThemeContext';
import { Figure, Figcaption, EmbedWrapper, FontSize, CustomImage, Highlight } from './TipTapExtensions';
import './TextEditor.css';

export default function TextEditor({ value = '', onChange, placeholder = 'Tulis konten di sini...', id }) {
    const htmlEditorRef = useRef(null);
    const imageFileRef = useRef(null);
    const { theme } = useContext(ThemeContext);
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const [isFocused, setIsFocused] = useState(false);
    const [activeFormats, setActiveFormats] = useState({});
    const [foreColor, setForeColor] = useState('');
    const [hiliteColor, setHiliteColor] = useState('');
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
    const [fontSize, setFontSize] = useState('');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const sourceHistoryRef = useRef({ stack: [], index: -1 });
    const ignoreValueChangeRef = useRef(false);
    const pendingSourceHtmlRef = useRef('');
    const mountedRef = useRef(false);

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

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4, 5, 6] },
                link: false,
                underline: false,
                image: false,
            }),
            TUnderline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TTable.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            CustomImage.configure({ inline: false }),
            TLink.configure({ openOnClick: false }),
            Color,
            TextStyle,
            Placeholder.configure({ placeholder, emptyNodeClass: 'is-empty' }),
            Figure,
            Figcaption,
            EmbedWrapper,
            FontSize,
            Highlight,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            if (onChange && html !== value) {
                ignoreValueChangeRef.current = true
                onChange(html)
            }
            updateStats(html)
        },
        onSelectionUpdate: ({ editor }) => {
            updateActiveFormats(editor)
            checkNodeSelection(editor)
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
        editorProps: {
            handlePaste: (view, event) => {
                event.preventDefault()
                const text = event.clipboardData.getData('text/plain')
                if (text) {
                    view.pasteText(text)
                }
                return true
            },
            handleKeyDown: (view, event) => {
                handleKeyDown(event)
                return false
            },
            handleClick: (view, event) => {
                handleEditorClick(event)
                return false
            },
            attributes: {
                id,
                class: 'editor-content'
            }
        }
    })

    const updateStats = useCallback((html) => {
        if (!html) {
            setStats({ words: 0, chars: 0 })
            return
        }
        const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim()
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0
        const chars = text.length
        setStats({ words, chars })
    }, [])

    const updateActiveFormats = useCallback((ed) => {
        if (!ed) return
        setActiveFormats({
            bold: ed.isActive('bold'),
            italic: ed.isActive('italic'),
            underline: ed.isActive('underline'),
            h1: ed.isActive('heading', { level: 1 }),
            h2: ed.isActive('heading', { level: 2 }),
            h3: ed.isActive('heading', { level: 3 }),
            h4: ed.isActive('heading', { level: 4 }),
            h5: ed.isActive('heading', { level: 5 }),
            h6: ed.isActive('heading', { level: 6 }),
            paragraph: ed.isActive('paragraph'),
            ul: ed.isActive('bulletList'),
            ol: ed.isActive('orderedList'),
            alignLeft: ed.isActive({ textAlign: 'left' }),
            alignCenter: ed.isActive({ textAlign: 'center' }),
            alignRight: ed.isActive({ textAlign: 'right' }),
            justifyFull: ed.isActive({ textAlign: 'justify' }),
            blockquote: ed.isActive('blockquote'),
            pre: ed.isActive('codeBlock'),
        })
        const size = ed.getAttributes('fontSize').size
        setFontSize(size ? String(size).replace('px', '') : '')
        const fg = ed.getAttributes('color').color
        setForeColor(fg || '')
        const bg = ed.getAttributes('highlight').color
        setHiliteColor(bg || '')
    }, [])

    const checkNodeSelection = useCallback((ed) => {
        if (!ed) return
        const { state } = ed
        const { selection } = state
        if (selection?.type?.name === 'node' && selection.node) {
            const node = selection.node
            if (node.type.name === 'image') {
                setSelectedImageUrl(node.attrs.src || '')
            } else if (node.type.name === 'embedWrapper') {
                setSelectedEmbedUrl(node.attrs.url || '')
                selectedEmbedRef.current = node
            } else {
                setSelectedImageUrl('')
                setSelectedEmbedUrl('')
                selectedEmbedRef.current = null
            }
        } else {
            setSelectedImageUrl('')
            setSelectedEmbedUrl('')
            selectedEmbedRef.current = null
        }
    }, [])

    const refreshUndoRedoState = useCallback(() => {
        if (!editor) return
        setCanUndo(editor.can().undo())
        setCanRedo(editor.can().redo())
    }, [editor])

    useEffect(() => {
        if (!editor) return
        updateStats(editor.getHTML())
        updateActiveFormats(editor)
        refreshUndoRedoState()
    }, [editor, updateStats, updateActiveFormats, refreshUndoRedoState])

    useEffect(() => {
        if (ignoreValueChangeRef.current) {
            ignoreValueChangeRef.current = false
            return
        }
        if (!mountedRef.current) {
            mountedRef.current = true
            return
        }
        if (editor && value !== editor.getHTML()) {
            requestAnimationFrame(() => {
                editor.commands.setContent(value, false)
                updateStats(value)
            })
        }
    }, [value, editor, updateStats])

    useEffect(() => {
        if (sourceMode && value !== sourceValue) {
            setSourceValue(value)
        }
    }, [value, sourceMode, sourceValue])

    useEffect(() => {
        if (!editor) return
        if (sourceMode) return
        const ed = editor
        const updateEmptyClass = () => {
            const text = ed.getText()?.trim() || ''
            if (!text) {
                ed.view.dom.classList.add('is-empty')
            } else {
                ed.view.dom.classList.remove('is-empty')
            }
        }
        updateEmptyClass()
        ed.on('update', updateEmptyClass)
        return () => {
            ed.off('update', updateEmptyClass)
        }
    }, [sourceMode, editor])

    useEffect(() => {
        try {
            document.execCommand('styleWithCSS', false, true);
        } catch {}
    }, []);

    useLayoutEffect(() => {
        if (!selectedImageUrl || !editor) return
        const node = editor.state.selection.node
        if (node && node.type.name === 'image' && node.attrs.src === selectedImageUrl) {
            const coords = editor.view.coordsAtPos(editor.state.selection.from)
            setImageDeletePos({ top: coords.top - 40, left: coords.right - 120 })
        }
    }, [selectedImageUrl, editor])

    useLayoutEffect(() => {
        if (!selectedEmbedUrl || !editor) return
        const node = editor.state.selection.node
        if (node && node.type.name === 'embedWrapper' && node.attrs.url === selectedEmbedUrl) {
            const coords = editor.view.coordsAtPos(editor.state.selection.from)
            setEmbedDeletePos({ top: coords.top - 40, left: coords.right - 120 })
        }
    }, [selectedEmbedUrl, editor])

    useEffect(() => {
        if (!fullscreen) return
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        };
    }, [fullscreen])

    useEffect(() => {
        if (!showColorPopup) return
        const handleClickOutside = (e) => {
            if (!e.target.closest('.toolbar-color-wrapper')) {
                setShowColorPopup(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showColorPopup]);

    const exec = useCallback((command, arg = null) => {
        if (!editor) return
        const chain = editor.chain().focus()
        switch (command) {
            case 'undo':
                chain.undo().run()
                break
            case 'redo':
                chain.redo().run()
                break
            case 'bold':
                chain.toggleBold().run()
                break
            case 'italic':
                chain.toggleItalic().run()
                break
            case 'underline':
                chain.toggleUnderline().run()
                break
            case 'h1':
                chain.toggleHeading({ level: 1 }).run()
                break
            case 'h2':
                chain.toggleHeading({ level: 2 }).run()
                break
            case 'h3':
                chain.toggleHeading({ level: 3 }).run()
                break
            case 'h4':
                chain.toggleHeading({ level: 4 }).run()
                break
            case 'h5':
                chain.toggleHeading({ level: 5 }).run()
                break
            case 'h6':
                chain.toggleHeading({ level: 6 }).run()
                break
            case 'p':
                chain.setParagraph().run()
                break
            case 'ul':
                chain.toggleBulletList().run()
                break
            case 'ol':
                chain.toggleOrderedList().run()
                break
            case 'blockquote':
                chain.toggleBlockquote().run()
                break
            case 'pre':
                chain.toggleCodeBlock().run()
                break
            case 'justifyLeft':
                chain.setTextAlign('left').run()
                break
            case 'justifyCenter':
                chain.setTextAlign('center').run()
                break
            case 'justifyRight':
                chain.setTextAlign('right').run()
                break
            case 'justifyFull':
                chain.setTextAlign('justify').run()
                break
            case 'indent':
                if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
                    chain.sinkListItem('listItem').run()
                }
                break
            case 'outdent':
                if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
                    chain.liftListItem('listItem').run()
                }
                break
            case 'removeFormat':
                chain.clearNodes().unsetAllMarks().run()
                break
            case 'insertHorizontalRule':
                chain.setHorizontalRule().run()
                break
            case 'foreColor':
                if (arg) chain.setColor(arg).run()
                break
            case 'hiliteColor':
                if (arg) chain.setMark('highlight', { color: arg }).run()
                break
        }
        updateActiveFormats(editor)
        refreshUndoRedoState()
    }, [editor, updateActiveFormats, refreshUndoRedoState])

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Tab') {
            e.preventDefault()
            if (editor) {
                if (e.shiftKey) {
                    // no-op, or you can implement custom outdent here
                } else {
                    editor.chain().focus().insertContent('    ').run()
                }
            }
            return
        }

        if (!editor) return

        const isModifier = e.ctrlKey || e.metaKey
        if (!isModifier) return

        const key = e.key.toLowerCase()
        const isUndo = key === 'z' && !e.shiftKey
        const isRedo = key === 'y' || (key === 'z' && e.shiftKey)

        if (isUndo) {
            e.preventDefault()
            editor.chain().focus().undo().run()
            return
        }
        if (isRedo) {
            e.preventDefault()
            editor.chain().focus().redo().run()
            return
        }
    }, [editor])

    useEffect(() => {
        if (!editor) return
        const ed = editor
        const handleKeyUp = () => {
            updateActiveFormats(ed)
        }
        const handleMouseUp = () => {
            updateActiveFormats(ed)
        }
        ed.on('keyup', handleKeyUp)
        ed.on('mouseup', handleMouseUp)
        return () => {
            ed.off('keyup', handleKeyUp)
            ed.off('mouseup', handleMouseUp)
        }
    }, [editor, updateActiveFormats])

    const parseYouTubeUrl = useCallback((url) => {
        if (!url) return null
        url = url.trim()
        if (url.includes('/embed/')) return url
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/watch\?v=)([^&\s]+)/)
        if (match) {
            const videoId = match[1]
            if (url.includes('youtube-nocookie.com')) {
                return `https://www.youtube-nocookie.com/embed/${videoId}`
            }
            return `https://www.youtube.com/embed/${videoId}`
        }
        return null
    }, []);

    const extractYouTubeVideoId = useCallback((embedUrl) => {
        if (!embedUrl) return null
        const match = embedUrl.match(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([^/?&\s]+)/)
        return match ? match[1] : null
    }, []);

    const handleEmbedClick = useCallback(() => {
        setShowEmbedForm(true)
        setEmbedUrl('')
        setEmbedWidth('')
        setEmbedHeight('')
        setEditingEmbed(false)
        setSelectedEmbedUrl('')
        selectedEmbedRef.current = null
    }, []);

    const handleEmbedSubmit = useCallback(() => {
        if (!embedUrl || !editor) return
        let finalUrl = embedUrl.trim()
        const ytUrl = parseYouTubeUrl(finalUrl)
        if (ytUrl) {
            finalUrl = ytUrl
        }
        try {
            new URL(finalUrl)
        } catch {
            return
        }
        const widthStyle = embedWidth ? `width: ${embedWidth}; max-width: 100%;` : 'width: 100%;'
        const heightStyle = embedHeight ? `height: ${embedHeight};` : 'height: 315px;'
        const videoId = extractYouTubeVideoId(finalUrl)
        const isYouTube = !!videoId
        const dataWidth = embedWidth || '100%'
        const dataHeight = embedHeight || '315px'
        let html
        if (isYouTube) {
            const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            html = `<div class="embed-wrapper youtube-embed" contenteditable="false" data-video-id="${videoId}" data-width="${dataWidth}" data-height="${dataHeight}">
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
            </div>`
        } else {
            html = `<div class="embed-wrapper" contenteditable="false" data-url="${escapeHtml(finalUrl)}" data-width="${dataWidth}" data-height="${dataHeight}">
                <iframe src="${escapeHtml(finalUrl)}" style="${widthStyle} ${heightStyle}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>`
        }
        editor.chain().focus().insertContent(html).run()
        setShowEmbedForm(false)
        setEmbedUrl('')
        setEmbedWidth('')
        setEmbedHeight('')
        setEditingEmbed(false)
        setSelectedEmbedUrl('')
        selectedEmbedRef.current = null
    }, [editor, embedUrl, embedWidth, embedHeight, escapeHtml, parseYouTubeUrl, extractYouTubeVideoId])

    const handleDeleteEmbed = useCallback(() => {
        if (!selectedEmbedRef.current || !editor) return
        const { state } = editor
        const { selection } = state
        if (selection.type.name === 'node' && selection.node.type.name === 'embedWrapper') {
            editor.chain().focus().deleteSelection().run()
        } else {
            selectedEmbedRef.current = null
        }
        setSelectedEmbedUrl('')
        setShowEmbedForm(false)
        setEditingEmbed(false)
        setEmbedUrl('')
        setEmbedWidth('')
        setEmbedHeight('')
    }, [editor])

    const handleSourceToggle = useCallback(() => {
        if (sourceMode) {
            const html = sourceValue
            setSourceMode(false)
            pendingSourceHtmlRef.current = html
            if (editor) {
                editor.commands.setContent(html)
                updateStats(html)
            }
        } else {
            const html = editor ? editor.getHTML() : value
            setSourceMode(true)
            setSourceValue(html)
            sourceHistoryRef.current = { stack: [html], index: 0 }
            setCanUndoSource(false)
            setCanRedoSource(false)
        }
    }, [sourceMode, sourceValue, value, editor, updateStats])

    useLayoutEffect(() => {
        if (!sourceMode && editor && pendingSourceHtmlRef.current) {
            const html = pendingSourceHtmlRef.current
            editor.commands.setContent(html)
            updateStats(html)
            ignoreValueChangeRef.current = true
            onChange?.(html)
            pendingSourceHtmlRef.current = ''
        }
    }, [sourceMode, editor, updateStats, onChange])

    const toggleFullscreen = useCallback(() => {
        setFullscreen(prev => !prev)
    }, []);

    const handleHtmlIndent = useCallback(() => {
        htmlEditorRef.current?.indent()
    }, []);

    const handleHtmlOutdent = useCallback(() => {
        htmlEditorRef.current?.outdent()
    }, []);

    const handleHtmlFormat = useCallback(() => {
        htmlEditorRef.current?.formatDocument()
    }, []);

    const handleSourceChange = useCallback((html) => {
        setSourceValue(html)
        setStats(countWords(html))
        ignoreValueChangeRef.current = true
        onChange?.(html)
        const history = sourceHistoryRef.current
        history.stack = history.stack.slice(0, history.index + 1)
        history.stack.push(html)
        if (history.stack.length > 100) history.stack.shift()
        history.index = history.stack.length - 1
        setCanUndoSource(history.index > 0)
        setCanRedoSource(false)
    }, [onChange, countWords]);

    const handleLinkClick = useCallback(() => {
        setShowLinkForm(true)
        setLinkUrl('')
        setLinkText('')
    }, []);

    const handleLinkSubmit = useCallback(() => {
        if (!linkUrl || !editor) return
        if (linkText) {
            const text = escapeHtml(linkText)
            const safeUrl = escapeHtml(linkUrl)
            const html = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`
            editor.chain().focus().insertContent(html).run()
        } else {
            editor.chain().focus().setLink({ href: linkUrl }).run()
        }
        setShowLinkForm(false)
        setLinkUrl('')
        setLinkText('')
        refreshUndoRedoState()
    }, [editor, linkUrl, linkText, escapeHtml, refreshUndoRedoState])

    const handleImageClick = useCallback(() => {
        setShowImageForm(true)
        setImageUrl('')
        setImageAlt('')
        setImageWidth('')
        setImageCaption('')
    }, []);

    const handleImageSubmit = useCallback(() => {
        if (!imageUrl || !editor) return
        const widthStyle = imageWidth ? `width: ${imageWidth}; max-width: 100%;` : 'max-width: 100%;'
        const alt = escapeHtml(imageAlt || 'Gambar')
        const safeUrl = escapeHtml(imageUrl)
        const imgHtml = `<img src="${safeUrl}" alt="${alt}" style="${widthStyle}" />`
        let html = imgHtml
        if (imageCaption) {
            html = `<figure class="image-figure">${imgHtml}<figcaption>${escapeHtml(imageCaption)}</figcaption></figure>`
        }
        editor.chain().focus().insertContent(html).run()
        setShowImageForm(false)
        setImageUrl('')
        setImageAlt('')
        setImageWidth('')
        setImageCaption('')
        refreshUndoRedoState()
    }, [editor, imageUrl, imageAlt, imageWidth, imageCaption, escapeHtml, refreshUndoRedoState])

    const handleImageFileChange = useCallback((e) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageUploadError('')
        }
    }, []);

    const handleImageFileUpload = useCallback(() => {
        const file = imageFileRef.current?.files?.[0]
        if (!file || !editor) return
        setImageUploading(true)
        setImageUploadError('')
        const formData = new FormData()
        formData.append('file', file)
        formData.append('custom_filename', '')
        formData.append('resize_width', '')
        formData.append('resize_height', '')
        formData.append('quality', 80)
        formData.append('format', 'jpeg')
        const token = localStorage.getItem('admin_token')
        fetch(`${API_BASE_URL}/upload/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}))
                if (!res.ok) {
                    throw { status: res.status, data }
                }
                return data
            })
            .then((data) => {
                if (data.url) {
                    setImageUrl(data.url)
                    setImageUploadMode(false)
                    setImageUploadError('')
                } else if (data.error) {
                    setImageUploadError(data.error)
                } else {
                    setImageUploadError('Gagal upload gambar')
                }
                setImageUploading(false)
            })
            .catch((err) => {
                console.error('Upload error:', err)
                setImageUploadError('Gagal upload gambar: ' + (err.data?.error || err.message || 'Network error'))
                setImageUploading(false)
            })
    }, [API_BASE_URL, editor])

    const handleImageModeToggle = useCallback((mode) => {
        setImageUploadMode(mode === 'upload')
        setImageUploadError('')
    }, []);

    const handleTableClick = useCallback(() => {
        setShowTableForm(true)
    }, []);

    const handleTableSubmit = useCallback(() => {
        if (!editor) return
        const rows = Math.max(1, Math.min(20, parseInt(tableRows) || 3))
        const cols = Math.max(1, Math.min(20, parseInt(tableCols) || 3))
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
        setShowTableForm(false)
        setTableRows(3)
        setTableCols(3)
    }, [editor, tableRows, tableCols])

    const insertTableRow = useCallback(() => {
        if (!editor) return
        editor.chain().focus().addRowAfter().run()
    }, [editor])

    const deleteTableRow = useCallback(() => {
        if (!editor) return
        editor.chain().focus().deleteRow().run()
    }, [editor])

    const insertTableCol = useCallback(() => {
        if (!editor) return
        editor.chain().focus().addColumnAfter().run()
    }, [editor])

    const deleteTableCol = useCallback(() => {
        if (!editor) return
        editor.chain().focus().deleteColumn().run()
    }, [editor])

    const hideTableToolbar = useCallback(() => {
        setShowTableToolbar(false)
        setSelectedTableCell(null)
    }, []);

    const handleTableCellClick = useCallback((e) => {
        if (!editor) return
        const cell = e.target.closest('td, th')
        if (!cell) {
            hideTableToolbar()
            return
        }
        setSelectedTableCell(cell)
        const cellRect = cell.getBoundingClientRect()
        const toolbarWidth = 340
        const toolbarHeight = 40
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        let top = cellRect.top + cellRect.height + 8
        let left = cellRect.left + cellRect.width / 2 - toolbarWidth / 2
        if (top + toolbarHeight > viewportHeight - 8) {
            top = cellRect.top - toolbarHeight - 8
        }
        if (left < 8) {
            left = 8
        }
        if (left + toolbarWidth > viewportWidth - 8) {
            left = viewportWidth - toolbarWidth - 8
        }
        if (top < 8) {
            top = 8
        }
        setTableToolbarPos({
            top,
            left: Math.max(8, left),
        })
        setShowTableToolbar(true)
    }, [hideTableToolbar, editor])

    const handleEditorClick = useCallback((e) => {
        const target = e.target || {}
        if (target.tagName === 'IMG' && target.src) {
            setSelectedImageUrl(target.src)
            setSelectedEmbedUrl('')
            selectedEmbedRef.current = null
            hideTableToolbar()
            return
        }
        if (target.closest('figure.image-figure')) {
            const img = target.closest('figure.image-figure').querySelector('img')
            if (img && img.src) {
                setSelectedImageUrl(img.src)
            }
            setSelectedEmbedUrl('')
            selectedEmbedRef.current = null
            hideTableToolbar()
            return
        }
        const iframe = target.closest('iframe')
        const embedWrapper = target.closest('.embed-wrapper')
        if (iframe && embedWrapper) {
            const videoId = extractYouTubeVideoId(iframe.src)
            if (videoId) {
                const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                embedWrapper.classList.add('youtube-embed')
                embedWrapper.setAttribute('data-video-id', videoId)
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
                </div>`
                if (onChange && editor) {
                    ignoreValueChangeRef.current = true
                    onChange(editor.getHTML())
                }
                refreshUndoRedoState()
                return
            }
            selectedEmbedRef.current = embedWrapper
            setSelectedEmbedUrl(iframe.src)
            setEmbedUrl(iframe.src)
            setEmbedWidth(iframe.style.width || '')
            setEmbedHeight(iframe.style.height || '')
            setShowEmbedForm(true)
            setEditingEmbed(true)
            setSelectedImageUrl('')
            hideTableToolbar()
            return
        }
        setSelectedImageUrl('')
        setSelectedEmbedUrl('')
        selectedEmbedRef.current = null
        const cell = target.closest('td, th')
        if (cell) {
            handleTableCellClick(e)
        } else {
            hideTableToolbar()
        }
    }, [hideTableToolbar, onChange, refreshUndoRedoState, extractYouTubeVideoId, editor, handleTableCellClick])

    const handleDeleteImage = useCallback(async () => {
        if (!selectedImageUrl || !editor) return
        setImageDeleteLoading(true)
        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(`${API_BASE_URL}/upload/delete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: selectedImageUrl }),
            })
            let data = null
            try {
                data = await response.json()
            } catch {
                data = null
            }
            if (!response.ok) {
                console.warn('Delete image failed:', response.status, data)
            }
        } catch (err) {
            console.warn('Delete image network error:', err)
        } finally {
            const { state } = editor
            const { selection } = state
            if (selection.type.name === 'node' && selection.node.type.name === 'image') {
                editor.chain().focus().deleteSelection().run()
            }
            setSelectedImageUrl('')
            setImageDeleteLoading(false)
        }
    }, [selectedImageUrl, API_BASE_URL, editor])

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
        setColorPopupCommand(command)
        setShowColorPopup(true)
    }, []);

    const handleColorSelect = useCallback((color) => {
        if (!editor) return
        editor.chain().focus().run()
        if (colorPopupCommand === 'foreColor') {
            editor.chain().focus().setColor(color).run()
        } else if (colorPopupCommand === 'hiliteColor') {
            editor.chain().focus().setMark('highlight', { color }).run()
        }
        refreshUndoRedoState()
        setShowColorPopup(false)
    }, [editor, colorPopupCommand, refreshUndoRedoState])

    const handleColorReset = useCallback(() => {
        if (!editor) return
        editor.chain().focus().clearNodes().unsetAllMarks().run()
        if (onChange && editor) {
            ignoreValueChangeRef.current = true
            onChange(editor.getHTML())
        }
        refreshUndoRedoState()
        setShowColorPopup(false)
    }, [editor, onChange, refreshUndoRedoState])

    const ColorInput = ({ command, title, activeColor }) => {
        const btnRef = useRef(null)
        const isOpen = showColorPopup && colorPopupCommand === command
        const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })

        useLayoutEffect(() => {
            if (isOpen && btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect()
                setPopupPos({
                    top: rect.bottom + 6,
                    left: rect.left,
                })
            }
        }, [isOpen])

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
                    <FlexIcon Icon={Palette} size={16} style={{ position: 'relative', zIndex: 2 }} />
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
        const [open, setOpen] = useState(false)
        const btnRef = useRef(null)

        useEffect(() => {
            if (!open) return
            const handleClickOutside = (e) => {
                if (btnRef.current && !btnRef.current.contains(e.target)) {
                    setOpen(false)
                }
            }
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }, [open])

        const currentHeading = (() => {
            if (activeFormats.h1) return 'Heading 1'
            if (activeFormats.h2) return 'Heading 2'
            if (activeFormats.h3) return 'Heading 3'
            if (activeFormats.h4) return 'Heading 4'
            if (activeFormats.h5) return 'Heading 5'
            if (activeFormats.h6) return 'Heading 6'
            if (activeFormats.paragraph) return 'Paragraf'
            return 'Paragraf'
        })()

        const options = [
            { label: 'Heading 1', value: 'h1', icon: Heading1 },
            { label: 'Heading 2', value: 'h2', icon: Heading2 },
            { label: 'Heading 3', value: 'h3', icon: Heading3 },
            { label: 'Heading 4', value: 'h4', icon: Heading4 },
            { label: 'Heading 5', value: 'h5', icon: Heading5 },
            { label: 'Heading 6', value: 'h6', icon: Heading6 },
            { label: 'Paragraf', value: 'p', icon: Type },
        ]

        const currentOption = options.find(o => {
            if (o.value === 'p') return activeFormats.paragraph
            return activeFormats[o.value]
        }) || options[options.length - 1]
        const ActiveIcon = currentOption.icon

        return (
            <div className="heading-select-wrapper" ref={btnRef}>
                <button
                    type="button"
                    className={`heading-select-btn ${open ? 'open' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setOpen(!open)}
                    title="Heading"
                >
                    <FlexIcon Icon={ActiveIcon} size={16} />
                    <span className="heading-select-label">{currentHeading}</span>
                    <FlexIcon Icon={ChevronDown} size={14} />
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
                                <FlexIcon Icon={Icon} size={16} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const FontSizeSelect = () => {
        const [open, setOpen] = useState(false)
        const [customSize, setCustomSize] = useState('')
        const btnRef = useRef(null)
        const menuRef = useRef(null)

        useEffect(() => {
            if (!open) return
            const handleClickOutside = (e) => {
                if (btnRef.current && !btnRef.current.contains(e.target)) {
                    setOpen(false)
                }
            }
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }, [open])

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
        ]

        const currentLabel = fontSize ? `${fontSize}px` : 'Size'

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
                    <FlexIcon Icon={ChevronDown} size={14} />
                </button>
                {open && (
                    <div className="heading-select-menu font-size-menu" ref={menuRef}>
                        {presets.map(({ label, value }) => (
                            <button
                                key={value}
                                type="button"
                                className={`heading-select-option ${fontSize === value.replace('px', '') ? 'active' : ''}`}
                                onMouseDown={(e) => { e.preventDefault(); exec('fontSize', value); }}
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
                            <button type="button" className="font-size-apply-btn" onMouseDown={e => { e.preventDefault(); if (customSize) exec('fontSize', `${customSize}px`); }}>Terapkan</button>
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
                    <ToolbarButton icon={Undo2} onClick={() => exec('undo')} title="Undo" active={false} disabled={!canUndo} />
                    <ToolbarButton icon={Redo2} onClick={() => exec('redo')} title="Redo" active={false} disabled={!canRedo} />
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
                            <ToolbarButton icon={List} onClick={() => exec('ul')} title="Unordered List" active={activeFormats.ul} />
                            <ToolbarButton icon={ListOrdered} onClick={() => exec('ol')} title="Ordered List" active={activeFormats.ol} />
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
                                    <FlexIcon Icon={Upload} size={14} /> Upload
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
                    <EditorContent editor={editor} />
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
                        <FlexIcon Icon={Trash2} size={14} />
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
                                <FlexIcon Icon={Trash2} size={14} /> Baris
                            </button>
                            <button type="button" className="table-toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={insertTableCol} title="Tambah Kolom">
                                + Kolom
                            </button>
                            <button type="button" className="table-toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={deleteTableCol} title="Hapus Kolom">
                                <FlexIcon Icon={Trash2} size={14} /> Kolom
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
