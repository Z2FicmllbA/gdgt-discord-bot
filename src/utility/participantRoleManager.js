import 'dotenv/config';

export async function CreateParticipantRole(interaction, roleName) {
	const basicRole = await interaction.guild.roles.fetch(process.env.BASIC_ROLE_ID);

	const eventRole = await interaction.guild.roles.create({
		name: roleName,
		mentionable: false,
		permissions: 0n,
	});

	const eventRolePosition = basicRole.position + 1;
	await interaction.guild.roles.setPositions([
		{ role: eventRole.id, position: eventRolePosition },
	]);

	return eventRole;
}

export async function DeleteParticipantRole(interaction, roleId) {
	try {
		await interaction.guild.roles.delete(roleId);
		return true;
	}
	catch {
		return false;
	}
}