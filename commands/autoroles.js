const Discord = require("discord.js");
module.exports.run = async (bot, msg, args) => {
    if (!msg.member.hasPermission("MANAGE_GUILD") || !msg.guild.owner) return msg.channel.send("You don't have permission to do this!");

    if (!msg.guild.me.hasPermission(["MANAGE_ROLES", "ADMINISTRATOR"])) return msg.channel.send("I don't have permission to do this!");
    msg.delete()
    
    const ownerRole = await msg.guild.createRole({
        name: "Owners",
        color: "RANDOM",
        "hoist": true,
        permissions: [
            "ADMINISTRATOR", "MANAGE_GUILD", "VIEW_AUDIT_LOG", "MENTION_EVERYONE"
        ]
    })
    const coOwnerRole = await msg.guild.createRole({
        name: "Co-Owner",
        color: "RANDOM",
        "hoist": true,
        permissions: [
            "ADMINISTRATOR", "MANAGE_GUILD", "VIEW_AUDIT_LOG", "MENTION_EVERYONE"
        ]
    })
    const headAdminRole = await msg.guild.createRole({
        name: "Head-Admin",
        color: "RANDOM",
        "hoist": true,
        permissions: [
            "ADMINISTRATOR", "VIEW_AUDIT_LOG"
        ]
    })
    const adminRole = await msg.guild.createRole({
        name: "Admin",
        color: "RANDOM",
        "hoist": true,
        permissions: [
            "MANAGE_MESSAGES", "BAN_MEMBERS", "KICK_MEMBERS", "VIEW_AUDIT_LOG", "MUTE_MEMBERS", "MANAGE_ROLES"
      
        ]
    })
    const modRole = await msg.guild.createRole({
        name: "Mod",
        color: "RANDOM",
        "hoist": true,
        permissions: [
            "KICK_MEMBERS", "MANAGE_MESSAGES", "VIEW_AUDIT_LOG"
        ]
    })
    const helperRole = await msg.guild.createRole({
        name: "Helper",
        color: "RANDOM",
        "hoist": true,
        permissions: [
            "MANAGE_MESSAGES", "VIEW_AUDIT_LOG"
        ]
    })
    const botRole = await msg.guild.createRole({
        name: "Bot",
        color: "RANDOM",
        "hoist": true,
        permissions: [
            "ADMINISTRATOR"
        ]
    })
    const memberRole = await msg.guild.createRole({
        name: "Member",
        color: "#008000",
        "hoist": true,
        permissions: []
    })
    ownerRole;
    coOwnerRole;
    headAdminRole;
    adminRole;
    modRole;
    helperRole;
    botRole;
    memberRole;


    const autoRolesEmbed = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle("Autoroles")
    .setDescription("These Are The roles were created: ``` ``` **\nOwner\n Co-Owner\n Head Admin\n Admin\n Mod\n Helper\n Bot\n Member**``` ```")
    .setThumbnail(msg.guild.iconURL)
    .setFooter(`Requested by ${msg.author.username}`)
    .setTimestamp(new Date())
    msg.channel.send(autoRolesEmbed)
}

module.exports.help = {
    name: "m!autoroles"
}