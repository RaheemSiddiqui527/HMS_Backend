import webpush from "web-push";
import dotenv from "dotenv";
import PushSubscription from "../models/PushSubscription.js";

dotenv.config();

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send push notification to a specific user
 * @param {string} userId - ID of the user to notify
 * @param {object} payload - Notification data (title, body, icon, url, etc.)
 */
export const sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user: ${userId}`);
      return;
    }

    const payloadString = JSON.stringify({
      title: payload.title || "New Notification",
      body: payload.body || payload.message || "You have a new notification from SDI Health Care",
      icon: payload.icon || "/icons/icon-192x192.png",
      data: {
        url: payload.url || "/dashboard/notifications",
        ...payload.data
      }
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription, payloadString)
      )
    );

    // Cleanup invalid/expired subscriptions
    results.forEach(async (result, index) => {
      if (result.status === 'rejected' && (result.reason.statusCode === 410 || result.reason.statusCode === 404)) {
        console.log(`Deleting expired subscription for user: ${userId}`);
        await PushSubscription.deleteOne({ _id: subscriptions[index]._id });
      }
    });

    return results;
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

/**
 * Send push notification to all users with a specific role
 * @param {string} role - User role (patient, doctor, admin)
 * @param {object} payload - Notification data
 */
export const sendPushToRole = async (role, payload) => {
  try {
    const subscriptions = await PushSubscription.find()
      .populate({
        path: 'userId',
        match: { role: role }
      });

    const activeSubscriptions = subscriptions.filter(sub => sub.userId);

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body || payload.message,
      icon: payload.icon || "/icons/icon-192x192.png",
      data: {
        url: payload.url || "/dashboard/notifications",
        ...payload.data
      }
    });

    return Promise.allSettled(
      activeSubscriptions.map(sub => 
        webpush.sendNotification(sub.subscription, payloadString)
      )
    );
  } catch (error) {
    console.error(`Error sending push notification to role ${role}:`, error);
  }
};

/**
 * Send push notification to all subscribed users
 * @param {object} payload - Notification data
 */
export const sendPushToAll = async (payload) => {
  try {
    const subscriptions = await PushSubscription.find();

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body || payload.message,
      icon: payload.icon || "/icons/icon-192x192.png",
      data: {
        url: payload.url || "/dashboard/notifications",
        ...payload.data
      }
    });

    return Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription, payloadString)
      )
    );
  } catch (error) {
    console.error("Error sending push notification to all:", error);
  }
};
