package com.taskbox

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Use a handler to delay loading the MainActivity
        Handler(Looper.getMainLooper()).postDelayed({
            // Start main activity
            startActivity(Intent(this, MainActivity::class.java))
            // Close splash activity
            finish()
        }, 2000) // 2 seconds delay
    }
} 