import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

import { WhitelistCheck } from "../../utility/whitelistCheck.js";
import { LoadActiveEvent } from "../../utility/loadActiveEvent.js";
import { EventModel } from "../../models/eventModel.js";
import { ErrorEmbed, SuccessEmbed } from "../../utility/followUpEmbed.js";

export const data = new SlashCommandBuilder()
    .setName('event-team-size')
    .setDescription('Change the team size of the active event.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
        option.setName('min')
            .setDescription('Smallest possible amount of people in a team.')
            .setRequired(true)
            .setMinValue(0)
    )
    .addIntegerOption(option =>
        option.setName('max')
            .setDescription('Largest possible amount of people in a team.')
            .setRequired(true)
            .setMinValue(0)
    );

export async function execute(interaction) {
    await interaction.deferReply();

    if (!WhitelistCheck(interaction.user.id)) {
        await interaction.followUp({
            embeds: [ErrorEmbed('You are not whitelisted for this action.')]
        });
        return;
    }

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

    const tsMin = interaction.options.getInteger('min');
    const tsMax = interaction.options.getInteger('max');
    if (tsMin > tsMax) {
        await interaction.followUp({
            embeds: [ErrorEmbed('The minimal value cannot be larger than the maximum value.')]
        });
        return;
    }

    event.teamSizeMin = tsMin;
    event.teamSizeMax = tsMax;

    await event.save();
    await interaction.followUp({
        embeds: [SuccessEmbed(`Updated team size for **${event.name}**: ${tsMin}-${tsMax}.`)],
    });
}