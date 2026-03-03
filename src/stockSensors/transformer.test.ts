import { describe, it, expect } from "vitest";
import { StockSensors } from "./transformer";

describe("StockSensors Transformer", () => {
  it("should have correct topic subscription pattern", () => {
    expect(StockSensors.TOPIC_SUB).toBe("/corn-watch/sensors/+/out");
  });

  it("should transform valid sensor data correctly", () => {
    const topic = "/corn-watch/sensors/device1/out";
    const message = JSON.stringify({
      atS: 1640000000,
      sensor: "temp-sensor",
      device: "device-group-1",
      data: [
        {
          name: "sensor-1",
          batteryMV: 3300,
          timeStampS: 1640000100,
          temp: {
            top: 25.5,
            mid: 24.3,
            bottom: 23.1,
            dht: 22.0,
          },
          humidity: 65,
        },
      ],
    });

    const result = StockSensors.TRANSFORMER(topic, message);

    expect(result.timeseries).toHaveLength(1);
    const dataPoint = result.timeseries![0];

    expect(dataPoint.at).toEqual(new Date(1640000000 * 1000));
    expect(dataPoint.measurement).toBe("temp-sensor");
    expect(dataPoint.key).toBe("sensor-1");
    expect(dataPoint.tags).toEqual({
      "device-group": "device-group-1",
      device: "sensor-1",
    });
    expect(dataPoint.fields).toEqual({
      "temp-top": { float: 25.5 },
      "temp-mid": { float: 24.3 },
      "temp-bottom": { float: 23.1 },
      "temp-humidity": { float: 22.0 },
      batteryMV: { uint: 3300 },
      measurementTimeS: { uint: 1640000100 },
      humidity: { uint: 65 },
    });
  });

  it("should transform multiple sensor data points", () => {
    const topic = "/corn-watch/sensors/device1/out";
    const message = JSON.stringify({
      atS: 1640000000,
      sensor: "temp-sensor",
      device: "device-group-1",
      data: [
        {
          name: "sensor-1",
          batteryMV: 3300,
          timeStampS: 1640000100,
          temp: { top: 25.5, mid: 24.3, bottom: 23.1, dht: 22.0 },
          humidity: 65,
        },
        {
          name: "sensor-2",
          batteryMV: 3200,
          timeStampS: 1640000200,
          temp: { top: 26.5, mid: 25.3, bottom: 24.1, dht: 23.0 },
          humidity: 70,
        },
      ],
    });

    const result = StockSensors.TRANSFORMER(topic, message);

    expect(result.timeseries).toHaveLength(2);
    expect(result.timeseries![0].key).toBe("sensor-1");
    expect(result.timeseries![1].key).toBe("sensor-2");
  });

  it("should handle missing humidity value", () => {
    const topic = "/corn-watch/sensors/device1/out";
    const message = JSON.stringify({
      atS: 1640000000,
      sensor: "temp-sensor",
      device: "device-group-1",
      data: [
        {
          name: "sensor-1",
          batteryMV: 3300,
          timeStampS: 1640000100,
          temp: { top: 25.5, mid: 24.3, bottom: 23.1, dht: 22.0 },
        },
      ],
    });

    const result = StockSensors.TRANSFORMER(topic, message);

    expect(result.timeseries).toHaveLength(1);
    expect(result.timeseries![0].fields.humidity).toBeUndefined();
  });

  it("should not include humidity when value is out of range (> 100)", () => {
    const topic = "/corn-watch/sensors/device1/out";
    const message = JSON.stringify({
      atS: 1640000000,
      sensor: "temp-sensor",
      device: "device-group-1",
      data: [
        {
          name: "sensor-1",
          batteryMV: 3300,
          timeStampS: 1640000100,
          temp: { top: 25.5, mid: 24.3, bottom: 23.1, dht: 22.0 },
          humidity: 150,
        },
      ],
    });

    const result = StockSensors.TRANSFORMER(topic, message);

    expect(result.timeseries).toHaveLength(1);
    expect(result.timeseries![0].fields.humidity).toBeUndefined();
  });

  it("should not include humidity when value is out of range (< 0)", () => {
    const topic = "/corn-watch/sensors/device1/out";
    const message = JSON.stringify({
      atS: 1640000000,
      sensor: "temp-sensor",
      device: "device-group-1",
      data: [
        {
          name: "sensor-1",
          batteryMV: 3300,
          timeStampS: 1640000100,
          temp: { top: 25.5, mid: 24.3, bottom: 23.1, dht: 22.0 },
          humidity: -10,
        },
      ],
    });

    const result = StockSensors.TRANSFORMER(topic, message);

    expect(result.timeseries).toHaveLength(1);
    expect(result.timeseries![0].fields.humidity).toBeUndefined();
  });

  it("should handle empty data array", () => {
    const topic = "/corn-watch/sensors/device1/out";
    const message = JSON.stringify({
      atS: 1640000000,
      sensor: "temp-sensor",
      device: "device-group-1",
      data: [],
    });

    const result = StockSensors.TRANSFORMER(topic, message);

    expect(result.timeseries).toHaveLength(0);
  });

  it("should handle missing data field", () => {
    const topic = "/corn-watch/sensors/device1/out";
    const message = JSON.stringify({
      atS: 1640000000,
      sensor: "temp-sensor",
      device: "device-group-1",
    });

    const result = StockSensors.TRANSFORMER(topic, message);

    expect(result.timeseries).toHaveLength(0);
  });
});
