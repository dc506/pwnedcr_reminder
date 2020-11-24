/* https://discord.js.org/#/docs/main/stable/general/welcome */
const Discord = require('discord.js'),
      Pretalx = require('./pretalx.js'),
      process = require('process'),
      secrets = require('./secrets.json')
const READY = 2

/* clients */
const dclient = new Discord.Client(),
      pclient = new Pretalx.Client({
        base_url: "https://cfp.pwnedcr.rocks/api/events",
        event: "pwnedcr"
      });

/* bot configs */
const bot_token = secrets.BOT_TOKEN, bot_prefix = '?'
const general_channel = '777679444693352448', /* #charlas */
      botlogs_channel = '777645870253342724'  /* #bot-logs */

/**
* concatenates speaker names
* @param {array} [l] list of event items
* @returns {string}
*/
function list_speakers(l) {
  let ret = []
  l.speakers.forEach((s, i) => { ret.push(s.name) })
  return ret.join(' & ')
}

/**
* formats a time duration to X hours Y minutes
* @param {string} [time] duration in HH:MM format
* @returns {string}
*/
function format_duration(time) {
  let duration = "",
      tmp_duration = time.split(':')
  let tmp_minutes = Number(tmp_duration[1])

  if (Number(tmp_duration[0]) > 0) {
    let h = tmp_duration[0][0] === '0' ? tmp_duration[0][1] : tmp_duration[0]

    duration += `${h} hora`
    if (Number(h) > 1)
      duration += "s"
  }

  if (tmp_minutes > 0) {
    if (duration.length > 0) duration += " "
    if ((tmp_minutes % 5) != 0)
      duration += tmp_minutes + (10 - (tmp_minutes % 5))
    else
      duration += tmp_minutes
    duration += " minutos"
  }
  return duration
}

dclient.once('ready', () => {
  /* built up cache of talks and workshops */
  pclient.get_talks();
  pclient.get_workshops();

	console.log('Bot Ready!');

  /* tell the team we are UP and running */
  dclient.channels.fetch(botlogs_channel).then(chan => {
    chan.send("I'm ready to rock & roll!")
  })

  /* inform about next talks when about 5 min. to start */
  dclient.channels.fetch(general_channel).then(chan => {
    var today_reminder = []

    setInterval(() => {
      if (pclient.ready == READY && today_reminder.length == 0)
        today_reminder = pclient.get_today()
      else if (pclient.ready != READY)
        return

      let now = new Date()
                //new Date("2020-12-05T12:56:10-06:00")

      today_reminder.forEach((i, n) => {
        let s = new Date(i.slot.start)

        /* are we in the same day and month? */
        if (now.getMonth() == s.getMonth() && now.getDate() == s.getDate()) {
          let diff = (s - now)/1000 /* milli */
          if (diff > 0 && diff <= 300) { /* 5 min. or less to talk */
            let speakers = []
            let duration = format_duration(i.duration)

            chan.send(`**En 5 min. comienza!**
_${i.title}_ por ${list_speakers(i)} (${duration}, ${i.submission_type.en})
\`\`\`
${i.abstract}
\`\`\``)
            console.log(`Sent reminder. Removing talk ${i.code} from reminder list.`)
            today_reminder.splice(n,1)
          }
        }
      })
    }, 5 * 1000) // each 30 secs.
  })
});

if (bot_token === undefined) {
  console.error("Missing BOT_TOKEN")
  process.exit(1);
}

dclient.login(bot_token);
dclient.on('message', msg => {
  const help = function(m) {
    return m.channel.send(`
**Quieres saber el schedule?**
_Comandos:_
\`${bot_prefix}list <charlas|talleres>\`:
  Lista de charlas o talleres de hoy.
\`${bot_prefix}now\`:
  Charlas y talleres ahora!
`)
  }

  /* only accept DMs and messages from users */
  if (msg.channel.type !== 'dm' || msg.author.bot) return
  if (!msg.content.startsWith(bot_prefix)) /* message has bot prefix? */
    return help(msg)
  if (pclient.ready !== READY) {
    return msg.channel.send(':sweat_smile: No estoy listo todavia!')
  }

  cmd = msg.content.substr(1).split(' ')
  /* process commands */
  if (cmd[0] == "list" && cmd.length == 2) {
    /* cmd: ?list */
    let type = cmd[1].toLowerCase()

    if (!/^(charlas|talleres)$/.test(type)) {
      return help(msg)
    }
    let today = pclient.sort_results(pclient.get_today())

    if (today.length == 0)
      return msg.channel.send(`:eyes: Uhm, el evento es hoy?
Revisa el schedule: https://cfp.pwnedcr.rocks/pwnedcr/schedule/`)

    msg.channel.send(`:calendar: Lista de ${type} de hoy:`)
    var content = ''
    today.forEach((i) => {
      /* just items that were asked for */
      if (type.startsWith(i.submission_type.en.toLowerCase())) {
        let s = new Date(i.slot.start), e = new Date(i.slot.end),
            speakers = [],
            duration = format_duration(i.duration)

        // fake %02d
        let sm = s.getMinutes() < 10 ? "0" + s.getMinutes(): s.getMinutes()

        content += `**${s.getHours()}:${sm} (${duration})**
        _${i.title}_ por ${list_speakers(i)} (${i.submission_type.en})\n`
      }
    })
    msg.channel.send(content)
  } else if (cmd[0] == "now" && cmd.length == 1) {
    /* cmd: ?now */
    let now = pclient.get_now()

    if (now.length == 0)
      return msg.channel.send(`:zzz: Nada por ahora, ve a preprar el cafe!`)

    msg.channel.send(`:fire: Actividades ahora:`)
    now.forEach((i) => {
      let s = new Date(i.slot.start), e = new Date(i.slot.end)

      // fake %02d
      sm = s.getMinutes() < 10 ? "0" + s.getMinutes(): s.getMinutes()
      msg.channel.send(`
**${s.getHours()}:${sm}** _${i.title}_ por ${list_speakers(i)} (${i.submission_type.en})
\`\`\`
${i.abstract}
\`\`\`
`)
    })

  } else
    help(msg)
})

/** __END__ **/
