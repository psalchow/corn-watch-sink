import { DataTransformer, GenericData } from "../types";

const TAG_DEVICE_GROUP = "device-group";
const TAG_DEVICE = "device";
const FIELD_TEMP_TOP = "temp-top";
const FIELD_TEMP_MID = "temp-mid";
const FIELD_TEMP_BOTTOM = "temp-bottom";
const FIELD_TEMP_HUMIDITY = "temp-humidity";
const FIELD_HUMIDITY = "humidity";
const FIELD_BATTERY_VOLTAGE = "batteryMV";
const FIELD_MEASUREMENT_TIME = "measurementTimeS";

const TOPIC_SUB = "/corn-watch/sensors/+/out";

interface TempSensorData {
  name: string;
  batteryMV: number;
  timeStampS: number;
  temp: { top: number; bottom: number; mid: number; dht: number };
  humidity: number;
}

interface TempSensorMeasurement {
  atS: number;
  sensor: string;
  device: string;
  data?: TempSensorData[];
}

const TRANSFORMER: DataTransformer = (_topic: string, message: string) => {
  const measurement: TempSensorMeasurement = JSON.parse(message);

  const deviceDataPoints: GenericData[] =
    measurement.data?.map((tempData) => {
      const res: GenericData = {
        at: new Date(measurement.atS * 1000),
        measurement: measurement.sensor,
        key: tempData.name,
        tags: {
          [TAG_DEVICE_GROUP]: measurement.device,
          [TAG_DEVICE]: tempData.name,
        },
        fields: {
          [FIELD_TEMP_TOP]: { float: tempData.temp.top },
          [FIELD_TEMP_MID]: { float: tempData.temp.mid },
          [FIELD_TEMP_BOTTOM]: { float: tempData.temp.bottom },
          [FIELD_TEMP_HUMIDITY]: { float: tempData.temp.dht },
          [FIELD_BATTERY_VOLTAGE]: { uint: tempData.batteryMV },
          [FIELD_MEASUREMENT_TIME]: { uint: tempData.timeStampS },
        },
      };

      if (typeof tempData.humidity !== "undefined") {
        if (tempData.humidity > 100 || tempData.humidity < 0) {
          // Out of range. Write error or raise Alert
          console.error(
            `Received invalid humidity value for ${FIELD_HUMIDITY}: ${tempData.humidity}. It is expected to be between 0 and 100. This indicates an error occurred while reading DHT sensor.`,
          );
        } else {
          res.fields[FIELD_HUMIDITY] = { uint: tempData.humidity };
        }
      }
      return res;
    }) || [];

  return {
    timeseries: deviceDataPoints,
  };
};

export const StockSensors = { TRANSFORMER, TOPIC_SUB };
