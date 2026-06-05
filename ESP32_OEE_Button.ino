#include <WiFi.h>
#include <HTTPClient.h>

const char *ssid = "Si!X-PRODUCTION";
const char *password = "Prod26@SEK!!";

const char *serverURL = "http://192.168.62.38:3000/good?line=64";

#define INPUT_PIN 15
#define LED_WIFI 2

bool lastState = HIGH;
unsigned long lastPressTime = 0;
const unsigned long DEBOUNCE_DELAY = 500; // 500ms debounce

void setup()
{

    Serial.begin(115200);

    pinMode(INPUT_PIN, INPUT_PULLUP);

    pinMode(LED_WIFI, OUTPUT);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED)
    {

        digitalWrite(LED_WIFI, !digitalRead(LED_WIFI));

        delay(500);
    }

    digitalWrite(LED_WIFI, HIGH);

    Serial.println("WIFI CONNECTED");
}

void loop()
{

    bool currentState = digitalRead(INPUT_PIN);

    unsigned long currentTime = millis();

    if (lastState == HIGH && currentState == LOW && (currentTime - lastPressTime) > DEBOUNCE_DELAY)
    {

        HTTPClient http;

        http.begin(serverURL);

        int httpCode = http.GET();

        Serial.println(httpCode);

        http.end();

        lastPressTime = currentTime;

        delay(50); // Singkat, cuma tunggu HTTP
    }

    lastState = currentState;
}
