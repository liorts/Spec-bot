const { Client, RichEmbed } = require("discord.js");
const { CommandHandler } = require("djs-commands");
const client = new Client({ disableEveryone: true });
var approx = require("approximate-number");
const config = require("./config.json");
const prefix = "!";
const jimp = require("jimp");

client.on("ready", () => {
  console.log("Ready !");
  client.user.setActivity(`!help | !invite`, { type: "PLAING" });
});
// Stable Release
const Discord = require("discord.js");
const settings = require("./settings.json");
const sql = require("sqlite");

require("dotenv").config();

sql.open("./database.sqlite"); // Create database

const DESC_MIN_LENGTH = 30;
const DESC_MAX_LENGTH = 255;

const lastDate = [];

const commands = {
  help: msg => {
    msg.channel.send({
      embed: {
        title: "Help",
        description: `If you have any questions or would like to suggest new features or report bugs, please send them a direct message. All commands start with \`${settings.prefix}\`.`,
        fields: [
          {
            name: "invite",
            value: "A way to invite this bot to your own guild.",
            inline: true
          },
          {
            name: "init",
            value: "Synchronize advertisement channel.",
            inline: true
          },
          {
            name: "desc",
            value: "Set the description of your advertisement.",
            inline: true
          },
          {
            name: "preview",
            value: "Preview your advertisement.",
            inline: true
          },
          {
            name: "bump",
            value: "Bump your ad to all the other guilds.",
            inline: true
          },
          {},
          {
            name: "backup",
            value:
              "Load Or Create Backup Of You`re Server\n***To See More Backup Commands type ``!bhelp``***",
            inline: true
          },
          {
            name: "help",
            value: "Useless command.",
            inline: true
          }
        ]
      }
    });
  },
  bump: msg => {
    const ignoreCooldown = false;
    const now = new Date();
    const cooldown = 5 * 60 * 1000;
    if (lastDate[msg.guild.id] === undefined) {
      lastDate[msg.guild.id] = 0;
    }
    if (now - lastDate[msg.guild.id] > cooldown || ignoreCooldown) {
      // It's been more than 10 mins
      sql.all("SELECT * FROM settings").then(row => {
        msg.guild.fetchInvites().then(invites => {
          if (row.length - 1 <= 0) {
            sendEmbed(
              msg,
              "There are no other guilds for your advertisement to go, `!invite` and setup the bot on other guilds before trying again."
            );
            return;
          }

          if (invites.size > 0) {
            const invite = invites.first();

            bumpLogic(msg, row, invite);
          } else {
            // Create invite.
            let channelID;
            const channels = msg.guild.channels;
            for (const c of channels) {
              const channelType = c[1].type;
              if (channelType === "text") {
                channelID = c[0];
                break;
              }
            }

            const channel = channels.get(
              msg.guild.systemChannelID || channelID
            );
            channel.createInvite().then(invite => {
              bumpLogic(msg, row, invite);
              sendEmbed(
                msg,
                `Bumped sucessfully to **${row.length - 1}** guilds.`
              );
            });
          }
        });
      });
      lastDate[msg.guild.id] = now;
    } else {
      // It's been less than 10 mins
      const remaining = Math.round(
        (cooldown - (now - lastDate[msg.guild.id])) / 1000
      );
      sendEmbed(
        msg,
        `You must wait **${remaining} seconds** before you can use this command again.`
      );
    }
  },
  init: msg => {
    if (!msg.member.hasPermission("ADMINISTRATOR")) {
      return sendEmbed(
        msg,
        "You need to have the administrator permission to do this."
      );
    }
    const args = msg.content
      .slice(settings.prefix.length)
      .trim()
      .split(/ +/g)
      .slice(1);
    if (args[0] === undefined) {
      return sendEmbed(msg, "Please specify a channel.");
    }
    const channel = client.guilds
      .get(msg.guild.id)
      .channels.find("name", args[0]);
    if (channel) {
      sql.run("UPDATE settings SET partner = ? WHERE guildid = ?", [
        channel.id,
        msg.guild.id
      ]);
      sendEmbed(
        msg,
        "Success! Now go ahead and give your advertisement a `!desc` then `!bump` it!"
      );
    } else {
      sendEmbed(msg, "Invalid channel.");
    }
  },
  desc: msg => {
    if (!msg.member.hasPermission("ADMINISTRATOR")) {
      return sendEmbed(
        msg,
        "You need to have the administrator permission to do this."
      );
    }
    const desc = msg.content
      .slice(settings.prefix.length)
      .trim()
      .split(/ +/g)
      .slice(1)
      .join(" ");
    if (desc === undefined || desc === "") {
      return sendEmbed(
        msg,
        "Specify a guild description. Note that your guild invite will be attached automatically."
      );
    }

    if (desc.length > settings.ad.desc.max) {
      return sendEmbed(
        msg,
        `Description can not be more then ${DESC_MAX_LENGTH} characters long.`
      );
    }
    if (desc.length < settings.ad.desc.min) {
      return sendEmbed(
        msg,
        `Description must have at least ${DESC_MIN_LENGTH} characters in it.`
      );
    }
    if (
      desc.includes("http") ||
      desc.includes("@everyone") ||
      desc.includes("@here")
    ) {
      return msg.channel.send(
        "No links or mentions in the description please."
      );
    }
    sql.run("UPDATE settings SET desc = ? WHERE guildid = ?", [
      desc,
      msg.guild.id
    ]);
    sendEmbed(msg, "Description sucessfully updated.");
  },
  preview: msg => {
    if (!msg.member.hasPermission("ADMINISTRATOR")) {
      return sendEmbed(
        msg,
        "You need to have the administrator permission to do this."
      );
    }
    sql
      .get("SELECT * FROM settings WHERE guildid = ?", [msg.guild.id])
      .then(row => {
        const str = [
          `***__~~Modo Auto-Partner~~__***
                 Server Name: __**${msg.guild.name}**__\n`,
          `Server Desc: ${row.desc} \`[Invite will Appear Here]\``
        ];

        msg.channel.send(str.join("\n"));
      });
  }
};

client.on("ready", () => {
  // We have connected!
  console.log(
    `${client.user.tag} running on ${client.guilds.size} guilds with ${client.users.size} users.`
  );
  // Create the tables if they do not exist.
  sql
    .run(
      "CREATE TABLE IF NOT EXISTS settings (guildid TEXT UNIQUE, partner CHARACTER, desc VARCHAR)"
    )
    .then(() => {
      for (const guild of client.guilds.values()) {
        sql.run("INSERT OR IGNORE INTO settings (guildid) VALUES (?)", [
          guild.id
        ]);
      }
    });
});

client.on("guildCreate", guild => {
  console.log(`I have joined the guild ${guild.name}`);
  sql.run("INSERT OR IGNORE INTO settings (guildid) VALUES (?)", [guild.id]);
});

client.on("guildDelete", guild => {
  console.log(`I have left the guild ${guild.name}`);
  sql.run("DELETE * FROM settings WHERE guildid = ?", [guild.id]);
});

client.on("message", async msg => {
  // Handle the bot and channel type.
  if (msg.author.bot) return; // We don't want the bot reacting to itself..
  if (msg.channel.type !== "text") return; // Lets focus on the use of text channels.

  if (msg.content.startsWith(settings.prefix + "ping")) {
    const m = await msg.channel.send("Ping?");
    m.edit(
      `Pong! Latency is ${m.createdTimestamp -
        msg.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms.`
    );
    return;
  }

  // Handle Commands Module
  if (!msg.content.startsWith(settings.prefix)) return; // The start of commands.
  console.log(`[${msg.guild.name}] ${msg.author.tag} >> ${msg.content}`); // Log commands.
  const cmd = msg.content
    .toLowerCase()
    .slice(settings.prefix.length)
    .split(" ")[0]; // Grab the command.
  if (commands.hasOwnProperty(cmd)) {
    // Check to see if commands has the command.
    commands[cmd](msg); // Push the cmd to the commands object.
  }
});

function bumpLogic(msg, row, invite) {
  for (let i = 0; i < row.length; i++) {
    const guild = client.guilds.get(row[i].guildid);
    let desc = null;

    for (let a = 0; a < row.length; a++) {
      const temp = client.guilds.get(row[a].guildid);
      if (temp) {
        if (temp.id === msg.guild.id) {
          if (!msg.guild.channels.has(row[a].partner)) {
            sendEmbed(
              msg,
              `You must first initialize a channel for the bot in ${msg.guild.name} with \`${settings.prefix}init\`before you can bump your server.`
            );
            lastDate[msg.guild.id] = 0;
            return;
          }
          desc = row[a].desc;
          break;
        }
      }
    }

    if (desc === undefined || desc === null) {
      lastDate[msg.guild.id] = 0;
      return sendEmbed(
        msg,
        `A description for ${msg.guild.name} has not been set yet. Please set one.`
      );
    }
    if (guild) {
      if (guild.channels.has(row[i].partner) && guild.id !== msg.guild.id) {
        const str = [`__**${msg.guild.name}**__`, `${desc} ${invite.url}`];

        guild.channels.get(row[i].partner).send(str.join("\n\n"));
      }
    }
  }
}

function sendEmbed(msg, str) {
  const embedObject = {
    embed: {
      description: str
    }
  };

  if (!msg.channel.permissionsFor(client.user).has("EMBED_LINKS")) {
    return msg.channel.send("I need the embed links permission.");
  }

  if (!msg.channel.permissionsFor(client.user).has("MANAGE_MESSAGES")) {
    return msg.channel.send("I need manage messages permission.");
  }

  msg.channel.send(embedObject);
}

client.on("message", async message => {
  if (message.author.type === "bot") return;
  let args = message.content.split(" ");
  let command = args[0];
  let cmd = CH.getCommand(command);
  if (!cmd) return;

  try {
    cmd.run(client, message, args);
  } catch (e) {
    console.log(e);
  }
});

let info = client.emojis.get("655091815401127966") || "ℹ️";

client.on("guildCreate", guild => {
  let newserverEmbed = new RichEmbed()
    .setTitle(`${info}  Info`)
    .setDescription(
      `__Thanks for adding Spec to your server!__ :smiley:
Use \`!help\` to get a list of commands.).
It's also recommended to join our [discord server](https://discord.gg/MbDzaM) to get notified about future updates.**`
    )
    .setColor("#5DBCD2");
  guild.defaultChannel.send(newserverEmbed);
});
const moment = require("moment"); // D
const fs = require("fs");

