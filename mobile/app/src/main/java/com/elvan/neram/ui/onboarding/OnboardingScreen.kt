package com.elvan.neram.ui.onboarding

import android.util.Log
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.rounded.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.auth.AnimatedAuthButton
import com.elvan.neram.ui.auth.AuthAnimatedElement
import com.elvan.neram.ui.auth.AuthColors
import com.elvan.neram.ui.auth.AuthGradientBackground
import com.elvan.neram.ui.auth.StepHeader
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
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

    // Bottom Sheet State
    var showSheet by remember { mutableStateOf(false) }
    var sheetTitle by remember { mutableStateOf("") }
    var sheetOptions by remember { mutableStateOf(listOf<String>()) }
    var onOptionSelected by remember { mutableStateOf<(String) -> Unit>({}) }

    val ff = LocalAppFontFamily.current
    val lang = LocalAppLanguage.current

    // FULL SCREEN WITH GRADIENT BACKGROUND
    AuthGradientBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .statusBarsPadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(32.dp))
            
            // 1. Sleek Academic Icon - Monochrome & Prominent (matching LanguageSelectionScreen)
            AuthAnimatedElement(delayIndex = 0) {
                Icon(
                    imageVector = Icons.Rounded.School,
                    contentDescription = null,
                    modifier = Modifier.size(56.dp),
                    tint = AuthColors.textPrimary()
                )
            }
            
            Spacer(modifier = Modifier.height(14.dp))
            
            // 2. Title and Subtitle - Clean typography, balanced hierarchy & centered
            AuthAnimatedElement(delayIndex = 1) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = K.profileSetup.tr(lang),
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Bold,
                            color = AuthColors.textPrimary(),
                            lineHeight = 32.sp
                        ),
                        textAlign = TextAlign.Center
                    )
                    
                    Spacer(modifier = Modifier.height(6.dp))
                    
                    Text(
                        text = K.selectAcademicDetailsBelow.tr(lang),
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 14.sp,
                            color = AuthColors.textSecondary(),
                            lineHeight = 20.sp
                        ),
                        textAlign = TextAlign.Center
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(28.dp))
        // FORM FIELDS (24.dp Rounded Cards)
        AuthAnimatedElement(delayIndex = 2, modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. BATCH Dropdown
                PillDropdownField(
                    label = K.academicBatch.tr(lang).uppercase(),
                    value = selectedBatch,
                    placeholder = K.selectYear.tr(lang),
                    isLoading = isHierarchyLoading,
                    onClick = {
                        sheetTitle = K.selectBatch.tr(lang)
                        sheetOptions = batches
                        onOptionSelected = { 
                            selectedBatch = it
                            selectedDept = null
                            selectedSection = null
                        }
                        showSheet = true
                    }
                )
                
                // 2. DEPARTMENT Dropdown
                AnimatedVisibility(
                    visible = selectedBatch != null,
                    enter = fadeIn() + slideInVertically { -10 }
                ) {
                    PillDropdownField(
                        label = K.department.tr(lang).uppercase(),
                        value = selectedDept,
                        placeholder = K.selectDepartment.tr(lang),
                        onClick = {
                            sheetTitle = K.selectDepartment.tr(lang)
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
                    visible = selectedDept != null,
                    enter = fadeIn() + slideInVertically { -10 }
                ) {
                    PillDropdownField(
                        label = K.section.tr(lang).uppercase(),
                        value = selectedSection,
                        placeholder = K.selectSection.tr(lang),
                        onClick = {
                            sheetTitle = K.selectSection.tr(lang)
                            sheetOptions = sections
                            onOptionSelected = { selectedSection = it }
                            showSheet = true
                        }
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        // SUBMIT BUTTON
        AuthAnimatedElement(delayIndex = 3, modifier = Modifier.fillMaxWidth()) {
            AnimatedAuthButton(
                text = K.completeSetup.tr(lang),
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
    val lang = LocalAppLanguage.current
    val isDark = isSystemInDarkTheme()
    val ff = LocalAppFontFamily.current
    
    // Animate background on touch could be added here if needed, but Surface handles simple ripple
    
    Column(modifier = Modifier.fillMaxWidth()) {
        // Label aligned only after the pill curve ends (28.dp)
        Text(
            text = label,
            style = TextStyle(
                fontFamily = ff,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.8.sp,
                color = textSecondary
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 28.dp, bottom = 8.dp),
            textAlign = TextAlign.Start // Left Aligned after pill curve
        )
        
        // Pill shaped input with no outline
        val fieldShape = RoundedCornerShape(50)
        Surface(
            onClick = onClick,
            shape = fieldShape,
            color = inputBg,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .then(
                    if (isDark) Modifier
                    else Modifier.shadow(
                        elevation = 3.dp,
                        shape = fieldShape,
                        clip = false,
                        ambientColor = Color.Black.copy(alpha = 0.18f),
                        spotColor = Color.Black.copy(alpha = 0.20f)
                    )
                )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = 28.dp, end = 20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Text Content
                Box(modifier = Modifier.weight(1f)) {
                    if (value.isNullOrEmpty()) {
                        Text(
                            text = if (isLoading) K.loading.tr(lang) else placeholder,
                            color = textMuted,
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Normal,
                                color = textMuted
                            ),
                            textAlign = TextAlign.Start
                        )
                    } else {
                        Text(
                            text = value,
                            color = textPrimary,
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = textPrimary
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


