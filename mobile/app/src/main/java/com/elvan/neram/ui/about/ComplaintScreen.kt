package com.elvan.neram.ui.about

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.utils.EmailConfig
import com.elvan.neram.utils.EmailHelper
import com.google.firebase.firestore.FieldValue
import kotlinx.coroutines.launch

@Composable
fun ComplaintScreen(
    isOffline: Boolean = false,
    onBack: () -> Unit = {},
    onSendMessage: (Map<String, Any?>) -> Unit,
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val lang = LocalAppLanguage.current

    var name by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var showOfflineDialog by remember { mutableStateOf(false) }

    if (showOfflineDialog) {
        AlertDialog(
            onDismissRequest = { showOfflineDialog = false },
            title = { Text(K.offline.tr(lang), style = HomeTypography.PillTitle) },
            text = { Text(K.offlineMessage.tr(lang), style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Button(
                    onClick = { showOfflineDialog = false },
                    shape = HomeShapes.Pill,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.accent,
                        contentColor = Color.White
                    )
                ) {
                    Text(K.ok.tr(lang), style = HomeTypography.StatusBadge)
                }
            },
            containerColor = colors.surface,
            titleContentColor = colors.textPrimary,
            textContentColor = colors.textSecondary,
            shape = HomeShapes.Item
        )
    }

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        item(key = "form_fields") {
            ElvanSectionContainer {
                Column {
                    // Name
                    ComplaintInput(
                        value = name,
                        onValueChange = { name = it },
                        label = K.fullName.tr(lang),
                        icon = Icons.Default.Person,
                        colors = colors
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Mobile
                    ComplaintInput(
                        value = mobile,
                        onValueChange = { mobile = it },
                        label = K.mobileNumber.tr(lang),
                        icon = Icons.Default.Phone,
                        keyboardType = KeyboardType.Phone,
                        colors = colors
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Email
                    ComplaintInput(
                        value = email,
                        onValueChange = { email = it },
                        label = K.emailAddress.tr(lang),
                        icon = Icons.Default.Email,
                        keyboardType = KeyboardType.Email,
                        colors = colors
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Message
                    ComplaintInput(
                        value = message,
                        onValueChange = { message = it },
                        label = K.describeIssue.tr(lang),
                        icon = Icons.Default.Message,
                        isMultiLine = true,
                        colors = colors
                    )
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    // Submit Button
                    Button(
                        onClick = {
                            if (isOffline) {
                                showOfflineDialog = true
                                return@Button
                            }
                            if (name.isBlank() || mobile.isBlank() || email.isBlank() || message.isBlank()) {
                                Toast.makeText(context, K.fillAllFields.tr(lang), Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            
                            isSubmitting = true
                            scope.launch {
                                try {
                                    val msgData = hashMapOf(
                                        "name" to name,
                                        "mobile" to mobile,
                                        "email" to email,
                                        "message" to message,
                                        "timestamp" to FieldValue.serverTimestamp()
                                    )
                                    
                                    onSendMessage(msgData)
                                    
                                    val params = mapOf(
                                        "name" to name,
                                        "mobile" to mobile,
                                        "email" to email,
                                        "message" to message
                                    )
                                    
                                    val sentAdmin = EmailHelper.sendEmail(EmailConfig.ADMIN_TEMPLATE_ID, params)
                                    EmailHelper.sendEmail(EmailConfig.AUTO_REPLY_TEMPLATE_ID, params)
                                    
                                    if (sentAdmin) {
                                        Toast.makeText(context, K.feedbackSubmittedSuccess.tr(lang), Toast.LENGTH_LONG).show()
                                        name = ""
                                        mobile = ""
                                        email = ""
                                        message = ""
                                        onBack()
                                    } else {
                                        Toast.makeText(context, K.feedbackSubmittedSuccess.tr(lang), Toast.LENGTH_LONG).show()
                                        onBack()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "${K.error.tr(lang)}: ${e.message}", Toast.LENGTH_SHORT).show()
                                } finally {
                                    isSubmitting = false
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.accent,
                            contentColor = Color.White,
                            disabledContainerColor = colors.accent.copy(alpha = 0.5f)
                        ),
                        enabled = !isSubmitting
                    ) {
                        if (isSubmitting) {
                            com.elvan.neram.ui.components.ExpressiveLoadingIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(K.loading.tr(lang))
                        } else {
                            Text(K.submitFeedback.tr(lang), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(Icons.Default.Send, null, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ComplaintInput(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isMultiLine: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    colors: HomeColors
) {
    Column {
        Text(
            label,
            style = HomeTypography.PillTime,
            color = colors.textSecondary,
            modifier = Modifier.padding(bottom = 8.dp, start = 4.dp)
        )
        
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .height(if (isMultiLine) 150.dp else 56.dp)
                .background(colors.surface, HomeShapes.Item),
            shape = HomeShapes.Item,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = colors.accent,
                unfocusedBorderColor = Color.Transparent,
                cursorColor = colors.accent,
                focusedTextColor = colors.textPrimary,
                unfocusedTextColor = colors.textPrimary
            ),
            leadingIcon = if (!isMultiLine) {
                { Icon(icon, null, tint = colors.textSecondary) }
            } else null,
            keyboardOptions = KeyboardOptions(
                keyboardType = keyboardType,
                imeAction = if (isMultiLine) ImeAction.Default else ImeAction.Next
            ),
            singleLine = !isMultiLine,
            maxLines = if (isMultiLine) 10 else 1
        )
    }
}
