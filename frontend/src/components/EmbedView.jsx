import { useState, useCallback } from 'react'
import { NodeViewWrapper } from '@tiptap/react'

export default function EmbedView({ node, updateAttributes: _updateAttributes, selected }) {
    const [loaded, setLoaded] = useState(false)
    const { url, width, height, isYouTube, 'data-video-id': videoId } = node.attrs

    const handleClick = useCallback(() => {
        setLoaded(true)
    }, [])

    if (isYouTube && videoId && !loaded) {
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        return (
            <NodeViewWrapper>
                <div
                    className={`embed-wrapper youtube-embed ${selected ? 'selected' : ''}`}
                    contentEditable={false}
                    data-video-id={videoId}
                >
                    <div className="youtube-thumb-wrapper" onClick={handleClick}>
                        <img src={thumbUrl} className="youtube-thumb" alt="YouTube thumbnail" loading="lazy" data-video-id={videoId} />
                        <div className="youtube-play-overlay">
                            <div className="youtube-play-button"></div>
                        </div>
                    </div>
                </div>
            </NodeViewWrapper>
        )
    }

    const iframeSrc = isYouTube && videoId
        ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`
        : url

    const iframeStyle = {
        width: width || '100%',
        maxWidth: '100%',
        height: height || '315px',
    }

    return (
        <NodeViewWrapper>
            <div
                className={`embed-wrapper ${selected ? 'selected' : ''}`}
                contentEditable={false}
            >
                <iframe
                    src={iframeSrc}
                    style={iframeStyle}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </NodeViewWrapper>
    )
}
