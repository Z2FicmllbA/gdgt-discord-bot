import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { WhitelistCheck } from '../../utility/whitelistCheck.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';
import { ConfirmationDialog, DialogType } from '../../handlers/confirmationDialog.js';

export const data = new SlashCommandBuilder()
	.setName('event-set-active-stage')
	.setDescription('Set the given stage as active for the current event.')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption(option =>
		option.setName('order')
			.setDescription('The numerical order of the stage (double check with `/event-info`).')
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

	const stageOrder = interaction.options.getInteger('order');

	let stageName = null;
	for (let i = 0; i < event.stages.length; i++) {
		if (event.stages[i].stageOrder === stageOrder) {
			stageName = event.stages[i].stageName;
		}
	}
	if (!stageName) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`No stage found with the order ${stageOrder}.`)],
		});
		return;
	}
	if (event.activeStage === stageOrder) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`The **${stageName}** stage is already active.`)],
		});
		return;
	}

	await ConfirmationDialog({
		interaction: interaction,
		dialogType: DialogType.Generic,
		header: 'Confirmation',
		content: `Set the **${stageName}** stage as active for the event **${event.name}**?`,
		ttl: 60_000,
		callback: eventSetActiveStage,
	});
}

async function eventSetActiveStage(interaction) {
	const event = await LoadActiveEvent(interaction.guild.id);
	const stageOrder = interaction.options.getInteger('order');

	event.activeStage = stageOrder;

	await event.save();
	return SuccessEmbed(`Updated the active stage for the event **${event.name}**.`);
}