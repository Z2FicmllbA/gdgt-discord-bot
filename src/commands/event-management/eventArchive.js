import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

import { ConfirmationDialog, DialogType } from "../../handlers/confirmationDialog.js";
import { WhitelistCheck } from "../../utility/whitelistCheck.js";
import { EventModel } from "../../models/eventModel.js";
import { ErrorEmbed, SuccessEmbed } from "../../utility/followUpEmbed.js";

export const data = new SlashCommandBuilder()
    .setName('event-archive')
    .setDescription('Archive/unarchive an event. Archived events cannot be modified.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('tag')
            .setDescription('The unique tag of the event.')
            .setRequired(true)
    )
    .addBooleanOption(option =>
        option.setName('state')
            .setDescription('True - archived; False - active')
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
    const eventQuery = await EventModel.findById(eventId);
    if (!eventQuery) {
        await interaction.followUp({
            embeds: [ErrorEmbed(`No event found with the tag ${eventId}.`)]
        });
        return;
    }

    await ConfirmationDialog({
        interaction: interaction,
        dialogType: DialogType.Generic,
        header: 'Confirmation',
        content: `Archive/unarchive the event **${eventQuery.name}**?`,
        ttl: 60_000,
        callback: eventArchive,
    });
}

async function eventArchive(interaction) {
    const eventId = interaction.options.getString('tag').toUpperCase();
    const eventQuery = await EventModel.findById(eventId);

    const archiveState = interaction.options.getBoolean('state');
    eventQuery.archiveState = archiveState;

    await eventQuery.save();
    const archiveString = archiveState ? 'archived' : 'opened';
    return SuccessEmbed(`The event **${eventQuery.name}** has been **${archiveString}**.`);
}