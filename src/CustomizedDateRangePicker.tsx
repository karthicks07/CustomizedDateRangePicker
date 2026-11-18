import { ReactElement, useEffect, useRef, useState } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";
import { CustomizedDateRangePickerContainerProps } from "../typings/CustomizedDateRangePickerProps";
import "./ui/CustomizedDateRangePicker.css";

type PickerType = "Date" | "Time" | "DateTime" | "Year";
type TimeFormat = "hour12" | "hour24";

type PickerProps = CustomizedDateRangePickerContainerProps & {
    startDate: EditableValue<Date>;
    endDate?: EditableValue<Date>;
    minDate?: DynamicValue<Date>;
    maxDate?: DynamicValue<Date>;
    minTime?: DynamicValue<Date>;
    maxTime?: DynamicValue<Date>;
    pickerType: PickerType;
    timeFormat: TimeFormat;
    onEnter?: ActionValue;
    onLeave?: ActionValue;
    onChange?: ActionValue;
};

const pad = (value: number): string => String(value).padStart(2, "0");

const sameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const dateKey = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dayKeyCompare = (a: Date, b: Date): number => {
    const aTime = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const bTime = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return aTime - bTime;
};

const formatDate = (
    date: Date,
    type: PickerType,
    format: TimeFormat
): string => {
    const dateText =
        `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

    if (type === "Date") {
        return dateText;
    }

    if (type === "Year") {
        return String(date.getFullYear());
    }

    const hours = format === "hour12"
        ? date.getHours() % 12 || 12
        : date.getHours();

    const timeText =
        `${pad(hours)}:${pad(date.getMinutes())}` +
        (format === "hour12"
            ? date.getHours() >= 12 ? " PM" : " AM"
            : "");

    return type === "Time" ? timeText : `${dateText} ${timeText}`;
};

const withDate = (original: Date | undefined, selected: Date): Date => {
    const result = original ? new Date(original) : new Date();

    result.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate()
    );

    return result;
};

const withTime = (
    original: Date | undefined,
    hours: number,
    minutes: number
): Date => {
    const result = original ? new Date(original) : new Date();
    result.setHours(hours, minutes, 0, 0);
    return result;
};

const getTimeMinutes = (date: Date | undefined): number | undefined =>
    date ? date.getHours() * 60 + date.getMinutes() : undefined;

const isToday = (date: Date | undefined): boolean => {
    if (!date) {
        return false;
    }

    const today = new Date();

    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
};

export function CustomizedDateRangePicker(
    props: PickerProps
): ReactElement {
    const {
        startDate,
        endDate,
        minDate,
        maxDate,
        minTime,
        maxTime,
        dateRange,
        pickerType,
        placeholder,
        labelCaption,
        showLabel,
        clearable,
        inline,
        editable,
        required,
        timeInterval,
        timeFormat,
        showWeekNumbers,
        startLabel,
        endLabel,
        onEnter,
        onLeave,
        onChange
    } = props;

    const [open, setOpen] = useState(false);
    const [activeTarget, setActiveTarget] = useState<"start" | "end">("start");
    const [hoveredDay, setHoveredDay] = useState<Date | undefined>(undefined);

    const rootRef = useRef<HTMLDivElement>(null);

    const start = startDate.value ?? undefined;
    const end = dateRange ? endDate?.value ?? undefined : undefined;

    const min = minDate?.value ?? undefined;
    const max = maxDate?.value ?? undefined;

    const minTimeMinutes = getTimeMinutes(minTime?.value ?? undefined);
    const maxTimeMinutes = getTimeMinutes(maxTime?.value ?? undefined);

    const rangeMode = Boolean(dateRange);

    const startValidation = startDate.validation;
    const endValidation = rangeMode ? endDate?.validation : undefined;

    const hasValidationError = Boolean(startValidation || endValidation);
    const rangeConfigurationError = rangeMode && !endDate;

    const disabled =
        !editable ||
        startDate.readOnly ||
        rangeConfigurationError;

    const interval = Math.max(1, Math.min(60, timeInterval || 15));

    const initialDate = start ?? new Date();

    const [visibleMonth, setVisibleMonth] = useState(
        () => new Date(
            initialDate.getFullYear(),
            initialDate.getMonth(),
            1
        )
    );

    useEffect(() => {
        if (!open || inline) {
            return;
        }

        const handleOutsideClick = (event: MouseEvent): void => {
            if (
                rootRef.current &&
                !rootRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
                setActiveTarget("start");
                setHoveredDay(undefined);
                onLeave?.execute();
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [open, inline, onLeave]);

    const commitChange = (): void => {
        onChange?.execute();
    };

    const showPicker = (): void => {
        if (disabled || open) {
            return;
        }

        const current = start ?? new Date();

        setVisibleMonth(
            new Date(current.getFullYear(), current.getMonth(), 1)
        );

        // Always start with Start active. End is selected explicitly.
        setActiveTarget("start");
        setHoveredDay(undefined);
        setOpen(true);

        onEnter?.execute();
    };

    const closePicker = (): void => {
        setOpen(false);
        setActiveTarget("start");
        setHoveredDay(undefined);
        onLeave?.execute();
    };

    const selectStart = (selected: Date): void => {
        const next = withDate(start, selected);

        if (pickerType === "Date") {
            next.setHours(0, 0, 0, 0);
        }

        // Start must never be later than End.
        if (rangeMode && end) {
            const isDateOnly = pickerType === "Date" || pickerType === "Year";
            const isInvalid = isDateOnly
                ? dayKeyCompare(next, end) > 0
                : next.getTime() > end.getTime();

            if (isInvalid) {
                return;
            }
        }

        startDate.setValue(next);

        setActiveTarget("start");
        setHoveredDay(undefined);

        commitChange();
    };

    const selectEnd = (selected: Date): void => {
        if (!rangeMode || !endDate || endDate.readOnly) {
            return;
        }

        const next = withDate(end, selected);

        if (pickerType === "Date") {
            next.setHours(0, 0, 0, 0);
        }

        // End must never be earlier than Start.
        if (start) {
            const isDateOnly = pickerType === "Date" || pickerType === "Year";
            const isInvalid = isDateOnly
                ? dayKeyCompare(next, start) < 0
                : next.getTime() < start.getTime();

            if (isInvalid) {
                return;
            }
        }

        endDate.setValue(next);
        setActiveTarget("end");
        setHoveredDay(undefined);

        commitChange();

        if (pickerType === "Date" || pickerType === "Year") {
            closePicker();
        }
    };

    const selectDay = (day: Date): void => {
        if (min && dayKeyCompare(day, min) < 0) {
            return;
        }

        if (max && dayKeyCompare(day, max) > 0) {
            return;
        }

        if (pickerType === "Year") {
            const selected = new Date(
                day.getFullYear(),
                start?.getMonth() ?? 0,
                start?.getDate() ?? 1
            );

            if (rangeMode && endDate && activeTarget === "end") {
                selectEnd(selected);
            } else {
                selectStart(selected);

                if (rangeMode && endDate) {
                    return;
                }

                closePicker();
            }

            return;
        }

        if (rangeMode && endDate && activeTarget === "end") {
            selectEnd(day);
        } else {
            selectStart(day);

            if (!rangeMode) {
                closePicker();
            }
        }
    };

    const changeTime = (hours: number, minutes: number): void => {
        const isSelectingEnd = rangeMode && activeTarget === "end";

        const current = isSelectingEnd
            ? end ?? (pickerType === "Time" ? start : undefined)
            : start;

        const next = withTime(current, hours, minutes);
        const selectedMinutes = hours * 60 + minutes;

        const applyTimeLimits =
            pickerType === "Time" || isToday(next);

        if (
            applyTimeLimits &&
            minTimeMinutes !== undefined &&
            selectedMinutes < minTimeMinutes
        ) {
            return;
        }

        if (
            applyTimeLimits &&
            maxTimeMinutes !== undefined &&
            selectedMinutes > maxTimeMinutes
        ) {
            return;
        }

        if (isSelectingEnd && endDate && !endDate.readOnly) {
            // End time must not be earlier than Start time.
            if (start && next.getTime() < start.getTime()) {
                return;
            }

            endDate.setValue(next);
        } else {
            if (min && next < min) {
                return;
            }

            if (max && next > max) {
                return;
            }

            // Start time must not be later than End time.
            if (rangeMode && end && next.getTime() > end.getTime()) {
                return;
            }

            startDate.setValue(next);

            if (!rangeMode) {
                closePicker();
            }
        }

        commitChange();
    };

    const clearValues = (): void => {
        if (disabled) {
            return;
        }

        startDate.setValue(undefined);

        if (rangeMode && endDate && !endDate.readOnly) {
            endDate.setValue(undefined);
        }

        setActiveTarget("start");
        setHoveredDay(undefined);

        commitChange();
    };

    const renderCalendar = (): ReactElement => {
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();

        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const cells: Date[] = [];

        for (let i = 0; i < firstWeekday; i++) {
            cells.push(new Date(year, month, i - firstWeekday + 1));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            cells.push(new Date(year, month, day));
        }

        while (cells.length % 7 !== 0) {
            const lastDay = cells[cells.length - 1];

            cells.push(
                new Date(
                    lastDay.getFullYear(),
                    lastDay.getMonth(),
                    lastDay.getDate() + 1
                )
            );
        }

        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        return (
            <div
                className="cdp-calendar"
                onMouseLeave={() => setHoveredDay(undefined)}
            >
                <div className="cdp-calendar-header">
                    <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
                    >
                        ‹
                    </button>

                    <strong>
                        {visibleMonth.toLocaleDateString(
                            undefined,
                            { month: "long" }
                        )}{" "}
                        {year}
                    </strong>

                    <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
                    >
                        ›
                    </button>
                </div>

                <div
                    className="cdp-weekdays"
                    style={{
                        gridTemplateColumns: showWeekNumbers
                            ? "28px repeat(7, minmax(30px, 1fr))"
                            : undefined
                    }}
                >
                    {showWeekNumbers && (
                        <span className="cdp-week-number">Wk</span>
                    )}

                    {weekdays.map(day => (
                        <span key={day}>{day}</span>
                    ))}
                </div>

                {Array.from(
                    { length: cells.length / 7 },
                    (_, weekIndex) => {
                        const weekCells = cells.slice(
                            weekIndex * 7,
                            weekIndex * 7 + 7
                        );

                        return (
                            <div
                                className="cdp-week"
                                key={`${year}-${month}-${weekIndex}`}
                                style={{
                                    gridTemplateColumns: showWeekNumbers
                                        ? "28px repeat(7, minmax(30px, 1fr))"
                                        : undefined
                                }}
                            >
                                {showWeekNumbers && (
                                    <span className="cdp-week-number">
                                        {getWeekNumber(weekCells[0])}
                                    </span>
                                )}

                                {weekCells.map(day => {
                                    const isCurrentMonth = day.getMonth() === month;

                                    const isStart = Boolean(
                                        start && sameDay(day, start)
                                    );

                                    const isEnd = Boolean(
                                        rangeMode && end && sameDay(day, end)
                                    );

                                    const previewEnd =
                                        rangeMode &&
                                        activeTarget === "end" &&
                                        start &&
                                        !end
                                            ? hoveredDay
                                            : undefined;

                                    const rangeStart =
                                        previewEnd &&
                                        start &&
                                        dayKeyCompare(previewEnd, start) < 0
                                            ? previewEnd
                                            : start;

                                    const rangeEnd =
                                        previewEnd &&
                                        start &&
                                        dayKeyCompare(previewEnd, start) < 0
                                            ? start
                                            : previewEnd ?? end;

                                    const isBetween = Boolean(
                                        rangeMode &&
                                        rangeStart &&
                                        rangeEnd &&
                                        dayKeyCompare(day, rangeStart) > 0 &&
                                        dayKeyCompare(day, rangeEnd) < 0
                                    );

                                    const isPreviewEndpoint = Boolean(
                                        previewEnd && sameDay(day, previewEnd)
                                    );

                                    const outOfBounds =
                                        Boolean(min && dayKeyCompare(day, min) < 0) ||
                                        Boolean(max && dayKeyCompare(day, max) > 0);

                                    // Prevent dates that violate the selected range boundaries.
                                    const violatesRange =
                                        rangeMode &&
                                        ((activeTarget === "start" &&
                                            Boolean(end) &&
                                            dayKeyCompare(day, end as Date) > 0) ||
                                            (activeTarget === "end" &&
                                                Boolean(start) &&
                                                dayKeyCompare(day, start as Date) < 0));

                                    return (
                                        <button
                                            type="button"
                                            key={dateKey(day)}
                                            disabled={
                                                !isCurrentMonth ||
                                                outOfBounds ||
                                                violatesRange ||
                                                disabled ||
                                                (rangeMode &&
                                                    activeTarget === "end" &&
                                                    Boolean(endDate?.readOnly))
                                            }
                                            className={[
                                                "cdp-day",
                                                isStart || isEnd ? "cdp-selected" : "",
                                                isBetween ? "cdp-in-range" : "",
                                                isPreviewEndpoint
                                                    ? "cdp-range-preview-end"
                                                    : "",
                                                !isCurrentMonth
                                                    ? "cdp-outside-month"
                                                    : ""
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                            onMouseEnter={() => {
                                                if (
                                                    rangeMode &&
                                                    activeTarget === "end" &&
                                                    start &&
                                                    !end
                                                ) {
                                                    setHoveredDay(day);
                                                }
                                            }}
                                            onClick={() => selectDay(day)}
                                        >
                                            {day.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    }
                )}
            </div>
        );
    };

        const renderTimes = (): ReactElement => {
        const isEndTarget = rangeMode && activeTarget === "end";

        const current = isEndTarget
            ? end ?? (pickerType === "Time" ? start : undefined)
            : start;

        const selectedHours = current?.getHours() ?? 0;
        const selectedMinutes = current?.getMinutes() ?? 0;

        const times: ReactElement[] = [];

        const effectiveDate = current ?? new Date();

        const applyTimeLimits =
            pickerType === "Time" || isToday(effectiveDate);

        const lowerBound = applyTimeLimits
            ? minTimeMinutes ?? 0
            : 0;

        const upperBound = applyTimeLimits
            ? maxTimeMinutes ?? 1439
            : 1439;

        /*
         * Generate time options from the beginning of every hour.
         *
         * Example: interval = 2
         * 00:00, 00:02, 00:04 ...
         * 01:00, 01:02, 01:04 ...
         *
         * The current minute is never used as the starting point.
         */

        for (let hours = 0; hours < 24; hours++) {
            for (let minutes = 0; minutes < 60; minutes += interval) {
                const totalMinutes = hours * 60 + minutes;

                if (
                    totalMinutes < lowerBound ||
                    totalMinutes > upperBound
                ) {
                    continue;
                }

                const candidate = withTime(current, hours, minutes);

                // End time cannot be earlier than Start time.
                if (isEndTarget && start && candidate.getTime() < start.getTime()) {
                    continue;
                }

                // Start time cannot be later than End time.
                if (!isEndTarget && rangeMode && end && candidate.getTime() > end.getTime()) {
                    continue;
                }

                // Apply global date bounds to the Start selection.
                if (!isEndTarget && min && candidate < min) {
                    continue;
                }

                if (!isEndTarget && max && candidate > max) {
                    continue;
                }

                const label =
                    timeFormat === "hour12"
                        ? `${hours % 12 || 12}:${pad(minutes)} ${
                              hours >= 12 ? "PM" : "AM"
                          }`
                        : `${pad(hours)}:${pad(minutes)}`;

                times.push(
                    <button
                        type="button"
                        key={totalMinutes}
                        className={
                            selectedHours === hours &&
                            selectedMinutes === minutes
                                ? "cdp-time cdp-time-selected"
                                : "cdp-time"
                        }
                        disabled={
                            disabled ||
                            (isEndTarget && Boolean(endDate?.readOnly)) ||
                            (isEndTarget &&
                                pickerType === "DateTime" &&
                                !end)
                        }
                        onClick={() => changeTime(hours, minutes)}
                    >
                        {label}
                    </button>
                );
            }
        }

        return (
            <div className="cdp-time-panel">
                <strong>
                    {rangeMode
                        ? isEndTarget
                            ? "End time"
                            : "Start time"
                        : "Time"}
                </strong>

                <div className="cdp-time-list">
                    {isEndTarget && pickerType === "DateTime" && !end ? (
                        <span className="cdp-no-times">
                            Select an end date first.
                        </span>
                    ) : times.length > 0 ? (
                        times
                    ) : (
                        <span className="cdp-no-times">
                            No selectable times in this range.
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const displayValue = rangeMode
        ? `${start ? formatDate(start, pickerType, timeFormat) : ""}${
              end ? ` – ${formatDate(end, pickerType, timeFormat)}` : ""
          }`
        : start
          ? formatDate(start, pickerType, timeFormat)
          : "";

    const shouldShowPicker = inline || open;

    return (
        <div className="cdp-root" ref={rootRef}>
            {showLabel && (
                <label className="cdp-label">
                    {labelCaption}
                    {(required || rangeMode) && (
                        <span className="cdp-required"> *</span>
                    )}
                </label>
            )}

            {rangeConfigurationError && (
                <div className="cdp-configuration-error" role="alert">
                    Date Range is enabled. Configure an End Date attribute in Studio Pro.
                </div>
            )}

            {!inline && (
                <div className="cdp-input-row">
                    <button
                        type="button"
                        className={`cdp-input${
                            hasValidationError ? " cdp-input-invalid" : ""
                        }`}
                        disabled={disabled}
                        onClick={showPicker}
                        aria-expanded={open}
                        aria-invalid={hasValidationError}
                    >
                        <span
                            className={
                                displayValue ? "" : "cdp-placeholder"
                            }
                        >
                            {displayValue || placeholder}
                        </span>

                        <span aria-hidden="true">▦</span>
                    </button>

                    {clearable && (start || (rangeMode && end)) && (
                        <button
                            type="button"
                            className="cdp-clear"
                            onClick={clearValues}
                            disabled={disabled}
                            aria-label="Clear selected dates"
                        >
                            ×
                        </button>
                    )}
                </div>
            )}

            {/* Mendix validation feedback */}
            {startValidation && (
                <div className="cdp-validation-message" role="alert">
                    {startValidation}
                </div>
            )}

            {endValidation && (
                <div className="cdp-validation-message" role="alert">
                    {endValidation}
                </div>
            )}

            {shouldShowPicker && !rangeConfigurationError && (
                <div
                    className={
                        inline
                            ? "cdp-popover cdp-inline"
                            : "cdp-popover"
                    }
                >
                    {rangeMode && (
                        <div
                            className="cdp-range-targets"
                            role="group"
                            aria-label="Choose which date to edit"
                        >
                            {/* START DATE AND TIME */}
                            <button
                                type="button"
                                className={
                                    activeTarget === "start"
                                        ? "cdp-target-active"
                                        : ""
                                }
                                aria-pressed={activeTarget === "start"}
                                onClick={() => {
                                    setActiveTarget("start");

                                    if (start) {
                                        setVisibleMonth(
                                            new Date(
                                                start.getFullYear(),
                                                start.getMonth(),
                                                1
                                            )
                                        );
                                    }
                                }}
                            >
                                <span className="cdp-target-title">
                                    {startLabel || "Start date"}
                                </span>

                                <span className="cdp-target-value">
                                    {start
                                        ? formatDate(
                                              start,
                                              pickerType,
                                              timeFormat
                                          )
                                        : "Not selected"}
                                </span>
                            </button>

                            {/* END DATE AND TIME */}
                            <button
                                type="button"
                                className={
                                    activeTarget === "end"
                                        ? "cdp-target-active"
                                        : ""
                                }
                                aria-pressed={activeTarget === "end"}
                                disabled={
                                    !endDate ||
                                    endDate.readOnly ||
                                    !start
                                }
                                onClick={() => {
                                    setActiveTarget("end");

                                    const targetDate = end ?? start;

                                    if (targetDate) {
                                        setVisibleMonth(
                                            new Date(
                                                targetDate.getFullYear(),
                                                targetDate.getMonth(),
                                                1
                                            )
                                        );
                                    }
                                }}
                            >
                                <span className="cdp-target-title">
                                    {endLabel || "End date"}
                                </span>

                                <span className="cdp-target-value">
                                    {end
                                        ? formatDate(
                                              end,
                                              pickerType,
                                              timeFormat
                                          )
                                        : "Not selected"}
                                </span>
                            </button>
                        </div>
                    )}

                    <div className="cdp-picker-content">
                        {pickerType !== "Time" && renderCalendar()}

                        {(pickerType === "Time" ||
                            pickerType === "DateTime") &&
                            renderTimes()}
                    </div>
                </div>
            )}
        </div>
    );
}

function getWeekNumber(date: Date): number {
    const target = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const dayNumber = (target.getDay() + 6) % 7;

    target.setDate(target.getDate() - dayNumber + 3);

    const firstThursday = new Date(target.getFullYear(), 0, 4);

    const firstDay = (firstThursday.getDay() + 6) % 7;

    firstThursday.setDate(firstThursday.getDate() - firstDay + 3);

    return (
        1 +
        Math.round(
            (target.getTime() - firstThursday.getTime()) /
                (7 * 24 * 60 * 60 * 1000)
        )
    );
}