package com.elvan.neram.data.model

import androidx.compose.runtime.Immutable
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

@Immutable
data class FeatureCard(
    val id: String = "",
    val type: String = "UPDATE",
    val message: String = "",
    val messageTa: String = "",
    val title: String = "",
    val titleTa: String = "",
    val description: String = "",
    val descriptionTa: String = "",
    val badge: String = "UPDATE",
    val icon: String = "sparkle",
    val actionText: String = "",
    val actionTextTa: String = "",
    val actionRoute: String = "",
    val enabled: Boolean = true
) {
    fun getEffectiveType(): String {
        return if (type.isNotBlank()) type else if (badge.isNotBlank()) badge else "UPDATE"
    }

    fun getLocalizedMessage(lang: String): String {
        val isTa = lang == "ta" || lang == "ta-Latn"
        val enMsg = if (message.isNotBlank()) message else if (description.isNotBlank()) description else title
        val taMsg = if (messageTa.isNotBlank()) messageTa else if (descriptionTa.isNotBlank()) descriptionTa else titleTa
        return if (isTa && taMsg.isNotBlank()) taMsg else enMsg
    }

    fun getLocalizedTitle(lang: String): String = getLocalizedMessage(lang)

    fun getLocalizedDescription(lang: String): String = getLocalizedMessage(lang)

    fun getLocalizedActionText(lang: String): String {
        val isTa = lang == "ta" || lang == "ta-Latn"
        if (isTa && actionTextTa.isNotBlank()) return actionTextTa
        if (actionText.isNotBlank()) return actionText
        return K.explore.tr(lang)
    }

    fun getLocalizedBadge(lang: String): String {
        val raw = (if (badge.isNotBlank()) badge else type).trim().uppercase()
        return when (raw) {
            "UPDATE" -> K.cardUpdate.tr(lang)
            "ALERT" -> K.cardAlert.tr(lang)
            "NEWS" -> K.cardNews.tr(lang)
            "TIP" -> K.cardTip.tr(lang)
            "NOTICE" -> K.cardNotice.tr(lang)
            "FEATURE" -> K.cardFeature.tr(lang)
            else -> if (lang == "en") raw else raw
        }
    }
}

@Immutable
data class FeatureCardsConfig(
    val enabled: Boolean = true,
    val cards: List<FeatureCard> = emptyList()
)
