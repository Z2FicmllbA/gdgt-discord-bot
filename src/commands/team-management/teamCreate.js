import { SlashCommandBuilder, MessageFlags } from 'discord.js';

import { ConfirmationDialog, DialogType } from '../../handlers/confirmationDialog.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { ProfanityCheck } from '../../utility/profanityCheck.js';
import { AlphanumericCheck } from '../../utility/alphanumericCheck.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';
import { TeamModel } from '../../models/teamModel.js';

export const data = new SlashCommandBuilder()
	.setName('team-create')
	.setDescription('Create a team for the active event.')
	.addStringOption(option =>
		option.setName('name')
			.setDescription('The name of your team.')
			.setMinLength(4)
			.setMaxLength(50)
			.setRequired(true))
	.addStringOption(option =>
		option.setName('tag')
			.setDescription('The tag of your team (allowed only A-Z & 0-9).')
			.setMinLength(1)
			.setMaxLength(4)
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

	// TO DO: add checks for blacklisted roles (staff), both here and in team invites

	const captainCheck = await TeamModel.findOne(
		{ event: event._id, captain: interaction.user.id },
	);
	if (captainCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`You cannot create another team. Your current team: **${captainCheck.name}**.`)],
		});
		return;
	}

	// TO DO: check this if its working when invites are done
	const memberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.member': interaction.user.id },
	);
	if (memberCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`You are part of team **${memberCheck.name}**. You need to leave to create your own team.`)],
		});
		return;
	}

	const teamName = interaction.options.getString('name');
	const teamTag = interaction.options.getString('tag').toUpperCase();
	if (!AlphanumericCheck(teamTag)) {
		await interaction.followUp({
			embeds: [ErrorEmbed('The team tag can only contain alphanumeric values.')],
		});
		return;
	}
	if (ProfanityCheck(teamName) || ProfanityCheck(teamTag)) {
		await interaction.followUp({
			embeds: [ErrorEmbed('Profanity detected. If you think this is a mistake, contact the staff team.')],
		});
		return;
	}

	const availableNameCheck = await TeamModel.findOne(
		{ event: event._id, name: teamName },
	);
	if (availableNameCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`A team already has the **${teamName}** name for the event **${event.name}**.`)],
		});
		return;
	}
	const availableTagCheck = await TeamModel.findOne(
		{ event: event._id, tag: teamTag },
	);
	if (availableTagCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`A team already has the ${teamTag} tag for the event **${event.name}**.`)],
		});
		return;
	}

	await ConfirmationDialog({
		interaction: interaction,
		dialogType: DialogType.Generic,
		header: 'Confirmation',
		content: `Create the team **${teamName}** for the event **${event.name}**?`,
		ttl: 60_000,
		callback: teamCreate,
	});
}

async function teamCreate(interaction) {
	const event = await LoadActiveEvent(interaction.guild.id);

	const teamName = interaction.options.getString('name');
	const teamTag = interaction.options.getString('tag').toUpperCase();

	const team = new TeamModel({
		name: teamName,
		tag: teamTag,
		event: event._id,
		captain: interaction.user.id,
	});

	await team.save();
	return SuccessEmbed(`Successfully created the team **${teamName}** with the tag ${teamTag}.`);
}