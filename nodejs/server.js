const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const portExpress = 3001;
const portWebsocketServer = 3000;

// mysql
const db = mysql.createConnection({
    host: 'mysql',
    user: 'user',
    password: 'password',
    database: 'app_db',
    port: 3306
});

db.connect(err => {
    if (err) throw err;
    console.log('Połączono z bazą danych!');
});

app.use(cors());
app.get('/api/data', (req, res) => {
    const sql = 'SELECT * FROM messages';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.listen(portExpress, () => {
    console.log(`Serwer działa na http://localhost:${portExpress}`);
});


// rabbit
const amqp = require("amqplib");
const WebSocket = require("ws");

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "rabbit";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || "5673";
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000; // 5 seconds

const wss = new WebSocket.Server({host: '0.0.0.0', port: portWebsocketServer });

async function connectWithRetry(retries) {
    try {
        console.log(`Attempting to connect to RabbitMQ at amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
        const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
        return connection;
    } catch (err) {
        if (retries > 0) {
            console.error(`Connection failed. Retrying in ${RETRY_DELAY / 1000} seconds... (${retries} retries left)`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return connectWithRetry(retries - 1);
        } else {
            console.error("Failed to connect to RabbitMQ after maximum retries.");
            throw err;
        }
    }
}

async function startRabbitMQ() {
    try {
        const connection = await connectWithRetry(MAX_RETRIES);
        const channel = await connection.createChannel();
        await channel.assertQueue('messages', { durable: true });

        channel.consume("messages", (msg) => {
            if (msg !== null) {
                const messageContent = msg.content.toString();
                console.log("Received from RabbitMQ:", messageContent);

                // Broadcast the message to all WebSocket clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ message: messageContent + ' => Nodejs' }));
                    }
                });

                channel.ack(msg);
            }
        });
    } catch (err) {
        console.error("Error during RabbitMQ setup:", err);
    }
}

wss.on("connection", (ws) => {
    console.log("WebSocket client connected.");
    ws.on("close", () => console.log("WebSocket client disconnected."));
});

startRabbitMQ().catch((err) => {
    console.error("Error initializing RabbitMQ connection:", err);
});
