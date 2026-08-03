const mqtt = require('mqtt');
const fs = require('fs');

console.log("Connecting to MQTT...");
const client = mqtt.connect('mqtts://7953ca21897d4be78141b6206bf9c205.s1.eu.hivemq.cloud:8883', {
    clientId: 'debug_' + Math.random().toString(16).substr(2, 8),
    username: 'rendi',
    password: '12345678'
});

client.on('connect', () => {
    console.log("Connected! Subscribing...");
    client.subscribe('smartcoop/#');
    
    setTimeout(() => {
        console.log("Finished waiting.");
        client.end();
    }, 10000);
});

client.on('message', (topic, message) => {
    console.log(`Received: ${topic} = ${message.toString()}`);
    fs.appendFileSync('mqtt_debug.log', `${topic} = ${message.toString()}\n`);
});

client.on('error', (err) => {
    console.error("MQTT Error:", err);
});
