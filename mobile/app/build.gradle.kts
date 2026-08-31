import java.util.Properties
import java.io.FileInputStream

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.google.services)
}

android {
    namespace = "com.elvan.neram"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.elvan.neram"
        minSdk = 26
        targetSdk = 36
        versionCode = 18
        versionName = "2.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    val keystoreProperties = Properties()
    val keystorePropertiesFile = rootProject.file("keystore.properties")
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(FileInputStream(keystorePropertiesFile))
    }

    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
            ndk.debugSymbolLevel = "FULL"
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlin {
        compilerOptions {
            jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_11)
        }
    }
    buildFeatures {
        compose = true
    }
    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "META-INF/DEPENDENCIES"
            excludes += "META-INF/LICENSE"
            excludes += "META-INF/LICENSE.txt"
            excludes += "META-INF/license.txt"
            excludes += "META-INF/NOTICE"
            excludes += "META-INF/NOTICE.txt"
            excludes += "META-INF/notice.txt"
            excludes += "META-INF/ASL2.0"
        }
    }
}

dependencies {
    // Core Android
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    
    // Compose (BOM manages versions)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    
    // Navigation
    implementation(libs.androidx.navigation.compose)
    
    // ViewModel
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    
    // Room (Local Database)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    
    // Firebase (BOM manages versions)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth.ktx)
    implementation(libs.firebase.database.ktx)

    implementation(libs.firebase.firestore.ktx)
    
    // DataStore (Preferences)
    implementation(libs.androidx.datastore.preferences)
    
    // Gson (JSON Parsing)
    implementation(libs.gson)
    
    // Coil (Image Loading)
    implementation(libs.coil.compose)
    
    // Immutable Collections (Performance)
    implementation(libs.kotlinx.collections.immutable)
    
    // Kotlinx DateTime (for XCalendar)
    implementation(libs.kotlinx.datetime)
    
    // Jsoup (HTML Parsing)
    implementation(libs.jsoup)
    
    // Google Sign-In
    implementation(libs.play.services.auth)

    // Google Maps
    implementation(libs.maps.compose)
    implementation(libs.play.services.maps)
    
    // Splash Screen API (Android 12+)
    implementation("androidx.core:core-splashscreen:1.0.1")
    
    // Testing

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    // PDF Viewer
    // PDF Viewer
    implementation("io.github.oothp:android-pdf-viewer:3.2.0-beta06")

    // Natkati / Fossify Integration
    implementation(libs.fossify.commons)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.joda.time)
    
    // Google Calendar API (Removed to avoid Unverified App warning)
    // Using System Sync instead

    // In-App Updates
    implementation("com.google.android.play:app-update:2.1.0")
    implementation("com.google.android.play:app-update-ktx:2.1.0")

    // Samsung One UI / SESL dependencies (Local repository)
    implementation("io.github.tribalfs:oneui-design:0.9.4+oneui8")
    implementation("sesl.androidx.appcompat:appcompat:1.8.0+1.0.21-sesl8+rev1")
    implementation("sesl.androidx.coordinatorlayout:coordinatorlayout:1.3.0+1.0.0-sesl8+rev0")
    implementation("sesl.com.google.android.material:material:1.12.0+1.0.32-sesl8+rev3")
}

configurations.all {
    exclude(group = "androidx.core", module = "core")
    exclude(group = "androidx.core", module = "core-ktx")
    exclude(group = "sesl.androidx.core", module = "core-ktx")
    exclude(group = "androidx.appcompat", module = "appcompat")
    exclude(group = "androidx.coordinatorlayout", module = "coordinatorlayout")
    exclude(group = "com.google.android.material", module = "material")
    exclude(group = "androidx.recyclerview", module = "recyclerview")
    exclude(group = "androidx.viewpager", module = "viewpager")
    exclude(group = "androidx.viewpager2", module = "viewpager2")
    exclude(group = "androidx.drawerlayout", module = "drawerlayout")
    exclude(group = "androidx.customview", module = "customview")
    exclude(group = "androidx.slidingpanelayout", module = "slidingpanelayout")
    exclude(group = "androidx.swiperefreshlayout", module = "swiperefreshlayout")
    exclude(group = "androidx.fragment", module = "fragment")
    exclude(group = "androidx.fragment", module = "fragment-ktx")
    exclude(group = "androidx.preference", module = "preference")
    exclude(group = "androidx.preference", module = "preference-ktx")
}

tasks.withType<com.android.build.gradle.internal.tasks.CheckAarMetadataTask>().configureEach {
    enabled = false
}