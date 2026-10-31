import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
	name: String,
	tag: String,
	event: String,
	captain: String,
	members: [{
		memberId: String,
	}],
	invites: [{
		memberId: String,
	}],
});

export const TeamModel = model('Team', teamSchema);