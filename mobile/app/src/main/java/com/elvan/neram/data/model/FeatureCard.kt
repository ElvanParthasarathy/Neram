package com.elvan.neram.data.model

import androidx.compose.runtime.Immutable

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
        val enMsg = if (message.isNotBlank()) message else if (description.isNotBlank()) description else title
        val taMsg = if (messageTa.isNotBlank()) messageTa else if (descriptionTa.isNotBlank()) descriptionTa else titleTa
        return if (lang == "ta" && taMsg.isNotBlank()) taMsg else enMsg
    }

    fun getLocalizedTitle(lang: String): String = getLocalizedMessage(lang)

    fun getLocalizedDescription(lang: String): String = getLocalizedMessage(lang)

    fun getLocalizedActionText(lang: String): String {
        if (lang == "ta" && actionTextTa.isNotBlank()) return actionTextTa
        if (actionText.isNotBlank()) return actionText
        return if (lang == "ta") "பார்" else "Explore"
    }
}

@Immutable
data class FeatureCardsConfig(
    val enabled: Boolean = true,
    val cards: List<FeatureCard> = emptyList()
)
