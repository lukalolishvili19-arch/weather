export type VisualCrossingCondition = {
  datetime?: string;
  datetimeEpoch?: number;
  temp?: number | null;
  feelslike?: number | null;
  humidity?: number | null;
  dew?: number | null;
  precip?: number | null;
  precipprob?: number | null;
  preciptype?: string[] | null;
  snow?: number | null;
  snowdepth?: number | null;
  windspeed?: number | null;
  windgust?: number | null;
  winddir?: number | null;
  pressure?: number | null;
  cloudcover?: number | null;
  visibility?: number | null;
  uvindex?: number | null;
  conditions?: string | null;
  icon?: string | null;
  solarradiation?: number | null;
  solarenergy?: number | null;
  tempmax?: number | null;
  tempmin?: number | null;
  feelslikemax?: number | null;
  feelslikemin?: number | null;
  sunrise?: string | null;
  sunset?: string | null;
  description?: string | null;
  hours?: VisualCrossingCondition[];
};

export type VisualCrossingAlert = {
  id?: string | null;
  event?: string | null;
  headline?: string | null;
  description?: string | null;
  ends?: string | null;
  onset?: string | null;
  link?: string | null;
  severity?: string | null;
};

export type VisualCrossingTimelineResponse = {
  queryCost?: number;
  address?: string;
  resolvedAddress?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  tzoffset?: number;
  description?: string;
  days?: VisualCrossingCondition[];
  alerts?: VisualCrossingAlert[];
  currentConditions?: VisualCrossingCondition | null;
};
