import { describe, it, expect } from "vitest";
import { OutdoorSensors } from "./transformer";

describe("OutdoorSensors Transformer", () => {
  it("should have correct topic subscription patterns", () => {
    expect(OutdoorSensors.TOPIC_SUB_TEMP).toBe(
      "/corn-watch/actors/+/fan-control/status/temperature:100",
    );
    expect(OutdoorSensors.TOPIC_SUB_HUMIDITY).toBe(
      "/corn-watch/actors/+/fan-control/status/humidity:100",
    );
  });

  describe("Temperature sensor", () => {
    it("should transform valid temperature data correctly", () => {
      const topic =
        "/corn-watch/actors/outdoor-1/fan-control/status/temperature:100";
      const message = JSON.stringify({
        id: 1,
        tC: 23.5,
        tF: 74.3,
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      expect(result.timeseries).toHaveLength(1);
      const dataPoint = result.timeseries![0];

      expect(dataPoint.measurement).toBe("outdoor-temperature");
      expect(dataPoint.key).toBe("outdoor-1");
      expect(dataPoint.tags).toEqual({
        device: "outdoor-1",
      });
      expect(dataPoint.fields).toEqual({
        temp: { float: 23.5 },
      });
      expect(dataPoint.at).toBeInstanceOf(Date);
    });

    it("should handle null temperature value", () => {
      const topic =
        "/corn-watch/actors/outdoor-1/fan-control/status/temperature:100";
      const message = JSON.stringify({
        id: 1,
        tC: null,
        tF: null,
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      expect(result.timeseries).toHaveLength(0);
    });

    it("should extract device name from topic", () => {
      const topic =
        "/corn-watch/actors/my-device-123/fan-control/status/temperature:100";
      const message = JSON.stringify({
        id: 1,
        tC: 20.0,
        tF: 68.0,
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      expect(result.timeseries![0].key).toBe("my-device-123");
      expect(result.timeseries![0].tags?.device).toBe("my-device-123");
    });

    it("should handle temperature data with errors", () => {
      const topic =
        "/corn-watch/actors/outdoor-1/fan-control/status/temperature:100";
      const message = JSON.stringify({
        id: 1,
        tC: null,
        tF: null,
        errors: ["Sensor timeout"],
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      expect(result.timeseries).toHaveLength(0);
    });
  });

  describe("Humidity sensor", () => {
    it("should transform valid humidity data correctly", () => {
      const topic =
        "/corn-watch/actors/outdoor-1/fan-control/status/humidity:100";
      const message = JSON.stringify({
        id: 1,
        rh: 65.5,
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      expect(result.timeseries).toHaveLength(1);
      const dataPoint = result.timeseries![0];

      expect(dataPoint.measurement).toBe("outdoor-humidity");
      expect(dataPoint.key).toBe("outdoor-1");
      expect(dataPoint.tags).toEqual({
        device: "outdoor-1",
      });
      expect(dataPoint.fields).toEqual({
        humidity: { float: 65.5 },
      });
      expect(dataPoint.at).toBeInstanceOf(Date);
    });

    it("should handle null humidity value", () => {
      const topic =
        "/corn-watch/actors/outdoor-1/fan-control/status/humidity:100";
      const message = JSON.stringify({
        id: 1,
        rh: null,
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      expect(result.timeseries).toHaveLength(0);
    });

    it("should extract device name from topic", () => {
      const topic =
        "/corn-watch/actors/my-device-456/fan-control/status/humidity:100";
      const message = JSON.stringify({
        id: 1,
        rh: 70.0,
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      expect(result.timeseries![0].key).toBe("my-device-456");
      expect(result.timeseries![0].tags?.device).toBe("my-device-456");
    });

    it("should handle humidity data with errors", () => {
      const topic =
        "/corn-watch/actors/outdoor-1/fan-control/status/humidity:100";
      const message = JSON.stringify({
        id: 1,
        rh: null,
        errors: ["Sensor malfunction"],
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      expect(result.timeseries).toHaveLength(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle invalid topic pattern gracefully", () => {
      const topic = "/invalid/topic/pattern";
      const message = JSON.stringify({
        id: 1,
        tC: 20.0,
        tF: 68.0,
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      // Invalid topic pattern results in empty array since kind is not temperature or humidity
      expect(result.timeseries).toHaveLength(0);
    });

    it("should handle unknown sensor type", () => {
      const topic =
        "/corn-watch/actors/outdoor-1/fan-control/status/pressure:100";
      const message = JSON.stringify({
        id: 1,
        value: 1013.25,
      });

      const result = OutdoorSensors.TRANSFORMER(topic, message);

      expect(result.timeseries).toHaveLength(0);
    });
  });
});
