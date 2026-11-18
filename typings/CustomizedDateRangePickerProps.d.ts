/**
 * This file was generated from CustomizedDateRangePicker.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ActionValue, DynamicValue, EditableValue } from "mendix";
import { CSSProperties } from "react";

export type PickerTypeEnum = "Date" | "Time" | "DateTime" | "Year";

export type TimeFormatEnum = "hour12" | "hour24";

export interface CustomizedDateRangePickerContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    dateRange: boolean;
    startDate: EditableValue<Date>;
    endDate?: EditableValue<Date>;
    pickerType: PickerTypeEnum;
    placeholder: string;
    labelCaption: string;
    showLabel: boolean;
    clearable: boolean;
    inline: boolean;
    editable: boolean;
    required: boolean;
    timeInterval: number;
    timeFormat: TimeFormatEnum;
    showWeekNumbers: boolean;
    minDate?: DynamicValue<Date>;
    maxDate?: DynamicValue<Date>;
    minTime?: DynamicValue<Date>;
    maxTime?: DynamicValue<Date>;
    onEnter?: ActionValue;
    onLeave?: ActionValue;
    onChange?: ActionValue;
    startLabel: string;
    endLabel: string;
    todayLabel: string;
    clearLabel: string;
}

export interface CustomizedDateRangePickerPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    dateRange: boolean;
    startDate: string;
    endDate: string;
    pickerType: PickerTypeEnum;
    placeholder: string;
    labelCaption: string;
    showLabel: boolean;
    clearable: boolean;
    inline: boolean;
    editable: boolean;
    required: boolean;
    timeInterval: number | null;
    timeFormat: TimeFormatEnum;
    showWeekNumbers: boolean;
    minDate: string;
    maxDate: string;
    minTime: string;
    maxTime: string;
    onEnter: {} | null;
    onLeave: {} | null;
    onChange: {} | null;
    startLabel: string;
    endLabel: string;
    todayLabel: string;
    clearLabel: string;
}
