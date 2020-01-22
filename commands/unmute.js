const Discord = require("discord.js");
module.exports = {
    name: "unmute",
    aliases: ["unmute"],
    category: "moderation",
    description: "Unmutes a member",
    run: async (client, message, args) => {


    if (!message.member.hasPermission("MANAGE_ROLES") || !message.guild.owner) return message.channel.send("You don't have permission to do this!");

    if (!message.guild.me.hasPermission(["MANAGE_ROLES", "ADMINISTRATOR"])) return message.channel.send("I don't have permission to do this!");

    let mutee = message.mentions.members.first();
    if (!mutee) return message.channel.send("Please mention an user!");

    let reason = args.slice(1).join();
    if (!reason) {
        message.channel.send("You need to give a reason!")
        return;
    }

    let muteRole = message.guild.roles.find(r => r.name === "Muted");
    if (!muteRole) return message.channel.send("There is no mute role to remove!");

    mutee.removeRole(muteRole.id).then(() => {
        message.delete()
        mutee.send(`Hello, you have been unmuted in ${message.guild.name}, for the following reason: ${reason}`)
        message.channel.send(`${mutee.user.username} was succesfully unmuted!`)
    })

    let unmuteEmbed = new Discord.RichEmbed()
        .setColor("RED")
        .setAuthor(`Modlogs`)
        .addField("Moderation:", "Unmute", true)
        .addField(`Mutee:`, mutee.user.username, true)
        .addField(`Reason`, reason)
        .addField("Moderator", message.author.username)
        .addField("Date:", message.createdAt)
        .setThumbnail(mutee.user.avatarURL)
    }
  }
