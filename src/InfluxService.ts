import { Agent } from "http";
import { InfluxDB, Point, WriteApi } from "@influxdata/influxdb-client";
import { INFLUX_BUCKET, INFLUX_ORG, INFLUX_TOKEN, INFLUX_URL } from "./env";
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

const writeData = (data: GenericData[]) => {
  if (data.length > 0) {
    console.log(`Writing ${data.length} points to Influx`);
    getWriteApi().writePoints(mapToPoints(data));
  } else {
    console.log(`No Points to write to Influx`);
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

const mapToPoints = (generic: GenericData[]) =>
  generic.map((data) => {
    const point = new Point(data.measurement);

    point.timestamp(data.at).tag(PRIMARY_KEY, data.key);
    if (data.tags) {
      // write tags
      Object.entries(data.tags).forEach(([tagName, tagValue]) => {
        point.tag(tagName, tagValue);
      });
    }

    // write fields
    Object.entries(data.fields).forEach(
      ([fieldName, fieldValue]: [string, TypedValue]) => {
        if ("string" in fieldValue) {
          point.stringField(fieldName, fieldValue.string);
        } else if ("int" in fieldValue) {
          point.intField(fieldName, fieldValue.int);
        } else if ("float" in fieldValue) {
          point.floatField(fieldName, fieldValue.float);
        } else if ("boolean" in fieldValue) {
          point.booleanField(fieldName, fieldValue.boolean);
        } else {
          console.warn(`Unknown field type for ${fieldName}:`, fieldValue);
        }
      },
    );
    return point;
  });

export const InfluxService = { writeData, cleanupAndClose };
