import Alert from "../models/Alert.js";

export async function getActiveAlerts() {
  const now = new Date();

  return Alert.find({
    active: true,

    $or: [
      {
        expiresAt: {
          $exists: false,
        },
      },
      {
        expiresAt: null,
      },
      {
        expiresAt: {
          $gt: now,
        },
      },
    ],
  })
    .sort({
      createdAt: -1,
    })
    .lean();
}
