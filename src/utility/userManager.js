import { UserModel } from '../models/userModel.js';

export async function CreateUser(userId) {
	let user = await UserModel.findById(userId);
	if (!user) {
		user = new UserModel({ _id: userId });
		await user.save();
	}
	return user;
}