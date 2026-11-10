import { Schema, model } from 'mongoose';

const entrySchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	showcaseLink: {
		type: String,
		required: true,
	},
	levelId: {
		type: String,
		required: true,
	},
	submissionDate: {
		type: Schema.Types.Date,
		required: true,
	},
	event: {
		type: String,
		required: true,
	},
	eventStage: {
		type: Number,
		required: true,
	},
	team: {
		type: Schema.Types.ObjectId,
		required: true,
	},
});

export const EntryModel = model('Entry', entrySchema);