import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';

export const data = new SlashCommandBuilder()
	.setName('level-submit')
	.setDescription('Submit an entry for the current stage of the event.')
	.addStringOption(option =>
		option.setName('name')
			.setDescription('The name of your level.')
			.setMinLength(4)
			.setMaxLength(50)
			.setRequired(true))
	.addStringOption(option =>
		option.setName('id')
			.setDescription('The level\'s id on the Geometry Dash servers.')
			.setRequired(true))
	.addAttachmentOption(option =>
		option.setName('gmd-file')
			.setDescription('An external copy of your level (.gmd format). Not required.')
			.setRequired(false));

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
	if (!event.submissionsState) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`The submission phase for the event **${event.name}** is not active.`)],
		});
		return;
	}


	await interaction.followUp('submitted');
}