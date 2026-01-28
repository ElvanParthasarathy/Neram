package com.elvan.rmdneram.utils

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object EmailHelper {
    private const val TAG = "EmailHelper"

    suspend fun sendEmail(
        templateId: String,
        templateParams: Map<String, String>
    ): Boolean = withContext(Dispatchers.IO) {
        var connection: HttpURLConnection? = null
        try {
            val url = URL(EmailConfig.API_URL)
            connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("User-Agent", "RmdNeram-Android/1.0")
            connection.setRequestProperty("Origin", "https://rmdneram.web.app")
            connection.connectTimeout = 30000
            connection.readTimeout = 30000
            connection.doOutput = true
            connection.doInput = true

            // Build template_params JSON object
            val paramsJson = JSONObject()
            templateParams.forEach { (key, value) ->
                paramsJson.put(key, value)
            }

            // Build main request body
            val jsonBody = JSONObject()
            jsonBody.put("service_id", EmailConfig.SERVICE_ID)
            jsonBody.put("template_id", templateId)
            jsonBody.put("user_id", EmailConfig.PUBLIC_KEY)
            jsonBody.put("template_params", paramsJson)

            val requestBody = jsonBody.toString()
            Log.d(TAG, "Request URL: ${EmailConfig.API_URL}")
            Log.d(TAG, "Request body: $requestBody")

            // Write request
            val outputStream = connection.outputStream
            val writer = OutputStreamWriter(outputStream, Charsets.UTF_8)
            writer.write(requestBody)
            writer.flush()
            writer.close()

            val responseCode = connection.responseCode
            Log.d(TAG, "Response code: $responseCode")

            // Read response
            val inputStream = if (responseCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream
            }
            
            val reader = BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8))
            val response = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                response.append(line)
            }
            reader.close()

            Log.d(TAG, "Response body: $response")

            return@withContext responseCode == 200
        } catch (e: Exception) {
            Log.e(TAG, "Email send failed: ${e.message}", e)
            return@withContext false
        } finally {
            connection?.disconnect()
        }
    }
}
