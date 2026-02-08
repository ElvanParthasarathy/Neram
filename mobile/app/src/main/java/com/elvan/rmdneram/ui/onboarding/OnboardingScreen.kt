package com.elvan.rmdneram.ui.onboarding

import android.util.Log
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.auth.AnimatedAuthButton
import com.elvan.rmdneram.ui.auth.AuthColors
import com.elvan.rmdneram.ui.auth.AuthGradientBackground
import com.elvan.rmdneram.ui.auth.StepHeader
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import kotlinx.coroutines.delay

private const val TAG = "OnboardingScreen"

/**
 * Onboarding Screen matching "Settings Profile" styling:
 * - Full screen (no card containment)
 * - Pill-shaped dropdowns (glass-select-pill style)
 * - Clean vertical alignment
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingScreen(
    academicHierarchy: Map<String, Map<String, List<String>>> = emptyMap(),
    onComplete: (String, String, String) -> Unit // dept, batch, section
) {
    var selectedBatch by remember { mutableStateOf<String?>(null) }
    var selectedDept by remember { mutableStateOf<String?>(null) }
    var selectedSection by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    
    // DIRECT FIREBASE FETCH
    var hierarchy by remember { mutableStateOf<Map<String, Map<String, List<String>>>>(academicHierarchy) }
    var isHierarchyLoading by remember { mutableStateOf(true) }
    
    // Fetch hierarchy directly
    DisposableEffect(Unit) {
        val database = FirebaseDatabase.getInstance()
        val hierarchyRef = database.getReference("academic_hierarchy")
        
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val fetchedHierarchy = mutableMapOf<String, Map<String, List<String>>>()
                
                snapshot.children.forEach { batchSnapshot ->
                    val batchName = batchSnapshot.key ?: return@forEach
                    if (batchName == "initialized") return@forEach
                    
                    val departments = mutableMapOf<String, List<String>>()
                    batchSnapshot.children.forEach { deptSnapshot ->
                        val deptName = deptSnapshot.key ?: return@forEach
                        if (deptName == "initialized") return@forEach
                        
                        val sections = deptSnapshot.children.mapNotNull { it.getValue(String::class.java) }
                        departments[deptName] = sections
                    }
                    fetchedHierarchy[batchName] = departments
                }
                
                hierarchy = fetchedHierarchy
                isHierarchyLoading = false
            }
            
            override fun onCancelled(error: DatabaseError) {
                Log.e(TAG, "Failed to load hierarchy: ${error.message}")
                isHierarchyLoading = false
            }
        }
        
        hierarchyRef.addValueEventListener(listener)
        onDispose { hierarchyRef.removeEventListener(listener) }
    }

    // Derive available options
    val batches = hierarchy.keys.filter { it != "initialized" }.sorted().reversed()
    val departments = selectedBatch?.let { 
        hierarchy[it]?.keys?.filter { k -> k != "initialized" }?.sorted() 
    } ?: emptyList()
    val sections = if (selectedBatch != null && selectedDept != null) {
        hierarchy[selectedBatch]?.get(selectedDept)?.sorted() ?: emptyList()
    } else emptyList()

    // Reset downstream on change
    LaunchedEffect(selectedBatch) { selectedDept = null; selectedSection = null }
    LaunchedEffect(selectedDept) { selectedSection = null }

    // Staggered reveal states
    var showIcon by remember { mutableStateOf(false) }
    var showTitle by remember { mutableStateOf(false) }
    var showForm by remember { mutableStateOf(false) }
    var showButton by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(200)
        showIcon = true
        delay(300)
        showTitle = true
        delay(300)
        showForm = true
        delay(300)
        showButton = true
    }

    // Floating animation for icon
    val infiniteTransition = rememberInfiniteTransition(label = "icon_float")
    val iconOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float_offset"
    )

    // Bottom Sheet State
    var showSheet by remember { mutableStateOf(false) }
    var sheetTitle by remember { mutableStateOf("") }
    var sheetOptions by remember { mutableStateOf(listOf<String>()) }
    var onOptionSelected by remember { mutableStateOf<(String) -> Unit>({}) }

    // FULL SCREEN WITH GRADIENT BACKGROUND
    AuthGradientBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .statusBarsPadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(48.dp))
            
            // ===== ANIMATED ICON =====
            AnimatedVisibility(
                visible = showIcon,
                enter = fadeIn(tween(500)) + scaleIn(initialScale = 0.5f)
            ) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .graphicsLayer { translationY = -iconOffset }
                        .background(
                            AuthColors.NeramBlue.copy(alpha = 0.15f),
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = AuthColors.NeramBlue
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            AnimatedVisibility(
                visible = showTitle,
                enter = fadeIn(tween(500)) + slideInVertically(initialOffsetY = { 20 })
            ) {
                val textPrimary = AuthColors.textPrimary()
                val textSecondary = AuthColors.textSecondary()
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Profile Setup",
                        style = MaterialTheme.typography.headlineLarge.copy(
                            fontWeight = FontWeight.ExtraBold
                        ),
                        color = textPrimary
                    )
                    
                    Text(
                        text = "Select your academic details below",
                        style = MaterialTheme.typography.bodyMedium,
                        color = textSecondary,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(48.dp))
        
        // FORM FIELDS (Pill Shaped)
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // 1. BATCH Dropdown
            AnimatedVisibility(
                visible = showForm,
                enter = fadeIn(tween(500)) + slideInVertically(initialOffsetY = { 30 })
            ) {
                PillDropdownField(
                    label = "ACADEMIC BATCH",
                    value = selectedBatch,
                    placeholder = "Select Year",
                    isLoading = isHierarchyLoading,
                    onClick = {
                        sheetTitle = "Select Batch"
                        sheetOptions = batches
                        onOptionSelected = { 
                            selectedBatch = it
                            selectedDept = null
                            selectedSection = null
                        }
                        showSheet = true
                    }
                )
            }
            
            // 2. DEPARTMENT Dropdown
            AnimatedVisibility(
                visible = selectedBatch != null && showForm,
                enter = fadeIn() + slideInVertically { -10 }
            ) {
                PillDropdownField(
                    label = "DEPARTMENT",
                    value = selectedDept,
                    placeholder = "Select Department",
                    onClick = {
                        sheetTitle = "Select Department"
                        sheetOptions = departments
                        onOptionSelected = { 
                            selectedDept = it
                            selectedSection = null
                        }
                        showSheet = true
                    }
                )
            }
            
            // 3. SECTION Dropdown
            AnimatedVisibility(
                visible = selectedDept != null && showForm,
                enter = fadeIn() + slideInVertically { -10 }
            ) {
                PillDropdownField(
                    label = "SECTION",
                    value = selectedSection,
                    placeholder = "Select Section",
                    onClick = {
                        sheetTitle = "Select Section"
                        sheetOptions = sections
                        onOptionSelected = { selectedSection = it }
                        showSheet = true
                    }
                )
            }
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        // SUBMIT BUTTON
        AnimatedVisibility(
            visible = showButton,
            enter = fadeIn(tween(500)) + slideInVertically(initialOffsetY = { 30 })
        ) {
            AnimatedAuthButton(
                text = "Complete Setup",
                onClick = {
                    if (selectedDept != null && selectedBatch != null && selectedSection != null) {
                        isLoading = true
                        onComplete(selectedDept!!, selectedBatch!!, selectedSection!!)
                    }
                },
                isLoading = isLoading,
                enabled = selectedBatch != null && selectedDept != null && selectedSection != null
            )
        }
        
        Spacer(modifier = Modifier.height(40.dp))
        }
    }

    // BOTTOM SHEET
    if (showSheet) {
        val surfaceColor = AuthColors.surface()
        val textPrimary = AuthColors.textPrimary()
        val dividerColor = AuthColors.divider()
        
        ModalBottomSheet(
            onDismissRequest = { showSheet = false },
            containerColor = surfaceColor,
            contentColor = textPrimary,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            scrimColor = Color.Black.copy(alpha = 0.5f),
            dragHandle = {
                // Custom drag handle without ripple/touch interaction
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .width(32.dp)
                            .height(4.dp)
                            .background(
                                color = dividerColor.copy(alpha = 0.4f),
                                shape = RoundedCornerShape(2.dp)
                            )
                    )
                }
            }
        ) {
            Column(modifier = Modifier.padding(bottom = 32.dp)) {
                Text(
                    text = sheetTitle,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = textPrimary,
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)
                )
                HorizontalDivider(
                    color = dividerColor,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                LazyColumn {
                    items(sheetOptions) { option ->
                        ListItem(
                            headlineContent = { 
                                Text(
                                    text = option,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = textPrimary,
                                    modifier = Modifier.padding(vertical = 4.dp)
                                ) 
                            },
                            modifier = Modifier.clickable {
                                onOptionSelected(option)
                                showSheet = false
                            },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PillDropdownField(
    label: String,
    value: String?,
    placeholder: String,
    isLoading: Boolean = false,
    onClick: () -> Unit
) {
    val textPrimary = AuthColors.textPrimary()
    val textSecondary = AuthColors.textSecondary()
    val textMuted = AuthColors.textMuted()
    val inputBg = AuthColors.inputBackground()
    
    // Animate background on touch could be added here if needed, but Surface handles simple ripple
    
    Column(modifier = Modifier.fillMaxWidth()) {
        // Label
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            ),
            color = textSecondary,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            textAlign = TextAlign.Start // Left Aligned
        )
        
        // Pill shaped input (Surface based for better ripple control)
        Surface(
            onClick = onClick,
            shape = RoundedCornerShape(50),
            color = inputBg,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .shadow(
                    elevation = if (isSystemInDarkTheme()) 0.dp else 8.dp,
                    shape = RoundedCornerShape(50),
                    ambientColor = Color.Black.copy(alpha = 0.25f),
                    spotColor = Color.Black.copy(alpha = 0.25f)
                )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp), // Padding after curve
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Text Content
                Box(modifier = Modifier.weight(1f)) {
                    if (value.isNullOrEmpty()) {
                        Text(
                            text = if (isLoading) "Loading..." else placeholder,
                            color = textMuted,
                            style = MaterialTheme.typography.bodyLarge,
                            textAlign = TextAlign.Start
                        )
                    } else {
                        Text(
                            text = value,
                            color = textPrimary,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontWeight = FontWeight.SemiBold
                            ),
                            textAlign = TextAlign.Start,
                            maxLines = 1
                        )
                    }
                }
                
                // Dropdown Icon
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    tint = AuthColors.NeramBlue
                )
            }
        }
    }
}


