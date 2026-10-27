import { SlashCommandBuilder } from 'discord.js';

import { FollowUpEmbed, EmbedColors } from '../../utility/followUpEmbed.js';

export const data = new SlashCommandBuilder()
	.setName('roll')
	.setDescription('Roll a value from 0 to 100.')
	.addIntegerOption(option =>
		option.setName('max-value')
			.setDescription('Roll a value from 0 to this number instead.')
			.setRequired(false)
			.setMinValue(1));

export async function execute(interaction) {
	await interaction.deferReply();

	const maxValue = interaction.options.getInteger('max-value') ?? 100;
	const randomInt = Math.floor(Math.random() * (maxValue + 1));

	await interaction.followUp({
		embeds: [FollowUpEmbed(
			`Roll **${randomInt}**`,
			`<@${interaction.user.id}>`,
			EmbedColors.INFO,
		)],
	});
}