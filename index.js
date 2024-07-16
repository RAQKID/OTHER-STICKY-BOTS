Object.entries(process.env).filter(e => e[0].startsWith("token")).forEach((token, indexArray) => {
  const Eris = require("eris");
  const bot = new Eris(token[1], { intents: 32509 });
  const app = require('express')().get('/', async (r, s) => s.send({ welcome: require("./package.json").description })).listen(3000);
  const Database = require("st.db");
  const db = new Database({
    path: 'data.json',
    crypto: {
      encrypt: true,
      password: require("./package.json")['author']
    }
  });

  bot.on("error", (err) => {
    console.error(err);
  });

  bot.on("ready", async () => {
    console.clear()
    console.log(`\u001b[${34 + indexArray}mSticky Messages Bot\u001b[0m\n\u001b[37m►\u001b[${34 + indexArray}m Version: \u001b[37m\u001b[48;5;11m${require("./package.json")['version']}\u001b[0m\n\u001b[37m►\u001b[${34 + indexArray}m Bot By: \u001b[37m\u001b[48;5;45m${require("./package.json")['author']}\u001b[0m\n\u001b[37m►\u001b[${34 + indexArray}m Bot Name: \u001b[47;1m\u001b[193;1m${bot.user.username}\u001b[0m\n\u001b[37m►\u001b[${34 + indexArray}m Eris Version: \u001b[47;1m\u001b[33;1m${require("./package.json")['dependencies'].eris}\u001b[0m`)
    const commands = await bot.getCommands();
    if (!commands.some(e => e.name.startsWith("sticky"))) {
      await bot.createCommand({
        name: "sticky_set",
        description: "Sticky Set",
        options: [
          {
            "name": "channel",
            "description": "Channel",
            "type": Eris.Constants.ApplicationCommandOptionTypes.CHANNEL,
            "required": true,
            "channel_types": [0]
          },
          {
            "name": "content",
            "description": "Content",
            "type": Eris.Constants.ApplicationCommandOptionTypes.STRING,
            "required": true,
          }
        ],
        type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT
      });
      await bot.createCommand({
        name: "sticky_remove",
        description: "Sticky Remove",
        options: [
          {
            "name": "channel",
            "description": "Channel",
            "type": Eris.Constants.ApplicationCommandOptionTypes.CHANNEL,
            "required": true,
            "channel_types": [0]
          }
        ],
        type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT
      });
    }
  });

  bot.on("messageCreate", async (msg) => {
    if (msg.author.id == bot.user.id) return;
    if (await db.has(`stickychannel_${bot.user.id}_${msg.channel.id}`) == true) {
      let data = await db.getByKey({
        key: `stickychannel_${bot.user.id}_${msg.channel.id}`,
        decrypt: true
      })
      await bot.deleteMessage(msg.channel.id, data.msgId).then(async () => {
        let msgId;
        try {
          msgId = await bot.createMessage(msg.channel.id, JSON.parse(process.env[data.msg]));
        } catch (e) {
          msgId = await bot.createMessage(msg.channel.id, data.msg);
        }
        data['msgId'] = msgId.id
        await db.set({
          key: `stickychannel_${bot.user.id}_${msg.channel.id}`,
          value: data
        })
      }).catch(e => { })
    }
  });

  bot.on("interactionCreate", async (interaction) => {
    if (interaction instanceof Eris.CommandInteraction) {
      if (interaction.data.name == "sticky_set") {
        if (!interaction.member.permission.has("administrator")) return await interaction.createMessage(`❌ Error. ERRORS: Do you have ADMINISTRATOR PERMISSION? If yes, try again.`);
        let channelId = interaction.data.options[0].value
        let msgId
        try {
          msgId = await bot.createMessage(channelId, JSON.parse(process.env[interaction.data.options[1].value]));
        } catch (e) {
          msgId = await bot.createMessage(channelId, interaction.data.options[1].value);
        }
        await db.set({
          key: `stickychannel_${bot.user.id}_${channelId}`,
          value: {
            msg: interaction.data.options[1].value,
            msgId: msgId.id
          }
        })
        await interaction.createMessage({
          embeds: [
            {
              "title": "Sticky Set!",
              "description": `You currently set a sticky message in <#${channelId}>`,
              "color": 1013218,
              "footer": {
                "text": `Made by ${require("./package.json")['author']}`
              }
            }
          ],
          flags: 64
        });
      } else if (interaction.data.name == "sticky_remove") {
        if (!interaction.member.permission.has("administrator")) return await interaction.createMessage(`❌ Error. ERRORS: Do you have ADMINISTRATOR PERMISSION? If yes, try again.
`);
        let channelId = interaction.data.options[0].value
        if (await db.has(`stickychannel_${bot.user.id}_${channelId}`) != true) return await interaction.createMessage(`❌ Error. ERRORS: No sticky set.`);
        await db.delete({
          key: `stickychannel_${bot.user.id}_${channelId}`
        })
        await interaction.createMessage({
          embeds: [
            {
              "title": "Sticky Remove!",
              "description": `You currently removed the sticky message in <#${channelId}>`,
              "color": 1013218,
              "footer": {
                "text": `Made by ${require("./package.json")['author']}`
              }
            }
          ],
          flags: 64
        });
      }
    }
  });

  bot.connect();
})
