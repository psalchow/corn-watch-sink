import { Agent } from "http";
import { InfluxDB, Point, WriteApi } from "@influxdata/influxdb-client";
import { INFLUX_BUCKET, INFLUX_ORG, INFLUX_TOKEN, INFLUX_URL } from "./env";
import {
  FIELD_BATTERY_VOLTAGE,
  FIELD_HUMIDITY,
  FIELD_MEASUREMENT_TIME,
  FIELD_TEMP_BOTTOM,
  FIELD_TEMP_HUMIDITY,
  FIELD_TEMP_MID,
  FIELD_TEMP_TOP,
  TAG_DEVICE,
  TAG_DEVICE_GROUP,
} from "./const";

let keepAliveAgent: Agent | undefined;
const getKeepAliveAgent = () => {
  if (!keepAliveAgent) {
    console.log("Creating keep alive agent");
    keepAliveAgent = new Agent({
      keepAlive: true, // reuse existing connections
      keepAliveMsecs: 30 * 1000, // 20 seconds keep alive
    });
  }
  return keepAliveAgent;
};

let influxDB: InfluxDB | undefined;
const getInfluxDB = () => {
  if (!influxDB) {
    console.log("Creating Influx DB connection");
    influxDB = new InfluxDB({
      url: INFLUX_URL,
      token: INFLUX_TOKEN,
      transportOptions: {
        agent: getKeepAliveAgent(),
      },
    });
  }
  return influxDB;
};

let writeApi: WriteApi | undefined;
const getWriteApi = () => {
  if (!writeApi) {
    console.log("Creating write API");
    writeApi = getInfluxDB().getWriteApi(INFLUX_ORG, INFLUX_BUCKET);
  }
  return writeApi;
};

const writeTempSensorMeasurement = (
  topic: string,
  measurement: TempSensorMeasurement,
) => {
  const points = mapTempSensorMeasurementToInfluxPoints(measurement) || [];

  if (points.length > 0) {
    console.log(
      `Writing ${points.length} points to Influx measurement '${measurement.sensor}'`,
    );
    getWriteApi().writePoints(points);
  } else {
    console.log(`No Points to write for measurement '${measurement.sensor}'`);
  }
};

const cleanupAndClose = async () => {
  console.log("closing InfluxService...");
  await writeApi?.close();
  writeApi = undefined;
  influxDB = undefined;
  keepAliveAgent?.destroy();
  keepAliveAgent = undefined;
  console.log("InfluxService closed");
};

const mapTempSensorMeasurementToInfluxPoints = (
  measurement: TempSensorMeasurement,
) =>
  measurement.data?.map((tempData) => {
    const dataPoint = new Point(measurement.sensor)
      .timestamp(new Date(measurement.atS * 1000))
      .tag(TAG_DEVICE_GROUP, measurement.device)
      .tag(TAG_DEVICE, tempData.name);

    addTempField(dataPoint, FIELD_TEMP_TOP, tempData.temp.top);
    addTempField(dataPoint, FIELD_TEMP_MID, tempData.temp.mid);
    addTempField(dataPoint, FIELD_TEMP_BOTTOM, tempData.temp.bottom);
    addTempField(dataPoint, FIELD_TEMP_HUMIDITY, tempData.temp.dht);

    addHumidityField(dataPoint, FIELD_HUMIDITY, tempData.humidity);

    dataPoint
      .uintField(FIELD_BATTERY_VOLTAGE, tempData.batteryMV)
      .uintField(FIELD_MEASUREMENT_TIME, tempData.timeStampS);

    return dataPoint;
  });

const addTempField = (dataPoint: Point, fieldName: string, data?: number) => {
  if (typeof data !== "number") {
    return;
  }

  dataPoint.floatField(fieldName, data);
};

const addHumidityField = (
  dataPoint: Point,
  fieldName: string,
  data?: number,
) => {
  if (typeof data !== "number") {
    return;
  }

  if (data > 100 || data < 0) {
    // Out of range. Write error or raise Alert
    console.error(
      `Received invalid humidity value for ${fieldName}: ${data}. It is expected to be between 0 and 100. This indicates an error occurred while reading DHT sensor.`,
    );
    return;
  }

  dataPoint.uintField(fieldName, data);
};

export const InfluxService = { writeTempSensorMeasurement, cleanupAndClose };
