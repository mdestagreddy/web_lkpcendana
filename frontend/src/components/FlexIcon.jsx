import './FlexIcon.css';

function FlexIcon({ Icon, size = 18, className = '', align = 'center', style, children, strokeWidth, fill, color, absoluteStrokeWidth, ...props }) {
    const iconProps = {};
    if (strokeWidth !== undefined) iconProps.strokeWidth = strokeWidth;
    if (fill !== undefined) iconProps.fill = fill;
    if (color !== undefined) iconProps.color = color;
    if (absoluteStrokeWidth !== undefined) iconProps.absoluteStrokeWidth = absoluteStrokeWidth;

    return (
        <span className={`flex-icon ${className}`.trim()} style={{ alignItems: align, ...style }} {...props}>
            <Icon size={size} {...iconProps} />
            {children}
        </span>
    );
}

export default FlexIcon;
