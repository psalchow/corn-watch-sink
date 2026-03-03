import { describe, it, expect, vi, beforeEach } from "vitest";
import { MqttService, sub2regex } from "./MqttService";

// Mock the mqtt module
vi.mock("mqtt", () => ({
  default: {
    connect: vi.fn(() => ({
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      end: vi.fn(),
    })),
  },
}));

// Mock env module
vi.mock("./env", () => ({
  MQTT_BROKER_URL: "mqtt://localhost:1883",
  MQTT_USER: "test-user",
  MQTT_PASSWORD: "test-password",
}));

describe("MqttService", () => {
  describe("Topic subscription pattern matching", () => {
    it("should match exact topic", () => {
      // Simulate the internal regex matching logic
      const topicPattern = "/test/topic";

      expect(sub2regex(topicPattern).test("/test/topic")).toBe(true);
      expect(sub2regex(topicPattern).test("/test/other")).toBe(false);
      expect(sub2regex(topicPattern).test("/test/topic/extra")).toBe(false);
    });

    it("should match single-level wildcard (+)", () => {
      const topicPattern = "/test/+/sensor";

      expect(sub2regex(topicPattern).test("/test/device1/sensor")).toBe(true);
      expect(sub2regex(topicPattern).test("/test/device2/sensor")).toBe(true);
      expect(sub2regex(topicPattern).test("/test/any-device/sensor")).toBe(
        true,
      );
      expect(sub2regex(topicPattern).test("/test/device1/device2/sensor")).toBe(
        false,
      );
      expect(sub2regex(topicPattern).test("/test/sensor")).toBe(false);
    });

    it("should match multi-level wildcard (#)", () => {
      const topicPattern = "/test/#";

      expect(sub2regex(topicPattern).test("/test")).toBe(true);
      expect(sub2regex(topicPattern).test("/test/")).toBe(true);
      expect(sub2regex(topicPattern).test("/test/level1")).toBe(true);
      expect(sub2regex(topicPattern).test("/test/level1/level2")).toBe(true);
      expect(sub2regex(topicPattern).test("/test/level1/level2/level3")).toBe(
        true,
      );
      expect(sub2regex(topicPattern).test("/other")).toBe(false);
    });

    it("should match pattern with colon in topic", () => {
      const topicPattern =
        "/corn-watch/actors/+/fan-control/status/temperature:100";

      expect(
        sub2regex(topicPattern).test(
          "/corn-watch/actors/outdoor-1/fan-control/status/temperature:100",
        ),
      ).toBe(true);
      expect(
        sub2regex(topicPattern).test(
          "/corn-watch/actors/outdoor-2/fan-control/status/temperature:100",
        ),
      ).toBe(true);
      expect(
        sub2regex(topicPattern).test(
          "/corn-watch/actors/outdoor-1/fan-control/status/humidity:100",
        ),
      ).toBe(false);
    });

    it("should handle multiple + wildcards", () => {
      const topicPattern = "/+/sensors/+/data";

      expect(
        sub2regex(topicPattern).test("/project1/sensors/device1/data"),
      ).toBe(true);
      expect(
        sub2regex(topicPattern).test("/project2/sensors/device2/data"),
      ).toBe(true);
      expect(sub2regex(topicPattern).test("/project1/sensors/data")).toBe(
        false,
      );
      expect(sub2regex(topicPattern).test("/sensors/device1/data")).toBe(false);
    });
  });

  describe("Service lifecycle", () => {
    let callbackMock: (
      topic: string,
      message: string,
      config: [string, string],
    ) => void;

    beforeEach(() => {
      callbackMock = vi.fn();
    });

    it("should create service instance", () => {
      const service = new MqttService(
        {
          "/test/topic": "config",
          "/topic2": "config2",
          "/topic/+/wildcard": "config3",
        },
        callbackMock,
      );

      expect(service).toBeDefined();
      expect(service.connect).toBeDefined();
      expect(service.disconnect).toBeDefined();
    });

    it("should handle disconnect when not connected", () => {
      const service = new MqttService(
        {
          "/test/topic": "config",
        },
        callbackMock,
      );

      // Should not throw when disconnecting without being connected
      expect(() => service.disconnect()).not.toThrow();
    });
  });
});
