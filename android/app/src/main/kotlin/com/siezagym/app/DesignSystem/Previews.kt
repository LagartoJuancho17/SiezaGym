package com.siezagym.app.DesignSystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.siezagym.app.Features.Home.HomeScreen
import com.siezagym.app.Features.Routines.RoutinesScreen
import com.siezagym.app.Features.Shared.*
import com.siezagym.app.Services.GymData

@Preview(name = "iOS parity · Inicio", showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun HomePreview() {
    SiezaTheme {
        Box(Modifier.fillMaxSize().background(Theme.background)) {
            HomeScreen(GymData(hasLoaded = true)) {}
            BottomNav(
                AppTab.HOME,
                {},
                Modifier.align(Alignment.BottomCenter).padding(bottom = 16.dp),
            )
        }
    }
}

@Preview(name = "iOS parity · Rutinas", showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun RoutinesPreview() {
    SiezaTheme {
        Box(Modifier.fillMaxSize().background(Theme.background)) {
            RoutinesScreen(GymData(hasLoaded = true)) {}
        }
    }
}
