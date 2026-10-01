package com.siezagym.app

import android.app.Application
import android.graphics.drawable.Animatable
import androidx.test.core.app.ApplicationProvider
import coil3.ImageLoader
import coil3.asDrawable
import coil3.decode.DataSource
import coil3.request.ImageRequest
import coil3.request.SuccessResult
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okio.Buffer
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Comprueba descarga HTTP y decodificación animada con las dependencias reales de producción. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = Application::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class RemoteGifTest {
    @Test
    fun downloadsAndDecodesAnAnimatedGifWithoutManualComponentRegistration() = runBlocking {
        val bytes = javaClass.getResourceAsStream("/animated-test.gif")!!.use { it.readBytes() }
        val server = MockWebServer()
        server.enqueue(
            MockResponse().setHeader("Content-Type", "image/gif").setBody(Buffer().write(bytes))
        )
        server.start()
        val context = ApplicationProvider.getApplicationContext<Application>()
        val loader = ImageLoader.Builder(context).build()
        try {
            val result =
                loader.execute(
                    ImageRequest.Builder(context)
                        .data(server.url("/exercise.gif").toString())
                        .build()
                )
            assertTrue("Expected network GIF success, got $result", result is SuccessResult)
            result as SuccessResult
            assertEquals(DataSource.NETWORK, result.dataSource)
            assertTrue(result.image.asDrawable(context.resources) is Animatable)
        } finally {
            loader.shutdown()
            server.shutdown()
        }
    }
}
