import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useScrollPhysics } from './useScrollPhysics';
import { NestedScrollContext, useNestedScroll } from './useNestedScroll';
import { clamp, rubberBandPosition } from './scrollUtils';
import './ScrollView.css';

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'BUTTON', 'SUMMARY']);

function isFormElement(element) {
    if (!element || !(element instanceof HTMLElement)) return false;
    if (INTERACTIVE_TAGS.has(element.tagName)) return true;
    return false;
}

function isEditable(element) {
    if (!element || !(element instanceof HTMLElement)) return false;
    if (element.isContentEditable) return true;
    const role = element.getAttribute('role');
    if (role === 'textbox' || role === 'searchbox' || role === 'combobox') return true;
    return false;
}

export default function ScrollView({
    children,
    className = '',
    style = {},
    scrollbarClassName = '',
    scrollbarStyle = {},
    showScrollbar = true,
    scrollbarWidth = 8,
    scrollbarMinHeight = 8,
    scrollbarColor,
    scrollbarTrackColor,
    scrollbarBorderRadius,
    scrollbarOpacity,
    scrollbarHoverOpacity,
    friction,
    velocityFlingMin,
    rubberBand,
    momentumMultiplier,
    wheelMultiplier,
    trackpadMultiplier,
    horizontal = false,
    autoScrollOnFocus = true,
    autoScrollPadding = 8,
    onScroll,
    'aria-label': ariaLabel,
    'aria-roledescription': ariaRoleDescription,
}) {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const verticalScrollbarRef = useRef(null);
    const horizontalScrollbarRef = useRef(null);
    const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const [scrollbarSize, setScrollbarSize] = useState({ width: 0, height: 0 });
    const [isDraggingVertical, setIsDraggingVertical] = useState(false);
    const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
    const [showScrollbarThumb, setShowScrollbarThumb] = useState({ x: true, y: true });
    const dragStartPosRef = useRef(0);
    const dragStartScrollRef = useRef(0);
    const wheelEventCountRef = useRef(0);
    const lastWheelTimeRef = useRef(0);
    const trackpadDetectedRef = useRef(false);
    const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
    const touchOriginRef = useRef({ x: 0, y: 0 });
    const touchPositionsRef = useRef([]);
    const parentScrollRef = useRef(null);

    const parentScroll = useNestedScroll();

    useEffect(() => {
        parentScrollRef.current = parentScroll;
    }, [parentScroll]);

    const isTwoDimension = !horizontal;
    const maxScrollY = Math.max(0, contentSize.height - viewportSize.height);
    const maxScrollX = Math.max(0, contentSize.width - viewportSize.width);

    const handleScrollCallback = useCallback((pos) => {
        if (onScroll) {
            if (isTwoDimension && typeof pos === 'object') {
                onScroll(pos);
            } else {
                onScroll(pos);
            }
        }
        if (showScrollbar) {
            const maxY = Math.max(0, contentSize.height - viewportSize.height);
            const maxX = Math.max(0, contentSize.width - viewportSize.width);
            const vTrackSize = scrollbarSize.height;
            const hTrackSize = scrollbarSize.width;

            if (maxY > 0 && vTrackSize > 0) {
                const thumbHeight = Math.max(
                    scrollbarMinHeight,
                    (viewportSize.height / contentSize.height) * vTrackSize
                );
                const thumbY = (pos.y / maxY) * (vTrackSize - thumbHeight);
                setShowScrollbarThumb(prev => ({ ...prev, y: true }));
                setScrollbarThumb({ height: thumbHeight, y: thumbY, width: 0, x: 0 });
            } else if (maxY <= 0) {
                setShowScrollbarThumb(prev => ({ ...prev, y: false }));
            }

            if (maxX > 0 && hTrackSize > 0) {
                const thumbWidth = Math.max(
                    scrollbarMinHeight,
                    (viewportSize.width / contentSize.width) * hTrackSize
                );
                const thumbX = (pos.x / maxX) * (hTrackSize - thumbWidth);
                setShowScrollbarThumb(prev => ({ ...prev, x: true }));
                setScrollbarThumb(prev => ({ ...prev, width: thumbWidth, x: thumbX }));
            } else if (maxX <= 0) {
                setShowScrollbarThumb(prev => ({ ...prev, x: false }));
            }
        }
    }, [onScroll, showScrollbar, contentSize, viewportSize, scrollbarSize, scrollbarMinHeight, isTwoDimension]);

    const {
        setPosition,
        applyWheelDelta,
        applyTrackpadDelta,
        applyTouchVelocity,
        scrollTo,
        stopAnimation,
        getAxisValues,
        setTouchMode,
    } = useScrollPhysics({
        friction,
        velocityFlingMin,
        rubberBand,
        momentumMultiplier,
        wheelMultiplier,
        trackpadMultiplier,
        scrollHeight: contentSize.height,
        viewportHeight: viewportSize.height,
        scrollWidth: contentSize.width,
        viewportWidth: viewportSize.width,
        twoDimension: isTwoDimension,
        onScroll: handleScrollCallback,
    });

    const [scrollbarThumb, setScrollbarThumb] = useState({ width: 0, height: 0, x: 0, y: 0 });

    useEffect(() => {
        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;

        const observer = new ResizeObserver(() => {
            const cw = content.offsetWidth;
            const ch = content.offsetHeight;
            const vw = container.clientWidth;
            const vh = container.clientHeight;
            setContentSize({ width: cw, height: ch });
            setViewportSize({ width: vw, height: vh });
            if (showScrollbar) {
                setScrollbarSize({ width: vw, height: vh });
            }
        });

        observer.observe(container);
        observer.observe(content);
        return () => observer.disconnect();
    }, [showScrollbar]);

    useEffect(() => {
        const maxY = Math.max(0, contentSize.height - viewportSize.height);
        const maxX = Math.max(0, contentSize.width - viewportSize.width);
        const pos = getAxisValues();
        if (pos.y.position > maxY) {
            setPosition({ x: pos.x.position, y: maxY });
        }
        if (pos.x.position > maxX) {
            setPosition({ x: maxX, y: pos.y.position });
        }
        if (maxY <= 0) setShowScrollbarThumb(prev => ({ ...prev, y: false }));
        if (maxX <= 0) setShowScrollbarThumb(prev => ({ ...prev, x: false }));
    }, [contentSize, viewportSize, getAxisValues, setPosition]);

    useEffect(() => {
        if (!autoScrollOnFocus) return;

        const container = containerRef.current;
        if (!container) return;

        function handleFocusIn(e) {
            const target = e.target;
            if (!container.contains(target)) return;
            if (isFormElement(target)) return;

            const containerRect = container.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const padding = autoScrollPadding;

            const viewportTop = containerRect.top;
            const viewportBottom = containerRect.bottom;
            const viewportLeft = containerRect.left;
            const viewportRight = containerRect.right;

            const targetTop = targetRect.top;
            const targetBottom = targetRect.bottom;
            const targetLeft = targetRect.left;
            const targetRight = targetRect.right;

            const isVerticalOverscroll = targetTop < viewportTop + padding || targetBottom > viewportBottom - padding;
            const isHorizontalOverscroll = targetLeft < viewportLeft + padding || targetRight > viewportRight - padding;

            if (!isVerticalOverscroll && !isHorizontalOverscroll) return;

            const maxY = Math.max(0, contentSize.height - viewportSize.height);
            const maxX = Math.max(0, contentSize.width - viewportSize.width);

            if (maxY <= 0 && maxX <= 0) return;

            const pos = getAxisValues();
            let targetY = pos.y.position;
            let targetX = pos.x.position;

            if (maxY > 0) {
                if (targetTop < viewportTop + padding) {
                    const offset = viewportTop + padding - targetTop;
                    targetY = pos.y.position - offset;
                } else if (targetBottom > viewportBottom - padding) {
                    const offset = targetBottom - (viewportBottom - padding);
                    targetY = pos.y.position + offset;
                }
                targetY = clamp(targetY, 0, maxY);
            }

            if (maxX > 0) {
                if (targetLeft < viewportLeft + padding) {
                    const offset = viewportLeft + padding - targetLeft;
                    targetX = pos.x.position - offset;
                } else if (targetRight > viewportRight - padding) {
                    const offset = targetRight - (viewportRight - padding);
                    targetX = pos.x.position + offset;
                }
                targetX = clamp(targetX, 0, maxX);
            }

            if (isTwoDimension) {
                if (targetX !== pos.x.position || targetY !== pos.y.position) {
                    scrollTo({ x: targetX, y: targetY });
                }
            } else {
                if (targetY !== pos.y.position) {
                    scrollTo(targetY);
                }
            }
        }

        container.addEventListener('focusin', handleFocusIn);

        return () => {
            container.removeEventListener('focusin', handleFocusIn);
        };
    }, [autoScrollOnFocus, autoScrollPadding, contentSize, viewportSize, isTwoDimension, getAxisValues, scrollTo]);

    useEffect(() => {
        if (!autoScrollOnFocus) return;

        function handleSelectionChange() {
            const active = document.activeElement;
            if (!active || !(active instanceof HTMLElement)) return;
            if (!active.isContentEditable) return;

            const container = containerRef.current;
            if (!container || !container.contains(active)) return;

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const rects = range.getClientRects();
            if (rects.length === 0) return;

            const caretRect = rects[0];
            const containerRect = container.getBoundingClientRect();
            const padding = autoScrollPadding;

            const isVerticalOverscroll = caretRect.top < containerRect.top + padding || caretRect.bottom > containerRect.bottom - padding;
            const isHorizontalOverscroll = caretRect.left < containerRect.left + padding || caretRect.right > containerRect.right - padding;

            if (!isVerticalOverscroll && !isHorizontalOverscroll) return;

            const maxY = Math.max(0, contentSize.height - viewportSize.height);
            const maxX = Math.max(0, contentSize.width - viewportSize.width);

            if (maxY <= 0 && maxX <= 0) return;

            const pos = getAxisValues();
            let targetY = pos.y.position;
            let targetX = pos.x.position;

            if (maxY > 0) {
                if (caretRect.top < containerRect.top + padding) {
                    const offset = containerRect.top + padding - caretRect.top;
                    targetY = pos.y.position - offset;
                } else if (caretRect.bottom > containerRect.bottom - padding) {
                    const offset = caretRect.bottom - (containerRect.bottom - padding);
                    targetY = pos.y.position + offset;
                }
                targetY = clamp(targetY, 0, maxY);
            }

            if (maxX > 0) {
                if (caretRect.left < containerRect.left + padding) {
                    const offset = containerRect.left + padding - caretRect.left;
                    targetX = pos.x.position - offset;
                } else if (caretRect.right > containerRect.right - padding) {
                    const offset = caretRect.right - (containerRect.right - padding);
                    targetX = pos.x.position + offset;
                }
                targetX = clamp(targetX, 0, maxX);
            }

            if (isTwoDimension) {
                if (targetX !== pos.x.position || targetY !== pos.y.position) {
                    scrollTo({ x: targetX, y: targetY });
                }
            } else {
                if (targetY !== pos.y.position) {
                    scrollTo(targetY);
                }
            }
        }

        document.addEventListener('selectionchange', handleSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [autoScrollOnFocus, autoScrollPadding, contentSize, viewportSize, isTwoDimension, getAxisValues, scrollTo]);

    const isTrackpad = useCallback((deltaY, deltaX) => {
        const now = performance.now();
        const timeSinceLastWheel = now - lastWheelTimeRef.current;
        const isRapid = timeSinceLastWheel < 50;

        if (isRapid) {
            wheelEventCountRef.current += 1;
        } else {
            wheelEventCountRef.current = 1;
        }

        const smallDelta = Math.abs(deltaY) < 40 && Math.abs(deltaX) < 40;
        const rapidEvents = wheelEventCountRef.current > 3;

        lastWheelTimeRef.current = now;

        if (rapidEvents && smallDelta) {
            trackpadDetectedRef.current = true;
        }

        if (Math.abs(deltaY) > 80 || Math.abs(deltaX) > 80) {
            trackpadDetectedRef.current = false;
        }

        return trackpadDetectedRef.current && smallDelta;
    }, []);

    const handleWheel = useCallback((e) => {
        const deltaY = e.deltaY;
        const deltaX = e.deltaX;

        const hasVerticalScroll = maxScrollY > 0;
        const hasHorizontalScroll = maxScrollX > 0;

        const scrollY = deltaY !== 0 && hasVerticalScroll;
        const scrollX = deltaX !== 0 && hasHorizontalScroll;

        if (!scrollY && !scrollX) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        stopAnimation();

        if (isTrackpad(deltaY, deltaX)) {
            applyTrackpadDelta(deltaY, deltaX);
        } else {
            if (isTwoDimension && scrollX && !scrollY) {
                const pos = getAxisValues();
                const newPos = pos.x.position + deltaX * wheelMultiplier;
                setPosition({ x: newPos, y: pos.y.position });
            } else {
                applyWheelDelta(deltaY, deltaX);
            }
        }
    }, [isTrackpad, applyTrackpadDelta, applyWheelDelta, stopAnimation, isTwoDimension, maxScrollY, maxScrollX, getAxisValues, setPosition, wheelMultiplier]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        function onWheel(e) {
            handleWheel(e);
        }

        container.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, [handleWheel]);

    const lockedAxisRef = useRef(null);

    const handlePointerDown = useCallback((e) => {
        if (e.pointerType === 'mouse') return;
        stopAnimation();
        setTouchMode(true);
        containerRef.current.setPointerCapture(e.pointerId);
        const now = performance.now();
        touchStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            time: now,
        };
        touchOriginRef.current = {
            x: e.clientX,
            y: e.clientY,
        };
        touchPositionsRef.current = [{ x: e.clientX, y: e.clientY, time: now }];
        lockedAxisRef.current = null;
    }, [stopAnimation, setTouchMode]);

    const handlePointerMove = useCallback((e) => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault();
        const now = performance.now();
        touchPositionsRef.current.push({ x: e.clientX, y: e.clientY, time: now });
        if (touchPositionsRef.current.length > 10) {
            touchPositionsRef.current.shift();
        }

        const totalDeltaX = e.clientX - touchOriginRef.current.x;
        const totalDeltaY = e.clientY - touchOriginRef.current.y;

        if (!lockedAxisRef.current) {
            const absX = Math.abs(totalDeltaX);
            const absY = Math.abs(totalDeltaY);
            const threshold = 8;

            if (absX > threshold || absY > threshold) {
                if (absX > absY) {
                    lockedAxisRef.current = 'x';
                } else {
                    lockedAxisRef.current = 'y';
                }
            }
        }

        const pos = getAxisValues();
        let newX = pos.x.position;
        let newY = pos.y.position;

        if (lockedAxisRef.current === 'x') {
            const dx = e.clientX - touchStartRef.current.x;
            newX = rubberBandPosition(pos.x.position - dx, maxScrollX, 0.35);
        } else if (lockedAxisRef.current === 'y') {
            const dy = e.clientY - touchStartRef.current.y;
            newY = rubberBandPosition(pos.y.position - dy, maxScrollY, 0.35);
        } else if (isTwoDimension) {
            const dx = e.clientX - touchStartRef.current.x;
            const dy = e.clientY - touchStartRef.current.y;
            newX = rubberBandPosition(pos.x.position - dx, maxScrollX, 0.35);
            newY = rubberBandPosition(pos.y.position - dy, maxScrollY, 0.35);
        }

        setPosition({ x: newX, y: newY });
        touchStartRef.current.x = e.clientX;
        touchStartRef.current.y = e.clientY;
    }, [isTwoDimension, getAxisValues, setPosition, maxScrollX, maxScrollY]);

    const handlePointerUp = useCallback((e) => {
        if (e.pointerType === 'mouse') return;
        try { containerRef.current.releasePointerCapture(e.pointerId); } catch {}

        if (touchPositionsRef.current.length >= 2) {
            const recent = touchPositionsRef.current.slice(-5);
            let velocityX = 0;
            let velocityY = 0;
            for (let i = 1; i < recent.length; i++) {
                const dt = recent[i].time - recent[i - 1].time;
                if (dt > 0) {
                    velocityX += (recent[i].x - recent[i - 1].x) / dt;
                    velocityY += (recent[i].y - recent[i - 1].y) / dt;
                }
            }
            velocityX = velocityX / (recent.length - 1);
            velocityY = velocityY / (recent.length - 1);

            if (lockedAxisRef.current === 'x') {
                applyTouchVelocity(-velocityX * 16, 0);
            } else if (lockedAxisRef.current === 'y') {
                applyTouchVelocity(0, -velocityY * 16);
            } else {
                applyTouchVelocity(-velocityX * 16, -velocityY * 16);
            }
        }
        touchPositionsRef.current = [];
        lockedAxisRef.current = null;
    }, [applyTouchVelocity]);

    const handlePointerCancel = useCallback((e) => {
        if (e.pointerType === 'mouse') return;
        try { containerRef.current.releasePointerCapture(e.pointerId); } catch {}
        touchPositionsRef.current = [];
        stopAnimation();
    }, [stopAnimation]);

    const handleKeyDown = useCallback((e) => {
        if (isEditable(document.activeElement)) return;
        const maxY = Math.max(0, contentSize.height - viewportSize.height);
        const maxX = Math.max(0, contentSize.width - viewportSize.width);
        const step = viewportSize.height * 0.3;
        let dx = 0;
        let dy = 0;

        if (isTwoDimension) {
            if (e.key === 'ArrowRight') dx = step;
            else if (e.key === 'ArrowLeft') dx = -step;
            else if (e.key === 'ArrowDown') dy = step;
            else if (e.key === 'ArrowUp') dy = -step;
            else if (e.key === 'PageDown') dy = viewportSize.height;
            else if (e.key === 'PageUp') dy = -viewportSize.height;
            else if (e.key === 'Home') { scrollTo({ x: 0, y: 0 }); return; }
            else if (e.key === 'End') { scrollTo({ x: maxX, y: maxY }); return; }
            else return;
        } else {
            if (e.key === 'ArrowDown') dy = step;
            else if (e.key === 'ArrowUp') dy = -step;
            else if (e.key === 'PageDown') dy = viewportSize.height;
            else if (e.key === 'PageUp') dy = -viewportSize.height;
            else if (e.key === 'Home') { scrollTo(0); return; }
            else if (e.key === 'End') { scrollTo(maxY); return; }
            else return;
        }

        e.preventDefault();
        stopAnimation();
        const pos = getAxisValues();
        setPosition({
            x: clamp(pos.x.position + dx, 0, maxX),
            y: clamp(pos.y.position + dy, 0, maxY),
        });
    }, [isTwoDimension, contentSize, viewportSize, getAxisValues, setPosition, scrollTo, stopAnimation]);

    const handleVerticalScrollbarMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingVertical(true);

        const rect = verticalScrollbarRef.current.getBoundingClientRect();
        const clientY = e.clientY;
        const trackHeight = rect.height;
        const relativePos = clientY - rect.top;
        const max = Math.max(0, contentSize.height - viewportSize.height);
        const thumbHeight = scrollbarThumb.height;
        const trackRange = trackHeight - thumbHeight;

        if (trackRange <= 0) return;

        let newScrollPos = (relativePos / trackRange) * max;
        newScrollPos = clamp(newScrollPos, 0, max);

        stopAnimation();
        setPosition({ x: getAxisValues().x.position, y: newScrollPos });

        dragStartPosRef.current = clientY;
        dragStartScrollRef.current = newScrollPos;
    }, [contentSize, viewportSize, scrollbarThumb, setPosition, stopAnimation, getAxisValues]);

    const handleHorizontalScrollbarMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingHorizontal(true);

        const rect = horizontalScrollbarRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const trackWidth = rect.width;
        const relativePos = clientX - rect.left;
        const max = Math.max(0, contentSize.width - viewportSize.width);
        const thumbWidth = scrollbarThumb.width;
        const trackRange = trackWidth - thumbWidth;

        if (trackRange <= 0) return;

        let newScrollPos = (relativePos / trackRange) * max;
        newScrollPos = clamp(newScrollPos, 0, max);

        stopAnimation();
        setPosition({ x: newScrollPos, y: getAxisValues().y.position });

        dragStartPosRef.current = clientX;
        dragStartScrollRef.current = newScrollPos;
    }, [contentSize, viewportSize, scrollbarThumb, setPosition, stopAnimation, getAxisValues]);

    useEffect(() => {
        if (!isDraggingVertical && !isDraggingHorizontal) return;

        function handleMouseMove(e) {
            const maxY = Math.max(0, contentSize.height - viewportSize.height);
            const maxX = Math.max(0, contentSize.width - viewportSize.width);

            if (isDraggingVertical) {
                const rect = verticalScrollbarRef.current.getBoundingClientRect();
                const delta = e.clientY - dragStartPosRef.current;
                const trackHeight = rect.height;
                const thumbHeight = scrollbarThumb.height;
                const trackRange = trackHeight - thumbHeight;

                if (trackRange <= 0) return;

                const scrollDelta = (delta / trackRange) * maxY;
                let newScrollPos = dragStartScrollRef.current + scrollDelta;
                newScrollPos = clamp(newScrollPos, 0, maxY);

                setPosition({ x: getAxisValues().x.position, y: newScrollPos });
            }

            if (isDraggingHorizontal) {
                const rect = horizontalScrollbarRef.current.getBoundingClientRect();
                const delta = e.clientX - dragStartPosRef.current;
                const trackWidth = rect.width;
                const thumbWidth = scrollbarThumb.width;
                const trackRange = trackWidth - thumbWidth;

                if (trackRange <= 0) return;

                const scrollDelta = (delta / trackRange) * maxX;
                let newScrollPos = dragStartScrollRef.current + scrollDelta;
                newScrollPos = clamp(newScrollPos, 0, maxX);

                setPosition({ x: newScrollPos, y: getAxisValues().y.position });
            }
        }

        function handleMouseUp() {
            setIsDraggingVertical(false);
            setIsDraggingHorizontal(false);
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingVertical, isDraggingHorizontal, contentSize, viewportSize, scrollbarThumb, setPosition, getAxisValues]);

    useEffect(() => {
        const maxY = Math.max(0, contentSize.height - viewportSize.height);
        const maxX = Math.max(0, contentSize.width - viewportSize.width);
        if (maxY <= 0) setShowScrollbarThumb(prev => ({ ...prev, y: false }));
        else if (showScrollbar) setShowScrollbarThumb(prev => ({ ...prev, y: true }));

        if (maxX <= 0) setShowScrollbarThumb(prev => ({ ...prev, x: false }));
        else if (showScrollbar) setShowScrollbarThumb(prev => ({ ...prev, x: true }));
    }, [contentSize, viewportSize, showScrollbar]);

    const showVerticalScrollbar = showScrollbar && scrollbarSize.height > 0 && scrollbarThumb.height > 0 && showScrollbarThumb.y && maxScrollY > 0;
    const showHorizontalScrollbar = showScrollbar && scrollbarSize.width > 0 && scrollbarThumb.width > 0 && showScrollbarThumb.x && maxScrollX > 0;

    const scrollbarCustomStyle = useMemo(() => {
        const base = {
            '--scrollview-scrollbar-width': `${scrollbarWidth}px`,
            '--scrollview-scrollbar-track-color': scrollbarTrackColor || 'transparent',
            '--scrollview-scrollbar-color': scrollbarColor || '#888888',
            '--scrollview-scrollbar-min-height': `${scrollbarMinHeight}px`,
            '--scrollview-scrollbar-thumb-size-y': `${scrollbarThumb.height}px`,
            '--scrollview-scrollbar-thumb-size-x': `${scrollbarThumb.width}px`,
            '--scrollview-scrollbar-thumb-position-y': `${scrollbarThumb.y}px`,
            '--scrollview-scrollbar-thumb-position-x': `${scrollbarThumb.x}px`,
            '--scrollview-scrollbar-border-radius': scrollbarBorderRadius || '4px',
            '--scrollview-scrollbar-opacity': scrollbarOpacity ?? 0.4,
            '--scrollview-scrollbar-hover-opacity': scrollbarHoverOpacity ?? 0.8,
            ...scrollbarStyle,
        };
        return base;
    }, [
        scrollbarWidth,
        scrollbarTrackColor,
        scrollbarColor,
        scrollbarMinHeight,
        scrollbarThumb.height,
        scrollbarThumb.width,
        scrollbarThumb.y,
        scrollbarThumb.x,
        scrollbarBorderRadius,
        scrollbarOpacity,
        scrollbarHoverOpacity,
        scrollbarStyle,
    ]);

    const nestedContextValue = useMemo(() => ({
        handleWheel,
    }), [handleWheel]);

    const transform = isTwoDimension
        ? `translate3d(${-getAxisValues().x.position}px, ${-getAxisValues().y.position}px, 0)`
        : `translate3d(0, ${-getAxisValues().y.position}px, 0)`;

    return (
        <NestedScrollContext.Provider value={nestedContextValue}>
            <div
                ref={containerRef}
                className={`scrollview-container ${className}`}
                style={style}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="region"
                aria-label={ariaLabel || 'Scrollable area'}
                aria-roledescription={ariaRoleDescription || 'scrollview'}
            >
                <div
                    ref={contentRef}
                    className="scrollview-content"
                    style={{
                        transform,
                        willChange: 'transform',
                    }}
                >
                    {children}
                </div>
                {showVerticalScrollbar && (
                    <div
                        ref={verticalScrollbarRef}
                        className={`scrollview-scrollbar scrollview-scrollbar--vertical ${isDraggingVertical ? 'scrollview-scrollbar--dragging' : ''} ${scrollbarClassName}`}
                        style={scrollbarCustomStyle}
                        onMouseDown={handleVerticalScrollbarMouseDown}
                        role="scrollbar"
                        aria-orientation="vertical"
                        aria-valuenow={Math.round(getAxisValues().y.position)}
                        aria-valuemin={0}
                        aria-valuemax={Math.round(maxScrollY)}
                        tabIndex={-1}
                    >
                        <div
                            className="scrollview-scrollbar-thumb"
                            style={{
                                width: 'var(--scrollview-scrollbar-width)',
                                height: 'var(--scrollview-scrollbar-thumb-size-y)',
                                transform: 'translate3d(0, var(--scrollview-scrollbar-thumb-position-y), 0)',
                            }}
                        />
                    </div>
                )}
                {showHorizontalScrollbar && (
                    <div
                        ref={horizontalScrollbarRef}
                        className={`scrollview-scrollbar scrollview-scrollbar--horizontal ${isDraggingHorizontal ? 'scrollview-scrollbar--dragging' : ''} ${scrollbarClassName}`}
                        style={scrollbarCustomStyle}
                        onMouseDown={handleHorizontalScrollbarMouseDown}
                        role="scrollbar"
                        aria-orientation="horizontal"
                        aria-valuenow={Math.round(getAxisValues().x.position)}
                        aria-valuemin={0}
                        aria-valuemax={Math.round(maxScrollX)}
                        tabIndex={-1}
                    >
                        <div
                            className="scrollview-scrollbar-thumb"
                            style={{
                                width: 'var(--scrollview-scrollbar-thumb-size-x)',
                                height: 'var(--scrollview-scrollbar-width)',
                                transform: 'translate3d(var(--scrollview-scrollbar-thumb-position-x), 0, 0)',
                            }}
                        />
                    </div>
                )}
            </div>
        </NestedScrollContext.Provider>
    );
}
