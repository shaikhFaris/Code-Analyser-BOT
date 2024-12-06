import dotenv from "dotenv";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { codingQuotes } from "./Quotes.js";
import userModel from "./database/configDB.js";
import { table, getBorderCharacters } from "table";
import { scheduleJob, RecurrenceRule } from "node-schedule";
dotenv.config();
const allowedChannelID = "1302490769059221545";
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

await mongoose
  .connect(
    `mongodb+srv://shadow:${process.env.MONGODB_TOKEN}@cluster0.bpvig.mongodb.net/bot-database?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(async () => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log(
      "error while connecting to database\nMIGHT BE DUE IP ADDRESS ISSUE\n" +
        err
    );
  });

const check_existance = async (userData) => {
  try {
    const data = await userModel.find({});
    for (let i = 0; i < data.length; i++) {
      if (data[i].user_ID === userData.id) {
        return -1;
      }
    }
    return 0;
  } catch (err) {
    console.log("Some error occurred while fetching existing data: " + err);
  }
};

const getData = async (link) => {
  const code = await fetch(link)
    .then((response) => {
      return response.text();
    })
    .then((data) => {
      return data;
    });
  // console.log(code);
  return code;
};

const checkCode = async (link) => {
  const code = await getData(link);
  // console.log(code);
  const prompt = `Tell me if this code is correct based on syntax and logic (ignore indentation error)? Only reply in this format (Correct: YES ✅ or Correct: NO ❌). If yes, give me the percentage of this code being genearated by an AI model in this format AI generated possiblity: percentage and also give me the time and space complexity but dont give any explanaition.But if the code is wrong just give me the errors in bullet points with the line number.${code}`;

  console.log("Analysing the code .....");
  const responseFromAI = await model.generateContent(prompt);
  // console.log(responseFromAI.response.text());
  return responseFromAI.response.text();
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// on message eveent handler
client.on("messageCreate", (msg) => {
  // code to add user
  if (
    msg.content.startsWith("$add-user") &&
    msg.author.bot == false &&
    msg.author.id == "1185502471968268381"
  ) {
    if (
      Array.from(msg.mentions.users.values()).length > 1 ||
      Array.from(msg.mentions.users.values()).length == 0
    ) {
      try {
        msg.reply("**⚠️ WARNING**: Can add only one user at a time!!!!");
      } catch (error) {
        console.log("some error occured");
      }
    } else {
      const userData = Array.from(msg.mentions.users.values())[0];
      check_existance(userData)
        .then((check_user_presence) => {
          if (check_user_presence == -1) {
            try {
              msg.reply("**User already added. 👍**");
            } catch (error) {
              console.log("eror while already added");
            }
          }
          if (check_user_presence == 0) {
            userModel
              .insertMany({
                user_name: userData.globalName,
                user_ID: userData.id,
                user_points: 0,
                no_submission_perDay: 0,
                added_date: `${new Date()}`,
              })
              .then(() => {
                try {
                  msg.reply(
                    `✅ **${userData.globalName}** has been added successfully `
                  );
                  console.log(userData.globalName + " added successfully");
                } catch (error) {
                  console.log("some error occured");
                }
              })
              .catch((err) => {
                console.log("Some error occured while adding user" + err);
                try {
                  msg.reply(`Some error occured while adding user`);
                } catch (error) {
                  console.log("some error occured");
                }
              });
          }
        })
        .catch((err) => {
          console.log("some Error occured");
        });
    }
  }

  if (msg.content.startsWith("$list-users") && msg.author.bot == false) {
    // const userData = Array.from(msg.mentions.users.values())[0];
    userModel
      .find({})
      .then((data) => {
        let tableArr = [["Names", "Points"]];
        const config = {
          border: getBorderCharacters("void"),
          columns: {
            0: { alignment: "left" },
            1: { alignment: "right" },
          },
          columnDefault: {
            width: 10,
          },
        };
        for (let i = 0; i < data.length; i++) {
          tableArr.push([data[i].user_name, data[i].user_points]);
        }

        try {
          msg.reply(table(tableArr, config));
        } catch (error) {
          msg.reply("cannot list users");
        }
      })
      .catch((err) => {
        console.log("Some error occured while listing user" + err);
        try {
          msg.reply(`Some error occured while listing user`);
        } catch (error) {
          console.log("some error occured");
        }
      });
  }

  if (msg.channelId != allowedChannelID && msg.content.startsWith("$quotes")) {
    try {
      msg.reply("_" + codingQuotes[Math.floor(Math.random() * 173)] + "_");
    } catch (error) {
      console.log("some error occured while sending the quotes\n" + error);
    }
    console.log("quote send successfully");
  }
  if (
    msg.channelId != allowedChannelID &&
    msg.content.startsWith("$list-father")
  ) {
    try {
      msg.reply("# `shadow_01004`");
    } catch (error) {
      console.log("some error occured while sending the owner name\n" + error);
    }
    console.log("owner name send successfully");
  }
  if (
    msg.channelId != allowedChannelID &&
    msg.content.startsWith("$list-commands")
  ) {
    try {
      msg.reply(
        "1. `$quotes` - This command gives you some great quotes (obviously programming related) to help you cope with dopmanine crash.\n2. This bot will give you the summary of your answer if you post the link to the raw file of your solution in the _daily-soluion_ channel (make sure to post only the link of the raw file).\n3. `list-father` - This commands lets you know the one who programmed this bot\n4. `add-user` - This commands adds the user to the bot database. After this the user will be able to post solutions (**can only be used by father**)\n5. `list-users` - This commands lists all the users and their points"
      );
    } catch (error) {
      console.log("Error while sending list-commands reply" + error);
    }
  }
  // for solution based reply
  else {
    const link = msg.content.match(/https?:\/\/[^\s]+/);
    if (
      // if user is sharing solution
      link != null &&
      link[0].indexOf("raw.githubusercontent.com") > -1 &&
      msg.channelId == allowedChannelID &&
      msg.author.bot == false
    ) {
      let checker = false;
      let submissions = null;
      console.log(`${msg.author.username} just shared his/her solution`);
      userModel.find({}).then((data) => {
        for (let i = 0; i < data.length; i++) {
          if (data[i].user_ID === msg.author.id) {
            checker = true;
            submissions = data[i].no_submission_perDay;
            break;
          }
        }

        if (checker === true && submissions <= 3) {
          checkCode(link[0])
            .then((data) => {
              if (data.includes("✅") == true) {
                userModel
                  .findOneAndUpdate(
                    { user_ID: msg.author.id },
                    { $inc: { user_points: 10, no_submission_perDay: 1 } }
                  )
                  .then((data) => {
                    // console.log(data);
                    msg.reply(
                      data.user_name + "'s points **increased** by 10\n"
                    );
                  })
                  .catch((err) => {
                    console.log("error while incrementing points" + err);
                  });
              }
              if (data.includes("❌") == true) {
                userModel
                  .findOneAndUpdate(
                    { user_ID: msg.author.id },
                    { $inc: { user_points: -5, no_submission_perDay: 1 } }
                  )
                  .then((data) => {
                    // console.log(data);
                    msg.reply(
                      data.user_name + "'s points **decreased** by 5\n"
                    );
                  })
                  .catch((err) => {
                    console.log("error while decreamenting points" + err);
                  });
              }
              msg.reply("**" + data + "**");
              console.log("####reply sent successfully####");
            })
            .catch((err) => {
              msg.reply(
                "**Limit exceeded for gemini model**\nTry after some time"
              );
            });
        }
        if (checker === true && submissions > 3) {
          try {
            msg.reply("🚨 **No of submissions are exhuasted**");
          } catch (error) {
            console.log("error occured while sending error msg");
          }
        }
        if (checker === false) {
          try {
            msg.reply("**🚫 User not added **\nAsk the mods to add u.");
          } catch (error) {
            console.log("error occured while sending error msg");
          }
        }
      });
    }

    // shit-posting code
    if (
      (link == null || link[0].indexOf("raw.githubusercontent.com") <= -1) &&
      msg.channelId == allowedChannelID &&
      msg.content.startsWith("$add-users") == false &&
      msg.content.startsWith("$list-users") == false &&
      msg.author.bot == false
    ) {
      try {
        msg.reply(
          `**No sh*t posting in this channel, <@${msg.author.id}>**\nPlease share the link to the raw github code file !!!!`
        );
      } catch (error) {
        console.log("some error occured while stopping");
      }
    }
  }
});

// event handler when the bot is ready and logged in.
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot is Ready! Logged in as ${readyClient.user.tag}`);
});
client.login(process.env.DISCORD_TOKEN);

// const resetTime = new RecurrenceRule();
// // rule.hour = 0;
// resetTime.second = 2;
// // rule.minute = 0;
// resetTime.tz = "Etc/UTC";

// scheduleJob(resetTime, () => {
//   console.log(new Date().toUTCString());
// });
