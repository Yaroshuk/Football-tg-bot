/**/
import 'dotenv/config'
import { Telegraf, Scenes, session, Markup } from 'telegraf'
import { start, matches, live } from './scenes'
import { IMyContext } from './types'
import mongoose from 'mongoose'
import { steps } from './middlewares'

mongoose.set('strictQuery', false)

mongoose.connect(process.env.MONGO_URL!, {})

mongoose.connection.on('error', (err) => {
  console.log('DB connection error', err)

  process.exit(1)
})

mongoose.connection.on('open', () => {
  console.log('DB connected')

  main()
})

function main() {
  const bot = new Telegraf<IMyContext>(process.env.TM_TOKEN!)

  const stage = new Scenes.Stage<IMyContext>([start, matches, live])

  bot.use(session())
  bot.use(stage.middleware())
  bot.use(steps)

  bot.start((ctx) => ctx.scene.enter('Start'))
  bot.command('back', async (ctx) => {
    const steps = ctx.session.steps

    if (!steps?.length) {
      await ctx.reply('Дальше нельзя')

      // eslint-disable-next-line no-useless-return
      return
    }

    const step = steps.slice(-1)[0]

    ctx.session.steps = ctx.session.steps?.slice(0, -1)
    if (step.scene) {
      ctx.scene.enter(step.scene)
      return
    }

    ctx.scene.leave()
  })

  bot.hears('Расписание матчей', (ctx) => ctx.scene.enter('Matches'))
  bot.hears('Лайв матчи', (ctx) => ctx.scene.enter('Live'))

  bot.hears('Сделать ставку', (ctx) =>
    ctx.reply(
      'Делай ставки на лучшем лицензионно букмекере:',
      Markup.inlineKeyboard([[Markup.button.url('Сделать ставку', 'https://www.pari.ru/', false)]])
    )
  )

  bot.catch((error: any) => {
    console.log('GLOBAL ERROR', error)
  })

  bot.launch()
}
