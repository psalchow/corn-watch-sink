import mqtt from "mqtt";
import {
  MQTT_BROKER_URL,
  MQTT_USER,
  MQTT_PASSWORD,
  MQTT_TOPIC_PREFIX,
} from "./env";

export class TempSensorMqttService {
  private client: mqtt.MqttClient | undefined;
  private topicName: string = `${MQTT_TOPIC_PREFIX}/out`;

  constructor(
    private readonly onTempSensorMeasurementCallback: (
      measurement: TempSensorMeasurement,
    ) => void,
  ) {}

  public connect() {
    this.disconnect();

    this.client = mqtt.connect(MQTT_BROKER_URL, {
      username: MQTT_USER,
      password: MQTT_PASSWORD,
    });

    this.client.on("connect", () => {
      this.client!.subscribe(this.topicName);
    });

    this.client.on("error", (err) => {
      console.error("MQTT Error occurred!", err);
    });

    this.client.on("message", (topic, message) => {
      console.log(`Received message on topic '${topic}'`);
      if (topic !== this.topicName) {
        return;
      }

      // message is Buffer
      this.onTempSensorMeasurementCallback(mapToJSON(message.toString()));
    });
  }

  public disconnect() {
    if (this.client) {
      this.client.unsubscribe(this.topicName, (error) => {
        console.log(`Unsubscribing from topic '${this.topicName}'`);
        if (error) {
          console.error(
            `Error while unsubscribing from topic '${this.topicName}':`,
            error,
          );
        }
      });
      this.client.end(() => {
        console.log("Disconnected from broker.");
      });

      this.client = undefined;
    }
  }
}

const mapToJSON = (json: string): TempSensorMeasurement => JSON.parse(json);
