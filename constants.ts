
export const MAZE_SIZE = 21;
export const CELL_SIZE = 4;
export const WALL_HEIGHT = 5;

// Movement & Stamina
export const PLAYER_SPEED = 3.2; 
export const PLAYER_RUN_SPEED = 5.5;
export const STAMINA_MAX = 100;
export const STAMINA_DRAIN_RATE = 25; // Drains moderately fast
export const STAMINA_REGEN_RATE = 10; // Regens when not running
export const RUN_NOISE_THRESHOLD = 4.0; 

// Granny AI
export const GRANNY_SPEED_CHASE = 4.8;
export const GRANNY_SPEED_WANDER = 2.5;
export const GRANNY_SPEED_INVESTIGATE = 3.5;
export const GRANNY_DETECT_RANGE = 15;
export const GRANNY_KILL_RANGE = 1.2;
export const GRANNY_HEAR_RANGE = 25;

// Interaction
export const HIDE_DISTANCE = 2.5;
export const THROW_FORCE = 15;

// Generation Chances
export const BED_SPAWN_CHANCE = 0.2; // 20% chance per room (Small)
export const TABLE_SPAWN_CHANCE = 0.5;

// Gemini Model Config
export const GEMINI_MODEL = 'gemini-2.5-flash';
