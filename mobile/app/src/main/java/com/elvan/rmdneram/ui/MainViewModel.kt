package com.elvan.rmdneram.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.elvan.rmdneram.data.ThemeManager
import com.elvan.rmdneram.data.LanguageManager
import com.elvan.rmdneram.data.model.UserProfile
import com.elvan.rmdneram.data.repository.FirebaseRepository
import com.google.firebase.auth.FirebaseAuth
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.content.Context
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.channels.awaitClose
import android.util.Log
import kotlinx.coroutines.runBlocking

/**
 * UI State for MainScreen
 */
data class MainUiState(
    val userProfile: UserProfile? = null,
    val academicHierarchy: Map<String, Map<String, List<String>>> = emptyMap(),
    val themeMode: String = "auto", // "auto", "light", "dark"
    val languageCode: String = "system", // "system", "en", "ta"
    val isOffline: Boolean = false,
    val isLoading: Boolean = true,
    val isAuthenticated: Boolean = false,
    val isOnboardingComplete: Boolean = false,
    val isAuthInitialized: Boolean = false
)

/**
 * ViewModel for MainScreen managing global state like user profile and preview mode
 */
class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = FirebaseRepository(application.applicationContext)
    private val auth = FirebaseAuth.getInstance()
    private val themeManager = ThemeManager(application)
    private val languageManager = LanguageManager(application)
    
    private val _uiState = MutableStateFlow(
        MainUiState(
            themeMode = runBlocking { themeManager.themeMode.first() },
            languageCode = runBlocking { languageManager.languageCode.first() },
            isAuthenticated = false, // Will be updated by flow
            isAuthInitialized = false
        )
    )
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()
    
    // Reactive Auth State Flow
    private val authStateFlow = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            trySend(firebaseAuth.currentUser?.uid)
        }
        auth.addAuthStateListener(listener)
        trySend(auth.currentUser?.uid)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    // Event channel for login errors (e.g. Access Denied)
    private val _loginErrorChannel = kotlinx.coroutines.channels.Channel<String>(kotlinx.coroutines.channels.Channel.BUFFERED)
    val loginErrorFlow = _loginErrorChannel.receiveAsFlow()

    init {
        // Observe Auth Changes and Load Profile
        viewModelScope.launch {
            authStateFlow.collectLatest { uid ->
                if (uid != null) {
                    _uiState.update { it.copy(isAuthenticated = true, isAuthInitialized = true) }
                    // Sync user profile when auth changes (Login/App Start)
                    repository.getUserProfile(uid)
                        .catch { Log.e("MainViewModel", "Error loading profile", it) }
                        .collect { dbProfile ->
                            var effectiveProfile = dbProfile
                            val currentUser = auth.currentUser

                            // Fallback to Auth User if DB profile is missing (e.g. new signup)
                            if (effectiveProfile == null) {
                                effectiveProfile = currentUser?.let { user ->
                                    val fallbackName = user.displayName?.takeUnless { it.isBlank() } 
                                        ?: user.email?.substringBefore("@") 
                                        ?: "Student"
                                        
                                    UserProfile(
                                        uid = user.uid,
                                        email = user.email ?: "",
                                        displayName = fallbackName,
                                        photoURL = user.photoUrl?.toString(),
                                        role = "student", // Default role
                                        batch = "",
                                        department = "",
                                        section = ""
                                    )
                                }
                            } else if (currentUser != null) {
                                // Auto-sync missing data
                                val updates = mutableMapOf<String, Any>()
                                var shouldUpdate = false
                                
                                // Sync Photo if missing locally but present in Auth
                                if (currentUser.photoUrl != null && effectiveProfile.photoURL.isNullOrEmpty()) {
                                    val newPhotoUrl = currentUser.photoUrl.toString()
                                    effectiveProfile = effectiveProfile.copy(photoURL = newPhotoUrl)
                                    updates["photoURL"] = newPhotoUrl
                                    shouldUpdate = true
                                }
                                
                                // Sync Name if missing locally but present in Auth
                                if (!currentUser.displayName.isNullOrBlank() && effectiveProfile.displayName.isBlank()) {
                                    val newName = currentUser.displayName!!
                                    effectiveProfile = effectiveProfile.copy(displayName = newName)
                                    updates["displayName"] = newName
                                    shouldUpdate = true
                                }
                                
                                if (shouldUpdate) {
                                    // Persist to DB in background
                                    viewModelScope.launch {
                                        try {
                                            repository.updateUserProfile(effectiveProfile.uid, updates)
                                        } catch (e: Exception) {
                                            Log.e("MainViewModel", "Failed to auto-sync profile data", e)
                                        }
                                    }
                                }
                            }
                            
                            // --- ROLE CHECK: BLOCK ADMINS/FACULTY/ETC ---
                            // 'rep' is allowed as they are students too.
                            val blockedRoles = listOf("admin", "faculty", "super_admin", "checker", "blocker")
                            if (effectiveProfile != null && blockedRoles.contains(effectiveProfile.role)) {
                                // Block Access
                                _uiState.update { it.copy(isLoading = false) }
                                viewModelScope.launch {
                                    _loginErrorChannel.send("Access Denied: ${effectiveProfile.role} role must use the Admin Portal.")
                                }
                                signOut() // Log them out immediately
                                return@collect // Stop processing this profile
                            }
                            
                            val isComplete = effectiveProfile != null && 
                                             !effectiveProfile.department.isNullOrEmpty() && 
                                             !effectiveProfile.batch.isNullOrEmpty() && 
                                             !effectiveProfile.section.isNullOrEmpty()
                            
                            _uiState.update { 
                                it.copy(
                                    userProfile = effectiveProfile,
                                    isOnboardingComplete = isComplete
                                ) 
                            }
                        }
                } else {
                    // Clear profile on logout
                    _uiState.update { 
                        it.copy(
                            userProfile = null, 
                            isAuthenticated = false,
                            isOnboardingComplete = false,
                            isAuthInitialized = true
                        ) 
                    }
                }
            }
        }

        loadAcademicHierarchy()
        
        // Load Theme
        viewModelScope.launch {
            themeManager.themeMode.collect { mode ->
                _uiState.update { it.copy(themeMode = mode) }
            }
        }
        
        // Load Language
        viewModelScope.launch {
            languageManager.languageCode.collect { code ->
                _uiState.update { it.copy(languageCode = code) }
            }
        }

        observeConnectivity()
    }

    private fun observeConnectivity() {
        val connectivityManager = getApplication<Application>().getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        // Initial state
        val activeNetwork = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork)
        val isInitiallyOnline = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
        _uiState.update { it.copy(isOffline = !isInitiallyOnline) }

        // Callback for updates
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager.registerNetworkCallback(request, object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                _uiState.update { it.copy(isOffline = false) }
            }

            override fun onLost(network: Network) {
                // Check if any other network is available
                val active = connectivityManager.activeNetwork
                val caps = connectivityManager.getNetworkCapabilities(active)
                val stillOnline = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
                if (!stillOnline) {
                    _uiState.update { it.copy(isOffline = true) }
                }
            }
        })
    }
    
    private fun loadAcademicHierarchy() {
        viewModelScope.launch {
            repository.getAcademicHierarchy()
                .catch { e ->
                    // Optionally handle permission denied by keeping current state
                }
                .collect { hierarchy ->
                    _uiState.update { it.copy(academicHierarchy = hierarchy) }
                }
        }
    }
    
    fun sendMessage(data: Map<String, Any?>) {
        viewModelScope.launch {
            try {
                repository.sendMessage(data)
            } catch (e: Exception) {
                // Log error
            }
        }
    }
    


    fun setThemeMode(mode: String) {
        viewModelScope.launch {
            themeManager.setThemeMode(mode)
        }
    }
    
    fun setLanguage(code: String) {
        viewModelScope.launch {
            languageManager.setLanguage(code)
        }
    }

    fun saveOnboardingData(dept: String, batch: String, section: String) {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                // Create map of updates
                val updates = mapOf(
                    "department" to dept,
                    "batch" to batch,
                    "section" to section,
                    "isProfileComplete" to true
                )
                
                // Update Firestore
                repository.updateUserProfile(uid, updates)
                
                // Optimistically update local state
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        isOnboardingComplete = true,
                        userProfile = it.userProfile?.copy(
                            department = dept,
                            batch = batch,
                            section = section
                        ) ?: UserProfile(
                            uid = uid,
                            email = auth.currentUser?.email ?: "",
                            department = dept,
                            batch = batch,
                            section = section
                        )
                    ) 
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false) }
                Log.e("MainViewModel", "Failed to save onboarding data", e)
            }
        }
    }

    fun signOut() {
        auth.signOut()
        // AuthStateListener will automatically update the UI state to clear the profile
    }
}
