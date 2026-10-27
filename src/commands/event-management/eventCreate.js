import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

import { ConfirmationDialog, DialogType } from '../../handlers/confirmationDialog.js';
import { WhitelistCheck } from '../../utility/whitelistCheck.js';
import { AlphanumericCheck } from '../../utility/alphanumericCheck.js';
import { EventModel } from '../../models/eventModel.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';
import { CreateParticipantRole } from '../../utility/participantRoleManager.js';

export const data = new SlashCommandBuilder()
	.setName('event-create')
	.setDescription('Create a new event.')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addStringOption(option =>
		option.setName('name')
			.setDescription('Name of the event.')
			.setRequired(true))
	.addStringOption(option =>
		option.setName('tag')
			.setDescription('Unique tag of the event (alphanumerical values only).')
			.setRequired(true))
	.addStringOption(option =>
		option.setName('default-stage')
			.setDescription('Default/first stage of the event (default: Qualifiers).'));

export async function execute(interaction) {
	await interaction.deferReply();

	if (!WhitelistCheck(interaction.user.id)) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You are not whitelisted for this action.')],
		});
		return;
	}

	const eventId = interaction.options.getString('tag').toUpperCase();
	if (!AlphanumericCheck(eventId)) {
		await interaction.followUp({
			embeds: [ErrorEmbed('The event tag can only contain alphanumeric values.')],
		});
		return;
	}
	if (await EventModel.exists({ _id: eventId })) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`An event already has the ${eventId} tag.`)],
		});
		return;
	}

	const eventName = interaction.options.getString('name');
	await ConfirmationDialog({
		interaction: interaction,
		dialogType: DialogType.Generic,
		header: 'Confirmation',
		content: `Create the event **${eventName}**?`,
		ttl: 60_000,
		callback: eventCreate,
	});
}

async function eventCreate(interaction) {
	const eventId = interaction.options.getString('tag').toUpperCase();

	const eventName = interaction.options.getString('name');
	const eventDefaultStage = interaction.options.getString('default-stage') ?? 'Qualifiers';

	const eventRole = await CreateParticipantRole(interaction, `${eventId} Participant`);

	const event = new EventModel({
		_id: eventId,
		name: eventName,
		roleId: eventRole.id,
		stages: [{
			stageName: eventDefaultStage,
			stageOrder: 1,
		}],
	});

	await event.save();
	return SuccessEmbed(
		`Successfully created the event **${eventName}** with the tag ${eventId}.\n` +
        `Participant role: <@&${eventRole.id}>`,
	);
}