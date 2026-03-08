package com.elvan.rmdneram.ui.home.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Person
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeDimens
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeTypography
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.draw.clip


/**
 * Editable section component for Updates and Notices
 * Matches React Native UpdatesItem and GeneralNoticeItem
 */
@Composable
fun EditableSection(
    title: String,
    content: String,
    rawContent: String = content,
    author: String,
    emptyText: String,
    canEdit: Boolean,
    accentColor: Color,
    isSaving: Boolean,
    isLoading: Boolean = false,
    isOffline: Boolean = false,
    colors: HomeColors,
    onSave: (String) -> Unit
) {
    var isEditing by remember { mutableStateOf(false) }
    var editText by remember(rawContent) { mutableStateOf(rawContent) }
    var showOfflineDialog by remember { mutableStateOf(false) }

    // Use Crossfade for smooth transition between loading skeleton and actual content
    androidx.compose.animation.Crossfade(
        targetState = isLoading,
        animationSpec = androidx.compose.animation.core.tween(
            durationMillis = 400,
            easing = androidx.compose.animation.core.FastOutSlowInEasing
        ),
        label = "EditableSectionCrossfade"
    ) { loading ->
        if (loading) {
            // Skeleton Loading State
            Column {
                // Header Skeleton
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .width(150.dp)
                            .height(24.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(colors.subtleBackground)
                    )
                }
                
                Spacer(modifier = Modifier.height(HomeDimens.HeaderGap))
                
                // Content Body Skeleton
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(HomeDimens.MessageContainerMinHeight),
                    shape = HomeShapes.Item,
                    color = colors.surface
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.8f)
                                .height(16.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(colors.subtleBackground)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.6f)
                                .height(16.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(colors.subtleBackground)
                        )
                    }
                }
                
                // Author Badge Skeleton (reserves space)
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    Box(
                        modifier = Modifier
                            .width(100.dp)
                            .height(24.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(colors.subtleBackground)
                    )
                }
            }
        } else {
            // Actual Content - wrapped in inner composable
            EditableSectionContent(
                title = title,
                content = content,
                rawContent = rawContent,
                author = author,
                emptyText = emptyText,
                canEdit = canEdit,
                accentColor = accentColor,
                isSaving = isSaving,
                isOffline = isOffline,
                colors = colors,
                isEditing = isEditing,
                editText = editText,
                showOfflineDialog = showOfflineDialog,
                onEditingChange = { isEditing = it },
                onEditTextChange = { editText = it },
                onOfflineDialogChange = { showOfflineDialog = it },
                onSave = onSave
            )
        }
    }
}

