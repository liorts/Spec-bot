const Discord = module.require('discord.js');
const prefix = "!"
module.exports.run = async (bot, message, args) => {
if (!message.content.startsWith(prefix)) return;
  bot = message.guild.roles.array()
  
  var ROLES = "";

    bot.forEach(function(element){
        ROLES += element.name + "\n"
    });
    
    message.channel.send("```" + "\n" +
                         "---------------------------------" + "\n" +
                         "SERVER ROLES" + "\n" +
                         "---------------------------------" + "\n" +
                         `${ROLES}` + "```");

}

module.exports.help = {
    name: "roles"
}