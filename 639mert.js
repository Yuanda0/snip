"use strict";

const tls = require("tls");

const WebSocket = require("ws");

const extractJsonFromString = require("extract-json-from-string");

 

let vanity;

const guilds = {};

 

const a = "MTIyOTg0MDM0MTY1ODc2MzI5NA.GQ93P5.D1eOEsbKzLOoj0TJ4iiMzgeO4btMCFH4QFuF-4";

const l = "MTIyOTg0MDM0MTY1ODc2MzI5NA.GQ93P5.D1eOEsbKzLOoj0TJ4iiMzgeO4btMCFH4QFuF-4";

const s = "1237094328141348955";

const i = "1237095067341295768";

 

const tlsSocket = tls.connect({

    host: "canary.discord.com",

    port: 443,

});

 

tlsSocket.on("data", async (data) => {

    const ext = await extractJsonFromString(data.toString());

    const find = ext.find((e) => e.code) || ext.find((e) => e.message);

 

    if (find) {

        console.log(find);

 

        const requestBody = JSON.stringify({

            content: `@everyone ${vanity} \n\`\`\`json\n${JSON.stringify(find)}\`\`\``,

        });

 

        const contentLength = Buffer.byteLength(requestBody);

 

        const requestHeader = [

            `POST /api/channels/${i}/messages HTTP/1.1`,

            "Host: canary.discord.com",

            `Authorization: ${l}`,

            "Content-Type: application/json",

            `Content-Length: ${contentLength}`,

            "",

            "",

        ].join("\r\n");

 

        const startRequest = process.hrtime();

 

        const request = requestHeader + requestBody;

        tlsSocket.write(request);

 

        const endRequest = process.hrtime(startRequest);

        const elapsedMillis = endRequest[0] * 1000 + endRequest[1] / 1e6;

 

        console.log(`Ms: ${elapsedMillis.toFixed(3)}ms`);

    }

});

 

tlsSocket.on("error", (error) => {

    console.log(`tls error`, error);

    return process.exit();

});

 

tlsSocket.on("end", (event) => {

    console.log("tls connection closed");

    return process.exit();

});

 

tlsSocket.on("secureConnect", () => {

    const websocket = new WebSocket("wss://gateway.discord.gg/");

 

    websocket.onclose = (event) => {

        console.log(`ws connection closed ${event.reason} ${event.code}`);

        return process.exit();

    };

 

    websocket.onmessage = async (message) => {

        const { d, op, t } = JSON.parse(message.data);

 

        if (t === "GUILD_UPDATE") {

            const start = process.hrtime();

            const find = guilds[d.guild_id];

            if (find && find !== d.vanity_url_code) {

                const requestBody = JSON.stringify({ code: find });

                tlsSocket.write([

                    `PATCH /api/v7/guilds/${s}/vanity-url HTTP/1.1`,

                    "Host: canary.discord.com",

                    `Authorization: ${a}`,

                    "Content-Type: application/json",

                    `Content-Length: ${requestBody.length}`,

                    "",

                    "",

                ].join("\r\n") + requestBody);

                const end = process.hrtime(start);

                const elapsedMillis = end[0] * 1000 + end[1] / 1e6;

                vanity = `${find} guild update `;

            }

        }

        else if (t === "GUILD_DELETE") {

            const find = guilds[d.id];

           if (find) {

                const requestBody = JSON.stringify({ code: find });

                tlsSocket.write([

                    `PATCH /api/v7/guilds/${s}/vanity-url HTTP/1.1`,

                    "Host: canary.discord.com",

                    `Authorization: ${a}`,

                    "Content-Type: application/json",

                    `Content-Length: ${requestBody.length}`,

                    "",

                    "",

                ].join("\r\n") + requestBody);

                vanity = `${find} guild **DELETE**`;

            }

        }

        else if (t === "READY") {

            d.guilds.forEach((guild) => {

                if (guild.vanity_url_code) {

                    guilds[guild.id] = guild.vanity_url_code;

                }

                else {

                }

            });

            console.log(guilds);

        }

 

        if (op === 10) {

            websocket.send(JSON.stringify({

                op: 2,

                d: {

                    token: l,

                    intents: 1,

                    properties: {

                        os: "Linux",

                        browser: "Firefox",

                        device: "Firefox",

                    },

                },

            }));

            setInterval(() => websocket.send(JSON.stringify({ op: 0.8, d: {}, s: null, t: "heartbeat" })), d.heartbeat_interval);

        }

        else if (op === 7)

            return process.exit();

    };

 

    setInterval(() => {

        tlsSocket.write(["GET / HTTP/1.1", "Host: canary.discord.com", "", ""].join("\r\n"));

    }, 600);

});