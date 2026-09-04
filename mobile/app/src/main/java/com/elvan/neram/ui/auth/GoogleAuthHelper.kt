package com.elvan.neram.ui.auth

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.net.Uri
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.elvan.neram.MainActivity
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

object GoogleAuthHelper {
    private const val TAG = "GoogleAuthHelper"
    const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"

    sealed class Result {
        data class Success(
            val idToken: String,
            val email: String? = null,
            val displayName: String? = null,
            val givenName: String? = null,
            val familyName: String? = null,
            val profilePictureUri: Uri? = null
        ) : Result()
        object Cancelled : Result()
        data class Error(val message: String, val cause: Throwable? = null) : Result()
    }

    suspend fun getGoogleIdToken(
        context: Context,
        webClientId: String = WEB_CLIENT_ID,
        filterByAuthorizedAccounts: Boolean = false,
        autoSelectEnabled: Boolean = true
    ): Result {
        val credentialManager = CredentialManager.create(context)
        
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(filterByAuthorizedAccounts)
            .setServerClientId(webClientId)
            .setAutoSelectEnabled(autoSelectEnabled)
            .build()
            
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()
            
        return try {
            val response = credentialManager.getCredential(
                request = request,
                context = context
            )
            val credential = response.credential
            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                Result.Success(
                    idToken = googleIdTokenCredential.idToken,
                    email = googleIdTokenCredential.id,
                    displayName = googleIdTokenCredential.displayName,
                    givenName = googleIdTokenCredential.givenName,
                    familyName = googleIdTokenCredential.familyName,
                    profilePictureUri = googleIdTokenCredential.profilePictureUri
                )
            } else {
                Log.w(TAG, "Unexpected credential type: ${credential.type}, falling back to legacy sign-in")
                fallbackToLegacy(context, webClientId)
            }
        } catch (e: GetCredentialCancellationException) {
            Log.d(TAG, "User cancelled Google Sign-In bottom sheet")
            Result.Cancelled
        } catch (e: NoCredentialException) {
            Log.d(TAG, "NoCredentialException in Credential Manager (Dual App / Sandbox / No credentials). Falling back to legacy sign-in.", e)
            fallbackToLegacy(context, webClientId)
        } catch (e: GetCredentialException) {
            Log.w(TAG, "GetCredentialException: ${e.type}: ${e.message}. Falling back to legacy sign-in.", e)
            fallbackToLegacy(context, webClientId)
        } catch (e: Exception) {
            Log.w(TAG, "Exception during Credential Manager getCredential. Falling back to legacy sign-in.", e)
            fallbackToLegacy(context, webClientId)
        }
    }

    private suspend fun fallbackToLegacy(context: Context, webClientId: String): Result {
        val activity = context.findActivity()
        return if (activity != null) {
            Log.i(TAG, "Launching fallback GoogleSignInClient activity intent")
            launchLegacyGoogleSignIn(activity, webClientId)
        } else {
            Log.e(TAG, "Cannot fallback: context is not a ComponentActivity")
            Result.Error("No Google credentials available on device")
        }
    }

    private suspend fun launchLegacyGoogleSignIn(
        activity: ComponentActivity,
        webClientId: String
    ): Result = suspendCancellableCoroutine { continuation ->
        val key = "legacy_google_sign_in_${System.currentTimeMillis()}"
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()
        val googleSignInClient = GoogleSignIn.getClient(activity, gso)

        var launcher: ActivityResultLauncher<android.content.Intent>? = null
        try {
            launcher = activity.activityResultRegistry.register(
                key,
                ActivityResultContracts.StartActivityForResult()
            ) { result ->
                try {
                    launcher?.unregister()
                } catch (_: Exception) {}

                val data = result.data
                if (data != null) {
                    val task = GoogleSignIn.getSignedInAccountFromIntent(data)
                    try {
                        val account = task.getResult(ApiException::class.java)
                        if (account?.idToken != null) {
                            if (continuation.isActive) {
                                continuation.resume(Result.Success(
                                    idToken = account.idToken!!,
                                    email = account.email,
                                    displayName = account.displayName,
                                    givenName = account.givenName,
                                    familyName = account.familyName,
                                    profilePictureUri = account.photoUrl
                                ))
                            }
                        } else {
                            if (continuation.isActive) {
                                continuation.resume(Result.Error("No ID token received from Google Sign-In"))
                            }
                        }
                    } catch (e: ApiException) {
                        Log.w(TAG, "Google Sign-In ApiException: code=${e.statusCode}, message=${e.message}")
                        if (e.statusCode == 12501 || e.statusCode == 12502) {
                            if (continuation.isActive) continuation.resume(Result.Cancelled)
                        } else {
                            if (continuation.isActive) continuation.resume(Result.Error("Google Sign-In failed (${e.statusCode})", e))
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Exception parsing Google Sign-In result", e)
                        if (continuation.isActive) continuation.resume(Result.Error(e.message ?: "Google Sign-In failed", e))
                    }
                } else {
                    Log.d(TAG, "Google Sign-In returned null data (resultCode=${result.resultCode})")
                    if (continuation.isActive) continuation.resume(Result.Cancelled)
                }
            }

            continuation.invokeOnCancellation {
                try {
                    launcher?.unregister()
                } catch (_: Exception) {}
            }

            // In Samsung Dual App / clone sandbox, signOut() callback may delay or hang if Play Services
            // is uninitialized for the secondary profile. Launch intent directly after calling signOut.
            try {
                googleSignInClient.signOut()
            } catch (e: Exception) {
                Log.w(TAG, "Failed to call signOut before launching intent", e)
            }

            try {
                launcher.launch(googleSignInClient.signInIntent)
            } catch (e: Exception) {
                try {
                    launcher.unregister()
                } catch (_: Exception) {}
                if (continuation.isActive) {
                    continuation.resume(Result.Error("Could not launch Google Sign-In intent: ${e.message}", e))
                }
            }
        } catch (e: Exception) {
            try {
                launcher?.unregister()
            } catch (_: Exception) {}
            if (continuation.isActive) {
                continuation.resume(Result.Error("Failed to register activity result launcher: ${e.message}", e))
            }
        }
    }

    private fun Context.findActivity(): ComponentActivity? {
        var ctx: Context? = this
        while (ctx is ContextWrapper) {
            if (ctx is ComponentActivity) return ctx
            ctx = ctx.baseContext
        }
        if (ctx is ComponentActivity) return ctx
        return MainActivity.currentActivity
    }
}
