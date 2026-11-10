import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { TeamModel } from '../../models/teamModel.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';
import { ProfanityCheck } from '../../utility/profanityCheck.js';
import { EntryModel } from '../../models/entryModel.js';
import { ConfirmationDialog, DialogType } from '../../handlers/confirmationDialog.js';

export const data = new SlashCommandBuilder()
	.setName('entry-submit')
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
	.addStringOption(option =>
		option.setName('showcase-link')
			.setDescription('The link to a showcase video (Youtube, Google Drive, etc.)')
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

	let stageName = null;
	for (let i = 0; i < event.stages.length; i++) {
		if (event.stages[i].stageOrder === event.activeStage) {
			stageName = event.stages[i].stageName;
		}
	}
	if (!stageName) {
		await interaction.followUp({
			embeds: [ErrorEmbed('No stage has been set as active. If you think this is a mistake, contact the staff team.')],
		});
		return;
	}

	const captainCheck = await TeamModel.findOne(
		{ event: event._id, captain: interaction.user.id },
	);
	const memberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': interaction.user.id },
	);
	const team = captainCheck || memberCheck;
	if (!team) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`You are currently not part of any team for the event **${event.name}**.`)],
		});
	}

	const entryName = interaction.options.getString('name');
	if (ProfanityCheck(entryName)) {
		await interaction.followUp({
			embeds: [ErrorEmbed('Profanity detected. If you think this is a mistake, contact the staff team.')],
		});
		return;
	}

	const entryId = interaction.options.getString('id');
	// check if id is integers only

	const entryShowcaseLink = interaction.options.getString('showcase-link');
	if (!URL.canParse(entryShowcaseLink)) {
		await interaction.followUp({
			embeds: [ErrorEmbed('Invalid link. Make sure the provided link begins with `https://...`')],
		});
		return;
	}

	const contentString = 'Please double check everything before submitting:\n' +
		`- Level name: **${entryName}**\n` +
		`- Level ID: **${entryId}**\n` +
		`- [Showcase link](${entryShowcaseLink})`;

	const dialog = {
		interaction: interaction,
		dialogType: DialogType.Generic,
		header: 'Confirmation',
		content: contentString,
		ttl: 60_000,
		callback: entrySubmit,
	};

	const existingEntry = await EntryModel.findOne(
		{ event: event._id, team: team._id, eventStage: event.activeStage },
	);
	if (existingEntry) {
		const unixTime = Math.floor(existingEntry.submissionDate.getTime() / 1000);

		dialog.dialogType = DialogType.Dangerous;
		dialog.header = 'WARNING';
		dialog.content = `You are about to overwrite your previously submitted entry from <t:${unixTime}:F>\n` +
			'Please double check everything before submitting:\n' +
			`- Old level name: **${existingEntry.name}**\n` +
			`- Old level ID: **${existingEntry.levelId}**\n` +
			`- [Old showcase link](${existingEntry.showcaseLink})\n\n` +
			`- New level name: **${entryName}**\n` +
			`- New level ID: **${entryId}**\n` +
			`- [New showcase link](${entryShowcaseLink})`;
		dialog.callback = entryOverwrite;
	}

	await ConfirmationDialog(dialog);
}

async function entrySubmit(interaction) {
	const event = await LoadActiveEvent(interaction.guild.id);

	let stageName = null;
	for (let i = 0; i < event.stages.length; i++) {
		if (event.stages[i].stageOrder === event.activeStage) {
			stageName = event.stages[i].stageName;
		}
	}

	const captainCheck = await TeamModel.findOne(
		{ event: event._id, captain: interaction.user.id },
	);
	const memberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': interaction.user.id },
	);
	const team = captainCheck || memberCheck;

	const entryName = interaction.options.getString('name');
	const entryId = interaction.options.getString('id');
	const entryShowcaseLink = interaction.options.getString('showcase-link');

	const submission = new EntryModel({
		name: entryName,
		showcaseLink: entryShowcaseLink,
		levelId: entryId,
		submissionDate: new Date(),
		event: event._id,
		eventStage: event.activeStage,
		team: team._id,
	});

	await submission.save();
	return SuccessEmbed(`Successfully submitted your entry to the event **${event.name}**, stage: **${stageName}**.`);
}

async function entryOverwrite(interaction) {
	const event = await LoadActiveEvent(interaction.guild.id);

	let stageName = null;
	for (let i = 0; i < event.stages.length; i++) {
		if (event.stages[i].stageOrder === event.activeStage) {
			stageName = event.stages[i].stageName;
		}
	}

	const captainCheck = await TeamModel.findOne(
		{ event: event._id, captain: interaction.user.id },
	);
	const memberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': interaction.user.id },
	);
	const team = captainCheck || memberCheck;

	const entryName = interaction.options.getString('name');
	const entryId = interaction.options.getString('id');
	const entryShowcaseLink = interaction.options.getString('showcase-link');

	const existingEntry = await EntryModel.findOne(
		{ event: event._id, team: team._id, eventStage: event.activeStage },
	);

	existingEntry.name = entryName;
	existingEntry.levelId = entryId;
	existingEntry.showcaseLink = entryShowcaseLink;
	existingEntry.submissionDate = new Date();

	await existingEntry.save();
	return SuccessEmbed(`Successfully submitted your entry to the event **${event.name}**, stage: **${stageName}**.`);
}