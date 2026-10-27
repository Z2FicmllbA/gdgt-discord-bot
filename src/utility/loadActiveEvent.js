import { GuildConfigModel } from '../models/guildConfigModel.js';
import { EventModel } from '../models/eventModel.js';

export async function LoadActiveEvent(guildId) {
	const guildConfig = await GuildConfigModel.findById(guildId);
	const activeEvent = await EventModel.findById(guildConfig.activeEvent);
	return activeEvent;
}