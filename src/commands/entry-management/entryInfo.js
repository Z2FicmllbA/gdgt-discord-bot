import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { EventModel } from '../../models/eventModel.js';
import { EmbedColors, ErrorEmbed } from '../../utility/followUpEmbed.js';
import { AlphanumericCheck } from '../../utility/alphanumericCheck.js';
import { TeamModel } from '../../models/teamModel.js';
import { EntryModel } from '../../models/entryModel.js';

export const data = new SlashCommandBuilder()
	.setName('entry-info')
	.setDescription('Shows all relevant information about an entry.')
	.addStringOption(option =>
		option.setName('team-tag')
			.setDescription('The tag of the layout\'s team.')
			.setRequired(true))
	.addStringOption(option =>
		option.setName('event-tag')
			.setDescription('The unique tag of the event that the layout was submitted for.')
			.setRequired(false))
	.addNumberOption(option =>
		option.setName('stage-order')
			.setDescription('The stage of the tournament that the layout was submitted for.')
			.setMinValue(1)
			.setRequired(false));

export async function execute(interaction) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	let event;
	let queryEventTag = interaction.options.getString('event-tag');
	if (queryEventTag) {
		queryEventTag = queryEventTag.toUpperCase();
		if (!AlphanumericCheck(queryEventTag)) {
			await interaction.followUp({
				embeds: [ErrorEmbed('The event tag can only contain alphanumeric values.')],
			});
			return;
		}

		event = await EventModel.findOne({ _id: queryEventTag });
		if (!event) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`Couldn't find any event with the tag ${queryEventTag}.`)],
			});
			return;
		}
	}
	else {
		event = await LoadActiveEvent(interaction.guild.id);
		if (!event) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`No active event set for the guild **${interaction.guild.name}**.`)],
			});
			return;
		}
	}

	const queryTeamTag = interaction.options.getString('team-tag').toUpperCase();
	if (!AlphanumericCheck(queryTeamTag)) {
		await interaction.followUp({
			embeds: [ErrorEmbed('The team tag can only contain alphanumeric values.')],
		});
		return;
	}

	const team = await TeamModel.findOne(
		{ event: event._id, tag: queryTeamTag },
	);
	if (!team) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`No team found with the tag ${queryTeamTag}.`)],
		});
		return;
	}

	let stageOrder;
	let stageName = null;
	const queryStageOrder = interaction.options.getNumber('stage-order');
	if (queryStageOrder) {
		stageOrder = queryStageOrder;

		for (let i = 0; i < event.stages.length; i++) {
			if (event.stages[i].stageOrder === queryStageOrder) {
				stageName = event.stages[i].stageName;
			}
		}
		if (!stageName) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`No stage found with the order ${queryStageOrder}.`)],
			});
			return;
		}
	}
	else {
		stageOrder = event.activeStage;
		for (let i = 0; i < event.stages.length; i++) {
			if (event.stages[i].stageOrder === event.activeStage) {
				stageName = event.stages[i].stageName;
			}
		}
	}

	const entry = await EntryModel.findOne({
		event: event._id,
		team: team._id,
		eventStage: stageOrder,
	});
	if (!entry) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`No entry found from the team ${team.tag} for the event **${event.name}: ${stageName}**.`)],
		});
		return;
	}

	const embed = new EmbedBuilder()
		.setTitle(entry.name)
		.setDescription(`by **${team.tag}** for the event **${event.name}: ${stageName}**`)
		.setURL(entry.showcaseLink)
		.setColor(EmbedColors.INFO);

	let teamMembersString = `Captain: <@${team.captain}>\n` + 'Members: ';
	for (let i = 0; i < team.members.length; i++) {
		teamMembersString += `<@${team.members[i].memberId}>`;
	}
	const unixTime = Math.floor(entry.submissionDate.getTime() / 1000);
	const submissionDateString = `<t:${unixTime}:F>`;

	embed.addFields(
		{ name: team.name, value: teamMembersString },
		{ name: 'Level ID', value: entry.levelId },
		{ name: 'Submission date', value: submissionDateString },
	);

	await interaction.followUp({ embeds: [embed] });
}
