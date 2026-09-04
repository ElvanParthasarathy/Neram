package com.elvan.neram.data.model

import androidx.compose.runtime.Immutable
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

@Immutable
data class FeatureCard(
    val id: String = "",
    val type: String = "UPDATE",
    val message: String = "",
    val messageEn: String = "",
    val messageTa: String = "",
    val messageTaLatn: String = "",
    val messageMl: String = "",
    val messageMlLatn: String = "",
    val messageTe: String = "",
    val messageTeLatn: String = "",
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

    /**
     * Resolves the localized message according to the current app/system language:
     * - English: compulsory fallback
     * - Tamil / Tamil Latin: returns language entry, or falls back to English
     * - Malayalam / Malayalam Latin: returns language entry, or falls back to English
     * - Telugu / Telugu Latin: returns language entry, or falls back to English
     */
    fun getLocalizedMessage(lang: String): String {
        val enMsg = when {
            message.isNotBlank() -> message
            messageEn.isNotBlank() -> messageEn
            description.isNotBlank() -> description
            else -> title
        }

        val targetedMsg = when (lang) {
            K.TAMIL -> {
                when {
                    messageTa.isNotBlank() -> messageTa
                    descriptionTa.isNotBlank() -> descriptionTa
                    titleTa.isNotBlank() -> titleTa
                    else -> ""
                }
            }
            K.TAMIL_LATIN -> {
                when {
                    messageTaLatn.isNotBlank() -> messageTaLatn
                    messageTa.isNotBlank() -> messageTa
                    descriptionTa.isNotBlank() -> descriptionTa
                    titleTa.isNotBlank() -> titleTa
                    else -> ""
                }
            }
            K.TAMIL_MALAYALAM -> {
                when {
                    messageTa.isNotBlank() -> messageTa
                    messageMl.isNotBlank() -> messageMl
                    else -> ""
                }
            }
            K.MALAYALAM -> {
                when {
                    messageMl.isNotBlank() -> messageMl
                    else -> ""
                }
            }
            K.MALAYALAM_LATIN -> {
                when {
                    messageMlLatn.isNotBlank() -> messageMlLatn
                    messageMl.isNotBlank() -> messageMl
                    else -> ""
                }
            }
            K.MALAYALAM_TAMIL -> {
                when {
                    messageMl.isNotBlank() -> messageMl
                    messageTa.isNotBlank() -> messageTa
                    else -> ""
                }
            }
            K.TELUGU -> {
                when {
                    messageTe.isNotBlank() -> messageTe
                    else -> ""
                }
            }
            K.TELUGU_LATIN -> {
                when {
                    messageTeLatn.isNotBlank() -> messageTeLatn
                    messageTe.isNotBlank() -> messageTe
                    else -> ""
                }
            }
            else -> enMsg
        }

        return if (targetedMsg.isNotBlank()) targetedMsg else enMsg
    }

    fun getLocalizedTitle(lang: String): String = getLocalizedMessage(lang)

    fun getLocalizedDescription(lang: String): String = getLocalizedMessage(lang)

    fun getLocalizedActionText(lang: String): String {
        val isTa = lang == K.TAMIL || lang == K.TAMIL_LATIN
        if (isTa && actionTextTa.isNotBlank()) return actionTextTa
        if (actionText.isNotBlank()) return actionText
        return K.open.tr(lang)
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
            else -> raw
        }
    }
}

@Immutable
data class FeatureCardsConfig(
    val enabled: Boolean = true,
    val cards: List<FeatureCard> = emptyList()
)
