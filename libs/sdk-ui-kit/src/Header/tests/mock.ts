// (C) 2021 GoodData Corporation
import { ISettings, IWorkspacePermissions, PlatformEdition } from "@gooddata/sdk-backend-spi";

export const getHelpMenuFeatureFlagsMock = (
    enableUniversityHelpMenuItem: boolean,
    enableCommunityHelpMenuItem: boolean,
): ISettings => {
    return {
        enableUniversityHelpMenuItem,
        enableCommunityHelpMenuItem,
    };
};

export const getAccountMenuFeatureFlagsMock = (
    enableCsvUploader: boolean,
    enableDataSection: boolean,
    hidePixelPerfectExperience: boolean,
    analyticalDesigner: boolean,
    platformEdition: PlatformEdition,
): ISettings => {
    return {
        enableCsvUploader,
        enableDataSection,
        hidePixelPerfectExperience,
        analyticalDesigner,
        platformEdition,
    };
};

export const getWorkspacePermissionsMock = (
    canInitData: boolean,
    canManageMetric: boolean,
): IWorkspacePermissions => {
    return {
        canAccessWorkbench: true,
        canCreateAnalyticalDashboard: true,
        canCreateReport: true,
        canInitData,
        canCreateScheduledMail: true,
        canCreateVisualization: true,
        canExecuteRaw: true,
        canExportReport: true,
        canListUsersInProject: true,
        canManageAnalyticalDashboard: true,
        canManageDomain: true,
        canManageMetric,
        canManageProject: true,
        canManageReport: true,
        canUploadNonProductionCSV: true,
        canInviteUserToProject: true,
        canRefreshData: true,
    };
};
