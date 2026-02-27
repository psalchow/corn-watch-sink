import { InfluxService } from "./InfluxService";
import { MqttService } from "./MqttService";
import { DataTransformer } from "./types";
import { StockSensors } from "./stockSensors/transformer";
import { OutdoorSensors } from "./outdoorSensors/transformer";

const TRANSFORMERS: Record<string, DataTransformer> = {
  [StockSensors.TOPIC_SUB]: StockSensors.TRANSFORMER,
  [OutdoorSensors.TOPIC_SUB_TEMP]: OutdoorSensors.TRANSFORMER,
  [OutdoorSensors.TOPIC_SUB_HUMIDITY]: OutdoorSensors.TRANSFORMER,
};

const mqttService = new MqttService(
  TRANSFORMERS,
  (topic, message, transformerConfig) => {
    const transformer = transformerConfig[1];
    const data = transformer(topic, message);
    if (data.timeseries) {
      InfluxService.writeData(data.timeseries);
    }
  },
);

process.on("SIGINT", () => process.exit());
process.on("exit", async () => {
  mqttService.disconnect();
  await InfluxService.cleanupAndClose();
});

mqttService.connect();
