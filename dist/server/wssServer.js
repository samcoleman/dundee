"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const root_1 = require("./api/root");
const ws_1 = require("@trpc/server/adapters/ws");
const ws_2 = __importStar(require("ws"));
const node_localstorage_1 = require("node-localstorage");
const zod_1 = require("zod");
const messageParse_1 = require("../shared/messageParse");
const caller = root_1.appRouter.createCaller({});
const wss = new ws_2.default.Server({
    port: 3005,
});
const handler = (0, ws_1.applyWSSHandler)({ wss, router: root_1.appRouter });
wss.on('connection', (ws) => {
    console.log(`+ Client Connection (${wss.clients.size})`);
    ws.once('close', () => {
        console.log(`- Client Connection (${wss.clients.size})`);
    });
});
console.log('✅ WebSocket Server listening on ws://localhost:3005');
const url = 'wss://news.treeofalpha.com/ws';
const localstorage = new node_localstorage_1.LocalStorage('./socket_logs');
const logMessage = (location, obj, message) => {
    const logString = localstorage.getItem(location);
    const logHistory = logString ? JSON.parse(logString) : undefined;
    if (logHistory) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        logHistory[new Date().getTime().toString()] = { 'incoming': obj, 'parsed': message };
        localstorage.setItem(location, JSON.stringify(logHistory));
    }
    else {
        const log = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            [new Date().getTime().toString()]: { 'incoming': obj, 'parsed': message }
        };
        localstorage.setItem(location, JSON.stringify(log));
    }
};
const suggestions = zod_1.z.array(zod_1.z.object({
    found: zod_1.z.array(zod_1.z.string()),
    coin: zod_1.z.string(),
    symbols: zod_1.z.array(zod_1.z.object({
        symbol: zod_1.z.string(),
        exchange: zod_1.z.string()
    }))
}));
const handleSource = (obj) => {
    const sourceMessage = zod_1.z.object({
        title: zod_1.z.string(),
        source: zod_1.z.string(),
        url: zod_1.z.string(),
        time: zod_1.z.number(),
        symbols: zod_1.z.array(zod_1.z.string()),
        en: zod_1.z.string(),
        _id: zod_1.z.string(),
        suggestions: suggestions
    })
        .parse(obj);
    const message = {
        ...sourceMessage,
        source: (0, messageParse_1.parseSource)(sourceMessage.source),
        symbols: (0, messageParse_1.parseSymbols)(sourceMessage.suggestions.map(suggestion => suggestion.symbols.map(s => s.symbol)).flat()),
        body: ''
    };
    return message;
};
const handleType = (obj) => {
    const typeMessage = zod_1.z.object({
        title: zod_1.z.string(),
        body: zod_1.z.string(),
        icon: zod_1.z.string(),
        image: zod_1.z.string().optional(),
        link: zod_1.z.string(),
        time: zod_1.z.number(),
        _id: zod_1.z.string(),
        type: zod_1.z.string(),
        suggestions: suggestions
    })
        .parse(obj);
    const message = {
        ...typeMessage,
        source: (0, messageParse_1.parseSource)(typeMessage.type),
        url: typeMessage.link,
        symbols: (0, messageParse_1.parseSymbols)(typeMessage.suggestions.map(suggestion => suggestion.symbols.map(s => s.symbol)).flat()),
    };
    return message;
};
const handleUnknown = (obj) => {
    console.log('Unknown message');
    return obj;
};
const openWebsocket = () => {
    const tws = new ws_2.WebSocket(url, {
        headers: {
            Cookie: `tree_login_cookie=${process.env.TREE_COOKIE}`,
        },
    });
    tws.onopen = () => {
        console.log('[TreeOfAlpha] connected');
    };
    tws.on('message', (data) => {
        try {
            // This is as can be any shape
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const obj = JSON.parse(data.toString());
            let message;
            if ('source' in obj) {
                console.log('Source message');
                message = handleSource(obj);
            }
            else if ('type' in obj) {
                console.log('Type message');
                message = handleType(obj);
            }
            else {
                console.log('Unknown message');
                message = handleUnknown(obj);
            }
            console.log(message);
            if (message) {
                void caller.tree.message(message);
                logMessage('handled_messages.json', obj, message);
            }
            else {
                logMessage('unhandled_messages.json', obj, message);
            }
        }
        catch (err) {
            console.log(err);
        }
    });
    tws.onclose = () => {
        // Object
        console.log('[TreeOfAlpha] disconnected');
        setTimeout(() => {
            console.log('[TreeOfAlpha] reconnecting');
            openWebsocket();
        }, 5000);
    };
    tws.onerror = (err) => {
        // Object
        console.log(`[TreeOfAlpha] error: ${err.message}`);
    };
    // THis is naff
    process.on('SIGTERM', () => {
        console.log('SIGTERM');
        handler.broadcastReconnectNotification();
        wss.close();
        tws.close();
    });
};
openWebsocket();
