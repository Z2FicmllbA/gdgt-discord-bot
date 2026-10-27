import { Schema, model } from 'mongoose';

const guildConfigSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	activeEvent: {
		type: String,
		default: null,
	},
});

export const GuildConfigModel = model('GuildConfig', guildConfigSchema);