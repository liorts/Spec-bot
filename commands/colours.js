const Discord = require('discord.js');

exports.run = async (bot, message, args, ops) => {
   if(args[0] === 'setup') {
          if(!message.guild.me.permissions.has("MANAGE_ROLES")) return message.channel.send("I can't setup colors, give me the `MANAGE_ROLES` permission and retry.")  
        message.channel.send('Colours have been installed')
          message.guild.createRole({name: '#Red', color: '#D40C00', })
          message.guild.createRole({name: '#Light Red', color: '#FF9A00'})
          message.guild.createRole({name: '#Deep orange', color: '#FF5500'})
          message.guild.createRole({name: '#Orange', color: '#ffa202'})
          message.guild.createRole({name: '#Amber', color: '#FFCD00'})  
          message.guild.createRole({name: '#Yellow', color: '#FFEF00'})
          message.guild.createRole({name: '#Lime', color: '#CDE000'})
          message.guild.createRole({name: '#Light Green', color: '#87C735'})
          message.guild.createRole({name: '#Green', color: '#32C12C'})  
          message.guild.createRole({name: '#Teal', color: '#009888'})
          message.guild.createRole({name: '#Blue', color: '#526EFF'})
          message.guild.createRole({name: '#Light Blue', color: '#00A5F9'})
          message.guild.createRole({name: '#Cyan', color: '#00BCD9'})
          message.guild.createRole({name: '#Indigo', color: '#3E49BB'})
          message.guild.createRole({name: '#Purple', color: '#7F4FC9'})
          message.guild.createRole({name: '#Deep Purple', color: '#682CBF'})
          message.guild.createRole({name: '#Brown', color: '#7C5547'})
          message.guild.createRole({name: '#Deep Brown', color: '#50342C'})
          message.guild.createRole({name: '#Grey', color: '#9E9E9E9'})
          message.guild.createRole({name: '#Blue Grey', color: '#5F7D8E'}) 
          message.guild.createRole({name: '#Black', color: '#080808'})
          message.guild.createRole({name: '#Dark Blue', color: '#0920f8'})
          message.guild.createRole({name: '#Neon Green', color: '#3ff809'}) 
          message.guild.createRole({name: '#Light Green V2', color: '#0af595'}) 
          message.guild.createRole({name: '#Light Pink', color: '#ff07e7'}) 
          message.guild.createRole({name: '#Light Purple', color: '#9e07ff'}) 
    } 
    
    if(!args[0]) { 
      
    let colors = message.guild.roles.filter(role => role.name.startsWith("#"))
    const noColors = new Discord.RichEmbed().setColor('RED').setTitle("Can't find colors.").setDescription("Use `!colours setup`") 
                                                                      
    if(colors.size < 1) return message.channel.send(noColors) 

    let str = args.join(" ");
    let role = colors.find(role => role.name.slice(1).toLowerCase() === str.toLowerCase());
    const noArgs = new Discord.RichEmbed().setColor('RED').setTitle("Bad args").setDescription('Use !colours setup`') 
                                                
    if(!role) return message.channel.send(noArgs) 

    try {
        const colorgive = new Discord.RichEmbed()
        .setColor(role.color)
        .setDescription(`You now have the color ${role} !`)
        await message.member.removeRoles(colors);
        await message.member.addRole(role);
        message.channel.send(colorgive);
    } catch(e) {
        const error = new Discord.RichEmbed()
        .setDescription(`Operation failed ! ${e.message}, if you have missing permissions, pls give me the \`MANAGE_ROLES\` permission and try again.`)
        message.channel.send(error);
    }
    } 

    let embed2 = new Discord.RichEmbed()
    .setTitle('Command `!colour` has been used !')
    .setColor('BLUE')
    .addField(`User:`, `\`${message.author.username}\``)
    .addField(`ID:`, `\`${message.author.id}\``)
    .addField(`Discrinator:`, `\`${message.author.discriminator}\``)
    .addField(`Created At:`, `\`${message.author.createdAt}\``)
    .addField(`GuildID:`, `\`${message.guild.id}\``)
    .addField(`Guild Name:`, `\`${message.guild.name}\``)
    .addField(`Channel:`, `\`#${message.channel.name} (${message.channel.id})\``)
    .addField(`Full content:`, `\`${message.content}\``) 
    .setThumbnail(message.author.avatarURL)
  
  bot.channels.get('668483929791266817').send({embed: embed2});

}

exports.help = {name: "colour", aliases: []} 
