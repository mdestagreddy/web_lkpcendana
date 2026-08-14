import './CustomColorPicker.css';

const PRESET_COLORS = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
];

export default function CustomColorPicker({ onSelect, onReset }) {
    const handlePresetClick = (color) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(color);
    };

    const handleCustomChange = (e) => {
        onSelect(e.target.value);
    };

    return (
        <div className="custom-color-picker" onClick={(e) => e.stopPropagation()}>
            <div className="color-picker-grid">
                {PRESET_COLORS.map((color) => (
                    <input
                        key={color}
                        type="button"
                        className="color-swatch"
                        style={{ backgroundColor: color }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handlePresetClick(color)}
                        title={color}
                    />
                ))}
            </div>
            <div className="color-picker-custom">
                <label className="color-picker-custom-label" htmlFor="custom-color-input">
                    <span>Custom</span>
                    <input
                        id="custom-color-input"
                        type="color"
                        defaultValue="#000000"
                        onInput={handleCustomChange}
                    />
                </label>
                <button type="button" className="color-picker-reset" onClick={onReset}>
                    Reset
                </button>
            </div>
        </div>
    );
}
