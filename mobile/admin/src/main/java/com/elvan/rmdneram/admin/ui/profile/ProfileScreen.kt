package com.elvan.rmdneram.admin.ui.profile

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
import com.elvan.rmdneram.admin.ui.AdminViewModel
import com.elvan.rmdneram.admin.ui.home.HomeColors
import com.elvan.rmdneram.admin.ui.home.rememberHomeColors
import com.elvan.rmdneram.admin.ui.home.HomeTypography
import com.elvan.rmdneram.admin.ui.home.HomeShapes
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import java.time.LocalDate
import java.time.format.DateTimeFormatter

// Country codes for mobile input
val countryCodes = listOf("+91", "+1", "+44", "+61", "+81", "+86")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBack: () -> Unit,
    adminViewModel: AdminViewModel = viewModel()
) {
    val uiState by adminViewModel.uiState.collectAsState()
    val userProfile = uiState.userProfile //Nullable

    // Safety check for null profile
    if (userProfile == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }
    
    val colors = rememberHomeColors()
    
    // UI State for Edit Mode
    var isEditing by remember { mutableStateOf(false) }
    
    // Editable Fields
    var name by remember { mutableStateOf(userProfile.name) }
    var registerNumber by remember { mutableStateOf(userProfile.registerNumber) }
    var email by remember { mutableStateOf(userProfile.email) }
    var mobile by remember { mutableStateOf(userProfile.mobile) }
    var dob by remember { mutableStateOf(userProfile.dob) }
    var bloodGroup by remember { mutableStateOf(userProfile.bloodGroup) }
    var gender by remember { mutableStateOf(userProfile.gender) }
    var address by remember { mutableStateOf(userProfile.address) }
    
    // Save function
    fun saveChanges() {
        val updates = mapOf(
            "name" to name,
            "registerNumber" to registerNumber,
            "mobile" to mobile,
            "dob" to dob,
            "bloodGroup" to bloodGroup,
            "gender" to gender,
            "address" to address
        )
        adminViewModel.updateUserProfile(updates)
        isEditing = false
    }

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        containerColor = colors.background,
        topBar = {
            LargeTopAppBar(
                title = {
                    Column {
                        Text(
                            "My Profile",
                            style = HomeTypography.PageTitle,
                            color = colors.textPrimary
                        )
                        val alpha = scrollBehavior.state.collapsedFraction.let { 1f - it }
                        if (alpha > 0.3f) {
                            Text(
                                if (isEditing) "Editing Details" else "Personal Information",
                                style = HomeTypography.FacultyName,
                                color = colors.textSecondary,
                                modifier = Modifier.alpha(alpha)
                            )
                        }
                    }
                },
                navigationIcon = {
                    Box(
                        modifier = Modifier
                            .padding(start = 12.dp)
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(colors.surface)
                            .border(1.dp, colors.glassBorder, CircleShape)
                            .clickable { onBack() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.ChevronLeft, "Back", tint = colors.textPrimary, modifier = Modifier.size(24.dp))
                    }
                },
                actions = {
                    if (isEditing) {
                        TextButton(onClick = { saveChanges() }) {
                            Text("Save", color = colors.accent, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        IconButton(onClick = { isEditing = true }) {
                            Icon(Icons.Default.Edit, "Edit", tint = colors.accent)
                        }
                    }
                },
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor = colors.background,
                    scrolledContainerColor = colors.background,
                    titleContentColor = colors.textPrimary
                ),
                scrollBehavior = scrollBehavior
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile Image
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .border(2.dp, colors.accent, CircleShape)
                    .background(colors.surface),
                contentAlignment = Alignment.Center
            ) {
                 if (userProfile.profileImage.isNotEmpty()) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(userProfile.profileImage)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Profile",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        Icons.Default.Person,
                        null,
                        modifier = Modifier.size(60.dp),
                        tint = colors.textSecondary
                    )
                }
                
                if (isEditing) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.3f))
                            .clickable { /* Handle Image Upload */ },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.CameraAlt, null, tint = Color.White)
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Standardizing Icons to avoid build errors
            ProfileField(
                label = "Full Name",
                value = name,
                onValueChange = { name = it },
                isEditing = isEditing,
                colors = colors,
                icon = Icons.Default.Person
            )
            
            ProfileField(
                label = "Register Number",
                value = registerNumber,
                onValueChange = { registerNumber = it },
                isEditing = isEditing,
                colors = colors,
                icon = Icons.Default.Info // Safe replacement for Badge
            )
             
            ProfileField(
                label = "Department",
                value = userProfile.department,
                onValueChange = {},
                isEditing = false,
                colors = colors,
                icon = Icons.Default.Home // Safe replacement for School
            )

            ProfileField(
                label = "Mobile",
                value = mobile,
                onValueChange = { mobile = it },
                isEditing = isEditing,
                colors = colors,
                icon = Icons.Default.Phone
            )
        }
    }
}

@Composable
fun ProfileField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    isEditing: Boolean,
    colors: HomeColors,
    icon: ImageVector
) {
    Column(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
        Text(label, style = HomeTypography.DateLabel, color = colors.textSecondary, modifier = Modifier.padding(start = 4.dp, bottom = 4.dp))
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(if (isEditing) colors.inputBackground else colors.surface)
                .border(1.dp, if (isEditing) colors.accent.copy(alpha = 0.5f) else colors.glassBorder, RoundedCornerShape(12.dp))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = colors.accent, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(12.dp))
            if (isEditing) {
                androidx.compose.foundation.text.BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    textStyle = HomeTypography.PillTitle.copy(color = colors.textPrimary),
                    modifier = Modifier.weight(1f)
                )
            } else {
                Text(value.ifEmpty { "Not Set" }, style = HomeTypography.PillTitle, color = colors.textPrimary)
            }
        }
    }
}
