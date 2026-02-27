import mqtt from "mqtt";
import { MQTT_BROKER_URL, MQTT_USER, MQTT_PASSWORD } from "./env";

export class MqttService<ConfigType> {
  private client: mqtt.MqttClient | undefined;
  private topicNames: string[];
  private topicConfig: [RegExp, string, ConfigType][];

  constructor(
    topicConfig: Record<string, ConfigType>,
    private readonly onMessageCallback: (
      topic: string,
      message: string,
      config: [string, ConfigType],
    ) => void,
  ) {
    this.topicNames = Object.keys(topicConfig);
    this.topicConfig = Object.entries(topicConfig).map(
      ([subscription, config]) => [
        sub2regex(subscription),
        subscription,
        config,
      ],
    );
  }

  public connect() {
    this.disconnect();

    this.client = mqtt.connect(MQTT_BROKER_URL, {
      username: MQTT_USER,
      password: MQTT_PASSWORD,
    });

    this.client.on("connect", () => {
      this.client!.subscribe(this.topicNames);
    });

    this.client.on("error", (err) => {
      console.error("MQTT Error occurred!", err);
    });

    this.client.on("message", (topic, message) => {
      console.log(`Received message on topic '${topic}'`);
      this.topicConfig.forEach(([topicRegEx, topicSub, conf]) => {
        if (topicRegEx.test(topic)) {
          // message is Buffer
          this.onMessageCallback(topic, message.toString(), [topicSub, conf]);
        }
      });
    });
  }

  public disconnect() {
    if (this.client) {
      this.client.unsubscribe(this.topicNames, (error) => {
        console.log(`Unsubscribing from topics '${this.topicNames}'`);
        if (error) {
          console.error(`Error while unsubscribing from topics:`, error);
        }
      });
      this.client.end(() => {
        console.log("Disconnected from broker.");
      });

      this.client = undefined;
    }
  }
}

const sub2regex = (topic: string): RegExp => {
  return new RegExp(
    `^${topic}\$`.replaceAll("+", "[^/]*").replace("/#", "(|/.*)"),
  );
};
