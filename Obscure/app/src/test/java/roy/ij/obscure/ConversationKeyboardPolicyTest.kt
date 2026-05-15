package roy.ij.obscure

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class ConversationKeyboardPolicyTest {
    @Test
    fun activityUsesOfficialImeWindowSetup() {
        val manifest = File("src/main/AndroidManifest.xml").readText()
        val mainActivity = File("src/main/java/roy/ij/obscure/MainActivity.kt").readText()

        assertTrue(
            "MainActivity should use adjustResize so Compose receives IME insets consistently",
            manifest.contains("""android:windowSoftInputMode="adjustResize"""")
        )
        assertTrue(
            "MainActivity should enable edge-to-edge before setContent",
            mainActivity.indexOf("enableEdgeToEdge()") in 0 until mainActivity.indexOf("setContent {")
        )
    }

    @Test
    fun conversationScreenUsesSingleComposerInsetBoundary() {
        val source = File("src/main/java/roy/ij/obscure/features/chat/ConversationScreen.kt").readText()
        val composerHost = source.substringAfter("private fun ConversationComposerHost(")
        val composer = source.substringAfter("fun ConversationComposer(")

        assertTrue(
            "ConversationScreen should opt Scaffold out of automatic content insets and apply them deliberately",
            source.contains("contentWindowInsets = WindowInsets(0, 0, 0, 0)")
        )
        assertTrue(
            "IME padding belongs on the composer host boundary",
            composerHost.contains(".imePadding()")
        )
        assertTrue(
            "Navigation bar padding belongs on the composer host boundary",
            composerHost.contains(".navigationBarsPadding()")
        )
        assertTrue(
            "The visible composer row/text field must not apply IME padding itself",
            !composer.substringBefore("private fun").contains(".imePadding()")
        )
    }

    @Test
    fun conversationContentProvidesComposerThroughScaffoldBottomBar() {
        val source = File("src/main/java/roy/ij/obscure/features/chat/ConversationScreen.kt").readText()
        val scaffold = source.substringAfter("Scaffold(").substringBefore(") { innerPadding ->")

        assertTrue(
            "ConversationContent should place the composer in Scaffold.bottomBar so content padding accounts for the input area",
            scaffold.contains("bottomBar =")
        )
    }
}
