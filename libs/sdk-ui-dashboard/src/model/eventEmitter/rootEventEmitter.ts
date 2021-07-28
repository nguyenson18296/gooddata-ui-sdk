// (C) 2021 GoodData Corporation
import { SagaIterator } from "redux-saga";
import { actionChannel, take } from "redux-saga/effects";
import { DashboardEventHandler } from "../events/eventHandler";
import { DashboardEvents } from "../events";
import { DashboardCommands } from "../commands";

export type EventEmitter = {
    registerHandler: (handler: DashboardEventHandler) => void;
    unregisterHandler: (handler: DashboardEventHandler) => void;
    eventEmitterSaga: () => SagaIterator<void>;
};

/**
 * Creates root event emitter that will be responsible for emitting events to all registered handlers.
 *
 * The emitter is realized using a saga. This saga has its own dedicated channel through which it receives
 * the events to emit - the event bus. Upon emitter start, it creates the channel and sets it into the
 * `eventEmitterContext` field of the saga context - this way other sagas can get hold of it.
 *
 * @param initialHandlers - event handlers to register at the time of creation
 * @param dispatch - callback to dispatch dashboard commands
 */
export function createRootEventEmitter(
    initialHandlers: DashboardEventHandler[] = [],
    dispatch: (command: DashboardCommands) => void,
): EventEmitter {
    let eventHandlers = initialHandlers;

    return {
        registerHandler: (handler: DashboardEventHandler) => {
            eventHandlers.push(handler);
        },
        unregisterHandler: (handler: DashboardEventHandler) => {
            eventHandlers = eventHandlers.filter((h) => h !== handler);
        },
        eventEmitterSaga: function* () {
            const eventChannel = yield actionChannel((action: any) => action.type.startsWith("GDC.DASH/EVT"));

            while (true) {
                const event: DashboardEvents = yield take(eventChannel);

                try {
                    eventHandlers.forEach((handler) => {
                        if (handler.eval(event)) {
                            handler.handler(event, dispatch);
                        }
                    });
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error("Error has occurred while dispatching event", event, e);
                }
            }
        },
    };
}
