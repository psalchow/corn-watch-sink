interface TempSensorData {
  name: string;
  batteryMV: number;
  timeStampS: Date;
  temp: { top: number; bottom: number; mid: number; dht: number };
  humidity: number;
}

interface TempSensorMeasurement {
  atS: Date;
  sensor: string;
  device: string;
  data?: TempSensorData[];
}
