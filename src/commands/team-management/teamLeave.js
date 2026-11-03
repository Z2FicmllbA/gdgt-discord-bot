import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';
import { ConfirmationDialog, DialogType } from '../../handlers/confirmationDialog.js';
import { TeamModel } from '../../models/teamModel.js';

export const data = new SlashCommandBuilder()
	.setName('team-leave')
	.setDescription('Leave your current team.');

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

	const captainCheck = await TeamModel.findOne(
		{ event: event._id, captain: interaction.user.id },
	);
	if (captainCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You cannot leave your own team. Disband your team by using `/team-disband`')],
		});
		return;
	}

	const team = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': interaction.user.id },
	);
	if (!team) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`You are currently not part of any team for the event **${event.name}**.`)],
		});
		return;
	}

	await ConfirmationDialog({
		interaction: interaction,
		dialogType: DialogType.Dangerous,
		header: 'WARNING',
		content: `Leave the team **${team.name}** from the event **${event.name}**?`,
		ttl: 60_000,
		callback: teamLeave,
	});
}

async function teamLeave(interaction) {
	const event = await LoadActiveEvent(interaction.guild.id);

	const team = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': interaction.user.id },
	);

	await team.members.pull({ memberId: interaction.user.id });

	await team.save();
	return SuccessEmbed(`Successfully left the team **${team.name}**.`);
}