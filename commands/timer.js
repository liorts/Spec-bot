const Discord = module.require('discord.js');
const ms = require('ms');
const prefix = "-"

module.exports.run = async (bot, message, args) => {
if (!message.content.startsWith(prefix)) return;
  let Timer = args[0];

  if(!args[0]){
    return message.channel.send(":x: " + "| **Please Enter a time period followed by \"s or m or h\**");
  }

  if(args[0] <= 0){
    return message.channel.send(":x: " + "| **Please Enter a time period followed by \"s or m or h\**");
  }

  message.channel.send(":white_check_mark: " + "| **Timer Started for: " + `${ms(ms(Timer), {long: true})}**`)

  setTimeout(function(){
    message.channel.send(message.author.toString() + `**⏰ Ding! Ding! Time Is Up**`)

  }, ms(Timer));
}

module.exports.help = {
    name: "timer"
  
}