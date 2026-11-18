import { ReactElement } from "react";
import { CustomizedDateRangePickerPreviewProps } from "../typings/CustomizedDateRangePickerProps";

export function preview(props: CustomizedDateRangePickerPreviewProps): ReactElement {
    const label = props.labelCaption || "Date range";
    const placeholder = props.placeholder || "Select date and time";

    return (
        <div className="cdp-root">
            {props.showLabel && <label className="cdp-label">{label}</label>}

            <div className="cdp-input-row">
                <div className="cdp-input">
                    <span className="cdp-placeholder">{placeholder}</span>
                    <span aria-hidden="true">▦</span>
                </div>
            </div>

            {props.inline && (
                <div className="cdp-popover cdp-inline">
                    <div className="cdp-calendar">
                        <div className="cdp-calendar-header">
                            <button type="button" disabled>
                                ‹
                            </button>
                            <strong>October 2026</strong>
                            <button type="button" disabled>
                                ›
                            </button>
                        </div>

                        <div className="cdp-weekdays">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                <span key={day}>{day}</span>
                            ))}
                        </div>

                        {[
                            [27, 28, 29, 30, 1, 2, 3],
                            [4, 5, 6, 7, 8, 9, 10],
                            [11, 12, 13, 14, 15, 16, 17],
                            [18, 19, 20, 21, 22, 23, 24],
                            [25, 26, 27, 28, 29, 30, 31]
                        ].map((week, index) => (
                            <div className="cdp-week" key={index}>
                                {week.map((day, dayIndex) => (
                                    <button
                                        className={index === 3 && day === 21 ? "cdp-day cdp-selected" : "cdp-day"}
                                        type="button"
                                        key={`${index}-${dayIndex}`}
                                        disabled
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function getPreviewCss(): string {
    return require("./ui/CustomizedDateRangePicker.css");
}