let warnings = JSON.parse(fs.readFileSync("./warning.json", "utf8"));
client.on("message", message => {
  if (
    message.author.bot ||
    message.channel.type == "dm" ||
    !message.channel.guild
  )
    return;

  if (!message.content.startsWith(prefix)) return;
  let command = message.content.split(" ")[0];
  command = command.slice(prefix.length);
  if (command == "warn") {
    if (!message.member.hasPermission("MANAGE_GUILD")) return;
    if (!warnings[message.guild.id]) warnings[message.guild.id] = { warns: [] };
    let T = warnings[message.guild.id].warns;
    let user = message.mentions.users.first();
    if (!user)
      return message.channel.send(
        `**:rolling_eyes: I can't find this member**`
      );
    let reason = message.content
      .split(" ")
      .slice(2)
      .join(" ");
    if (!reason)
      return message.channel.send(
        `**:rolling_eyes: Please specify a reason.**`
      );
    let W = warnings[message.guild.id].warns;
    let ID = 0;
    let leng = 0;
    W.forEach(w => {
      ID++;
      if (w.id !== undefined) leng++;
    });
    if (leng === 90)
      return message.channel.send(
        `** You Can't Give More than \`90\` Warns**, please reset the warn list.`
      );
    T.push({
      user: user.id,
      by: message.author.id,
      reason: reason,
      time: moment(Date.now()).format("llll"),
      id: ID + 1
    });
    message.channel.send(`**✅ @${user.username} warned!**`);
    fs.writeFile("./warning.json", JSON.stringify(warnings), err => {
      if (err) console.error(err);
    });
    fs.writeFile("./warning.json", JSON.stringify(warnings), err => {
      if (err) console.error(err);
    });
    user.send(
      new Discord.RichEmbed()
        .addField("**:warning: You were warned!**", reason)
        .setFooter(message.guild.name, message.guild.iconURL)
        .setTimestamp()
        .setColor("#fffe62")
    );
    return;
  }
  if (command == "warnings") {
    if (!message.member.hasPermission("MANAGE_GUILD")) return;
    if (!warnings[message.guild.id]) warnings[message.guild.id] = { warns: [] };
    let count = 0;
    let page = message.content.split(" ")[1];
    if (!page || isNaN(page)) page = 1;
    if (page > 4)
      return message.channel.send("**Warnings are only recorded on 4 pages!**");
    let embed = new Discord.RichEmbed().setFooter(
      message.author.username,
      message.author.avatarURL
    );
    let W = warnings[message.guild.id].warns;
    W.forEach(w => {
      if (!w.id) return;
      count++;
      if (page == 1) {
        if (count > 24) return null;
        let reason = w.reason;
        let user = w.user;
        let ID = w.id;
        let By = w.by;
        let time = w.time;
        embed.addField(
          `⏱ ${time}`,
          `Warn ID (**${ID}**) - By <@${By}>
User: <@${user}>\n\`\`\`${reason}\`\`\``
        );
        if (count == 24)
          embed.addField(
            "**:sparkles: More ?**",
            `${message.content.split(" ")[0]} 2`
          );
      }
      if (page == 2) {
        if (count <= 24) return null;
        if (count > 45) return null;
        let reason = w.reason;
        let user = w.user;
        let ID = w.id;
        let By = w.by;
        let time = w.time;
        embed.addField(
          `⏱ ${time}`,
          `Warn ID (**${ID}**) - By <@${By}>
User: <@${user}>\n\`\`\`${reason}\`\`\``
        );
        if (count == 45)
          embed.addField(
            "**:sparkles: More ?**",
            `${message.content.split(" ")[0]} 3`
          );
      }
      if (page == 3) {
        if (count <= 45) return null;
        if (count > 69) return null;
        let reason = w.reason;
        let user = w.user;
        let ID = w.id;
        let By = w.by;
        let time = w.time;
        embed.addField(
          `⏱ ${time}`,
          `Warn ID (**${ID}**) - By <@${By}>
User: <@${user}>\n\`\`\`${reason}\`\`\``
        );
        if (count == 69)
          embed.addField(
            "**:sparkles: More ?**",
            `${message.content.split(" ")[0]} 4`
          );
      }
      if (page == 4) {
        if (count <= 69) return null;
        if (count > 92) return null;
        let reason = w.reason;
        let user = w.user;
        let ID = w.id;
        let By = w.by;
        let time = w.time;
        embed.addField(
          `⏱ ${time}`,
          `Warn ID (**${ID}**) - By <@${By}>
User: <@${user}>\n\`\`\`${reason}\`\`\``
        );
        if (count == 64) embed.addField("**FULL**", `** **`);
      }
    });
    embed.setTitle(`**${count} Warnings** [ ${page}/4 ]`);
    message.channel.send(embed);
  }
  if (command == "removewarn" || command == "rm") {
    if (!message.member.hasPermission("MANAGE_GUILD")) return;
    if (!warnings[message.guild.id]) warnings[message.guild.id] = { warns: [] };
    let args = message.content.split(" ")[1];
    if (!args)
      return message.channel.send(
        `**:rolling_eyes: Please specify warnings number or user mention or (all) to delete all warnings.**`
      );
    let user = message.mentions.members.first();
    if (user) {
      let C = 0;
      let a = warnings[message.guild.id].warns;
      a.forEach(w => {
        if (w.user !== user.id) return;
        delete w.user;
        delete w.reason;
        delete w.id;
        delete w.by;
        delete w.time;
        C++;
      });
      if (C === 0)
        return message.channel.send(
          `**:mag: I can't find the warning that you're looking for.**`
        );
      return message.channel.send(
        "**✅ " + C + " warnings has been removed.**"
      );
    }
    if (args == "all") {
      let c = 0;
      let W = warnings[message.guild.id].warns;
      W.forEach(w => {
        if (w.id !== undefined) c++;
      });
      warnings[message.guild.id] = { warns: [] };
      fs.writeFile("./warning.json", JSON.stringify(warnings), err => {
        if (err) console.error(err);
      });
      fs.writeFile("./warning.json", JSON.stringify(warnings), err => {
        if (err) console.error(err);
      });
      return message.channel.send(
        "**✅ " + c + " warnings has been removed.**"
      );
    }
    if (isNaN(args))
      return message.channel.send(
        `**:rolling_eyes: Please specify warnings number or user mention or (all) to delete all warnings.**`
      );
    let W = warnings[message.guild.id].warns;
    let find = false;
    W.forEach(w => {
      if (w.id == args) {
        delete w.user;
        delete w.reason;
        delete w.id;
        delete w.by;
        delete w.time;
        find = true;
        return message.channel.send("**✅ 1 warnings has been removed.**");
      }
    });
    if (find == false)
      return message.channel.send(
        `**:mag: I can't find the warning that you're looking for.**`
      );
  }
});

//let xp = require("./xp.json"); //سوي ملف بأسم xp.json

//client.on("message", message => {
//  if (message.author.bot) return;
//  if (message.channel.type == "dm") return;

//  let Addxp = Math.floor(Math.random() * 6) + 8;

// if (!xp[message.author.id]) {
//   xp[message.author.id] = {
//     xp: 0,
//     level: 1
//    };
//  }

//  let curxp = xp[message.author.id].xp;
//  let curlvl = xp[message.author.id].level + 1;
//  let nextLvL = xp[message.author.id].level * 1000; //كل كم اكس بي لحتا يرتفع لفله انصحكم تخلونه فوق ال الف
//  xp[message.author.id].xp = curxp + Addxp;
//  if (nextLvL <= xp[message.author.id].xp) {
//   xp[message.author.id].level = xp[message.author.id].level + 1;
//
//    let lvlup = new Discord.RichEmbed()
//     .setTitle("Level Up!")
//      .setColor("RANDOM")
//      .setDescription(`New Level: ` + curlvl)
//    .setTimestamp()
//    .setFooter(message.author.username + "#" + message.author.discriminator);
//   message.channel.send(lvlup);
//}
//  fs.writeFile("./xp.json", JSON.stringify(xp), err => {
//  if (err) console.lo

client.on("message", message => {
  if (message.content.startsWith(prefix + "support")) {
    const embed = new Discord.RichEmbed()
      .setTitle("Modo Support Server Link")
      .setDescription(`**[Click 🕹️ Here](https://discord.gg/bJq5D3T)**`)
      .setColor("RANDOM");
    message.author.send(embed);
    message.react("✅");
  }
});
const db = require("quick.db");

client.on("guildMemberAdd", async member => {
  const serverstats = new db.table("ServerStats");
  let sguildid = await serverstats.fetch(`Stats_${member.guild.id}`, {
    target: ".guildid"
  });
  let tusers = await serverstats.fetch(`Stats_${member.guild.id}`, {
    target: ".totusers"
  });
  let membs = await serverstats.fetch(`Stats_${member.guild.id}`, {
    target: ".membcount"
  });
  let bots = await serverstats.fetch(`Stats_${member.guild.id}`, {
    target: ".botcount"
  });

  const totalsize = member.guild.memberCount;
  const botsize = member.guild.members.filter(m => m.user.bot).size;
  const humansize = totalsize - botsize;

  if (member.guild.id === sguildid) {
    member.guild.channels
      .get(tusers)
      .setName("Total Users : " + member.guild.memberCount);
    member.guild.channels.get(membs).setName("Human Users : " + humansize);
    member.guild.channels
      .get(bots)
      .setName(
        "Bot Users : " + member.guild.members.filter(m => m.user.bot).size
      );
  }
});

client.on("guildMemberRemove", async member => {
  const serverstats = new db.table("ServerStats");
  let sguildid = await serverstats.fetch(`Stats_${member.guild.id}`, {
    target: ".guildid"
  });
  let tusers = await serverstats.fetch(`Stats_${member.guild.id}`, {
    target: ".totusers"
  });
  let membs = await serverstats.fetch(`Stats_${member.guild.id}`, {
    target: ".membcount"
  });
  let bots = await serverstats.fetch(`Stats_${member.guild.id}`, {
    target: ".botcount"
  });

  const totalsize = member.guild.memberCount;
  const botsize = member.guild.members.filter(m => m.user.bot).size;
  const humansize = totalsize - botsize;

  if (member.guild.id === sguildid) {
    member.guild.channels
      .get(tusers)
      .setName("Total Users : " + member.guild.memberCount);
    member.guild.channels.get(membs).setName("Human Users : " + humansize);
    member.guild.channels
      .get(bots)
      .setName(
        "Bot Users : " + member.guild.members.filter(m => m.user.bot).size
      );
  }
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;

  let prefix = "!";

  let args = message.content
    .slice(prefix.length)
    .trim()
    .split(" ");
  let cmd = args.shift().toLowerCase();
  if (!message.content.startsWith(prefix)) return;

  try {
    let commandFile = require(`./commands/${cmd}.js`);
    commandFile.run(client, message, args);
  } catch (e) {
    console.log(e);
  }
});
client.on("message", message => {
  if (message.channel.id == "668144561935089676") {
    message.react("👍");
    message.react("👎");
    console.log("suggestion received!");
  }
});

const log = JSON.parse(fs.readFileSync("./log.json", "utf8"));
//Perfect log Code
client.on("message", message => {
  let room = message.content.split(" ").slice(1);
  let findroom = message.guild.channels.find("name", `${room}`);
  if (message.content.startsWith(prefix + "setlog")) {
    if (message.author.bot) return;
    if (!message.channel.guild)
      return message.reply("**This Command is Just For Servers!**");
    if (!message.member.hasPermission("MANAGE_GUILD"))
      return message.channel.send(
        "**Sorry But You Dont Have Permission** `MANAGE_GUILD`"
      );
    if (!room) return message.channel.send("Please Type The Channel Name");
    if (!findroom)
      return message.channel.send("Please Type The Log Channel Name");
    let embed = new Discord.RichEmbed()
      .setTitle("**Done The Log Code Has Been Setup**")
      .addField("Channel:", `${room}`)
      .addField("Requested By:", `${message.author}`)
      .setThumbnail(message.author.avatarURL)
      .setFooter(`${client.user.username}`);
    message.channel.sendEmbed(embed);
    log[message.guild.id] = {
      channel: room,
      onoff: "On"
    };
    fs.writeFile("./log.json", JSON.stringify(log), err => {
      if (err) console.error(err);
    });
  }
});

client.on("message", message => {
  if (message.content.startsWith(prefix + "logtoggle")) {
    if (message.author.bot) return;
    if (!message.channel.guild)
      return message.reply("**This Command is Just For Servers!**");
    if (!message.member.hasPermission("MANAGE_GUILD"))
      return message.channel.send(
        "**Sorry But You Dont Have Permission** `MANAGE_GUILD`"
      );
    if (!log[message.guild.id])
      log[message.guild.id] = {
        onoff: "Off"
      };
    if (log[message.guild.id].onoff === "Off")
      return [
        message.channel.send(`**The log Is On!**`),
        (log[message.guild.id].onoff = "On")
      ];
    if (log[message.guild.id].onoff === "On")
      return [
        message.channel.send(`**The log Is Off!**`),
        (log[message.guild.id].onoff = "Off")
      ];
    fs.writeFile("./log.json", JSON.stringify(log), err => {
      if (err)
        console.error(err).catch(err => {
          console.error(err);
        });
    });
  }
});

client.on("messageDelete", message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;
  if (!message.guild.member(client.user).hasPermission("EMBED_LINKS")) return;
  if (!message.guild.member(client.user).hasPermission("MANAGE_MESSAGES"))
    return;
  if (!log[message.guild.id])
    log[message.guild.id] = {
      onoff: "Off"
    };
  if (log[message.guild.id].onoff === "Off") return;
  var logChannel = message.guild.channels.find(
    c => c.name === `${log[message.guild.id].channel}`
  );
  if (!logChannel) return;

  let messageDelete = new Discord.RichEmbed()
    .setTitle("**[MESSAGE DELETE]**")
    .setColor("RED")
    .setThumbnail(message.author.avatarURL)
    .setDescription(
      `**\n**:wastebasket: Successfully \`\`DELETE\`\` **MESSAGE** In ${message.channel}\n\n**Channel:** \`\`${message.channel.name}\`\` (ID: ${message.channel.id})\n**Message ID:** ${message.id}\n**Sent By:** <@${message.author.id}> (ID: ${message.author.id})\n**Message:**\n\`\`\`${message}\`\`\``
    )
    .setTimestamp()
    .setFooter(message.guild.name, message.guild.iconURL);

  logChannel.send(messageDelete);
});
client.on("messageUpdate", (oldMessage, newMessage) => {
  if (oldMessage.author.bot) return;
  if (!oldMessage.channel.type === "dm") return;
  if (!oldMessage.guild.member(client.user).hasPermission("EMBED_LINKS"))
    return;
  if (!oldMessage.guild.member(client.user).hasPermission("MANAGE_MESSAGES"))
    return;
  if (!log[oldMessage.guild.id])
    log[oldMessage.guild.id] = {
      onoff: "Off"
    };
  if (log[oldMessage.guild.id].onoff === "Off") return;
  var logChannel = oldMessage.guild.channels.find(
    c => c.name === `${log[oldMessage.guild.id].channel}`
  );
  if (!logChannel) return;

  if (oldMessage.content.startsWith("https://")) return;

  let messageUpdate = new Discord.RichEmbed()
    .setTitle("**[MESSAGE EDIT]**")
    .setThumbnail(oldMessage.author.avatarURL)
    .setColor("BLUE")
    .setDescription(
      `**\n**:wrench: Successfully \`\`EDIT\`\` **MESSAGE** In ${oldMessage.channel}\n\n**Channel:** \`\`${oldMessage.channel.name}\`\` (ID: ${oldMessage.channel.id})\n**Message ID:** ${oldMessage.id}\n**Sent By:** <@${oldMessage.author.id}> (ID: ${oldMessage.author.id})\n\n**Old Message:**\`\`\`${oldMessage}\`\`\`\n**New Message:**\`\`\`${newMessage}\`\`\``
    )
    .setTimestamp()
    .setFooter(oldMessage.guild.name, oldMessage.guild.iconURL);

  logChannel.send(messageUpdate);
});

