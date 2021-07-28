// (C) 2021 GoodData Corporation

import { IUser } from "@gooddata/sdk-backend-spi";

/**
 * @alpha
 */
export interface UserState {
    user?: IUser;
}

export const userInitialState: UserState = { user: undefined };
