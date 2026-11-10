import { Schema, model } from 'mongoose';

const eventSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	roleId: {
		type: String,
		required: true,
	},
	stages: [{
		stageName: String,
		stageOrder: Number,
	}],
	activeStage: {
		type: Number,
		default: 1,
	},
	teamSizeMin: {
		type: Number,
		default: 2,
	},
	teamSizeMax: {
		type: Number,
		default: 5,
	},
	registrationsState: {
		type: Boolean,
		default: false,
	},
	submissionsState: {
		type: Boolean,
		default: false,
	},
	archiveState: {
		type: Boolean,
		default: false,
	},
	blacklistedRoles: [{
		roleId: String,
	}],
});

export const EventModel = model('Event', eventSchema);