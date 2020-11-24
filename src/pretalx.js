'use strict';

const READY = 2
const https = require('https');

class Client {
  /**
   * @param {opts} [options] Options for the Pretalx client
   */
  constructor(opts = {}){
    this.ready = 0
    this.talks = this.workshops = this.conf = {};
    this.conf.base_url = opts.base_url || "";
    this.conf.event = opts.event || "";
    this.conf.types = {
      talks: 1,
      workshops: 2
    }
  }

  /**
   * GET data from the Pretalx API
   * @returns {Promise<string>}
   */
  _get_data = (url) => {
    return new Promise( (resolve) => {
      let ret   = ''
      const con = url.split('/')
      const req = https.request({
        method: 'GET',
        hostname: con[2],
        port: (con[0] == "https:" ? 443 : 80),
        path: '/' + (con.length > 3 ? con.slice(3).join('/') : '')
      }, (res) => {
        res.on('data', (data) => { ret += data })
        res.on('end', () => { resolve(ret) })
      })
      req.on('error', (err) => { console.error(err) })
      req.end()
    })
  }

  /**
   * return the API url to be used
   * @returns {string}
   */
  build_url = () => {
    return `${this.conf.base_url}/${this.conf.event}`
  }

  /**
   * retrieve workshops in JSON mode
   * @returns {array}
   */
  get_workshops = async () => {
    let workshops = await this._get_data(
      `${this.build_url()}/talks/?submission_type=${this.conf.types.workshops}&state=confirmed`)

    if (workshops === null)
      return this.workshops = {count:0, error: "Error getting workshops"}
    this.ready += 1
    return this.workshops = JSON.parse(workshops)
  }

  /**
   * retrieve talks in JSON mode
   * @returns {array}
   */
  get_talks = async () => {
    let talks = await this._get_data(
      `${this.build_url()}/talks/?submission_type=${this.conf.types.talks}&state=confirmed`)

    if (talks === null)
      return this.talks = {count:0, error: "Error getting talks"}
    this.ready += 1
    return this.talks = JSON.parse(talks)
  }

  /**
   * get the current talks & workshops
   * @returns {array}
   */
  get_now = () => {
    let now = Date.now(),
          //new Date("2020-12-05T10:12:34-06:00"),
        all = [].concat(this.workshops.results, this.talks.results),
        ret = []

    if (this.ready !== READY) return ret
    all.forEach((item) => {
      let s = Date.parse(item.slot.start), e = Date.parse(item.slot.end)
      if (now > s && now < e)
        ret.push(item)
    })

    return ret
  }

  /**
   * get the talks & workshops today
   * @returns {array}
   */
  get_today = () => {
    let now = new Date(),
          //new Date("2020-12-05T10:00:34-06:00"),
        all = [].concat(this.workshops.results, this.talks.results),
        ret = []

    if (this.ready !== READY) return ret
    all.forEach((item) => {
      let s = new Date(item.slot.start)
      if (now.getDate() == s.getDate())
        ret.push(item)
    })

    return ret
  }

  /**
   * sort elements by starting time
   * @param {array} [r] event items to sort
   * @returns {array}
   */
  sort_results = (r) => {
    return r.sort((a,b) => {
      return Date.parse(a.slot.start) - Date.parse(b.slot.start)
    })
  }

  /**
   * print all the config
   * @returns {void}
   */
  print_conf = () => { console.log(this.conf) }
}

exports.Client = Client
