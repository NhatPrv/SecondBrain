import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.gamesService.getOrCreateProfile(req.user.id);
  }

  @Post('claim-daily')
  async claimDailyGift(@Request() req) {
    return this.gamesService.claimDailyGift(req.user.id);
  }

  @Post('farm/plant')
  async plantCrop(
    @Request() req,
    @Body('plotIndex') plotIndex: number,
    @Body('seedName') seedName: string
  ) {
    return this.gamesService.plantCrop(req.user.id, plotIndex, seedName);
  }

  @Post('farm/water')
  async waterCrop(@Request() req, @Body('plotIndex') plotIndex: number) {
    return this.gamesService.waterCrop(req.user.id, plotIndex);
  }

  @Post('farm/harvest')
  async harvestCrop(@Request() req, @Body('plotIndex') plotIndex: number) {
    return this.gamesService.harvestCrop(req.user.id, plotIndex);
  }

  @Get('animals')
  async getAnimals(@Request() req) {
    return this.gamesService.getAnimals(req.user.id);
  }

  @Post('animals/buy')
  async buyAnimal(
    @Request() req,
    @Body('animalName') animalName: string,
    @Body('name') name: string
  ) {
    return this.gamesService.buyAnimal(req.user.id, animalName, name);
  }

  @Post('animals/feed')
  async feedAnimal(@Request() req, @Body('instanceId') instanceId: string) {
    return this.gamesService.feedAnimal(req.user.id, instanceId);
  }

  @Post('animals/collect')
  async collectAnimalResource(@Request() req, @Body('instanceId') instanceId: string) {
    return this.gamesService.collectAnimalResource(req.user.id, instanceId);
  }

  @Get('fishing')
  async getFishingData(@Request() req) {
    return this.gamesService.getFishData(req.user.id);
  }

  @Post('fishing/catch')
  async catchFish(@Request() req, @Body('locationId') locationId: number) {
    return this.gamesService.catchFish(req.user.id, locationId);
  }

  @Post('cave/enter')
  async enterCave(@Request() req) {
    return this.gamesService.enterCave(req.user.id);
  }

  @Post('cave/fight')
  async fightMonster(@Request() req, @Body('monsterId') monsterId: number) {
    return this.gamesService.fightMonster(req.user.id, monsterId);
  }

  @Get('marketplace')
  async getMarketListings() {
    return this.gamesService.getMarketListings();
  }

  @Post('marketplace/list')
  async createListing(
    @Request() req,
    @Body('itemName') itemName: string,
    @Body('price') price: number,
    @Body('qty') qty: number
  ) {
    return this.gamesService.createListing(req.user.id, itemName, price, qty);
  }

  @Post('marketplace/buy')
  async buyListing(@Request() req, @Body('listingId') listingId: string) {
    return this.gamesService.buyListing(req.user.id, listingId);
  }

  @Post('marketplace/cancel')
  async cancelListing(@Request() req, @Body('listingId') listingId: string) {
    return this.gamesService.cancelListing(req.user.id, listingId);
  }

  @Get('friends')
  async getFriendsList(@Request() req) {
    return this.gamesService.getFriendsList(req.user.id);
  }

  @Get('friends/visit/:userId')
  async visitFriendFarm(@Param('userId') friendId: string) {
    return this.gamesService.visitFriendFarm(friendId);
  }
}
