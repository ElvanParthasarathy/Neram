package com.elvan.neram

import org.junit.Test
import org.junit.Assert.*
import com.elvan.neram.ui.mozhiyaakkam.mlymToTaml

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * See [testing documentation](http://d.android.com/tools/testing).
 */
class ExampleUnitTest {
    @Test
    fun addition_isCorrect() {
        assertEquals(4, 2 + 2)
    }

    @Test
    fun mlymToTaml_transliterationRules() {
        // Consonants with chillu + virama -> ugaram
        assertEquals("எந்தாணு", mlymToTaml("എന്താണ്"))
        assertEquals("ஆணு", mlymToTaml("ആണ്"))
        assertEquals("கண்ணு", mlymToTaml("കണ്ണ്"))
        assertEquals("அவனு", mlymToTaml("അവന്"))
        assertEquals("அவரு", mlymToTaml("അവര്"))
        assertEquals("காலு", mlymToTaml("കാല്"))

        // Pure chillu characters -> pulli
        assertEquals("கண்", mlymToTaml("കൺ"))
        assertEquals("அவன்", mlymToTaml("അവൻ"))
        assertEquals("அவர்", mlymToTaml("അവർ"))
        assertEquals("கால்", mlymToTaml("കാൽ"))

        // Vallinam + virama -> ugaram (Kutriyalukaram)
        assertEquals("அது", mlymToTaml("അത്"))
        assertEquals("வீடு", mlymToTaml("വീട്"))

        // Consonants without chillu / Grantha -> pulli
        assertEquals("தமிழ்", mlymToTaml("തമിഴ്"))
        assertEquals("தாழ்", mlymToTaml("താഴ്"))
        assertEquals("பஸ்", mlymToTaml("ബസ്"))
    }
}