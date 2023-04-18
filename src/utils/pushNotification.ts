
import { checkMessage } from '../shared/messageParse';
import { type Message, type settings } from '../shared/types';
import {formatNumber} from './formatNumber';

// Write function called push show local web notification
const pushNotification = async (
  message: Message,
  settings: settings,
  symbol: string | undefined,
  image_url: string | undefined,
) => {
  const filter = checkMessage(message, settings);

  //If settings arent passed dont show notification
  if (!filter.pass_settings) return;
  // Wrong browser
  if (!('Notification' in window)) return;

  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;

    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;

    // symbol is attached add actions
    const actions = symbol ? {
      actions: [
        {
          action: 'B_1',
          title: `Buy ${formatNumber(settings.notifications.actions.B_1, 1)}`,
          type: 'text',
        } as NotificationAction,
        {
          action: 'S_1',
          title: `Sell ${formatNumber(settings.notifications.actions.S_1, 1)}`,
        },
      ],
    } : undefined

    void reg.showNotification(`${symbol ? symbol+":" : ""}${message.title}`, {
      body: message.body,
      data: message,
      image: image_url,
      silent: false,
      ...actions
    });
  } catch (e) {
    console.error(e);
  }
};
export default pushNotification;
