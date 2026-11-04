import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import { FollowUpEmbed, TitleEmbed, EmbedColors } from '../utility/followUpEmbed.js';

const confirmGeneric = new ButtonBuilder()
	.setCustomId('confirm')
	.setLabel('OK')
	.setStyle(ButtonStyle.Success);
const cancelGeneric = new ButtonBuilder()
	.setCustomId('cancel')
	.setLabel('Cancel')
	.setStyle(ButtonStyle.Danger);

const confirmDangerous = new ButtonBuilder()
	.setCustomId('confirm')
	.setLabel('Confirm')
	.setStyle(ButtonStyle.Danger);
const cancelDangerous = new ButtonBuilder()
	.setCustomId('cancel')
	.setLabel('Cancel')
	.setStyle(ButtonStyle.Secondary);

export const DialogType = {
	Generic: new ActionRowBuilder().addComponents(confirmGeneric, cancelGeneric),
	Dangerous: new ActionRowBuilder().addComponents(confirmDangerous, cancelDangerous),
};

export async function ConfirmationDialog(data) {
	let confirmationColor = EmbedColors.INFO;
	if (data.dialogType === DialogType.Dangerous) {
		confirmationColor = EmbedColors.ERROR;
	}

	const response = await data.interaction.editReply({
		embeds: [FollowUpEmbed(data.header, data.content, confirmationColor)],
		components: [data.dialogType],
		withResponse: true,
	});

	const collectorFilter = (i) => i.user.id === data.interaction.user.id;
	try {
		const confirmation = await response.awaitMessageComponent({
			filter: collectorFilter,
			time: data.ttl,
		});

		if (confirmation.customId === 'confirm') {
			const resultEmbed = await data.callback(data.interaction);

			await confirmation.update({
				embeds: [resultEmbed],
				components: [],
			});
		}
		else if (confirmation.customId === 'cancel') {
			await confirmation.update({
				embeds: [TitleEmbed('This action has been cancelled.', EmbedColors.INACTIVE)],
				components: [],
			});
		}

	}
	catch {
		await data.interaction.editReply({
			embeds: [TitleEmbed('Error // Timed out.', EmbedColors.INACTIVE)],
			components: [],
		});
	}
}