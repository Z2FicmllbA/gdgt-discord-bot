import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { ErrorEmbed, EmbedColors } from '../../utility/followUpEmbed.js';
import { TeamModel } from '../../models/teamModel.js';

export const data = new SlashCommandBuilder()
	.setName('team-info')
	.setDescription('Get all the important info about a team.')
	.addStringOption(option =>
		option.setName('tag')
			.setDescription('The unique tag of the team.')
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

	const teamTag = interaction.options.getString('tag').toUpperCase();
	const team = await TeamModel.findOne(
		{ event: event._id, tag: teamTag },
	);
	if (!team) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`No team found with the tag ${teamTag}.`)],
		});
		return;
	}

	const embed = new EmbedBuilder()
		.setTitle(team.name)
		.setDescription(`Team tag: ${teamTag}`)
		.setColor(EmbedColors.INFO);

	embed.addFields(
		{ name: 'Captain', value: `<@${team.captain}>` },
		{ name: 'Members', value: getMembersFieldValue(team.members) },
	);

	const captainCheck = team.captain === interaction.user.id;
	if (captainCheck) {
		embed.addFields({
			name: 'Sent invites',
			value: getMembersFieldValue(team.invites),
		});
	}

	// TO DO: think of something for the footer icon here & in event-info
	embed.setFooter({
		text: event.name,
		iconURL: 'https://i.imgur.com/AfFp7pu.png',
	});

	await interaction.followUp({ embeds: [embed] });
}

function getMembersFieldValue(array) {
	let fieldValue = '';
	if (array.length === 0) {
		fieldValue = 'N/A';
	}
	else {
		for (let i = 0; i < array.length; i++) {
			fieldValue += `<@${array[i].memberId}>`;
		}
	}
	return fieldValue;
}