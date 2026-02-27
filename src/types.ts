export type StringVal = { string: string };
export type IntVal = { int: number };
export type FloatVal = { float: number };
export type BooleanVal = { boolean: boolean };

export type TypedValue = StringVal | IntVal | FloatVal | BooleanVal;

export type GenericData = {
  at: Date;
  measurement: string;
  key: string;
  tags: Record<string, string> | null;
  fields: Record<string, TypedValue>;
};

export type DataTransformer = (
  topic: string,
  message: string,
) => { timeseries?: GenericData[]; lvc?: GenericData[] };
