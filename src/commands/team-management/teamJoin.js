import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { ConfirmationDialog, DialogType } from '../../handlers/confirmationDialog.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { TeamModel } from '../../models/teamModel.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';
import { CreateUser } from '../../utility/userManager.js';

export const data = new SlashCommandBuilder()
	.setName('team-join')
	.setDescription('Join a team that you\'ve been invited to.')
	.addStringOption(option =>
		option.setName('tag')
			.setDescription('The tag of the team you want to join.')
			.setRequired(true));

export async function execute(interaction) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
	if (!event.registrationsState) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`The registrations phase for the event **${event.name}** is not active.`)],
		});
		return;
	}

	for (let i = 0; i < event.blacklistedRoles.length; i++) {
		if (interaction.member.roles.cache.has(event.blacklistedRoles[i].roleId)) {
			await interaction.followUp({
				embeds: [ErrorEmbed('You are blacklisted from participating in this event ' +
					`because of the role <@&${event.blacklistedRoles[i].roleId}>.`,
				)],
			});
			return;
		}
	}

	const captainCheck = await TeamModel.findOne(
		{ event: event._id, captain: interaction.user.id },
	);
	if (captainCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`You cannot join another team. Your current team: **${captainCheck.name}**.`)],
		});
		return;
	}

	const memberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': interaction.user.id },
	);
	if (memberCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`You are part of team **${memberCheck.name}**. You need to leave to join another team.`)],
		});
		return;
	}

	const teamTag = interaction.options.getString('tag').toUpperCase();
	const team = await TeamModel.findOne({
		event: event._id,
		tag: teamTag,
	});
	if (!team) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`No team was found with the tag ${teamTag}.`)],
		});
		return;
	}
	if (team.members.length >= event.teamSizeMax - 1) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`You cannot join the team **${team.name}** as it's already full.`)],
		});
		return;
	}

	await ConfirmationDialog({
		interaction: interaction,
		dialogType: DialogType.Generic,
		header: 'Confirmation',
		content: `Join the team **${team.name}** for the event **${event.name}**?\n` +
			'After joining all invites sent to you by other captains will disappear!',
		ttl: 60_000,
		callback: teamJoin,
	});
}

async function teamJoin(interaction) {
	const event = await LoadActiveEvent(interaction.guild.id);

	const teamTag = interaction.options.getString('tag').toUpperCase();
	const team = await TeamModel.findOne({
		event: event._id,
		tag: teamTag,
	});

	const member = await CreateUser(interaction.user.id);

	// TO DO: Joining the team voids all invites to this user for the respective event
	await team.invites.pull({ memberId: member._id });

	await team.members.push({ memberId: member._id });

	await team.save();
	return SuccessEmbed(`Successfully joined the team **${team.name}**.`);
}