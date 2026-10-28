import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
	name: String,
	tag: String,
	event: String,
	captain: String,
	members: [{
		member: String,
	}],
	invites: [{
		userId: String,
	}],
});

export const TeamModel = model('Team', teamSchema);