package com.elvan.neram.ui.profile

import android.content.res.Configuration
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.material3.ripple
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.elvan.neram.data.local.NeramDatabase
import com.elvan.neram.data.local.entity.MasterDataEntity
import com.elvan.neram.data.local.entity.UserEntity
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.toMozhiFullDate
import com.elvan.neram.ui.theme.AppColors
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

// India-only mobile format
private fun formatMobileForDisplay(mobile: String?): String? {
    if (mobile.isNullOrBlank()) return null
    val clean = mobile.replace(" ", "").replace("+", "")
    val number = if (clean.startsWith("91") && clean.length > 10) {
        clean.substring(2)
    } else {
        clean
    }
    return if (number.isNotBlank()) "+91 $number" else null
}

private fun extractMobileNumber(mobile: String?): String {
    if (mobile.isNullOrBlank()) return ""
    val clean = mobile.replace(" ", "").replace("+", "")
    return if (clean.startsWith("91") && clean.length > 10) {
        clean.substring(2)
    } else {
        clean
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBack: () -> Unit = {},
    homeViewModel: HomeViewModel = viewModel(),
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val user = Firebase.auth.currentUser
    val context = LocalContext.current
    val colors = rememberHomeColors()
    val isDark = colors.isDark
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    
    // Room DB instance for offline cache
    val db = remember { NeramDatabase.getDatabase(context) }
    val masterDataDao = remember { db.masterDataDao() }
    val userDao = remember { db.userDao() }

    // Instant initial profile from ViewModel cache if available
    val homeUiState by homeViewModel.uiState.collectAsState()
    val initialProfile = homeUiState.userProfile
    val initialHierarchy = homeUiState.academicHierarchy

    // State
    var formData by remember {
        mutableStateOf<Map<String, String>>(
            if (initialProfile != null) {
                mapOf(
                    "uid" to initialProfile.uid,
                    "email" to initialProfile.email,
                    "displayName" to initialProfile.displayName,
                    "photoURL" to (initialProfile.photoURL ?: ""),
                    "role" to initialProfile.role,
                    "batch" to initialProfile.batch,
                    "department" to initialProfile.department,
                    "section" to initialProfile.section
                ).filterValues { it.isNotEmpty() }
            } else emptyMap()
        )
    }
    var editingField by remember { mutableStateOf<String?>(null) }
    var hierarchy by remember { mutableStateOf<Map<String, Map<String, List<String>>>>(initialHierarchy) }
    
    // Modals
    var showSelectorModal by remember { mutableStateOf(false) }
    var selectorFieldKey by remember { mutableStateOf("") }
    var selectorTitle by remember { mutableStateOf("") }
    var selectorOptions by remember { mutableStateOf(listOf<String>()) }
    var onSelectorSelect by remember { mutableStateOf<(String) -> Unit>({}) }
    
    var showDatePicker by remember { mutableStateOf(false) }
    var showLogoutConfirm by remember { mutableStateOf(false) }
    
    // Name editing state
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    // Mobile editing state (just the 10-digit number)
    var mobileNumber by remember { mutableStateOf("") }
    
    // 1. FAST OFFLINE-FIRST CACHE LOAD (Loads instantly from Room SQLite even when offline)
    LaunchedEffect(user?.uid) {
        user?.uid?.let { uid ->
            // Load local detailed profile from Room DB
            val cachedProfileEntity = masterDataDao.getMasterDataById("user_profile_details_$uid")
            if (cachedProfileEntity != null) {
                try {
                    val type = object : TypeToken<Map<String, String>>() {}.type
                    val cachedMap: Map<String, String> = Gson().fromJson(cachedProfileEntity.json, type)
                    if (cachedMap.isNotEmpty()) {
                        formData = cachedMap
                    }
                } catch (e: Exception) {
                    android.util.Log.e("ProfileScreen", "Error loading cached profile", e)
                }
            }
            
            // Load local hierarchy from Room DB
            val cachedHierarchyEntity = masterDataDao.getMasterDataById("academic_hierarchy")
            if (cachedHierarchyEntity != null) {
                try {
                    val type = object : TypeToken<Map<String, Map<String, List<String>>>>() {}.type
                    val cachedH: Map<String, Map<String, List<String>>> = Gson().fromJson(cachedHierarchyEntity.json, type)
                    if (cachedH.isNotEmpty()) {
                        hierarchy = cachedH
                    }
                } catch (e: Exception) {
                    android.util.Log.e("ProfileScreen", "Error loading cached hierarchy", e)
                }
            }
        }
    }

    // 2. LIVE FIREBASE SYNC (Syncs in background when online and caches locally)
    DisposableEffect(user?.uid) {
        var userListener: ValueEventListener? = null
        var hierarchyListener: ValueEventListener? = null
        var userRef: com.google.firebase.database.DatabaseReference? = null
        var hierarchyRef: com.google.firebase.database.DatabaseReference? = null
        
        user?.uid?.let { uid ->
            userRef = Firebase.database.getReference("users/$uid")
            userListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    try {
                        val data = mutableMapOf<String, String>()
                        snapshot.children.forEach { child ->
                            val value = child.value?.toString()
                            val key = child.key
                            if (key != null && value != null) {
                                data[key] = value
                            }
                        }
                        if (data.isNotEmpty()) {
                            formData = data
                            // Persist to Room DB so it's always available offline
                            scope.launch(Dispatchers.IO) {
                                try {
                                    masterDataDao.insertMasterData(
                                        MasterDataEntity(
                                            id = "user_profile_details_$uid",
                                            json = Gson().toJson(data)
                                        )
                                    )
                                    userDao.insertUserProfile(
                                        UserEntity(
                                            uid = uid,
                                            email = data["email"] ?: user.email ?: "",
                                            displayName = data["displayName"] ?: "",
                                            photoURL = data["photoURL"],
                                            role = data["role"] ?: "student",
                                            batch = data["batch"] ?: "",
                                            department = data["department"] ?: "",
                                            section = data["section"] ?: ""
                                        )
                                    )
                                } catch (e: Exception) {
                                    android.util.Log.e("ProfileScreen", "Failed to cache user profile to Room", e)
                                }
                            }
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("ProfileScreen", "Error parsing user data", e)
                    }
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            userRef?.let { ref ->
                userListener?.let { listener -> ref.addValueEventListener(listener) }
            }
            
            hierarchyRef = Firebase.database.getReference("academic_hierarchy")
            hierarchyListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    try {
                        val result = mutableMapOf<String, Map<String, List<String>>>()
                        snapshot.children.forEach { batchSnap ->
                            val batch = batchSnap.key ?: return@forEach
                            val depts = mutableMapOf<String, List<String>>()
                            batchSnap.children.forEach { deptSnap ->
                                val dept = deptSnap.key ?: return@forEach
                                val sections = deptSnap.children.mapNotNull { it.getValue(String::class.java) }
                                depts[dept] = sections
                            }
                            result[batch] = depts
                        }
                        if (result.isNotEmpty()) {
                            hierarchy = result
                            scope.launch(Dispatchers.IO) {
                                try {
                                    masterDataDao.insertMasterData(
                                        MasterDataEntity(
                                            id = "academic_hierarchy",
                                            json = Gson().toJson(result)
                                        )
                                    )
                                } catch (e: Exception) {
                                    android.util.Log.e("ProfileScreen", "Failed to cache hierarchy to Room", e)
                                }
                            }
                        }
                    } catch (e: Exception) {}
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            hierarchyRef?.let { ref ->
                hierarchyListener?.let { listener -> ref.addValueEventListener(listener) }
            }
        }
        
        onDispose {
            userRef?.let { ref -> userListener?.let { listener -> ref.removeEventListener(listener) } }
            hierarchyRef?.let { ref -> hierarchyListener?.let { listener -> ref.removeEventListener(listener) } }
        }
    }
    
    // Helper functions
    fun getBatches() = hierarchy.keys.toList().sorted()
    fun getDepartments(batch: String) = hierarchy[batch]?.keys?.toList()?.sorted() ?: emptyList()
    fun getSections(batch: String, dept: String) = hierarchy[batch]?.get(dept)?.sorted() ?: emptyList()
    
    fun openSelector(fieldKey: String, title: String, options: List<String>, onSelect: (String) -> Unit) {
        selectorFieldKey = fieldKey
        selectorTitle = title
        selectorOptions = options
        onSelectorSelect = onSelect
        showSelectorModal = true
    }
    
    fun handleSave(field: String) {
        user?.uid?.let { uid ->
            val updates: Map<String, String> = when (field) {
                "name" -> mapOf(
                    "displayName" to "$firstName $lastName".trim(),
                    "firstName" to firstName,
                    "lastName" to lastName
                )
                "academic" -> mapOf(
                    "batch" to (formData["batch"] ?: ""),
                    "department" to (formData["department"] ?: ""),
                    "section" to (formData["section"] ?: "")
                )
                "mobile" -> mapOf("mobile" to mobileNumber.trim())
                else -> mapOf(field to (formData[field] ?: ""))
            }
            
            // 1. Immediately update formData in memory
            val updatedMap = formData.toMutableMap()
            updates.forEach { (k, v) -> updatedMap[k] = v }
            formData = updatedMap

            // 2. Persist to Room DB immediately (offline-safe)
            scope.launch(Dispatchers.IO) {
                try {
                    masterDataDao.insertMasterData(
                        MasterDataEntity(
                            id = "user_profile_details_$uid",
                            json = Gson().toJson(updatedMap)
                        )
                    )
                    userDao.insertUserProfile(
                        UserEntity(
                            uid = uid,
                            email = updatedMap["email"] ?: user.email ?: "",
                            displayName = updatedMap["displayName"] ?: "",
                            photoURL = updatedMap["photoURL"],
                            role = updatedMap["role"] ?: "student",
                            batch = updatedMap["batch"] ?: "",
                            department = updatedMap["department"] ?: "",
                            section = updatedMap["section"] ?: ""
                        )
                    )
                } catch (e: Exception) {
                    android.util.Log.e("ProfileScreen", "Failed to cache profile locally", e)
                }
            }

            // 3. Queue update to Firebase Realtime Database
            try {
                Firebase.database.getReference("users/$uid").updateChildren(updates as Map<String, Any>)
            } catch (e: Exception) {
                android.util.Log.e("ProfileScreen", "Error updating Firebase", e)
            }
        }
        editingField = null
    }
    
    fun handleLogout() {
        homeViewModel.performLogout()
    }

    val cardColor = if (isDark) Color(0xFF111111) else Color.White
    val avatarBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
    val buttonBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)

    val formattedBirthday = formData["birthday"]?.let {
        try {
            LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
        } catch (e: Exception) {
            it
        }
    }
    
    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            state = scrollState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
            verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
        ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
            }

            // 1. Profile Header Card (Matching Flutter Elvan style)
            item(key = "profile_header") {
                ElvanSectionContainer {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        color = cardColor,
                        shadowElevation = 0.dp
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 28.dp, horizontal = 24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Avatar (108dp circle)
                            val photoUrl = formData["photoURL"]
                            Surface(
                                modifier = Modifier.size(108.dp),
                                shape = CircleShape,
                                color = avatarBg
                            ) {
                                if (!photoUrl.isNullOrEmpty()) {
                                    AsyncImage(
                                        model = ImageRequest.Builder(LocalContext.current)
                                            .data(photoUrl)
                                            .crossfade(true)
                                            .build(),
                                        contentDescription = null,
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .clip(CircleShape),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier.fillMaxSize()
                                    ) {
                                        Text(
                                            text = (formData["displayName"] ?: user?.email ?: "U").take(1).uppercase(),
                                            style = TextStyle(
                                                fontFamily = ff,
                                                fontSize = 40.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            color = colors.textPrimary
                                        )
                                    }
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            // Display Name
                            Text(
                                text = formData["displayName"] ?: K.yourName.tr(lang),
                                style = TextStyle(
                                    fontFamily = ff,
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.SemiBold
                                ),
                                color = colors.textPrimary,
                                textAlign = TextAlign.Center
                            )
                            
                            Spacer(modifier = Modifier.height(4.dp))
                            
                            // Email
                            Text(
                                text = user?.email ?: "",
                                style = TextStyle(
                                    fontFamily = ff,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Normal
                                ),
                                color = colors.textPrimary.copy(alpha = 0.5f),
                                textAlign = TextAlign.Center
                            )
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            // Sync Photo Pill Button (Monochrome / Subtle)
                            Button(
                                onClick = {
                                    val googleProvider = user?.providerData?.find { it.providerId == "google.com" }
                                    val googlePhotoUrl = googleProvider?.photoUrl
                                    
                                    when {
                                        googlePhotoUrl != null -> {
                                            user.uid.let { uid ->
                                                val updatedMap = formData + ("photoURL" to googlePhotoUrl.toString())
                                                formData = updatedMap
                                                scope.launch(Dispatchers.IO) {
                                                    try {
                                                        masterDataDao.insertMasterData(
                                                            MasterDataEntity(
                                                                id = "user_profile_details_$uid",
                                                                json = Gson().toJson(updatedMap)
                                                            )
                                                        )
                                                        userDao.insertUserProfile(
                                                            UserEntity(
                                                                uid = uid,
                                                                email = updatedMap["email"] ?: user.email ?: "",
                                                                displayName = updatedMap["displayName"] ?: "",
                                                                photoURL = googlePhotoUrl.toString(),
                                                                role = updatedMap["role"] ?: "student",
                                                                batch = updatedMap["batch"] ?: "",
                                                                department = updatedMap["department"] ?: "",
                                                                section = updatedMap["section"] ?: ""
                                                            )
                                                        )
                                                    } catch (e: Exception) {
                                                        android.util.Log.e("ProfileScreen", "Failed to cache synced photo locally", e)
                                                    }
                                                }
                                                Firebase.database.getReference("users/$uid/photoURL")
                                                    .setValue(googlePhotoUrl.toString())
                                                    .addOnSuccessListener {
                                                        scope.launch {
                                                            snackbarHostState.showSnackbar(
                                                                K.photoSyncedSuccess.tr(lang)
                                                            )
                                                        }
                                                    }
                                                    .addOnFailureListener { e ->
                                                        scope.launch {
                                                            snackbarHostState.showSnackbar(
                                                                K.syncFailed.tr(lang) + (e.message ?: "")
                                                            )
                                                        }
                                                    }
                                            }
                                        }
                                        googleProvider == null -> {
                                            scope.launch {
                                                snackbarHostState.showSnackbar(
                                                    K.noGoogleAccountLinked.tr(lang)
                                                )
                                            }
                                        }
                                        else -> {
                                            scope.launch {
                                                snackbarHostState.showSnackbar(
                                                    K.noPhotoInGoogleAccount.tr(lang)
                                                )
                                            }
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(50),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = buttonBg,
                                    contentColor = colors.textPrimary
                                ),
                                elevation = ButtonDefaults.buttonElevation(0.dp),
                                contentPadding = PaddingValues(horizontal = 18.dp, vertical = 8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Sync,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp),
                                    tint = colors.textPrimary
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = K.syncGooglePhoto.tr(lang),
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                )
                            }
                        }
                    }
                }
            }
            
            // 2. Personal Information Section
            item(key = "personal_info") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = K.personalInfo.tr(lang),
                        colors = colors
                    ) {
                        // Full Name Row
                        ElvanSettingsAnimatedExpand(
                            isEditing = editingField == "name",
                            displayContent = {
                                ElvanSettingsDisplayRow(
                                    title = K.fullName.tr(lang),
                                    primaryValue = formData["displayName"] ?: "",
                                    onEdit = {
                                        val full = formData["displayName"] ?: ""
                                        val lastSpace = full.lastIndexOf(" ")
                                        if (lastSpace == -1) {
                                            firstName = full
                                            lastName = ""
                                        } else {
                                            firstName = full.substring(0, lastSpace)
                                            lastName = full.substring(lastSpace + 1)
                                        }
                                        editingField = "name"
                                    },
                                    colors = colors
                                )
                            },
                            editContent = {
                                ElvanSettingsEditContainer(
                                    title = K.editName.tr(lang),
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("name") },
                                    cancelText = K.cancel.tr(lang),
                                    saveText = K.save.tr(lang),
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = K.firstName.tr(lang),
                                        value = firstName,
                                        onValueChange = { firstName = it },
                                        placeholder = K.enterFirstName.tr(lang),
                                        colors = colors
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    ElvanSettingsTextField(
                                        label = K.lastName.tr(lang),
                                        value = lastName,
                                        onValueChange = { lastName = it },
                                        placeholder = K.enterLastName.tr(lang),
                                        colors = colors
                                    )
                                }
                            }
                        )

                        ElvanSettingsDivider(colors = colors)

                        // Mobile Row
                        ElvanSettingsAnimatedExpand(
                            isEditing = editingField == "mobile",
                            displayContent = {
                                ElvanSettingsDisplayRow(
                                    title = K.mobileNumber.tr(lang),
                                    primaryValue = formatMobileForDisplay(formData["mobile"]) ?: "",
                                    onEdit = {
                                        mobileNumber = extractMobileNumber(formData["mobile"])
                                        editingField = "mobile"
                                    },
                                    colors = colors
                                )
                            },
                            editContent = {
                                ElvanSettingsEditContainer(
                                    title = K.editMobileNumber.tr(lang),
                                    onCancel = { editingField = null },
                                    onSave = {
                                        formData = formData + ("mobile" to mobileNumber)
                                        handleSave("mobile")
                                    },
                                    cancelText = K.cancel.tr(lang),
                                    saveText = K.save.tr(lang),
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = K.mobileNumber.tr(lang),
                                        value = mobileNumber,
                                        onValueChange = {
                                            mobileNumber = it.filter { c -> c.isDigit() }.take(10)
                                        },
                                        placeholder = K.tenDigitNumber.tr(lang),
                                        prefixText = "+91 ",
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                        colors = colors
                                    )
                                }
                            }
                        )

                        ElvanSettingsDivider(colors = colors)

                        // Date of Birth Row
                        ElvanSettingsAnimatedExpand(
                            isEditing = editingField == "birthday",
                            displayContent = {
                                ElvanSettingsDisplayRow(
                                    title = K.dateOfBirth.tr(lang),
                                    primaryValue = formattedBirthday ?: "",
                                    onEdit = {
                                        editingField = "birthday"
                                        showDatePicker = true
                                    },
                                    colors = colors
                                )
                            },
                            editContent = {
                                ElvanSettingsEditContainer(
                                    title = K.editDateOfBirth.tr(lang),
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("birthday") },
                                    cancelText = K.cancel.tr(lang),
                                    saveText = K.save.tr(lang),
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = K.dateOfBirth.tr(lang),
                                        value = formattedBirthday ?: "",
                                        onValueChange = {},
                                        placeholder = K.selectDate.tr(lang),
                                        readOnly = true,
                                        onClick = { showDatePicker = true },
                                        trailingIcon = {
                                            Icon(
                                                imageVector = Icons.Outlined.CalendarMonth,
                                                contentDescription = null,
                                                tint = colors.textPrimary.copy(alpha = 0.5f),
                                                modifier = Modifier.size(20.dp)
                                            )
                                        },
                                        colors = colors
                                    )
                                }
                            }
                        )

                        ElvanSettingsDivider(colors = colors)

                        // Gender Row
                        ElvanSettingsAnimatedExpand(
                            isEditing = editingField == "gender",
                            displayContent = {
                                val genderDisplay = when (formData["gender"]?.trim()?.lowercase()) {
                                    "male", "ஆண்", "aan" -> K.male.tr(lang)
                                    "female", "பெண்", "pen" -> K.female.tr(lang)
                                    "other", "மற்றவை", "matravai" -> K.genderOther.tr(lang)
                                    else -> formData["gender"] ?: ""
                                }
                                ElvanSettingsDisplayRow(
                                    title = K.gender.tr(lang),
                                    primaryValue = genderDisplay,
                                    onEdit = { editingField = "gender" },
                                    colors = colors
                                )
                            },
                            editContent = {
                                val genderDisplay = when (formData["gender"]?.trim()?.lowercase()) {
                                    "male", "ஆண்", "aan" -> K.male.tr(lang)
                                    "female", "பெண்", "pen" -> K.female.tr(lang)
                                    "other", "மற்றவை", "matravai" -> K.genderOther.tr(lang)
                                    else -> formData["gender"] ?: ""
                                }
                                ElvanSettingsEditContainer(
                                    title = K.selectGender.tr(lang),
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("gender") },
                                    cancelText = K.cancel.tr(lang),
                                    saveText = K.save.tr(lang),
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = K.gender.tr(lang),
                                        value = genderDisplay,
                                        onValueChange = {},
                                        placeholder = K.selectGender.tr(lang),
                                        readOnly = true,
                                        onClick = {
                                            openSelector(
                                                "gender",
                                                K.selectGender.tr(lang),
                                                listOf(K.male.tr(lang), K.female.tr(lang), K.genderOther.tr(lang))
                                            ) { selected ->
                                                val canonical = when (selected) {
                                                    K.male.tr(lang) -> "Male"
                                                    K.female.tr(lang) -> "Female"
                                                    K.genderOther.tr(lang) -> "Other"
                                                    else -> selected
                                                }
                                                formData = formData + ("gender" to canonical)
                                            }
                                        },
                                        trailingIcon = {
                                            Icon(
                                                imageVector = Icons.Default.ArrowDropDown,
                                                contentDescription = null,
                                                tint = colors.textPrimary.copy(alpha = 0.5f),
                                                modifier = Modifier.size(22.dp)
                                            )
                                        },
                                        colors = colors
                                    )
                                }
                            }
                        )
                    }
                }
            }
            
            // 3. Academic Details Section
            item(key = "academic_info") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = K.academicDetails.tr(lang),
                        colors = colors
                    ) {
                        // Academic Enrollment (Batch, Dept, Section)
                        ElvanSettingsAnimatedExpand(
                            isEditing = editingField == "academic",
                            displayContent = {
                                ElvanSettingsDisplayRow(
                                    title = K.batchDeptSection.tr(lang),
                                    primaryValue = listOfNotNull(
                                        formData["batch"],
                                        formData["department"],
                                        formData["section"]
                                    ).takeIf { it.isNotEmpty() }?.joinToString(" • ") ?: "",
                                    onEdit = { editingField = "academic" },
                                    colors = colors
                                )
                            },
                            editContent = {
                                ElvanSettingsEditContainer(
                                    title = K.editAcademicDetails.tr(lang),
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("academic") },
                                    cancelText = K.cancel.tr(lang),
                                    saveText = K.save.tr(lang),
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = K.batch.tr(lang),
                                        value = formData["batch"] ?: "",
                                        onValueChange = {},
                                        placeholder = K.selectBatch.tr(lang),
                                        readOnly = true,
                                        onClick = {
                                            openSelector(
                                                "batch",
                                                K.selectBatch.tr(lang),
                                                getBatches()
                                            ) {
                                                formData = formData + mapOf("batch" to it, "department" to "", "section" to "")
                                            }
                                        },
                                        trailingIcon = {
                                            Icon(
                                                imageVector = Icons.Default.ArrowDropDown,
                                                contentDescription = null,
                                                tint = colors.textPrimary.copy(alpha = 0.5f),
                                                modifier = Modifier.size(22.dp)
                                            )
                                        },
                                        colors = colors
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    ElvanSettingsTextField(
                                        label = K.department.tr(lang),
                                        value = formData["department"] ?: "",
                                        onValueChange = {},
                                        placeholder = K.selectDepartment.tr(lang),
                                        readOnly = true,
                                        onClick = {
                                            formData["batch"]?.let { batch ->
                                                openSelector(
                                                    "department",
                                                    K.selectDepartment.tr(lang),
                                                    getDepartments(batch)
                                                ) {
                                                    formData = formData + mapOf("department" to it, "section" to "")
                                                }
                                            }
                                        },
                                        trailingIcon = {
                                            Icon(
                                                imageVector = Icons.Default.ArrowDropDown,
                                                contentDescription = null,
                                                tint = colors.textPrimary.copy(alpha = 0.5f),
                                                modifier = Modifier.size(22.dp)
                                            )
                                        },
                                        colors = colors
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    ElvanSettingsTextField(
                                        label = K.section.tr(lang),
                                        value = formData["section"] ?: "",
                                        onValueChange = {},
                                        placeholder = K.selectSection.tr(lang),
                                        readOnly = true,
                                        onClick = {
                                            val batch = formData["batch"] ?: return@ElvanSettingsTextField
                                            val dept = formData["department"] ?: return@ElvanSettingsTextField
                                            openSelector(
                                                "section",
                                                K.selectSection.tr(lang),
                                                getSections(batch, dept)
                                            ) {
                                                formData = formData + ("section" to it)
                                            }
                                        },
                                        trailingIcon = {
                                            Icon(
                                                imageVector = Icons.Default.ArrowDropDown,
                                                contentDescription = null,
                                                tint = colors.textPrimary.copy(alpha = 0.5f),
                                                modifier = Modifier.size(22.dp)
                                            )
                                        },
                                        colors = colors
                                    )
                                }
                            }
                        )

                        ElvanSettingsDivider(colors = colors)

                        // Register Number Row
                        ElvanSettingsAnimatedExpand(
                            isEditing = editingField == "registerNo",
                            displayContent = {
                                ElvanSettingsDisplayRow(
                                    title = K.registerNumber.tr(lang),
                                    primaryValue = formData["registerNo"] ?: "",
                                    onEdit = { editingField = "registerNo" },
                                    colors = colors
                                )
                            },
                            editContent = {
                                ElvanSettingsEditContainer(
                                    title = K.editRegisterNumber.tr(lang),
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("registerNo") },
                                    cancelText = K.cancel.tr(lang),
                                    saveText = K.save.tr(lang),
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = K.registerNumber.tr(lang),
                                        value = formData["registerNo"] ?: "",
                                        onValueChange = { formData = formData + ("registerNo" to it) },
                                        placeholder = K.enterRegisterNumber.tr(lang),
                                        colors = colors
                                    )
                                }
                            }
                        )
                    }
                }
            }
        }
        
        // Snackbar Host
        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp)
        ) { data ->
            Snackbar(
                snackbarData = data,
                containerColor = cardColor,
                contentColor = colors.textPrimary,
                shape = RoundedCornerShape(50)
            )
        }
    }
    
    // Selector Bottom Sheet
    if (showSelectorModal) {
        ModalBottomSheet(
            onDismissRequest = { showSelectorModal = false },
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
            containerColor = cardColor,
            contentColor = colors.textPrimary,
            scrimColor = Color.Black.copy(alpha = 0.5f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 32.dp)
            ) {
                Text(
                    text = selectorTitle,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    color = colors.textPrimary,
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)
                )
                
                ElvanSettingsDivider(colors = colors, indent = 0.dp, endIndent = 0.dp)
                
                selectorOptions.forEach { option ->
                    val isOptionSelected = when (selectorFieldKey) {
                        "gender" -> {
                            val genderDisplay = when (formData["gender"]?.trim()?.lowercase()) {
                                "male", "ஆண்", "aan" -> K.male.tr(lang)
                                "female", "பெண்", "pen" -> K.female.tr(lang)
                                "other", "மற்றவை", "matravai" -> K.genderOther.tr(lang)
                                else -> formData["gender"] ?: ""
                            }
                            genderDisplay == option
                        }
                        "batch" -> formData["batch"] == option
                        "department" -> formData["department"] == option
                        "section" -> formData["section"] == option
                        else -> false
                    }
                    
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = ripple(color = if (isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f), bounded = true),
                                onClick = {
                                    onSelectorSelect(option)
                                    showSelectorModal = false
                                }
                            ),
                        color = Color.Transparent
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = option,
                                style = TextStyle(
                                    fontFamily = ff,
                                    fontSize = 16.sp,
                                    fontWeight = if (isOptionSelected) FontWeight.SemiBold else FontWeight.Normal
                                ),
                                color = colors.textPrimary,
                                modifier = Modifier.weight(1f)
                            )
                            if (isOptionSelected) {
                                Icon(
                                    imageVector = Icons.Filled.Check,
                                    contentDescription = null,
                                    tint = colors.textPrimary,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Date Picker Dialog
    if (showDatePicker) {
        val initialBirthday = formData["birthday"]?.let {
            try { LocalDate.parse(it) } catch (e: Exception) { null }
        } ?: LocalDate.now()

        com.elvan.neram.ui.common.NeramDatePickerDialog(
            initialDate = initialBirthday,
            onDateSelected = { date ->
                val updatedMap = formData + ("birthday" to date.toString())
                formData = updatedMap
                user?.uid?.let { uid ->
                    scope.launch(Dispatchers.IO) {
                        try {
                            masterDataDao.insertMasterData(
                                MasterDataEntity(
                                    id = "user_profile_details_$uid",
                                    json = Gson().toJson(updatedMap)
                                )
                            )
                        } catch (e: Exception) {
                            android.util.Log.e("ProfileScreen", "Failed to cache birthday locally", e)
                        }
                    }
                }
            },
            onDismissRequest = { showDatePicker = false }
        )
    }
    
    // Logout Confirmation Dialog
    if (showLogoutConfirm) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirm = false },
            containerColor = cardColor,
            shape = RoundedCornerShape(24.dp),
            icon = { Icon(Icons.AutoMirrored.Outlined.Logout, null, tint = AppColors.Red) },
            title = {
                Text(
                    text = K.signOutConfirm.tr(lang),
                    style = TextStyle(fontFamily = ff, fontSize = 20.sp, fontWeight = FontWeight.Bold),
                    color = colors.textPrimary
                )
            },
            text = {
                Text(
                    text = K.signOutMessage.tr(lang),
                    style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Normal),
                    color = colors.textPrimary.copy(alpha = 0.6f)
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        handleLogout()
                        showLogoutConfirm = false
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AppColors.Red,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(50),
                    elevation = ButtonDefaults.buttonElevation(0.dp)
                ) {
                    Text(
                        text = K.signOut.tr(lang),
                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    )
                }
            },
            dismissButton = {
                FilledTonalButton(
                    onClick = { showLogoutConfirm = false },
                    colors = ButtonDefaults.filledTonalButtonColors(
                        containerColor = buttonBg,
                        contentColor = colors.textPrimary
                    ),
                    shape = RoundedCornerShape(50),
                    elevation = ButtonDefaults.buttonElevation(0.dp)
                ) {
                    Text(
                        text = K.cancel.tr(lang),
                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    )
                }
            }
        )
    }
}
