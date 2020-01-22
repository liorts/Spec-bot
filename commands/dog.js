const superagent = require('superagent')
const Discord = require('discord.js')
exports.run = async (client, message, args, tools) => {
    
    const { body } = await superagent
    .get('https://dog.ceo/api/breeds/image/random');
    const embed = new Discord.RichEmbed()
    .setColor('RANDOM')
    .setTitle("Woof :dog2:")
    .setImage(body.message)
    message.channel.send({embed})
}

module.exports.help = {
    name: "dog"
}