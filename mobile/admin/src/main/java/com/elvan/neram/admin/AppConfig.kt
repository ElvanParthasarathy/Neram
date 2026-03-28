package com.elvan.neram.admin

/**
 * --------------------------------------------------------------------------------
 * NERAM ADMIN APP CONFIGURATION
 * --------------------------------------------------------------------------------
 * This file contains the core URLs and IDs used by the Android Admin Web Wrapper.
 * You can easily change the domain here, save, and rebuild the app.
 */
object AppConfig {
    /**
     * The full URL that the WebView loads when the app starts.
     * Example: "https://your-new-domain.com/admin"
     */
    const val ADMIN_URL = "https://adminneram.vercel.app/admin"

    /**
     * The allowed internal domain. Any links clicked inside the app that match 
     * this domain will open inside the app instead of launching Chrome.
     * Example: "your-new-domain.com"
     */
    const val ALLOWED_INTERNAL_DOMAIN = "adminneram.vercel.app"

    /**
     * Google Sign-In Web Client ID.
     */
    const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"
}
