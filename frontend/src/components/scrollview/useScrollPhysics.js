import { useEffect, useRef, useCallback } from 'react';
import { clamp, rubberBandPosition } from './scrollUtils';

const DEFAULT_FRICTION = 0.96;
const DEFAULT_RUBBER_BAND = 0.12;
const DEFAULT_MOMENTUM_MULTIPLIER = 0.8;
const DEFAULT_WHEEL_MULTIPLIER = 1.2;
const DEFAULT_TRACKPAD_MULTIPLIER = 1.0;
const DEFAULT_VELOCITY_SAMPLE_SIZE = 5;
const DEFAULT_VELOCITY_FLING_MIN = 0.25;

function computeMax(scrollSize, viewportSize) {
    return Math.max(0, scrollSize - viewportSize);
}

export function useScrollPhysics({
    friction = DEFAULT_FRICTION,
    rubberBand = DEFAULT_RUBBER_BAND,
    momentumMultiplier = DEFAULT_MOMENTUM_MULTIPLIER,
    wheelMultiplier = DEFAULT_WHEEL_MULTIPLIER,
    trackpadMultiplier = DEFAULT_TRACKPAD_MULTIPLIER,
    velocitySampleSize = DEFAULT_VELOCITY_SAMPLE_SIZE,
    velocityFlingMin = DEFAULT_VELOCITY_FLING_MIN,
    onScroll,
    scrollHeight,
    viewportHeight,
    scrollWidth,
    viewportWidth,
    twoDimension = false,
}) {
    const xRef = useRef(0);
    const yRef = useRef(0);
    const vxRef = useRef(0);
    const vyRef = useRef(0);
    const animationRef = useRef(null);
    const isAnimatingRef = useRef(false);
    const samplesXRef = useRef([]);
    const samplesYRef = useRef([]);
    const lastTimeRef = useRef(0);

    const maxXRef = useRef(0);
    const maxYRef = useRef(0);

    const optionsRef = useRef({
        friction,
        rubberBand,
        momentumMultiplier,
        wheelMultiplier,
        trackpadMultiplier,
        velocitySampleSize,
        velocityFlingMin,
        onScroll,
        twoDimension,
    });

    optionsRef.current = {
        friction,
        rubberBand,
        momentumMultiplier,
        wheelMultiplier,
        trackpadMultiplier,
        velocitySampleSize,
        velocityFlingMin,
        onScroll,
        twoDimension,
    };

    const isTouchModeRef = useRef(false);

    const setTouchMode = useCallback((value) => {
        isTouchModeRef.current = value;
    }, []);

    const recalcBounds = useCallback(() => {
        maxXRef.current = computeMax(scrollWidth || 0, viewportWidth || 0);
        maxYRef.current = computeMax(scrollHeight || 0, viewportHeight || 0);
    }, [scrollWidth, viewportWidth, scrollHeight, viewportHeight]);

    const hasScrollableContent = useCallback(() => {
        const { twoDimension: td } = optionsRef.current;
        if (td) {
            return maxXRef.current > 0 || maxYRef.current > 0;
        }
        return maxYRef.current > 0;
    }, []);

    useEffect(() => {
        recalcBounds();
        if (maxXRef.current <= 0) xRef.current = 0;
        if (maxYRef.current <= 0) yRef.current = 0;
        vxRef.current = 0;
        vyRef.current = 0;
    }, [recalcBounds, scrollWidth, viewportWidth, scrollHeight, viewportHeight]);

    const stopAnimation = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        isAnimatingRef.current = false;
        vxRef.current = 0;
        vyRef.current = 0;
        samplesXRef.current = [];
        samplesYRef.current = [];
    }, []);

    const notify = useCallback(() => {
        const { onScroll: cb, twoDimension: td } = optionsRef.current;
        if (!cb) return;
        if (td) {
            cb({ x: xRef.current, y: yRef.current });
        } else {
            cb(yRef.current);
        }
    }, []);

    const animate = useCallback(() => {
        const { friction: f, twoDimension: td } = optionsRef.current;
        const maxX = maxXRef.current;
        const maxY = maxYRef.current;

        const posX = xRef.current;
        const posY = yRef.current;
        const velX = vxRef.current;
        const velY = vyRef.current;

        const isOverscrolledY = posY < 0 || posY > maxY;
        const isOverscrolledX = posX < 0 || posX > maxX;

        if (isOverscrolledY || isOverscrolledX) {
            if (isTouchModeRef.current) {
                if (isOverscrolledY) {
                    const targetY = posY < 0 ? 0 : maxY;
                    yRef.current += (targetY - posY) * 0.15;
                    if (Math.abs(targetY - yRef.current) < 0.15) {
                        yRef.current = targetY;
                        vyRef.current = 0;
                    } else {
                        vyRef.current *= 0.7;
                    }
                }
                if (isOverscrolledX) {
                    const targetX = posX < 0 ? 0 : maxX;
                    xRef.current += (targetX - posX) * 0.15;
                    if (Math.abs(targetX - xRef.current) < 0.15) {
                        xRef.current = targetX;
                        vxRef.current = 0;
                    } else {
                        vxRef.current *= 0.7;
                    }
                }

                if (Math.abs(vyRef.current) < optionsRef.current.velocityFlingMin && Math.abs(vxRef.current) < optionsRef.current.velocityFlingMin &&
                    Math.abs(yRef.current - (posY < 0 ? 0 : maxY)) < 0.15 &&
                    Math.abs(xRef.current - (posX < 0 ? 0 : maxX)) < 0.15) {
                    xRef.current = clamp(xRef.current, 0, maxX);
                    yRef.current = clamp(yRef.current, 0, maxY);
                    vxRef.current = 0;
                    vyRef.current = 0;
                    stopAnimation();
                    notify();
                    return;
                }

                notify();
                animationRef.current = requestAnimationFrame(animate);
                return;
            } else {
                xRef.current = clamp(xRef.current, 0, maxX);
                yRef.current = clamp(yRef.current, 0, maxY);
                vxRef.current = 0;
                vyRef.current = 0;
                stopAnimation();
                notify();
                return;
            }
        }

        if ((td || maxY > 0) && Math.abs(velY) < 0.04) {
            yRef.current = Math.round(yRef.current);
            vyRef.current = 0;
        }
        if ((td || maxX > 0) && Math.abs(velX) < 0.04) {
            xRef.current = Math.round(xRef.current);
            vxRef.current = 0;
        }

        if (Math.abs(velY) < 0.04 && Math.abs(velX) < 0.04) {
            xRef.current = clamp(xRef.current, 0, maxX);
            yRef.current = clamp(yRef.current, 0, maxY);
            vxRef.current = 0;
            vyRef.current = 0;
            stopAnimation();
            notify();
            return;
        }

        if (td || maxY > 0) {
            yRef.current += velY;
            vyRef.current *= f;
        }

        if (td || maxX > 0) {
            xRef.current += vxRef.current;
            vxRef.current *= f;
        }

        notify();
        animationRef.current = requestAnimationFrame(animate);
    }, [notify, stopAnimation]);

    const startAnimation = useCallback(() => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;
        animationRef.current = requestAnimationFrame(animate);
    }, [animate]);

    const setPosition = useCallback((value) => {
        const { twoDimension: td } = optionsRef.current;
        if (td && typeof value === 'object') {
            const maxX = maxXRef.current;
            const maxY = maxYRef.current;
            if (isTouchModeRef.current) {
                xRef.current = rubberBandPosition(value.x ?? xRef.current, maxX, 0.35);
                yRef.current = rubberBandPosition(value.y ?? yRef.current, maxY, 0.35);
            } else {
                xRef.current = clamp(value.x ?? xRef.current, 0, maxX);
                yRef.current = clamp(value.y ?? yRef.current, 0, maxY);
            }
        } else {
            const maxY = maxYRef.current;
            if (isTouchModeRef.current) {
                yRef.current = rubberBandPosition(value, maxY, 0.35);
            } else {
                yRef.current = clamp(value, 0, maxY);
            }
        }
        notify();
    }, [notify]);

    const getPosition = useCallback(() => {
        const { twoDimension: td } = optionsRef.current;
        return td ? { x: xRef.current, y: yRef.current } : yRef.current;
    }, []);

    const getAxisValues = useCallback(() => {
        const maxX = maxXRef.current;
        const maxY = maxYRef.current;
        return {
            x: { position: xRef.current, max: maxX },
            y: { position: yRef.current, max: maxY },
        };
    }, []);

    const applyWheelDelta = useCallback((deltaY, deltaX) => {
        stopAnimation();
        isTouchModeRef.current = false;
        const { wheelMultiplier: wm, twoDimension: td } = optionsRef.current;

        if (td) {
            const dy = deltaY * wm;
            const dx = deltaX * wm;
            xRef.current = clamp(xRef.current + dx, 0, maxXRef.current);
            yRef.current = clamp(yRef.current + dy, 0, maxYRef.current);
            notify();
        } else {
            const totalDelta = deltaY * wm;
            const newPos = yRef.current + totalDelta;
            yRef.current = clamp(newPos, 0, maxYRef.current);
            notify();
        }

        const now = performance.now();
        const lastTime = lastTimeRef.current;
        if (lastTime > 0) {
            const dt = now - lastTime;
            if (dt > 0) {
                const sampleVal = td ? Math.sqrt(deltaX * deltaX + deltaY * deltaY) : deltaY;
                samplesYRef.current.push({ value: sampleVal, time: now });
                if (samplesYRef.current.length > velocitySampleSize) {
                    samplesYRef.current.shift();
                }
            }
        }
        lastTimeRef.current = now;
        startAnimation();
    }, [stopAnimation, notify, startAnimation, velocitySampleSize]);

    const applyTrackpadDelta = useCallback((deltaY, deltaX) => {
        isTouchModeRef.current = false;
        const { trackpadMultiplier: tm, twoDimension: td } = optionsRef.current;
        const now = performance.now();
        const lastTime = lastTimeRef.current;
        const _dt = lastTime > 0 ? now - lastTime : 16;

        if (td) {
            const dy = deltaY * tm;
            const dx = deltaX * tm;
            xRef.current = clamp(xRef.current + dx, 0, maxXRef.current);
            yRef.current = clamp(yRef.current + dy, 0, maxYRef.current);

            samplesXRef.current.push({ value: dx, time: now });
            samplesYRef.current.push({ value: dy, time: now });
            if (samplesXRef.current.length > velocitySampleSize) samplesXRef.current.shift();
            if (samplesYRef.current.length > velocitySampleSize) samplesYRef.current.shift();
        } else {
            const dy = deltaY * tm;
            yRef.current = clamp(yRef.current + dy, 0, maxYRef.current);

            samplesYRef.current.push({ value: dy, time: now });
            if (samplesYRef.current.length > velocitySampleSize) samplesYRef.current.shift();
        }

        notify();

        if (td) {
            const recentX = samplesXRef.current.slice(-3);
            if (recentX.length >= 2) {
                let avgV = 0;
                for (let i = 1; i < recentX.length; i++) {
                    const dtSample = recentX[i].time - recentX[i - 1].time;
                    if (dtSample > 0) avgV += recentX[i].value / dtSample;
                }
                avgV /= recentX.length - 1;
                vxRef.current = clamp(avgV * 15, -80, 80);
            }
        }

        const recentY = samplesYRef.current.slice(-3);
        if (recentY.length >= 2) {
            let avgV = 0;
            for (let i = 1; i < recentY.length; i++) {
                const dtSample = recentY[i].time - recentY[i - 1].time;
                if (dtSample > 0) avgV += recentY[i].value / dtSample;
            }
            avgV /= recentY.length - 1;
            vyRef.current = clamp(avgV * 15, -80, 80);
        }

        lastTimeRef.current = now;
        startAnimation();
    }, [notify, startAnimation, velocitySampleSize]);

    const applyTouchVelocity = useCallback((velocityX, velocityY) => {
        stopAnimation();
        isTouchModeRef.current = true;
        const { momentumMultiplier: mm, twoDimension: td } = optionsRef.current;

        if (td) {
            if (maxXRef.current > 0) {
                vxRef.current = (velocityX || 0) * mm;
            }
            if (maxYRef.current > 0) {
                vyRef.current = (velocityY || 0) * mm;
            }
        } else {
            if (maxYRef.current > 0) {
                vyRef.current = (velocityY || 0) * mm;
            }
        }
        startAnimation();
    }, [stopAnimation, startAnimation]);

    const scrollTo = useCallback((target, smooth = true) => {
        stopAnimation();
        isTouchModeRef.current = false;
        const { twoDimension: td } = optionsRef.current;

        if (!smooth) {
            if (td && typeof target === 'object') {
                xRef.current = clamp(target.x ?? xRef.current, 0, maxXRef.current);
                yRef.current = clamp(target.y ?? yRef.current, 0, maxYRef.current);
            } else {
                yRef.current = clamp(target, 0, maxYRef.current);
            }
            notify();
            return;
        }

        if (td) {
            const startX = xRef.current;
            const startY = yRef.current;
            const targetX = typeof target === 'object' ? target.x ?? startX : startX;
            const targetY = typeof target === 'object' ? target.y ?? startY : target;
            const distanceX = targetX - startX;
            const distanceY = targetY - startY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            const duration = Math.min(500, distance * 1.5 + 150);
            const startTime = performance.now();
            isAnimatingRef.current = true;

            function tick() {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                xRef.current = startX + distanceX * eased;
                yRef.current = startY + distanceY * eased;
                notify();
                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(tick);
                } else {
                    stopAnimation();
                }
            }
            animationRef.current = requestAnimationFrame(tick);
        } else {
            const startPos = yRef.current;
            const distance = target - startPos;
            const duration = Math.min(500, Math.abs(distance) * 1.5 + 150);
            const startTime = performance.now();
            isAnimatingRef.current = true;

            function tick() {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                yRef.current = startPos + distance * eased;
                notify();
                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(tick);
                } else {
                    stopAnimation();
                }
            }
            animationRef.current = requestAnimationFrame(tick);
        }
    }, [stopAnimation, notify]);

    const isAtBoundary = useCallback((axis, direction) => {
        if (axis === 'x') {
            const pos = xRef.current;
            const max = maxXRef.current;
            if (direction === 'positive') return pos >= max;
            return pos <= 0;
        }
        const pos = yRef.current;
        const max = maxYRef.current;
        if (direction === 'positive') return pos >= max;
        return pos <= 0;
    }, []);

    useEffect(() => {
        return () => stopAnimation();
    }, [stopAnimation, scrollHeight, viewportHeight, scrollWidth, viewportWidth]);

    return {
        getPosition,
        setPosition,
        applyWheelDelta,
        applyTrackpadDelta,
        applyTouchVelocity,
        scrollTo,
        stopAnimation,
        isAtBoundary,
        getAxisValues,
        setTouchMode,
        hasScrollableContent,
        maxScrollX: maxXRef.current,
        maxScrollY: maxYRef.current,
    };
}
