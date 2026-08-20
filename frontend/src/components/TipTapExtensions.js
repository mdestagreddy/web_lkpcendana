import { Node, Mark, mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import EmbedView from './EmbedView'

const CustomImage = Image.extend({
    name: 'imageBlock',
    group: 'block',
    addAttributes() {
        return {
            src: { default: null },
            alt: { default: null },
            title: { default: null },
            width: { default: null },
            height: { default: null },
            style: { default: 'max-width: 100%;' }
        }
    }
})

export const Figure = Node.create({
    name: 'figure',
    group: 'block',
    content: 'imageBlock figcaption?',
    defining: true,
    draggable: true,
    selectable: true,
    addAttributes() {
        return {
            class: { default: 'image-figure' }
        }
    },
    parseHTML() {
        return [{ tag: 'figure.image-figure' }]
    },
    renderHTML({ HTMLAttributes }) {
        return ['figure', mergeAttributes(HTMLAttributes, { class: 'image-figure' }), 0]
    },
    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const { editor } = this
                const { selection } = editor.state
                const { $from } = selection
                let current = $from.parent
                while (current) {
                    if (current.type.name === 'figure') {
                        editor.chain().focus().setHardBreak().run()
                        return true
                    }
                    if (current.type.name === 'figcaption') {
                        return false
                    }
                    current = current.parent
                }
                return false
            }
        }
    }
})

export const Figcaption = Node.create({
    name: 'figcaption',
    content: 'inline*',
    group: 'block',
    defining: true,
    addAttributes() {
        return {}
    },
    parseHTML() {
        return [{ tag: 'figcaption' }]
    },
    renderHTML() {
        return ['figcaption', 0]
    },
    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const { editor } = this
                const { selection } = editor.state
                const { $from } = selection
                const parent = $from.parent
                if (parent.type.name !== 'figcaption') {
                    return false
                }
                const isAtEnd = $from.parentOffset >= parent.content.size
                if (isAtEnd) {
                    return false
                }
                editor.chain().focus().setHardBreak().run()
                return true
            }
        }
    }
})

export const EmbedWrapper = Node.create({
    name: 'embedWrapper',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
        return {
            class: { default: 'embed-wrapper' },
            'data-video-id': { default: null },
            url: { default: null },
            width: { default: '100%' },
            height: { default: '315px' },
            isYouTube: { default: false }
        }
    },
    parseHTML() {
        return [{
            tag: 'div.embed-wrapper',
            getAttrs: (node) => {
                const el = node
                const fullClass = el.getAttribute('class') || ''
                const isYouTube = fullClass.includes('youtube-embed') || !!el.getAttribute('data-video-id')
                const iframe = el.querySelector('iframe')
                return {
                    class: fullClass,
                    'data-video-id': el.getAttribute('data-video-id'),
                    url: iframe ? iframe.getAttribute('src') : el.getAttribute('data-url'),
                    width: el.getAttribute('data-width') || '100%',
                    height: el.getAttribute('data-height') || '315px',
                    isYouTube
                }
            }
        }]
    },
    renderHTML({ HTMLAttributes }) {
        const cls = HTMLAttributes.class || 'embed-wrapper'
        return ['div', mergeAttributes(HTMLAttributes, { class: cls })]
    },
    addNodeView() {
        return ReactNodeViewRenderer(EmbedView)
    }
})

export const FontSize = Mark.create({
    name: 'fontSize',
    addAttributes() {
        return {
            size: { default: null }
        }
    },
    parseHTML() {
        return [
            {
                tag: 'span[style*="font-size"]',
                getAttrs: (element) => {
                    const match = element.style?.fontSize?.match(/(\d+(?:\.\d+)?)px/)
                    return match ? { size: match[0] } : false
                }
            }
        ]
    },
    renderHTML({ HTMLAttributes }) {
        if (!HTMLAttributes.size) {
            return ['span', 0]
        }
        return ['span', { style: `font-size: ${HTMLAttributes.size}` }, 0]
    }
})

export const Highlight = Mark.create({
    name: 'highlight',
    addAttributes() {
        return {
            color: { default: null }
        }
    },
    parseHTML() {
        return [
            {
                tag: 'span[style*="background-color"]',
                getAttrs: (element) => {
                    const color = element.style?.backgroundColor
                    return color ? { color } : false
                }
            }
        ]
    },
    renderHTML({ HTMLAttributes }) {
        if (!HTMLAttributes.color) {
            return ['span', 0]
        }
        return ['span', { style: `background-color: ${HTMLAttributes.color}` }, 0]
    }
})

export { CustomImage }
