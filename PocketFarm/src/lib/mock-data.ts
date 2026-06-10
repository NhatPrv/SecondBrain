export const player = {
  name: "Mossy",
  title: "Sprout Tender",
  level: 14,
  xp: 2840,
  xpToNext: 4000,
  gold: 8420,
  gems: 36,
  energy: 78,
  maxEnergy: 100,
  streak: 12,
  avatar: "🦊",
};

export const dailyQuests = [
  { id: 1, title: "Water 5 crops", progress: 3, goal: 5, reward: 120, type: "gold" },
  { id: 2, title: "Feed all animals", progress: 4, goal: 6, reward: 80, type: "xp" },
  { id: 3, title: "Catch a fish", progress: 1, goal: 1, reward: 1, type: "gem", done: true },
  { id: 4, title: "Visit a friend's farm", progress: 0, goal: 1, reward: 50, type: "gold" },
];

export const recentRewards = [
  { id: 1, label: "Golden Carrot", emoji: "🥕", rarity: "legendary", time: "2m ago" },
  { id: 2, label: "Pearl Shell", emoji: "🐚", rarity: "epic", time: "14m ago" },
  { id: 3, label: "Cave Crystal", emoji: "💎", rarity: "rare", time: "1h ago" },
  { id: 4, label: "Sunflower Seeds", emoji: "🌻", rarity: "common", time: "3h ago" },
];

export const notifications = [
  { id: 1, text: "Bella the cow is ready to milk!", emoji: "🐮", time: "5m" },
  { id: 2, text: "Tomatoes are fully grown", emoji: "🍅", time: "22m" },
  { id: 3, text: "Pip sent you 200 gold", emoji: "💌", time: "1h" },
];

export const stats = [
  { label: "Crops harvested", value: 1284, emoji: "🌾" },
  { label: "Fish caught", value: 142, emoji: "🎣" },
  { label: "Caves cleared", value: 17, emoji: "🗝️" },
  { label: "Friends", value: 24, emoji: "💖" },
];

export const cropPlots = Array.from({ length: 24 }).map((_, i) => {
  const states = ["empty", "seeded", "growing", "ready", "empty", "growing", "ready", "empty"];
  const crops = ["🌽", "🍓", "🥕", "🍆", "🌶️", "🌻", "🍅", "🥬"];
  const state = states[i % states.length];
  return {
    id: i,
    state,
    crop: state !== "empty" ? crops[i % crops.length] : null,
    progress: state === "growing" ? Math.floor(20 + ((i * 13) % 70)) : state === "ready" ? 100 : 0,
  };
});

export const buildings = [
  { id: 1, name: "Barn", emoji: "🏚️", level: 3 },
  { id: 2, name: "Greenhouse", emoji: "🏡", level: 2 },
  { id: 3, name: "Mill", emoji: "🌬️", level: 1 },
  { id: 4, name: "Well", emoji: "⛲", level: 4 },
];

export const decor = [
  { id: 1, emoji: "🌸" },
  { id: 2, emoji: "🪵" },
  { id: 3, emoji: "🍄" },
  { id: 4, emoji: "🪴" },
  { id: 5, emoji: "🦋" },
];

export const animals = [
  { id: 1, name: "Bella", species: "Cow", emoji: "🐮", happy: 92, fed: true, ready: true, produces: "Milk" },
  { id: 2, name: "Clucky", species: "Chicken", emoji: "🐔", happy: 78, fed: true, ready: false, produces: "Egg" },
  { id: 3, name: "Wooly", species: "Sheep", emoji: "🐑", happy: 64, fed: false, ready: false, produces: "Wool" },
  { id: 4, name: "Oink", species: "Pig", emoji: "🐷", happy: 88, fed: true, ready: true, produces: "Truffle" },
  { id: 5, name: "Hopper", species: "Rabbit", emoji: "🐰", happy: 71, fed: true, ready: false, produces: "Fur" },
  { id: 6, name: "Quack", species: "Duck", emoji: "🦆", happy: 55, fed: false, ready: false, produces: "Feather" },
];

export const fishLocations = [
  { id: 1, name: "Maple Pond", emoji: "🪷", best: "Bluegill", unlocked: true },
  { id: 2, name: "River Bend", emoji: "🌊", best: "Rainbow Trout", unlocked: true },
  { id: 3, name: "Hidden Lagoon", emoji: "🏝️", best: "Moon Fish", unlocked: true },
  { id: 4, name: "Stormy Coast", emoji: "⛈️", best: "Thunder Eel", unlocked: false },
];

export const fishCollection = [
  { id: 1, name: "Bluegill", emoji: "🐟", caught: 12, rarity: "common" },
  { id: 2, name: "Salmon", emoji: "🐠", caught: 6, rarity: "common" },
  { id: 3, name: "Rainbow Trout", emoji: "🌈", caught: 3, rarity: "rare" },
  { id: 4, name: "Moon Fish", emoji: "🌙", caught: 1, rarity: "epic" },
  { id: 5, name: "Pearl Carp", emoji: "🦪", caught: 2, rarity: "rare" },
  { id: 6, name: "Sunfish", emoji: "☀️", caught: 4, rarity: "common" },
  { id: 7, name: "Star Tuna", emoji: "⭐", caught: 0, rarity: "legendary" },
  { id: 8, name: "Coral Eel", emoji: "🪸", caught: 0, rarity: "epic" },
];

