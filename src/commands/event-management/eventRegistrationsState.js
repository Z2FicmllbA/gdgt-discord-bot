import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

import { ConfirmationDialog, DialogType } from '../../handlers/confirmationDialog.js';
import { WhitelistCheck } from '../../utility/whitelistCheck.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';

export const data = new SlashCommandBuilder()
	.setName('event-registrations-state')
	.setDescription('Open/close the registrations for the active event.')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addBooleanOption(option =>
		option.setName('state')
			.setDescription('True - open; False - closed')
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

	await ConfirmationDialog({
		interaction: interaction,
		dialogType: DialogType.Generic,
		header: 'Confirmation',
		content: `Change the registrations state for the event **${event.name}**?`,
		ttl: 60_000,
		callback: eventRegistrationsState,
	});
}

async function eventRegistrationsState(interaction) {
	const event = await LoadActiveEvent(interaction.guild.id);
	const regState = interaction.options.getBoolean('state');
	event.registrationsState = regState;

	await event.save();
	const stateString = regState ? 'open' : 'closed';
	return SuccessEmbed(
		`Registrations are now **${stateString}** for the event **${event.name}**.`,
	);
}