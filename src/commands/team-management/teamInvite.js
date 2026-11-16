import { SlashCommandBuilder, MessageFlags } from 'discord.js';

import { ErrorEmbed, SuccessEmbed } from '../../utility/followUpEmbed.js';
import { LoadActiveEvent } from '../../utility/loadActiveEvent.js';
import { TeamModel } from '../../models/teamModel.js';

export const data = new SlashCommandBuilder()
	.setName('team-invite')
	.setDescription('Send/cancel an invite for your team to a free agent.')
	.addUserOption(option =>
		option.setName('member')
			.setDescription('Enter the member like you would tag them (f.e. @user123).')
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
			embeds: [ErrorEmbed(`The registration phase for the event **${event.name}** is not active.`)],
		});
		return;
	}

	const memberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': interaction.user.id },
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

	const member = interaction.options.getMember('member');
	if (member.id === interaction.user.id) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You already are in your team.')],
		});
		return;
	}
	if (member.bot) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You cannot invite bot users to your team.')],
		});
		return;
	}

	for (let i = 0; i < event.blacklistedRoles.length; i++) {
		if (member.roles.cache.has(event.blacklistedRoles[i].roleId)) {
			await interaction.followUp({
				embeds: [ErrorEmbed('Could not invite this member to the team because they ' +
					`have the role <@&${event.blacklistedRoles[i].roleId}>.`,
				)],
			});
			return;
		}
	}

	for (let i = 0; i < team.members.length; i++) {
		if (team.members[i].memberId === member.id) {
			await interaction.followUp({
				embeds: [ErrorEmbed(`<@${member.id}> is already part of your team.`)],
			});
			return;
		}
	}

	const invitedCaptainCheck = await TeamModel.findOne(
		{ event: event._id, captain: member.id },
	);
	const invitedMemberCheck = await TeamModel.findOne(
		{ event: event._id, 'members.memberId': member.id },
	);
	if (invitedCaptainCheck || invitedMemberCheck) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You cannot invite this member as they are part of another team.')],
		});
		return;
	}

	if (team.invites.length >= event.teamSizeMax - 1) {
		await interaction.followUp({
			embeds: [ErrorEmbed('You cannot send more invites to your team. ' +
				`(${team.invites.length}/${event.teamSizeMax - 1})`,
			)],
		});
		return;
	}

	let alreadyInvitedCheck = false;
	for (let i = 0; i < team.invites.length; i++) {
		if (team.invites[i].memberId === member.id) {
			alreadyInvitedCheck = true;
			break;
		}
	}
	let embedMessage = `Invited <@${member.id}> to the team **${team.name}**.`;
	if (alreadyInvitedCheck) {
		await team.invites.pull({ memberId: member.id });
		embedMessage = `Cancelled the invite to <@${member.id}>.`;
	}
	else {
		await team.invites.push({ memberId: member.id });
	}

	await team.save();
	await interaction.followUp({ embeds: [SuccessEmbed(embedMessage)] });
}