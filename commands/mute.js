const Discord = require("discord.js");
module.exports = {
    name: "mute",
    aliases: ["mute"],
    category: "moderation",
    description: "Mutes a member",
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
    if (!muteRole) {
        try {
            muteRole = await message.guild.createRole({
                name: "Muted",
                color: "#ffff00",
                permissions: []
            })
            message.guild.channels.forEach(async (channel, id) => {
                await channel.overwritePermissions(muteRole, {
                    SEND_MESSAGES: false,
                    ADD_REACTIONS: false,
                    SEND_TTS_MESSAGES: false,
                    ATTACH_FILES: false,
                    SPEAK: false,
                    CONNECT: false
                })
            })
        } catch (e) {
            console.log(e.stack);
        }
    }

    if (mutee.roles.some(role => role.name === 'Muted')) {
        message.channel.send("This user is already muted!")
        return;

    } else {

        mutee.addRole(muteRole.id).then(() => {
            message.delete()
            mutee.send(`Hello, you have been muted in ${message.guild.name}, for the following reason: ${reason}`)
            message.channel.send(`${mutee.user.username} was succesfully muted!`)
        })

        let muteEmbed = new Discord.RichEmbed()
            .setColor("RED")
            .setAuthor(`Modlogs`)
            .addField("Moderation:", "Mute", true)
            .addField(`Mute:`, mutee.user.username, true)
            .addField(`Reason`, reason)
            .addField("Moderator", message.author.username)
            .addField("Date:", message.createdAt)
            .setThumbnail(mutee.user.avatarURL)
        
        message.channel.send(muteEmbed);
    }
  }
}