import 'dotenv/config';

import { UserModel } from '../models/userModel.js';

async function GetBasicRoleId(interaction) {
	return await interaction.guild.roles.fetch(process.env.BASIC_ROLE_ID);
}

export async function CreateRole(interaction, roleName) {
	const role = await interaction.guild.roles.create({
		name: roleName,
		mentionable: false,
		permissions: 0n,
	});
	return role;
}

export async function CreateParticipantRole(interaction, roleName) {
	const participantRole = await CreateRole(interaction, roleName);
	const basicRole = await GetBasicRoleId(interaction);

	await interaction.guild.roles.setPositions([
		{ role: participantRole.id, position: basicRole.position + 1 },
	]);
	return participantRole;
}

export async function CreateBadgeRole(interaction, badgeName, badgeColor) {
	const badgeRole = await CreateRole(interaction, badgeName);
	await badgeRole.edit({
		color: badgeColor,
		hoist: true,
	});
	return badgeRole;
}

export async function DeleteRole(interaction, roleId) {
	try {
		await interaction.guild.roles.delete(roleId);
		return true;
	}
	catch {
		return false;
	}
}

export async function DeleteBadge(interaction, roleId) {
	const badgedUsers = await UserModel.find({ 'badges.roleId': roleId });
	for (let i = 0; i < badgedUsers.length; i++) {
		await badgedUsers[i].badges.pull({ roleId: roleId });
	}
	await UserModel.bulkSave(badgedUsers);
	await DeleteRole(interaction, roleId);
}