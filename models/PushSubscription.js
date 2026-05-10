import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscription: {
    endpoint: { type: String, required: true },
    expirationTime: { type: Number, default: null },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  userAgent: String,
  deviceType: String,
}, { timestamps: true });

// Create an index to quickly find subscriptions for a user
pushSubscriptionSchema.index({ userId: 1 });
// Ensure unique subscriptions per user to avoid duplicates
pushSubscriptionSchema.index({ userId: 1, "subscription.endpoint": 1 }, { unique: true });

const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);

export default PushSubscription;
