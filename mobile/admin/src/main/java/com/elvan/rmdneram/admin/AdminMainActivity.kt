package com.elvan.rmdneram.admin

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.view.View
import android.view.animation.AlphaAnimation
import android.webkit.*
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import androidx.activity.result.contract.ActivityResultContracts
import android.os.Handler
import android.os.Looper

class AdminMainActivity : AppCompatActivity() {

    companion object {
        private const val ADMIN_URL = "https://adminneram.vercel.app/admin"
        private const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"
    }

    private lateinit var webView: WebView
    private lateinit var splashView: FrameLayout
    private lateinit var offlineView: LinearLayout
    private lateinit var retryButton: Button
    private var isFirstLoad = true

    // Google Sign-In Launcher
    private val googleSignInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            if (account?.idToken != null) {
                val idToken = account.idToken
                webView.post {
                    webView.evaluateJavascript("window.handleNativeGoogleResult('$idToken');", null)
                }
            } else {
                webView.post {
                    webView.evaluateJavascript("window.handleNativeGoogleError('No ID Token found');", null)
                }
            }
        } catch (e: ApiException) {
            webView.post {
                webView.evaluateJavascript("window.handleNativeGoogleError('Google Sign-In Failed: ${e.statusCode}');", null)
            }
        }
    }

    // Javascript Interface
    inner class NativeBridge {
        @JavascriptInterface
        fun loginWithGoogle() {
            Handler(Looper.getMainLooper()).post {
                val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(WEB_CLIENT_ID)
                    .requestEmail()
                    .build()
                val googleSignInClient = GoogleSignIn.getClient(this@AdminMainActivity, gso)
                googleSignInClient.signOut().addOnCompleteListener {
                    googleSignInLauncher.launch(googleSignInClient.signInIntent)
                }
            }
        }

        @JavascriptInterface
        fun reload() {
            Handler(Looper.getMainLooper()).post {
                webView.reload()
            }
        }

        @JavascriptInterface
        fun setTheme(isDark: Boolean) {
            Handler(Looper.getMainLooper()).post {
                val color = if (isDark) Color.parseColor("#000000") else Color.parseColor("#F2F2F7")
                window.statusBarColor = color
                window.navigationBarColor = color
                // Android 15 requires Edge-To-Edge transparent bars, so we color the window background 
                // to fill the safe area padding instead of relying purely on statusBarColor.
                window.decorView.setBackgroundColor(color)

                val insetsController = WindowCompat.getInsetsController(window, window.decorView)
                insetsController.isAppearanceLightStatusBars = !isDark
                insetsController.isAppearanceLightNavigationBars = !isDark
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        // Dismiss Android 12+ system splash IMMEDIATELY to prevent white flash
        val splashScreen = installSplashScreen()
        splashScreen.setKeepOnScreenCondition { false }

        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_admin_main)

        // Apply edge-to-edge insets
        val rootView = findViewById<FrameLayout>(R.id.mainLayout)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { view, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            windowInsets
        }

        // Set light/dark status bar icons and colors based on system theme initially
        val insetsController = WindowCompat.getInsetsController(window, window.decorView)
        val nightMode = resources.configuration.uiMode and
                android.content.res.Configuration.UI_MODE_NIGHT_MASK
        val isSystemDark = nightMode == android.content.res.Configuration.UI_MODE_NIGHT_YES
        
        insetsController.isAppearanceLightStatusBars = !isSystemDark
        insetsController.isAppearanceLightNavigationBars = !isSystemDark
        
        val initialColor = if (isSystemDark) Color.parseColor("#000000") else Color.parseColor("#F2F2F7")
        window.statusBarColor = initialColor
        window.navigationBarColor = initialColor
        // Android 15 requires Edge-To-Edge transparent bars, so we color the window background 
        // to fill the safe area padding instead of relying purely on statusBarColor.
        window.decorView.setBackgroundColor(initialColor)

        // Bind views
        webView = findViewById(R.id.webView)
        splashView = findViewById(R.id.splashView)
        offlineView = findViewById(R.id.offlineView)
        retryButton = findViewById(R.id.retryButton)

        // Configure WebView
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = true
            allowContentAccess = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = false
            @Suppress("DEPRECATION")
            setRenderPriority(WebSettings.RenderPriority.HIGH)
        }

        // Smoothness: hardware acceleration + overscroll
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.isScrollbarFadingEnabled = true
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        webView.addJavascriptInterface(NativeBridge(), "NativeBridge")

        // WebViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                offlineView.visibility = View.GONE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                if (isFirstLoad) {
                    isFirstLoad = false
                    // Fade out splash, show WebView
                    webView.visibility = View.VISIBLE
                    val fadeOut = AlphaAnimation(1f, 0f).apply {
                        duration = 300
                        fillAfter = true
                    }
                    splashView.startAnimation(fadeOut)
                    splashView.postDelayed({
                        splashView.visibility = View.GONE
                    }, 300)
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    showOfflineScreen()
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.contains("adminneram.vercel.app")) {
                    return false
                }
                try {
                    val intent = android.content.Intent(
                        android.content.Intent.ACTION_VIEW,
                        android.net.Uri.parse(url)
                    )
                    startActivity(intent)
                } catch (_: Exception) { }
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {}

        // Retry button
        retryButton.setOnClickListener {
            if (isNetworkAvailable()) {
                offlineView.visibility = View.GONE
                splashView.visibility = View.VISIBLE
                isFirstLoad = true
                webView.loadUrl(ADMIN_URL)
            }
        }

        // Back navigation — Delegate entirely to web app's JS bridge.
        // The web app handles route-aware navigation (sub-module drill-downs,
        // module→home, settings→home). It returns "exit" when at true root,
        // or "navigated" when it handled the back navigation internally.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript(
                    "(function(){ return typeof window.handleNativeBack === 'function' ? window.handleNativeBack() : null; })()"
                ) { result ->
                    val res = result?.replace("\"", "")?.trim()

                    when (res) {
                        "exit" -> {
                            // Web confirmed we're at root → close the app
                            finish()
                        }
                        "navigated" -> {
                            // Web handled the back navigation → do nothing
                        }
                        else -> {
                            // JS bridge not loaded yet (null) — fallback
                            if (webView.canGoBack()) {
                                webView.goBack()
                            } else {
                                finish()
                            }
                        }
                    }
                }
            }
        })

        // Load
        if (isNetworkAvailable()) {
            webView.loadUrl(ADMIN_URL)
        } else {
            showOfflineScreen()
        }
    }

    private fun showOfflineScreen() {
        webView.visibility = View.INVISIBLE
        splashView.visibility = View.GONE
        offlineView.visibility = View.VISIBLE
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
