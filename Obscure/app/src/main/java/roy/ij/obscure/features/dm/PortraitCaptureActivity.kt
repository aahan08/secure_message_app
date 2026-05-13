package roy.ij.obscure.features.dm

import android.os.Bundle
import com.journeyapps.barcodescanner.CaptureActivity

// Empty subclass that we can reference in the IntentIntegrator
class PortraitCaptureActivity : CaptureActivity(){
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }
}
