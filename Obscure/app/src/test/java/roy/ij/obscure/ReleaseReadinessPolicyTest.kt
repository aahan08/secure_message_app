package roy.ij.obscure

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class ReleaseReadinessPolicyTest {
    @Test
    fun releaseBuildUsesR8Minification() {
        val gradle = File("build.gradle.kts").readText()
        val releaseBlock = gradle.substringAfter("release {").substringBefore("debug {")

        assertTrue(
            "Release builds should enable R8 minification before Play Store release",
            releaseBlock.contains("isMinifyEnabled = true")
        )
    }

    @Test
    fun notificationPermissionRequestHasInAppExplanationFirst() {
        val source = File("src/main/java/roy/ij/obscure/features/chat/ChatListScreen.kt").readText()
        val explanationDialog = source.substringAfter("AlertDialog(").substringBefore("val rooms by")

        assertTrue(
            "ChatListScreen should explain message notifications before requesting POST_NOTIFICATIONS",
            explanationDialog.contains("Stay notified")
        )
        assertTrue(
            "The system notification permission prompt should be launched from the dialog confirmation action",
            explanationDialog.contains("launcher.launch(android.Manifest.permission.POST_NOTIFICATIONS)")
        )
        assertTrue(
            "The old automatic permission launch on first composition should not remain",
            !source.contains("LaunchedEffect(Unit) {\n                launcher.launch(android.Manifest.permission.POST_NOTIFICATIONS)")
        )
    }
}
