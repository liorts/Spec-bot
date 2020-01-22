const Discord = require("discord.js");

module.exports.run = async (bot, message, args) => {
    let inline = true
    let bicon = bot.user.displayAvatarURL;
    let usersize = bot.users.size
    let chansize = bot.channels.size
    let uptimxd = bot.uptime 
    let servsize = bot.guilds.size
    let botembed = new Discord.RichEmbed()
    .setColor("#00ff00")
    .setThumbnail(bicon)
    .addField("**Bot Name**", `🚀 ${bot.user.username}`, inline)
    .addField("**Bot Developers**", "💸Fs, DarkBoy\n💸Bσt Developerツ | Ocean™", inline )
    .addField("**Servers**", `🛡 ${servsize}`, inline)
    .addField("**Channels**", `📁 ${chansize}`, inline)
    .addField("**Users**", `💜 ${usersize}`, inline)
    .addField("**Bot Library**", "🌎 Discord.js", inline)
    .addField("**Created On**", bot.user.createdAt)
    .setFooter(`Information about: ${bot.user.username}. Developed by: Modo`)
    .setTimestamp()
    
    message.channel.send(botembed);

}

module.exports.help = {
  name:"botinfo"
}