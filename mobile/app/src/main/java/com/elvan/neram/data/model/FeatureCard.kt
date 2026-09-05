package com.elvan.neram.data.model

import androidx.compose.runtime.Immutable
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.taToMlym
import com.elvan.neram.ui.mozhiyaakkam.mlymToTaml

private fun hasTamil(text: String): Boolean = text.any { it in '\u0B80'..'\u0BFF' }
private fun hasMalayalam(text: String): Boolean = text.any { it in '\u0D00'..'\u0D7F' }

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
     * - Tamil / Tamil Latin / Tamil Malayalam: returns language entry or auto-transliterates Tamil -> Malayalam script
     * - Malayalam / Malayalam Latin / Malayalam Tamil: returns language entry or auto-transliterates Malayalam -> Tamil script
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
                    hasTamil(message) -> message
                    else -> ""
                }
            }
            K.TAMIL_LATIN -> {
                when {
                    messageTaLatn.isNotBlank() -> messageTaLatn
                    messageTa.isNotBlank() -> messageTa
                    descriptionTa.isNotBlank() -> descriptionTa
                    titleTa.isNotBlank() -> titleTa
                    hasTamil(message) -> message
                    else -> ""
                }
            }
            K.TAMIL_MALAYALAM -> {
                when {
                    messageTa.isNotBlank() -> taToMlym(messageTa)
                    descriptionTa.isNotBlank() -> taToMlym(descriptionTa)
                    titleTa.isNotBlank() -> taToMlym(titleTa)
                    hasTamil(message) -> taToMlym(message)
                    hasTamil(enMsg) -> taToMlym(enMsg)
                    messageMl.isNotBlank() -> messageMl
                    else -> ""
                }
            }
            K.MALAYALAM -> {
                when {
                    messageMl.isNotBlank() -> messageMl
                    hasMalayalam(message) -> message
                    else -> ""
                }
            }
            K.MALAYALAM_LATIN -> {
                when {
                    messageMlLatn.isNotBlank() -> messageMlLatn
                    messageMl.isNotBlank() -> messageMl
                    hasMalayalam(message) -> message
                    else -> ""
                }
            }
            K.MALAYALAM_TAMIL -> {
                when {
                    messageMl.isNotBlank() -> mlymToTaml(messageMl)
                    hasMalayalam(message) -> mlymToTaml(message)
                    hasMalayalam(enMsg) -> mlymToTaml(enMsg)
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

        val resolved = if (targetedMsg.isNotBlank()) targetedMsg else enMsg
        return when (lang) {
            K.TAMIL_MALAYALAM -> if (hasTamil(resolved)) taToMlym(resolved) else resolved
            K.MALAYALAM_TAMIL -> if (hasMalayalam(resolved)) mlymToTaml(resolved) else resolved
            else -> resolved
        }
    }

    fun getLocalizedTitle(lang: String): String {
        val targeted = when (lang) {
            K.TAMIL, K.TAMIL_LATIN -> when {
                titleTa.isNotBlank() -> titleTa
                messageTa.isNotBlank() -> messageTa
                else -> ""
            }
            K.TAMIL_MALAYALAM -> when {
                titleTa.isNotBlank() -> taToMlym(titleTa)
                messageTa.isNotBlank() -> taToMlym(messageTa)
                messageMl.isNotBlank() -> messageMl
                else -> ""
            }
            K.MALAYALAM, K.MALAYALAM_LATIN -> when {
                messageMl.isNotBlank() -> messageMl
                else -> ""
            }
            K.MALAYALAM_TAMIL -> when {
                messageMl.isNotBlank() -> mlymToTaml(messageMl)
                messageTa.isNotBlank() -> messageTa
                else -> ""
            }
            K.TELUGU, K.TELUGU_LATIN -> when {
                messageTe.isNotBlank() -> messageTe
                else -> ""
            }
            else -> ""
        }
        val baseTitle = when {
            targeted.isNotBlank() -> targeted
            title.isNotBlank() -> title
            else -> getLocalizedMessage(lang)
        }
        return when (lang) {
            K.TAMIL_MALAYALAM -> if (hasTamil(baseTitle)) taToMlym(baseTitle) else baseTitle
            K.MALAYALAM_TAMIL -> if (hasMalayalam(baseTitle)) mlymToTaml(baseTitle) else baseTitle
            else -> baseTitle
        }
    }

    fun getLocalizedDescription(lang: String): String {
        val targeted = when (lang) {
            K.TAMIL, K.TAMIL_LATIN -> when {
                descriptionTa.isNotBlank() -> descriptionTa
                messageTa.isNotBlank() -> messageTa
                else -> ""
            }
            K.TAMIL_MALAYALAM -> when {
                descriptionTa.isNotBlank() -> taToMlym(descriptionTa)
                messageTa.isNotBlank() -> taToMlym(messageTa)
                messageMl.isNotBlank() -> messageMl
                else -> ""
            }
            K.MALAYALAM, K.MALAYALAM_LATIN -> when {
                messageMl.isNotBlank() -> messageMl
                else -> ""
            }
            K.MALAYALAM_TAMIL -> when {
                messageMl.isNotBlank() -> mlymToTaml(messageMl)
                messageTa.isNotBlank() -> messageTa
                else -> ""
            }
            K.TELUGU, K.TELUGU_LATIN -> when {
                messageTe.isNotBlank() -> messageTe
                else -> ""
            }
            else -> ""
        }
        val baseDesc = when {
            targeted.isNotBlank() -> targeted
            description.isNotBlank() -> description
            else -> getLocalizedMessage(lang)
        }
        return when (lang) {
            K.TAMIL_MALAYALAM -> if (hasTamil(baseDesc)) taToMlym(baseDesc) else baseDesc
            K.MALAYALAM_TAMIL -> if (hasMalayalam(baseDesc)) mlymToTaml(baseDesc) else baseDesc
            else -> baseDesc
        }
    }

    fun getLocalizedActionText(lang: String): String {
        val isTaFamily = lang == K.TAMIL || lang == K.TAMIL_LATIN || lang == K.TAMIL_MALAYALAM
        if (isTaFamily && actionTextTa.isNotBlank()) {
            return if (lang == K.TAMIL_MALAYALAM) taToMlym(actionTextTa) else actionTextTa
        }
        if (actionText.isNotBlank()) {
            return when (lang) {
                K.TAMIL_MALAYALAM -> if (hasTamil(actionText)) taToMlym(actionText) else actionText
                K.MALAYALAM_TAMIL -> if (hasMalayalam(actionText)) mlymToTaml(actionText) else actionText
                else -> actionText
            }
        }
        return K.open.tr(lang)
    }

    fun getLocalizedBadge(lang: String): String {
        val trimmed = (if (badge.isNotBlank()) badge else type).trim()
        val rawUpper = trimmed.uppercase().replace("_", " ")
        val badgeStr = when (rawUpper) {
            "UPDATE" -> K.cardUpdate.tr(lang)
            "NEW" -> when (lang) {
                K.TAMIL -> "புதியது"
                K.TAMIL_LATIN -> "Pudhiyathu"
                K.TAMIL_MALAYALAM -> taToMlym("புதியது")
                K.MALAYALAM -> "പുതിയത്"
                K.MALAYALAM_LATIN -> "Puthiyathu"
                K.MALAYALAM_TAMIL -> mlymToTaml("പുതിയത്")
                K.TELUGU -> "కొత్తది"
                K.TELUGU_LATIN -> "Kothadhi"
                else -> "New"
            }
            "NEW UPDATE" -> when (lang) {
                K.TAMIL -> "புதிய புதுப்பிப்பு"
                K.TAMIL_LATIN -> "Pudhiya Pudhupippu"
                K.TAMIL_MALAYALAM -> taToMlym("புதிய புதுப்பிப்பு")
                K.MALAYALAM -> "പുതിയ പുതുക്കൽ"
                K.MALAYALAM_LATIN -> "Puthiya Puthukkal"
                K.MALAYALAM_TAMIL -> mlymToTaml("പുതിയ പുതുக்கல்")
                K.TELUGU -> "కొత్త నవీకరణ"
                K.TELUGU_LATIN -> "Kotha Naveekarana"
                else -> "New Update"
            }
            "ALERT" -> K.cardAlert.tr(lang)
            "NEWS" -> K.cardNews.tr(lang)
            "TIP", "TIPS" -> K.cardTip.tr(lang)
            "NOTICE" -> K.cardNotice.tr(lang)
            "FEATURE" -> K.cardFeature.tr(lang)
            else -> {
                if (trimmed.all { it.isUpperCase() || !it.isLetter() }) {
                    trimmed.lowercase().split(" ").joinToString(" ") { word ->
                        word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
                    }
                } else {
                    trimmed
                }
            }
        }
        return when (lang) {
            K.TAMIL_MALAYALAM -> if (hasTamil(badgeStr)) taToMlym(badgeStr) else badgeStr
            K.MALAYALAM_TAMIL -> if (hasMalayalam(badgeStr)) mlymToTaml(badgeStr) else badgeStr
            else -> badgeStr
        }
    }
}

@Immutable
data class FeatureCardsConfig(
    val enabled: Boolean = true,
    val cards: List<FeatureCard> = emptyList()
)
