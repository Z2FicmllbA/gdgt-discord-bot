import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

import { ConfirmationDialog, DialogType } from '../../handlers/confirmationDialog.js';
import { WhitelistCheck } from '../../utility/whitelistCheck.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';

export const data = new SlashCommandBuilder()
	.setName('event-stage')
	.setDescription('Modify a stage for the active event. Set order to 0 to delete the stage.')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addStringOption(option =>
		option.setName('name')
			.setDescription('Name of the stage.')
			.setRequired(true))
	.addIntegerOption(option =>
		option.setName('order')
			.setDescription('Order of the stage.')
			.setRequired(true)
			.setMinValue(0));

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

	const queryName = interaction.options.getString('name');
	const queryOrder = interaction.options.getInteger('order');

	const dialog = {
		interaction: interaction,
		dialogType: DialogType.Generic,
		header: 'Confirmation',
		content: `Update the stage ${queryName} for the event **${event.name}**?`,
		ttl: 60_000,
		callback: eventStage,
	};

	if (queryOrder === 0) {
		dialog.dialogType = DialogType.Dangerous;
		dialog.header = 'WARNING';
		dialog.content = `Delete the stage ${queryName} for the event **${event.name}**?`;
	}

	await ConfirmationDialog(dialog);
}

async function eventStage(interaction) {
	const event = await LoadActiveEvent(interaction.guild.id);

	const queryName = interaction.options.getString('name');
	const queryOrder = interaction.options.getInteger('order');

	// Delete the stage
	if (queryOrder === 0) {
		await event.stages.pull({ stageName: queryName });

		await event.save();
		return SuccessEmbed(
			`Deleted the stage **${queryName}** from the event **${event.name}**.`,
		);
	}

	// Update the stage (name/order)
	for (let i = 0; i < event.stages.length; i++) {
		if (event.stages[i].stageOrder == queryOrder) {
			return SuccessEmbed(
				`The stage **${event.stages[i].stageName}** already occupies this order number.`,
			);
		}
	}
	for (let i = 0; i < event.stages.length; i++) {
		if (event.stages[i].stageName == queryName) {
			event.stages[i].stageOrder = queryOrder;

			await event.save();
			return SuccessEmbed(
				`Updated the stage **${event.stages[i].stageName}** (order: ${event.stages[i].stageOrder}) ` +
                `from the event **${event.name}**.`,
			);
		}
	}

	// Add a new stage
	event.stages.push({
		stageName: queryName,
		stageOrder: queryOrder,
	});

	await event.save();
	return SuccessEmbed(`Added the stage **${queryName}** to the event **${event.name}**.`);
}