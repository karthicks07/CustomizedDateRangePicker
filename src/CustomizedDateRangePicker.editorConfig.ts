
export type Platform = "web" | "desktop";

export type Properties = PropertyGroup[];

type PropertyGroup = {
    caption: string;
    propertyGroups?: PropertyGroup[];
    properties?: Property[];
};

type Property = {
    key: string;
    caption: string;
    description?: string;
    objectHeaders?: string[];
    objects?: ObjectProperties[];
    properties?: Properties[];
};

type ObjectProperties = {
    properties: PropertyGroup[];
    captions?: string[];
};

export type Problem = {
    property?: string;
    severity?: "error" | "warning" | "deprecation";
    message: string;
    studioMessage?: string;
    url?: string;
    studioUrl?: string;
};

/**
 * Updates an individual property.
 */
function updateProperty(
    property: Property,
    dateRange: boolean
): Property | null {

    // Hide End Date attribute when Date Range is disabled.
    if (property.key === "endDate" && !dateRange) {
        return null;
    }

    const updatedProperty: Property = {
        ...property
    };

    // Change Start Date attribute caption dynamically.
    if (property.key === "startDate") {
        updatedProperty.caption = dateRange
            ? "Start date attribute"
            : "Date attribute";

        updatedProperty.description = dateRange
            ? "DateTime attribute used for the start date."
            : "DateTime attribute used for the selected date.";
    }

    // Process nested properties.
    if (property.properties) {
        updatedProperty.properties = property.properties.map(
            propertyGroups =>
                propertyGroups.map(group =>
                    updatePropertyGroup(group, dateRange)
                )
        );
    }

    // Process object properties.
    if (property.objects) {
        updatedProperty.objects = property.objects.map(object => ({
            ...object,
            properties: object.properties.map(group =>
                updatePropertyGroup(group, dateRange)
            )
        }));
    }

    return updatedProperty;
}

/**
 * Updates a property group recursively.
 */
function updatePropertyGroup(
    group: PropertyGroup,
    dateRange: boolean
): PropertyGroup {

    return {
        ...group,

        properties: group.properties
            ?.map(property => updateProperty(property, dateRange))
            .filter(
                (property): property is Property => property !== null
            ),

        propertyGroups: group.propertyGroups?.map(subGroup =>
            updatePropertyGroup(subGroup, dateRange)
        )
    };
}

/**
 * Mendix Studio Pro dynamic property configuration.
 */
export function getProperties(
    values: any,
    defaultProperties: Properties
): Properties {

    const dateRange = values.dateRange === true;

    return defaultProperties.map(group =>
        updatePropertyGroup(group, dateRange)
    );
}

/**
 * Mendix Studio Pro property validation.
 */
export function check(values: any): Problem[] {

    const problems: Problem[] = [];

    if (values.dateRange === true && !values.endDate) {
        problems.push({
            property: "endDate",
            severity: "error",
            message:
                "End Date attribute is required when Date Range is enabled."
        });
    }

    return problems;
}
