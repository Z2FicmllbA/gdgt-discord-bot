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
		roleId: String,
		badgeName: String,
	}],
});

export const UserModel = model('User', userSchema);