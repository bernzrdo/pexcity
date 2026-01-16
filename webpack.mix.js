const mix = require('laravel-mix')

mix.disableSuccessNotifications()

mix.options({
    manifest: false,
    publicPath: 'public'
})

mix.sass('src/style.scss', 'public/style.css')
mix.ts('src/script.ts', 'public/script.js')