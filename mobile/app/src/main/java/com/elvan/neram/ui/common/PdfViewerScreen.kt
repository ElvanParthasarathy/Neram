package com.elvan.neram.ui.common

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.compose.ui.viewinterop.AndroidView
import com.elvan.neram.ui.home.HomeColors
import com.elvan.neram.ui.home.HomeShapes
import com.elvan.neram.ui.home.HomeTypography
import com.elvan.neram.ui.components.ExpressiveLoadingIndicator
import com.github.barteksc.pdfviewer.PDFView
import com.github.barteksc.pdfviewer.util.FitPolicy
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.URL

@Composable
fun PdfViewerScreen(
    url: String,
    title: String = "Academic Calendar",
    onBack: () -> Unit = {},
    colors: HomeColors = com.elvan.neram.ui.home.rememberHomeColors()
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

    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val ceiling = statusBarHeight + 20.dp
    val fadeHeight = ceiling + 50.dp + 32.dp

    val pillColor = if (colors.isDark) Color(0xFF242424) else Color.White
    val contentColor = if (colors.isDark) Color.White else Color(0xFF1E1E1E)
    val canvasBg = if (colors.isDark) Color(0xFF121212) else Color(0xFFF2F4F7)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(canvasBg)
    ) {
        // LAYER 1: Full Edge-to-Edge PDF Canvas / Loading / Error
        when {
            isLoading -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
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
                    modifier = Modifier.fillMaxSize(),
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
                val currentFile = pdfFile!!
                AndroidView(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(top = ceiling + 50.dp + 8.dp),
                    factory = { ctx ->
                        PDFView(ctx, null)
                    },
                    update = { pdfView ->
                        pdfView.fromFile(currentFile)
                            .enableSwipe(true)
                            .swipeHorizontal(false)
                            .enableDoubletap(true)
                            .defaultPage(0)
                            .enableAnnotationRendering(true)
                            .password(null)
                            .scrollHandle(null)
                            .enableAntialiasing(true)
                            .spacing(12)
                            .pageFitPolicy(FitPolicy.WIDTH)
                            .load()
                    }
                )
            }
        }

        // LAYER 2: Home-style Top Fade Gradient (Smooth content fade into top bar)
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .height(fadeHeight)
                .zIndex(100f)
                .background(
                    Brush.verticalGradient(
                        0.0f to colors.background,
                        0.40f to colors.background.copy(alpha = 0.85f),
                        0.70f to colors.background.copy(alpha = 0.35f),
                        1.0f to Color.Transparent
                    )
                )
        )

        // LAYER 3: Floating Subpage-style Back Chevron Pill Alone (Matching all other subpages)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = ceiling, start = 16.dp, end = 16.dp)
                .zIndex(150f)
        ) {
            com.elvan.neram.ui.components.shell.ElvanPill(
                liftProgress = 1.0f,
                colors = colors,
                modifier = Modifier.size(50.dp)
            ) {
                com.elvan.neram.ui.components.shell.ElvanTopBarIconButton(onClick = onBack) {
                    Icon(
                        imageVector = com.elvan.neram.ui.navigation.MaterialSymbols.Rounded.ArrowBack,
                        contentDescription = "Back",
                        tint = colors.textPrimary,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }
    }
}
