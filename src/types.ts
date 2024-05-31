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
