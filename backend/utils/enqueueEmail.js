const { getChannel } = require("../config/rabbitmq");
const queueName = "emailQueue";

const enqueueEmail = async (emailData) => {
  try {
    const channel = getChannel();
    if (!channel) {
      console.error("❌ RabbitMQ channel not ready");
      return;
    }

    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(emailData)));
    console.log("📤 Email task added to queue:", emailData.email);
  } catch (err) {
    console.error("❌ Failed to enqueue email:", err);
  }
};

module.exports = { enqueueEmail };1
