package com.elvan.rmdneram.ui.profile

import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.elvan.rmdneram.ui.home.HomeViewModel
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.elvan.rmdneram.ui.home.HomeTypography
import com.elvan.rmdneram.ui.home.HomeShapes
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import java.time.LocalDate
import java.time.format.DateTimeFormatter

// Country codes for mobile input
private val COUNTRY_CODES = listOf(
    "+91" to "India",
    "+1" to "USA",
    "+44" to "UK",
    "+971" to "UAE",
    "+65" to "Singapore"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBack: () -> Unit = {},
    homeViewModel: HomeViewModel = viewModel()
) {
    val isEditable = true // Always Editable in Settings

    val context = LocalContext.current
    val colors = rememberHomeColors()
    val uiState by homeViewModel.uiState.collectAsState()
    val user = Firebase.auth.currentUser
    
    // State
    // State
    // activeTab and directoryPath removed
    
    // Back Handler
    // Removed directory back handling
    var formData by remember { mutableStateOf(mapOf<String, String>()) }
    var originalData by remember { mutableStateOf(mapOf<String, String>()) }
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
    var countryCode by remember { mutableStateOf("+91") }
    
    // Load user data and hierarchy - Use DisposableEffect to clean up listeners
    DisposableEffect(user?.uid) {
        var userListener: ValueEventListener? = null
        var hierarchyListener: ValueEventListener? = null
        var userRef: com.google.firebase.database.DatabaseReference? = null
        var hierarchyRef: com.google.firebase.database.DatabaseReference? = null
        
        user?.uid?.let { uid ->
            // Load user profile
            userRef = Firebase.database.getReference("users/$uid")
            userListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    try {
                        val data = mutableMapOf<String, String>()
                        snapshot.children.forEach { child ->
                            // Handle any value type by converting to String
                            val value = child.value?.toString()
                            val key = child.key
                            if (key != null && value != null) {
                                data[key] = value
                            }
                        }
                        formData = data
                        originalData = data
                    } catch (e: Exception) {
                        android.util.Log.e("ProfileScreen", "Error parsing user data", e)
                    }
                }
                override fun onCancelled(error: DatabaseError) {
                    android.util.Log.e("ProfileScreen", "User data load cancelled", error.toException())
                }
            }
            userRef?.addValueEventListener(userListener!!)
            
            // Load hierarchy
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
                    } catch (e: Exception) {
                        android.util.Log.e("ProfileScreen", "Error parsing hierarchy", e)
                    }
                }
                override fun onCancelled(error: DatabaseError) {
                    android.util.Log.e("ProfileScreen", "Hierarchy load cancelled", error.toException())
                }
            }
            hierarchyRef?.addValueEventListener(hierarchyListener!!)
        }
        
        onDispose {
            // Clean up listeners when composable leaves composition
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
    
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    
    // Main UI with One UI-style collapsing toolbar
    // Main UI - Standard Material 3 Design
    Scaffold(
        modifier = Modifier.fillMaxSize(), // Removed nestedScroll connection
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = {
                     Text(
                        "Profile",
                        style = HomeTypography.PageTitle.copy(fontSize = 20.sp),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = MaterialTheme.colorScheme.onSurface)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colors.background,
                    scrolledContainerColor = colors.background,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                ),
                scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.background)
                .padding(paddingValues),
            contentPadding = PaddingValues(bottom = 120.dp)
        ) {
        
        // Tab Switcher Removed
        
        // Profile Content
        if (true) {
            // Avatar Section
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Avatar
                    val photoUrl = formData["photoURL"]
                    if (!photoUrl.isNullOrEmpty()) {
                        AsyncImage(
                            model = ImageRequest.Builder(LocalContext.current)
                                .data(photoUrl)
                                .crossfade(true)
                                .build(),
                            contentDescription = "Profile Photo",
                            modifier = Modifier
                                .size(100.dp)
                                .clip(CircleShape)
                                .border(2.dp, colors.glassBorder, CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(100.dp)
                                .clip(CircleShape)
                                .background(colors.subtleBackground),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = (formData["displayName"] ?: user?.email ?: "U").take(1).uppercase(),
                                fontSize = 36.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.accent
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Sync Google Photo Button
                    Row(
                        modifier = Modifier
                            .clip(HomeShapes.Pill)
                            .background(colors.surface)
                            // .border(1.dp, colors.glassBorder, HomeShapes.Pill) // Removed for Flat Design
                            .clickable {
                                // Sync photo from Google
                                user?.providerData?.find { it.providerId == "google.com" }?.photoUrl?.let { url ->
                                    user.uid.let { uid ->
                                        Firebase.database.getReference("users/$uid/photoURL").setValue(url.toString())
                                    }
                                }
                            }
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.Refresh,
                            null,
                            tint = colors.textPrimary,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            "Sync Google Photo",
                            style = HomeTypography.PillTime,
                            color = colors.textPrimary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))
            }
            
            // Profile Fields
            item {
                Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                    // Name
                    ProfileRowCard(
                        readOnly = !isEditable,
                        label = "Name",
                        icon = Icons.Outlined.Person,
                        value = formData["displayName"],
                        isEditing = editingField == "name",
                        colors = colors,
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
                        onSave = { handleSave("name") },
                        editContent = {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                ProfileTextField(
                                    value = firstName,
                                    onValueChange = { firstName = it },
                                    placeholder = "First Name",
                                    colors = colors,
                                    modifier = Modifier.weight(1f)
                                )
                                ProfileTextField(
                                    value = lastName,
                                    onValueChange = { lastName = it },
                                    placeholder = "Last Name",
                                    colors = colors,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    )
                    
                    // Mobile
                    ProfileRowCard(
                        readOnly = !isEditable,
                        label = "Mobile",
                        icon = Icons.Outlined.Phone,
                        value = formData["mobile"]?.let { "$countryCode $it" },
                        isEditing = editingField == "mobile",
                        colors = colors,
                        onEdit = { editingField = "mobile" },
                        onCancel = { editingField = null },
                        onSave = { handleSave("mobile") },
                        editContent = {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                // Country Code Selector
                                Box(
                                    modifier = Modifier
                                        .width(80.dp)
                                        .height(48.dp)
                                        .clip(HomeShapes.Item)
                                        .background(colors.inputBackground)
                                        // .border(1.dp, colors.glassBorder, RoundedCornerShape(12.dp))
                                        .clickable {
                                            openSelector("Select Country", COUNTRY_CODES.map { it.first }) {
                                                countryCode = it
                                            }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Text(countryCode, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                                        Icon(Icons.Default.KeyboardArrowDown, null, Modifier.size(14.dp), tint = colors.textSecondary)
                                    }
                                }
                                
                                ProfileTextField(
                                    value = formData["mobile"] ?: "",
                                    onValueChange = { formData = formData + ("mobile" to it) },
                                    placeholder = "Mobile Number",
                                    colors = colors,
                                    keyboardType = KeyboardType.Phone,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    )
                    
                    // Academic Details
                    ProfileRowCard(
                        readOnly = !isEditable,
                        label = "Academic Details",
                        icon = Icons.Outlined.School,
                        value = listOfNotNull(
                            formData["batch"],
                            formData["department"],
                            formData["section"]
                        ).takeIf { it.isNotEmpty() }?.joinToString(" | "),
                        isEditing = editingField == "academic",
                        colors = colors,
                        onEdit = { editingField = "academic" },
                        onCancel = { editingField = null },
                        onSave = { handleSave("academic") },
                        editContent = {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                // Batch
                                SelectorButton(
                                    value = formData["batch"],
                                    placeholder = "Select Batch",
                                    colors = colors,
                                    enabled = true,
                                    onClick = {
                                        openSelector("Select Batch", getBatches()) { 
                                            formData = formData + mapOf("batch" to it, "department" to "", "section" to "")
                                        }
                                    }
                                )
                                
                                // Department
                                SelectorButton(
                                    value = formData["department"],
                                    placeholder = "Select Department",
                                    colors = colors,
                                    enabled = !formData["batch"].isNullOrEmpty(),
                                    onClick = {
                                        formData["batch"]?.let { batch ->
                                            openSelector("Select Department", getDepartments(batch)) {
                                                formData = formData + mapOf("department" to it, "section" to "")
                                            }
                                        }
                                    }
                                )
                                
                                // Section
                                SelectorButton(
                                    value = formData["section"],
                                    placeholder = "Select Section",
                                    colors = colors,
                                    enabled = !formData["department"].isNullOrEmpty(),
                                    onClick = {
                                        val batch = formData["batch"] ?: return@SelectorButton
                                        val dept = formData["department"] ?: return@SelectorButton
                                        openSelector("Select Section", getSections(batch, dept)) {
                                            formData = formData + ("section" to it)
                                        }
                                    }
                                )
                            }
                        }
                    )
                    
                    // Register Number
                    ProfileRowCard(
                        readOnly = !isEditable,
                        label = "Register No",
                        icon = Icons.Outlined.Numbers,
                        value = formData["registerNo"],
                        isEditing = editingField == "registerNo",
                        colors = colors,
                        onEdit = { editingField = "registerNo" },
                        onCancel = { editingField = null },
                        onSave = { handleSave("registerNo") },
                        editContent = {
                            ProfileTextField(
                                value = formData["registerNo"] ?: "",
                                onValueChange = { formData = formData + ("registerNo" to it) },
                                placeholder = "Register Number",
                                colors = colors
                            )
                        }
                    )
                    
                    // Date of Birth
                    ProfileRowCard(
                        readOnly = !isEditable,
                        label = "Date of Birth",
                        icon = Icons.Outlined.CalendarMonth,
                        value = formData["birthday"]?.let { 
                            try { 
                                LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd MMM yyyy")) 
                            } catch (e: Exception) { it }
                        },
                        isEditing = editingField == "birthday",
                        colors = colors,
                        onEdit = { 
                            editingField = "birthday"
                            showDatePicker = true
                        },
                        onCancel = { editingField = null },
                        onSave = { handleSave("birthday") },
                        editContent = {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                                    .clip(HomeShapes.Item)
                                    .background(colors.inputBackground)
                                    .border(1.dp, colors.glassBorder, HomeShapes.Item)
                                    .clickable { showDatePicker = true },
                                contentAlignment = Alignment.CenterStart
                            ) {
                                Text(
                                    text = formData["birthday"]?.let {
                                        try { LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd MMM yyyy")) }
                                        catch (e: Exception) { it }
                                    } ?: "Select Date",
                                    modifier = Modifier.padding(horizontal = 16.dp),
                                    color = if (formData["birthday"] != null) colors.textPrimary else colors.placeholder,
                                    style = HomeTypography.PillTime
                                )
                            }
                        }
                    )
                    
                    // Gender
                    ProfileRowCard(
                        readOnly = !isEditable,
                        label = "Gender",
                        icon = Icons.Outlined.People,
                        value = formData["gender"],
                        isEditing = editingField == "gender",
                        colors = colors,
                        onEdit = { editingField = "gender" },
                        onCancel = { editingField = null },
                        onSave = { handleSave("gender") },
                        editContent = {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                listOf("Male", "Female", "Other").forEach { option ->
                                    val isSelected = formData["gender"] == option
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(48.dp)
                                            .clip(HomeShapes.Item)
                                            .background(if (isSelected) colors.accent else colors.inputBackground)
                                            .border(
                                                1.dp,
                                                if (isSelected) colors.accent else colors.glassBorder,
                                                HomeShapes.Item
                                            )
                                            .clickable { formData = formData + ("gender" to option) },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            option,
                                            color = if (isSelected) Color.White else colors.textPrimary,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    )
                    
                    // LinkedIn
                    ProfileRowCard(
                        readOnly = !isEditable,
                        label = "LinkedIn",
                        icon = Icons.Default.Link,
                        value = formData["linkedin"],
                        isEditing = editingField == "linkedin",
                        colors = colors,
                        onEdit = { editingField = "linkedin" },
                        onCancel = { editingField = null },
                        onSave = { handleSave("linkedin") },
                        editContent = {
                            ProfileTextField(
                                value = formData["linkedin"] ?: "",
                                onValueChange = { formData = formData + ("linkedin" to it) },
                                placeholder = "https://linkedin.com/in/...",
                                colors = colors
                            )
                        }
                    )
                    
                    // GitHub
                    ProfileRowCard(
                        readOnly = !isEditable,
                        label = "GitHub",
                        icon = Icons.Default.Code,
                        value = formData["github"],
                        isEditing = editingField == "github",
                        colors = colors,
                        onEdit = { editingField = "github" },
                        onCancel = { editingField = null },
                        onSave = { handleSave("github") },
                        editContent = {
                            ProfileTextField(
                                value = formData["github"] ?: "",
                                onValueChange = { formData = formData + ("github" to it) },
                                placeholder = "https://github.com/...",
                                colors = colors
                            )
                        }
                    )
                }
            }
            
            // Go to Settings Button Removed

            // Sign Out Button
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 24.dp)
                        .clip(HomeShapes.Item)
                        .background(colors.danger.copy(alpha = 0.1f))
                        // .border(1.dp, colors.danger.copy(alpha = 0.2f), HomeShapes.Item) // Removed for Flat Design
                        .clickable { showLogoutConfirm = true }
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "Sign Out",
                        color = colors.danger,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }
            
            // Version
            item {
                Text(
                    text = "Neram v2.0.0 (Native)",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 40.dp),
                    textAlign = TextAlign.Center,
                    color = colors.textSecondary,
                    fontSize = 12.sp
                )
            }
        }
        }
    } // End of Scaffold
    
    // Selector Modal
    if (showSelectorModal) {
        Dialog(onDismissRequest = { showSelectorModal = false }) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(HomeShapes.Item)
                    .background(colors.surface)
                    .padding(vertical = 20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        selectorTitle,
                        style = HomeTypography.ExamTitle,
                        color = colors.textPrimary
                    )
                    Text(
                        "Close",
                        color = colors.textSecondary,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable { showSelectorModal = false }
                    )
                }
                
                Divider(color = colors.glassBorder, modifier = Modifier.padding(vertical = 12.dp))
                
                // Options
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 300.dp)
                ) {
                    items(selectorOptions) { option ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    onSelectorSelect(option)
                                    showSelectorModal = false
                                }
                                .padding(horizontal = 20.dp, vertical = 16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                option,
                                color = colors.textPrimary,
                                style = HomeTypography.PillTitle
                            )
                            Icon(
                                Icons.Default.ChevronRight,
                                null,
                                tint = colors.glassBorder,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Divider(color = colors.glassBorder.copy(alpha = 0.5f))
                    }
                }
            }
        }
    }
    
    // Date Picker Dialog
    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = formData["birthday"]?.let {
                try { 
                    LocalDate.parse(it).atStartOfDay(java.time.ZoneId.systemDefault())
                        .toInstant().toEpochMilli()
                } catch (e: Exception) { null }
            }
        )
        
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                Button(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            val date = java.time.Instant.ofEpochMilli(millis)
                                .atZone(java.time.ZoneId.systemDefault())
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
                    modifier = Modifier.padding(end = 8.dp, bottom = 8.dp)
                ) {
                    Text("OK", style = HomeTypography.StatusBadge)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showDatePicker = false },
                    shape = HomeShapes.Pill,
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = colors.textSecondary
                    ),
                    modifier = Modifier.padding(bottom = 8.dp)
                ) {
                    Text("Cancel", style = HomeTypography.StatusBadge)
                }
            },
            colors = DatePickerDefaults.colors(
                containerColor = colors.surface,
            )
        ) {
            DatePicker(
                state = datePickerState,
                colors = DatePickerDefaults.colors(
                    containerColor = colors.surface,
                    titleContentColor = colors.textPrimary,
                    headlineContentColor = colors.textPrimary,
                    weekdayContentColor = colors.textSecondary,
                    subheadContentColor = colors.textSecondary,
                    yearContentColor = colors.textSecondary,
                    currentYearContentColor = colors.accent,
                    selectedYearContentColor = Color.White,
                    selectedYearContainerColor = colors.accent,
                    dayContentColor = colors.textPrimary,
                    selectedDayContainerColor = colors.accent,
                    selectedDayContentColor = Color.White,
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
            title = { Text("Sign Out", color = colors.textPrimary) },
            text = { Text("Are you sure you want to sign out?", color = colors.textSecondary) },
            containerColor = colors.surface,
            confirmButton = {
                TextButton(onClick = {
                    handleLogout()
                    showLogoutConfirm = false
                }) {
                    Text("Sign Out", color = colors.danger, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutConfirm = false }) {
                    Text("Cancel", color = colors.textSecondary)
                }
            }
        )
    }
}