client.on("roleCreate", role => {
  if (!role.guild.member(client.user).hasPermission("EMBED_LINKS")) return;
  if (!role.guild.member(client.user).hasPermission("VIEW_AUDIT_LOG")) return;
  if (!log[role.guild.id])
    log[role.guild.id] = {
      onoff: "Off"
    };
  if (log[role.guild.id].onoff === "Off") return;
  var logChannel = role.guild.channels.find(
    c => c.name === `${log[role.guild.id].channel}`
  );
  if (!logChannel) return;

  role.guild.fetchAuditLogs().then(logs => {
    var userID = logs.entries.first().executor.id;
    var userAvatar = logs.entries.first().executor.avatarURL;

    let roleCreate = new Discord.RichEmbed()
      .setTitle("**[ROLE CREATE]**")
      .setThumbnail(userAvatar)
      .setDescription(
        `**\n**:white_check_mark: Successfully \`\`CREATE\`\` Role.\n\n**Role Name:** \`\`${role.name}\`\` (ID: ${role.id})\n**By:** <@${userID}> (ID: ${userID})`
      )
      .setColor("GREEN")
      .setTimestamp()
      .setFooter(role.guild.name, role.guild.iconURL);

    logChannel.send(roleCreate);
  });
});
client.on("roleDelete", role => {
  if (!role.guild.member(client.user).hasPermission("EMBED_LINKS")) return;
  if (!role.guild.member(client.user).hasPermission("VIEW_AUDIT_LOG")) return;
  if (!log[role.guild.id])
    log[role.guild.id] = {
      onoff: "Off"
    };
  if (log[role.guild.id].onoff === "Off") return;
  var logChannel = role.guild.channels.find(
    c => c.name === `${log[role.guild.id].channel}`
  );
  if (!logChannel) return;

  role.guild.fetchAuditLogs().then(logs => {
    var userID = logs.entries.first().executor.id;
    var userAvatar = logs.entries.first().executor.avatarURL;

    let roleDelete = new Discord.RichEmbed()
      .setTitle("**[ROLE DELETE]**")
      .setThumbnail(userAvatar)
      .setDescription(
        `**\n**:white_check_mark: Successfully \`\`DELETE\`\` Role.\n\n**Role Name:** \`\`${role.name}\`\` (ID: ${role.id})\n**By:** <@${userID}> (ID: ${userID})`
      )
      .setColor("RED")
      .setTimestamp()
      .setFooter(role.guild.name, role.guild.iconURL);

    logChannel.send(roleDelete);
  });
});
client.on("roleUpdate", (oldRole, newRole) => {
  if (!oldRole.guild.member(client.user).hasPermission("EMBED_LINKS")) return;
  if (!oldRole.guild.member(client.user).hasPermission("VIEW_AUDIT_LOG"))
    return;
  if (!log[oldRole.guild.id])
    log[oldRole.guild.id] = {
      onoff: "Off"
    };
  if (log[oldRole.guild.id].onoff === "Off") return;
  var logChannel = oldRole.guild.channels.find(
    c => c.name === `${log[oldRole.guild.id].channel}`
  );
  if (!logChannel) return;

  oldRole.guild.fetchAuditLogs().then(logs => {
    var userID = logs.entries.first().executor.id;
    var userAvatar = logs.entries.first().executor.avatarURL;

    if (oldRole.name !== newRole.name) {
      if (log[oldRole.guild.id].onoff === "Off") return;
      let roleUpdateName = new Discord.RichEmbed()
        .setTitle("**[ROLE NAME UPDATE]**")
        .setThumbnail(userAvatar)
        .setColor("BLUE")
        .setDescription(
          `**\n**:white_check_mark: Successfully \`\`EDITED\`\` Role Name.\n\n**Old Name:** \`\`${oldRole.name}\`\`\n**New Name:** \`\`${newRole.name}\`\`\n**Role ID:** ${oldRole.id}\n**By:** <@${userID}> (ID: ${userID})`
        )
        .setTimestamp()
        .setFooter(oldRole.guild.name, oldRole.guild.iconURL);

      logChannel.send(roleUpdateName);
    }
    if (oldRole.hexColor !== newRole.hexColor) {
      if (oldRole.hexColor === "#000000") {
        var oldColor = "`Default`";
      } else {
        var oldColor = oldRole.hexColor;
      }
      if (newRole.hexColor === "#000000") {
        var newColor = "`Default`";
      } else {
        var newColor = newRole.hexColor;
      }
      if (log[oldRole.guild.id].onoff === "Off") return;
      let roleUpdateColor = new Discord.RichEmbed()
        .setTitle("**[ROLE COLOR UPDATE]**")
        .setThumbnail(userAvatar)
        .setColor("BLUE")
        .setDescription(
          `**\n**:white_check_mark: Successfully \`\`EDITED\`\` **${oldRole.name}** Role Color.\n\n**Old Color:** ${oldColor}\n**New Color:** ${newColor}\n**Role ID:** ${oldRole.id}\n**By:** <@${userID}> (ID: ${userID})`
        )
        .setTimestamp()
        .setFooter(oldRole.guild.name, oldRole.guild.iconURL);

      logChannel.send(roleUpdateColor);
    }
  });
  client.on("channelCreate", channel => {
    if (!channel.guild) return;
    if (!channel.guild.member(client.user).hasPermission("EMBED_LINKS")) return;
    if (!channel.guild.member(client.user).hasPermission("VIEW_AUDIT_LOG"))
      return;
    if (!log[channel.guild.id])
      log[channel.guild.id] = {
        onoff: "Off"
      };
    if (log[channel.guild.id].onoff === "Off") return;
    var logChannel = channel.guild.channels.find(
      c => c.name === `${log[channel.guild.id].channel}`
    );
    if (!logChannel) return;

    if (channel.type === "text") {
      var roomType = "Text";
    } else if (channel.type === "voice") {
      var roomType = "Voice";
    } else if (channel.type === "category") {
      var roomType = "Category";
    }

    channel.guild.fetchAuditLogs().then(logs => {
      var userID = logs.entries.first().executor.id;
      var userAvatar = logs.entries.first().executor.avatarURL;

      let channelCreate = new Discord.RichEmbed()
        .setTitle("**[CHANNEL CREATE]**")
        .setThumbnail(userAvatar)
        .setDescription(
          `**\n**:white_check_mark: Successfully \`\`CREATE\`\` **${roomType}** channel.\n\n**Channel Name:** \`\`${channel.name}\`\` (ID: ${channel.id})\n**By:** <@${userID}> (ID: ${userID})`
        )
        .setColor("GREEN")
        .setTimestamp()
        .setFooter(channel.guild.name, channel.guild.iconURL);

      logChannel.send(channelCreate);
    });
  });
  client.on("channelDelete", channel => {
    if (!channel.guild) return;
    if (!channel.guild.member(client.user).hasPermission("EMBED_LINKS")) return;
    if (!channel.guild.member(client.user).hasPermission("VIEW_AUDIT_LOG"))
      return;
    if (!log[channel.guild.id])
      log[channel.guild.id] = {
        onoff: "Off"
      };
    if (log[channel.guild.id].onoff === "Off") return;
    var logChannel = channel.guild.channels.find(
      c => c.name === `${log[channel.guild.id].channel}`
    );
    if (!logChannel) return;

    if (channel.type === "text") {
      var roomType = "Text";
    } else if (channel.type === "voice") {
      var roomType = "Voice";
    } else if (channel.type === "category") {
      var roomType = "Category";
    }

    channel.guild.fetchAuditLogs().then(logs => {
      var userID = logs.entries.first().executor.id;
      var userAvatar = logs.entries.first().executor.avatarURL;

      let channelDelete = new Discord.RichEmbed()
        .setTitle("**[CHANNEL DELETE]**")
        .setThumbnail(userAvatar)
        .setDescription(
          `**\n**:white_check_mark: Successfully \`\`DELETE\`\` **${roomType}** channel.\n\n**Channel Name:** \`\`${channel.name}\`\` (ID: ${channel.id})\n**By:** <@${userID}> (ID: ${userID})`
        )
        .setColor("RED")
        .setTimestamp()
        .setFooter(channel.guild.name, channel.guild.iconURL);

      logChannel.send(channelDelete);
    });
  });
  client.on("channelUpdate", (oldChannel, newChannel) => {
    if (!oldChannel.guild) return;
    if (!log[oldChannel.guild.id])
      log[oldChannel.guild.id] = {
        onoff: "Off"
      };
    if (log[oldChannel.guild.id].onoff === "Off") return;
    var logChannel = oldChannel.guild.channels.find(
      c => c.name === `${log[oldChannel.guild.id].channel}`
    );
    if (!logChannel) return;

    if (oldChannel.type === "text") {
      var channelType = "Text";
    } else if (oldChannel.type === "voice") {
      var channelType = "Voice";
    } else if (oldChannel.type === "category") {
      var channelType = "Category";
    }

    oldChannel.guild.fetchAuditLogs().then(logs => {
      var userID = logs.entries.first().executor.id;
      var userAvatar = logs.entries.first().executor.avatarURL;

      if (oldChannel.name !== newChannel.name) {
        let newName = new Discord.RichEmbed()
          .setTitle("**[CHANNEL EDIT]**")
          .setThumbnail(userAvatar)
          .setColor("BLUE")
          .setDescription(
            `**\n**:wrench: Successfully Edited **${channelType}** Channel Name\n\n**Old Name:** \`\`${oldChannel.name}\`\`\n**New Name:** \`\`${newChannel.name}\`\`\n**Channel ID:** ${oldChannel.id}\n**By:** <@${userID}> (ID: ${userID})`
          )
          .setTimestamp()
          .setFooter(oldChannel.guild.name, oldChannel.guild.iconURL);

        logChannel.send(newName);
      }
      if (oldChannel.topic !== newChannel.topic) {
        if (log[oldChannel.guild.id].onoff === "Off") return;
        let newTopic = new Discord.RichEmbed()
          .setTitle("**[CHANNEL EDIT]**")
          .setThumbnail(userAvatar)
          .setColor("BLUE")
          .setDescription(
            `**\n**:wrench: Successfully Edited **${channelType}** Channel Topic\n\n**Old Topic:**\n\`\`\`${oldChannel.topic ||
              "NULL"}\`\`\`\n**New Topic:**\n\`\`\`${newChannel.topic ||
              "NULL"}\`\`\`\n**Channel:** ${oldChannel} (ID: ${
              oldChannel.id
            })\n**By:** <@${userID}> (ID: ${userID})`
          )
          .setTimestamp()
          .setFooter(oldChannel.guild.name, oldChannel.guild.iconURL);

        logChannel.send(newTopic);
      }
    });
  });

  client.on("guildBanAdd", (guild, user) => {
    if (!guild.member(client.user).hasPermission("EMBED_LINKS")) return;
    if (!guild.member(client.user).hasPermission("VIEW_AUDIT_LOG")) return;
    if (!log[guild.guild.id])
      log[guild.guild.id] = {
        onoff: "Off"
      };
    if (log[guild.guild.id].onoff === "Off") return;
    var logChannel = guild.channels.find(
      c => c.name === `${log[guild.guild.id].channel}`
    );
    if (!logChannel) return;

    guild.fetchAuditLogs().then(logs => {
      var userID = logs.entries.first().executor.id;
      var userAvatar = logs.entries.first().executor.avatarURL;

      if (userID === client.user.id) return;

      let banInfo = new Discord.RichEmbed()
        .setTitle("**[BANNED]**")
        .setThumbnail(userAvatar)
        .setColor("DARK_RED")
        .setDescription(
          `**\n**:airplane: Successfully \`\`BANNED\`\` **${user.username}** From the server!\n\n**User:** <@${user.id}> (ID: ${user.id})\n**By:** <@${userID}> (ID: ${userID})`
        )
        .setTimestamp()
        .setFooter(guild.name, guild.iconURL);

      logChannel.send(banInfo);
    });
  });
  client.on("guildBanRemove", (guild, user) => {
    if (!guild.member(client.user).hasPermission("EMBED_LINKS")) return;
    if (!guild.member(client.user).hasPermission("VIEW_AUDIT_LOG")) return;
    if (!log[guild.guild.id])
      log[guild.guild.id] = {
        onoff: "Off"
      };
    if (log[guild.guild.id].onoff === "Off") return;
    var logChannel = guild.channels.find(
      c => c.name === `${log[guild.guild.id].channel}`
    );
    if (!logChannel) return;

    guild.fetchAuditLogs().then(logs => {
      var userID = logs.entries.first().executor.id;
      var userAvatar = logs.entries.first().executor.avatarURL;

      if (userID === client.user.id) return;

      let unBanInfo = new Discord.RichEmbed()
        .setTitle("**[UNBANNED]**")
        .setThumbnail(userAvatar)
        .setColor("GREEN")
        .setDescription(
          `**\n**:unlock: Successfully \`\`UNBANNED\`\` **${user.username}** From the server\n\n**User:** <@${user.id}> (ID: ${user.id})\n**By:** <@${userID}> (ID: ${userID})`
        )
        .setTimestamp()
        .setFooter(guild.name, guild.iconURL);

      logChannel.send(unBanInfo);
    });
  });
  client.on("guildUpdate", (oldGuild, newGuild) => {
    if (!oldGuild.member(client.user).hasPermission("EMBED_LINKS")) return;
    if (!oldGuild.member(client.user).hasPermission("VIEW_AUDIT_LOG")) return;
    if (!log[oldGuild.guild.id])
      log[oldGuild.guild.id] = {
        onoff: "Off"
      };
    if (log[oldGuild.guild.id].onoff === "Off") return;
    var logChannel = oldGuild.channels.find(
      c => c.name === `${log[oldGuild.guild.id].channel}`
    );
    if (!logChannel) return;

    oldGuild.fetchAuditLogs().then(logs => {
      var userID = logs.entries.first().executor.id;
      var userAvatar = logs.entries.first().executor.avatarURL;

      if (oldGuild.name !== newGuild.name) {
        let guildName = new Discord.RichEmbed()
          .setTitle("**[CHANGE GUILD NAME]**")
          .setThumbnail(userAvatar)
          .setColor("BLUE")
          .setDescription(
            `**\n**:white_check_mark: Successfully \`\`EDITED\`\` The guild name.\n\n**Old Name:** \`\`${oldGuild.name}\`\`\n**New Name:** \`\`${newGuild.name}\`\`\n**By:** <@${userID}> (ID: ${userID})`
          )
          .setTimestamp()
          .setFooter(newGuild.name, oldGuild.iconURL);

        logChannel.send(guildName);
      }
      if (oldGuild.region !== newGuild.region) {
        if (log[newGuild.regon.guild.id].onoff === "Off") return;
        let guildRegion = new Discord.RichEmbed()
          .setTitle("**[CHANGE GUILD REGION]**")
          .setThumbnail(userAvatar)
          .setColor("BLUE")
          .setDescription(
            `**\n**:white_check_mark: Successfully \`\`EDITED\`\` The guild region.\n\n**Old Region:** ${oldGuild.region}\n**New Region:** ${newGuild.region}\n**By:** <@${userID}> (ID: ${userID})`
          )
          .setTimestamp()
          .setFooter(oldGuild.name, oldGuild.iconURL);

        logChannel.send(guildRegion);
      }
      if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
        if (oldGuild.verificationLevel === 0) {
          var oldVerLvl = "Very Easy";
        } else if (oldGuild.verificationLevel === 1) {
          var oldVerLvl = "Easy";
        } else if (oldGuild.verificationLevel === 2) {
          var oldVerLvl = "Medium";
        } else if (oldGuild.verificationLevel === 3) {
          var oldVerLvl = "Hard";
        } else if (oldGuild.verificationLevel === 4) {
          var oldVerLvl = "Very Hard";
        }

        if (newGuild.verificationLevel === 0) {
          var newVerLvl = "Very Easy";
        } else if (newGuild.verificationLevel === 1) {
          var newVerLvl = "Easy";
        } else if (newGuild.verificationLevel === 2) {
          var newVerLvl = "Medium";
        } else if (newGuild.verificationLevel === 3) {
          var newVerLvl = "Hard";
        } else if (newGuild.verificationLevel === 4) {
          var newVerLvl = "Very Hard";
        }
        if (log[newGuild.region.guild.id].onoff === "Off") return;
        let verLog = new Discord.RichEmbed()
          .setTitle("**[GUILD VERIFICATION LEVEL CHANGE]**")
          .setThumbnail(userAvatar)
          .setColor("BLUE")
          .setDescription(
            `**\n**:white_check_mark: Successfully \`\`EDITED\`\` Guild Verification level.\n\n**Old Verification Level:** ${oldVerLvl}\n**New Verification Level:** ${newVerLvl}\n**By:** <@${userID}> (ID: ${userID})`
          )
          .setTimestamp()
          .setFooter(oldGuild.name, oldGuild.iconURL);

        logChannel.send(verLog);
      }
    });
  });
  client.on("guildMemberUpdate", (oldMember, newMember) => {
    if (!oldMember.guild) return;
    if (!log[oldMember.guild.id])
      log[oldMember.guild.id] = {
        onoff: "Off"
      };
    if (log[oldMember.guild.id].onoff === "Off") return;
    var logChannel = oldMember.guild.channels.find(
      c => c.name === `${log[(oldMember, newMember.guild.id)].channel}`
    );
    if (!logChannel) return;

    oldMember.guild.fetchAuditLogs().then(logs => {
      var userID = logs.entries.first().executor.id;
      var userAvatar = logs.entries.first().executor.avatarURL;
      var userTag = logs.entries.first().executor.tag;

      if (oldMember.nickname !== newMember.nickname) {
        if (oldMember.nickname === null) {
          var oldNM = "`Old Name`";
        } else {
          var oldNM = oldMember.nickname;
        }
        if (newMember.nickname === null) {
          var newNM = "`New Name`";
        } else {
          var newNM = newMember.nickname;
        }

        let updateNickname = new Discord.RichEmbed()
          .setTitle("**[UPDATE MEMBER NICKNAME]**")
          .setThumbnail(userAvatar)
          .setColor("BLUE")
          .setDescription(
            `**\n**:spy: Successfully \`\`CHANGE\`\` Member Nickname.\n\n**User:** ${oldMember} (ID: ${oldMember.id})\n**Old Nickname:** ${oldMember.nickname}\n**New Nickname:** ${newNM}\n**By:** <@${userID}> (ID: ${userID})`
          )
          .setTimestamp()
          .setFooter(oldMember.guild.name, oldMember.guild.iconURL);

        logChannel.send(updateNickname);
      }
      if (oldMember.roles.size < newMember.roles.size) {
        let role = newMember.roles
          .filter(r => !oldMember.roles.has(r.id))
          .first();
        if (!log[oldMember.guild.id])
          log[oldMember.guild.id] = {
            onoff: "Off"
          };
        if (log[oldMember.guild.id].onoff === "Off") return;
        let roleAdded = new Discord.RichEmbed()
          .setTitle("**[ADDED ROLE TO MEMBER]**")
          .setThumbnail(oldMember.guild.iconURL)
          .setColor("GREEN")
          .setDescription(
            `**\n**:white_check_mark: Successfully \`\`ADDED\`\` Role to **${oldMember.user.username}**\n\n**User:** <@${oldMember.id}> (ID: ${oldMember.user.id})\n**Role:** \`\`${role.name}\`\` (ID: ${role.id})\n**By:** <@${userID}> (ID: ${userID})`
          )
          .setTimestamp()
          .setFooter(userTag, userAvatar);

        logChannel.send(roleAdded);
      }
      if (oldMember.roles.size > newMember.roles.size) {
        let role = oldMember.roles
          .filter(r => !newMember.roles.has(r.id))
          .first();
        if (!log[oldMember.guild.id])
          log[oldMember.guild.id] = {
            onoff: "Off"
          };
        if (log[(oldMember, newMember.guild.id)].onoff === "Off") return;
        let roleRemoved = new Discord.RichEmbed()
          .setTitle("**[REMOVED ROLE FROM MEMBER]**")
          .setThumbnail(oldMember.guild.iconURL)
          .setColor("RED")
          .setDescription(
            `**\n**:negative_squared_cross_mark: Successfully \`\`REMOVED\`\` Role from **${oldMember.user.username}**\n\n**User:** <@${oldMember.user.id}> (ID: ${oldMember.id})\n**Role:** \`\`${role.name}\`\` (ID: ${role.id})\n**By:** <@${userID}> (ID: ${userID})`
          )
          .setTimestamp()
          .setFooter(userTag, userAvatar);

        logChannel.send(roleRemoved);
      }
    });
    if (oldMember.guild.owner.id !== newMember.guild.owner.id) {
      if (!log[oldMember.guild.id])
        log[oldMember.guild.id] = {
          onoff: "Off"
        };
      if (log[(oldMember, newMember.guild.id)].onoff === "Off") return;
      let newOwner = new Discord.RichEmbed()
        .setTitle("**[UPDATE GUILD OWNER]**")
        .setThumbnail(oldMember.guild.iconURL)
        .setColor("GREEN")
        .setDescription(
          `**\n**:white_check_mark: Successfully \`\`TRANSFER\`\` The Owner Ship.\n\n**Old Owner:** <@${oldMember.user.id}> (ID: ${oldMember.user.id})\n**New Owner:** <@${newMember.user.id}> (ID: ${newMember.user.id})`
        )
        .setTimestamp()
        .setFooter(oldMember.guild.name, oldMember.guild.iconURL);

      logChannel.send(newOwner);
    }
  });

  client.on("voiceStateUpdate", (voiceOld, voiceNew) => {
    if (!voiceOld.guild.member(client.user).hasPermission("EMBED_LINKS"))
      return;
    if (!voiceOld.guild.member(client.user).hasPermission("VIEW_AUDIT_LOG"))
      return;
    if (!log[voiceOld.guild.id])
      log[voiceOld.guild.id] = {
        onoff: "Off"
      };
    if (log[(voiceOld, voiceOld.guild.id)].onoff === "Off") return;
    var logChannel = voiceOld.guild.channels.find(
      c => c.name === `${log[(voiceOld, voiceNew.guild.id)].channel}`
    );
    if (!logChannel) return;

    voiceOld.guild.fetchAuditLogs().then(logs => {
      var userID = logs.entries.first().executor.id;
      var userTag = logs.entries.first().executor.tag;
      var userAvatar = logs.entries.first().executor.avatarURL;

      if (voiceOld.serverMute === false && voiceNew.serverMute === true) {
        let serverMutev = new Discord.RichEmbed()
          .setTitle("**[VOICE MUTE]**")
          .setThumbnail(
            "https://images-ext-1.discordapp.net/external/pWQaw076OHwVIFZyeFoLXvweo0T_fDz6U5C9RBlw_fQ/https/cdn.pg.sa/UosmjqDNgS.png"
          )
          .setColor("RED")
          .setDescription(
            `**User:** ${voiceOld} (ID: ${voiceOld.id})\n**By:** <@${userID}> (ID: ${userID})\n**Channel:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannel.id})`
          )
          .setTimestamp()
          .setFooter(userTag, userAvatar);

        logChannel.send(serverMutev);
      }
      if (voiceOld.serverMute === true && voiceNew.serverMute === false) {
        if (!log[voiceOld.guild.id])
          log[voiceOld.guild.id] = {
            onoff: "Off"
          };
        if (log[(voiceOld, voiceOld.guild.id)].onoff === "Off") return;
        let serverUnmutev = new Discord.RichEmbed()
          .setTitle("**[VOICE UNMUTE]**")
          .setThumbnail(
            "https://images-ext-1.discordapp.net/external/u2JNOTOc1IVJGEb1uCKRdQHXIj5-r8aHa3tSap6SjqM/https/cdn.pg.sa/Iy4t8H4T7n.png"
          )
          .setColor("GREEN")
          .setDescription(
            `**User:** ${voiceOld} (ID: ${voiceOld.id})\n**By:** <@${userID}> (ID: ${userID})\n**Channel:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannel.id})`
          )
          .setTimestamp()
          .setFooter(userTag, userAvatar);

        logChannel.send(serverUnmutev);
      }
      if (voiceOld.serverDeaf === false && voiceNew.serverDeaf === true) {
        if (!log[voiceOld.guild.id])
          log[voiceOld.guild.id] = {
            onoff: "Off"
          };
        if (log[(voiceOld, voiceOld.guild.id)].onoff === "Off") return;
        let serverDeafv = new Discord.RichEmbed()
          .setTitle("**[VOICE DEAF]**")
          .setThumbnail(
            "https://images-ext-1.discordapp.net/external/7ENt2ldbD-3L3wRoDBhKHb9FfImkjFxYR6DbLYRjhjA/https/cdn.pg.sa/auWd5b95AV.png"
          )
          .setColor("RED")
          .setDescription(
            `**User:** ${voiceOld} (ID: ${voiceOld.id})\n**By:** <@${userID}> (ID: ${userID})\n**Channel:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannel.id})`
          )
          .setTimestamp()
          .setFooter(userTag, userAvatar);

        logChannel.send(serverDeafv);
      }
      if (voiceOld.serverDeaf === true && voiceNew.serverDeaf === false) {
        if (!log[voiceOld.guild.id])
          log[voiceOld.guild.id] = {
            onoff: "Off"
          };
        if (log[(voiceOld, voiceOld.guild.id)].onoff === "Off") return;
        let serverUndeafv = new Discord.RichEmbed()
          .setTitle("**[VOICE UNDEAF]**")
          .setThumbnail(
            "https://images-ext-2.discordapp.net/external/s_abcfAlNdxl3uYVXnA2evSKBTpU6Ou3oimkejx3fiQ/https/cdn.pg.sa/i7fC8qnbRF.png"
          )
          .setColor("GREEN")
          .setDescription(
            `**User:** ${voiceOld} (ID: ${voiceOld.id})\n**By:** <@${userID}> (ID: ${userID})\n**Channel:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannel.id})`
          )
          .setTimestamp()
          .setFooter(userTag, userAvatar);

        logChannel.send(serverUndeafv);
      }
    });

    if (
      voiceOld.voiceChannelID !== voiceNew.voiceChannelID &&
      voiceNew.voiceChannel &&
      voiceOld.voiceChannel != null
    ) {
      if (!log[voiceOld.guild.id])
        log[voiceOld.guild.id] = {
          onoff: "Off"
        };
      if (log[(voiceOld, voiceOld.guild.id)].onoff === "Off") return;
      let voiceLeave = new Discord.RichEmbed()
        .setTitle("**[CHANGED VOICE ROOM]**")
        .setColor("GREEN")
        .setThumbnail(voiceOld.user.avatarURL)
        .setDescription(
          `**\n**:repeat: Successfully \`\`CHANGED\`\` The Voice Channel.\n\n**From:** \`\`${voiceOld.voiceChannel.name}\`\` (ID: ${voiceOld.voiceChannelID})\n**To:** \`\`${voiceNew.voiceChannel.name}\`\` (ID: ${voiceNew.voiceChannelID})\n**User:** ${voiceOld} (ID: ${voiceOld.id})`
        )
        .setTimestamp()
        .setFooter(voiceOld.user.tag, voiceOld.user.avatarURL);

      logChannel.send(voiceLeave);
    }
  });

  client.on("message", message => {
    var prefix = "!";
    if (!message.channel.guild) return;
    if (message.content.startsWith("clear")) {
      if (!message.channel.guild)
        return message.channel
          .send("**This Command is Just For Servers**")
          .then(m => m.delete(5000));
      if (!message.member.hasPermission("MANAGE_MESSAGES"))
        return message.channel.send(
          "**You Do not have permission** `MANAGE_MESSAGES`"
        );
      let args = message.content
        .split(" ")
        .join(" ")
        .slice(2 + prefix.length);
      let request = `Requested By ${message.author.username}`;
      message.channel
        .send(`**Are You sure you want to clear the chat?**`)
        .then(msg => {
          msg
            .react("✅")
            .then(() => msg.react("❌"))
            .then(() => msg.react("✅"));

          let reaction1Filter = (reaction, user) =>
            reaction.emoji.name === "✅" && user.id === message.author.id;
          let reaction2Filter = (reaction, user) =>
            reaction.emoji.name === "❌" && user.id === message.author.id;

          let reaction1 = msg.createReactionCollector(reaction1Filter, {
            time: 12000
          });
          let reaction2 = msg.createReactionCollector(reaction2Filter, {
            time: 12000
          });
          reaction1.on("collect", r => {
            message.channel.send(`Chat will delete`).then(m => m.delete(5000));
            var msg;
            msg = parseInt();

            message.channel
              .fetchMessages({ limit: msg })
              .then(messages => message.channel.bulkDelete(messages))
              .catch(console.error);
            message.channel
              .sendMessage("", {
                embed: {
                  title: "`` Chat Deleted ``",
                  color: 0x06df00,
                  footer: {}
                }
              })
              .then(msg => {
                msg.delete(3000);
              });
          });
          reaction2.on("collect", r => {
            message.channel
              .send(`**Chat deletion cancelled**`)
              .then(m => m.delete(5000));
            msg.delete();
          });
        });
    }
  });

  client.on("message", async message => {
    if (message.content.startsWith(prefix + "temp")) {
      await message.channel.send("Write down the type or room").then(e => {
        let filter = m => m.author.id === message.author.id;
        let name = "";
        let time = "";
        let type = "";
        let limit = "";

        message.channel
          .awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
          .then(collected => {
            name = collected.first().content;
            collected.first().delete();

            e.edit(
              "Write down the channel duration in minutes not less than 2 and not more than 180"
            );
            message.channel
              .awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
              .then(co => {
                if (isNaN(co.first().content))
                  return message.reply(
                    "Write down the amount of members in numbers only"
                  );
                if (co.first().content > 180 || co.first().content < 2)
                  return message.channel.send(
                    "Write down the channel duration in minutes not less than 120 and not more than 180"
                  );
                time = co.first().content;
                co.first().delete();
                e.edit("Write down the type or room again");
                message.channel
                  .awaitMessages(filter, {
                    max: 1,
                    time: 20000,
                    errors: ["time"]
                  })
                  .then(col => {
                    type = col.first().content;
                    col.first().delete();
                    e.edit("Write down the number of members who can log in");
                    message.channel
                      .awaitMessages(filter, {
                        max: 1,
                        time: 20000,
                        errors: ["time"]
                      })
                      .then(coll => {
                        if (isNaN(coll.first().content))
                          return message.reply(
                            "Write down the amount of members in numbers only not second minutes or hours"
                          );
                        limit = coll.first().content;
                        coll.first().delete();

                        e.edit("Preparing the room, please wait ...");
                        message.guild.createChannel(name, type).then(c => {
                          c.edit({
                            userLimit: limit
                          });
                          setTimeout(() => {
                            c.delete();
                            message.channel.send("⏰ Ding! Ding! Time Is Up");
                          }, Math.floor(time * 60000));
                        });
                        e.edit("The room was created enjoy ;)");
                      });
                  });
              });
          });
      });
    }
  });
  const verifyj = JSON.parse(fs.readFileSync("./verify.json", "utf8"));

  client.on("message", async message => {
    let messageArray = message.content.split(" ");
    if (message.content === `${prefix}setcaptcha`) {
      let filter = m => m.author.id === message.author.id;
      let ch;
      if (!message.member.hasPermission("MANAGE_GUILD"))
        return message.channel.send("You don't have permission").then(msg => {
          msg.delete(4500);
          message.delete(4500);
        });

      message.channel
        .send(":pencil: **| Now type the verify channel name... :pencil2: **")
        .then(msg => {
          message.channel
            .awaitMessages(filter, {
              max: 1,
              time: 90000,
              errors: ["time"]
            })
            .then(collected => {
              collected.first().delete();
              ch = collected.first().content;
              let chf = message.guild.channels.find("name", `${ch}`);
              if (!chf)
                return (
                  msg.edit(
                    ":x: **| Wrong Channel Name (Type The Command Again) .**"
                  ) && console.log("cant find this channel")
                );
              let rr;
              msg
                .edit(
                  ":scroll: **| Please type verified role name.... :pencil2: **"
                )
                .then(msg => {
                  message.channel
                    .awaitMessages(filter, {
                      max: 1,
                      time: 90000,
                      errors: ["time"]
                    })
                    .then(collected => {
                      collected.first().delete();
                      rr = collected.first().content;
                      let rf = message.guild.roles.find("name", `${rr}`);
                      if (!rf)
                        return (
                          msg.edit(
                            ":x: **| Wrong Role Name (Type The Command Again)**"
                          ) && console.log("cant find this role")
                        );
                      msg.edit("✅ **| Done successfully..  **").then(msg => {
                        message.channel.awaitMessages(filter, {
                          max: 1,
                          time: 90000,
                          errors: ["time"]
                        });
                        let embed = new Discord.RichEmbed()
                          .setTitle("**Done The Captcha Has Been Setup**")
                          .addField("Captcha Channel:", `${ch}`)
                          .addField("Verfied Role:", `${rr}`)
                          .setThumbnail(message.author.avatarURL)
                          .setFooter(`${client.user.username}`);
                        message.channel.sendEmbed(embed);
                        verifyj[message.guild.id] = {
                          channel: ch,
                          rolev: rr,
                          onoff: "On"
                        };
                        fs.writeFile(
                          "./verify.json",
                          JSON.stringify(verifyj),
                          err => {
                            if (err) console.error(err);
                          }
                        );
                      });
                    });
                });
            });
        });
    }
  });

  client.on("message", async message => {
    if (message.content == `${prefix}captcha off`) {
      if (!verifyj[message.guild.id])
        verifyj[message.guild.id] = {
          channel: "Undefined",
          onoff: "Off",
          rolev: "Undefined"
        };
      if (verifyj[message.guild.id].onoff === "Off")
        return message.channel.send("Already Turned Off !");
      verifyj[message.guild.id].onoff = "off";
      message.channel.send(":white_check_mark: | Successfully turned off");
      fs.writeFile("./verify.json", JSON.stringify(verifyj), err => {
        if (err) console.error(err);
      });
    }
  });

  client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.channel.type === "dm") return;
    let rf = message.guild.roles.find(
      "name",
      `${verifyj[message.guild.id].rolev}`
    );
    let mem = message.guild.member(message.author);
    if (message.content.startsWith(prefix + "captcha")) {
      if (!verifyj[message.guild.id])
        verifyj[message.guild.id] = {
          channel: "Undefined",
          onoff: "Off",
          rolev: "Undefined"
        };
      if (verifyj[message.guild.id].onoff === "Off")
        return console.log("the command is turned off");
      if (message.channel.name !== verifyj[message.guild.id].channel)
        return console.log("wrong channel");
      if (mem.roles.has(rf.id))
        return message.channel.send(":x: | You Are Already Verfied !");
      const type = require("./verifycodes.json");
      const item = type[Math.floor(Math.random() * type.length)];
      const filter = response => {
        return item.answers.some(
          answer => answer.toLowerCase() === response.content.toLowerCase()
        );
      };
      const embed = new Discord.RichEmbed()
        .setTitle("**You Should Write The Captcha Code In 15 Seconds**")
        .setColor("RANDOM")
        .setImage(`${item.type}`)
        .setFooter("Requested By" + message.author.tag);
      message.channel.sendEmbed(embed).then(() => {
        message.channel
          .awaitMessages(filter, {
            maxMatches: 1,
            time: 15000,
            errors: ["time"]
          })
          .then(collected => {
            message.author.send(
              `**${
                collected.first().author
              } successfully you got verfied role :white_check_mark:**`
            );
            message.channel.send(
              `**${
                collected.first().author
              } successfully you got verfied role :white_check_mark:**`
            );
            console.log(
              `[Typing] ${collected.first().author} verfied himself ! .`
            );
            message.guild.member(collected.first().author).addRole(rf);
          })
          .catch(collected => {
            message.author.send("Timeout !");
            console.log("[Typing] Error: No one type the captcha code.");
            console.log(collected);
          });

        fs.writeFile("./verify.json", JSON.stringify(verifyj), err => {
          if (err) console.error(err);
        });
      });
    }
  });
  client.on("message", message => {
    if (!message.channel.guild) return;
    var prefix = "!";
    if (message.content.startsWith(prefix + "allbots")) {
      if (message.author.bot) return;
      let i = 1;
      const botssize = message.guild.members
        .filter(m => m.user.bot)
        .map(m => `${i++} - <@${m.id}>`);
      const embed = new Discord.RichEmbed()
        .setTitle(`Bots`)
        .setDescription(
          `Here are the amount of bots in your server:
${botssize.join("\n")}`
        )
        .setFooter(client.user.username, client.user.avatarURL)
        .setTimestamp();
      message.channel.send(embed);
    }
  });
  client.on("message", function(message) {
    var prefix = "!";
    if (message.content.startsWith(prefix + "rps")) {
      let messageArgs = message.content
        .split(" ")
        .slice(1)
        .join(" ");
      let messageRPS = message.content
        .split(" ")
        .slice(2)
        .join(" ");
      let arrayRPS = ["**🗿| Rock**", "**📜| Paper**", "**✂️| Scissors**"];
      let result = `${arrayRPS[Math.floor(Math.random() * arrayRPS.length)]}`;
      var RpsEmbed = new Discord.RichEmbed()
        .setAuthor(message.author.username)
        .setThumbnail(message.author.avatarURL)
        .addField("🗿| Rock", "🇷", true)
        .addField("📜| Paper", "🇵", true)
        .addField("✂️| Scissors", "🇸", true);
      message.channel.send(RpsEmbed).then(msg => {
        msg.react(" 🇷");
        msg.react("🇸");
        msg
          .react("🇵")
          .then(() => msg.react("🇷"))
          .then(() => msg.react("🇸"))
          .then(() => msg.react("🇵"));
        let reaction1Filter = (reaction, user) =>
          reaction.emoji.name === "🇷" && user.id === message.author.id;
        let reaction2Filter = (reaction, user) =>
          reaction.emoji.name === "🇸" && user.id === message.author.id;
        let reaction3Filter = (reaction, user) =>
          reaction.emoji.name === "🇵" && user.id === message.author.id;
        let reaction1 = msg.createReactionCollector(reaction1Filter, {
          time: 12000
        });

        let reaction2 = msg.createReactionCollector(reaction2Filter, {
          time: 12000
        });
        let reaction3 = msg.createReactionCollector(reaction3Filter, {
          time: 12000
        });
        reaction1.on("collect", r => {
          message.channel.send(result);
        });
        reaction2.on("collect", r => {
          message.channel.send(result);
        });
        reaction3.on("collect", r => {
          message.channel.send(result);
        });
      });
    }
  });
  client.on("message", async message => {
    var user = message.mentions.users.first() || message.author;
    if (message.content.toLowerCase() === prefix + 'king') {
      var user = message.mentions.users.first() || message.author;
      if (!message.guild) user = message.author;

      message.channel
        .send("📢 | **King** Framework!")
        .then(m => m.delete(1000));
      await message.channel.send(`**${message.author.tag}** you are now king!`);
      jimp.read(user.avatarURL, (err, image) => {
        image.resize(310, 325);
        jimp.read(
          "https://cdn.discordapp.com/attachments/601045113531007016/650414775372742686/kral.png",
          (err, avatar) => {
            avatar.resize(310, 325);
            image
              .composite(avatar, 2, 0)
              .write(`./img/snip/${client.user.id}-${user.id}.png`);
            setTimeout(function() {
              message.channel.send(
                new Discord.Attachment(
                  `./img/snip/${client.user.id}-${user.id}.png`
                )
              );
            }, 1000);
          }
        );
      });
    }
  });
  client.on("message", async message => {
    var user = message.mentions.users.first() || message.author;
    if (message.content.toLowerCase() === prefix + "wasted") {
      await message.channel.send(
        `**${message.author.tag}** 👻 | **Wasted** Framework`
      );
      var user = message.mentions.users.first() || message.author;
      if (!message.guild) user = message.author;

      jimp.read(user.avatarURL, (err, image) => {
        image.resize(295, 295);
        image.greyscale();
        image.gaussian(3);
        jimp.read(
          "https://cdn.glitch.com/b18a2fa6-68cb-49d5-9818-64c50dd0fdab%2F1.png?1529363616039",
          (err, avatar) => {
            avatar.resize(295, 295);
            image
              .composite(avatar, 4, 0)
              .write(`./img/wasted/${client.user.id}-${user.id}.png`);
            setTimeout(function() {
              message.channel.send(
                new Discord.Attachment(
                  `./img/wasted/${client.user.id}-${user.id}.png`
                )
              );
            }, 1000);
            message.channel.stopTyping();
          }
        );
      });
    }
  });
  client.on("message", message => {
    if (!message.content.startsWith(prefix)) return;
    let command = message.content.split(" ")[0];
    command = command.slice(prefix.length);
    if (command === "mcskin") {
      const args = message.content
        .split(" ")
        .slice(1)
        .join(" ");
      if (!args) return message.channel.send("** Type your skin name **");
      const image = new Discord.Attachment(
        `https://minotar.net/armor/body/${args}`,
        "skin.png"
      );
      message.channel.send(image);
    }
  });
  var dab = [
    "https://scontent-sea1-1.cdninstagram.com/vp/f74bf3c2451cbf4a08a541e46de27889/5B5B6139/t51.2885-15/s480x480/e35/16230653_402791260069966_4987205548966412288_n.jpg",
    "http://www.foot24.tn/thumbs/pogba%20dab.variant960x540.dd25b1-650x286.jpg",
    "https://sm1.narvii.com/6602/c1f51eb618f7a36f9a77a934fc3984333c9a8f25_00.jpg",
    "https://i.pinimg.com/originals/f5/84/d6/f584d6fe0d5173d717d1671bfa3f0d14.jpg",
    "https://ih0.redbubble.net/image.259546796.9462/flat,800x800,075,f.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/fc/Dab_on_em_spongebob.jpg",
    "https://i.ebayimg.com/images/g/XDQAAOSwTuJYs-7S/s-l300.jpg",
    "https://cdn116.picsart.com/214968289003202.jpg?r1024x1024",
    "https://i.pinimg.com/originals/48/32/5f/48325ffdd52c62e0db33db6edc1a8927.jpg",
    "http://pm1.narvii.com/6815/f775300721729acee96c440a88b64b5864ac19c9v2_00.jpg",
    "https://i.ytimg.com/vi/gp2Ydp-mOQw/maxresdefault.jpg",
    "https://static.vibe.com/files/2017/08/singer-arrested-for-dabbing-1502464143-640x798.jpg",
    "https://cdn6.dissolve.com/p/D23_34_318/D23_34_318_1200.jpg",
    "http://www.thecarpenterbuilding.com/wp-content/uploads/2016/05/coming-soon.jpg"
  ];
  client.on("message", message => {
    var args = message.content.split(" ").slice(1);
    if (message.content.startsWith(prefix + "dab")) {
      var dabs = new Discord.RichEmbed().setImage(
        dab[Math.floor(Math.random() * dab.length)]
      );
      message.channel.sendEmbed(dabs);
    }
  });

  client.on("message", message => {
    if (message.content === "!invite") {
      if (!message.channel.guild)
        return message.reply(
          "**Please Do not type bot commands in bot private chat**"
        );
      let embed = new Discord.RichEmbed()
        .setColor("GREEN")
        .setTitle("🖱️ | Invite Bot")
        .setURL(
          "https://discordapp.com/oauth2/authorize?client_id=667773650757222402&permissions=8&scope=bot"
        )
        .setFooter("Modo Bot", message.author.avatarURL);
      message.channel.sendEmbed(embed);
    }
  });
  //Music
  const http = require("http");
  const express = require("express");
  const app = express();
  app.get("/", (request, response) => {
    response.sendStatus(200);
  });
  app.listen(process.env.PORT);
  setInterval(() => {
    http.get(`http://best-bot.glitch.me/`);
  }, 280000);

  const converter = require("number-to-words");

  const dateformat = require("dateformat");
  const ms = require("parse-ms");

  const ownerID = [" Owner Id"]; // ايدي ادارة البوت او صاحب البوت ..

  client.commands = new Discord.Collection();
  client.aliases = new Discord.Collection();

  let cmds = {
    play: { cmd: "play", a: ["p"] },
    skip: { cmd: "skip", a: ["s"] },
    stop: { cmd: "stop" },
    pause: { cmd: "pause" },
    resume: { cmd: "resume", a: ["r"] },
    volume: { cmd: "volume", a: ["vol"] },
    queue: { cmd: "queue", a: ["q"] },
    repeat: { cmd: "repeat", a: ["re"] },
    forceskip: { cmd: "forceskip", a: ["fs", "fskip"] },
    skipto: { cmd: "skipto", a: ["st"] },
    nowplaying: { cmd: "Nowplaying", a: ["np"] }
  };

  Object.keys(cmds).forEach(key => {
    var value = cmds[key];
    var command = value.cmd;
    client.commands.set(command, command);

    if (value.a) {
      value.a.forEach(alias => {
        client.aliases.set(alias, command);
      });
    }
  });

  const ytdl = require("ytdl-core");
  const getYoutubeID = require("get-youtube-id");
  const fetchVideoInfo = require("youtube-info");
  const YouTube = require("simple-youtube-api");
  const youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");

  let active = new Map();

  client.on("warn", console.warn);

  client.on("error", console.error);

  client.on("ready", () => {
    console.log(`Created By: DarkBoy`);
    console.log(`Guilds: ${client.guilds.size}`);
    console.log(`Users: ${client.users.size}`);
    client.user.setActivity(`Type ${prefix}help`, { type: "Playing" });
  });

  client.on("message", async msg => {
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(prefix)) return undefined;

    const args = msg.content
      .slice(prefix.length)
      .trim()
      .split(/ +/g);
    const command = args.shift().toLowerCase();

    const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";

    let cmd =
      client.commands.get(command) ||
      client.commands.get(client.aliases.get(command));

    let s;

    if (cmd === "play") {
      const voiceChannel = msg.member.voiceChannel;
      if (!voiceChannel)
        return msg.channel.send(
          `:no_entry_sign: You must be listening in a voice channel to use that!`
        );
      const permissions = voiceChannel.permissionsFor(msg.client.user);
      if (!permissions.has("CONNECT")) {
        return msg.channel.send(
          `:no_entry_sign: I can't join Your voiceChannel because i don't have ` +
            "`" +
            "`CONNECT`" +
            "`" +
            ` permission!`
        );
      }

      if (!permissions.has("SPEAK")) {
        return msg.channel.send(
          `:no_entry_sign: I can't SPEAK in your voiceChannel because i don't have ` +
            "`" +
            "`SPEAK`" +
            "`" +
            ` permission!`
        );
      }

      if (
        url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)
      ) {
        const playlist = await youtube.getPlaylist(url);
        const videos = await playlist.getVideos();

        for (const video of Object.values(videos)) {
          const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
          await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
        }
        return msg.channel.send(`Added to queue: ${playlist.title}`);
      } else {
        try {
          var video = await youtube.getVideo(url);
        } catch (error) {
          try {
            var videos = await youtube.searchVideos(args, 1);

            // eslint-disable-next-line max-depth
            var video = await youtube.getVideoByID(videos[0].id);
          } catch (err) {
            console.error(err);
            return msg.channel.send("I can't find any thing");
          }
        }

        return handleVideo(video, msg, voiceChannel);
      }

      async function handleVideo(video, msg, voiceChannel, playlist = false) {
        const serverQueue = active.get(msg.guild.id);

        //	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));

        let hrs =
          video.duration.hours > 0
            ? video.duration.hours > 9
              ? `${video.duration.hours}:`
              : `0${video.duration.hours}:`
            : "";
        let min =
          video.duration.minutes > 9
            ? `${video.duration.minutes}:`
            : `0${video.duration.minutes}:`;
        let sec =
          video.duration.seconds > 9
            ? `${video.duration.seconds}`
            : `0${video.duration.seconds}`;
        let dur = `${hrs}${min}${sec}`;

        let ms = video.durationSeconds * 1000;

        const song = {
          id: video.id,
          title: video.title,
          duration: dur,
          msDur: ms,
          url: `https://www.youtube.com/watch?v=${video.id}`
        };
        if (!serverQueue) {
          const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 100,
            requester: msg.author,
            playing: true,
            repeating: false
          };
          active.set(msg.guild.id, queueConstruct);

          queueConstruct.songs.push(song);

          try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
          } catch (error) {
            console.error(`I could not join the voice channel: ${error}`);
            active.delete(msg.guild.id);
            return msg.channel.send(`I cant join this voice channel`);
          }
        } else {
          serverQueue.songs.push(song);

          if (playlist) return undefined;
          if (!args) return msg.channel.send("no results.");
          else
            return msg.channel
              .send(":watch: Loading... [`" + args + "`]")
              .then(m => {
                setTimeout(() => {
                  //:watch: Loading... [let]
                  m.edit(
                    `:notes: Added **${song.title}**` +
                      "(` " +
                      song.duration +
                      ")`" +
                      ` to the queue at position ` +
                      `${serverQueue.songs.length}`
                  );
                }, 500);
              });
        }
        return undefined;
      }

      function play(guild, song) {
        const serverQueue = active.get(guild.id);

        if (!song) {
          serverQueue.voiceChannel.leave();
          active.delete(guild.id);
          return;
        }
        //console.log(serverQueue.songs);
        if (serverQueue.repeating) {
          console.log("Repeating");
        } else {
          serverQueue.textChannel.send(
            ":notes: Added **" +
              song.title +
              "** (`" +
              song.duration +
              "`) to begin playing."
          );
        }
        const dispatcher = serverQueue.connection
          .playStream(ytdl(song.url))
          .on("end", reason => {
            //if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
            //else console.log(reason);
            if (serverQueue.repeating) return play(guild, serverQueue.songs[0]);
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
          })
          .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
      }
    } else if (cmd === "stop") {
      if (msg.guild.me.voiceChannel !== msg.member.voiceChannel)
        return msg.channel.send(
          `You must be in ${msg.guild.me.voiceChannel.name}`
        );
      if (!msg.member.hasPermission("ADMINISTRATOR")) {
        msg.react("❌");
        return msg.channel.send("You don't have permission `ADMINSTRATOR`");
      }
      let queue = active.get(msg.guild.id);
      if (queue.repeating)
        return msg.channel.send(
          "Repeating Mode is on, you can't stop the music, run `" +
            `${prefix}repeat` +
            "` to turn off it."
        );
      queue.songs = [];
      queue.connection.dispatcher.end();
      return msg.channel.send(
        ":notes: The player has stopped and the queue has been cleared."
      );
    } else if (cmd === "skip") {
      let vCh = msg.member.voiceChannel;

      let queue = active.get(msg.guild.id);

      if (!vCh)
        return msg.channel.send(
          "Sorry, but you can't because you are not in voice channel"
        );

      if (!queue) return msg.channel.send("No music playing to skip it");

      if (queue.repeating)
        return msg.channel.send(
          "You can't skip it, because repeating mode is on, run " +
            `\`${prefix}forceskip\``
        );

      let req = vCh.members.size - 1;

      if (req == 1) {
        msg.channel.send("**:notes: Skipped **" + args);
        return queue.connection.dispatcher.end("Skipping ..");
      }

      if (!queue.votes) queue.votes = [];

      if (queue.votes.includes(msg.member.id))
        return msg.say(
          `You already voted for skip! ${queue.votes.length}/${req}`
        );

      queue.votes.push(msg.member.id);

      if (queue.votes.length >= req) {
        msg.channel.send("**:notes: Skipped **" + args);

        delete queue.votes;

        return queue.connection.dispatcher.end("Skipping ..");
      }

      msg.channel.send(
        `**You have successfully voted for skip! ${queue.votes.length}/${req}**`
      );
    } else if (cmd === "pause") {
      let queue = active.get(msg.guild.id);

      let vCh = msg.member.voiceChannel;

      if (!vCh || vCh !== msg.guild.me.voiceChannel)
        return msg.channel.send(`You are not in my voice channel.`);

      if (!queue) {
        return msg.channel.send("No music playing to pause.");
      }

      if (!queue.playing)
        return msg.channel.send(
          ":no_entry_sign: There must be music playing to use that!"
        );

      let disp = queue.connection.dispatcher;

      disp.pause("Pausing..");

      queue.playing = false;

      msg.channel.send(
        ":notes: Paused " +
          args +
          ". **Type** `" +
          prefix +
          "resume` to unpause!"
      );
    } else if (cmd === "resume") {
      let queue = active.get(msg.guild.id);

      let vCh = msg.member.voiceChannel;

      if (!vCh || vCh !== msg.guild.me.voiceChannel)
        return msg.channel.send(`You are not in my voice channel.`);

      if (!queue) return msg.channel.send(":notes: No music paused to resume.");

      if (queue.playing)
        return msg.channel.send(":notes: No music paused to resume.");

      let disp = queue.connection.dispatcher;

      disp.resume("Resuming..");

      queue.playing = true;

      msg.channel.send(":notes: Resumed.");
    } else if (cmd === "volume") {
      let queue = active.get(msg.guild.id);

      if (!queue || !queue.songs)
        return msg.channel.send(
          ":notes: There is no music playing to set volume."
        );

      let vCh = msg.member.voiceChannel;

      if (!vCh || vCh !== msg.guild.me.voiceChannel)
        return msg.channel.send(":notes: You are not in my voice channel");

      let disp = queue.connection.dispatcher;

      if (isNaN(args[0]))
        return msg.channel.send(
          `:notes: The current volume is ${queue.volume}`
        );

      if (parseInt(args[0]) > 150)
        return msg.channel.send("You can't set the volume more than 100.");
      //:speaker: Volume changed from 20 to 20 ! The volume has been changed from ${queue.volume} to ${args[0]}
      msg.channel.send(
        ":speaker: Volume has been **changed** from (`" +
          queue.volume +
          "`) to (`" +
          args[0] +
          "`)"
      );

      queue.volume = args[0];

      disp.setVolumeLogarithmic(queue.volume / 150);
    } else if (cmd === "queue") {
      let queue = active.get(msg.guild.id);

      if (!queue)
        return msg.channel.send(
          ":no_entry_sign: There must be music playing to use that!"
        );

      let embed = new Discord.RichEmbed().setAuthor(
        `${client.user.username}`,
        client.user.displayAvatarURL
      );
      let text = "";

      for (var i = 0; i < queue.songs.length; i++) {
        let num;
        if (i > 8) {
          let st = `${i + 1}`;
          let n1 = converter.toWords(st[0]);
          let n2 = converter.toWords(st[1]);
          num = `:${n1}::${n2}:`;
        } else {
          let n = converter.toWords(i + 1);
          num = `:${n}:`;
        }
        text += `${num} ${queue.songs[i].title} [${queue.songs[i].duration}]\n`;
      }
      embed.setDescription(`Songs Queue | ${msg.guild.name}\n\n ${text}`);
      msg.channel.send(embed);
    } else if (cmd === "repeat") {
      let vCh = msg.member.voiceChannel;

      if (!vCh || vCh !== msg.guild.me.voiceChannel)
        return msg.channel.send("You are not in my voice channel");

      let queue = active.get(msg.guild.id);

      if (!queue || !queue.songs)
        return msg.channel.send("There is no music playing to repeat it.");

      if (queue.repeating) {
        queue.repeating = false;
        return msg.channel.send(":notes: **Repeating Mode: OFF");
      } else {
        queue.repeating = true;
        return msg.channel.send(":notes: Repeating Mode: ON");
      }
    } else if (cmd === "forceskip") {
      let vCh = msg.member.voiceChannel;

      if (!vCh || vCh !== msg.guild.me.voiceChannel)
        return msg.channel.send("You are not in my voice channel");

      let queue = active.get(msg.guild.id);

      if (queue.repeating) {
        queue.repeating = false;

        msg.channel.send("ForceSkipped, Repeating mode is on.");

        queue.connection.dispatcher.end("ForceSkipping..");

        queue.repeating = true;
      } else {
        queue.connection.dispatcher.end("ForceSkipping..");

        msg.channel.send("ForceSkipped.");
      }
    } else if (cmd === "skipto") {
      let vCh = msg.member.voiceChannel;

      if (!vCh || vCh !== msg.guild.me.voiceChannel)
        return msg.channel.send("You are not in my voice channel");

      let queue = active.get(msg.guild.id);

      if (!queue.songs || queue.songs < 2)
        return msg.channel.send("There is no music to skip to.");

      if (queue.repeating)
        return msg.channel.send(
          "You can't skip, because repeating mode is on, run " +
            `\`${prefix}repeat\` to turn off.`
        );

      if (!args[0] || isNaN(args[0]))
        return msg.channel.send(
          "Please input song number to skip to it, run " +
            prefix +
            `queue` +
            " to see songs numbers."
        );

      let sN = parseInt(args[0]) - 1;

      if (!queue.songs[sN])
        return msg.channel.send("There is no song with this number.");

      let i = 1;

      msg.channel.send(
        `Skipped to: **${queue.songs[sN].title}[${queue.songs[sN].duration}]**`
      );

      while (i < sN) {
        i++;
        queue.songs.shift();
      }

      queue.connection.dispatcher.end("SkippingTo..");
    } else if (cmd === "Nowplaying") {
      let q = active.get(msg.guild.id);

      let now = npMsg(q);

      msg.channel.send(now.mes, now.embed).then(me => {
        setInterval(() => {
          let noww = npMsg(q);
          me.edit(noww.mes, noww.embed);
        }, 5000);
      });

      function npMsg(queue) {
        let m =
          !queue || !queue.songs[0] ? "No music playing." : "Now Playing...";

        const eb = new Discord.RichEmbed();

        eb.setColor(msg.guild.me.displayHexColor);

        if (!queue || !queue.songs[0]) {
          eb.setTitle("No music playing");
          eb.setDescription(
            "\u23F9 " + bar(-1) + " " + volumeIcon(!queue ? 100 : queue.volume)
          );
        } else if (queue.songs) {
          if (queue.requester) {
            let u = msg.guild.members.get(queue.requester.id);

            if (!u) eb.setAuthor("Unkown (ID:" + queue.requester.id + ")");
            else eb.setAuthor(u.user.tag, u.user.displayAvatarURL);
          }

          if (queue.songs[0]) {
            try {
              eb.setTitle(queue.songs[0].title);
              eb.setURL(queue.songs[0].url);
            } catch (e) {
              eb.setTitle(queue.songs[0].title);
            }
          }
          eb.setDescription(embedFormat(queue));
        }

        return {
          mes: m,
          embed: eb
        };
      }

      function embedFormat(queue) {
        if (!queue || !queue.songs) {
          return "No music playing\n\u23F9 " + bar(-1) + " " + volumeIcon(100);
        } else if (!queue.playing) {
          return (
            "No music playing\n\u23F9 " +
            bar(-1) +
            " " +
            volumeIcon(queue.volume)
          );
        } else {
          let progress =
            queue.connection.dispatcher.time / queue.songs[0].msDur;
          let prog = bar(progress);
          let volIcon = volumeIcon(queue.volume);
          let playIcon = queue.connection.dispatcher.paused
            ? "\u23F8"
            : "\u25B6";
          let dura = queue.songs[0].duration;

          return (
            playIcon +
            " " +
            prog +
            " `[" +
            formatTime(queue.connection.dispatcher.time) +
            "/" +
            dura +
            "]`" +
            volIcon
          );
        }
      }

      function formatTime(duration) {
        var milliseconds = parseInt((duration % 1000) / 100),
          seconds = parseInt((duration / 1000) % 60),
          minutes = parseInt((duration / (1000 * 60)) % 60),
          hours = parseInt((duration / (1000 * 60 * 60)) % 24);

        hours = hours < 10 ? "0" + hours : hours;
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        return (hours > 0 ? hours + ":" : "") + minutes + ":" + seconds;
      }

      function bar(precent) {
        var str = "";

        for (var i = 0; i < 12; i++) {
          let pre = precent;
          let res = pre * 12;

          res = parseInt(res);

          if (i == res) {
            str += "\uD83D\uDD18";
          } else {
            str += "▬";
          }
        }

        return str;
      }

      function volumeIcon(volume) {
        if (volume == 0) return "\uD83D\uDD07";
        if (volume < 30) return "\uD83D\uDD08";
        if (volume < 70) return "\uD83D\uDD09";
        return "\uD83D\uDD0A";
      }
    }
  });

  client.on("message", message => {
    if (!message.guild) return;
    if (message.content === prefix + "join") {
      if (message.member.voiceChannel) {
        message.member.voiceChannel
          .join()
          .then(connection => {
            message.reply("**Done I Joined the vc with u ..**!");
          })
          .catch(console.log);
      } else {
        message.reply("**You Must to Be In Vc!**");
      }
    }
  });

  client.on("message", message => {
    if (message.content.startsWith(prefix + "Music")) {
      message.author.send(`**:notes:  Music Commands:  

Modo Bot Music: Alpha

> Play : Play [p] 
> Pause : Pasue   
> Resume : Resume  
> stop : To Stop Song
> forceskip : To Force Bot To Skip Song
> Queue : Shows Queue
> Skipto: To Skip To Next Song  Shows What Are Playing rb [np] 
> repeat : Repeat Song
> Leave : Force Bot To Leave VC  
**`);
    }
  });

  //var Swears = JSON.parse(fs.readFileSync("./swears.json", "utf8"));
  //.on('message', message => {
  //    var args = message.content.toLowerCase().split(' ');
  //   var args1 = args.slice(1).join(' ');
  ////  var command = args[0];
  ///////

  //    if(Swears.some(word => message.content.toLowerCase().includes(word))) {
  ///    if(message.member.hasPermission('ADMINISTRATOR')) return;
  ///       message.delete();
  //      message.channel.send(`:no_entry: | Hey <@${message.author.id}>! Dont swear or you will get mute!`).then(msg => msg.delete(2000));
  //   }
  //

  //  if(command == prefix + 'swears') {// حقوق الفا كودز & عبود
  //      if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send(':no_entry: | You dont have **MANAGE_MESSAGES** Permission!');
  /////    if(!message.guild.member(client.user).hasPermission('EMBED_LINKS')) return meessage.channel.send(':no_entry: | I dont have **EMBED_LINKS** Permission!');
  ////if(Swears.length < 1) return message.channel.send(`:no_entry: | No swears words founds! \`\`If you want to add some words type ${prefix}add-swear <SWEAR>\`\``);
  ////      var number = 1;// حقوق الفا كودز & عبود

  //    if(!args[1] || isNaN(args[1]) || args[1] === '1') {// حقوق الفا كودز & عبود
  //     if(Swears.length > 10) {
  //      var more = `\n__:sparkles: **More?** \`\`${prefix}swears 2\`\` (${Math.round(Math.round(Swears.length / 10) + 1)} pages)`;
  //  }else {
  // ,)/ var more = '\n__';
  //  }

  //     let swearsWords = new Discord.RichEmbed()// حقوق الفا كودز & عبود
  //    .setTitle(`:white_check_mark: **${Swears.length}** Swears Words.`)
  //   .setColor('RED')
  //     .setDescription(`__\n__${Swears.map(w => `**${number++}.** ${w}`).slice(0, 10).join('\n')}__\n${more}`)
  ////.setTimestamp()
  //    .setFooter(message.author.tag, message.author.avatarURL)

  ///       message.channel.send(swearsWords);
  // }else if(!isNaN(args[1])) {// حقوق الفا كودز & عبود
  //     if(Swears.length < 10) {
  //////        var morepage = 'This server have **1** Pages only.';
  ////  }else {
  ///         var morepage = `Please select page from 1 to ${Math.round(Swears.length / 10) + 1}`;
  //       }
  //  } ( => newMessage.content.toLowerCase().includes(word))) {// حقوق الفا كودز & عبود
  //  }حقوق الفا كودز & ع
});

