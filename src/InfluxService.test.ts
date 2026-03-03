import { describe, it, expect } from "vitest";
import { mapToPoints } from "./InfluxService";
import { GenericData } from "./types";

describe("InfluxService", () => {
  describe("mapToPoints", () => {
    it("should convert GenericData with all field types to Point", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "test-measurement",
          key: "test-key",
          tags: {
            location: "home",
            sensor: "temp-1",
          },
          fields: {
            stringField: { string: "hello" },
            intField: { int: -42 },
            uintField: { uint: 100 },
            floatField: { float: 23.5 },
            booleanField: { boolean: true },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(1);
      expect(points[0]).toBeDefined();
      expect(Object.entries(points[0].fields)).toHaveLength(5);
      expect(points[0].toLineProtocol()).toEqual(
        'test-measurement,location=home,primary-key=test-key,sensor=temp-1 booleanField=T,floatField=23.5,intField=-42i,stringField="hello",uintField=100u 1704110400000000000',
      );
    });

    it("should handle multiple data points", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "measurement-1",
          key: "key-1",
          tags: null,
          fields: {
            value: { float: 1.0 },
          },
        },
        {
          at: new Date("2024-01-01T12:01:00Z"),
          measurement: "measurement-2",
          key: "key-2",
          tags: null,
          fields: {
            value: { float: 2.0 },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(2);
      expect(points[0].toLineProtocol()).toEqual(
        "measurement-1,primary-key=key-1 value=1 1704110400000000000",
      );
      expect(points[1].toLineProtocol()).toEqual(
        "measurement-2,primary-key=key-2 value=2 1704110460000000000",
      );
    });

    it("should handle data without tags", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "test-measurement",
          key: "test-key",
          tags: null,
          fields: {
            temperature: { float: 25.0 },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(1);
      expect(points[0].toLineProtocol()).toEqual(
        "test-measurement,primary-key=test-key temperature=25 1704110400000000000",
      );
    });

    it("should handle data with empty tags object", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "test-measurement",
          key: "test-key",
          tags: {},
          fields: {
            temperature: { float: 25.0 },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(1);
      expect(points[0].toLineProtocol()).toEqual(
        "test-measurement,primary-key=test-key temperature=25 1704110400000000000",
      );
    });

    it("should handle data with multiple tags", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "test-measurement",
          key: "test-key",
          tags: {
            tag1: "value1",
            tag2: "value2",
            tag3: "value3",
          },
          fields: {
            field1: { int: 42 },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(1);
      expect(points[0].toLineProtocol()).toEqual(
        "test-measurement,primary-key=test-key,tag1=value1,tag2=value2,tag3=value3 field1=42i 1704110400000000000",
      );
    });

    it("should handle empty array", () => {
      const points = mapToPoints([]);

      expect(points).toHaveLength(0);
    });

    it("should handle string field type", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "test",
          key: "key",
          tags: null,
          fields: {
            status: { string: "active" },
            name: { string: "sensor-1" },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(1);
      expect(points[0].toLineProtocol()).toEqual(
        'test,primary-key=key name="sensor-1",status="active" 1704110400000000000',
      );
    });

    it("should handle int field type with negative values", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "test",
          key: "key",
          tags: null,
          fields: {
            negative: { int: -100 },
            positive: { int: 100 },
            zero: { int: 0 },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(1);
      expect(points[0].toLineProtocol()).toEqual(
        "test,primary-key=key negative=-100i,positive=100i,zero=0i 1704110400000000000",
      );
    });

    it("should handle uint field type", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "test",
          key: "key",
          tags: null,
          fields: {
            count: { uint: 42 },
            battery: { uint: 3300 },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(1);
      expect(points[0].toLineProtocol()).toEqual(
        "test,primary-key=key battery=3300u,count=42u 1704110400000000000",
      );
    });

    it("should handle float field type", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "test",
          key: "key",
          tags: null,
          fields: {
            temperature: { float: 23.456 },
            humidity: { float: 65.5 },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(1);
      expect(points[0].toLineProtocol()).toEqual(
        "test,primary-key=key humidity=65.5,temperature=23.456 1704110400000000000",
      );
    });

    it("should handle boolean field type", () => {
      const testData: GenericData[] = [
        {
          at: new Date("2024-01-01T12:00:00Z"),
          measurement: "test",
          key: "key",
          tags: null,
          fields: {
            isActive: { boolean: true },
            hasError: { boolean: false },
          },
        },
      ];

      const points = mapToPoints(testData);

      expect(points).toHaveLength(1);
      expect(points[0].toLineProtocol()).toEqual(
        "test,primary-key=key hasError=F,isActive=T 1704110400000000000",
      );
    });
  });
});
