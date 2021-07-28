const depCruiser = require("../../common/config/dep-cruiser/default.config");

options = {
    forbidden: [
        ...depCruiser.DefaultRules,
        ...depCruiser.DefaultSdkRules,

        depCruiser.isolatedSubmodule("constants", "src/presentation/constants"),
        depCruiser.isolatedSubmodule("localization", "src/presentation/localization"),
        depCruiser.isolatedSubmodule("presentationComponents", "src/presentation/presentationComponents"),

        depCruiser.moduleWithDependencies("converters", "src/converters", ["src/types.ts"]),
        depCruiser.moduleWithDependencies(
            "dashboard",
            "src/presentation/dashboard/", // the trailing / is necessary here, otherwise dashboardContexts is matched as well
            [
                "src/model",
                "src/presentation/dashboardContexts",
                "src/presentation/filterBar",
                "src/presentation/layout",
                "src/presentation/localization",
                "src/presentation/scheduledEmail",
                "src/presentation/topBar",
                "src/presentation/widget",
            ],
        ),
        depCruiser.moduleWithDependencies("dashboardContexts", "src/presentation/dashboardContexts", [
            "src/presentation/filterBar/types.ts",
            "src/presentation/layout/types.ts",
            "src/presentation/scheduledEmail/types.ts",
            "src/presentation/topBar/types.ts",
            "src/presentation/widget/types.ts",
        ]),
        depCruiser.moduleWithDependencies("drill", "src/presentation/drill", [
            "src/_staging/*",
            "src/model",
            "src/presentation/constants",
            "src/presentation/localization",
            "src/types.ts",
        ]),
        depCruiser.moduleWithDependencies("filterBar", "src/presentation/filterBar", [
            "src/_staging/*",
            "src/model",
            "src/presentation/dashboardContexts",
            "src/presentation/localization",
        ]),
        depCruiser.moduleWithDependencies("layout", "src/presentation/layout", [
            "src/model",
            "src/presentation/dashboardContexts",
            "src/presentation/localization",
            "src/presentation/presentationComponents",
            "src/presentation/widget",
            "src/types.ts",
        ]),
        depCruiser.moduleWithDependencies("logUserInteraction", "src/logUserInteraction", ["src/model"]),
        depCruiser.moduleWithDependencies("model", "src/model", [
            "src/_staging/*",
            "src/converters",
            "src/types.ts",
        ]),
        depCruiser.moduleWithDependencies("presentation", "src/presentation", [
            "src/_staging/*",
            "src/converters",
            "src/logUserInteraction",
            "src/model",
            "src/types.ts",
        ]),
        depCruiser.moduleWithDependencies("scheduledEmail", "src/presentation/scheduledEmail", [
            "src/presentation/dashboardContexts",
            "src/presentation/localization",
            "src/model",
        ]),
        depCruiser.moduleWithDependencies("topBar", "src/presentation/topBar", [
            "src/presentation/dashboardContexts",
            "src/presentation/localization",
        ]),
        depCruiser.moduleWithDependencies("widget", "src/presentation/widget", [
            "src/_staging/*",
            "src/converters",
            "src/logUserInteraction",
            "src/model",
            "src/presentation/dashboardContexts",
            "src/presentation/drill",
            "src/presentation/drill/types.ts",
            "src/presentation/localization",
            "src/presentation/presentationComponents",
            "src/types.ts",
        ]),
    ],
    options: depCruiser.DefaultOptions,
};

module.exports = options;
