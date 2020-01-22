const Discord = require("discord.js");
const bot = new Discord.Client();
exports.run = (client, message, args) => {
  const word = args.join(" ")
  message.delete()
  if (!word) return message.channel.send("Please Provide Text to embed !")
  const embed = new Discord.RichEmbed()
    .setDescription(word)
    .setColor("RANDOM");
  message.channel.send({embed});
}
   
