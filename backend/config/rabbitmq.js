const amqp = require("amqplib");

let channel;

const connectQueue = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log("✅ Connected to CloudAMQP successfully");
    return channel;
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    console.error(error);
    setTimeout(connectQueue, 5000); // retry after 5s
  }
};

const getChannel = () => channel;

module.exports = { connectQueue, getChannel };
