"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../styles/global.css");
const api_1 = require("../utils/api");
require("react-notifications-component/dist/theme.css");
const react_notifications_component_1 = require("react-notifications-component");
const MyApp = ({ Component, pageProps }) => {
    return (<>
      <react_notifications_component_1.ReactNotifications />
      <Component {...pageProps}/>
    </>);
};
exports.default = api_1.api.withTRPC(MyApp);
