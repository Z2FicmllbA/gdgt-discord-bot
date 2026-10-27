import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

import { ConfirmationDialog, DialogType } from "../../handlers/confirmationDialog.js";
import { WhitelistCheck } from "../../utility/whitelistCheck.js";
import { EventModel } from "../../models/eventModel.js";
import { GuildConfigModel } from "../../models/guildConfigModel.js";
import { ErrorEmbed, SuccessEmbed } from "../../utility/followUpEmbed.js";
import { DeleteParticipantRole } from "../../utility/participantRoleManager.js";

export const data = new SlashCommandBuilder()
    .setName('event-delete')
    .setDescription('Delete an event by tag. Admin & whitelist locked.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('tag')
            .setDescription('The unique tag of the event.')
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
        dialogType: DialogType.Dangerous,
        header: 'WARNING',
        content: `Delete the event **${event.name}**?`,
        ttl: 60_000,
        callback: eventDelete,
    });
}

async function eventDelete(interaction) {
    const eventId = interaction.options.getString('tag').toUpperCase();
    const event = await EventModel.findById(eventId);

    await event.deleteOne();
    await DeleteParticipantRole(interaction, event.roleId);
    await GuildConfigModel.findOneAndUpdate(
        { activeEvent: eventId },
        { activeEvent: null },
    );

    return SuccessEmbed(
        `Successfully deleted the event **${event.name}** with the tag ${eventId}.`
    );
}