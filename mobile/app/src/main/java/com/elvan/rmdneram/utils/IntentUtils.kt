package com.elvan.rmdneram.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast

object IntentUtils {
    fun openUrl(context: Context, url: String) {
        try {
            val uri = Uri.parse(url)
            val intent = Intent(Intent.ACTION_VIEW, uri)
            
            // Detect MIME type based on extension
            val mimeType = getMimeType(url)
            if (mimeType != null) {
                // For direct file links, setting DataAndType helps the system 
                // show appropriate apps (PDF viewers, Office apps, etc.)
                intent.setDataAndType(uri, mimeType)
            }
            
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            // Explicitly use createChooser to force the "Open with" popup
            // even if a default app is already set by the user.
            val chooser = Intent.createChooser(intent, "Complete action using")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(context, "Cannot open: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun getMimeType(url: String): String? {
        val lowerUrl = url.lowercase()
        return when {
            lowerUrl.endsWith(".pdf") -> "application/pdf"
            lowerUrl.endsWith(".ppt") || lowerUrl.endsWith(".pptx") -> "application/vnd.ms-powerpoint"
            lowerUrl.endsWith(".doc") || lowerUrl.endsWith(".docx") -> "application/msword"
            lowerUrl.endsWith(".xls") || lowerUrl.endsWith(".xlsx") -> "application/vnd.ms-excel"
            lowerUrl.contains("drive.google.com") -> null // Let Google Drive app handle its own URLs via standard VIEW
            else -> null
        }
    }
}
