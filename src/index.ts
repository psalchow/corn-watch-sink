import { InfluxService } from "./InfluxService";
import { TempSensorMqttService } from "./TempSensorMqttService";

const mqttService = new TempSensorMqttService(
  InfluxService.writeTempSensorMeasurement,
);

process.on("SIGINT", () => process.exit());
process.on("exit", async () => {
  mqttService.disconnect();
  await InfluxService.cleanupAndClose();
});

mqttService.connect();
