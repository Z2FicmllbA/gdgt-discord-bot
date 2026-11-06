import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { ConfirmationDialog, DialogType } from '../../handlers/confirmationDialog.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';
import { TeamModel } from '../../models/teamModel.js';
import { AlphanumericCheck } from '../../utility/alphanumericCheck.js';
import { ProfanityCheck } from '../../utility/profanityCheck.js';

export const data = new SlashCommandBuilder()
	.setName('team-rename')
	.setDescription('Change your team name or team tag.')
	.addStringOption(option =>
		option.setName('new-name')
			.setDescription('Your new team name.')
			.setMinLength(4)
			.setMaxLength(50)
			.setRequired(false))
	.addStringOption(option =>
		option.setName('new-tag')
			.setDescription('Your new team tag (allowed only A-Z & 0-9).')
			.setMinLength(1)
			.setMaxLength(4)
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
	if (!event.registrationsState) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`The registration phase for the event **${event.name}** is not active.`)],
		});
		return;
	}

	const memberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': interaction.user.id },
	);
	if (memberCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed('Only the captain can rename the team name/tag.')],
		});
		return;
	}
	const team = await TeamModel.findOne(
		{ event: event._id, captain: interaction.user.id },
	);
	if (!team) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You are currently not a part of any team.\n' +
				'Use `/team-create` or `/team-join` to create or join a team respectively.',
			)],
		});
		return;
	}

	const newName = interaction.options.getString('new-name');
	let newTag = interaction.options.getString('new-tag');
	if (!newName && !newTag) {
		await interaction.followUp({
			embeds: [ErrorEmbed('Please provide at least one value.')],
		});
		return;
	}

	if (newName) {
		if (team.name === newName) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`Your team name is already **${team.name}**.\n` +
					'If you want to rename your team tag, omit the `new-name` value from the request.',
				)],
			});
			return;
		}

		if (ProfanityCheck(newName)) {
			await interaction.followUp({
				embeds: [ErrorEmbed('Profanity detected. If you think this is a mistake, contact the staff team.')],
			});
			return;
		}

		const availableNameCheck = await TeamModel.findOne(
			{ event: event._id, name: newName },
		);
		if (availableNameCheck) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`A team already has the **${newName}** name for the event **${event.name}**.`)],
			});
			return;
		}
	}

	if (newTag) {
		newTag = newTag.toUpperCase();
		if (team.tag === newTag) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`Your team tag is already **${team.tag}**.\n` +
					'If you want to rename your team name, omit the `new-tag` value from the request.',
				)],
			});
			return;
		}

		if (!AlphanumericCheck(newTag)) {
			await interaction.followUp({
				embeds: [ErrorEmbed('The team tag can only contain alphanumeric values.')],
			});
			return;
		}
		if (ProfanityCheck(newTag)) {
			await interaction.followUp({
				embeds: [ErrorEmbed('Profanity detected. If you think this is a mistake, contact the staff team.')],
			});
			return;
		}

		const availableTagCheck = await TeamModel.findOne(
			{ event: event._id, tag: newTag },
		);
		if (availableTagCheck) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`A team already has the ${newTag} tag for the event **${event.name}**.`)],
			});
			return;
		}
	}

	let contentString = 'Confirm the following changes:\n';
	if (newName) {
		contentString += `- team name from **${team.name}** to **${newName}**`;
	}
	if (newName && newTag) {
		contentString += '\n';
	}
	if (newTag) {
		contentString += `- team tag from **${team.tag}** to **${newTag}**`;
	}

	await ConfirmationDialog({
		interaction: interaction,
		dialogType: DialogType.Generic,
		header: 'Confirmation',
		content: contentString,
		ttl: 60_000,
		callback: teamRename,
	});
}

async function teamRename(interaction) {
	const event = await LoadActiveEvent(interaction.guild.id);

	const team = await TeamModel.findOne(
		{ event: event._id, captain: interaction.user.id },
	);

	const newName = interaction.options.getString('new-name');
	const newTag = interaction.options.getString('new-tag');

	if (newName) {
		team.name = newName;
	}
	if (newTag) {
		team.tag = newTag.toUpperCase();
	}

	await team.save();
	return SuccessEmbed(`Successfully renamed your team: **${team.name}** (${team.tag}).`);
}