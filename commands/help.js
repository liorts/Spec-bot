const Discord = require("discord.js");
module.exports.run = async (bot, message, args) => {
  let sIcon = message.guild.iconURL;
  let helpEmbed = new Discord.RichEmbed()
    .setTitle("__**🌷 Help 🌷**__")
    .setDescription(
      "Click on the corresponding emoji to get help about that object"
    )
    .setThumbnail(sIcon)
    .setColor("#FFFFFF")
    .addField("🌏 Setup", "Sets up your discord server", true)
    .addField("👑 Fun", "Fun commands, make you laugh", true)
    .addField("🛠 Moderation", "Sometimes you have to be hard", true)
    .addField("🔧 Verify", "Verification Commands!", true)
    .setTimestamp(new Date())
    .setFooter(
      `Requested by ${message.author.tag}`,
      `${message.author.avatarURL}`
    );

  const m = await message.channel.send(helpEmbed);

  await m.react("🌏");
  await m.react("👑");
  await m.react("🛠");
  await m.react("🔧"); //:wrench:
  await m.react("⬅️"); //:wrench:

  const filter = (reaction, user) => {
    return (
      ["🌏", "👑", "🛠", "🔧", "⬅️"].includes(reaction.emoji.name) &&
      user.id === message.author.id
    );
  };

  const collector = m.createReactionCollector(filter, {});

  collector.on("collect", async reaction => {
    reaction.remove(message.author);

    switch (reaction.emoji.name) {
      case "🌏":
        let mmj = message.member.joinedAt;
        let profileEmbed = new Discord.RichEmbed()
          .setTitle(`__**🔒 Setup Commands 🔒**__`)
          .setThumbnail(message.author.avatarURL)
          .setColor("#FFFFFF")
          .addField("New","🎫Makes a new Ticket Don't Forget To Write A Reason")
          .addField("Welcome","💌Setup AWelcome Channel\nUsage: !welcome set [channel] !welcome on/off !welcome img [url] To Changw Background")
          .addField("Addrole 🌏","Adds a role to a memeber in your guild !: Usage: !addrole [@user] [RoleName]")
          .addField("Suggestions 📜","Want people to suggest new ideas to your server ?: Usage: !suggest")
          .addField("Temp Voice/Chat Channel", "Want A Channel Where Only Some People Can Use And For A Certain Amount Of Time ? : Usage: !temp")
          .addField("autoroles 💛","Sad creating Roles ? Well not any more the bot will do it for you !: Usage: \n!autoroles")
          .addField("ServerStats🗂","Easy ServerStats You Can Setup it with one command !: Usage: \nm!serverstats enable - !serverstats disable")
          .addField("Colours 🎨","Install all the colours to your server (check roles once command is used): Usage: !colours setup")
          .addField("Any issues ? Want to know about any new command and our new update to the bot? 👑","Please join our discord server for support !: Usage: \n!support")
          .setTimestamp(new Date())
          .setFooter(
            `Requested by ${message.author.tag}`,
            `${message.author.avatarURL}`
          );
        m.edit(profileEmbed);

        break;

      case "👑":
        let FunEmbed = new Discord.RichEmbed()
          .setTitle(`**__👑 Fun 👑__**`)
          .setThumbnail(sIcon)
          .setColor("#FFFFFF")
          .addField("Meme 🌷", "Do you want to see a meme? Use: \n!meme")
          .addField("Cat ❤", "Want to see a cute cat ?: Usage: \n!cat")
          .addField("Avatar 🛡","Are you wanting to see your avatar or your friends ?: Usage: \n!avatar [@user]")
          .addField("Dog 🐕", "Want to see a cute dog ?: Usage: \n!dog")
          .addField("Timer ⏱","Set a timer with our timer cmd !: Usage: \n!timer [secs,hrs,d]")
          .addField("Bunny 🐇","Want to see a cute little Bunny ?: Usage: \n!bunny")
          .addField("Roblox 🌐","Want to look up some ones Roblox acc ?: Usage: \n!roblox [Robloxname]")
          .addField("mcskin 🌐","Want to look up some ones Minecraft acc ?: Usage: \n!mcskin [Minecraftname]")
          .addField("Wur 🚀","Want a Would you Rather Question ?: Usage: \n!wur")
          .addField("King 👑","Want to be king ?: Usage: \n!king") 
          .addField("Lottery 🎰","Want to play the lottery ?: Usage: \n!lottery or !lotteryx5")
          .addField("Wasted 👻","Give up on life ?: Usage: \n!wasted")
          .addField("Dropkick 🦶🏽","Want to kick someone in the stomach?: Usage: \n!dropkick [@user]")
          .addField("Roast 🍔","Want to Roast someone real bad ?: Usage: \n!roast [@user]") 
          .addField("Compliment 💖","Want to compliment someone ?: Usage: \n!compliment [@user]") 
          .addField("Rps✂️", "Want to play RockPaperScissors against a bot ?: Usage \n!rps")
          .addField("Dab 👉","Want to go back to 2018 ?: Usage: \n!dab") 
          .addField("Profile 🛂","Check what level you are and how much xp you have ?: Usage: \n!profile") 
          .setTimestamp(new Date())
          .setFooter(
            `Requested by ${message.author.tag}`,
            `${message.author.avatarURL}`
          );
        m.edit(FunEmbed);

        break;

        break;
      case "🔧":
        let Verifyembed = new Discord.RichEmbed()
          .setTitle(`**__🔧Verify Commands🔧__**`)
          .setThumbnail(sIcon)
          .setColor("#FFFFFF")
          .addField("!setcaptcha ✅", "Setup Captcha Channel & Role.")
          .addField("!captcha ✅", "Use Command to be verified") // when i delete i am idiot too dude verify not captcha asshole lol

          .setTimestamp(new Date())
          .setFooter(
            `Requested by ${message.author.tag}`,
            `${message.author.avatarURL}`
          );
        m.edit(Verifyembed);

        break;
      case "🛠":
        let moderationEmbed = new Discord.RichEmbed()
          .setTitle(`__**🚀 Moderation tools 🚀**__`)
          .setThumbnail(sIcon)
          .setColor("#FFFFFF")
          .addField("Giveaway 🎉","This creates a giveaway. Use this command as following: \n!start Time [Winners] [Prize] !gend [Message id] !greroll [messgae id]")
          .addField("EmojiList😎","Want to see all the emojis at once ? Usage: \n!emojislist")
          .addField("Clear 👑"," You Must React To The Emojis This performs mass message deletion. Use this command as following: \n!clear ")
          .addField("Kick 💝","Is somebody annoying? Use this command as following: \n!kick [@name] [reason]")
          .addField("Ban 🌷","Someone isn't listening?: Usage: \n!ban [@name] [reason]")
          .addField("space 🛠", "Make Spaces Beetwen Channel Name: Usage: \n!space all | ChannelMention")
          .addField("Mute 🔇","Some one isn't being so nice ?: Usage: \n!mute [@user] [reason]")
          .addField("Unmute 🔇","Some one being nice again ?: Usage: \n!unmute [@user] [reason]")
          .addField("Warn 📌","Some one being Stupid ?: Usage: \n!warn [@user] [@reason]")
          .addField("Antiraid 🔒","Bots spamming in your channels ?: Usage: \n!antiraid [Hours/Days/Secs/Min]")
          .addField("lockdown 🔒","Want to stop anyone from texting in a channe ?: Usage: \n!lockdown [Hours/Days/Secs/Min]")
          .addField("Roles 📖","Forgot your server Roles ? Easily check with this commands !: Usage: \n!roles")
          .addField("Whois 📌","Don't know some one ?: Usage: \n!whois [@user]")
          .addField("Roleinfo 👨‍✈️","Want to find out some simple details about a specific role ?: Usage: \n!roleinfo [role]")
          .addField("Membercount 🧮","Want know how much members you have ?: Usage: \n!membercount")
          .addField("Hide/Showchannel 🎚️","Want to Hide/Show a channel ?: Usage: \n!hidechannelm!showchannel")
          .addField("Allbots🤖","Want to see what kind of bots you have ? Usage: \n!allbots")
          .setTimestamp(new Date())
          .setFooter(`Requested by ${message.author.tag}`,`${message.author.avatarURL}`);
        m.edit(moderationEmbed);
        break;

      case "⬅️":
        let helpEmbed = new Discord.RichEmbed()
          .setTitle("__**🌷 Help 🌷**__")
          .setDescription(
            "Click on the corresponding emoji to get help about that object"
          )
          .setThumbnail(sIcon)
          .setColor("#FFFFFF")
          .addField("🌏 Setup", "Sets up your discord server", true)
          .addField("👑 Fun", "Fun commands, make you laugh", true)
          .addField("🛠 Moderation", "Sometimes you have to be hard", true)
          .addField("🔧 Verify", "Verify Commands!", true)
          .setTimestamp(new Date())
          .setFooter(
            `Requested by ${message.author.tag}`,
            `${message.author.avatarURL}`
          );
        m.edit(helpEmbed);
        break;
    }
  });
};

module.exports.help = {
  name: "!help"
};
