export type DailyTask = {
  id: string;
  text: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: number;
};

export type RoadmapTopic = {
  id: string;
  name: string;
  done: boolean;
};

export type Roadmap = {
  id: string;
  name: string;
  topics: RoadmapTopic[];
};

export type RoadmapsData = Roadmap[];

export const JOB_COLUMNS = [
  "Applied",
  "Ghosted",
  "Round 1 Cleared",
  "Interview Stage",
  "Offer Received",
  "Rejected",
] as const;

export type JobStatus = (typeof JOB_COLUMNS)[number];

export type Job = {
  id: string;
  company: string;
  role: string;
  appliedDate: string;
  notes: string;
  status: JobStatus;
};

export type JobsData = Job[];

export const NOTE_TAGS = ["DSA", "CN", "OOPS", "SD"] as const;
export type NoteTag = (typeof NOTE_TAGS)[number];

export type Note = {
  id: string;
  title: string;
  body: string;
  tag: NoteTag;
  date: string;
};
