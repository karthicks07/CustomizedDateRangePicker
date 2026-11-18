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

export function getProperties(
    values: any,
    defaultProperties: any[]
): any[] {
    return defaultProperties.map(group => ({
        ...group,

        properties: group.properties
            ?.filter(
                (property: { key: string }) =>
                    property.key !== "endDate" ||
                    values.dateRange === true
            )
            .map((property: any) =>
                property.key === "startDate"
                    ? {
                          ...property,
                          caption:
                              values.dateRange === true
                                  ? "Start date attribute"
                                  : "Date attribute",
                          description:
                              values.dateRange === true
                                  ? "DateTime attribute used for the start date."
                                  : "DateTime attribute used for the selected date."
                      }
                    : property
            ),

        propertyGroups: group.propertyGroups?.map(
            (subGroup: any) => ({
                ...subGroup,

                properties: subGroup.properties
                    ?.filter(
                        (property: { key: string }) =>
                            property.key !== "endDate" ||
                            values.dateRange === true
                    )
                    .map((property: any) =>
                        property.key === "startDate"
                            ? {
                                  ...property,
                                  caption:
                                      values.dateRange === true
                                          ? "Start date attribute"
                                          : "Date attribute",
                                  description:
                                      values.dateRange === true
                                          ? "DateTime attribute used for the start date."
                                          : "DateTime attribute used for the selected date."
                              }
                            : property
                    )
            })
        )
    }));
}

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

    if (
        values.timeInterval !== undefined &&
        (values.timeInterval < 1 || values.timeInterval > 60)
    ) {
        problems.push({
            property: "timeInterval",
            severity: "warning",
            message:
                "Time interval should be between 1 and 60 minutes."
        });
    }

    return problems;
}