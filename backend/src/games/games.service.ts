import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  // Get or create player profile and farm
  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.playerProfile.create({
        data: {
          userId,
          title: 'Sprout Tender',
          level: 1,
          xp: 0,
          xpToNext: 100,
          gold: 1000,
          gems: 10,
          energy: 100,
          maxEnergy: 100,
          streak: 1,
          avatar: '🦊',
        },
      });
    }

    let farm = await this.prisma.farm.findUnique({
      where: { userId },
      include: {
        plots: {
          include: { crop: true },
        },
      },
    });

    if (!farm) {
      farm = await this.prisma.farm.create({
        data: {
          userId,
          name: 'My Farm',
          level: 1,
        },
        include: {
          plots: {
            include: { crop: true },
          },
        },
      });

      // Create 24 plots
      const plotsData = Array.from({ length: 24 }).map((_, i) => ({
        farmId: farm.id,
        index: i,
        state: 'empty',
      }));

      await this.prisma.farmPlot.createMany({
        data: plotsData,
      });

      farm = await this.prisma.farm.findUnique({
        where: { userId },
        include: {
          plots: {
            include: { crop: true },
          },
        },
      })!;
    }

    // Refresh crop plots growth state
    await this.updatePlotsGrowth(farm.id);

    // Reload farm after plot updates
    const updatedPlots = await this.prisma.farmPlot.findMany({
      where: { farmId: farm.id },
      include: { crop: true },
      orderBy: { index: 'asc' },
    });

    const inventory = await this.prisma.inventoryItem.findMany({
      where: { userId },
    });

    const quests = await this.prisma.quest.findMany({
      where: { userId },
    });

    const achievements = await this.prisma.achievement.findMany({
      where: { userId },
    });

    // Feed default quests and achievements if empty
    if (quests.length === 0) {
      await this.prisma.quest.createMany({
        data: [
          { userId, title: 'Water 5 crops', progress: 0, goal: 5, reward: 120, type: 'gold' },
          { userId, title: 'Feed all animals', progress: 0, goal: 6, reward: 80, type: 'xp' },
          { userId, title: 'Catch a fish', progress: 0, goal: 1, reward: 1, type: 'gem' },
          { userId, title: "Visit a friend's farm", progress: 0, goal: 1, reward: 50, type: 'gold' },
        ],
      });
    }

    if (achievements.length === 0) {
      await this.prisma.achievement.createMany({
        data: [
          { userId, name: 'First Sprout', desc: 'Plant your first crop', emoji: '🌱', progress: 0, goal: 1 },
          { userId, name: 'Green Thumb', desc: 'Harvest 100 crops', emoji: '🌾', progress: 0, goal: 100 },
          { userId, name: 'Master Angler', desc: 'Catch 50 unique fish', emoji: '🎣', progress: 0, goal: 50 },
          { userId, name: 'Cave Conqueror', desc: 'Defeat the Cave Troll', emoji: '🗡️', progress: 0, goal: 1 },
          { userId, name: 'Best Friend', desc: 'Visit 10 friends', emoji: '💖', progress: 0, goal: 10 },
          { userId, name: 'Tycoon', desc: 'Earn 10,000 gold', emoji: '💰', progress: 0, goal: 10000 },
        ],
      });
    }

    // Load recent rewards (mocked or from log history)
    const recentRewards = [
      { id: '1', label: 'Golden Carrot', emoji: '🥕', rarity: 'legendary', time: '2m ago' },
      { id: '2', label: 'Pearl Shell', emoji: '🐚', rarity: 'epic', time: '14m ago' },
      { id: '3', label: 'Cave Crystal', emoji: '💎', rarity: 'rare', time: '1h ago' },
    ];

    // Build stats
    const harvestAch = await this.prisma.achievement.findFirst({
      where: { userId, name: 'Green Thumb' },
    });
    const harvestCount = harvestAch?.progress || 0;

    const fishAch = await this.prisma.achievement.findFirst({
      where: { userId, name: 'Master Angler' },
    });
    const fishCount = fishAch?.progress || 0;

    const friendCount = await this.prisma.friendship.count({
      where: {
        OR: [{ userId }, { friendId: userId }],
      },
    });

    const stats = [
      { label: 'Crops harvested', value: harvestCount, emoji: '🌾' },
      { label: 'Fish caught', value: fishCount, emoji: '🎣' },
      { label: 'Caves cleared', value: 3, emoji: '🗝️' },
      { label: 'Friends', value: friendCount, emoji: '💖' },
    ];

    return {
      player: profile,
      farm: { ...farm, plots: updatedPlots },
      inventory,
      quests: await this.prisma.quest.findMany({ where: { userId } }),
      achievements: await this.prisma.achievement.findMany({ where: { userId } }),
      recentRewards,
      stats,
    };
  }

  // Update growth state of seeded plots based on elapsed time
  private async updatePlotsGrowth(farmId: string) {
    const plots = await this.prisma.farmPlot.findMany({
      where: {
        farmId,
        state: { in: ['seeded', 'growing'] },
      },
      include: { crop: true },
    });

    const now = new Date();
    for (const plot of plots) {
      if (!plot.crop || !plot.plantedAt) continue;

      const secondsElapsed = Math.floor((now.getTime() - plot.plantedAt.getTime()) / 1000);
      if (secondsElapsed >= plot.crop.growthTimeSeconds) {
        await this.prisma.farmPlot.update({
          where: { id: plot.id },
          data: { state: 'ready' },
        });
      }
    }
  }

  // Claim daily reward
  async claimDailyGift(userId: string) {
    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Player profile not found');

    const updated = await this.prisma.playerProfile.update({
      where: { userId },
      data: {
        gold: profile.gold + 200,
        streak: profile.streak + 1,
        energy: Math.min(profile.maxEnergy, profile.energy + 30),
      },
    });

    return {
      success: true,
      goldAdded: 200,
      energyAdded: 30,
      player: updated,
    };
  }

  // Plant a seed
  async plantCrop(userId: string, plotIndex: number, cropName: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { userId },
    });
    if (!farm) throw new NotFoundException('Farm not found');

    const crop = await this.prisma.crop.findUnique({
      where: { name: cropName },
    });
    if (!crop) throw new NotFoundException('Crop catalog entry not found');

    // Verify inventory has the seed
    const inventorySeed = await this.prisma.inventoryItem.findFirst({
      where: { userId, name: `${cropName} Seeds` },
    });
    if (!inventorySeed || inventorySeed.qty < 1) {
      throw new BadRequestException(`You do not have any ${cropName} Seeds`);
    }

    const plot = await this.prisma.farmPlot.findUnique({
      where: {
        farmId_index: { farmId: farm.id, index: plotIndex },
      },
    });
    if (!plot) throw new NotFoundException('Plot index not found');
    if (plot.state !== 'empty') throw new BadRequestException('Plot is not empty');

    // Deduct seed and update plot inside transaction
    return await this.prisma.$transaction(async (tx) => {
      if (inventorySeed.qty === 1) {
        await tx.inventoryItem.delete({ where: { id: inventorySeed.id } });
      } else {
        await tx.inventoryItem.update({
          where: { id: inventorySeed.id },
          data: { qty: inventorySeed.qty - 1 },
        });
      }

      const updatedPlot = await tx.farmPlot.update({
        where: { id: plot.id },
        data: {
          state: 'seeded',
          cropId: crop.id,
          plantedAt: new Date(),
          watered: false,
        },
        include: { crop: true },
      });

      return {
        success: true,
        plot: updatedPlot,
      };
    });
  }

  // Water a crop
  async waterCrop(userId: string, plotIndex: number) {
    const farm = await this.prisma.farm.findUnique({
      where: { userId },
    });
    if (!farm) throw new NotFoundException('Farm not found');

    const plot = await this.prisma.farmPlot.findUnique({
      where: {
        farmId_index: { farmId: farm.id, index: plotIndex },
      },
    });
    if (!plot) throw new NotFoundException('Plot not found');
    if (plot.state !== 'seeded' && plot.state !== 'growing') {
      throw new BadRequestException('Nothing to water here');
    }

    const updatedPlot = await this.prisma.farmPlot.update({
      where: { id: plot.id },
      data: {
        watered: true,
        state: 'growing',
        lastWateredAt: new Date(),
      },
      include: { crop: true },
    });

    // Update quest progress
    await this.incrementQuestProgress(userId, 'Water 5 crops', 1);

    return {
      success: true,
      plot: updatedPlot,
    };
  }

  // Harvest a crop
  async harvestCrop(userId: string, plotIndex: number) {
    const farm = await this.prisma.farm.findUnique({
      where: { userId },
    });
    if (!farm) throw new NotFoundException('Farm not found');

    // Update plots growth states first
    await this.updatePlotsGrowth(farm.id);

    const plot = await this.prisma.farmPlot.findUnique({
      where: {
        farmId_index: { farmId: farm.id, index: plotIndex },
      },
      include: { crop: true },
    });
    if (!plot) throw new NotFoundException('Plot not found');
    if (plot.state !== 'ready' || !plot.crop) {
      throw new BadRequestException('Crop is not ready to harvest');
    }

    const crop = plot.crop;

    return await this.prisma.$transaction(async (tx) => {
      // Clear plot state
      const updatedPlot = await tx.farmPlot.update({
        where: { id: plot.id },
        data: {
          state: 'empty',
          cropId: null,
          plantedAt: null,
          lastWateredAt: null,
          watered: false,
        },
      });

      // Add product to inventory
      const existingInv = await tx.inventoryItem.findFirst({
        where: { userId, name: crop.name },
      });

      if (existingInv) {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { qty: existingInv.qty + 1 },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            userId,
            name: crop.name,
            emoji: crop.emoji,
            qty: 1,
            category: 'Crops',
            rarity: crop.rarity,
          },
        });
      }

      // Add player XP
      const profile = await tx.playerProfile.findUnique({ where: { userId } })!;
      let newXp = profile.xp + crop.xpReward;
      let newLevel = profile.level;
      let xpToNext = profile.xpToNext;

      if (newXp >= xpToNext) {
        newLevel += 1;
        newXp = newXp - xpToNext;
        xpToNext = Math.floor(xpToNext * 1.5);
      }

      const updatedProfile = await tx.playerProfile.update({
        where: { userId },
        data: {
          xp: newXp,
          level: newLevel,
          xpToNext,
        },
      });

      // Update achievements
      await this.incrementAchievementProgress(userId, 'Green Thumb', 1, tx);

      return {
        success: true,
        harvestedItem: crop.name,
        emoji: crop.emoji,
        xpGained: crop.xpReward,
        plot: updatedPlot,
        player: updatedProfile,
      };
    });
  }

  // Get Animals
  async getAnimals(userId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { userId },
    });
    if (!farm) throw new NotFoundException('Farm not found');

    const instances = await this.prisma.animalInstance.findMany({
      where: { farmId: farm.id },
      include: { animal: true },
    });

    const catalog = await this.prisma.animal.findMany();

    // Map instances growth / ready states
    const mappedInstances = instances.map((ins) => {
      const now = new Date();
      let ready = false;
      if (ins.fed && ins.readyAt) {
        ready = now.getTime() >= ins.readyAt.getTime();
      }
      return {
        id: ins.id,
        name: ins.name,
        species: ins.animal.species,
        emoji: ins.animal.emoji,
        happy: ins.happy,
        fed: ins.fed,
        ready,
        produces: ins.animal.produces,
      };
    });

    return {
      instances: mappedInstances,
      catalog,
    };
  }

  // Buy new animal
  async buyAnimal(userId: string, animalName: string, customName: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { userId },
    });
    if (!farm) throw new NotFoundException('Farm not found');

    const animal = await this.prisma.animal.findUnique({
      where: { name: animalName },
    });
    if (!animal) throw new NotFoundException('Animal catalog entry not found');

    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });
    if (!profile || profile.gold < animal.buyPrice) {
      throw new BadRequestException('Not enough gold to buy this animal');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Deduct gold
      const updatedProfile = await tx.playerProfile.update({
        where: { userId },
        data: { gold: profile.gold - animal.buyPrice },
      });

      // Create instance
      const newAnimal = await tx.animalInstance.create({
        data: {
          farmId: farm.id,
          animalId: animal.id,
          name: customName || animal.name,
          happy: 100,
          fed: false,
        },
      });

      return {
        success: true,
        animal: newAnimal,
        player: updatedProfile,
      };
    });
  }

  // Feed animal
  async feedAnimal(userId: string, instanceId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { userId },
    });
    if (!farm) throw new NotFoundException('Farm not found');

    const animalInstance = await this.prisma.animalInstance.findUnique({
      where: { id: instanceId },
      include: { animal: true },
    });
    if (!animalInstance || animalInstance.farmId !== farm.id) {
      throw new NotFoundException('Animal not found on your farm');
    }
    if (animalInstance.fed) throw new BadRequestException('Animal is already fed');

    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });
    if (!profile || profile.gold < animalInstance.animal.feedCost) {
      throw new BadRequestException('Not enough gold to purchase feed');
    }

    const readyAt = new Date(Date.now() + animalInstance.animal.productionTimeSeconds * 1000);

    return await this.prisma.$transaction(async (tx) => {
      // Deduct feed cost
      const updatedProfile = await tx.playerProfile.update({
        where: { userId },
        data: { gold: profile.gold - animalInstance.animal.feedCost },
      });

      const updatedInstance = await tx.animalInstance.update({
        where: { id: instanceId },
        data: {
          fed: true,
          fedAt: new Date(),
          readyAt,
        },
      });

      // Increment quests progress
      await this.incrementQuestProgress(userId, 'Feed all animals', 1);

      return {
        success: true,
        animal: updatedInstance,
        player: updatedProfile,
      };
    });
  }

  // Collect resources
  async collectAnimalResource(userId: string, instanceId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { userId },
    });
    if (!farm) throw new NotFoundException('Farm not found');

    const animalInstance = await this.prisma.animalInstance.findUnique({
      where: { id: instanceId },
      include: { animal: true },
    });
    if (!animalInstance || animalInstance.farmId !== farm.id) {
      throw new NotFoundException('Animal not found on your farm');
    }

    const now = new Date();
    if (!animalInstance.fed || !animalInstance.readyAt || now.getTime() < animalInstance.readyAt.getTime()) {
      throw new BadRequestException('Resource is not ready to collect yet');
    }

    const animal = animalInstance.animal;

    return await this.prisma.$transaction(async (tx) => {
      // Add product to inventory
      const existingInv = await tx.inventoryItem.findFirst({
        where: { userId, name: animal.produces },
      });

      if (existingInv) {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { qty: existingInv.qty + 1 },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            userId,
            name: animal.produces,
            emoji: this.getProduceEmoji(animal.produces),
            qty: 1,
            category: 'Produce',
            rarity: 'common',
          },
        });
      }

      // Reset feed status
      const updatedInstance = await tx.animalInstance.update({
        where: { id: instanceId },
        data: {
          fed: false,
          fedAt: null,
          readyAt: null,
          happy: Math.min(100, animalInstance.happy + 5),
        },
      });

      return {
        success: true,
        resource: animal.produces,
        animal: updatedInstance,
      };
    });
  }

  // Get Fish lists
  async getFishData(userId: string) {
    const locations = [
      { id: 1, name: 'Maple Pond', emoji: '🪷', best: 'Bluegill', unlocked: true },
      { id: 2, name: 'River Bend', emoji: '🌊', best: 'Rainbow Trout', unlocked: true },
      { id: 3, name: 'Hidden Lagoon', emoji: '🏝️', best: 'Moon Fish', unlocked: true },
      { id: 4, name: 'Stormy Coast', emoji: '⛈️', best: 'Thunder Eel', unlocked: false },
    ];

    const fish = await this.prisma.fish.findMany();
    return { locations, fishCollection: fish };
  }

  // Simulate Fishing Catch
  async catchFish(userId: string, locationId: number) {
    const profile = await this.prisma.playerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Player profile not found');
    if (profile.energy < 10) throw new BadRequestException('Not enough energy to fish');

    // Simulate catch based on probability weights
    const fishOptions = await this.prisma.fish.findMany();
    if (fishOptions.length === 0) throw new NotFoundException('No fish in the catalog');

    // Select randomly weighted by rarity
    const weights: Record<string, number> = { common: 0.6, rare: 0.25, epic: 0.12, legendary: 0.03 };
    const rand = Math.random();
    let targetRarity = 'common';
    if (rand < 0.03) targetRarity = 'legendary';
    else if (rand < 0.15) targetRarity = 'epic';
    else if (rand < 0.4) targetRarity = 'rare';

    let candidates = fishOptions.filter((f) => f.rarity === targetRarity);
    if (candidates.length === 0) candidates = fishOptions.filter((f) => f.rarity === 'common');

    const caught = candidates[Math.floor(Math.random() * candidates.length)];

    return await this.prisma.$transaction(async (tx) => {
      // Deduct Energy
      const updatedProfile = await tx.playerProfile.update({
        where: { userId },
        data: { energy: profile.energy - 10 },
      });

      // Add to inventory
      const existingInv = await tx.inventoryItem.findFirst({
        where: { userId, name: caught.name },
      });

      if (existingInv) {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { qty: existingInv.qty + 1 },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            userId,
            name: caught.name,
            emoji: caught.emoji,
            qty: 1,
            category: 'Fish',
            rarity: caught.rarity,
          },
        });
      }

      // Update quests progress
      await this.incrementQuestProgress(userId, 'Catch a fish', 1);

      // Update achievements
      await this.incrementAchievementProgress(userId, 'Master Angler', 1, tx);

      return {
        success: true,
        caught,
        player: updatedProfile,
      };
    });
  }

  // Cave Combat System
  async enterCave(userId: string) {
    const profile = await this.prisma.playerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    if (profile.energy < 20) throw new BadRequestException('Too tired to enter the caves');

    // Deduct entry energy
    const updated = await this.prisma.playerProfile.update({
      where: { userId },
      data: { energy: profile.energy - 20 },
    });

    return {
      success: true,
      floorName: 'Mossy Tunnels',
      floorNumber: 1,
      monster: { name: 'Slime', emoji: '🟢', hp: 20, loot: ['💎', '🟩'] },
      player: updated,
    };
  }

  async fightMonster(userId: string, monsterId: number) {
    const profile = await this.prisma.playerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    if (profile.energy < 15) throw new BadRequestException('Not enough stamina to fight');

    // Simple fight outcome logic
    const monsterNames = ['Slime', 'Bat', 'Goblin', 'Cave Troll'];
    const monsterName = monsterNames[(monsterId - 1) % monsterNames.length];
    const isBoss = monsterName === 'Cave Troll';

    const lootOptions = ['💎', '⛏️', '🪨', '🟩', '🟪', '🪙'];
    const droppedLoot = lootOptions[Math.floor(Math.random() * lootOptions.length)];

    return await this.prisma.$transaction(async (tx) => {
      // Deduct stamina
      const updatedProfile = await tx.playerProfile.update({
        where: { userId },
        data: { energy: profile.energy - 15 },
      });

      // Add loot to inventory
      const existingInv = await tx.inventoryItem.findFirst({
        where: { userId, name: droppedLoot },
      });

      if (existingInv) {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { qty: existingInv.qty + 2 },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            userId,
            name: droppedLoot,
            emoji: droppedLoot,
            qty: 2,
            category: 'Materials',
            rarity: 'common',
          },
        });
      }

      if (isBoss) {
        await this.incrementAchievementProgress(userId, 'Cave Conqueror', 1, tx);
      }

      return {
        success: true,
        monsterKilled: monsterName,
        lootGained: droppedLoot,
        qty: 2,
        player: updatedProfile,
      };
    });
  }

  // Marketplace listings
  async getMarketListings() {
    return await this.prisma.marketplaceListing.findMany({
      where: { status: 'active' },
      include: {
        seller: {
          select: { name: true, initials: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createListing(userId: string, itemName: string, price: number, qty: number) {
    if (price <= 0 || qty <= 0) throw new BadRequestException('Invalid price or quantity');

    const existingInv = await this.prisma.inventoryItem.findFirst({
      where: { userId, name: itemName },
    });
    if (!existingInv || existingInv.qty < qty) {
      throw new BadRequestException('Not enough inventory quantity to list');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Deduct from inventory
      if (existingInv.qty === qty) {
        await tx.inventoryItem.delete({ where: { id: existingInv.id } });
      } else {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { qty: existingInv.qty - qty },
        });
      }

      // Create listing
      const listing = await tx.marketplaceListing.create({
        data: {
          sellerId: userId,
          itemName,
          itemEmoji: existingInv.emoji,
          itemCategory: existingInv.category,
          itemRarity: existingInv.rarity,
          price,
          qty,
        },
      });

      return {
        success: true,
        listing,
      };
    });
  }

  async buyListing(userId: string, listingId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.status !== 'active') {
      throw new NotFoundException('Listing is no longer available');
    }
    if (listing.sellerId === userId) {
      throw new BadRequestException('You cannot buy your own listing');
    }

    const buyerProfile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });
    if (!buyerProfile || buyerProfile.gold < listing.price) {
      throw new BadRequestException('Not enough gold to complete purchase');
    }

    const sellerProfile = await this.prisma.playerProfile.findUnique({
      where: { userId: listing.sellerId },
    });

    return await this.prisma.$transaction(async (tx) => {
      // Deduct gold from buyer
      const updatedBuyer = await tx.playerProfile.update({
        where: { userId },
        data: { gold: buyerProfile.gold - listing.price },
      });

      // Add gold to seller
      if (sellerProfile) {
        await tx.playerProfile.update({
          where: { userId: listing.sellerId },
          data: { gold: sellerProfile.gold + listing.price },
        });
      }

      // Add to buyer inventory
      const existingInv = await tx.inventoryItem.findFirst({
        where: { userId, name: listing.itemName },
      });

      if (existingInv) {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { qty: existingInv.qty + listing.qty },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            userId,
            name: listing.itemName,
            emoji: listing.itemEmoji,
            qty: listing.qty,
            category: listing.itemCategory,
            rarity: listing.itemRarity,
          },
        });
      }

      // Mark listing as sold
      await tx.marketplaceListing.update({
        where: { id: listingId },
        data: { status: 'sold' },
      });

      // Update buyer tycoon achievements
      await this.incrementAchievementProgress(userId, 'Tycoon', listing.price, tx);

      return {
        success: true,
        player: updatedBuyer,
      };
    });
  }

  async cancelListing(userId: string, listingId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.status !== 'active') {
      throw new NotFoundException('Listing is not active');
    }
    if (listing.sellerId !== userId) {
      throw new BadRequestException('You do not own this listing');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Restore seller inventory
      const existingInv = await tx.inventoryItem.findFirst({
        where: { userId, name: listing.itemName },
      });

      if (existingInv) {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { qty: existingInv.qty + listing.qty },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            userId,
            name: listing.itemName,
            emoji: listing.itemEmoji,
            qty: listing.qty,
            category: listing.itemCategory,
            rarity: listing.itemRarity,
          },
        });
      }

      // Mark listing as cancelled
      await tx.marketplaceListing.update({
        where: { id: listingId },
        data: { status: 'cancelled' },
      });

      return {
        success: true,
      };
    });
  }

  // Social Friendship
  async getFriendsList(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }],
      },
      include: {
        user: {
          include: { playerProfile: true },
        },
        friend: {
          include: { playerProfile: true },
        },
      },
    });

    return friendships.map((f) => {
      const isUser = f.userId === userId;
      const otherUser = isUser ? f.friend : f.user;
      return {
        id: otherUser.id,
        name: otherUser.name,
        emoji: otherUser.playerProfile?.avatar || '🦊',
        level: otherUser.playerProfile?.level || 1,
        online: otherUser.online,
        status: otherUser.online ? 'Active' : 'Offline',
      };
    });
  }

  // Visit Friend's Farm
  async visitFriendFarm(friendId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { userId: friendId },
      include: {
        plots: {
          include: { crop: true },
          orderBy: { index: 'asc' },
        },
        animals: {
          include: { animal: true },
        },
      },
    });
    if (!farm) throw new NotFoundException('Friend farm not found');

    // Update plots growth states before displaying
    await this.updatePlotsGrowth(farm.id);

    const updatedPlots = await this.prisma.farmPlot.findMany({
      where: { farmId: farm.id },
      include: { crop: true },
      orderBy: { index: 'asc' },
    });

    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId: friendId },
    });

    return {
      farmName: farm.name,
      ownerName: profile?.avatar + ' ' + (profile?.title || 'Farmer'),
      plots: updatedPlots,
      animals: farm.animals.map((ins) => ({
        id: ins.id,
        name: ins.name,
        species: ins.animal.species,
        emoji: ins.animal.emoji,
        happy: ins.happy,
        fed: ins.fed,
        ready: ins.fed && ins.readyAt && new Date().getTime() >= ins.readyAt.getTime(),
      })),
    };
  }

  // Helpers
  private getProduceEmoji(name: string): string {
    if (name === 'Milk') return '🥛';
    if (name === 'Egg') return '🥚';
    if (name === 'Wool') return '🧶';
    if (name === 'Truffle') return '🍄';
    if (name === 'Fur') return '🪵';
    if (name === 'Feather') return '🪶';
    return '📦';
  }

  private async incrementQuestProgress(userId: string, questTitle: string, amount: number) {
    const quest = await this.prisma.quest.findFirst({
      where: { userId, title: questTitle, done: false },
    });
    if (!quest) return;

    const newProg = Math.min(quest.goal, quest.progress + amount);
    const done = newProg >= quest.goal;

    await this.prisma.$transaction(async (tx) => {
      await tx.quest.update({
        where: { id: quest.id },
        data: { progress: newProg, done },
      });

      if (done) {
        // Award quest rewards
        const profile = await tx.playerProfile.findUnique({ where: { userId } })!;
        if (quest.type === 'gold') {
          await tx.playerProfile.update({
            where: { userId },
            data: { gold: profile.gold + quest.reward },
          });
        } else if (quest.type === 'xp') {
          let newXp = profile.xp + quest.reward;
          let newLevel = profile.level;
          let xpToNext = profile.xpToNext;
          if (newXp >= xpToNext) {
            newLevel += 1;
            newXp -= xpToNext;
            xpToNext = Math.floor(xpToNext * 1.5);
          }
          await tx.playerProfile.update({
            where: { userId },
            data: { xp: newXp, level: newLevel, xpToNext },
          });
        } else if (quest.type === 'gem') {
          await tx.playerProfile.update({
            where: { userId },
            data: { gems: profile.gems + quest.reward },
          });
        }
      }
    });
  }

  private async incrementAchievementProgress(userId: string, name: string, amount: number, tx: any) {
    const ach = await tx.achievement.findFirst({
      where: { userId, name, done: false },
    });
    if (!ach) return;

    const newProg = Math.min(ach.goal, ach.progress + amount);
    const done = newProg >= ach.goal;

    await tx.achievement.update({
      where: { id: ach.id },
      data: { progress: newProg, done },
    });
  }

  // Get NPC Shop Catalog
  async getShopCatalog() {
    const crops = await this.prisma.crop.findMany({
      orderBy: { buyPrice: 'asc' },
    });
    const fish = await this.prisma.fish.findMany({
      orderBy: { baseValue: 'asc' },
    });

    const seeds = crops.map((c) => ({
      name: `${c.name} Seeds`,
      emoji: '🌱',
      price: c.buyPrice,
      category: 'Seeds',
    }));

    const produceNames = ['Milk', 'Egg', 'Wool', 'Truffle', 'Fur', 'Feather'];
    const produce = produceNames.map((name) => ({
      name,
      emoji: this.getProduceEmoji(name),
      price: this.getProduceSellPrice(name),
      category: 'Produce',
    }));

    const sellableCrops = crops.map((c) => ({
      name: c.name,
      emoji: c.emoji,
      price: c.sellPrice,
      category: 'Crops',
    }));

    const sellableFish = fish.map((f) => ({
      name: f.name,
      emoji: f.emoji,
      price: f.baseValue,
      category: 'Fish',
    }));

    return {
      buyable: [...seeds],
      sellable: [...sellableCrops, ...produce, ...sellableFish],
    };
  }

  private getProduceSellPrice(name: string): number {
    if (name === 'Milk') return 18;
    if (name === 'Egg') return 8;
    if (name === 'Wool') return 30;
    if (name === 'Truffle') return 50;
    if (name === 'Fur') return 25;
    if (name === 'Feather') return 12;
    return 5;
  }

  // Buy item from NPC Shop
  async buyShopItem(userId: string, itemName: string, qty: number) {
    if (qty <= 0) throw new BadRequestException('Quantity must be greater than zero');

    // Currently we only support buying Seeds from the shop
    if (!itemName.endsWith(' Seeds')) {
      throw new BadRequestException('Only seeds can be purchased at this shop');
    }

    const cropName = itemName.replace(' Seeds', '');
    const crop = await this.prisma.crop.findUnique({
      where: { name: cropName },
    });
    if (!crop) throw new NotFoundException('Crop catalog not found for this seed');

    const totalCost = crop.buyPrice * qty;

    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Player profile not found');
    if (profile.gold < totalCost) throw new BadRequestException('Not enough Gold to buy these items');

    return await this.prisma.$transaction(async (tx) => {
      // Deduct Gold
      const updatedProfile = await tx.playerProfile.update({
        where: { userId },
        data: { gold: profile.gold - totalCost },
      });

      // Add to inventory
      const existingInv = await tx.inventoryItem.findFirst({
        where: { userId, name: itemName },
      });

      let updatedInventoryItem;
      if (existingInv) {
        updatedInventoryItem = await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { qty: existingInv.qty + qty },
        });
      } else {
        updatedInventoryItem = await tx.inventoryItem.create({
          data: {
            userId,
            name: itemName,
            emoji: '🌱',
            qty,
            category: 'Seeds',
            rarity: crop.rarity,
          },
        });
      }

      return {
        success: true,
        player: updatedProfile,
        item: updatedInventoryItem,
        totalCost,
      };
    });
  }

  // Sell item to NPC Shop
  async sellShopItem(userId: string, itemName: string, qty: number) {
    if (qty <= 0) throw new BadRequestException('Quantity must be greater than zero');

    const existingInv = await this.prisma.inventoryItem.findFirst({
      where: { userId, name: itemName },
    });
    if (!existingInv || existingInv.qty < qty) {
      throw new BadRequestException('Not enough items in inventory to sell');
    }

    // Determine unit price
    let unitPrice = 5;
    if (existingInv.category === 'Crops') {
      const crop = await this.prisma.crop.findUnique({ where: { name: itemName } });
      if (crop) unitPrice = crop.sellPrice;
    } else if (existingInv.category === 'Fish') {
      const fish = await this.prisma.fish.findUnique({ where: { name: itemName } });
      if (fish) unitPrice = fish.baseValue;
    } else if (existingInv.category === 'Produce') {
      unitPrice = this.getProduceSellPrice(itemName);
    }

    const totalEarning = unitPrice * qty;

    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Player profile not found');

    return await this.prisma.$transaction(async (tx) => {
      // Add Gold
      const updatedProfile = await tx.playerProfile.update({
        where: { userId },
        data: { gold: profile.gold + totalEarning },
      });

      // Deduct from inventory
      if (existingInv.qty === qty) {
        await tx.inventoryItem.delete({ where: { id: existingInv.id } });
      } else {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { qty: existingInv.qty - qty },
        });
      }

      // Update tycoon achievements
      await this.incrementAchievementProgress(userId, 'Tycoon', totalEarning, tx);

      return {
        success: true,
        player: updatedProfile,
        totalEarning,
      };
    });
  }
}