export const caveFloors = [
  { id: 1, name: "Mossy Tunnels", floor: "1-5", danger: 1, cleared: true },
  { id: 2, name: "Crystal Hollow", floor: "6-10", danger: 2, cleared: true },
  { id: 3, name: "Lava Pits", floor: "11-20", danger: 3, cleared: false },
  { id: 4, name: "Skyward Peak", floor: "21+", danger: 4, cleared: false },
];

export const monsters = [
  { id: 1, name: "Slime", emoji: "🟢", hp: 20, loot: ["💎", "🟩"] },
  { id: 2, name: "Bat", emoji: "🦇", hp: 15, loot: ["🪶"] },
  { id: 3, name: "Goblin", emoji: "👺", hp: 45, loot: ["💰", "🗡️"] },
  { id: 4, name: "Cave Troll", emoji: "👹", hp: 220, loot: ["🪙", "💎", "🛡️"], boss: true },
];

export const inventoryItems = [
  { id: 1, name: "Carrot", emoji: "🥕", qty: 24, category: "Crops", rarity: "common" },
  { id: 2, name: "Strawberry", emoji: "🍓", qty: 12, category: "Crops", rarity: "common" },
  { id: 3, name: "Milk", emoji: "🥛", qty: 8, category: "Produce", rarity: "common" },
  { id: 4, name: "Egg", emoji: "🥚", qty: 14, category: "Produce", rarity: "common" },
  { id: 5, name: "Rainbow Trout", emoji: "🌈", qty: 3, category: "Fish", rarity: "rare" },
  { id: 6, name: "Cave Crystal", emoji: "💎", qty: 5, category: "Materials", rarity: "rare" },
  { id: 7, name: "Iron Ore", emoji: "⛏️", qty: 22, category: "Materials", rarity: "common" },
  { id: 8, name: "Golden Carrot", emoji: "🥕", qty: 1, category: "Crops", rarity: "legendary" },
  { id: 9, name: "Watering Can", emoji: "🪣", qty: 1, category: "Tools", rarity: "epic" },
  { id: 10, name: "Fishing Rod", emoji: "🎣", qty: 1, category: "Tools", rarity: "rare" },
  { id: 11, name: "Wool", emoji: "🧶", qty: 6, category: "Produce", rarity: "common" },
  { id: 12, name: "Pumpkin", emoji: "🎃", qty: 3, category: "Crops", rarity: "common" },
];

export const marketItems = [
  { id: 1, name: "Tulip Bouquet", emoji: "🌷", price: 240, seller: "Lily", category: "Decor" },
  { id: 2, name: "Magic Sapling", emoji: "🌱", price: 1200, seller: "Pip", category: "Seeds" },
  { id: 3, name: "Honey Jar", emoji: "🍯", price: 380, seller: "Bea", category: "Produce" },
  { id: 4, name: "Bread Loaf", emoji: "🍞", price: 90, seller: "Oats", category: "Produce" },
  { id: 5, name: "Lantern", emoji: "🏮", price: 540, seller: "Moss", category: "Decor" },
  { id: 6, name: "Iron Pickaxe", emoji: "⛏️", price: 800, seller: "Forge", category: "Tools" },
];

export const friends = [
  { id: 1, name: "Pip", emoji: "🐸", level: 18, online: true, status: "Tending crops" },
  { id: 2, name: "Lily", emoji: "🐰", level: 22, online: true, status: "Fishing at Lagoon" },
  { id: 3, name: "Bea", emoji: "🐝", level: 11, online: false, status: "Last seen 2h ago" },
  { id: 4, name: "Oats", emoji: "🐹", level: 9, online: true, status: "Cooking" },
  { id: 5, name: "Moss", emoji: "🦔", level: 30, online: false, status: "Last seen yesterday" },
  { id: 6, name: "Forge", emoji: "🦊", level: 25, online: true, status: "In the cave" },
];

export const achievements = [
  { id: 1, name: "First Sprout", desc: "Plant your first crop", emoji: "🌱", done: true },
  { id: 2, name: "Green Thumb", desc: "Harvest 100 crops", emoji: "🌾", done: true },
  { id: 3, name: "Master Angler", desc: "Catch 50 unique fish", emoji: "🎣", done: false, progress: 28, goal: 50 },
  { id: 4, name: "Cave Conqueror", desc: "Defeat the Cave Troll", emoji: "🗡️", done: false, progress: 0, goal: 1 },
  { id: 5, name: "Best Friend", desc: "Visit 10 friends", emoji: "💖", done: true },
  { id: 6, name: "Tycoon", desc: "Earn 10,000 gold", emoji: "💰", done: false, progress: 8420, goal: 10000 },
];

export const collections = [
  { name: "Crops", owned: 18, total: 24 },
  { name: "Fish", owned: 12, total: 30 },
  { name: "Animals", owned: 6, total: 12 },
  { name: "Cave Loot", owned: 9, total: 20 },
];