@Composable
private fun EditableSectionContent(
    title: String,
    content: String,
    rawContent: String,
    author: String,
    emptyText: String,
    canEdit: Boolean,
    accentColor: Color,
    isSaving: Boolean,
    isOffline: Boolean,
    colors: HomeColors,
    isEditing: Boolean,
    editText: String,
    showOfflineDialog: Boolean,
    onEditingChange: (Boolean) -> Unit,
    onEditTextChange: (String) -> Unit,
    onOfflineDialogChange: (Boolean) -> Unit,
    onSave: (String) -> Unit
) {

    if (showOfflineDialog) {
        AlertDialog(
            onDismissRequest = { onOfflineDialogChange(false) },
            title = { Text("Offline", style = HomeTypography.PillTitle) },
            text = { Text("Internet is not connected. Connect to internet to edit this section.", style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Button(
                    onClick = { onOfflineDialogChange(false) },
                    shape = HomeShapes.Pill,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.accent,
                        contentColor = Color.White
                    )
                ) {
                    Text("OK", style = HomeTypography.StatusBadge)
                }
            },
            containerColor = colors.surface,
            titleContentColor = colors.textPrimary,
            textContentColor = colors.textSecondary,
            shape = HomeShapes.Item
        )
    }

    Column {
        // Header row with title and edit button
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                style = HomeTypography.SectionTitle,
                color = colors.textPrimary
            )
            
            if (canEdit && !isEditing) {
                // Edit Trigger - Blue Pill Style
                Surface(
                    onClick = { 
                        if (isOffline) {
                            onOfflineDialogChange(true)
                        } else {
                            onEditTextChange(rawContent)
                            onEditingChange(true) 
                        }
                    },
                    shape = HomeShapes.Pill,
                    color = colors.accent
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "EDIT",
                            color = Color.White,
                            style = HomeTypography.EditTrigger
                        )
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height( HomeDimens.HeaderGap )) // CSS has 20px bottom margin on header
        
        AnimatedContent(
            targetState = isEditing,
            transitionSpec = {
                (fadeIn(animationSpec = tween(400)) + expandVertically()) togetherWith 
                (fadeOut(animationSpec = tween(400)) + shrinkVertically()) using SizeTransform(clip = false)
            },
            label = "EditorValidation"
        ) { editing ->
            if (editing) {
                // Edit mode - Matches .edit-form
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = HomeShapes.Item,
                    color = colors.surface
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        // Text Area - Matches .edit-textarea
                        OutlinedTextField(
                            value = editText,
                            onValueChange = { onEditTextChange(it) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = 100.dp)
                                .background(colors.subtleBackground, RoundedCornerShape(16.dp)),
                            placeholder = { Text("Type here...") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent,
                                focusedContainerColor = Color.Transparent,
                                unfocusedContainerColor = Color.Transparent
                            ),
                            textStyle = HomeTypography.MessageBody.copy(color = colors.textPrimary),
                            shape = RoundedCornerShape(16.dp)
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Save Button
                            val scope = rememberCoroutineScope()
                            var isLocalSaving by remember { mutableStateOf(false) }

                            Button(
                                onClick = { 
                                    scope.launch {
                                        isLocalSaving = true
                                        kotlinx.coroutines.delay(2000)
                                        onSave(editText)
                                        onEditingChange(false)
                                        isLocalSaving = false
                                    }
                                },
                                enabled = !isSaving && !isLocalSaving,
                                modifier = Modifier.weight(1f).height(44.dp),
                                shape = HomeShapes.Pill,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.accent,
                                    contentColor = Color.White
                                )
                            ) {
                                if (isSaving || isLocalSaving) {
                                    com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(
                                        modifier = Modifier.size(16.dp),
                                        color = Color.White,
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Text("Save")
                                }
                            }
                            
                            // Cancel Button
                            Button(
                                onClick = { onEditingChange(false) },
                                enabled = !isSaving && !isLocalSaving,
                                modifier = Modifier.weight(1f).height(44.dp),
                                shape = HomeShapes.Pill,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.subtleBackground,
                                    contentColor = colors.textPrimary
                                ),
                                elevation = ButtonDefaults.buttonElevation(0.dp)
                            ) {
                                Text("Cancel")
                            }
                        }
                    }
                }
            } else {
                // View mode
                Column {
                    if (content.isNotEmpty()) {
                        // Message Container - Matches .message-container
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = HomeDimens.MessageContainerMinHeight),
                            shape = HomeShapes.Item,
                            color = colors.surface
                        ) {
                            Box(
                                modifier = Modifier.padding(24.dp),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                Text(
                                    text = content,
                                    style = HomeTypography.MessageBody,
                                    color = colors.textPrimary
                                )
                            }
                        }
                        
                        // Author Badge - Matches .last-edited-badge
                        // Fixed container to prevent layout shift during animation
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = colors.surface,
                                modifier = Modifier.defaultMinSize(minWidth = 100.dp, minHeight = 24.dp)
                            ) {
                                // Animated content transition - fade in/out without layout shift
                                androidx.compose.animation.AnimatedVisibility(
                                    visible = author.isNotEmpty(),
                                    enter = androidx.compose.animation.fadeIn(
                                        animationSpec = androidx.compose.animation.core.tween(
                                            durationMillis = 400,
                                            easing = androidx.compose.animation.core.FastOutSlowInEasing
                                        )
                                    ),
                                    exit = androidx.compose.animation.fadeOut(
                                        animationSpec = androidx.compose.animation.core.tween(
                                            durationMillis = 200
                                        )
                                    )
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "Posted by ",
                                            style = HomeTypography.AuthorBadge,
                                            color = colors.textSecondary
                                        )
                                        Icon(
                                            imageVector = Icons.Default.Person,
                                            contentDescription = null,
                                            tint = colors.textSecondary,
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = author,
                                            style = HomeTypography.AuthorBadge,
                                            color = colors.textSecondary
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        // Empty State inside container or just text? 
                        // Home.jsx: <div class="message-container"><p...>No general notices</p></div>
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = HomeDimens.MessageContainerMinHeight),
                            shape = HomeShapes.Item,
                            color = colors.surface
                        ) {
                            Box(
                                modifier = Modifier.padding(24.dp),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                Text(
                                    text = emptyText,
                                    style = HomeTypography.EmptyState,
                                    color = colors.textSecondary
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
