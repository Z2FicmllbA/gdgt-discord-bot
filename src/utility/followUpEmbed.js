// i should probably rename this :/

import { EmbedBuilder } from 'discord.js';

export const EmbedColors = {
	SUCCESS: '#4CAF50',
	ERROR: '#F44336',
	INFO: '#a4accf',
	INACTIVE: '#4c4f5f',
};

export function FollowUpEmbed(header, content, color) {
	const embed = new EmbedBuilder()
		.setTitle(header)
		.setDescription(content)
		.setColor(color);
	return embed;
}

export function SuccessEmbed(content) {
	return FollowUpEmbed('Success', content, EmbedColors.SUCCESS);
}

export function ErrorEmbed(content) {
	return FollowUpEmbed('Error', content, EmbedColors.ERROR);
}

export function TitleEmbed(header, color) {
	const embed = new EmbedBuilder()
		.setTitle(header)
		.setColor(color);
	return embed;
}