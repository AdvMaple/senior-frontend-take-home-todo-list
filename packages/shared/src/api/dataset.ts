import type { User } from "../user.types";
import type {
  Dataset,
  DatasetProfile,
  DatasetSize,
  SeedTodo,
} from "./dataset.types";
import { createPrng } from "./prng";

export const DATASET_SEED = 42;

export const DATASET_SIZES: Record<DatasetProfile, DatasetSize> = {
  small: { users: 2, todos: 6 },
  demo: { users: 25, todos: 120 },
  load: { users: 1000, todos: 10000 },
};

const HOUR_MS = 3_600_000;
const SPAN_MS = 730 * 24 * HOUR_MS;
/** Fixed anchor so the same seed always gives the same timestamps. */
const ANCHOR_MS = Date.UTC(2026, 0, 1);
const START_MS = ANCHOR_MS - SPAN_MS;

const EMPTY_USER_SHARE = 0.1;
const HEAVY_USER_SHARE = 0.01;
const HEAVY_TODO_SHARE = 0.25;
const DONE_SHARE = 0.3;
/** Every 5th todo copies the previous createdAt, so ties always exist. */
const TIE_EVERY = 5;

const FIRST_NAMES = [
  "alice",
  "bob",
  "carol",
  "dave",
  "erin",
  "frank",
  "grace",
  "heidi",
  "ivan",
  "judy",
  "karl",
  "laura",
  "mike",
  "nina",
  "oscar",
  "peggy",
  "quinn",
  "ruth",
  "sam",
  "tina",
];
const LAST_NAMES = [
  "johnson",
  "smith",
  "lee",
  "brown",
  "davis",
  "miller",
  "wilson",
  "moore",
  "taylor",
  "white",
  "harris",
  "martin",
  "clark",
  "lewis",
  "walker",
  "hall",
  "young",
  "allen",
  "king",
  "wright",
];
const VERBS = [
  "Write",
  "Review",
  "Fix",
  "Plan",
  "Test",
  "Ship",
  "Clean",
  "Draft",
];
const NOUNS = [
  "report",
  "invoice",
  "release",
  "roadmap",
  "backlog",
  "ticket",
  "design",
  "docs",
];

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other] as T, items[index] as T];
  }
  return items;
}

/** Unique and valid per U-2: first_last, plus a number once the 400 name pairs are used up. */
function buildUsername(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length] ?? "user";
  const last =
    LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length] ??
    "name";
  const round = Math.floor(index / (FIRST_NAMES.length * LAST_NAMES.length));
  return round === 0 ? `${first}_${last}` : `${first}_${last}${String(round)}`;
}

function buildUsers(count: number): User[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: `user-${String(index + 1)}`,
    username: buildUsername(index),
    createdAt: new Date(
      START_MS + Math.floor((index * SPAN_MS) / count)
    ).toISOString(),
  }));
}

/** Deterministic skewed dataset: ~10% empty users, ~1% heavy users with 25% of todos. */
export function generateDataset(profile: DatasetProfile): Dataset {
  const size = DATASET_SIZES[profile];
  const random = createPrng(DATASET_SEED);
  const users = buildUsers(size.users);

  const order = shuffle(
    users.map((user) => user.id),
    random
  );
  const emptyCount = Math.floor(size.users * EMPTY_USER_SHARE);
  const heavyCount = Math.max(1, Math.floor(size.users * HEAVY_USER_SHARE));
  const heavyUsers = order.slice(emptyCount, emptyCount + heavyCount);
  const regularUsers = order.slice(emptyCount + heavyCount);

  const todos: SeedTodo[] = [];
  for (let index = 0; index < size.todos; index++) {
    const assignees = random() < HEAVY_TODO_SHARE ? heavyUsers : regularUsers;
    const previous = todos[index - 1];
    const createdAtMs =
      index % TIE_EVERY === TIE_EVERY - 1 && previous
        ? previous.createdAtMs
        : START_MS + Math.floor(random() * (SPAN_MS / HOUR_MS)) * HOUR_MS;
    todos.push({
      id: `todo-${String(index + 1)}`,
      title: `${pick(VERBS, random)} ${pick(NOUNS, random)} #${String(index + 1)}`,
      assigneeId: pick(assignees, random),
      done: random() < DONE_SHARE,
      createdAt: new Date(createdAtMs).toISOString(),
      createdAtMs,
    });
  }
  return { users, todos };
}
