/** InfluxDB v2 URL */
const INFLUX_URL = process.env["INFLUX_URL"] || "http://localhost:8086";
/** InfluxDB authorization token */
const INFLUX_TOKEN = process.env["INFLUX_TOKEN"];
/** Organization within InfluxDB  */
const INFLUX_ORG = process.env["INFLUX_ORG"]!;
/**InfluxDB bucket used in examples  */
const INFLUX_BUCKET = process.env["INFLUX_BUCKET"]!;

/** Url of the MQTT broker*/
const MQTT_BROKER_URL = process.env["MQTT_BROKER_URL"]!;
const MQTT_USER = process.env["MQTT_USER"]!;
const MQTT_PASSWORD = process.env["MQTT_PASSWORD"]!;

export {
  INFLUX_URL,
  INFLUX_TOKEN,
  INFLUX_ORG,
  INFLUX_BUCKET,
  MQTT_BROKER_URL,
  MQTT_USER,
  MQTT_PASSWORD,
};
