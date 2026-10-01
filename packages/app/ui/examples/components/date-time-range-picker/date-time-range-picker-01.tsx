/**
 * @exampleOf DateTimeRangePicker
 * @title DateTimeRangePicker
 * @scenario A time span with both endpoints at day+time precision (log/incident investigation windows).
 * @hint Two DateTimePickers; allDay switches to a date range
 */
import * as React from "react";

import { DateTimeRangePicker, type DateTimeRange } from "@mohou/ui";

export default function DateTimeRangePicker01Example() {
  const [dtRange, setDtRange] = React.useState<DateTimeRange>({});

  return <DateTimeRangePicker value={dtRange} onChange={setDtRange} />;
}
