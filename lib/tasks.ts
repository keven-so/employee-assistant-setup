import { getServerSupabase } from "./supabase";

export interface Task {
  id: string;
  text: string;
  done: boolean;
  section: "now" | "this-week" | "backlog";
  position: number;
  created_at: string;
}

export interface TaskSection {
  name: string;
  slug: string;
  tasks: Task[];
}

export interface TasksData {
  sections: TaskSection[];
  stats: { total: number; done: number };
}

const SECTION_NAMES: Record<string, string> = {
  now: "Now — Immediate Actions",
  "this-week": "This Week",
  backlog: "Backlog",
};

export async function getTasks(): Promise<TasksData> {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const tasks = (data || []) as Task[];

  const sectionOrder = ["now", "this-week", "backlog"];
  const sections: TaskSection[] = sectionOrder.map((slug) => ({
    name: SECTION_NAMES[slug] || slug,
    slug,
    tasks: tasks.filter((t) => t.section === slug),
  }));

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;

  return { sections, stats: { total, done } };
}

export async function addTask(
  text: string,
  section: string
): Promise<TasksData> {
  const supabase = getServerSupabase();

  const { error } = await supabase.from("tasks").insert({
    text,
    section,
    done: false,
    position: 0,
  });

  if (error) throw new Error(error.message);
  return getTasks();
}

export async function completeTask(taskId: string): Promise<TasksData> {
  const supabase = getServerSupabase();

  const { error } = await supabase
    .from("tasks")
    .update({ done: true })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  return getTasks();
}

export async function completeTaskByText(text: string): Promise<TasksData> {
  const supabase = getServerSupabase();

  const { error } = await supabase
    .from("tasks")
    .update({ done: true })
    .eq("text", text)
    .eq("done", false);

  if (error) throw new Error(error.message);
  return getTasks();
}
