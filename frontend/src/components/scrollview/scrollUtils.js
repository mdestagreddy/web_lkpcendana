export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function rubberBandPosition(value, max, factor = 0.35) {
    if (max <= 0) return 0;
    if (value < 0) {
        const overscroll = -value;
        return -overscroll * factor;
    }
    if (value > max) {
        const overscroll = value - max;
        return max + overscroll * factor;
    }
    return value;
}
