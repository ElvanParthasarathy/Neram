package com.elvan.rmdneram.ui.about

import android.content.Intent
import android.net.Uri
import android.widget.Toast
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
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.utils.EmailConfig
import com.elvan.rmdneram.utils.EmailHelper
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch

@Composable
fun ContactScreen(
    isOffline: Boolean = false,
    onBack: () -> Unit,
    onSendMessage: (Map<String, Any?>) -> Unit
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    var name by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var showOfflineDialog by remember { mutableStateOf(false) }

    // Offline Dialog
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 100.dp)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 24.dp, end = 24.dp, top = 48.dp, bottom = 24.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(colors.surface)
                    .clickable { onBack() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.ChevronLeft, "Back", tint = colors.textPrimary, modifier = Modifier.size(20.dp))
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column {
                Text(
                    "Contact & Complaints", 
                    style = HomeTypography.PageTitle.copy(fontSize = 28.sp), 
                    color = colors.textPrimary
                )
                Text("Reach out for queries or feedback", style = HomeTypography.FacultyName, color = colors.textSecondary)
            }
        }

        // Developer Profile Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .clip(HomeShapes.Item)
                .background(colors.surface)
                .padding(20.dp)
        ) {
            Text("Hello, I Am", style = HomeTypography.FacultyName, color = colors.textSecondary)
            Text("Jaiprakash Parthasarathy", style = HomeTypography.PageTitle, color = colors.textPrimary)
            Text("(Also known as: Elvan Parthasarathy)", style = HomeTypography.FacultyName, color = colors.textSecondary)
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Portfolio Button
            Box(
                modifier = Modifier
                    .clip(HomeShapes.Pill)
                    .background(colors.accent)
                    .clickable {
                        com.elvan.rmdneram.utils.IntentUtils.openUrl(context, "https://jaiprakashpartha.vercel.app/")
                    }
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Visit My Portfolio", color = Color.White, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(Icons.Default.ArrowForward, null, tint = Color.White, modifier = Modifier.size(16.dp))
                }
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            HorizontalDivider(color = colors.glassBorder, modifier = Modifier.padding(start = 32.dp))
            Spacer(modifier = Modifier.height(20.dp))
            
            Text("Contact Info", style = HomeTypography.SectionTitle, color = colors.textPrimary)
            Spacer(modifier = Modifier.height(12.dp))
            
            // Contact Items
            ContactItem(Icons.Outlined.Phone, "+91 93451 28797", colors) {
                context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:+919345128797")))
            }
            ContactItem(Icons.Outlined.Email, "jaiprakashpartha@gmail.com", colors) {
                context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:jaiprakashpartha@gmail.com")))
            }
            ContactItem(Icons.Default.Link, "/in/jaiprakashpartha", colors) {
                com.elvan.rmdneram.utils.IntentUtils.openUrl(context, "https://linkedin.com/in/jaiprakashpartha")
            }
            ContactItem(Icons.Outlined.Code, "/elvanparthasarathy", colors) {
                com.elvan.rmdneram.utils.IntentUtils.openUrl(context, "https://github.com/elvanparthasarathy")
            }
            ContactItem(Icons.Outlined.LocationOn, "Arani, Tamil Nadu - 632317\n(Currently in Chennai)", colors, clickable = false) {}
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Message Form Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .clip(HomeShapes.Item)
                .background(colors.surface)
                .padding(20.dp)
        ) {
            Text("Send a Message", style = HomeTypography.SectionTitle, color = colors.textPrimary)
            Text("Fill out the form below to reach me directly.", style = HomeTypography.FacultyName, color = colors.textSecondary)
            
            Spacer(modifier = Modifier.height(16.dp))
            
            ContactTextField(value = name, onValueChange = { name = it }, placeholder = "Your Name", colors = colors)
            Spacer(modifier = Modifier.height(12.dp))
            ContactTextField(value = mobile, onValueChange = { mobile = it }, placeholder = "Mobile Number", colors = colors, keyboardType = KeyboardType.Phone)
            Spacer(modifier = Modifier.height(12.dp))
            ContactTextField(value = email, onValueChange = { email = it }, placeholder = "Email Address", colors = colors, keyboardType = KeyboardType.Email)
            Spacer(modifier = Modifier.height(12.dp))
            ContactTextField(value = message, onValueChange = { message = it }, placeholder = "Your Message / Query", colors = colors, singleLine = false, minLines = 4)
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Submit Button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(HomeShapes.Pill)
                    .background(if (isSubmitting) colors.accent.copy(alpha = 0.5f) else colors.accent)
                    .clickable(enabled = !isSubmitting) {
                        if (isOffline) {
                            showOfflineDialog = true
                            return@clickable
                        }
                        if (name.isEmpty() || mobile.isEmpty() || email.isEmpty() || message.isEmpty()) {
                            Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
                            return@clickable
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
                                
                                // 3. Send Auto Reply Email (ignore errors)
                                EmailHelper.sendEmail(EmailConfig.AUTO_REPLY_TEMPLATE_ID, params)
                                
                                if (sentAdmin) {
                                    Toast.makeText(context, "Message sent successfully!", Toast.LENGTH_LONG).show()
                                    name = ""; mobile = ""; email = ""; message = ""
                                } else {
                                    Toast.makeText(context, "Saved, but failed to send email alert.", Toast.LENGTH_LONG).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            } finally {
                                isSubmitting = false
                            }
                        }
                    }
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                if (isSubmitting) {
                    com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Send Message", color = Color.White, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(8.dp))
                        Icon(Icons.Default.Send, null, tint = Color.White, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun ContactItem(
    icon: ImageVector,
    text: String,
    colors: HomeColors,
    clickable: Boolean = true,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (clickable) Modifier.clickable { onClick() } else Modifier)
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = colors.accent, modifier = Modifier.size(20.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Text(text, style = HomeTypography.PillTime, color = colors.textPrimary)
    }
}

@Composable
private fun ContactTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    colors: HomeColors,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    minLines: Int = 1
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, color = colors.placeholder) },
        modifier = Modifier.fillMaxWidth(),
        shape = HomeShapes.Item,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = colors.accent,
            unfocusedBorderColor = colors.glassBorder,
            focusedContainerColor = colors.inputBackground,
            unfocusedContainerColor = colors.inputBackground
        ),
        singleLine = singleLine,
        minLines = minLines,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        textStyle = HomeTypography.PillTime.copy(color = colors.textPrimary)
    )
}
