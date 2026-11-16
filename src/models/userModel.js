import { Schema, model } from 'mongoose';

const userSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	joinedOn: {
		type: Date,
		default: new Date(),
	},
	badges: [{
		badge: String,
	}],
});

export const UserModel = model('User', userSchema);