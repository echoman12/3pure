const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const request = require('request');
const fs = require('fs');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const yt_api_key = "AIzaSyDeoIH0u1e72AtfpwSKKOSy3IPp2UHzqi4";
const prefix = '3';
client.login(process.env.BOT_TOKEN); 
client.on('ready', () => {
    console.log('I am ready!');
});
client.on('ready', () => {
  client.user.setGame('Type 3help.','https://www.twitch.tv/peery13');
});
client.on('ready', function() {
    console.log(`i am ready ${client.user.username}`);
});



/*
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
*/

var servers = [];

var queue = [];

var guilds = [];

var queueNames = [];

var isPlaying = false;

var dispatcher = null;

var voiceChannel = null;

var skipReq = 0;

var skippers = [];

var now_playing = [];

/*
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
*/

client.on('ready', () => {});

var download = function(uri, filename, callback) {

    request.head(uri, function(err, res, body) {

        console.log('content-type:', res.headers['content-type']);

        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);

    });

};

client.on('message', function(message) {

    const member = message.member;

    const mess = message.content.toLowerCase();

    const args = message.content.split(' ').slice(1).join(' ');

    if (mess.startsWith(prefix + 'play')) {

        if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');

        // if user is not insert the URL or song title

        if (args.length == 0) {

            let play_info = new Discord.RichEmbed()

                .setAuthor(client.user.username, client.user.avatarURL)

                .setFooter('طلب بواسطة: ' + message.author.tag)

                .setDescription('**قم بإدراج رابط او اسم الأغنيه**')

            message.channel.sendEmbed(play_info)

            return;

        }

        if (queue.length > 0 || isPlaying) {

            getID(args, function(id) {

                add_to_queue(id);

                fetchVideoInfo(id, function(err, videoInfo) {

                    if (err) throw new Error(err);

                    let play_info = new Discord.RichEmbed()

                        .setAuthor(client.user.username, client.user.avatarURL)

                        .addField('تمت إضافةالاغنيه بقائمة الإنتظار', `**
                          ${videoInfo.title}
                          **`)

                        .setColor("#a637f9")

                        .setFooter('|| ' + message.author.tag)

                        .setThumbnail(videoInfo.thumbnailUrl)

                    message.channel.sendEmbed(play_info);

                    queueNames.push(videoInfo.title);

                    now_playing.push(videoInfo.title);

                });

            });

        }

        else {

            isPlaying = true;

            getID(args, function(id) {

                queue.push('placeholder');

                playMusic(id, message);

                fetchVideoInfo(id, function(err, videoInfo) {

                    if (err) throw new Error(err);

                    let play_info = new Discord.RichEmbed()

                        .setAuthor(client.user.username, client.user.avatarURL)

                        .addField('__**تم التشغيل ✅**__', `**${videoInfo.title}
                              **`)

                        .setColor("RANDOM")

                        .addField(`بواسطه`, message.author.username)

                        .setThumbnail(videoInfo.thumbnailUrl)

                    // .setDescription('?')

                    message.channel.sendEmbed(play_info)

                    message.channel.send(`
                            **${videoInfo.title}** تم تشغيل `)

                    // client.user.setGame(videoInfo.title,'https://www.twitch.tv/Abdulmohsen');

                });

            });

        }

    }

    else if (mess.startsWith(prefix + 'skip')) {

        if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');

        message.channel.send('`✔`').then(() => {

            skip_song(message);

            var server = server = servers[message.guild.id];

            if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();

        });

    }

    else if (message.content.startsWith(prefix + 'vol')) {

        if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');

        // console.log(args)

        if (args > 100) return message.channel.send('1 - 100 || **__لا أكثر ولا أقل__**')

        if (args < 1) return message.channel.send('1 - 100 || **__لا أكثر ولا أقل__**')

        dispatcher.setVolume(1 * args / 50);

        message.channel.sendMessage(`**__ ${dispatcher.volume*50}% مستوى الصوت __**`);

    }

    else if (mess.startsWith(prefix + 'pause')) {

        if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');

        message.channel.send('`✔`').then(() => {

            dispatcher.pause();

        });

    }

    else if (mess.startsWith(prefix + 'leave')) {

        if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');

            message.channel.send('`✔`').then(() => {

            dispatcher.resume();

        });

    }

    else if (mess.startsWith(prefix + 'stop')) {

        if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');

        message.channel.send('`✔`');

        var server = server = servers[message.guild.id];

        if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();

    }

    else if (mess.startsWith(prefix + 'join')) {

        if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');

        message.member.voiceChannel.join().then(message.channel.send(':ok:'));

    }

    else if (mess.startsWith(prefix + 'play')) {

        if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');

        if (isPlaying == false) return message.channel.send(':anger: || **__تم التوقيف__**');

        let playing_now_info = new Discord.RichEmbed()

            .setAuthor(client.user.username, client.user.avatarURL)

            .addField('تمت إضافةالاغنيه بقائمة الإنتظار', `**
                  ${videoInfo.title}
                  **`)

            .setColor("RANDOM")

            .setFooter('طلب بواسطة: ' + message.author.tag)

            .setThumbnail(videoInfo.thumbnailUrl)

        //.setDescription('?')

        message.channel.sendEmbed(playing_now_info);

    }

});

function skip_song(message) {

    if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');

    dispatcher.end();

}

