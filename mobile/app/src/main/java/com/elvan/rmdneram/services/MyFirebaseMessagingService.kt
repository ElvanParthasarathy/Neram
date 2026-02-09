package com.elvan.rmdneram.services

import android.util.Log
import com.elvan.rmdneram.ui.common.NotificationHelper
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "From: ${remoteMessage.from}")

        // Check if message contains a data payload.
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            
            val type = remoteMessage.data["type"]
            val title = remoteMessage.data["title"] ?: remoteMessage.notification?.title
            val body = remoteMessage.data["body"] ?: remoteMessage.notification?.body
            
            if (title != null && body != null) {
                if (type == "critical") {
                    // Launch Full Screen Alert
                    val intent = android.content.Intent(applicationContext, com.elvan.rmdneram.ui.alerts.FullScreenAlertActivity::class.java).apply {
                        flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
                        putExtra("title", title)
                        putExtra("message", body)
                    }
                    startActivity(intent)
                } else {
                    // Standard Notification
                    NotificationHelper.showNotification(
                        applicationContext,
                        title,
                        body,
                        NotificationHelper.CHANNEL_ID_INSTANT
                    )
                }
            }
        } else {
            // Check if message contains a notification payload (fallback)
            remoteMessage.notification?.let {
                Log.d(TAG, "Message Notification Body: ${it.body}")
                NotificationHelper.showNotification(
                    applicationContext,
                    it.title ?: "Neram Update",
                    it.body ?: "",
                    NotificationHelper.CHANNEL_ID_INSTANT
                )
            }
        }
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "Refreshed token: $token")
        // If you want to send messages to this application instance or
        // manage this apps subscriptions on the server side, send the
        // FCM registration token to your app server.
        sendRegistrationToServer(token)
    }

    private fun sendRegistrationToServer(token: String?) {
        // TODO: Implement this method to send token to your app server if needed.
        Log.d(TAG, "New Token: $token")
    }

    companion object {
        private const val TAG = "MyFirebaseMsgService"
    }
}
