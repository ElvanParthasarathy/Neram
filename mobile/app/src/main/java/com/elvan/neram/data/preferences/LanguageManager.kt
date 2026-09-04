package com.elvan.neram.data.preferences

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.languageDataStore by preferencesDataStore(name = "language_settings")

/**
 * Manages app language preference and update migration selection status.
 * Options: "system" (device default), "en" (English), "ta" (Tamil), "ml" (Malayalam), etc.
 */
class LanguageManager(private val context: Context) {
    private val LANGUAGE_KEY = stringPreferencesKey("app_language")
    private val HAS_COMPLETED_LANGUAGE_SELECTION = booleanPreferencesKey("has_completed_language_selection")

    val languageCode: Flow<String> = context.languageDataStore.data
        .map { preferences ->
            preferences[LANGUAGE_KEY] ?: "system"
        }

    val hasCompletedLanguageSelection: Flow<Boolean> = context.languageDataStore.data
        .map { preferences ->
            preferences[HAS_COMPLETED_LANGUAGE_SELECTION] ?: false
        }

    suspend fun setLanguage(code: String) {
        context.languageDataStore.edit { preferences ->
            preferences[LANGUAGE_KEY] = code
        }
    }

    suspend fun setHasCompletedLanguageSelection(completed: Boolean = true) {
        context.languageDataStore.edit { preferences ->
            preferences[HAS_COMPLETED_LANGUAGE_SELECTION] = completed
        }
    }
}
