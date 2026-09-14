import { SlashCommandBuilder } from "discord.js";

import { LoadActiveEvent } from "../../utility/loadActiveEvent.js";
import { ErrorEmbed, SuccessEmbed } from "../../utility/followUpEmbed.js";
import { AlphanumericCheck } from "../../utility/alphanumericCheck.js";
import { TeamModel } from "../../models/teamModel.js";

export const data = new SlashCommandBuilder()
    .setName('team-disband')
    .setDescription('Disband your team from the active event (only for captains).')
    .addStringOption(option =>
        option.setName('confirm-name')
            .setDescription('Enter the name of your team.')
            .setMinLength(4)
            .setMaxLength(50)
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('confirm-tag')
            .setDescription('Enter the tag of your team.')
            .setMinLength(1)
            .setMaxLength(4)
            .setRequired(true)
    );

export async function execute(interaction) {
    await interaction.deferReply();

    const event = await LoadActiveEvent(interaction.guild.id);
    if (!event) {
        await interaction.followUp({
            embeds: [ErrorEmbed(`No active event set for the guild **${interaction.guild.name}**.`)]
        });
        return;
    }
    if (event.archiveState) {
        await interaction.followUp({
            embeds: [ErrorEmbed(`The event **${event.name}** is archived.`)]
        });
        return;
    }
    if (!event.registrationsState) {
        await interaction.followUp({
            embeds: [ErrorEmbed(`The registrations phase for the event **${event.name}** is not active.`)]
        });
        return;
    }

    // to do: test this
    const memberCheck = await TeamModel.findOne(
        { event: event._id, 'members.member': interaction.user.id }
    );
    if (memberCheck) {
        await interaction.followUp({
            embeds: [ErrorEmbed(`You cannot disband the team **${memberCheck.name}** as your are not the captain.`)]
        });
        return;
    }
    
    const team = await TeamModel.findOne(
        { event: event._id, captain: interaction.user.id }
    );
    if (!team) {
        await interaction.followUp({
            embeds: [ErrorEmbed(`You do not have any registered team for the event **${event.name}**.`)]
        });
        return;
    }

    const confirmTeamName = interaction.options.getString('confirm-name');
    const confirmTeamTag = interaction.options.getString('confirm-tag').toUpperCase();
    if (!AlphanumericCheck(confirmTeamTag)) {
        await interaction.followUp({
            embeds: [ErrorEmbed('The team tag can only contain alphanumeric values.')]
        });
        return;
    }

    if (confirmTeamName != team.name) {
        await interaction.followUp({
            embeds: [ErrorEmbed('Could not disband team: **name** mismatch. Please check for any typos.')]
        });
        return;
    }
    if (confirmTeamTag != team.tag) {
        await interaction.followUp({
            embeds: [ErrorEmbed('Could not disband team: **tag** mismatch. Please check for any typos.')]
        });
        return;
    }

    await team.deleteOne();
    // to do: role deletion
    await interaction.followUp({
        embeds: [SuccessEmbed(`Successfully deleted the team **${team.name}** from the event **${event.name}**.`)]
    });
}