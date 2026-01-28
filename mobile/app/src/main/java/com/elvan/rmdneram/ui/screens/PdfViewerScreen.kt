package com.elvan.rmdneram.ui.screens

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex // Added import
import androidx.compose.ui.viewinterop.AndroidView
import com.elvan.rmdneram.ui.navigation.SecondaryTopBar // Custom Top Bar
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeTypography
import com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator
import com.github.barteksc.pdfviewer.PDFView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.URL

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PdfViewerScreen(
    url: String,
    onBack: () -> Unit,
    colors: HomeColors
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    var pdfFile by remember { mutableStateOf<File?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isError by remember { mutableStateOf(false) }

    // Download Logic
    fun downloadPdf() {
        scope.launch {
            isLoading = true
            isError = false
            try {
                val file = withContext(Dispatchers.IO) {
                    val fileName = "temp_pdf_${System.currentTimeMillis()}.pdf"
                    val file = File(context.cacheDir, fileName)
                    URL(url).openStream().use { input ->
                        FileOutputStream(file).use { output ->
                            input.copyTo(output)
                        }
                    }
                    file
                }
                pdfFile = file
                isLoading = false
            } catch (e: Exception) {
                e.printStackTrace()
                isError = true
                isLoading = false
            }
        }
    }

    LaunchedEffect(url) {
        downloadPdf()
    }

    LaunchedEffect(url) {
        downloadPdf()
    }

    // Root Box for Manual Z-Layering
    Box(
        modifier = Modifier.fillMaxSize().background(colors.background)
    ) {
        // LAYER 1: CONTENT (PDF / Loading / Error) -> Z-Index 0
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 64.dp) // Leave space for Top Bar
                .background(colors.surface),
            contentAlignment = Alignment.Center
        ) {
            when {
                isLoading -> {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        ExpressiveLoadingIndicator(color = colors.accent)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Downloading PDF...",
                            style = HomeTypography.PillTitle,
                            color = colors.textSecondary
                        )
                    }
                }
                isError -> {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.ErrorOutline,
                            contentDescription = "Error",
                            tint = colors.danger,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Failed to load document",
                            style = HomeTypography.PillTitle,
                            color = colors.textPrimary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = { downloadPdf() },
                            colors = ButtonDefaults.buttonColors(containerColor = colors.accent),
                            shape = HomeShapes.Pill
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Retry")
                        }
                    }
                }
                pdfFile != null -> {
                    val currentFile = pdfFile!! // Safe unwrap
                    AndroidView(
                        modifier = Modifier.fillMaxSize(),
                        factory = { ctx ->
                            PDFView(ctx, null)
                        },
                        update = { pdfView ->
                            pdfView.fromFile(currentFile)
                                .enableSwipe(true)
                                .swipeHorizontal(false)
                                .enableDoubletap(true)
                                .defaultPage(0)
                                .enableAnnotationRendering(false)
                                .password(null)
                                .scrollHandle(null)
                                .enableAntialiasing(true)
                                .spacing(10) // spacing between pages in dp
                                .load()
                        }
                    )
                }
            }
        }

        // LAYER 2: TOP BAR -> Z-Index 1 (On Top)
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .zIndex(2f) // Force Z-Index
        ) {
            SecondaryTopBar(
                title = "Academic Calendar",
                onBack = onBack,
                actions = {}
            )
        }
    }

}
