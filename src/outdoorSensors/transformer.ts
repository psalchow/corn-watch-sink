import { DataTransformer, GenericData } from "../types";

const TAG_DEVICE = "device";
const FIELD_TEMP = "temp";
const FIELD_HUMIDITY = "humidity";

const TOPIC_SUB_TEMP =
  "/corn-watch/actors/+/fan-control/status/temperature:100";
const TOPIC_SUB_HUMIDITY =
  "/corn-watch/actors/+/fan-control/status/humidity:100";

const extractorRegex = new RegExp(
  "/corn-watch/actors/([^/]+)/fan-control/status/([a-zA-Z]+):.+",
);

interface TempSensorData {
  id: number;
  tC: number | null;
  tF: number | null;
  errors?: string[];
}

interface HumiditySensorData {
  id: number;
  rh: number | null;
  errors?: string[];
}

const TRANSFORMER: DataTransformer = (topic: string, message: string) => {
  const measurement: TempSensorData | HumiditySensorData = JSON.parse(message);
  const topicData = extractorRegex.exec(topic);
  const key = (topicData && topicData[1]) || "";
  const kind = (topicData && topicData[2]) || "";

  let data: GenericData = {
    at: new Date(),
    measurement: `outdoor-${kind}`,
    key: key,
    tags: {
      [TAG_DEVICE]: key,
    },
    fields: {},
  };

  let result: GenericData[] = [];
  if (kind === "temperature") {
    const tempMesurement: TempSensorData = measurement as TempSensorData;

    if (typeof tempMesurement.tC === "number") {
      data.fields[FIELD_TEMP] = { float: tempMesurement.tC };
      result = [data];
    }
  } else if (kind === "humidity") {
    const humidityMeasurement: HumiditySensorData =
      measurement as HumiditySensorData;

    if (typeof humidityMeasurement.rh === "number") {
      data.fields[FIELD_HUMIDITY] = { float: humidityMeasurement.rh };
      result = [data];
    }
  }

  return {
    timeseries: result,
  };
};

export const OutdoorSensors = {
  TRANSFORMER,
  TOPIC_SUB_TEMP,
  TOPIC_SUB_HUMIDITY,
};
