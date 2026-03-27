package com.elvan.rmdneram.data.preferences

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.languageDataStore by preferencesDataStore(name = "language_settings")

/**
 * Manages app language preference.
 * Options: "system" (device default), "en" (English), "ta" (Tamil)
 */
class LanguageManager(private val context: Context) {
    private val LANGUAGE_KEY = stringPreferencesKey("app_language")

    val languageCode: Flow<String> = context.languageDataStore.data
        .map { preferences ->
            preferences[LANGUAGE_KEY] ?: "system"
        }

    suspend fun setLanguage(code: String) {
        context.languageDataStore.edit { preferences ->
            preferences[LANGUAGE_KEY] = code
        }
    }
}
