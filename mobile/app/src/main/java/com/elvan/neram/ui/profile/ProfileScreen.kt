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
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.theme.AppColors
import com.elvan.neram.ui.theme.AppStrings
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.launch

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
    val colors = rememberHomeColors()
    val isDark = colors.isDark
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    
    // State
    var formData by remember { mutableStateOf(mapOf<String, String>()) }
    var editingField by remember { mutableStateOf<String?>(null) }
    var hierarchy by remember { mutableStateOf<Map<String, Map<String, List<String>>>>(emptyMap()) }
    
    // Modals
    var showSelectorModal by remember { mutableStateOf(false) }
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
    
    // Load user data
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
                        formData = data
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
                        hierarchy = result
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
    
    fun openSelector(title: String, options: List<String>, onSelect: (String) -> Unit) {
        selectorTitle = title
        selectorOptions = options
        onSelectorSelect = onSelect
        showSelectorModal = true
    }
    
    fun handleSave(field: String) {
        user?.uid?.let { uid ->
            val updates = when (field) {
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
                else -> mapOf(field to (formData[field] ?: ""))
            }
            Firebase.database.getReference("users/$uid").updateChildren(updates)
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
                                        contentDescription = "Profile Photo",
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
                                text = formData["displayName"] ?: (if (lang == AppStrings.TAMIL) "உங்கள் பெயர்" else "Your Name"),
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
                                                Firebase.database.getReference("users/$uid/photoURL")
                                                    .setValue(googlePhotoUrl.toString())
                                                    .addOnSuccessListener {
                                                        scope.launch {
                                                            snackbarHostState.showSnackbar(
                                                                if (lang == AppStrings.TAMIL) "படம் வெற்றிகரமாக ஒத்திசைக்கப்பட்டது" else "Photo synced successfully"
                                                            )
                                                        }
                                                    }
                                                    .addOnFailureListener { e ->
                                                        scope.launch {
                                                            snackbarHostState.showSnackbar(
                                                                (if (lang == AppStrings.TAMIL) "ஒத்திசைவு தோல்வி: " else "Sync failed: ") + (e.message ?: "")
                                                            )
                                                        }
                                                    }
                                            }
                                        }
                                        googleProvider == null -> {
                                            scope.launch {
                                                snackbarHostState.showSnackbar(
                                                    if (lang == AppStrings.TAMIL) "Google கணக்கு இணைக்கப்படவில்லை" else "No Google account linked"
                                                )
                                            }
                                        }
                                        else -> {
                                            scope.launch {
                                                snackbarHostState.showSnackbar(
                                                    if (lang == AppStrings.TAMIL) "Google கணக்கில் புகைப்படம் இல்லை" else "No photo found in Google account"
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
                                    text = if (lang == AppStrings.TAMIL) "Google படத்தை ஒத்திசை" else "Sync Google Photo",
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
                        title = if (lang == AppStrings.TAMIL) "தனிப்பட்ட விவரங்கள்" else "Personal Information",
                        colors = colors
                    ) {
                        // Full Name Row
                        ElvanSettingsAnimatedExpand(
                            isEditing = editingField == "name",
                            displayContent = {
                                ElvanSettingsDisplayRow(
                                    title = if (lang == AppStrings.TAMIL) "முழுப் பெயர்" else "Full Name",
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
                                    title = if (lang == AppStrings.TAMIL) "பெயரைத் திருத்து" else "Edit Name",
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("name") },
                                    cancelText = if (lang == AppStrings.TAMIL) "கைவிடு" else "Cancel",
                                    saveText = if (lang == AppStrings.TAMIL) "சேமி" else "Save",
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = if (lang == AppStrings.TAMIL) "முதல் பெயர்" else "First Name",
                                        value = firstName,
                                        onValueChange = { firstName = it },
                                        placeholder = if (lang == AppStrings.TAMIL) "முதல் பெயரை உள்ளிடவும்" else "Enter first name",
                                        colors = colors
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    ElvanSettingsTextField(
                                        label = if (lang == AppStrings.TAMIL) "கடைசி பெயர்" else "Last Name",
                                        value = lastName,
                                        onValueChange = { lastName = it },
                                        placeholder = if (lang == AppStrings.TAMIL) "கடைசி பெயரை உள்ளிடவும்" else "Enter last name",
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
                                    title = if (lang == AppStrings.TAMIL) "கைபேசி எண்" else "Mobile Number",
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
                                    title = if (lang == AppStrings.TAMIL) "கைபேசி எண்ணைத் திருத்து" else "Edit Mobile Number",
                                    onCancel = { editingField = null },
                                    onSave = {
                                        formData = formData + ("mobile" to mobileNumber)
                                        handleSave("mobile")
                                    },
                                    cancelText = if (lang == AppStrings.TAMIL) "கைவிடு" else "Cancel",
                                    saveText = if (lang == AppStrings.TAMIL) "சேமி" else "Save",
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = if (lang == AppStrings.TAMIL) "கைபேசி எண்" else "Mobile Number",
                                        value = mobileNumber,
                                        onValueChange = {
                                            mobileNumber = it.filter { c -> c.isDigit() }.take(10)
                                        },
                                        placeholder = if (lang == AppStrings.TAMIL) "10-இலக்க எண்" else "10-digit number",
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
                                    title = if (lang == AppStrings.TAMIL) "பிறந்த தேதி" else "Date of Birth",
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
                                    title = if (lang == AppStrings.TAMIL) "பிறந்த தேதியைத் திருத்து" else "Edit Date of Birth",
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("birthday") },
                                    cancelText = if (lang == AppStrings.TAMIL) "கைவிடு" else "Cancel",
                                    saveText = if (lang == AppStrings.TAMIL) "சேமி" else "Save",
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = if (lang == AppStrings.TAMIL) "பிறந்த தேதி" else "Date of Birth",
                                        value = formattedBirthday ?: "",
                                        onValueChange = {},
                                        placeholder = if (lang == AppStrings.TAMIL) "தேதியைத் தேர்ந்தெடுக்கவும்" else "Select date",
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
                                ElvanSettingsDisplayRow(
                                    title = if (lang == AppStrings.TAMIL) "பாலினம்" else "Gender",
                                    primaryValue = formData["gender"] ?: "",
                                    onEdit = { editingField = "gender" },
                                    colors = colors
                                )
                            },
                            editContent = {
                                ElvanSettingsEditContainer(
                                    title = if (lang == AppStrings.TAMIL) "பாலினத்தைத் தேர்ந்தெடுக்கவும்" else "Select Gender",
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("gender") },
                                    cancelText = if (lang == AppStrings.TAMIL) "கைவிடு" else "Cancel",
                                    saveText = if (lang == AppStrings.TAMIL) "சேமி" else "Save",
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = if (lang == AppStrings.TAMIL) "பாலினம்" else "Gender",
                                        value = formData["gender"] ?: "",
                                        onValueChange = {},
                                        placeholder = if (lang == AppStrings.TAMIL) "பாலினத்தைத் தேர்ந்தெடுக்கவும்" else "Select Gender",
                                        readOnly = true,
                                        onClick = {
                                            openSelector(
                                                if (lang == AppStrings.TAMIL) "பாலினத்தைத் தேர்ந்தெடுக்கவும்" else "Select Gender",
                                                listOf("Male", "Female", "Other")
                                            ) {
                                                formData = formData + ("gender" to it)
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
                        title = if (lang == AppStrings.TAMIL) "கல்வி விவரங்கள்" else "Academic Details",
                        colors = colors
                    ) {
                        // Academic Enrollment (Batch, Dept, Section)
                        ElvanSettingsAnimatedExpand(
                            isEditing = editingField == "academic",
                            displayContent = {
                                ElvanSettingsDisplayRow(
                                    title = if (lang == AppStrings.TAMIL) "தொகுதி, துறை & பிரிவு" else "Batch, Department & Section",
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
                                    title = if (lang == AppStrings.TAMIL) "கல்வி விவரங்களைத் திருத்து" else "Edit Academic Details",
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("academic") },
                                    cancelText = if (lang == AppStrings.TAMIL) "கைவிடு" else "Cancel",
                                    saveText = if (lang == AppStrings.TAMIL) "சேமி" else "Save",
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = if (lang == AppStrings.TAMIL) "தொகுதி" else "Batch",
                                        value = formData["batch"] ?: "",
                                        onValueChange = {},
                                        placeholder = if (lang == AppStrings.TAMIL) "தொகுதியைத் தேர்ந்தெடுக்கவும்" else "Select Batch",
                                        readOnly = true,
                                        onClick = {
                                            openSelector(
                                                if (lang == AppStrings.TAMIL) "தொகுதியைத் தேர்ந்தெடுக்கவும்" else "Select Batch",
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
                                        label = if (lang == AppStrings.TAMIL) "துறை" else "Department",
                                        value = formData["department"] ?: "",
                                        onValueChange = {},
                                        placeholder = if (lang == AppStrings.TAMIL) "துறையைத் தேர்ந்தெடுக்கவும்" else "Select Department",
                                        readOnly = true,
                                        onClick = {
                                            formData["batch"]?.let { batch ->
                                                openSelector(
                                                    if (lang == AppStrings.TAMIL) "துறையைத் தேர்ந்தெடுக்கவும்" else "Select Department",
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
                                        label = if (lang == AppStrings.TAMIL) "பிரிவு" else "Section",
                                        value = formData["section"] ?: "",
                                        onValueChange = {},
                                        placeholder = if (lang == AppStrings.TAMIL) "பிரிவைத் தேர்ந்தெடுக்கவும்" else "Select Section",
                                        readOnly = true,
                                        onClick = {
                                            val batch = formData["batch"] ?: return@ElvanSettingsTextField
                                            val dept = formData["department"] ?: return@ElvanSettingsTextField
                                            openSelector(
                                                if (lang == AppStrings.TAMIL) "பிரிவைத் தேர்ந்தெடுக்கவும்" else "Select Section",
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
                                    title = if (lang == AppStrings.TAMIL) "பதிவு எண்" else "Register Number",
                                    primaryValue = formData["registerNo"] ?: "",
                                    onEdit = { editingField = "registerNo" },
                                    colors = colors
                                )
                            },
                            editContent = {
                                ElvanSettingsEditContainer(
                                    title = if (lang == AppStrings.TAMIL) "பதிவு எண்ணைத் திருத்து" else "Edit Register Number",
                                    onCancel = { editingField = null },
                                    onSave = { handleSave("registerNo") },
                                    cancelText = if (lang == AppStrings.TAMIL) "கைவிடு" else "Cancel",
                                    saveText = if (lang == AppStrings.TAMIL) "சேமி" else "Save",
                                    colors = colors
                                ) {
                                    ElvanSettingsTextField(
                                        label = if (lang == AppStrings.TAMIL) "பதிவு எண்" else "Register Number",
                                        value = formData["registerNo"] ?: "",
                                        onValueChange = { formData = formData + ("registerNo" to it) },
                                        placeholder = if (lang == AppStrings.TAMIL) "பதிவு எண்ணை உள்ளிடவும்" else "Enter register number",
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
                    val isOptionSelected = when (selectorTitle) {
                        "Select Gender", "பாலினத்தைத் தேர்ந்தெடுக்கவும்" -> formData["gender"] == option
                        "Select Batch", "தொகுதியைத் தேர்ந்தெடுக்கவும்" -> formData["batch"] == option
                        "Select Department", "துறையைத் தேர்ந்தெடுக்கவும்" -> formData["department"] == option
                        "Select Section", "பிரிவைத் தேர்ந்தெடுக்கவும்" -> formData["section"] == option
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
        val config = LocalConfiguration.current
        val isLandscape = config.orientation == Configuration.ORIENTATION_LANDSCAPE
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = formData["birthday"]?.let {
                try { 
                    LocalDate.parse(it).atStartOfDay(ZoneOffset.UTC)
                        .toInstant().toEpochMilli()
                } catch (e: Exception) { null }
            },
            initialDisplayMode = if (isLandscape) DisplayMode.Input else DisplayMode.Picker
        )
        
        LaunchedEffect(isLandscape) {
            datePickerState.displayMode = if (isLandscape) DisplayMode.Input else DisplayMode.Picker
        }
        
        val dialogBgColor = if (isDark) Color(0xFF1E1E1E) else Color.White

        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { showDatePicker = false },
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = buttonBg,
                            contentColor = colors.textPrimary
                        ),
                        elevation = ButtonDefaults.buttonElevation(0.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = if (lang == AppStrings.TAMIL) "கைவிடு" else "Cancel",
                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                        )
                    }
                    Button(
                        onClick = {
                            datePickerState.selectedDateMillis?.let { millis ->
                                val date = Instant.ofEpochMilli(millis)
                                    .atZone(ZoneOffset.UTC)
                                    .toLocalDate()
                                formData = formData + ("birthday" to date.toString())
                            }
                            showDatePicker = false
                        },
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.accent,
                            contentColor = Color.White
                        ),
                        elevation = ButtonDefaults.buttonElevation(0.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = if (lang == AppStrings.TAMIL) "சரி" else "OK",
                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        )
                    }
                }
            },
            dismissButton = null,
            colors = DatePickerDefaults.colors(
                containerColor = dialogBgColor,
                titleContentColor = colors.textPrimary,
                headlineContentColor = colors.textPrimary,
                weekdayContentColor = colors.textPrimary.copy(alpha = 0.5f),
                subheadContentColor = colors.textPrimary.copy(alpha = 0.5f),
                navigationContentColor = colors.textPrimary,
                yearContentColor = colors.textPrimary,
                currentYearContentColor = colors.textPrimary,
                selectedYearContentColor = if (isDark) Color(0xFF111111) else Color.White,
                selectedYearContainerColor = colors.textPrimary,
                dayContentColor = colors.textPrimary,
                selectedDayContentColor = if (isDark) Color(0xFF111111) else Color.White,
                selectedDayContainerColor = colors.textPrimary,
                todayContentColor = colors.textPrimary,
                todayDateBorderColor = colors.textPrimary
            )
        ) {
            DatePicker(
                state = datePickerState,
                showModeToggle = false,
                colors = DatePickerDefaults.colors(
                    containerColor = dialogBgColor,
                    titleContentColor = colors.textPrimary,
                    headlineContentColor = colors.textPrimary,
                    weekdayContentColor = colors.textPrimary.copy(alpha = 0.5f),
                    subheadContentColor = colors.textPrimary.copy(alpha = 0.5f),
                    navigationContentColor = colors.textPrimary,
                    yearContentColor = colors.textPrimary,
                    currentYearContentColor = colors.textPrimary,
                    selectedYearContentColor = if (isDark) Color(0xFF111111) else Color.White,
                    selectedYearContainerColor = colors.textPrimary,
                    dayContentColor = colors.textPrimary,
                    selectedDayContentColor = if (isDark) Color(0xFF111111) else Color.White,
                    selectedDayContainerColor = colors.textPrimary,
                    todayContentColor = colors.textPrimary,
                    todayDateBorderColor = colors.textPrimary
                )
            )
        }
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
                    text = AppStrings.Settings.signOutConfirm(lang),
                    style = TextStyle(fontFamily = ff, fontSize = 20.sp, fontWeight = FontWeight.Bold),
                    color = colors.textPrimary
                )
            },
            text = {
                Text(
                    text = AppStrings.Settings.signOutMessage(lang),
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
                        text = AppStrings.Settings.signOut(lang),
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
                        text = AppStrings.Home.cancel(lang),
                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    )
                }
            }
        )
    }
}
