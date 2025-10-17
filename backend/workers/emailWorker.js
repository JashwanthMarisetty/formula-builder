const dotenv = require("dotenv");

const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const amqp = require("amqplib");
const { sendEmail } = require("../utils/sendEmail");

const queueName = "emailQueue";

const startWorker = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });

    console.log("👷 Email worker started, waiting for messages...");

    channel.consume(queueName, async (msg) => {
      if (msg) {
        const emailData = JSON.parse(msg.content.toString());
        console.log("📥 Processing email for:", emailData.email);

        try {
          await sendEmail(
            emailData.email,
            emailData.subject,
            emailData.text,
            emailData.html
          );
          channel.ack(msg);
        } catch (err) {
          console.error("❌ Failed to send email:", err);
          channel.nack(msg);
        }
      }
    });
  } catch (error) {
    console.error("❌ Worker connection failed:", error);
    setTimeout(startWorker, 5000); // retry
  }
};

startWorker();
