package com.elvan.rmdneram.admin.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.elvan.rmdneram.admin.data.model.UserProfile
import com.elvan.rmdneram.admin.data.repository.FirebaseRepository
import com.elvan.rmdneram.admin.data.ThemeManager
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * UI State for Admin App
 */
data class AdminUiState(
    val userProfile: UserProfile? = null,
    val themeMode: String = "auto",
    val isLoading: Boolean = true,
    val isSyncing: Boolean = false,
    val error: String? = null
)

/**
 * ViewModel for Admin App
 */
class AdminViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = FirebaseRepository()
    private val auth = FirebaseAuth.getInstance()
    private val themeManager = ThemeManager(application)
    
    private val _uiState = MutableStateFlow(AdminUiState())
    val uiState: StateFlow<AdminUiState> = _uiState.asStateFlow()
    
    init {
        loadUserProfile()
        
        // Load Theme
        viewModelScope.launch {
            themeManager.themeMode.collect { mode ->
                _uiState.update { it.copy(themeMode = mode) }
            }
        }
    }
    
    private fun loadUserProfile() {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            repository.getUserProfile(uid)
                .catch { e -> 
                    _uiState.update { it.copy(isLoading = false) }
                }
                .collect { profile ->
                    _uiState.update { it.copy(userProfile = profile, isLoading = false) }
                }
        }
    }
    
    fun setThemeMode(mode: String) {
        viewModelScope.launch {
            themeManager.setThemeMode(mode)
        }
    }
    
    fun updateUserProfile(updates: Map<String, Any>) {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            try {
                _uiState.update { it.copy(isSyncing = true) }
                repository.updateUserProfile(uid, updates)
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to update profile") }
            } finally {
                _uiState.update { it.copy(isSyncing = false) }
            }
        }
    }
    
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
