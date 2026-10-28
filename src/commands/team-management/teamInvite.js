import { SlashCommandBuilder, MessageFlags } from 'discord.js';

import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { TeamModel } from '../../models/teamModel.js';

export const data = new SlashCommandBuilder()
	.setName('team-invite')
	.setDescription('Send/cancel an invite for your team to a free agent.')
	.addUserOption(option =>
		option.setName('user')
			.setDescription('Enter the user like you would tag them (f.e. @user123).')
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
	if (!event.registrationsState) {
		await interaction.followUp({
			embeds: [ErrorEmbed(`The registrations phase for the event **${event.name}** is not active.`)],
		});
		return;
	}

	const memberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.member': interaction.user.id },
	);
	if (memberCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed('Only the captain can send/cancel invites for the team.')],
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

	const user = interaction.options.getUser('user');
	if (user.id === interaction.user.id) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You already are in your team.')],
		});
		return;
	}
	if (user.bot) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You cannot invite bot users to your team.')],
		});
		return;
	}
	// check for blacklisted roles
	// check if user is already in the team

	if (team.invites.length >= event.teamSizeMax) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You cannot send more invites to your team. ' +
				`(${team.invites.length}/${event.teamSizeMax})`,
			)],
		});
		return;
	}

	let alreadyInvitedCheck = false;
	for (let i = 0; i < team.invites.length; i++) {
		if (team.invites[i].userId === user.id) {
			alreadyInvitedCheck = true;
			break;
		}
	}
	let embedMessage = `Invited <@${user.id}> to the team **${team.name}**.`;
	if (alreadyInvitedCheck) {
		team.invites.pull({ userId: user.id });
		embedMessage = `Cancelled the invite to <@${user.id}>.`;
	}
	else {
		team.invites.push({ userId: user.id });
	}

	await team.save();
	await interaction.followUp({ embeds: [SuccessEmbed(embedMessage)] });
}