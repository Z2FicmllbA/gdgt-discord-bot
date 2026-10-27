import { Schema, model } from 'mongoose';

const playerSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	badges: [{
		badge: String,
	}],
});

export const PlayerModel = model('Player', playerSchema);