const Enmap = require("enmap");
const cd = require("countdown");
const ms = require("ms");
const totime = require("to-time");
const dbg = new Enmap({ name: "Giveaway" });

console.log("[ Giveaways is Lunched. ]");
//gstart
client.on("ready", async () => {
  await dbg.defer;
  await console.log(`Logged in as [ ${client.user.username} ]!`);
  client.guilds.forEach(async g => {
    g.channels
      .filter(
        c =>
          c.type == "text" &&
          c.permissionsFor(client.user.id).has("VIEW_CHANNEL")
      )
      .forEach(async c => {
        let fetched = await c.fetchMessages();
        if (fetched.size == 0) return;
        let mess = await fetched.filter(
          r =>
            r.author.id === client.user.id && r.content == `**🎉 GIVEAWAY 🎉**`
        );
        if (mess.size == 0) return;
        mess.forEach(m => {
          if (!m) return;
          if (!dbg.get(`giveaway.${g.id}.${c.id}.${m.id}.time`)) return;
          let time2 = dbg.get(`giveaway.${g.id}.${c.id}.${m.id}.time`).gtime;
          let text2 = dbg.get(`giveaway.${g.id}.${c.id}.${m.id}.time`).gtext;
          let win2 = dbg.get(`giveaway.${g.id}.${c.id}.${m.id}.time`).gwin;
          if (time2 === null || time2 === undefined) return;
          let embed = new RichEmbed()
            .setColor("BLUE")
            .setAuthor(`${text2}`, g.iconURL)
            .setDescription(
              `React with 🎉 to enter!\nTime remaining: ${cd(
                new Date().getTime(),
                time2
              )}`
            )
            .setFooter(`Ends at`, client.user.avatarURL)
            .setTimestamp(time2);
          let embed2 = new RichEmbed()
            .setColor("RED")
            .setAuthor(text2, g.iconURL)
            .setFooter(`Ended at`);
          let ttimer = setInterval(async () => {
            if (!m || m.content == `🎉 **GIVEAWAY ENDED** 🎉`) return;
            let ttt = [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10];
            if (ttt.includes(moment().diff(time2, "seconds")))
              return m.edit(
                `🎉 **GIVEAWAY** 🎉`,
                embed
                  .setColor("#ffb800")
                  .setDescription(
                    `**Last chance to enter!!!**\nReact with 🎉\nTime remaining: ${cd(
                      new Date().getTime(),
                      time2
                    )}`
                  )
              );
            m.edit(
              `🎉 **GIVEAWAY** 🎉`,
              embed.setDescription(
                `React with 🎉 to enter!\nTime remaining: ${cd(
                  new Date().getTime(),
                  time2
                )}`
              )
            );
            if (moment().isAfter(time2)) {
              m.reactions
                .filter(a => a.emoji.name == "🎉")
                .map(r =>
                  r.fetchUsers().then(u => {
                    let rusers = u
                      .filter(user => !user.bot)
                      .random(parseInt(win2));
                    m.edit(
                      `${g} GIVEAWAY ENDED ${g}`,
                      embed2
                        .setTimestamp()
                        .setDescription(`Winners:\n${rusers || "No winners"}`)
                    );
                    if (
                      m.reactions
                        .filter(a => a.emoji.name == "🎉")
                        .map(reaction => reaction.count)[0] <= 1
                    ) {
                      return m.channel.send(`No winners :rolling_eyes:`);
                    } else {
                      m.channel.send(
                        `Congratulations ${rusers}! You won the **${text2}**`
                      );
                    }
                    dbg.delete(`giveaway.${g.id}.${c.id}.${m.id}.time`);
                    clearInterval(ttimer);
                    return;
                  })
                );
            }
          }, 5000);
        });
      });
  });
});
//client.on('error', console.error);
//client.on('warn', warn => console.warn(`[WARN] - ${warn}`));
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", reason.stack || reason);
});
client.on("message", async message => {
  //let g = client.guilds
  //  .get("606910399811420175")
  //    .emojis.find(r => r.name === "start");
  if (message.author.bot || message.channel.type == "dm") return undefined;
  let args = message.content.split(" ");
  let timer;
  if (args[0] == `${prefix}start`) {
    if (
      message.member.hasPermission("MANAGE_GUILD") ||
      message.member.roles.find(r => r.name == "GIVEAWAYS")
    ) {
      if (!args[1] || !args[2] || !args[3])
        return message.channel.send(
          `**Usage:** **\`${prefix}start [Time] [Winners] [Giveaway Prize]\n\`** **Example:** **\`${prefix}start 4h 1 Nitro\`**`
        );
      if (!message.guild.member(client.user).hasPermission("EMBED_LINKS"))
        return message.channel.send(`I don't have **Embed Links** permission.`);
      if (ms(args[1]) === undefined)
        return message.channel.send(`Please use a proper time format.`);
      if (isNaN(args[2]))
        return message.channel.send(`Winners must be number!`);
      if (args[2] < 1 || args[2] > 10)
        return message.channel.send(`Winners must be bettwen 1 and 10.`);
      let timega = ms(args[1]) / 1000;
      let time = Date.now() + totime.fromSeconds(timega).ms();
      if (timega < 5)
        return message.channel.send(
          `Giveaway time can't be less than 5 seconds.`
        );
      let timespan = cd(new Date().getTime(), time);
      let rusers;
      let embed = new RichEmbed()
        .setColor("BLUE")
        .setAuthor(`${args.slice(3).join(" ")}`)
        .setDescription(`React with 🎉 to enter!\nTime remaining: ${timespan}`)
        .setFooter(`Ends at`, client.user.avatarURL)
        .setTimestamp(time);
      let embed2 = new RichEmbed()
        .setColor("RED")
        .setAuthor(args.slice(3).join(" "))
        .setFooter(`Ended at`);
      let msg = await message.channel
        .send(`**🎉 GIVEAWAY 🎉**`, embed)
        .catch(err => message.channel.send(`Error: \`${err}\``));
      dbg.set(
        `giveaway.${message.guild.id}.${message.channel.id}.${msg.id}.time`,
        {
          gtime: time,
          gid: msg.id,
          gtext: args.slice(3).join(" "),
          gwin: args[2]
        }
      );
      await msg.react("🎉");
      timer = setInterval(() => {
        if (!msg || msg.content == `**🎉 GIVEAWAY ENDED 🎉**`) return;
        let ttt = [-2, -3, -4, -5, -6, -7, -8, -9, -10];
        if (ttt.includes(moment().diff(time, "seconds")))
          return msg.edit(
            `**🎉 GIVEAWAY 🎉**`,
            embed
              .setColor("#ffb800")
              .setDescription(
                `**Last chance to enter!!!**\nReact with 🎉\nTime remaining: ${cd(
                  new Date().getTime(),
                  time
                )}`
              )
          );
        msg.edit(
          `**🎉 GIVEAWAY 🎉**`,
          embed.setDescription(
            `React with 🎉 to enter!\nTime remaining: ${cd(
              new Date().getTime(),
              time
            )}`
          )
        );
        rusers = msg.reactions
          .filter(a => a.emoji.name == "🎉")
          .map(reaction =>
            reaction.users.filter(u => !u.bot).random(parseInt(args[2]))
          )[0];
        if (moment().isAfter(time)) {
          msg.edit(
            `** GIVEAWAY ENDED 🎉**`,
            embed2
              .setTimestamp()
              .setDescription(`Winners:\n${rusers || "No winners"}`)
          );
          if (
            msg.reactions
              .filter(a => a.emoji.name == "🎉")
              .map(reaction => reaction.count)[0] <= 1
          ) {
            return message.channel.send(``);
          } else {
            msg.channel.send(
              `> Congratulations ${rusers}! You won the **${args
                .slice(3)
                .join(" ")}**`
            );
          }
          clearInterval(timer);
          return;
        }
      }, 5000);
    } else return undefined;
  } else if (args[0] == `${prefix}groll`) {
    if (
      message.member.hasPermission("MANAGE_GUILD") ||
      message.member.roles.find(r => r.name == "GIVEAWAYS")
    ) {
      if (!args[1])
        return message.channel.send(
          `**Usage:** **\`${prefix}reroll [giveaway message id]\`**`
        );
      if (isNaN(args[1])) return message.channel.send(`Thats not a message ID`);
      message.channel
        .fetchMessage(args[1])
        .then(async m => {
          if (m.author.id != client.user.id)
            return message.channel.send(`This is not a giveaway message.`);
          if (!m.content.startsWith(`**🎉 GIVEAWAY**`))
            return message.channel.send(`This is not a giveaway message.`);
          if (m.content != `**🎉 GIVEAWAY ENDED 🎉**`)
            return message.channel.send(`The giveaway is not ended.`);
          if (m.reactions.size < 1)
            return message.channel.send(
              `I can't find reactions in this message.`
            );
          if (
            m.reactions
              .filter(a => a.emoji.name == "🎉")
              .map(reaction => reaction.count)[0] <= 1
          )
            return message.channel.send(``);
          m.reactions
            .filter(a => a.emoji.name == "🎉")
            .map(r =>
              r.fetchUsers().then(async u => {
                let rusers = u.filter(user => !user.bot).random();
                await message.channel.send(`The new winner is: ${rusers}`);
              })
            );
        })
        .catch(err =>
          message.channel.send(`I can't find this message in the channel.`)
        );
    } else return undefined;
  } else if (args[0] == `${prefix}gend`) {
    if (
      message.member.hasPermission("MANAGE_GUILD") ||
      message.member.roles.find(r => r.name == "GIVEAWAYS")
    ) {
      if (!args[1])
        return message.channel.send(
          `**Usage:** **\`${prefix}reroll [giveaway message id]\`**`
        );
      if (isNaN(args[1])) return message.channel.send(`Thats not a message ID`);
      message.channel
        .fetchMessage(args[1])
        .then(async m => {
          if (m.author.id != client.user.id)
            return message.channel.send(`This is not a giveaway message.`);
          if (!m.content.startsWith(`**🎉 GIVEAWAY**`))
            return message.channel.send(`This is not a giveaway message.`);
          if (m.content == `**🎉 GIVEAWAY ENDED 🎉**`)
            return message.channel.send(`The giveaway is ended.`);
          if (m.reactions.size < 1)
            return message.channel.send(
              `I can't find reactions in this message.`
            );
          let gv = dbg.get(
            `giveaway.${message.guild.id}.${message.channel.id}.${m.id}.time`
          );
          let rusers = m.reactions.map(r =>
            r.users.filter(u => !u.bot).random(parseInt(gv.gwin))
          );
          let embed2 = new RichEmbed()
            .setColor("RED")
            .setAuthor(gv.gtext)
            .setFooter(`Ended at`);
          m.reactions
            .filter(a => a.emoji.name == "🎉")
            .map(r =>
              r.fetchUsers().then(async u => {
                let rusers = u
                  .filter(user => !user.bot)
                  .random(parseInt(gv.gwin));
                m.edit(
                  `**🎉 GIVEAWAY ENDED 🎉**`,
                  embed2
                    .setTimestamp()
                    .setDescription(`Winners:\n${rusers || "No winners"}`)
                );
                if (
                  m.reactions
                    .filter(a => a.emoji.name == "🎉")
                    .map(reaction => reaction.count)[0] <= 1
                ) {
                  return message.channel.send(`No winners :rolling_eyes:`);
                } else {
                  message.channel.send(
                    `> Congratulations ${rusers}! You won the **${gv.gtext}**`
                  );
                }
                await dbg.delete(
                  `giveaway.${message.guild.id}.${message.channel.id}.${m.id}.time`
                );
                return;
              })
            );
        })
        .catch(err =>
          message.channel.send(`I can't find this message in the channel.`)
        );
    } else return undefined;
  }
});

