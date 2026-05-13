package roy.ij.obscure

import org.junit.Assert.assertFalse
import org.junit.Test
import java.io.File

class ScreenshotPolicyTest {
    @Test
    fun appDoesNotBlockScreenshotsWithFlagSecure() {
        val sourceRoot = File("src/main/java")
        val kotlinSources = sourceRoot.walkTopDown()
            .filter { it.isFile && it.extension == "kt" }
            .toList()

        val filesUsingFlagSecure = kotlinSources
            .filter { it.readText().contains("FLAG_SECURE") }
            .map { it.relativeTo(sourceRoot).path }

        assertFalse(
            "Screenshots are blocked by FLAG_SECURE in: $filesUsingFlagSecure",
            filesUsingFlagSecure.isNotEmpty()
        )
    }
}
