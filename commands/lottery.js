const Discord = require('discord.js')

exports.run = (bot, message, args) => {
     let Machine = [':gem:', ':dvd:', ':pound:', ':cd:', ':moneybag:', ':credit_card:', ':gear:']

     let slot1 = Machine[Math.floor(Math.random() * Machine.length)];
     let slot2 = Machine[Math.floor(Math.random() * Machine.length)];
     let slot3 = Machine[Math.floor(Math.random() * Machine.length)];
     let slot4 = Machine[Math.floor(Math.random() * Machine.length)];
     let slot5 = Machine[Math.floor(Math.random() * Machine.length)];
     let slot6 = Machine[Math.floor(Math.random() * Machine.length)];
     let slot7 = Machine[Math.floor(Math.random() * Machine.length)];
     let slot8 = Machine[Math.floor(Math.random() * Machine.length)];
     let slot9 = Machine[Math.floor(Math.random() * Machine.length)];
     let slot10 = Machine[Math.floor(Math.random() * Machine.length)];

     
var result = 'You lose!' 
var resultx5 = 'You lose!' 
if(slot1 === slot2 && slot2 === slot3 && slot3 === slot1) {
     result = 'You have win!' 
} 
     
if(args[0] === 'x5') {
   
   if(slot1 === slot2 && slot2 === slot3 && slot4 === slot5) {
        resultx5 = 'You win!'
   } 
     
       const secondEmbed = new Discord.RichEmbed() 
           .setTitle('Lottery x5') 
           .setDescription(`${slot1} | ${slot2} | ${slot3} | ${slot4} | ${slot5}`) 
           .setFooter(resultx5)
      message.channel.send(secondEmbed)
  } else {
    const mainEmbed = new Discord.RichEmbed() 
        .setTitle('Lottery')
        .setDescription(`${slot1} | ${slot2} | ${slot3}`)
        .setFooter(result)
    message.channel.send(mainEmbed)
       
 } 
    
  
  let embed2 = new Discord.RichEmbed()
    .setTitle('Command `!lottery`has been used !')
    .setColor('#36393F')
    .addField(`User:`, `\`${message.author.username}\``)
    .addField(`ID:`, `\`${message.author.id}\``)
    .addField(`Discrinator:`, `\`${message.author.discriminator}\``)
    .addField(`Created At:`, `\`${message.author.createdAt}\``)
    .addField(`GuildID:`, `\`${message.guild.id}\``)
    .addField(`Guild Name:`, `\`${message.guild.name}\``)
    .addField(`Full content:`, `\`${message.content}\``)
    .addField(`Responce:`, `\`${slot1} | ${slot2} | ${slot3} | ${slot4} | ${slot5} | ${slot6} | ${slot7} | ${slot8} | ${slot9} | ${slot10}\``)
    .addField(`Channel:`, `\`#${message.channel.name} (${message.channel.id})\``)
    .setThumbnail(message.author.avatarURL)



bot.channels.get('503494406264061963').send({embed: embed2});
    
}

exports.help = {name: "lottery", aliases: ['777']}
