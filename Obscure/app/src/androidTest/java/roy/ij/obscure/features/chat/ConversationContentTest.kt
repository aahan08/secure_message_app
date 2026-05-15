package roy.ij.obscure.features.chat

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class ConversationContentTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun composerDisplaysCurrentInputText() {
        composeRule.setContent {
            ConversationContent(
                uiState = ChatUiState(roomId = "room-1", loading = false),
                input = "hello secure chat",
                onInputChange = {},
                onSend = {},
                onAttach = {}
            )
        }

        composeRule.onNodeWithText("hello secure chat").assertIsDisplayed()
    }

    @Test
    fun sendButtonIsDisabledForBlankInputAndEnabledForTextInput() {
        var input by mutableStateOf("   ")

        composeRule.setContent {
            ConversationContent(
                uiState = ChatUiState(roomId = "room-1", loading = false),
                input = input,
                onInputChange = {},
                onSend = {},
                onAttach = {}
            )
        }

        composeRule.onNodeWithContentDescription("Send message").assertIsNotEnabled()

        composeRule.runOnIdle {
            input = "ready"
        }

        composeRule.onNodeWithContentDescription("Send message").assertIsEnabled()
    }

    @Test
    fun attachButtonIsClickable() {
        var clicked = false
        composeRule.setContent {
            ConversationContent(
                uiState = ChatUiState(roomId = "room-1", loading = false),
                input = "",
                onInputChange = {},
                onSend = {},
                onAttach = { clicked = true }
            )
        }

        composeRule.onNodeWithContentDescription("Attach file")
            .assertHasClickAction()
            .performClick()

        assertTrue(clicked)
    }

    @Test
    fun loadingErrorMessagesAndComposerRenderTogether() {
        composeRule.setContent {
            ConversationContent(
                uiState = ChatUiState(
                    roomId = "room-1",
                    loading = true,
                    error = "network unavailable",
                    messages = listOf(
                        ChatMessage(
                            id = "m1",
                            alias = "Rocket26",
                            text = "hii",
                            mine = false,
                            at = 1L
                        )
                    )
                ),
                input = "",
                onInputChange = {},
                onSend = {},
                onAttach = {}
            )
        }

        composeRule.onNodeWithTag("conversation_loading").assertIsDisplayed()
        composeRule.onNodeWithText("network unavailable").assertIsDisplayed()
        composeRule.onNodeWithText("hii").assertIsDisplayed()
        composeRule.onNodeWithTag("conversation_composer").assertIsDisplayed()
    }
}
