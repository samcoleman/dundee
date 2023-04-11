"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../styles/global.css");
const api_1 = require("../utils/api");
const MyApp = ({ Component, pageProps, }) => {
    return (<Component {...pageProps}/>);
};
exports.default = api_1.api.withTRPC(MyApp);
