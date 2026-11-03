import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

import { WhitelistCheck } from '../../utility/whitelistCheck.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';

export const data = new SlashCommandBuilder()
	.setName('event-blacklist-role')
	.setDescription('Blacklist a role from participating in the active event.')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addRoleOption(option =>
		option.setName('role')
			.setDescription('Enter the role like you would tag them. (f.e. @role123)')
			.setRequired(true))
	.addBooleanOption(option =>
		option.setName('state')
			.setDescription('Set to True for blacklisted; False to clear.')
			.setRequired(true));

export async function execute(interaction) {
	await interaction.deferReply();

	if (!WhitelistCheck(interaction.user.id)) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You are not whitelisted for this action.')],
		});
		return;
	}

	const event = await LoadActiveEvent(interaction.guild.id);
	if (!event) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`No active event set for the guild **${interaction.guild.name}**.`)],
		});
		return;
	}
	if (event.archiveState) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`The event **${event.name}** is archived.`)],
		});
		return;
	}

	const role = interaction.options.getRole('role');
	const roleState = interaction.options.getBoolean('state');
	if (role.id === event.roleId) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You cannot blacklist this event\'s own participant role.')],
		});
		return;
	}

	let roleExistsFlag = false;
	for (let i = 0; i < event.blacklistedRoles.length; i++) {
		if (event.blacklistedRoles[i].roleId === role.id) {
			roleExistsFlag = true;
		}
	}

	let resultMessage;
	if (roleState) {
		if (roleExistsFlag) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`The role <@&${role.id}> already is already blacklisted.`)],
			});
			return;
		}

		await event.blacklistedRoles.push({ roleId: role.id });
		resultMessage = `Successfully blacklisted the role <@&${role.id}>.`;
	}
	else {
		if (!roleExistsFlag) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`The role <@&${role.id}> isn't blacklisted from the event **${event.name}**`)],
			});
			return;
		}

		await event.blacklistedRoles.pull({ roleId: role.id });
		resultMessage = `Removed the role <@&${role.id}> from the blacklist.`;
	}

	await event.save();
	await interaction.followUp({
		embeds: [SuccessEmbed(resultMessage)],
	});
}
