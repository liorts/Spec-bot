const Discord = require("discord.js");
module.exports.run = async (bot, message, args) => {
  message.delete();
    if (!message.member.hasPermission("BAN_MEMBERS"))
        return message.reply("Sorry, you don't have permissions to use this!");

    let member = message.mentions.members.first();
    if (!member)
        return message.reply("Please mention a valid member of this server");
    if (!member.bannable)
        return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if (!reason) return message.channel.send("No reason provided")
      .then(msg => msg.delete(3000))

    await member.ban(reason)
        .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    member.send(`${member} is banned because of ${reason}`);
    // const logs = message.guild.channels.find(channel => channel.name === "logs");
    let banEmbed = new Discord.RichEmbed()
        .setTitle("Ban hammer")
        .setColor("#FFFFFF")
        .addField("Banned", member, true)
        .addField("Channel", message.channel, true)
        .addField("Reason", reason)
        .addField("Executor", message.author.tag)
        .setFooter(`Author ID: ${message.author.tag}`);

  message.channel.send(banEmbed);
    // logs.send(banEmbed);
  
  
    //member.send(`You are banned in the following server: ${message.guild.name}`);
}
module.exports.help = {
    name: "ban"
}
