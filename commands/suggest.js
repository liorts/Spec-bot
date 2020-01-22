const Discord = require('discord.js');

exports.run = async (bot, message, args, ops) => {
  message.delete();
	if (!message.member.roles.find("name", "@everyone")) { 
		message.channel.send('Invalid permissions.');
		return;
	}
    
    // Check for input
    if (!args[0]) return message.channel.send('Proper usage: !suggest <Suggestion>');
    
    // Create Embed
    const embed = new Discord.RichEmbed()
        .setColor("RANDOM") //To change color do .setcolor("#fffff")
        .setFooter('React to Vote.')
        .setDescription(args.join(' '))
        .setTitle(`Suggestion Created By ${message.author.username}`);
    let suggestChannel = message.guild.channels.find(c => c.name === "🚥・suggestions");
    // suggestChannel.send(embed)
        
    // const m = suggestChannel.send(embed);
  
    let msg = await suggestChannel.send(embed)
        .then(function (msg) {
            msg.react("⬆");
            msg.react("⬇"); // You can only add two reacts
            message.delete({timeout: 1000});
            }).catch(function(error) {
            console.log
        });
};

module.exports.help = {
name: "suggest"
}
