package roy.ij.obscure

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class RealtimeMessagingPolicyTest {
    @Test
    fun socketManagerUsesWebSocketOnlyTransport() {
        val source = File("src/main/java/roy/ij/obscure/data/network/SocketManager.kt").readText()

        assertTrue(
            "Socket.IO client must force websocket transport behind the Worker load balancer",
            source.contains("transports = arrayOf(\"websocket\")")
        )
    }

    @Test
    fun outgoingMessagesUseAckBeforeMarkingSent() {
        val source = File("src/main/java/roy/ij/obscure/features/chat/ChatViewModel.kt").readText()

        assertTrue(
            "Outgoing messages need an explicit pending state before socket ack",
            source.contains("MessageStatus.SENDING")
        )
        assertTrue(
            "Outgoing messages need a failed state when socket ack fails or times out",
            source.contains("MessageStatus.FAILED")
        )
        assertTrue(
            "Text messages should wait for a socket ack helper before becoming sent",
            source.contains("sendSocketMessage(payload)")
        )
        assertFalse(
            "Socket ack must not be ignored for text messages",
            source.contains("ack ignored for now")
        )
        assertFalse(
            "Socket ack must not be ignored for media messages",
            source.contains("socket.sendMessage(payload) {}")
        )
    }
}
