package com.elvan.rmdneram.ui.profile

import com.elvan.rmdneram.ui.home.*

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.elvan.rmdneram.ui.home.HomeViewModel
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeDimens
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope

// India-only mobile format
private fun formatMobileForDisplay(mobile: String?): String? {
    if (mobile.isNullOrBlank()) return null
    // Strip any leading "91" country code and spaces
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
    homeViewModel: HomeViewModel = viewModel()
) {
    val user = Firebase.auth.currentUser
    val colors = rememberHomeColors()
    val inputBg = if (colors.isDark) colors.textSecondary.copy(alpha = 0.15f) else colors.background
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
            userRef?.addValueEventListener(userListener!!)
            
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
            hierarchyRef?.addValueEventListener(hierarchyListener!!)
        }
        
        onDispose {
            userListener?.let { userRef?.removeEventListener(it) }
            hierarchyListener?.let { hierarchyRef?.removeEventListener(it) }
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
    
    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        contentWindowInsets = WindowInsets(0, 0, 0, 0)
    ) { _ ->
        Box(modifier = Modifier.fillMaxSize()) {
            val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
            
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = HomeDimens.ContentPadding,
                    end = HomeDimens.ContentPadding,
                    top = statusBarHeight + HomeDimens.ContentPaddingTop,
                    bottom = HomeDimens.ContentPaddingBottom
                ),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Profile Header Card (Flat design matching other pages)
                item {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth(),
                    shape = HomeShapes.Item,
                    color = colors.surface,
                    shadowElevation = 0.dp
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Avatar
                        val photoUrl = formData["photoURL"]
                        Box(
                            modifier = Modifier
                                .size(120.dp)
                                .clip(CircleShape)
                                .background(colors.accent.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
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
                                Text(
                                    text = (formData["displayName"] ?: user?.email ?: "U").take(1).uppercase(),
                                    style = MaterialTheme.typography.displayMedium,
                                    color = colors.accent
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Name
                        Text(
                            text = formData["displayName"] ?: "Your Name",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
                        )
                        
                        Spacer(modifier = Modifier.height(4.dp))
                        
                        // Email
                        Text(
                            text = user?.email ?: "",
                            style = MaterialTheme.typography.bodyMedium,
                            color = colors.textSecondary
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Sync Photo Button
                        FilledTonalButton(
                            onClick = {
                                val googleProvider = user?.providerData?.find { it.providerId == "google.com" }
                                val googlePhotoUrl = googleProvider?.photoUrl
                                
                                when {
                                    googlePhotoUrl != null -> {
                                        user?.uid?.let { uid ->
                                            Firebase.database.getReference("users/$uid/photoURL")
                                                .setValue(googlePhotoUrl.toString())
                                                .addOnSuccessListener {
                                                    scope.launch {
                                                        snackbarHostState.showSnackbar("Photo synced successfully")
                                                    }
                                                }
                                                .addOnFailureListener { e ->
                                                    scope.launch {
                                                        snackbarHostState.showSnackbar("Sync failed: ${e.message}")
                                                    }
                                                }
                                        }
                                    }
                                    googleProvider == null -> {
                                        scope.launch {
                                            snackbarHostState.showSnackbar("No Google account linked")
                                        }
                                    }
                                    else -> {
                                        scope.launch {
                                            snackbarHostState.showSnackbar("No photo found in Google account")
                                        }
                                    }
                                }
                            },
                            shape = HomeShapes.Pill,
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = colors.accent.copy(alpha = 0.15f),
                                contentColor = colors.accent
                            )
                        ) {
                            Icon(
                                Icons.Default.Sync,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Sync Google Photo")
                        }
                    }
                }
            }
            
            // Personal Information Card
            item {
                M3ProfileSection(
                    title = "Personal Information",
                    icon = Icons.Outlined.Person
                ) {
                    M3ProfileField(
                        label = "Full Name",
                        value = formData["displayName"],
                        isEditing = editingField == "name",
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
                        onCancel = { editingField = null },
                        onSave = { handleSave("name") }
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Column {
                                Text(
                                    text = "First Name",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = colors.textSecondary,
                                    modifier = Modifier.padding(start = 16.dp, bottom = 4.dp)
                                )
                                TextField(
                                    value = firstName,
                                    onValueChange = { firstName = it },
                                    placeholder = { Text("Enter first name") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = HomeShapes.Pill,
                                    singleLine = true,
                                    colors = TextFieldDefaults.colors(
                                        focusedContainerColor = inputBg,
                                        unfocusedContainerColor = inputBg,
                                        focusedIndicatorColor = Color.Transparent,
                                        unfocusedIndicatorColor = Color.Transparent
                                    )
                                )
                            }
                            Column {
                                Text(
                                    text = "Last Name",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = colors.textSecondary,
                                    modifier = Modifier.padding(start = 16.dp, bottom = 4.dp)
                                )
                                TextField(
                                    value = lastName,
                                    onValueChange = { lastName = it },
                                    placeholder = { Text("Enter last name") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = HomeShapes.Pill,
                                    singleLine = true,
                                    colors = TextFieldDefaults.colors(
                                        focusedContainerColor = inputBg,
                                        unfocusedContainerColor = inputBg,
                                        focusedIndicatorColor = Color.Transparent,
                                        unfocusedIndicatorColor = Color.Transparent
                                    )
                                )
                            }
                        }
                    }
                    
                    HorizontalDivider(color = colors.glassBorder, modifier = Modifier.padding(vertical = 8.dp))
                    
                    M3ProfileField(
                        label = "Mobile",
                        value = formatMobileForDisplay(formData["mobile"]),
                        isEditing = editingField == "mobile",
                        onEdit = { 
                            mobileNumber = extractMobileNumber(formData["mobile"])
                            editingField = "mobile" 
                        },
                        onCancel = { editingField = null },
                        onSave = { 
                            // Save only the 10-digit number
                            formData = formData + ("mobile" to mobileNumber)
                            handleSave("mobile") 
                        }
                    ) {
                        Column {
                            Text(
                                text = "Mobile Number",
                                style = MaterialTheme.typography.labelMedium,
                                color = colors.textSecondary,
                                modifier = Modifier.padding(start = 16.dp, bottom = 4.dp)
                            )
                            TextField(
                                value = mobileNumber,
                                onValueChange = { 
                                    val digits = it.filter { c -> c.isDigit() }.take(10)
                                    mobileNumber = digits
                                },
                                placeholder = { Text("10-digit number") },
                                prefix = { Text("+91 ") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = HomeShapes.Pill,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                singleLine = true,
                                colors = TextFieldDefaults.colors(
                                    focusedContainerColor = inputBg,
                                    unfocusedContainerColor = inputBg,
                                    focusedIndicatorColor = Color.Transparent,
                                    unfocusedIndicatorColor = Color.Transparent
                                )
                            )
                        }
                    }
                    
                    HorizontalDivider(color = colors.glassBorder, modifier = Modifier.padding(vertical = 8.dp))
                    
                    M3ProfileField(
                        label = "Date of Birth",
                        value = formData["birthday"]?.let { 
                            try { LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd MMM yyyy")) } 
                            catch (e: Exception) { it }
                        },
                        isEditing = editingField == "birthday",
                        onEdit = { 
                            editingField = "birthday"
                            showDatePicker = true
                        },
                        onCancel = { editingField = null },
                        onSave = { handleSave("birthday") }
                    ) {
                        Column {
                            Text(
                                text = "Date of Birth",
                                style = MaterialTheme.typography.labelMedium,
                                color = colors.textSecondary,
                                modifier = Modifier.padding(start = 16.dp, bottom = 4.dp)
                            )
                            TextField(
                                value = formData["birthday"]?.let {
                                    try { LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd MMM yyyy")) }
                                    catch (e: Exception) { it }
                                } ?: "",
                                onValueChange = {},
                                placeholder = { Text("Select date") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = HomeShapes.Pill,
                                readOnly = true,
                                trailingIcon = {
                                    IconButton(onClick = { showDatePicker = true }) {
                                        Icon(Icons.Outlined.CalendarMonth, null, tint = colors.accent)
                                    }
                                },
                                singleLine = true,
                                colors = TextFieldDefaults.colors(
                                    focusedContainerColor = inputBg,
                                    unfocusedContainerColor = inputBg,
                                    focusedIndicatorColor = Color.Transparent,
                                    unfocusedIndicatorColor = Color.Transparent
                                )
                            )
                        }
                    }
                    
                    HorizontalDivider(color = colors.glassBorder, modifier = Modifier.padding(vertical = 8.dp))
                    
                    M3ProfileField(
                        label = "Gender",
                        value = formData["gender"],
                        isEditing = editingField == "gender",
                        onEdit = { editingField = "gender" },
                        onCancel = { editingField = null },
                        onSave = { handleSave("gender") }
                    ) {
                        M3DropdownField(
                            value = formData["gender"],
                            label = "Gender",
                            enabled = true,
                            onClick = {
                                openSelector("Select Gender", listOf("Male", "Female", "Other")) {
                                    formData = formData + ("gender" to it)
                                }
                            }
                        )
                    }
                }
            }
            
            // Academic Information Card
            item {
                M3ProfileSection(
                    title = "Academic Details",
                    icon = Icons.Outlined.School
                ) {
                    M3ProfileField(
                        label = "Batch, Department & Section",
                        value = listOfNotNull(
                            formData["batch"],
                            formData["department"],
                            formData["section"]
                        ).takeIf { it.isNotEmpty() }?.joinToString(" • "),
                        isEditing = editingField == "academic",
                        onEdit = { editingField = "academic" },
                        onCancel = { editingField = null },
                        onSave = { handleSave("academic") }
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            M3DropdownField(
                                value = formData["batch"],
                                label = "Batch",
                                enabled = true,
                                onClick = {
                                    openSelector("Select Batch", getBatches()) {
                                        formData = formData + mapOf("batch" to it, "department" to "", "section" to "")
                                    }
                                }
                            )
                            M3DropdownField(
                                value = formData["department"],
                                label = "Department",
                                enabled = !formData["batch"].isNullOrEmpty(),
                                onClick = {
                                    formData["batch"]?.let { batch ->
                                        openSelector("Select Department", getDepartments(batch)) {
                                            formData = formData + mapOf("department" to it, "section" to "")
                                        }
                                    }
                                }
                            )
                            M3DropdownField(
                                value = formData["section"],
                                label = "Section",
                                enabled = !formData["department"].isNullOrEmpty(),
                                onClick = {
                                    val batch = formData["batch"] ?: return@M3DropdownField
                                    val dept = formData["department"] ?: return@M3DropdownField
                                    openSelector("Select Section", getSections(batch, dept)) {
                                        formData = formData + ("section" to it)
                                    }
                                }
                            )
                        }
                    }
                    
                    HorizontalDivider(color = colors.glassBorder, modifier = Modifier.padding(vertical = 8.dp))
                    
                    M3ProfileField(
                        label = "Register Number",
                        value = formData["registerNo"],
                        isEditing = editingField == "registerNo",
                        onEdit = { editingField = "registerNo" },
                        onCancel = { editingField = null },
                        onSave = { handleSave("registerNo") }
                    ) {
                        Column {
                            Text(
                                text = "Register Number",
                                style = MaterialTheme.typography.labelMedium,
                                color = colors.textSecondary,
                                modifier = Modifier.padding(start = 16.dp, bottom = 4.dp)
                            )
                            TextField(
                                value = formData["registerNo"] ?: "",
                                onValueChange = { formData = formData + ("registerNo" to it) },
                                placeholder = { Text("Enter register number") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = HomeShapes.Pill,
                                singleLine = true,
                                colors = TextFieldDefaults.colors(
                                    focusedContainerColor = inputBg,
                                    unfocusedContainerColor = inputBg,
                                    focusedIndicatorColor = Color.Transparent,
                                    unfocusedIndicatorColor = Color.Transparent
                                )
                            )
                        }
                    }
                }
            }
            
        }
        
        // Navigation Row (Overlay)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = colors.textPrimary
                )
            }
            
            IconButton(onClick = { showLogoutConfirm = true }) {
                Icon(
                    Icons.Outlined.Logout,
                    contentDescription = "Sign Out",
                    tint = colors.danger
                )
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
                containerColor = colors.surface,
                contentColor = colors.textPrimary,
                shape = HomeShapes.Pill
            )
        }
    }
    }
    
    // Selector Bottom Sheet
    if (showSelectorModal) {
        ModalBottomSheet(
            onDismissRequest = { showSelectorModal = false },
            shape = MaterialTheme.shapes.extraLarge,
            containerColor = colors.surface,
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
                    style = MaterialTheme.typography.titleLarge,
                    color = colors.textPrimary,
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)
                )
                
                HorizontalDivider(color = colors.glassBorder)
                
                selectorOptions.forEach { option ->
                    ListItem(
                        headlineContent = { 
                            Text(option, color = colors.textPrimary) 
                        },
                        modifier = Modifier.clickable {
                            onSelectorSelect(option)
                            showSelectorModal = false
                        },
                        trailingContent = {
                            Icon(Icons.Default.ChevronRight, null, tint = colors.accent)
                        },
                        colors = ListItemDefaults.colors(
                            containerColor = Color.Transparent
                        )
                    )
                }
            }
        }
    }
    
    // Date Picker
    if (showDatePicker) {
        val config = androidx.compose.ui.platform.LocalConfiguration.current
        val isLandscape = config.orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = formData["birthday"]?.let {
                try { 
                    LocalDate.parse(it).atStartOfDay(java.time.ZoneOffset.UTC)
                        .toInstant().toEpochMilli()
                } catch (e: Exception) { null }
            },
            initialDisplayMode = if (isLandscape) DisplayMode.Input else DisplayMode.Picker
        )
        
        // Force correct mode when orientation changes while picker is open
        LaunchedEffect(isLandscape) {
            datePickerState.displayMode = if (isLandscape) DisplayMode.Input else DisplayMode.Picker
        }
        
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = HomeDimens.SpacingMd, end = HomeDimens.SpacingMd, bottom = HomeDimens.SpacingMd),
                    horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingMd)
                ) {
                    Button(
                        onClick = { showDatePicker = false },
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.subtleBackground,
                            contentColor = colors.textSecondary
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel", style = HomeTypography.PillButton)
                    }
                    Button(
                        onClick = {
                            datePickerState.selectedDateMillis?.let { millis ->
                                val date = java.time.Instant.ofEpochMilli(millis)
                                    .atZone(java.time.ZoneOffset.UTC)
                                    .toLocalDate()
                                formData = formData + ("birthday" to date.toString())
                            }
                            showDatePicker = false
                        },
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.accent,
                            contentColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("OK", style = HomeTypography.PillButton)
                    }
                }
            },
            dismissButton = null,
            colors = DatePickerDefaults.colors(
                containerColor = colors.surface,
                titleContentColor = colors.textPrimary,
                headlineContentColor = colors.textPrimary,
                weekdayContentColor = colors.textSecondary,
                subheadContentColor = colors.textSecondary,
                navigationContentColor = colors.accent,
                yearContentColor = colors.textPrimary,
                currentYearContentColor = colors.accent,
                selectedYearContentColor = colors.textPrimary,
                selectedYearContainerColor = colors.accent,
                dayContentColor = colors.textPrimary,
                selectedDayContentColor = colors.textPrimary,
                selectedDayContainerColor = colors.accent,
                todayContentColor = colors.accent,
                todayDateBorderColor = colors.accent
            )
        ) {
            DatePicker(
                state = datePickerState,
                showModeToggle = false,
                colors = DatePickerDefaults.colors(
                    containerColor = colors.surface,
                    titleContentColor = colors.textPrimary,
                    headlineContentColor = colors.textPrimary,
                    weekdayContentColor = colors.textSecondary,
                    subheadContentColor = colors.textSecondary,
                    navigationContentColor = colors.accent,
                    yearContentColor = colors.textPrimary,
                    currentYearContentColor = colors.accent,
                    selectedYearContentColor = colors.textPrimary,
                    selectedYearContainerColor = colors.accent,
                    dayContentColor = colors.textPrimary,
                    selectedDayContentColor = colors.textPrimary,
                    selectedDayContainerColor = colors.accent,
                    todayContentColor = colors.accent,
                    todayDateBorderColor = colors.accent
                )
            )
        }
    }
    
    // Logout Confirmation
    if (showLogoutConfirm) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirm = false },
            icon = { Icon(Icons.Outlined.Logout, null, tint = MaterialTheme.colorScheme.error) },
            title = { Text("Sign Out") },
            text = { Text("Are you sure you want to sign out of your account?") },
            confirmButton = {
                Button(
                    onClick = {
                        handleLogout()
                        showLogoutConfirm = false
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Sign Out")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showLogoutConfirm = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

// ==================== M3 COMPONENTS ====================

@Composable
private fun M3ProfileSection(
    title: String,
    icon: ImageVector,
    colors: com.elvan.rmdneram.ui.home.HomeColors = rememberHomeColors(),
    content: @Composable ColumnScope.() -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth(),
        shape = HomeShapes.Item,
        color = colors.surface,
        shadowElevation = 0.dp
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                // Icon in blue circle
                Surface(
                    shape = CircleShape,
                    color = colors.accent,
                    modifier = Modifier.size(40.dp)
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Icon(
                            icon,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary
                )
            }
            content()
        }
    }
}

@Composable
private fun M3ProfileField(
    label: String,
    value: String?,
    isEditing: Boolean,
    onEdit: () -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit,
    colors: com.elvan.rmdneram.ui.home.HomeColors = rememberHomeColors(),
    editContent: @Composable () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        AnimatedVisibility(
            visible = !isEditing,
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            ListItem(
                headlineContent = {
                    Text(
                        text = value ?: "Not set",
                        color = if (value != null) 
                            MaterialTheme.colorScheme.onSurface 
                        else 
                            MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                overlineContent = {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelMedium
                    )
                },
                trailingContent = {
                    FilledTonalIconButton(
                        onClick = onEdit,
                        modifier = Modifier.size(40.dp),
                        colors = IconButtonDefaults.filledTonalIconButtonColors(
                            containerColor = colors.subtleBackground,
                            contentColor = colors.textSecondary
                        )
                    ) {
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = "Edit",
                            modifier = Modifier.size(20.dp)
                        )
                    }
                },
                colors = ListItemDefaults.colors(
                    containerColor = Color.Transparent
                )
            )
        }
        
        AnimatedVisibility(
            visible = isEditing,
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                // No title label when editing
                
                editContent()
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    OutlinedButton(
                        onClick = onCancel,
                        shape = HomeShapes.Pill
                    ) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Button(
                        onClick = onSave,
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.accent
                        )
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
}

@Composable
private fun M3DropdownField(
    value: String?,
    label: String,
    enabled: Boolean,
    onClick: () -> Unit,
    colors: com.elvan.rmdneram.ui.home.HomeColors = rememberHomeColors()
) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = colors.textSecondary,
            modifier = Modifier.padding(start = 16.dp, bottom = 4.dp)
        )
        TextField(
            value = value ?: "",
            onValueChange = {},
            placeholder = { Text("Select $label") },
            modifier = Modifier
                .fillMaxWidth()
                .clickable(enabled = enabled) { onClick() },
            shape = HomeShapes.Pill,
            readOnly = true,
            enabled = enabled,
            trailingIcon = {
                IconButton(onClick = onClick, enabled = enabled) {
                    Icon(Icons.Default.ArrowDropDown, null, tint = if (enabled) colors.accent else colors.textSecondary)
                }
            },
            singleLine = true,
            colors = TextFieldDefaults.colors(
                focusedContainerColor = if (colors.isDark) colors.textSecondary.copy(alpha = 0.15f) else colors.background,
                unfocusedContainerColor = if (colors.isDark) colors.textSecondary.copy(alpha = 0.15f) else colors.background,
                disabledContainerColor = (if (colors.isDark) colors.textSecondary.copy(alpha = 0.15f) else colors.background).copy(alpha = 0.5f),
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                disabledIndicatorColor = Color.Transparent
            )
        )
    }
}