client.on("message", message => {
  if (message.content.startsWith(prefix + `new`)) {
    const reason = message.content
      .split(" ")
      .slice(1)
      .join(" ");
    if (!reason) {
      if (
        message.guild.channels.exists(
          "name",
          "ticket-" + message.author.username
        )
      )
        return message.channel.send(`Your Ticket is Already Open.`);
      let category = message.guild.channels.find(
        c => c.name == "tickets" && c.type == "category"
      );
      if (!category)
        return message.guild
          .createChannel("tickets", "category")
          .then(
            message.channel.send(
              "I made a category called tickets for log tickets please repeat your command "
            )
          );

      message.guild
        .createChannel(`ticket-${reason}`, "text")
        .then(c => {
          c.setParent(category.id);
          let role1 = message.guild.roles.find("name", "@everyone");
          let role2 = message.guild.roles.find("name", "Bot Developers");

          c.overwritePermissions(role1, {
            SEND_MESSAGES: false,
            READ_MESSAGES: false
          });
          c.overwritePermissions(role2, {
            SEND_MESSAGES: true,
            READ_MESSAGES: true
          });
          c.overwritePermissions(message.author, {
            SEND_MESSAGES: true,
            READ_MESSAGES: true
          });

          message.channel.send(
            `:white_check_mark: Done, Your ticket name is ${c.name}.`
          );
          const embed = new Discord.RichEmbed()
            .setColor("RANDOM")
            .addField(
              `Hi ${message.author.id} !`,
              `Admins Will Contact With You.`
            )
            .setTimestamp();
          c.send({ embed: embed });
        })
        .catch(console.error);
    } else {
      let category = message.guild.channels.find(
        c => c.name == "tickets" && c.type == "category"
      );
      if (!category)
        return message.guild
          .createChannel("tickets", "category")
          .then(
            message.channel.send(
              "I made a category called tickets for log tickets please repeat your command "
            )
          );

      message.guild
        .createChannel(`ticket-${reason}`, "text")
        .then(c => {
          c.setParent(category.id);
          let role = message.guild.roles.find("name", "Bot Developers");
          let role2 = message.guild.roles.find("name", "@everyone");
          c.overwritePermissions(role, {
            SEND_MESSAGES: true,
            READ_MESSAGES: true
          });
          c.overwritePermissions(role2, {
            SEND_MESSAGES: false,
            READ_MESSAGES: false
          });
          c.overwritePermissions(message.author, {
            SEND_MESSAGES: true,
            READ_MESSAGES: true
          });

          message.channel.send(
            `:white_check_mark: Done, Your ticket name is ${c.name}.`
          );
          const embed = new Discord.RichEmbed()
            .setColor("RANDOM")
            .addField(
              `Hi ${message.author.username}!`,
              `Admins Will Contact With You.`
            )
            .setTimestamp();
          c.send({ embed: embed });
        })
        .catch(console.error);
    }
  }
});
//Close Command
client.on("message", message => {
  if (message.content === prefix + `close`) {
    if (!message.channel.name.startsWith(`ticket-`))
      return message.channel.send(
        `You Can't Delete Your Ticket in Other Channel.`
      );
    const embed = new Discord.RichEmbed()
      .setColor("#E41111")
      .addField(
        `** ✅ If You Want to Close The Ticket.**`,
        `** ❌ If You Don't Want to Close The Ticket.**`
      )
      .setTimestamp();
    message.channel.sendEmbed(embed).then(msg => {
      msg.react("✅").then(r => {
        msg.react("❌");

        const dontcloseticketFilter = (reaction, user) =>
          reaction.emoji.name === "❌" && user.id === message.author.id;
        const closeticketFilter = (reaction, user) =>
          reaction.emoji.name === "✅" && user.id === message.author.id;
        const dontcloseticket = msg.createReactionCollector(
          dontcloseticketFilter,
          { time: 60000 }
        );
        const closeticket = msg.createReactionCollector(closeticketFilter, {
          time: 60000
        });

        closeticket.on("collect", r => {
          message.channel.delete();
        });
        dontcloseticket.on("collect", r => {
          msg.delete();
          message.channel.sendMessage(
            "Command was cancled ticket is still running ❌"
          );
        });
      });
    });
  }
});
client.on("message", message => {
  if (message.content.startsWith(prefix + "closeall")) {
    message.guild.channels
      .filter(c => c.name.startsWith(`ticket-`))
      .deleteAll();
    message.channel.send(`Done closed all tickets`);
  }
});
client.on("message", msg => {
	if(msg.author.bot || !msg.guild) return;
	let [command, ...args] = msg.content.slice(prefix.length).split(/ +/g);
	if(command === "space") {
		if(args.shift() === "all") {
			let rooms = msg.guild.channels.filter(r=> r.name.includes("-") || r.name.includes("_"))
			rooms.forEach(r=> r.setName(r.name.replace(/-/g, " ").replace(/_/g, " ")))
			 msg.channel.send("**Done i have spaced "+rooms.size+" channel ...**")
			.catch(err=> msg.channel.send("i have an error please check my permissons"))
		} 
		else if(msg.mentions.channels.first()) {
			let room = msg.guild.channels.find(m=> m.name === msg.mentions.channels.first().name)
			room.setName(room.name.replace(/-/g, " ").replace(/_/g, " ")).then(sec=> msg.channel.send("**Done i have spaced "+room+" ...**"))
			.catch(err=> msg.channel.send("i have an error please check my permissons"))
		} 
		else msg.channel.send("**Usage: > "+prefix+"space <all | mention channel>**")
	}
 
})
client.login("");
