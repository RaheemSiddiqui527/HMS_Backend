import PushSubscription from "../models/PushSubscription.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const subscribe = async (req, res) => {
  try {
    const { subscription, userAgent, deviceType } = req.body;
    const userId = req.user.id;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return sendError(res, "Invalid subscription object", 400);
    }

    // Update or create subscription
    const updatedSub = await PushSubscription.findOneAndUpdate(
      { userId, "subscription.endpoint": subscription.endpoint },
      { subscription, userAgent, deviceType },
      { upsert: true, new: true }
    );

    return sendSuccess(res, updatedSub, "Subscribed to push notifications successfully");
  } catch (error) {
    console.error("Subscription error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user.id;

    await PushSubscription.findOneAndDelete({ userId, "subscription.endpoint": endpoint });

    return sendSuccess(res, null, "Unsubscribed from push notifications successfully");
  } catch (error) {
    console.error("Unsubscription error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

export const getPublicKey = (req, res) => {
  return sendSuccess(res, { publicKey: process.env.VAPID_PUBLIC_KEY }, "VAPID public key retrieved");
};
