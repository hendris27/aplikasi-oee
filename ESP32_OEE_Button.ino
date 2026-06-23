#include <WiFi.h>
#include <HTTPClient.h>

const char *ssid = "Si!X-PRODUCTION";
const char *password = "Prod26@SEK!!";
const char *serverURL = "http://192.168.62.38:3000/good?line=64";

#define INPUT_PIN 15
#define LED_WIFI 2

bool lastState = HIGH;
unsigned long lastPressTime = 0;
const unsigned long DEBOUNCE_DELAY = 500;

void setup() {
    Serial.begin(115200);
    delay(100);
    
    pinMode(INPUT_PIN, INPUT_PULLUP);
    pinMode(LED_WIFI, OUTPUT);
    
    digitalWrite(LED_WIFI, LOW);
    
    Serial.println("\n\n=== OEE ESP32 BUTTON ===");
    Serial.println("Starting WiFi...");
    WiFi.begin(ssid, password);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        digitalWrite(LED_WIFI, !digitalRead(LED_WIFI));
        Serial.print(".");
        delay(500);
        attempts++;
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        digitalWrite(LED_WIFI, HIGH);
        Serial.println("[OK] WIFI CONNECTED");
        Serial.println("IP: " + WiFi.localIP().toString());
    } else {
        digitalWrite(LED_WIFI, LOW);
        Serial.println("[ERROR] WIFI FAILED!");
    }
}

void loop() {
    bool currentState = digitalRead(INPUT_PIN);
    unsigned long currentTime = millis();

    if (lastState == HIGH && currentState == LOW && (currentTime - lastPressTime) > DEBOUNCE_DELAY) {
        Serial.println("[BUTTON] Pressed!");
        
        if (WiFi.status() == WL_CONNECTED) {
            sendRequest();
        } else {
            Serial.println("[ERROR] WiFi not connected!");
        }
        
        lastPressTime = currentTime;
        delay(100);
    }

    lastState = currentState;
}

void sendRequest() {
    HTTPClient http;
    http.setTimeout(5000);
    http.begin(serverURL);
    
    Serial.println("[HTTP] Sending GET...");
    int httpCode = http.GET();
    
    if (httpCode > 0) {
        Serial.print("[HTTP] Response code: ");
        Serial.println(httpCode);
        
        if (httpCode == HTTP_CODE_OK) {
            String response = http.getString();
            Serial.println("[HTTP] Response: " + response);
        }
    } else {
        Serial.print("[HTTP] Error: ");
        Serial.println(http.errorToString(httpCode));
    }
    
    http.end();
}
