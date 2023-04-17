"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const messageParse_1 = require("../shared/messageParse");
const formatNumber_1 = require("./formatNumber");
// Write function called push show local web notification
const pushNotification = async (message, settings, symbol, image_url) => {
    const filter = (0, messageParse_1.checkMessage)(message, settings);
    //If settings arent passed dont show notification
    if (!filter.pass_settings)
        return;
    // Wrong browser
    if (!('Notification' in window))
        return;
    try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted')
            return;
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg)
            return;
        // symbol is attached add actions
        const actions = symbol ? {
            actions: [
                {
                    action: 'B_1',
                    title: `Buy ${(0, formatNumber_1.formatNumber)(settings.notifications.actions.B_1, 1)}`,
                    type: 'text',
                },
                {
                    action: 'S_1',
                    title: `Sell ${(0, formatNumber_1.formatNumber)(settings.notifications.actions.S_1, 1)}`,
                },
            ],
        } : undefined;
        void reg.showNotification(`${symbol ? symbol + ":" : ""}${message.title}`, {
            body: message.body,
            data: message,
            image: image_url,
            ...actions
        });
    }
    catch (e) {
        console.error(e);
    }
};
exports.default = pushNotification;
