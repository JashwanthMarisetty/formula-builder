const cron = require("node-cron");
const Form = require("../models/Form");
const { client: redis } = require("../config/redis");

// Every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("🔁 Syncing views from Redis → MongoDB");

  try {
    // Find all Redis keys that match views:<formId>
    const keys = await redis.keys("views:*");

    for (const key of keys) {
      const parts = key.split(":");
      const formId = parts[1];
      const value = await redis.get(key);
      const count = parseInt(value, 10);

      if (!count || Number.isNaN(count)) continue;

      // Add to MongoDB form document
      await Form.findByIdAndUpdate(formId, {
        $inc: { views: count },
      });

      // Reset this counter in Redis
      await redis.del(key);
    }

    console.log("✅ View sync complete!");
  } catch (err) {
    console.error("❌ Cron sync failed:", err);
  }
});

