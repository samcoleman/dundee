import nodeNotifier from "node-notifier"
import { type Message,  } from "./const"
import { type settings } from "server/api/routers/settings"


export const notify = (message: Message, settings: settings) => {
  if (settings.notifications.adv_notifications) {
    return
  }else{
    nodeNotifier.notify({
      title:   message.title,
      message: message.body,
      icon:    message.icon,
      open:    "http://localhost:3000/dash",
      sound:   true,
      wait:    true,
      timeout: 20,
    },
    (err, response, metadata) => {
      console.log(err, response, metadata)
    })
  }
}