function playMusic(id, message) {

    voiceChannel = message.member.voiceChannel;

    voiceChannel.join().then(function(connectoin) {

        let stream = ytdl('https://www.youtube.com/watch?v=' + id, {

            filter: 'audioonly'

        });

        skipReq = 0;

        skippers = [];

        dispatcher = connectoin.playStream(stream);

        dispatcher.on('end', function() {

            skipReq = 0;

            skippers = [];

            queue.shift();

            queueNames.shift();

            if (queue.length === 0) {

                queue = [];

                queueNames = [];

                isPlaying = false;

            }

            else {

                setTimeout(function() {

                    playMusic(queue[0], message);

                }, 500);

            }

        });

    });

}

function getID(str, cb) {

    if (isYoutube(str)) {

        cb(getYoutubeID(str));

    }

    else {

        search_video(str, function(id) {

            cb(id);

        });

    }

}

function add_to_queue(strID) {

    if (isYoutube(strID)) {

        queue.push(getYoutubeID(strID));

    }

    else {

        queue.push(strID);

    }

}

function search_video(query, cb) {

    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {

        var json = JSON.parse(body);

        cb(json.items[0].id.videoId);

    });

}

function isYoutube(str) {

    return str.toLowerCase().indexOf('youtube.com') > -1;

}

 client.on('message', message => {

     if (message.content === prefix +"help") {

    const embed = new Discord.RichEmbed()

     .setColor("RANDOM")

     .addField(`**__أوامر البوت__**`,`
.    **${prefix}join**
     عشان يدخل البوت الروم
     **${prefix}play**
     امر تشغيل الأغنية , !شغل الرابط او اسم الأعنية
     **${prefix}skip**
     تغير الأغنية
     **${prefix}stop**
     ايقاف الأغنية
     **${prefix}pause**
     مواصلة الأغنية
     **${prefix}vol**
     مستوى الصوت 1-100
     **${prefix}leave**
     خروج البوت من الروم
     **${prefix}inv**
     لدعوت البوت
     **{prefix}support**
     سيرفر الدعم
     **{prefix}bot**
     معلومات البوت
     prefix = ${prefix}
     ping = ${Date.now() - message.createdTimestamp}ms
     By - brou  `)

      message.channel.send({embed});

     }

    });

client.on('message', message => {

    if (message.content === 'zg') {

        message.reply('pong');

      }

});

                            client.on('message', message => { //By |.iiMostafaYT#1001
                                if (message.content.startsWith("$bot")) { //By |.iiMostafaYT#1001
                                message.channel.send({ //By |.iiMostafaYT#1001
                                    embed: new Discord.RichEmbed() //By |.iiMostafaYT#1001
                                        .setAuthor(client.user.username,client.user.avatarURL) //By |.iiMostafaYT#1001
                                        .setThumbnail(client.user.avatarURL) //By |.iiMostafaYT#1001
                                        .setColor('RANDOM') //By |.iiMostafaYT#1001
                                        .setTitle('Info RoadBot.') //By |.iiMostafaYT#1001
                                        .addField('**My Ping**' , [`${Date.now() - message.createdTimestamp}` + 'MS'], true) //By |.iiMostafaYT#1001
                                        .addField('**RAM Usage**', `[${(process.memoryUsage().rss / 1048576).toFixed()}MB]`, true) //By |.iiMostafaYT#1001
                                        .addField('**Servers**', [client.guilds.size], true) //By |.iiMostafaYT#1001
                                        .addField('**Channels**' , `[ ${client.channels.size} ]` , true) //By |.iiMostafaYT#1001
                                        .addField('**Users**' ,`[ ${client.users.size} ]` , true) //By |.iiMostafaYT#1001
                                        .addField('**My Name**' , `[ ${client.user.tag} ]` , true) //By |.iiMostafaYT#1001
                                        .addField('**My ID**' , `[ ${client.user.id} ]` , true) //By |.iiMostafaYT#1001
                                        .addField('**DiscordJS**' , `[ ${Discord.version} ]` , true) //By |.iiMostafaYT#1001
                                        .addField('**NodeJS**' , `[ ${process.version} ]` , true) //By |.iiMostafaYT#1001
                                        .addField('**Arch**' , `[ ${process.arch} ]` , true) //By |.iiMostafaYT#1001
                                        .addField('**Platform**' , `[ ${process.platform} ]` , true) //By |.iiMostafaYT#1001
                                              .addField('**My Prefix**' , `[ ${prefix} ]` , true) //By |.iiMostafaYT#1001
                                              .addField('**My Language**' , `[ Java Script ]` , true) //By |.iiMostafaYT#1001
                                              .setFooter('By | - LexMasTeR#1001') //By |.iiMostafaYT#1001
                                }) //By |.iiMostafaYT#1001
                            } //By |.iiMostafaYT#1001
                            }); //By |.iiMostafaYT#1001
                            
                            
                             client.on('message', message => {
                                                                      if (message.content === "$inv") {
                                                                          if(!message.channel.guild) return;
                                                                      let embed = new Discord.RichEmbed()
                                                                      .setAuthor(` ${message.author.username} `, message.author.avatarURL)      
                                                                      .setTitle(`:small_orange_diamond: Invite Link `)
                                                                      .setURL(`https://discordapp.com/api/oauth2/authorize?client_id=520216417191067658&permissions=8&scope=bot`)        
                                                                   message.channel.sendEmbed(embed);
                                                                     }
                                                                 });  
                          
                                                                 client.on('message', message => {
                                                                    if (message.content === "$support") {
                                                                    let embed = new Discord.RichEmbed()
                                                                 .setAuthor(message.author.username)
                                                                 .setColor("#9B59B6")
                                                                 .addField(" ** :gear: Server Support :gear: **" , "  **https://discord.gg/TGGFMCb**")
                                                                    
                                                                    
                                                                 message.channel.sendEmbed(embed);
                                                                   }
                                                               });

client.login(process.env.BOT_TOKEN);