// ==================== HELPER COMPONENTS ====================

@Composable
private fun ProfileRowCard(
    label: String,
    icon: ImageVector,
    value: String?,
    isEditing: Boolean,
    colors: HomeColors,
    readOnly: Boolean = false,
    onEdit: () -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit,
    editContent: @Composable () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp)
            .shadow(2.dp, HomeShapes.Item, spotColor = colors.shadow)
            .clip(HomeShapes.Item)
            .background(colors.surface)
            .border(1.dp, colors.glassBorder, HomeShapes.Item)
            .padding(20.dp)
    ) {
        // Label Row
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Icon(
                icon,
                null,
                tint = colors.textSecondary,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                label.uppercase(),
                style = HomeTypography.InfoLabel,
                color = colors.textSecondary,
                letterSpacing = 0.5.sp
            )
        }
        
        if (!isEditing) {
            // Read View
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    value ?: "Not Set",
                    style = HomeTypography.InfoValue,
                    color = if (value != null) colors.textPrimary else colors.placeholder,
                    modifier = Modifier.weight(1f)
                )
                
                if (!readOnly) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(colors.subtleBackground)
                            .clickable { onEdit() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Edit,
                            null,
                            tint = colors.textPrimary,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }
        } else {
            // Edit View
            editContent()
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Box(
                    modifier = Modifier
                        .clip(HomeShapes.Item)
                        .background(colors.subtleBackground)
                        .clickable { onCancel() }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text("Cancel", color = colors.textSecondary, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                }
                
                Spacer(modifier = Modifier.width(10.dp))
                
                Box(
                    modifier = Modifier
                        .clip(HomeShapes.Item)
                        .background(colors.accent)
                        .clickable { onSave() }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text("Save", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun ProfileTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    colors: HomeColors,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, color = colors.placeholder) },
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp),
        shape = HomeShapes.Item,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = colors.accent,
            unfocusedBorderColor = colors.glassBorder,
            focusedContainerColor = colors.inputBackground,
            unfocusedContainerColor = colors.inputBackground
        ),
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        textStyle = HomeTypography.PillTime.copy(color = colors.textPrimary)
    )
}

@Composable
private fun SelectorButton(
    value: String?,
    placeholder: String,
    colors: HomeColors,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(HomeShapes.Item)
            .background(colors.inputBackground)
            .border(1.dp, colors.glassBorder, HomeShapes.Item)
            .clickable(enabled = enabled) { onClick() }
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            value ?: placeholder,
            color = if (value != null) colors.textPrimary else colors.placeholder,
            style = HomeTypography.PillTime,
            fontWeight = if (value != null) FontWeight.Medium else FontWeight.Normal
        )
        Icon(
            Icons.Default.KeyboardArrowDown,
            null,
            tint = colors.textSecondary,
            modifier = Modifier.size(20.dp)
        )
    }
}


