import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	tag: {
		type: String,
		required: true,
	},
	event: {
		type: String,
		required: true,
	},
	captain: {
		type: String,
		required: true,
	},
	members: [{
		memberId: String,
	}],
	invites: [{
		memberId: String,
	}],
});

export const TeamModel = model('Team', teamSchema);