/// <reference path="../pb_data/types.d.ts" />

// Send verification email on user registration
onRecordCreateRequest((e) => {
  e.next()

  const locale = e.record.get('locale')
  const appURL = e.app.settings().meta.appURL
  const appName = e.app.settings().meta.appName
  const verificationToken = e.record.newVerificationToken()

  function t(key, lang = 'en') {
    try {
      const record = e.app.findFirstRecordByFilter(
        'email_translations',
        `locale = "${lang}" && key = "${key}"`,
      )
      return record.get('value')
    } catch (err) {
      if (lang !== 'en') {
        return t(key, 'en')
      }
      return key
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <p style="font-family: sans-serif;">${t('hello', locale)}</p>
  <p style="font-family: sans-serif;">${t('verification.please_verify', locale)}</p>
  <p><a style="font-family: sans-serif;" href="${appURL}/a/verify-email?token=${verificationToken}" target="_blank" rel="noopener">${t('verification.subject', locale)}</a></p>
  <p style="font-family: sans-serif;">${appName}</p>
  <br/>
</body>
</html>`

  const message = new MailerMessage({
    from: {
      address: e.app.settings().meta.senderAddress,
      name: e.app.settings().meta.senderName,
    },
    to: [{ address: e.record.email() }],
    subject: t('verification.subject', locale),
    html: html,
  })

  e.app.newMailClient().send(message)
}, 'users')

// Customize password reset email
onMailerRecordPasswordResetSend((e) => {
  const locale = e.record.get('locale')

  function t(key, lang = 'en') {
    try {
      const record = e.app.findFirstRecordByFilter(
        'email_translations',
        `locale = "${lang}" && key = "${key}"`,
      )
      return record.get('value')
    } catch (err) {
      if (lang !== 'en') {
        return t(key, 'en')
      }
      return key
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <p style="font-family: sans-serif;">${t('hello', locale)}</p>
  <p style="font-family: sans-serif;">${t('password_reset.please_reset', locale)}</p>
  <p><a style="font-family: sans-serif;" href="${e.app.settings().meta.appURL}/a/reset-password?token=${e.record.token}" target="_blank" rel="noopener">${t('password_reset.subject', locale)}</a></p>
  <p style="font-family: sans-serif;">${t('password_reset.ignore', locale)}</p>
  <p style="font-family: sans-serif;">${e.app.settings().meta.appName}</p>
  <br/>
</body>
</html>`

  e.message.subject = t('password_reset.subject', locale)
  e.message.html = html
}, false)

// Customize email change confirmation email
onMailerRecordEmailChangeSend((e) => {
  const locale = e.record.get('locale')

  function t(key, lang = 'en') {
    try {
      const record = e.app.findFirstRecordByFilter(
        'email_translations',
        `locale = "${lang}" && key = "${key}"`,
      )
      return record.get('value')
    } catch (err) {
      if (lang !== 'en') {
        return t(key, 'en')
      }
      return key
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <p style="font-family: sans-serif;">${t('hello', locale)}</p>
  <p style="font-family: sans-serif;">${t('email_change.please_confirm', locale)}</p>
  <p><a style="font-family: sans-serif;" href="${e.app.settings().meta.appURL}/a/change-email?token=${e.record.token}" target="_blank" rel="noopener">${t('email_change.subject', locale)}</a></p>
  <p style="font-family: sans-serif;">${t('email_change.ignore', locale)}</p>
  <p style="font-family: sans-serif;">${e.app.settings().meta.appName}</p>
  <br/>
</body>
</html>`

  e.message.subject = t('email_change.subject', locale)
  e.message.html = html
}, false)
