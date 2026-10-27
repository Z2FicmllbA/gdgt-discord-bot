import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

import { ConfirmationDialog, DialogType } from "../../handlers/confirmationDialog.js";
import { WhitelistCheck } from "../../utility/whitelistCheck.js";
import { GuildConfigModel } from "../../models/guildConfigModel.js";
import { EventModel } from "../../models/eventModel.js";
import { ErrorEmbed, SuccessEmbed } from "../../utility/followUpEmbed.js";

export const data = new SlashCommandBuilder()
    .setName('event-set-active')
    .setDescription('Set the event as active/default for this server. All commands will automatically use this event.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('tag')
            .setDescription('The unique tag/id of the event.')
            .setRequired(true)
    );

export async function execute(interaction) {
    await interaction.deferReply();

    if (!WhitelistCheck(interaction.user.id)) {
        await interaction.followUp({
            embeds: [ErrorEmbed('You are not whitelisted for this action.')]
        });
        return;
    }

    const eventId = interaction.options.getString('tag').toUpperCase();
    const event = await EventModel.findById(eventId);
    if (!event) {
        await interaction.followUp({
            embeds: [ErrorEmbed(`No event found with the tag ${eventId}.`)]
        });
        return;
    }
    if (event.archiveState) {
        await interaction.followUp({
            embeds: [ErrorEmbed(`The event **${event.name}** is archived.`)]
        });
        return;
    }

    await ConfirmationDialog({
        interaction: interaction,
        dialogType: DialogType.Generic,
        header: 'Confirmation',
        content: `Set the event **${event.name}** as the default/active for this guild?`,
        ttl: 60_000,
        callback: eventSetActive,
    });
}

async function eventSetActive(interaction) {
    const eventId = interaction.options.getString('tag').toUpperCase();
    const event = await EventModel.findById(eventId);

    await GuildConfigModel.findByIdAndUpdate(
        interaction.guild.id,
        { activeEvent: eventId },
        { upsert: true },
    );

    return SuccessEmbed(
        `Set the event **${event.name}** as the default/active event for the guild **${interaction.guild.name}**.`
    );
}