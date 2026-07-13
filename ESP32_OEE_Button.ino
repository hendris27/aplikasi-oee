#include <WiFi.h>
#include <HTTPClient.h>

const char *ssid = "Si!X-PRODUCTION";
const char *password = "Prod26@SEK!!";
const char *serverURL = "http://192.168.62.38:3000/good?line=65";

#define INPUT_PIN 15
#define LED_WIFI 2

bool lastState = HIGH;
unsigned long lastPressTime = 0;
const unsigned long DEBOUNCE_DELAY = 500;

unsigned long lastWifiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 5000;

int wifiFailCount = 0;
int httpFailCount = 0;

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(INPUT_PIN, INPUT_PULLUP);
  pinMode(LED_WIFI, OUTPUT);
  digitalWrite(LED_WIFI, LOW);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);

  connectWiFi();
}

void loop() {
  checkWiFi();

  bool currentState = digitalRead(INPUT_PIN);
  unsigned long currentTime = millis();

  if (lastState == HIGH && currentState == LOW) {
    if ((currentTime - lastPressTime) > DEBOUNCE_DELAY) {
      Serial.println("[BUTTON] Pressed");

      if (WiFi.status() == WL_CONNECTED) {
        sendRequest();
      } else {
        Serial.println("[ERROR] WiFi belum connect");
      }

      lastPressTime = currentTime;
    }
  }

  lastState = currentState;
  delay(20);
}

void connectWiFi() {
  Serial.println("[WIFI] Connecting...");
  digitalWrite(LED_WIFI, LOW);

  WiFi.disconnect(true);
  delay(500);
  WiFi.begin(ssid, password);

  unsigned long startTime = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 10000) {
    digitalWrite(LED_WIFI, !digitalRead(LED_WIFI));
    Serial.print(".");
    delay(300);
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[OK] WiFi connected");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_WIFI, HIGH);
    wifiFailCount = 0;
  } else {
    Serial.println("[ERROR] WiFi failed");
    digitalWrite(LED_WIFI, LOW);
    wifiFailCount++;
  }
}

void checkWiFi() {
  if (millis() - lastWifiCheck < WIFI_CHECK_INTERVAL) return;
  lastWifiCheck = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Lost connection, reconnecting...");
    connectWiFi();

    if (wifiFailCount >= 5) {
      Serial.println("[SYSTEM] WiFi gagal terus, restart ESP...");
      delay(1000);
      ESP.restart();
    }
  }
}

void sendRequest() {
  WiFiClient client;
  HTTPClient http;

  Serial.println("[HTTP] Sending...");
  http.setTimeout(3000);

  if (!http.begin(client, serverURL)) {
    Serial.println("[HTTP] begin failed");
    httpFailCount++;
    return;
  }

  int httpCode = http.GET();

  Serial.print("[HTTP] Code: ");
  Serial.println(httpCode);

  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("[OK] Response: " + response);
    httpFailCount = 0;
  } else {
    Serial.println("[ERROR] HTTP failed");
    httpFailCount++;
  }

  http.end();

  if (httpFailCount >= 5) {
    Serial.println("[SYSTEM] HTTP gagal terus, restart ESP...");
    delay(1000);
    ESP.restart();
  }
}
