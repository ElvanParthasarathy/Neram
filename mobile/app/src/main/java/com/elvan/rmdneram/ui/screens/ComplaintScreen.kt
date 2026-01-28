package com.elvan.rmdneram.ui.screens

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Color
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.utils.EmailConfig
import com.elvan.rmdneram.utils.EmailHelper
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComplaintScreen(
    isOffline: Boolean = false,
    onBack: () -> Unit,
    onSendMessage: (Map<String, Any?>) -> Unit
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var name by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var showOfflineDialog by remember { mutableStateOf(false) }

    if (showOfflineDialog) {
        AlertDialog(
            onDismissRequest = { showOfflineDialog = false },
            title = { Text("Offline", style = HomeTypography.PillTitle) },
            text = { Text("Internet is not connected. Connect to internet to send your message.", style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Button(
                    onClick = { showOfflineDialog = false },
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

    BackHandler { onBack() }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "Complaints / Feedback", 
                            style = HomeTypography.PageTitle.copy(fontSize = 20.sp),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
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
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
        ) {
            Spacer(modifier = Modifier.height(24.dp))

        Column(
            modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)
        ) {
            
            // Name
            ComplaintInput(
                value = name,
                onValueChange = { name = it },
                label = "Your Name",
                icon = Icons.Default.Person,
                colors = colors
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Mobile
            ComplaintInput(
                value = mobile,
                onValueChange = { mobile = it },
                label = "Mobile Number",
                icon = Icons.Default.Phone,
                keyboardType = KeyboardType.Phone,
                colors = colors
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Email
            ComplaintInput(
                value = email,
                onValueChange = { email = it },
                label = "Email Address",
                icon = Icons.Default.Email,
                keyboardType = KeyboardType.Email,
                colors = colors
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Message
            ComplaintInput(
                value = message,
                onValueChange = { message = it },
                label = "Your Message / Review / Query",
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
                        Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    
                    isSubmitting = true
                    scope.launch {
                        try {
                            // 1. Save to Firestore (via Repository)
                            val msgData = hashMapOf(
                                "name" to name,
                                "mobile" to mobile,
                                "email" to email,
                                "message" to message,
                                "timestamp" to FieldValue.serverTimestamp()
                            )
                            
                            onSendMessage(msgData)
                            
                            // 2. Send Email (Admin)
                            val params = mapOf(
                                "name" to name,
                                "mobile" to mobile,
                                "email" to email,
                                "message" to message
                            )
                            
                            val sentAdmin = EmailHelper.sendEmail(EmailConfig.ADMIN_TEMPLATE_ID, params)
                            // 3. Send Email (Auto Reply) - ignoring error for this one
                            EmailHelper.sendEmail(EmailConfig.AUTO_REPLY_TEMPLATE_ID, params)
                            
                            if (sentAdmin) {
                                Toast.makeText(context, "Message sent successfully!", Toast.LENGTH_LONG).show()
                                // Clear form
                                name = ""
                                mobile = ""
                                email = ""
                                message = ""
                                onBack()
                            } else {
                                Toast.makeText(context, "Saved, but failed to send email alert.", Toast.LENGTH_LONG).show()
                            }
                        } catch (e: Exception) {
                           Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
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
                    com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Sending...")
                } else {
                    Text("Send Message", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(Icons.Default.Send, null, modifier = Modifier.size(18.dp))
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
                .background(colors.surface.copy(alpha = 0.5f), HomeShapes.Item),
            shape = HomeShapes.Item,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = colors.accent,
                unfocusedBorderColor = Color.Transparent, // Flat look
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
