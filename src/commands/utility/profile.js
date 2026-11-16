import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { UserModel } from '../../models/userModel.js';
import { ErrorEmbed, EmbedColors } from '../../utility/followUpEmbed.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { TeamModel } from '../../models/teamModel.js';
import { EntryModel } from '../../models/entryModel.js';

export const data = new SlashCommandBuilder()
	.setName('profile')
	.setDescription('View a user\'s tournament profile.')
	.addUserOption(option =>
		option.setName('user')
			.setDescription('Enter the member like you would tag them (f.e. @user123).')
			.setRequired(true));

export async function execute(interaction) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const member = interaction.options.getMember('user');
	if (member.bot) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You cannot view the profile of a bot user.')],
		});
		return;
	}

	const user = await UserModel.findById(member.id);
	if (!user) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`<@${member.id}> hasn't participated in any tournaments.`)],
		});
		return;
	}

	const unixTime = Math.floor(user.joinedOn.getTime() / 1000);
	const descriptionString = `Joined on <t:${unixTime}:D>`;

	const embed = new EmbedBuilder()
		.setTitle(member.user.globalName)
		.setDescription(descriptionString)
		.setColor(EmbedColors.INFO)
		.setThumbnail(member.user.displayAvatarURL());

	if (user.badges.length > 0) {
		let badgesString = '';
		for (let i = 0; i < badges.length; i++) {
			badgesString += `- ${badges[i].badge}`;
		}
		embed.addFields({ name: 'Badges', value: badgesString });
	}

	const activeEvent = await LoadActiveEvent(interaction.guild.id);
	if (activeEvent) {
		const field = await GetActiveEventField(interaction, activeEvent, user);
		if (field) { embed.addFields(field); }
	}

	await interaction.followUp({ embeds: [embed] });
}

async function GetActiveEventField(interaction, event, user) {
	let isParticipating = false;
	const field = {
		name: `Participating in ${event._id}`,
		value: '',
	};
	let submissionCount;

	const captainCheck = await TeamModel.findOne(
		{ event: event._id, captain: user._id },
	);
	if (captainCheck) {
		isParticipating = true;
		submissionCount = await EntryModel.countDocuments(
			{ event: event._id, team: captainCheck._id },
		);
		field.value = `Captain of ${captainCheck.tag}`;
	}

	const memberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': user._id },
	);
	if (memberCheck) {
		isParticipating = true;
		submissionCount = await EntryModel.countDocuments(
			{ event: event._id, team: memberCheck._id },
		);
		field.value = `Member of ${memberCheck.tag}`;
	}

	if (captainCheck || memberCheck) {
		field.value += `: ${submissionCount} submission`;
		if (submissionCount != 1) { field.value += 's'; }
	}

	if (interaction.user.id === user._id && !captainCheck && !memberCheck) {
		const invites = await TeamModel.find(
			{ event: event._id, 'invites.memberId': user._id },
		);
		if (invites.length != 0) {
			isParticipating = true;
			field.value = 'You are invited to join the teams:\n';
			for (let i = 0; i < invites.length; i++) {
				field.value += `[${invites[i].tag}] `;
			}
		}
	}

	if (!isParticipating) { return null; }
	return field;
}