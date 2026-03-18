import { Agent } from "http";
import { InfluxDBClient, Point } from "@influxdata/influxdb3-client";
import { INFLUX_TOKEN, INFLUX_HOST, INFLUX_DATABASE } from "./env";
import { GenericData, TypedValue } from "./types";
import { PRIMARY_KEY } from "./const";

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

let influxDBClient: InfluxDBClient | undefined;
const getInfluxDBClient = () => {
  if (!influxDBClient) {
    console.log("Creating Influx DB connection");
    influxDBClient = new InfluxDBClient({
      host: INFLUX_HOST,
      token: INFLUX_TOKEN,
      database: INFLUX_DATABASE,
      transportOptions: {
        agent: getKeepAliveAgent(),
      },
    });
  }
  return influxDBClient;
};

const writeData = async (data: GenericData[]) => {
  if (data.length > 0) {
    console.log(`Writing ${data.length} points to Influx`);
    await getInfluxDBClient().write(mapToPoints(data));
  } else {
    console.log(`No Points to write to Influx`);
  }
};

const cleanupAndClose = async () => {
  console.log("closing InfluxService...");
  await influxDBClient?.close();
  influxDBClient = undefined;
  keepAliveAgent?.destroy();
  keepAliveAgent = undefined;
  console.log("InfluxService closed");
};

export const mapToPoints = (generic: GenericData[]) =>
  generic.map((data) => {
    const point = Point.measurement(data.measurement);

    point.setTimestamp(data.at).setTag(PRIMARY_KEY, data.key);
    if (data.tags) {
      // write tags
      Object.entries(data.tags).forEach(([tagName, tagValue]) => {
        point.setTag(tagName, tagValue);
      });
    }

    // write fields
    Object.entries(data.fields).forEach(
      ([fieldName, fieldValue]: [string, TypedValue]) => {
        if ("string" in fieldValue) {
          point.setStringField(fieldName, fieldValue.string);
        } else if ("int" in fieldValue) {
          point.setIntegerField(fieldName, fieldValue.int);
        } else if ("uint" in fieldValue) {
          point.setUintegerField(fieldName, fieldValue.uint);
        } else if ("float" in fieldValue) {
          point.setFloatField(fieldName, fieldValue.float);
        } else if ("boolean" in fieldValue) {
          point.setBooleanField(fieldName, fieldValue.boolean);
        } else {
          console.warn(`Unknown field type for ${fieldName}:`, fieldValue);
        }
      },
    );
    return point;
  });

export const InfluxService = { writeData, cleanupAndClose };
